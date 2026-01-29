// GPX 檔案生成模組
class GPXGenerator {
    constructor() {
        this.creator = 'Running Route Designer';
    }

    // 生成 GPX 格式的 XML 字串
    generateGPX(route, metadata = {}) {
        const {
            name = '跑步路線',
            description = '由 Running Route Designer 生成',
            author = 'Running Route Designer'
        } = metadata;

        const timestamp = new Date().toISOString();

        // GPX 標頭
        let gpx = '<?xml version="1.0" encoding="UTF-8"?>\n';
        gpx += '<gpx version="1.1" creator="' + this.creator + '" ';
        gpx += 'xmlns="http://www.topografix.com/GPX/1/1" ';
        gpx += 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ';
        gpx += 'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ';
        gpx += 'http://www.topografix.com/GPX/1/1/gpx.xsd">\n';

        // 元數據
        gpx += '  <metadata>\n';
        gpx += `    <name>${this.escapeXml(name)}</name>\n`;
        gpx += `    <desc>${this.escapeXml(description)}</desc>\n`;
        gpx += `    <author><name>${this.escapeXml(author)}</name></author>\n`;
        gpx += `    <time>${timestamp}</time>\n`;
        gpx += '  </metadata>\n';

        // 路徑 (Track)
        gpx += '  <trk>\n';
        gpx += `    <name>${this.escapeXml(name)}</name>\n`;
        gpx += `    <desc>距離: ${route.distance.toFixed(2)} 公里</desc>\n`;
        gpx += '    <trkseg>\n';

        // 加入所有路徑點
        route.coordinates.forEach((point, index) => {
            // 計算模擬的海拔（可選）
            const elevation = 100; // 預設海拔 100 公尺
            
            // 計算模擬的時間戳記（假設跑步速度 6 min/km）
            const timeOffset = index * 30; // 每個點間隔 30 秒
            const pointTime = new Date(Date.now() + timeOffset * 1000).toISOString();

            gpx += `      <trkpt lat="${point.lat.toFixed(7)}" lon="${point.lng.toFixed(7)}">\n`;
            gpx += `        <ele>${elevation}</ele>\n`;
            gpx += `        <time>${pointTime}</time>\n`;
            gpx += '      </trkpt>\n';
        });

        gpx += '    </trkseg>\n';
        gpx += '  </trk>\n';

        // 加入起點和終點的航點 (Waypoints)
        if (route.coordinates.length > 0) {
            const startPoint = route.coordinates[0];
            const endPoint = route.coordinates[route.coordinates.length - 1];

            gpx += '  <wpt lat="' + startPoint.lat.toFixed(7) + '" lon="' + startPoint.lng.toFixed(7) + '">\n';
            gpx += '    <name>起點</name>\n';
            gpx += '    <sym>Flag, Green</sym>\n';
            gpx += '  </wpt>\n';

            gpx += '  <wpt lat="' + endPoint.lat.toFixed(7) + '" lon="' + endPoint.lng.toFixed(7) + '">\n';
            gpx += '    <name>終點</name>\n';
            gpx += '    <sym>Flag, Red</sym>\n';
            gpx += '  </wpt>\n';
        }

        gpx += '</gpx>';

        return gpx;
    }

    // 下載 GPX 檔案
    downloadGPX(route, filename = 'running-route.gpx', metadata = {}) {
        const gpxContent = this.generateGPX(route, metadata);
        
        // 建立 Blob
        const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
        
        // 建立下載連結
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        // 觸發下載
        document.body.appendChild(link);
        link.click();
        
        // 清理
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log(`GPX 檔案已下載: ${filename}`);
    }

    // 轉義 XML 特殊字元
    escapeXml(unsafe) {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    // 驗證路線資料
    validateRoute(route) {
        if (!route || !route.coordinates || route.coordinates.length === 0) {
            throw new Error('無效的路線資料');
        }

        if (!route.distance || route.distance <= 0) {
            throw new Error('路線距離無效');
        }

        return true;
    }
}

// 匯出全域實例
const gpxGenerator = new GPXGenerator();
