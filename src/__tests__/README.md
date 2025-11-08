# 測試文檔

這個專案包含了完整的測試套件，涵蓋了單元測試、整合測試和端到端測試場景。

## 測試結構

```
src/
├── __tests__/
│   ├── integration.test.js          # 整合測試
│   └── README.md                    # 測試文檔
├── components/
│   └── __tests__/
│       ├── WordGame.test.js         # WordGame 組件測試
│       └── LongPressBackToLogin.test.js # LongPressBackToLogin 組件測試
└── hooks/
    └── __tests__/
        ├── useLongPressEnter.test.js # useLongPressEnter Hook 測試
        └── use43Fullscreen.test.js   # use43Fullscreen Hook 測試
```

## 運行測試

### 基本測試命令

```bash
# 運行所有測試
npm test

# 監聽模式（開發時使用）
npm run test:watch

# 生成覆蓋率報告
npm run test:coverage

# CI/CD 模式
npm run test:ci
```

### 測試特定文件

```bash
# 測試特定組件
npm test WordGame

# 測試特定 Hook
npm test useLongPressEnter

# 測試整合測試
npm test integration
```

## 測試覆蓋範圍

### WordGame 組件測試
- ✅ 組件渲染
- ✅ 打字動畫
- ✅ 跳過動畫功能
- ✅ 互動詞彙高亮
- ✅ 箭頭鍵導航
- ✅ 詞彙選擇選單
- ✅ 選單內導航
- ✅ 詞彙替換
- ✅ 完成提示
- ✅ 段落進度
- ✅ 已完成段落保留
- ✅ 多個互動詞彙處理
- ✅ 邊界標記和段落標記
- ✅ 邊界情況處理

### LongPressBackToLogin 組件測試
- ✅ 條件渲染
- ✅ 進度條顯示
- ✅ ARIA 無障礙屬性
- ✅ 自定義配置
- ✅ CSS 類別和樣式
- ✅ SVG 圓形進度條
- ✅ 進度計算
- ✅ 邊界值處理
- ✅ 螢幕閱讀器支援

### useLongPressEnter Hook 測試
- ✅ 初始狀態
- ✅ 路徑啟用檢查
- ✅ Enter 鍵按下處理
- ✅ 輸入框焦點檢查
- ✅ Enter 鍵釋放重置
- ✅ 顯示延遲
- ✅ 完成和導航
- ✅ 頁面隱藏重置
- ✅ 自定義配置
- ✅ 事件監聽器清理

### use43Fullscreen Hook 測試
- ✅ 非 4:3 螢幕處理
- ✅ 4:3 螢幕縮放計算
- ✅ 邊界情況處理
- ✅ 視窗大小變化
- ✅ 事件監聽器清理

### 整合測試
- ✅ Chapter3 組件整合
- ✅ WordGame 打字動畫與鍵盤控制
- ✅ 詞彙選擇和替換流程
- ✅ 段落進度
- ✅ 多個互動詞彙處理
- ✅ 選單定位和互動
- ✅ 完成提示顯示和隱藏
- ✅ 快速按鍵處理
- ✅ 已完成段落保留
- ✅ 邊界情況處理
- ✅ React Router 整合

## 測試工具和庫

- **Jest**: 測試框架
- **@testing-library/react**: React 組件測試
- **@testing-library/user-event**: 用戶互動模擬
- **@testing-library/jest-dom**: DOM 斷言擴展

## 測試配置

### Jest 配置 (jest.config.js)
- 使用 jsdom 環境
- CSS 模組模擬
- 測試文件匹配模式
- 覆蓋率收集
- Babel 轉換

### 測試設置 (src/setupTests.js)
- DOM 斷言擴展
- 瀏覽器 API 模擬
- 控制台方法模擬
- 觀察者 API 模擬

## 手動測試場景

除了自動化測試，還需要進行以下手動測試：

### WordGame 手動測試
1. 導航到 Chapter3 頁面
2. 觀察打字動畫效果
3. 使用方向鍵選擇互動詞彙
4. 測試詞彙選擇選單
5. 完成所有段落
6. 驗證段落保留

### LongPressBackToLogin 手動測試
1. 在 Chapter1/Chapter2/Chapter3 頁面長按 Enter
2. 觀察進度條動畫
3. 測試取消功能
4. 驗證導航到登入頁面
5. 測試輸入框焦點時的禁用

### 無障礙測試
1. 使用螢幕閱讀器測試
2. 驗證 ARIA 屬性
3. 測試鍵盤導航
4. 檢查顏色對比度

## 測試最佳實踐

1. **隔離測試**: 每個測試應該獨立運行
2. **模擬外部依賴**: 使用 Jest 模擬函數
3. **測試用戶行為**: 使用 userEvent 模擬真實用戶互動
4. **無障礙測試**: 確保組件符合無障礙標準
5. **邊界情況**: 測試極端值和錯誤情況
6. **清理**: 每個測試後清理狀態和模擬

## 持續整合

測試已配置為在 CI/CD 環境中運行：

```bash
npm run test:ci
```

這將：
- 運行所有測試
- 生成覆蓋率報告
- 在失敗時退出
- 適合自動化部署流程




























