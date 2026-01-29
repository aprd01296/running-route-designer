# 🏃‍♂️ Running Route Designer | 跑步路線設計器

一個創新的網頁應用程式，讓你可以設計出文字形狀的跑步路線！

## ✨ 功能特色

- 📍 **地圖選點**：在地圖上點選任意位置作為起點
- ✏️ **文字路線**：輸入想要跑出的文字（如 "2026"、"LOVE"、"RUN"）
- 📏 **距離設定**：自訂路線距離範圍（例如 5-10 公里）
- 🗺️ **即時預覽**：直接在地圖上顯示生成的路線
- 📥 **GPX 下載**：匯出標準 GPX 格式，可匯入任何跑步 App

## 🚀 快速開始

### 線上使用

直接訪問 GitHub Pages：[https://yourusername.github.io/running-route-designer](https://yourusername.github.io/running-route-designer)

### 本地開發

1. Clone 專案：
```bash
git clone https://github.com/yourusername/running-route-designer.git
cd running-route-designer
```

2. 開啟 `index.html`：
   - 直接在瀏覽器開啟檔案
   - 或使用本地伺服器（推薦）：
```bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js
npx serve
```

3. 在瀏覽器開啟 `http://localhost:8000`

## 📖 使用方式

1. **選擇起點**
   - 在地圖上點擊任意位置
   - 該位置將成為路線的起點

2. **設定參數**
   - 輸入想要跑出的文字（最多 10 個字元）
   - 設定距離範圍（建議 5-10 公里）
   - 選擇文字風格（粗體/標準/斜體）

3. **生成路線**
   - 點擊「生成路線」按鈕
   - 等待幾秒鐘，路線將顯示在地圖上

4. **下載 GPX**
   - 如果滿意路線，點擊「下載 GPX 檔案」
   - 將 GPX 檔案匯入你喜愛的跑步 App

## 🛠️ 技術架構

### 前端技術
- **HTML5 / CSS3** - 介面設計
- **JavaScript (ES6+)** - 核心邏輯
- **Leaflet.js** - 互動式地圖
- **OpenStreetMap** - 地圖資料

### 核心模組
- `map.js` - 地圖管理與互動
- `text-to-path.js` - 文字轉座標演算法
- `route-planner.js` - 路線規劃與優化
- `gpx-generator.js` - GPX 檔案生成
- `app.js` - 主應用邏輯

### 演算法說明

#### 1. 文字轉座標
使用 Canvas API 將文字繪製成像素點，然後提取輪廓座標：
```javascript
// 1. 在 Canvas 上繪製文字
// 2. 掃描像素資料提取輪廓點
// 3. 優化點集合（移除冗余點）
```

#### 2. 地理轉換
將畫布座標轉換為真實的地理座標：
```javascript
// 1. 正規化座標到 -0.5 ~ 0.5
// 2. 根據目標距離計算縮放比例
// 3. 轉換為經緯度偏移
```

#### 3. 路徑規劃
建立連續的可跑路線：
```javascript
// 1. 使用最近鄰演算法連接點
// 2. 縮放到目標距離範圍
// 3. 平滑路線以提升跑步體驗
```

## 📁 專案結構

```
running-route-designer/
├── index.html              # 主頁面
├── css/
│   └── style.css          # 樣式表
├── js/
│   ├── map.js             # 地圖管理
│   ├── text-to-path.js    # 文字轉路徑
│   ├── route-planner.js   # 路線規劃
│   ├── gpx-generator.js   # GPX 生成
│   └── app.js             # 主應用
└── README.md              # 說明文件
```

## 🎯 使用案例

### 慶祝活動
- 生日：跑出年份 "2026"
- 紀念日：跑出 "LOVE"
- 馬拉松：跑出 "42K"

### 創意挑戰
- 跑出你的名字縮寫
- 跑出公司 Logo 字母
- 跑出鼓勵的話語 "RUN"

### 團體活動
- 團隊建設活動
- 慈善募款路跑
- 社群挑戰賽

## 🔧 進階功能（未來計畫）

- [ ] 整合真實道路路由 API (OSRM)
- [ ] 支援多段文字（組合路線）
- [ ] 路線難度評估（爬升、路面類型）
- [ ] 社群分享功能
- [ ] 路線收藏與歷史記錄
- [ ] 行動版 App 支援

## 📱 相容性

- ✅ Chrome / Edge (推薦)
- ✅ Firefox
- ✅ Safari
- ✅ 行動裝置瀏覽器

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

### 開發指南
1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE) 檔案

## 👨‍💻 作者

由跑步愛好者為跑步愛好者打造 ❤️

## 🙏 致謝

- [Leaflet.js](https://leafletjs.com/) - 優秀的地圖庫
- [OpenStreetMap](https://www.openstreetmap.org/) - 開放地圖資料
- 所有貢獻者和使用者

## 📮 聯絡方式

有任何問題或建議？歡迎開 Issue 或聯絡我們！

---

**開始設計你的專屬跑步路線吧！🏃‍♀️💨**
