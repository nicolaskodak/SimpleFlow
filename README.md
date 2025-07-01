# SimpleFlow 流程圖工具

SimpleFlow 是一個基於 React 和 Vite 開發的簡易流程圖建立工具，讓您可以輕鬆視覺化和管理您的工作流程。它整合了 Google Gemini API，讓您可以在流程節點中利用強大的人工智慧功能。專案使用 Tailwind CSS 進行樣式設計，並可輕鬆部署到 GitHub Pages。

![SimpleFlow 應用程式截圖](https://user-images.githubusercontent.com/your-username/your-repo/assets/screenshot.png) <!-- 請替換為您自己的截圖 -->

---

## ✨ 功能特色

- **視覺化流程編輯**：透過拖放方式新增、連接和刪除節點。
- **整合 Gemini API**：在節點中直接呼叫 Gemini API 處理任務。
- **響應式設計**：使用 Tailwind CSS 打造，在各種裝置上都有良好的顯示效果。
- **Vite 驅動**：享受極速的開發伺服器啟動和模組熱更新。
- **一鍵部署**：內建 `gh-pages` 腳本，可輕鬆將專案部署到 GitHub Pages。
- **本機儲存**：API 金鑰等設定安全地儲存在瀏覽器的本機儲存空間，不會外洩。

---

## 🛠️ 技術棧

- [Vite](https://vitejs.dev/) - 前端建構工具
- [React](https://reactjs.org/) - UI 函式庫
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [gh-pages](https://github.com/tschaub/gh-pages) - 部署工具

---

## 🚀 開始使用

請依照以下步驟在本機執行此專案。

### 1. 前置需求

- [Node.js](https://nodejs.org/) (建議版本 18.x 或以上)
- 一個有效的 Google Gemini API 金鑰

### 2. 安裝步驟

1.  **複製此儲存庫**
    ```bash
    git clone https://github.com/your-username/SimpleFlow.git
    cd SimpleFlow
    ```

2.  **安裝相依套件**
    ```bash
    npm install
    ```

3.  **執行開發伺服器**
    ```bash
    npm run dev
    ```
    應用程式將會在 `http://localhost:5173` 啟動。

4.  **設定 API 金鑰**
    - 應用程式啟動後，點擊介面右上角的**設定**圖示。
    - 在設定頁面中，輸入您的 Google Gemini API 金鑰。
    - 點擊儲存，金鑰將會被儲存在瀏覽器的 Local Storage 中。

---

## 📜 可用腳本

在專案目錄中，您可以使用以下腳本：

- `npm run dev`：在開發模式下執行應用程式。
- `npm run build`：將應用程式建置到 `dist` 資料夾，以供生產環境使用。
- `npm run lint`：使用 ESLint 檢查程式碼品質。
- `npm run preview`：在本機預覽生產環境的建置版本。
- `npm run deploy`：將 `dist` 資料夾的內容部署到 GitHub Pages。

---

## 🚢 部署到 GitHub Pages

1.  **設定 `vite.config.js`**
    確保 `base` 屬性設定為您的儲存庫名稱：
    ```javascript
    // vite.config.js
    export default {
      base: '/SimpleFlow/',
      // ...
    }
    ```

2.  **將您的儲存庫推送到 GitHub**
    ```bash
    git remote add origin https://github.com/your-username/SimpleFlow.git
    git branch -M main
    git push -u origin main
    ```

3.  **執行部署腳本**
    ```bash
    npm run deploy
    ```
    這個指令會自動建置您的專案，並將其推送到 `gh-pages` 分支。

4.  **設定 GitHub Pages**
    - 前往您的 GitHub 儲存庫設定 (`Settings` -> `Pages`)。
    - 在 `Build and deployment` 下，將 `Source` 設定為 `Deploy from a branch`。
    - 將分支設定為 `gh-pages`，資料夾設定為 `/(root)`。
    - 儲存設定，幾分鐘後您的網站就會在 `https://your-username.github.io/SimpleFlow/` 上線。

---
