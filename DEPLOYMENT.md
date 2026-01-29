# 🚀 部署指南 - GitHub Pages

## 方法一：透過 GitHub 網頁介面（最簡單）

### 步驟 1: 建立 Repository

1. 前往 [GitHub](https://github.com)
2. 點擊右上角的 `+` → `New repository`
3. 填寫資訊：
   - **Repository name**: `running-route-designer`
   - **Description**: `Design running routes in text shapes - 設計文字形狀的跑步路線`
   - **Public/Private**: 選擇 `Public`（GitHub Pages 免費版需要 public repo）
   - **勾選**: `Add a README file` (暫時勾選，稍後會替換)
4. 點擊 `Create repository`

### 步驟 2: 上傳檔案

1. 在你的 repository 頁面，點擊 `Add file` → `Upload files`
2. 將以下所有檔案拖曳上傳：
   ```
   running-route-designer/
   ├── index.html
   ├── README.md
   ├── css/
   │   └── style.css
   └── js/
       ├── map.js
       ├── text-to-path.js
       ├── route-planner.js
       ├── gpx-generator.js
       └── app.js
   ```
3. 確保資料夾結構正確
4. 填寫 commit 訊息：`Initial commit - Running Route Designer`
5. 點擊 `Commit changes`

### 步驟 3: 啟用 GitHub Pages

1. 在 repository 頁面，點擊 `Settings`
2. 左側選單找到 `Pages`
3. 在 **Source** 區域：
   - Branch: 選擇 `main`（或 `master`）
   - Folder: 選擇 `/ (root)`
4. 點擊 `Save`
5. 等待 30 秒到 1 分鐘，頁面會顯示你的網站網址

### 步驟 4: 訪問你的網站

你的網站將會在以下網址上線：
```
https://你的使用者名稱.github.io/running-route-designer/
```

例如：`https://aprd.github.io/running-route-designer/`

---

## 方法二：使用 Git 指令（適合熟悉 Git 的使用者）

### 前置要求
- 已安裝 Git
- 有 GitHub 帳號

### 步驟

1. **在 GitHub 建立空的 repository**
   - 前往 GitHub → New repository
   - 名稱：`running-route-designer`
   - **不要**勾選任何初始化選項
   - 建立後會顯示指令

2. **在本地初始化並推送**
   ```bash
   # 進入專案資料夾
   cd running-route-designer
   
   # 初始化 Git
   git init
   
   # 加入所有檔案
   git add .
   
   # 建立第一個 commit
   git commit -m "Initial commit - Running Route Designer"
   
   # 連接到 GitHub（替換成你的使用者名稱）
   git remote add origin https://github.com/你的使用者名稱/running-route-designer.git
   
   # 推送到 GitHub
   git branch -M main
   git push -u origin main
   ```

3. **啟用 GitHub Pages**
   - 前往 repository → Settings → Pages
   - Source: `main` branch, `/ (root)` folder
   - Save

---

## 方法三：使用 GitHub CLI (gh)

如果已安裝 GitHub CLI：

```bash
# 登入 GitHub CLI
gh auth login

# 建立 repository 並推送
cd running-route-designer
git init
git add .
git commit -m "Initial commit - Running Route Designer"
gh repo create running-route-designer --public --source=. --push

# 啟用 GitHub Pages
gh api repos/:owner/running-route-designer/pages \
  -X POST \
  -F source[branch]=main \
  -F source[path]=/
```

---

## 📝 更新 README 中的網址

上線後，記得更新 `README.md` 中的連結：

```markdown
## ✨ 線上使用

直接訪問：[https://你的使用者名稱.github.io/running-route-designer](https://你的使用者名稱.github.io/running-route-designer)
```

---

## 🔧 後續更新

每次修改檔案後，使用以下指令更新網站：

```bash
git add .
git commit -m "描述你的修改"
git push
```

GitHub Pages 會在 1-2 分鐘內自動部署更新。

---

## ⚠️ 常見問題

### Q: 網站顯示 404
**A**: 等待 1-2 分鐘讓 GitHub Pages 完成部署，或檢查 Settings → Pages 是否正確設定。

### Q: CSS/JS 沒有載入
**A**: 確保檔案路徑正確，GitHub Pages 區分大小寫。檢查：
- `css/style.css` 不是 `CSS/style.css`
- `js/app.js` 不是 `JS/app.js`

### Q: 地圖無法顯示
**A**: 開啟瀏覽器的開發者工具（F12）檢查 Console 是否有錯誤訊息。

### Q: 想要自訂網域
**A**: 在 Settings → Pages → Custom domain 設定你的網域。

---

## 🎉 完成！

你的跑步路線設計器現在已經上線！分享網址給朋友試用吧！

需要幫助？開 Issue 或聯絡專案維護者。
