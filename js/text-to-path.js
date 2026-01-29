// 文字轉路徑模組
class TextToPath {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    // 將文字轉換為座標點陣列（優化版本）
    textToCoordinates(text, options = {}) {
        const {
            fontSize = 200,
            fontFamily = 'Arial',
            fontWeight = 'bold',
            samplingDensity = 3 // 取樣密度（越小點越密集）
        } = options;

        // 設定畫布大小
        this.canvas.width = 1000;
        this.canvas.height = 400;

        // 清空畫布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 設定字體
        this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        this.ctx.fillStyle = 'black';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // 繪製文字
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

        // 取得像素資料
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const pixels = imageData.data;

        // 提取文字輪廓點（優化：只提取邊緣點）
        const points = [];
        for (let y = 0; y < this.canvas.height; y += samplingDensity) {
            for (let x = 0; x < this.canvas.width; x += samplingDensity) {
                const index = (y * this.canvas.width + x) * 4;
                const alpha = pixels[index + 3];
                
                // 如果像素不透明，檢查是否為邊緣點
                if (alpha > 128) {
                    if (this.isEdgePixel(pixels, x, y, this.canvas.width, this.canvas.height)) {
                        points.push({ x, y });
                    }
                }
            }
        }

        // 如果邊緣點太少，回退到全部點
        if (points.length < 20) {
            return this.extractAllPoints(pixels, this.canvas.width, this.canvas.height, samplingDensity);
        }

        return this.optimizePoints(points);
    }

    // 檢查是否為邊緣像素
    isEdgePixel(pixels, x, y, width, height) {
        // 檢查周圍 8 個像素
        const directions = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0],           [1, 0],
            [-1, 1],  [0, 1],  [1, 1]
        ];

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
                return true; // 邊界視為邊緣
            }

            const index = (ny * width + nx) * 4;
            const alpha = pixels[index + 3];
            
            if (alpha <= 128) {
                return true; // 相鄰有透明像素，這是邊緣
            }
        }

        return false; // 內部點
    }

    // 提取所有點（回退方法）
    extractAllPoints(pixels, width, height, samplingDensity) {
        const points = [];
        for (let y = 0; y < height; y += samplingDensity) {
            for (let x = 0; x < width; x += samplingDensity) {
                const index = (y * width + x) * 4;
                const alpha = pixels[index + 3];
                
                if (alpha > 128) {
                    points.push({ x, y });
                }
            }
        }
        return this.optimizePoints(points);
    }

    // 優化點集合，使用更智能的分布策略
    optimizePoints(points, targetCount = 50) {
        if (points.length === 0) return [];
        if (points.length <= targetCount) return points;

        // 使用均勻取樣來保持形狀
        const step = Math.floor(points.length / targetCount);
        const optimized = [];
        
        for (let i = 0; i < points.length; i += step) {
            optimized.push(points[i]);
        }
        
        // 確保包含最後一個點來閉合路徑
        if (optimized[optimized.length - 1] !== points[points.length - 1]) {
            optimized.push(points[points.length - 1]);
        }
        
        return optimized;
    }

    // 使用聚類來選擇代表性點
    clusterPoints(points, clusterCount = 30) {
        if (points.length <= clusterCount) return points;

        // 簡單的 K-means 聚類
        const clusters = [];
        const step = Math.floor(points.length / clusterCount);

        // 初始化聚類中心
        for (let i = 0; i < points.length; i += step) {
            clusters.push({
                center: { ...points[i] },
                members: []
            });
        }

        // 分配點到最近的聚類
        points.forEach(point => {
            let minDist = Infinity;
            let nearestCluster = clusters[0];

            clusters.forEach(cluster => {
                const dist = Math.sqrt(
                    Math.pow(point.x - cluster.center.x, 2) +
                    Math.pow(point.y - cluster.center.y, 2)
                );
                if (dist < minDist) {
                    minDist = dist;
                    nearestCluster = cluster;
                }
            });

            nearestCluster.members.push(point);
        });

        // 返回每個聚類的中心點
        return clusters
            .filter(cluster => cluster.members.length > 0)
            .map(cluster => cluster.center);
    }

    // 將畫布座標轉換為地理座標
    canvasToGeoCoordinates(canvasPoints, centerLat, centerLng, targetDistance) {
        if (canvasPoints.length === 0) return [];

        // 找到畫布邊界
        const minX = Math.min(...canvasPoints.map(p => p.x));
        const maxX = Math.max(...canvasPoints.map(p => p.x));
        const minY = Math.min(...canvasPoints.map(p => p.y));
        const maxY = Math.max(...canvasPoints.map(p => p.y));

        const canvasWidth = maxX - minX;
        const canvasHeight = maxY - minY;

        // 計算縮放比例（假設目標距離為路線的寬度）
        // 1 度緯度 ≈ 111 km
        const scaleFactor = (targetDistance / 111) / canvasWidth * 1000;

        // 將座標轉換為相對於中心點的偏移
        const geoPoints = canvasPoints.map(point => {
            // 正規化到 -0.5 到 0.5
            const normalizedX = (point.x - minX) / canvasWidth - 0.5;
            const normalizedY = (point.y - minY) / canvasHeight - 0.5;

            // 轉換為經緯度偏移
            const latOffset = -normalizedY * scaleFactor; // Y 軸反轉
            const lngOffset = normalizedX * scaleFactor / Math.cos(centerLat * Math.PI / 180);

            return {
                lat: centerLat + latOffset,
                lng: centerLng + lngOffset
            };
        });

        return geoPoints;
    }

    // 建立連續路徑（優化版本：更好的點連接策略）
    createContinuousPath(points) {
        if (points.length === 0) return [];
        if (points.length === 1) return points;

        // 策略：根據Y座標排序，從上到下、左到右掃描
        // 這樣可以創建更自然的文字描繪路徑
        const sortedPoints = [...points].sort((a, b) => {
            // 先按 Y 排序（從上到下）
            if (Math.abs(a.lat - b.lat) > 0.0001) {
                return b.lat - a.lat; // Y 軸反轉
            }
            // Y 相近時按 X 排序（從左到右）
            return a.lng - b.lng;
        });

        // 使用改進的最近鄰算法，避免跳躍過大
        const path = [sortedPoints[0]];
        const remaining = [...sortedPoints.slice(1)];
        const maxJumpDistance = 0.01; // 最大跳躍距離（經緯度）

        while (remaining.length > 0) {
            const lastPoint = path[path.length - 1];
            let nearestIndex = 0;
            let minDistance = Infinity;

            // 找到最近的點，但優先考慮附近的點
            for (let i = 0; i < remaining.length; i++) {
                const distance = Math.sqrt(
                    Math.pow(remaining[i].lat - lastPoint.lat, 2) +
                    Math.pow(remaining[i].lng - lastPoint.lng, 2)
                );

                // 如果距離很近，立即選擇
                if (distance < maxJumpDistance && distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = i;
                }
                // 否則找最近的點
                else if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = i;
                }
            }

            path.push(remaining[nearestIndex]);
            remaining.splice(nearestIndex, 1);
        }

        // 閉合路徑（連回起點）
        path.push(path[0]);

        return path;
    }

    // 平滑路徑（減少鋸齒）
    smoothPath(points, iterations = 1) {
        if (points.length < 3) return points;

        let smoothed = [...points];

        for (let iter = 0; iter < iterations; iter++) {
            const newPoints = [smoothed[0]]; // 保持起點

            for (let i = 1; i < smoothed.length - 1; i++) {
                const prev = smoothed[i - 1];
                const curr = smoothed[i];
                const next = smoothed[i + 1];

                // 使用加權平均平滑
                newPoints.push({
                    lat: (prev.lat + curr.lat * 2 + next.lat) / 4,
                    lng: (prev.lng + curr.lng * 2 + next.lng) / 4
                });
            }

            newPoints.push(smoothed[smoothed.length - 1]); // 保持終點
            smoothed = newPoints;
        }

        return smoothed;
    }

    // 主要函數：文字轉地理路徑（優化版本）
    generateTextRoute(text, centerLat, centerLng, targetDistance, options = {}) {
        console.log(`生成文字路線: "${text}" at (${centerLat}, ${centerLng})`);

        // 1. 將文字轉換為畫布座標
        const canvasPoints = this.textToCoordinates(text, options);
        console.log(`提取了 ${canvasPoints.length} 個畫布點`);

        if (canvasPoints.length === 0) {
            throw new Error('無法從文字中提取路徑點');
        }

        // 2. 轉換為地理座標
        const geoPoints = this.canvasToGeoCoordinates(
            canvasPoints, 
            centerLat, 
            centerLng, 
            targetDistance
        );
        console.log(`轉換為 ${geoPoints.length} 個地理座標點`);

        // 3. 建立連續路徑
        const continuousPath = this.createContinuousPath(geoPoints);
        console.log(`建立了 ${continuousPath.length} 個點的連續路徑`);

        // 4. 平滑路徑
        const smoothedPath = this.smoothPath(continuousPath, 1);
        console.log(`平滑後路徑有 ${smoothedPath.length} 個點`);

        return smoothedPath;
    }
}

// 匯出全域實例
const textToPath = new TextToPath();
