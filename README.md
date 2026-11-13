<div align="center">

# 玥珩｜雷諾曼占卜・紫微斗數

**Haven Lenormand & Zi Wei Dou Shu Atelier**

*用溫潤、療癒的靈性光芒，為混亂的系統找回秩序。*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-536655?style=for-the-badge&logo=github)](https://havenalignment.github.io/Card/)
[![Zero Build](https://img.shields.io/badge/Architecture-Vanilla%20ES%20Modules-a9894f?style=for-the-badge&logo=javascript&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
[![Lenormand](https://img.shields.io/badge/Lenormand-36%20SVG%20Cards-6f8470?style=for-the-badge)](https://havenalignment.github.io/Card/)
[![Zi Wei](https://img.shields.io/badge/Zi%20Wei-iztro%202.6.5-38bdf8?style=for-the-badge)](https://github.com/SylarLong/iztro)
[![Last Commit](https://img.shields.io/github/last-commit/HavenAlignment/Card?style=for-the-badge&color=4b5f4f)](https://github.com/HavenAlignment/Card/commits/main)

</div>

---

## 專案簡介

這是一個**純靜態、零建置（Zero-Build）**的靈性占卜與命理排盤網站，專為 **GitHub Pages** 直接託管而設計。結合了**雷諾曼牌卡占卜（Lenormand）**與**紫微斗數（Zi Wei Dou Shu）**兩大系統，在視覺上融合溫潤羊皮紙、鼠尾草綠與經典命盤排版美學，讓使用者在任何裝置上都能安靜地整理思緒、探索方向。

> **線上體驗**：[https://havenalignment.github.io/Card/](https://havenalignment.github.io/Card/)

---

## 核心功能

### 一、 雷諾曼牌卡占卜（Lenormand Atelier）
- **四種經典牌陣**：
  - **每日一牌（1 張）**：抽取今日核心能量與行動提醒。
  - **三選項比較（2–3 情境 × 3 張）**：支援自訂情境，不放回抽樣比較各方向的起點、發展與可能趨勢。
  - **單一問題（5 張）**：對稱 3+2 金字塔佈局，突顯中心「核心／轉折」牌。
  - **九宮格全景（3×3）**：完整 9 張牌陣，標示正中央主軸牌與整體順流／覺察能量平衡。
- **36 張專屬細線向量圖騰與 3D 翻牌**：捨棄風格不一的系統 Emoji，為 01–36 號牌繪製統一的 SVG 向量圖騰；抽牌後可點擊逐張翻牌或一鍵全部翻開。
- **密碼學等級隨機洗牌**：使用 `crypto.getRandomValues()` 實作 Fisher-Yates 洗牌演算法。
- **36 張牌義圖鑑**：支援即時搜尋牌名、編號、關鍵字，以及依「順流／平衡／覺察」屬性篩選。
- **占卜紀錄與免後端分享**：自動於 `localStorage` 保存最近 15 筆紀錄，並支援一鍵複製解讀摘要與產生 URL 分享連結（`?m=...&c=...`）。

### 二、 紫微斗數命盤排盤與解讀（Zi Wei Dou Shu）
- **完整曆法輸入**：支援暱稱、性別（男／女）、**國曆／農曆（含閏月）**與**十二時辰（含早子時、晚子時）**。
- **三重視角切換（本命盤／大限盤／流年盤）**：
  - **本命盤**：全盤十二宮原始格局、生年四化、吉煞星與命身主。
  - **大限盤**：自動依年齡計算當前十年大限，標示「限命、限財、限官」等大限宮位走向。
  - **流年盤**：支援自選年份（如 2026 丙午年），動態標示「流命（金色高亮）」等十二流年宮位，並即時疊加**流年四化（祿權科忌帶發光外框）**。
- **文墨天機風格 4×4 十二宮方盤**：
  - 直排星曜與分色（主星、吉輔星、煞星、雜曜）、廟旺利平陷亮度、生年與流年四化。
  - 完整呈現小限歲數、大限區間、博士／將前／歲前十二神、長生十二神與直排天干地支。
  - 中宮呈現基本資料、五行分色四柱八字，並以 **SVG 虛線即時繪製三方四正連線**（點擊任一宮位即可切換高亮）。
- **純靜態「即時解盤」＋「AI 深度解盤指令」**：
  - **即時解盤**：自動切換本命全景或當前年份之「流年運勢總覽」，深度解析流年四化動能與四大領域（工作／財運／感情／心境）。
  - **一鍵複製 AI 深度解盤指令**：根據目前選擇的視角（本命／大限／流年），自動生成結構化 Prompt，一鍵貼給 ChatGPT、Gemini 或 Claude 進行更深入的問事對話。
- **高解析度圖檔匯出**：支援一鍵匯出 2× Retina 解析度的 `<暱稱>-紫微命盤.png`（流年模式下自動標註年份）。

### 三、 雙主題與響應式設計
- 內建**日間溫潤米白**與**夜間靜謐深色**雙主題切換（自動記憶於 `localStorage`）。
- 全部 DOM 渲染採 `document.createElement` 與 `textContent`，杜絕 XSS 風險；尊重系統 `prefers-reduced-motion` 設定。

---

## 專案結構

```text
Card/
├── index.html               # 頁面骨架、導覽分頁、表單與 Open Graph 設定
├── styles.css               # 雙主題設計系統、3D 翻牌與 4×4 紫微方盤樣式
├── app.js                   # 雷諾曼抽牌引擎、敘事生成、圖鑑搜尋、紀錄與分享
├── ziwei.js                 # 紫微斗數排盤、SVG 三方四正連線與 PNG 匯出
├── ziwei-reading.js         # 紫微命盤基本解讀引擎與 AI Prompt 生成器
├── favicon.svg              # 網站向量圖示
├── avatar.jpg               # 個人頭貼資源
├── data/
│   ├── deck.js              # 36 張雷諾曼牌資料與四種牌陣位置定義
│   ├── icons.js             # 36 張雷諾曼牌細線 SVG 向量圖騰庫
│   └── ziwei-meanings.js    # 紫微十四主星、四化與十二宮繁體中文解析庫
└── README.md
```

---

## 本機預覽與部署

### 本機預覽
由於本專案使用原生 **ES Modules**（`<script type="module">`），請透過本機 HTTP 伺服器開啟（請勿直接以 `file://` 開啟）：

```bash
# 方式一：使用 Node.js
npx serve .

# 方式二：使用 Python
python -m http.server 8080
```

開啟瀏覽器前往 `http://localhost:8080`（或對應埠號）即可使用。

### GitHub Pages 部署
本專案無須任何編譯或打包步驟：
1. 前往 Repository 的 **Settings → Pages**。
2. **Source** 選擇 `Deploy from a branch`，分支選擇 `main`、路徑選擇 `/ (root)`。
3. 儲存後等待 1～2 分鐘，即可透過 `https://<username>.github.io/<repo>/` 直接存取。

---

## 技術與致謝

- **[iztro](https://github.com/SylarLong/iztro)** (`v2.6.5`) — 開源紫微斗數核心排盤演算法與農曆換算引擎
- **[html2canvas](https://html2canvas.hertzen.com/)** (`v1.4.1`) — 前端 DOM 轉高解析度 PNG 命盤圖檔
- **[Google Fonts](https://fonts.google.com/)** — `Noto Serif TC`、`Noto Sans TC`、`Cormorant Garamond`

---

## 免責聲明

本網站提供之雷諾曼牌卡解讀與紫微斗數命盤分析僅供自我探索、思緒整理與文化研究參考，不構成任何醫療、法律、財務或重大人生決策之絕對依據。
