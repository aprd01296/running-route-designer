// 文字轉路徑模組
class TextToPath {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    // 將文字轉換為座標點陣列
    textToCoordinates(text, options = {}) {
        const {
            fontSize = 200,
            fontFamily = 'Arial',
            fontWeight = 'bold',
            samplingDensity = 5 // 取樣密度（越小點越密集）
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

        // 提取文字輪廓點
        const points = [];
        for (let y = 0; y < this.canvas.height; y += samplingDensity) {
            for (let x = 0; x < this.canvas.width; x += samplingDensity) {
                const index = (y * this.canvas.width + x) * 4;
                const alpha = pixels[index + 3];
                
                // 如果像素不透明，則為文字區域
                if (alpha > 128) {
                    points.push({ x, y });
                }
            }
        }

        return this.optimizePoints(points);
    }

    // 優化點集合，減少冗余點
    optimizePoints(points, threshold = 10) {
        if (points.length === 0) return [];

        const optimized = [points[0]];
        
        for (let i = 1; i < points.length; i++) {
            const lastPoint = optimized[optimized.length - 1];
            const currentPoint = points[i];
            
            const distance = Math.sqrt(
                Math.pow(currentPoint.x - lastPoint.x, 2) + 
                Math.pow(currentPoint.y - lastPoint.y, 2)
            );
            
            // 只保留距離超過閾值的點
            if (distance > threshold) {
                optimized.push(currentPoint);
            }
        }
        
        return optimized;
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

    // 建立連續路徑（連接所有點）
    createContinuousPath(points) {
        if (points.length === 0) return [];

        // 使用最近鄰演算法來建立連續路徑
        const path = [points[0]];
        const remaining = [...points.slice(1)];

        while (remaining.length > 0) {
            const lastPoint = path[path.length - 1];
            let nearestIndex = 0;
            let minDistance = Infinity;

            // 找到最近的點
            for (let i = 0; i < remaining.length; i++) {
                const distance = Math.sqrt(
                    Math.pow(remaining[i].lat - lastPoint.lat, 2) +
                    Math.pow(remaining[i].lng - lastPoint.lng, 2)
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = i;
                }
            }

            path.push(remaining[nearestIndex]);
            remaining.splice(nearestIndex, 1);
        }

        return path;
    }

    // 主要函數：文字轉地理路徑
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

        return continuousPath;
    }
}

// 匯出全域實例
const textToPath = new TextToPath();
