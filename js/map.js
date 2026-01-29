// 地圖管理模組
class MapManager {
    constructor() {
        this.map = null;
        this.selectedLocation = null;
        this.marker = null;
        this.routeLayer = null;
        this.searchRadius = 1000; // 1km 搜尋半徑
    }

    initialize(elementId = 'map') {
        // 初始化地圖，預設台北市中心
        this.map = L.map(elementId).setView([25.0330, 121.5654], 13);

        // 加入 OpenStreetMap 圖層
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(this.map);

        // 加入點擊事件監聽器
        this.map.on('click', (e) => this.onMapClick(e));

        // 初始化路線圖層
        this.routeLayer = L.layerGroup().addTo(this.map);

        return this.map;
    }

    onMapClick(e) {
        const { lat, lng } = e.latlng;
        this.setSelectedLocation(lat, lng);
    }

    setSelectedLocation(lat, lng) {
        this.selectedLocation = { lat, lng };

        // 移除舊標記
        if (this.marker) {
            this.map.removeLayer(this.marker);
        }

        // 加入新標記
        this.marker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'route-marker',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        }).addTo(this.map);

        // 加入彈出視窗
        this.marker.bindPopup(`
            <b>起點位置</b><br>
            緯度: ${lat.toFixed(6)}<br>
            經度: ${lng.toFixed(6)}
        `).openPopup();

        // 繪製搜尋範圍圓圈
        L.circle([lat, lng], {
            radius: this.searchRadius,
            color: '#667eea',
            fillColor: '#667eea',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 5'
        }).addTo(this.map);

        // 觸發位置選擇事件
        this.triggerLocationSelected(lat, lng);
    }

    triggerLocationSelected(lat, lng) {
        const event = new CustomEvent('locationSelected', {
            detail: { lat, lng }
        });
        document.dispatchEvent(event);
    }

    clearRoute() {
        if (this.routeLayer) {
            this.routeLayer.clearLayers();
        }
    }

    drawRoute(coordinates, color = '#e74c3c', weight = 4) {
        this.clearRoute();

        // 繪製路線
        const polyline = L.polyline(coordinates, {
            color: color,
            weight: weight,
            opacity: 0.8,
            smoothFactor: 1
        }).addTo(this.routeLayer);

        // 加入起點和終點標記
        if (coordinates.length > 0) {
            // 起點（綠色）
            L.circleMarker(coordinates[0], {
                radius: 8,
                fillColor: '#10b981',
                color: 'white',
                weight: 2,
                opacity: 1,
                fillOpacity: 1
            }).addTo(this.routeLayer)
              .bindPopup('起點');

            // 終點（紅色）
            L.circleMarker(coordinates[coordinates.length - 1], {
                radius: 8,
                fillColor: '#ef4444',
                color: 'white',
                weight: 2,
                opacity: 1,
                fillOpacity: 1
            }).addTo(this.routeLayer)
              .bindPopup('終點');
        }

        // 自動調整視圖以顯示整條路線
        this.map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }

    getSelectedLocation() {
        return this.selectedLocation;
    }

    // 計算兩點間的距離（公里）
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // 地球半徑（公里）
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return distance;
    }

    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }
}

// 匯出全域實例
const mapManager = new MapManager();
