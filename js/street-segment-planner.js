// 街道片段路線規劃器 - 使用「火柴棒」概念
class StreetSegmentPlanner {
    constructor() {
        this.overpassApiUrl = 'https://overpass-api.de/api/interpreter';
        this.osrmApiUrl = 'https://router.project-osrm.org/route/v1/foot/';
        
        // 街道片段集合
        this.streetSegments = [];
        
        // 數字和字母的火柴棒定義（7段顯示器風格）
        this.segmentPatterns = this.initializeSegmentPatterns();
    }

    // 初始化字符的片段模式定義
    initializeSegmentPatterns() {
        // 使用 7 段顯示器的概念
        // 每個字符由一組方向片段組成
        return {
            '0': ['top', 'top-right', 'bottom-right', 'bottom', 'bottom-left', 'top-left'],
            '1': ['top-right', 'bottom-right'],
            '2': ['top', 'top-right', 'middle', 'bottom-left', 'bottom'],
            '3': ['top', 'top-right', 'middle', 'bottom-right', 'bottom'],
            '4': ['top-left', 'middle', 'top-right', 'bottom-right'],
            '5': ['top', 'top-left', 'middle', 'bottom-right', 'bottom'],
            '6': ['top', 'top-left', 'middle', 'bottom-left', 'bottom', 'bottom-right'],
            '7': ['top', 'top-right', 'bottom-right'],
            '8': ['top', 'top-left', 'top-right', 'middle', 'bottom-left', 'bottom-right', 'bottom'],
            '9': ['top', 'top-left', 'top-right', 'middle', 'bottom-right', 'bottom'],
            
            // 可以擴展支持字母
            'A': ['top', 'top-left', 'top-right', 'middle', 'bottom-left', 'bottom-right'],
            'P': ['top', 'top-left', 'top-right', 'middle', 'bottom-left'],
            'R': ['top', 'top-left', 'top-right', 'middle', 'bottom-left', 'diagonal'],
            // ... 其他字母
        };
    }

    // 主要函數：生成街道路線
    async generateStreetRoute(text, centerLat, centerLng, minDistance, maxDistance) {
        console.log(`開始生成街道路線: "${text}"`);
        
        try {
            // 步驟 1: 搜尋附近的街道網絡
            const radius = this.calculateSearchRadius(minDistance, maxDistance);
            const streets = await this.fetchNearbyStreets(centerLat, centerLng, radius);
            console.log(`找到 ${streets.length} 條街道`);
            
            // 步驟 2: 分析街道方向和長度，建立片段庫
            const segments = this.categorizeStreetSegments(streets, centerLat, centerLng);
            console.log(`分類出 ${segments.length} 個可用片段`);
            
            // 步驟 3: 根據文字內容選擇需要的片段組合
            const selectedSegments = this.selectSegmentsForText(text, segments);
            console.log(`選擇了 ${selectedSegments.length} 個片段來組成文字`);
            
            if (selectedSegments.length === 0) {
                throw new Error('找不到適合的街道片段來組成文字');
            }
            
            // 步驟 4: 規劃一筆畫路徑（允許折返）
            const continuousPath = await this.planContinuousPath(selectedSegments);
            console.log(`規劃的連續路徑包含 ${continuousPath.length} 個點`);
            
            if (!continuousPath || continuousPath.length === 0) {
                throw new Error('無法規劃連續路徑');
            }
            
            // 步驟 5: 調整路徑以符合目標距離
            const finalRoute = await this.adjustRouteDistance(
                continuousPath, 
                minDistance, 
                maxDistance
            );
            
            if (!finalRoute || finalRoute.length === 0) {
                throw new Error('路徑調整失敗');
            }
            
            return {
                coordinates: finalRoute,
                distance: this.calculateTotalDistance(finalRoute),
                segments: selectedSegments.length
            };
            
        } catch (error) {
            console.error('生成路線時發生錯誤:', error);
            throw error;
        }
    }

    // 計算搜尋半徑
    calculateSearchRadius(minDistance, maxDistance) {
        // 根據目標距離計算合適的搜尋範圍
        const avgDistance = (minDistance + maxDistance) / 2;
        // 優化：限制最大搜索半徑為 3km，減少 API 負載
        const calculatedRadius = avgDistance * 200; // 減少倍數從 250 到 200
        return Math.min(3000, Math.max(500, calculatedRadius)); // 以米為單位，最大 3km
    }

    // 從 Overpass API 獲取附近街道（帶重試機制）
    async fetchNearbyStreets(lat, lng, radius) {
        // 簡化查詢：只搜索主要道路類型，減少 API 負載
        const query = `
            [out:json][timeout:30];
            (
                way["highway"~"^(residential|tertiary|secondary|living_street)$"]
                (around:${radius},${lat},${lng});
            );
            out geom;
        `;

        console.log(`正在搜索半徑 ${radius}m 內的街道...`);

        // 重試機制：最多嘗試 3 次
        const maxRetries = 3;
        const retryDelay = 2000; // 2 秒
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`嘗試第 ${attempt} 次查詢...`);
                
                const response = await fetch(this.overpassApiUrl, {
                    method: 'POST',
                    body: query
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Overpass API 錯誤:', response.status, errorText);
                    
                    // 如果是 429 (Too Many Requests) 或 504 (Gateway Timeout)，可以重試
                    if ((response.status === 429 || response.status === 504) && attempt < maxRetries) {
                        console.log(`等待 ${retryDelay}ms 後重試...`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        continue;
                    }
                    
                    throw new Error(`Overpass API 請求失敗: ${response.status}`);
                }

                const data = await response.json();
                console.log(`成功獲取 ${data.elements?.length || 0} 條街道數據`);
                
                if (!data.elements || data.elements.length === 0) {
                    throw new Error('搜索範圍內沒有找到街道數據，請嘗試其他位置');
                }
                
                return data.elements;
                
            } catch (error) {
                console.error(`第 ${attempt} 次嘗試失敗:`, error);
                
                // 如果是最後一次嘗試，拋出錯誤
                if (attempt === maxRetries) {
                    if (error.message.includes('fetch')) {
                        throw new Error('網絡連接失敗，請檢查網絡連接後重試');
                    }
                    throw error;
                }
                
                // 否則等待後重試
                console.log(`等待 ${retryDelay}ms 後重試...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    // 分析並分類街道片段
    categorizeStreetSegments(streets, centerLat, centerLng) {
        const segments = [];
        
        for (const street of streets) {
            if (!street.geometry || street.geometry.length < 2) continue;
            
            // 計算街道的方向和特徵
            const direction = this.calculateStreetDirection(street.geometry);
            const length = this.calculateStreetLength(street.geometry);
            const centerPoint = this.calculateCenterPoint(street.geometry);
            
            // 計算與中心點的距離
            const distanceFromCenter = this.getDistance(
                centerLat, centerLng,
                centerPoint.lat, centerPoint.lng
            );
            
            segments.push({
                id: street.id,
                geometry: street.geometry,
                direction: direction, // 'horizontal', 'vertical', 'diagonal'
                orientation: this.getDetailedOrientation(direction), // 更精確的方向
                length: length,
                centerPoint: centerPoint,
                distanceFromCenter: distanceFromCenter,
                startPoint: street.geometry[0],
                endPoint: street.geometry[street.geometry.length - 1]
            });
        }
        
        // 按距離中心點排序
        segments.sort((a, b) => a.distanceFromCenter - b.distanceFromCenter);
        
        return segments;
    }

    // 計算街道方向
    calculateStreetDirection(geometry) {
        const start = geometry[0];
        const end = geometry[geometry.length - 1];
        
        const deltaLat = Math.abs(end.lat - start.lat);
        const deltaLng = Math.abs(end.lng - start.lng);
        
        // 判斷主要方向
        if (deltaLat < deltaLng * 0.3) {
            return 'horizontal'; // 水平
        } else if (deltaLng < deltaLat * 0.3) {
            return 'vertical'; // 垂直
        } else {
            return 'diagonal'; // 對角線
        }
    }

    // 獲取詳細方向（8個方向）
    getDetailedOrientation(direction) {
        // 可以進一步細分為：N, NE, E, SE, S, SW, W, NW
        return direction;
    }

    // 計算街道長度（米）
    calculateStreetLength(geometry) {
        let totalLength = 0;
        for (let i = 1; i < geometry.length; i++) {
            totalLength += this.getDistance(
                geometry[i-1].lat, geometry[i-1].lng,
                geometry[i].lat, geometry[i].lng
            );
        }
        return totalLength;
    }

    // 計算街道中心點
    calculateCenterPoint(geometry) {
        const midIndex = Math.floor(geometry.length / 2);
        return geometry[midIndex];
    }

    // 根據文字選擇街道片段
    selectSegmentsForText(text, availableSegments) {
        const selectedSegments = [];
        const chars = text.split('');
        
        // 計算每個字符需要的空間
        const totalChars = chars.length;
        const charSpacing = 200; // 字符間距（米）
        
        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            const pattern = this.segmentPatterns[char];
            
            if (!pattern) {
                console.warn(`字符 "${char}" 沒有定義的片段模式`);
                continue;
            }
            
            // 為這個字符選擇合適的街道片段
            const charSegments = this.selectSegmentsForCharacter(
                char,
                pattern,
                availableSegments,
                i * charSpacing
            );
            
            selectedSegments.push(...charSegments);
        }
        
        return selectedSegments;
    }

    // 為單個字符選擇街道片段
    selectSegmentsForCharacter(char, pattern, availableSegments, offsetX) {
        const charSegments = [];
        const usedSegmentIds = new Set();
        
        // 定義每個片段位置的相對座標
        const segmentPositions = {
            'top': { x: 0, y: 100, direction: 'horizontal' },
            'top-right': { x: 50, y: 50, direction: 'vertical' },
            'top-left': { x: -50, y: 50, direction: 'vertical' },
            'middle': { x: 0, y: 0, direction: 'horizontal' },
            'bottom-right': { x: 50, y: -50, direction: 'vertical' },
            'bottom-left': { x: -50, y: -50, direction: 'vertical' },
            'bottom': { x: 0, y: -100, direction: 'horizontal' }
        };
        
        for (const segmentName of pattern) {
            const position = segmentPositions[segmentName];
            if (!position) continue;
            
            // 在可用片段中尋找最匹配的街道
            const matchedSegment = this.findBestMatchingStreet(
                position,
                offsetX,
                availableSegments,
                usedSegmentIds
            );
            
            if (matchedSegment) {
                charSegments.push({
                    ...matchedSegment,
                    role: segmentName,
                    character: char
                });
                usedSegmentIds.add(matchedSegment.id);
            }
        }
        
        return charSegments;
    }

    // 尋找最匹配的街道
    findBestMatchingStreet(targetPosition, offsetX, availableSegments, usedSegmentIds) {
        let bestMatch = null;
        let bestScore = Infinity;
        
        for (const segment of availableSegments) {
            // 跳過已使用的片段
            if (usedSegmentIds.has(segment.id)) continue;
            
            // 檢查方向是否匹配
            if (segment.direction !== targetPosition.direction) continue;
            
            // 計算位置匹配分數（距離越近越好）
            const score = Math.abs(segment.centerPoint.lng * 111000 - (targetPosition.x + offsetX)) +
                         Math.abs(segment.centerPoint.lat * 111000 - targetPosition.y);
            
            if (score < bestScore) {
                bestScore = score;
                bestMatch = segment;
            }
        }
        
        return bestMatch;
    }

    // 規劃連續路徑（一筆畫，允許折返）
    async planContinuousPath(segments) {
        if (segments.length === 0) return [];
        
        console.log('規劃一筆畫路徑...');
        
        // 使用貪婪算法連接所有片段
        const path = [];
        const visited = new Set();
        
        // 從第一個片段開始
        let currentSegment = segments[0];
        path.push(...currentSegment.geometry);
        visited.add(currentSegment.id);
        
        while (visited.size < segments.length) {
            // 找到最近的未訪問片段
            let nearestSegment = null;
            let minDistance = Infinity;
            
            for (const segment of segments) {
                if (visited.has(segment.id)) continue;
                
                const distance = this.getDistance(
                    path[path.length - 1].lat,
                    path[path.length - 1].lng,
                    segment.startPoint.lat,
                    segment.startPoint.lng
                );
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestSegment = segment;
                }
            }
            
            if (!nearestSegment) break;
            
            // 使用 OSRM 連接當前位置到下一個片段
            const connectionPath = await this.getRouteBetween(
                path[path.length - 1],
                nearestSegment.startPoint
            );
            
            if (connectionPath) {
                path.push(...connectionPath);
            }
            
            // 添加片段
            path.push(...nearestSegment.geometry);
            visited.add(nearestSegment.id);
        }
        
        return path;
    }

    // 使用 OSRM 獲取兩點之間的路徑
    async getRouteBetween(start, end) {
        try {
            const coordinates = `${start.lng},${start.lat};${end.lng},${end.lat}`;
            const url = `${this.osrmApiUrl}${coordinates}?overview=full&geometries=geojson`;
            
            const response = await fetch(url);
            if (!response.ok) return null;
            
            const data = await response.json();
            if (!data.routes || data.routes.length === 0) return null;
            
            // 轉換 GeoJSON 座標為我們的格式
            return data.routes[0].geometry.coordinates.map(coord => ({
                lat: coord[1],
                lng: coord[0]
            }));
            
        } catch (error) {
            console.error('OSRM 路徑規劃失敗:', error);
            return null;
        }
    }

    // 調整路徑距離
    async adjustRouteDistance(path, minDistance, maxDistance) {
        const currentDistance = this.calculateTotalDistance(path);
        const targetDistance = (minDistance + maxDistance) / 2;
        
        console.log(`當前距離: ${currentDistance.toFixed(2)} km, 目標: ${targetDistance.toFixed(2)} km`);
        
        if (currentDistance < minDistance) {
            // 距離不足，需要延長路徑
            return await this.extendPath(path, minDistance);
        } else if (currentDistance > maxDistance) {
            // 距離過長，需要簡化路徑
            return this.simplifyPath(path, maxDistance);
        }
        
        return path;
    }

    // 延長路徑
    async extendPath(path, targetDistance) {
        const extended = [...path];
        
        // 檢查路徑是否為空
        if (!extended || extended.length === 0) {
            console.error('路徑為空，無法延長');
            return extended;
        }
        
        let currentDistance = this.calculateTotalDistance(extended);
        const neededDistance = targetDistance - currentDistance;
        
        console.log(`需要延長路徑 ${neededDistance.toFixed(2)} km`);
        
        if (neededDistance <= 0.1) return extended; // 差距小於 100 米，不需要延長
        
        // 策略：在路徑末端添加來回繞行
        const lastPoint = extended[extended.length - 1];
        
        // 檢查最後一點是否有效
        if (!lastPoint || typeof lastPoint.lat !== 'number' || typeof lastPoint.lng !== 'number') {
            console.error('最後一點無效:', lastPoint);
            return extended;
        }
        
        const extensionDistance = neededDistance / 2; // 來回距離
        
        // 找一個附近的點作為繞行目標
        const targetPoint = this.findExtensionPoint(lastPoint, extensionDistance);
        
        if (targetPoint) {
            try {
                // 去程
                const outboundPath = await this.getRouteBetween(lastPoint, targetPoint);
                if (outboundPath) {
                    extended.push(...outboundPath);
                    
                    // 回程
                    const returnPath = await this.getRouteBetween(targetPoint, lastPoint);
                    if (returnPath) {
                        extended.push(...returnPath);
                    }
                }
            } catch (error) {
                console.error('延長路徑時發生錯誤:', error);
            }
        }
        
        return extended;
    }
    
    // 找到延長路徑的目標點
    findExtensionPoint(startPoint, distance) {
        // 在東、西、南、北四個方向尋找合適的點
        const directions = [
            { lat: distance / 111, lng: 0 },  // 北
            { lat: -distance / 111, lng: 0 }, // 南
            { lat: 0, lng: distance / (111 * Math.cos(startPoint.lat * Math.PI / 180)) }, // 東
            { lat: 0, lng: -distance / (111 * Math.cos(startPoint.lat * Math.PI / 180)) } // 西
        ];
        
        // 隨機選擇一個方向
        const direction = directions[Math.floor(Math.random() * directions.length)];
        
        return {
            lat: startPoint.lat + direction.lat,
            lng: startPoint.lng + direction.lng
        };
    }

    // 簡化路徑
    simplifyPath(path, maxDistance) {
        let simplified = [...path];
        let currentDistance = this.calculateTotalDistance(simplified);
        
        console.log(`需要縮短路徑 ${(currentDistance - maxDistance).toFixed(2)} km`);
        
        // 逐步增加簡化容差，直到距離符合要求
        let tolerance = 0.00001;
        const maxTolerance = 0.001;
        
        while (currentDistance > maxDistance && tolerance < maxTolerance) {
            simplified = this.douglasPeucker(path, tolerance);
            currentDistance = this.calculateTotalDistance(simplified);
            tolerance *= 1.5; // 逐步增加容差
        }
        
        return simplified;
    }

    // Douglas-Peucker 簡化算法
    douglasPeucker(points, tolerance) {
        if (points.length <= 2) return points;
        
        // 找到距離首尾連線最遠的點
        let maxDistance = 0;
        let maxIndex = 0;
        
        const start = points[0];
        const end = points[points.length - 1];
        
        for (let i = 1; i < points.length - 1; i++) {
            const distance = this.perpendicularDistance(points[i], start, end);
            if (distance > maxDistance) {
                maxDistance = distance;
                maxIndex = i;
            }
        }
        
        // 如果最大距離大於容差，遞歸分割
        if (maxDistance > tolerance) {
            const left = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
            const right = this.douglasPeucker(points.slice(maxIndex), tolerance);
            
            // 合併結果（移除重複的中間點）
            return [...left.slice(0, -1), ...right];
        } else {
            // 距離小於容差，只保留首尾點
            return [start, end];
        }
    }
    
    // 計算點到線段的垂直距離
    perpendicularDistance(point, lineStart, lineEnd) {
        const dx = lineEnd.lng - lineStart.lng;
        const dy = lineEnd.lat - lineStart.lat;
        
        // 線段長度
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag === 0) return this.getDistance(point.lat, point.lng, lineStart.lat, lineStart.lng);
        
        // 計算垂直距離
        const u = ((point.lng - lineStart.lng) * dx + (point.lat - lineStart.lat) * dy) / (mag * mag);
        
        let closestPoint;
        if (u < 0) {
            closestPoint = lineStart;
        } else if (u > 1) {
            closestPoint = lineEnd;
        } else {
            closestPoint = {
                lat: lineStart.lat + u * dy,
                lng: lineStart.lng + u * dx
            };
        }
        
        return this.getDistance(point.lat, point.lng, closestPoint.lat, closestPoint.lng);
    }

    // 計算總距離（公里）
    calculateTotalDistance(path) {
        let total = 0;
        for (let i = 1; i < path.length; i++) {
            total += this.getDistance(
                path[i-1].lat, path[i-1].lng,
                path[i].lat, path[i].lng
            );
        }
        return total;
    }

    // 計算兩點之間距離（公里）
    getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // 地球半徑（公里）
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                 Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                 Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreetSegmentPlanner;
}
