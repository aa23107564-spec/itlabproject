# 大展網站

一個使用React和Bootstrap建立的現代化前端網站專案。

## 專案特色

- 🚀 **React 18** - 使用最新的React框架
- 🎨 **Bootstrap 5** - 現代化的CSS框架
- 📱 **響應式設計** - 適配各種裝置尺寸
- ⚡ **Webpack** - 現代化的打包工具
- 🔧 **Babel** - JavaScript編譯器

## 專案結構

```
大展網站/
├── public/
│   └── index.html          # HTML模板
├── src/
│   ├── components/         # React組件
│   │   ├── Header.js       # 導航欄組件
│   │   ├── Hero.js         # 首頁橫幅組件
│   │   ├── Features.js     # 特色功能組件
│   │   └── Footer.js       # 頁尾組件
│   ├── App.js              # 主應用組件
│   └── index.js            # 應用入口點
├── package.json            # 專案配置和依賴
├── webpack.config.js       # Webpack配置
├── .babelrc               # Babel配置
└── README.md              # 專案說明
```

## 安裝與執行

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動開發伺服器

```bash
npm start
```

或

```bash
npm run dev
```

專案將在 http://localhost:3000 開啟

### 3. 建置生產版本

```bash
npm run build
```

建置後的檔案將在 `dist` 資料夾中

## 技術棧

- **前端框架**: React 18.2.0
- **CSS框架**: Bootstrap 5.3.2
- **打包工具**: Webpack 5.88.0
- **編譯器**: Babel 7.23.0
- **開發伺服器**: Webpack Dev Server 4.15.1

## 組件說明

### Header
- 響應式導航欄
- Bootstrap導航組件
- 品牌標識和選單項目

### Hero
- 首頁主要橫幅區域
- 標題、描述和行動按鈕
- 視覺化元素展示

### Features
- 特色功能展示
- 卡片式布局
- 圖標和描述文字

### Footer
- 網站頁尾資訊
- 連結和聯絡資訊
- 版權聲明

## 自訂樣式

專案已引入Bootstrap的完整CSS，您可以在組件中使用Bootstrap的類別：

- 網格系統: `container`, `row`, `col-*`
- 按鈕: `btn`, `btn-primary`, `btn-lg`
- 卡片: `card`, `card-body`, `card-title`
- 導航: `navbar`, `navbar-brand`, `nav-link`
- 工具類: `text-center`, `mb-3`, `fw-bold`

## 開發建議

1. 在 `src/components/` 中建立新的組件
2. 使用Bootstrap類別進行樣式設計
3. 保持組件的單一職責原則
4. 使用React Hooks進行狀態管理

## 瀏覽器支援

- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

## 授權

MIT License

---

**建立時間**: 2024年
**技術**: React + Bootstrap
