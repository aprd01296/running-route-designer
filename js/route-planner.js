// 路線規劃模組
class RoutePlanner {
    constructor() {
        this.currentRoute = null;
    }

    // 簡化版路線規劃（不使用外部路由 API）
    async planRoute(textPoints, centerLat, centerLng, minDistance, maxDistance) {
        console.log(`規劃路線: ${textPoints.length} 個點, 目標距離 ${minDistance}-${maxDistance} km`);

        try {
            // 簡化方法：直接使用文字形狀的座標點，並進行適當縮放
            const scaledPoints = this.scalePointsToDistance(
                textPoints, 
                centerLat, 
                centerLng,
                minDistance,
                maxDistance
            );

            // 計算路線總距離
            const totalDistance = this.calculateRouteDistance(scaledPoints);
            console.log(`生成的路線總距離: ${totalDistance.toFixed(2)} km`);

            // 平滑路線
            const smoothedRoute = this.smoothRoute(scaledPoints);

            this.currentRoute = {
                coordinates: smoothedRoute,
                distance: totalDistance,
                points: smoothedRoute.length
            };

            return this.currentRoute;

        } catch (error) {
            console.error('路線規劃失敗:', error);
            throw new Error('無法生成路線，請調整參數後重試');
        }
    }

    // 使用 OSRM 進行道路路徑規劃（進階版本）
    async planRouteWithOSRM(textPoints, centerLat, centerLng, minDistance, maxDistance) {
        console.log('使用 OSRM 進行路徑規劃...');

        try {
            // 選擇代表性的點（不要太多，否則 API 會失敗）
            const sampledPoints = this.samplePoints(textPoints, 25);

            // 建立 OSRM 路徑請求
            const coordinates = sampledPoints.map(p => `${p.lng},${p.lat}`).join(';');
            const url = `https://router.project-osrm.org/route/v1/foot/${coordinates}?overview=full&geometries=geojson`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.code !== 'Ok') {
                throw new Error('OSRM 路徑規劃失敗');
            }

            // 提取路徑座標
            const routeCoords = data.routes[0].geometry.coordinates.map(coord => ({
                lat: coord[1],
                lng: coord[0]
            }));

            const distance = data.routes[0].distance / 1000; // 轉換為公里

            this.currentRoute = {
                coordinates: routeCoords,
                distance: distance,
                points: routeCoords.length
            };

            return this.currentRoute;

        } catch (error) {
            console.error('OSRM 路徑規劃失敗:', error);
            // 回退到簡化方法
            return this.planRoute(textPoints, centerLat, centerLng, minDistance, maxDistance);
        }
    }

    // 縮放點集合以符合目標距離
    scalePointsToDistance(points, centerLat, centerLng, minDistance, maxDistance) {
        const targetDistance = (minDistance + maxDistance) / 2;
        
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
