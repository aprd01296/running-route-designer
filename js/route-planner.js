// 路線規劃模組
class RoutePlanner {
    constructor() {
        this.currentRoute = null;
        this.overpassApiUrl = 'https://overpass-api.de/api/interpreter';
        this.osrmApiUrl = 'https://router.project-osrm.org/route/v1/foot/';
    }

    // 主要路線規劃方法 - 使用真實道路網絡
    async planRoute(textPoints, centerLat, centerLng, minDistance, maxDistance) {
        console.log(`規劃路線: ${textPoints.length} 個點, 目標距離 ${minDistance}-${maxDistance} km`);

        try {
            // 步驟 1: 先確定合適的縮放尺寸
            const targetDistance = (minDistance + maxDistance) / 2;
            const scaledPoints = this.scalePointsToDistance(
                textPoints, 
                centerLat, 
                centerLng,
                targetDistance
            );

            // 步驟 2: 取樣關鍵點（減少到 15-20 個點以提高成功率）
            const keyPoints = this.samplePoints(scaledPoints, 15);
            console.log(`關鍵點數量: ${keyPoints.length}`);

            // 步驟 3: 尋找最近的道路節點
            console.log('正在查詢附近的道路網絡...');
            const roadPoints = await this.findNearestRoads(keyPoints, targetDistance);
            
            if (!roadPoints || roadPoints.length < 3) {
                throw new Error('附近沒有足夠的道路，請選擇城市或有道路的區域');
            }

            console.log(`找到 ${roadPoints.length} 個道路點`);

            // 步驟 4: 使用 OSRM 連接這些道路點
            console.log('正在規劃真實路線...');
            const route = await this.planRouteWithOSRM(roadPoints);

            // 步驟 5: 調整路線距離至目標範圍
            const adjustedRoute = await this.adjustRouteDistance(
                route, 
                minDistance, 
                maxDistance,
                centerLat,
                centerLng
            );

            this.currentRoute = adjustedRoute;
            console.log(`最終路線距離: ${adjustedRoute.distance.toFixed(2)} km`);

            return this.currentRoute;

        } catch (error) {
            console.error('路線規劃失敗:', error);
            throw new Error(`無法生成路線: ${error.message}`);
        }
    }

    // 查詢附近的道路網絡
    async findNearestRoads(points, radius) {
        try {
            // 計算查詢範圍
            const centerLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
            const centerLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
            const radiusInMeters = radius * 1000 / 2; // 使用目標距離的一半作為查詢半徑

            // Overpass API 查詢：獲取附近的道路
            const query = `
                [out:json][timeout:25];
                (
                    way["highway"~"residential|tertiary|secondary|primary|footway|path|cycleway"]
                        (around:${radiusInMeters},${centerLat},${centerLng});
                );
                out geom;
            `;

            const response = await fetch(this.overpassApiUrl, {
                method: 'POST',
                body: query
            });

            if (!response.ok) {
                throw new Error('道路查詢失敗');
            }

            const data = await response.json();
            
            if (!data.elements || data.elements.length === 0) {
                throw new Error('附近沒有找到道路');
            }

            // 提取道路節點
            const roadNodes = [];
            data.elements.forEach(way => {
                if (way.geometry) {
                    way.geometry.forEach(node => {
                        roadNodes.push({
                            lat: node.lat,
                            lng: node.lon
                        });
                    });
                }
            });

            // 為每個文字形狀點找到最近的道路節點
            const mappedPoints = points.map(textPoint => {
                let nearestNode = roadNodes[0];
                let minDistance = this.calculateDistance(
                    textPoint.lat, textPoint.lng,
                    nearestNode.lat, nearestNode.lng
                );

                roadNodes.forEach(roadNode => {
                    const distance = this.calculateDistance(
                        textPoint.lat, textPoint.lng,
                        roadNode.lat, roadNode.lng
                    );
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestNode = roadNode;
                    }
                });

                return nearestNode;
            });

            // 去除重複點
            return this.removeDuplicatePoints(mappedPoints);

        } catch (error) {
            console.error('道路查詢錯誤:', error);
            throw error;
        }
    }

    // 使用 OSRM 連接道路點
    async planRouteWithOSRM(roadPoints) {
        try {
            // 建立 OSRM 路徑請求（使用步行模式）
            const coordinates = roadPoints.map(p => `${p.lng},${p.lat}`).join(';');
            const url = `${this.osrmApiUrl}${coordinates}?overview=full&geometries=geojson&steps=true`;

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('OSRM API 請求失敗');
            }

            const data = await response.json();

            if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
                throw new Error('無法找到連接這些點的路線');
            }

            // 提取路徑座標
            const routeCoords = data.routes[0].geometry.coordinates.map(coord => ({
                lat: coord[1],
                lng: coord[0]
            }));

            const distanceInKm = data.routes[0].distance / 1000; // 轉換為公里
            const durationInMin = data.routes[0].duration / 60; // 轉換為分鐘

            return {
                coordinates: routeCoords,
                distance: distanceInKm,
                duration: durationInMin,
                points: routeCoords.length
            };

        } catch (error) {
            console.error('OSRM 路徑規劃失敗:', error);
            throw error;
        }
    }

    // 調整路線距離至目標範圍
    async adjustRouteDistance(route, minDistance, maxDistance, centerLat, centerLng) {
        const currentDistance = route.distance;
        const targetMin = minDistance;
        const targetMax = maxDistance;

        console.log(`當前距離: ${currentDistance.toFixed(2)} km, 目標: ${targetMin}-${targetMax} km`);

        // 如果距離在範圍內，直接返回
        if (currentDistance >= targetMin && currentDistance <= targetMax) {
            return route;
        }

        // 如果距離太短，嘗試添加繞行
        if (currentDistance < targetMin) {
            console.log('距離太短，嘗試添加繞行路段...');
            return await this.extendRoute(route, targetMin, targetMax, centerLat, centerLng);
        }

        // 如果距離太長，簡化路線
        if (currentDistance > targetMax) {
            console.log('距離太長，簡化路線...');
            return this.simplifyRoute(route, targetMax);
        }

        return route;
    }

    // 延長路線（添加繞行）
    async extendRoute(route, targetMin, targetMax, centerLat, centerLng) {
        try {
            const currentDistance = route.distance;
            const neededDistance = (targetMin + targetMax) / 2 - currentDistance;
            
            // 如果需要的額外距離很小，直接返回
            if (neededDistance < 0.5) {
                return route;
            }

            // 在路線中點附近尋找繞行路徑
            const midIndex = Math.floor(route.coordinates.length / 2);
            const midPoint = route.coordinates[midIndex];

            // 創建一個偏移點來形成繞行
            const detourRadius = neededDistance / 4; // 繞行半徑
            const detourPoint = {
                lat: midPoint.lat + (detourRadius / 111), // 約111km每緯度
                lng: midPoint.lng + (detourRadius / (111 * Math.cos(midPoint.lat * Math.PI / 180)))
            };

            // 建立新的路線：起點 -> 繞行點 -> 終點
            const extendedPoints = [
                route.coordinates[0],
                ...route.coordinates.slice(0, midIndex),
                detourPoint,
                ...route.coordinates.slice(midIndex),
                route.coordinates[route.coordinates.length - 1]
            ];

            // 重新規劃路線
            const sampledExtended = this.samplePoints(extendedPoints, 20);
            const newRoute = await this.planRouteWithOSRM(sampledExtended);

            // 檢查新路線是否在範圍內
            if (newRoute.distance >= targetMin && newRoute.distance <= targetMax) {
                return newRoute;
            }

            // 如果還是不夠，返回原路線（總比沒有好）
            return route;

        } catch (error) {
            console.error('延長路線失敗:', error);
            return route; // 返回原路線
        }
    }

    // 簡化路線
    simplifyRoute(route, targetDistance) {
        const currentDistance = route.distance;
        const ratio = targetDistance / currentDistance;
        
        // 按比例減少點數
        const newPointCount = Math.floor(route.coordinates.length * ratio);
        const simplified = this.samplePoints(route.coordinates, Math.max(newPointCount, 10));

        return {
            coordinates: simplified,
            distance: this.calculateRouteDistance(simplified),
            points: simplified.length
        };
    }

    // 移除重複點
    removeDuplicatePoints(points) {
        const unique = [];
        const seen = new Set();

        points.forEach(point => {
            const key = `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(point);
            }
        });

        return unique;
    }

    // 縮放點集合以符合目標距離
    scalePointsToDistance(points, centerLat, centerLng, targetDistance) {
        
        // 計算當前點的邊界範圍
        const lats = points.map(p => p.lat);
        const lngs = points.map(p => p.lng);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        const currentWidth = this.calculateDistance(
            (minLat + maxLat) / 2, minLng,
            (minLat + maxLat) / 2, maxLng
        );

        // 計算縮放因子
        const scaleFactor = targetDistance / currentWidth;

        // 縮放所有點
        return points.map(point => {
            const latOffset = (point.lat - centerLat) * scaleFactor;
            const lngOffset = (point.lng - centerLng) * scaleFactor;

            return {
                lat: centerLat + latOffset,
                lng: centerLng + lngOffset
            };
        });
    }

    // 取樣點（減少點的數量）
    samplePoints(points, maxPoints) {
        if (points.length <= maxPoints) {
            return points;
        }

        const step = Math.floor(points.length / maxPoints);
        const sampled = [];

        for (let i = 0; i < points.length; i += step) {
            sampled.push(points[i]);
        }

        // 確保包含最後一個點
        if (sampled[sampled.length - 1] !== points[points.length - 1]) {
            sampled.push(points[points.length - 1]);
        }

        return sampled;
    }

    // 計算路線總距離
    calculateRouteDistance(points) {
        let totalDistance = 0;

        for (let i = 0; i < points.length - 1; i++) {
            const distance = this.calculateDistance(
                points[i].lat, points[i].lng,
                points[i + 1].lat, points[i + 1].lng
            );
            totalDistance += distance;
        }

        return totalDistance;
    }

    // 計算兩點間距離（公里）
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // 地球半徑（公里）
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }

    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    // 平滑路線（使用簡單的平均濾波）
    smoothRoute(points, windowSize = 3) {
        if (points.length < windowSize) {
            return points;
        }

        const smoothed = [];
        const halfWindow = Math.floor(windowSize / 2);

        for (let i = 0; i < points.length; i++) {
            if (i < halfWindow || i >= points.length - halfWindow) {
                // 邊界點保持不變
                smoothed.push(points[i]);
            } else {
                // 計算鄰近點的平均值
                let sumLat = 0, sumLng = 0;
                for (let j = i - halfWindow; j <= i + halfWindow; j++) {
                    sumLat += points[j].lat;
                    sumLng += points[j].lng;
                }
                smoothed.push({
                    lat: sumLat / windowSize,
                    lng: sumLng / windowSize
                });
            }
        }

        return smoothed;
    }

    getCurrentRoute() {
        return this.currentRoute;
    }

    clearRoute() {
        this.currentRoute = null;
    }
}

// 匯出全域實例
const routePlanner = new RoutePlanner();
