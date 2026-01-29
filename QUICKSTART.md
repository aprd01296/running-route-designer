# 🚀 快速開始指南

## 📦 檔案清單

確保你有以下所有檔案：

```
running-route-designer/
├── index.html              ✅ 主頁面
├── README.md              ✅ 專案說明
├── DEPLOYMENT.md          ✅ 部署指南
├── LICENSE                ✅ 授權文件
├── css/
│   └── style.css          ✅ 樣式表
└── js/
    ├── map.js             ✅ 地圖管理
    ├── text-to-path.js    ✅ 文字轉路徑
    ├── route-planner.js   ✅ 路線規劃
    ├── gpx-generator.js   ✅ GPX 生成
    └── app.js             ✅ 主程式
```

## 🧪 本地測試

### 方法 1: 直接開啟（最簡單）
雙擊 `index.html` 在瀏覽器中開啟

### 方法 2: 本地伺服器（推薦）

**使用 Python：**
```bash
cd running-route-designer
python -m http.server 8000
# 開啟 http://localhost:8000
```

**使用 Node.js：**
```bash
npx serve
# 開啟顯示的網址
```

**使用 VS Code：**
安裝 "Live Server" 擴充套件，右鍵 index.html → "Open with Live Server"

## 🌐 部署到 GitHub Pages（3 步驟）

### 步驟 1: 建立 Repository
1. 前往 https://github.com/new
2. Repository name: `running-route-designer`
3. 選擇 Public
4. **不要**勾選任何初始化選項
5. Create repository

### 步驟 2: 上傳檔案
在 repository 頁面：
1. 點擊 "uploading an existing file"
2. 拖曳所有檔案和資料夾
3. Commit changes

### 步驟 3: 啟用 GitHub Pages
1. Settings → Pages
2. Source: `main` branch, `/ (root)`
3. Save

✅ **完成！** 你的網站會在 1-2 分鐘內上線
網址：`https://你的使用者名稱.github.io/running-route-designer/`

## 🎯 功能測試清單

測試所有功能是否正常運作：

- [ ] **地圖載入**：頁面開啟後地圖正常顯示
- [ ] **位置選擇**：點擊地圖可以選擇起點
- [ ] **起點標記**：選擇後出現藍色標記和圓圈
- [ ] **文字輸入**：可以輸入文字（試試 "2026"）
- [ ] **距離設定**：可以調整距離範圍（試試 5-10）
- [ ] **生成按鈕**：選擇起點和輸入文字後按鈕啟用
- [ ] **路線生成**：點擊後顯示紅色路線
- [ ] **路線資訊**：顯示距離、點數等資訊
- [ ] **GPX 下載**：可以下載 GPX 檔案
- [ ] **重新設計**：可以清除路線重新開始

## 🐛 常見問題排除

### 問題：地圖無法顯示
**解決方法：**
- 檢查網路連線
- 開啟瀏覽器開發者工具（F12）查看 Console
- 確認 Leaflet CDN 連結正常

### 問題：路線無法生成
**解決方法：**
- 確保已選擇起點（地圖上有藍色標記）
- 確保已輸入文字
- 檢查距離範圍是否合理（建議 5-10 km）
- 嘗試更短的文字（2-4 個字元）

### 問題：GPX 下載失敗
**解決方法：**
- 確保已成功生成路線
- 檢查瀏覽器下載設定
- 嘗試不同的瀏覽器

### 問題：路線形狀不像文字
**調整方法：**
- 使用較短的文字（1-4 字元效果較好）
- 使用數字或大寫英文字母（辨識度高）
- 調整距離範圍（較大的範圍讓形狀更明顯）
- 選擇較空曠的區域作為起點

## 💡 使用技巧

### 最佳實踐
1. **文字選擇**：數字和大寫字母效果最好（如 "2026", "RUN", "GO"）
2. **起點位置**：選擇公園或開闊區域，道路網路較完整
3. **距離設定**：5-10 公里是最理想的範圍
4. **字數限制**：1-4 個字元最容易辨識

### 創意想法
- 🎂 生日：跑出年份 "2026"
- ❤️ 紀念日：跑出 "LOVE"
- 🏃 挑戰：跑出 "42K" 或 "26"
- 🎯 目標：跑出 "GO" 或 "RUN"
- 🎉 慶祝：跑出自己的名字縮寫

## 📱 分享你的路線

生成滿意的路線後：
1. 截圖地圖上的路線
2. 下載 GPX 檔案
3. 分享到社群媒體
4. 標記 #RunningRouteDesigner

## 🔧 進階自訂

想要修改應用程式？

- **改變顏色**：編輯 `css/style.css`
- **調整演算法**：編輯 `js/text-to-path.js` 或 `js/route-planner.js`
- **加入新功能**：編輯 `js/app.js`

## 📞 需要協助？

- 閱讀完整文件：`README.md`
- 查看部署指南：`DEPLOYMENT.md`
- 開啟 Issue 回報問題
- 聯絡專案維護者

---

**準備好了嗎？開始設計你的專屬跑步路線吧！🏃‍♀️💨**
