// 主應用程式邏輯
class App {
    constructor() {
        this.selectedLocation = null;
        this.currentRoute = null;
        this.isGenerating = false;
    }

    initialize() {
        console.log('初始化應用程式...');

        // 初始化地圖
        mapManager.initialize('map');

        // 設定事件監聽器
        this.setupEventListeners();

        console.log('應用程式初始化完成');
    }

    setupEventListeners() {
        // 監聽地圖位置選擇事件
        document.addEventListener('locationSelected', (e) => {
            this.onLocationSelected(e.detail.lat, e.detail.lng);
        });

        // 生成路線按鈕
        const generateBtn = document.getElementById('generate-btn');
        generateBtn.addEventListener('click', () => this.generateRoute());

        // 下載 GPX 按鈕
        const downloadBtn = document.getElementById('download-gpx-btn');
        downloadBtn.addEventListener('click', () => this.downloadGPX());

        // 重設按鈕
        const resetBtn = document.getElementById('reset-btn');
        resetBtn.addEventListener('click', () => this.reset());

        // 監聽輸入變化以啟用/停用生成按鈕
        const routeText = document.getElementById('route-text');
        routeText.addEventListener('input', () => this.validateInputs());
    }

    onLocationSelected(lat, lng) {
        this.selectedLocation = { lat, lng };
        
        // 更新 UI
        const locationInfo = document.getElementById('location-info');
        locationInfo.innerHTML = `
            <strong>已選擇起點</strong><br>
            緯度: ${lat.toFixed(6)}<br>
            經度: ${lng.toFixed(6)}
        `;
        locationInfo.classList.remove('placeholder');

        // 驗證輸入
        this.validateInputs();
    }

    validateInputs() {
        const routeText = document.getElementById('route-text').value.trim();
        const generateBtn = document.getElementById('generate-btn');

        // 檢查是否已選擇位置和輸入文字
        if (this.selectedLocation && routeText.length > 0) {
            generateBtn.disabled = false;
        } else {
            generateBtn.disabled = true;
        }
    }

    async generateRoute() {
        if (this.isGenerating) return;

        try {
            this.isGenerating = true;
            this.showLoading(true);

            // 取得輸入參數
            const routeText = document.getElementById('route-text').value.trim();
            const minDistance = parseFloat(document.getElementById('distance-min').value);
            const maxDistance = parseFloat(document.getElementById('distance-max').value);
            const fontStyle = document.getElementById('font-style').value;

            // 驗證輸入
            if (!routeText) {
                throw new Error('請輸入想要跑出的文字');
            }

            if (minDistance >= maxDistance) {
                throw new Error('最小距離必須小於最大距離');
            }

            console.log(`開始生成路線: "${routeText}", ${minDistance}-${maxDistance} km`);

            // 使用新的街道火柴棒演算法
            const route = await streetSegmentPlanner.generateStreetRoute(
                routeText,
                this.selectedLocation.lat,
                this.selectedLocation.lng,
                minDistance,
                maxDistance
            );

            console.log('生成的路線結構:', route);
            console.log('coordinates 類型:', typeof route.coordinates);
            console.log('是否為陣列:', Array.isArray(route.coordinates));

            // 驗證返回的數據結構
            if (!route || !route.coordinates || !Array.isArray(route.coordinates)) {
                console.error('路線數據結構錯誤:', route);
                throw new Error('路線數據結構不正確');
            }

            // 在地圖上繪製路線
            const coordinates = route.coordinates.map(p => [p.lat, p.lng]);
            mapManager.drawRoute(coordinates);

            // 儲存路線並顯示結果
            this.currentRoute = {
                ...route,
                points: route.coordinates.length
            };
            this.showResult(this.currentRoute, routeText);

            console.log('路線生成成功');

        } catch (error) {
            console.error('生成路線失敗:', error);
            alert('生成路線失敗: ' + error.message);
        } finally {
            this.isGenerating = false;
            this.showLoading(false);
        }
    }

    showResult(route, text) {
        const resultSection = document.getElementById('result-section');
        const routeInfo = document.getElementById('route-info');

        routeInfo.innerHTML = `
            <strong>✅ 路線生成成功！</strong><br><br>
            <strong>文字：</strong>${text}<br>
            <strong>總距離：</strong>${route.distance.toFixed(2)} 公里<br>
            <strong>路徑點數：</strong>${route.points} 個<br>
            <strong>預估時間：</strong>${this.estimateRunningTime(route.distance)}
        `;

        resultSection.style.display = 'block';
    }

    estimateRunningTime(distanceKm) {
        // 假設平均配速 6 分鐘/公里
        const timeMinutes = distanceKm * 6;
        const hours = Math.floor(timeMinutes / 60);
        const minutes = Math.round(timeMinutes % 60);

        if (hours > 0) {
            return `${hours} 小時 ${minutes} 分鐘`;
        } else {
            return `${minutes} 分鐘`;
        }
    }

    downloadGPX() {
        if (!this.currentRoute) {
            alert('請先生成路線');
            return;
        }

        try {
            const routeText = document.getElementById('route-text').value.trim();
            const filename = `running-route-${routeText}-${Date.now()}.gpx`;
            
            const metadata = {
                name: `跑步路線 - ${routeText}`,
                description: `文字: ${routeText}, 距離: ${this.currentRoute.distance.toFixed(2)} km`
            };

            gpxGenerator.downloadGPX(this.currentRoute, filename, metadata);
            
            alert('GPX 檔案下載成功！');
        } catch (error) {
            console.error('下載 GPX 失敗:', error);
            alert('下載 GPX 檔案失敗: ' + error.message);
        }
    }

    reset() {
        // 清除路線
        mapManager.clearRoute();
        routePlanner.clearRoute();
        this.currentRoute = null;

        // 隱藏結果區域
        document.getElementById('result-section').style.display = 'none';

        // 清除輸入（可選）
        // document.getElementById('route-text').value = '';

        console.log('已重設');
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const generateBtn = document.getElementById('generate-btn');

        if (show) {
            loading.classList.remove('hidden');
            generateBtn.disabled = true;
        } else {
            loading.classList.add('hidden');
            generateBtn.disabled = false;
        }
    }
}

// 初始化全域實例
const streetSegmentPlanner = new StreetSegmentPlanner();

// 當 DOM 載入完成後初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.initialize();
});
