# 章節二測試文檔

## 📋 測試概覽

本章節二的測試套件包含以下測試文件：

### 1. Chapter2.test.js
**主要組件測試**
- 渲染測試
- 開場動畫序列 (8秒)
- 背景圖片轉場效果
- 結局分支處理 (ending-a vs ending-b-a)
- 狀態管理和清理

### 2. VisualNovelEngine.test.js
**視覺小說引擎核心功能測試**
- 對話顯示和打字機效果
- 鍵盤導航 (左右方向鍵)
- 選擇系統
- 動畫節點處理
- 慢速打字標籤
- 回退功能
- 結局完成回調

### 3. DrinkCoffeeAnimation.test.js
**喝咖啡動畫測試**
- 動畫時間軸 (5秒)
- 圖片透明度變化
- CSS 過渡效果
- 組件結構驗證
- 定時器清理

### 4. SlowTypingEffect.test.js
**慢速打字效果測試**
- 正常速度 (40ms/字)
- 慢速標籤 (150ms/字)
- 標點符號停頓 (400ms)
- 混合文本處理
- 標籤嵌套
- 打字機跳過功能

### 5. Chapter2Integration.test.js
**集成測試**
- 完整章節流程
- 開場動畫 → 視覺小說 → 結局
- 背景圖片層級管理
- 狀態轉換驗證
- 組件生命週期

## 🎯 測試重點功能

### 開場動畫 (8秒)
```
0s ──> 2s ──> 5s ──> 8s
│      │      │      │
22.jpg drink  22.jpg 對話框
淡入   淡入   覆蓋   顯示
```

### 喝咖啡動畫 (5秒)
```
0s ──> 1s ──> 2.5s ──> 3.5s ──> 5s
│      │      │        │        │
22.jpg drink  drink    22.jpg   對話框
顯示   淡入   停留     淡入     顯示
```

### 慢速打字效果
- 普通文字：40ms/字
- `<slow>` 標籤：150ms/字
- 標點符號：400ms 停頓

## 🚀 運行測試

### 運行所有章節二測試
```bash
npm run test:chapter2
```

### 運行特定測試
```bash
# 主組件測試
npm test Chapter2.test.js

# 視覺小說引擎測試
npm test VisualNovelEngine.test.js

# 動畫測試
npm test DrinkCoffeeAnimation.test.js

# 慢速打字測試
npm test SlowTypingEffect.test.js

# 集成測試
npm test Chapter2Integration.test.js
```

### 運行測試並生成覆蓋率報告
```bash
npm test -- --coverage --testPathPattern="Chapter2|VisualNovel|DrinkCoffee|SlowTyping"
```

## 📊 測試覆蓋範圍

| 組件 | 測試覆蓋 | 功能測試 |
|-----|---------|---------|
| Chapter2 | ✅ | 開場動畫、背景轉場、結局處理 |
| VisualNovelEngine | ✅ | 對話系統、導航、選擇、動畫 |
| DrinkCoffeeAnimation | ✅ | 動畫時間軸、透明度變化 |
| SlowTypingEffect | ✅ | 打字速度、標籤處理 |
| 集成測試 | ✅ | 完整流程、狀態管理 |

## 🔧 Mock 策略

### 組件 Mock
- `LongPressBackToLogin`: 簡化為測試標識
- `ChatboxMe/Editor`: 顯示文字和狀態
- `SelectOption`: 可點擊按鈕
- `DrinkCoffeeAnimation`: 測試標識

### 腳本 Mock
- `chapter2Script`: 使用簡化測試數據
- 避免加載實際腳本文件的複雜性

### 定時器 Mock
- 使用 `jest.useFakeTimers()`
- 精確控制動畫時間軸
- 測試異步狀態變化

## 🎨 測試場景

### 正常流程
1. 開場動畫 (8秒)
2. 顯示視覺小說引擎
3. 用戶交互 (對話、選擇)
4. 完成結局分支
5. 觸發結局效果

### 異常情況
- 組件卸載時的清理
- 快速狀態切換
- 定時器清理
- 內存洩漏檢查

### 邊界測試
- 動畫時間邊界
- 打字機速度邊界
- 狀態轉換邊界
- 用戶交互邊界

## 📝 測試最佳實踐

1. **使用 fake timers**: 精確控制動畫時間
2. **Mock 依賴**: 隔離測試目標
3. **異步測試**: 使用 `waitFor` 等待狀態變化
4. **清理測試**: 確保沒有內存洩漏
5. **覆蓋率**: 達到 80%+ 的測試覆蓋率

## 🐛 常見問題

### 定時器問題
```javascript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});
```

### 異步狀態測試
```javascript
await waitFor(() => {
  expect(element).toBeInTheDocument();
});
```

### Mock 組件
```javascript
jest.mock('../Component', () => {
  return function MockComponent() {
    return <div data-testid="mock-component" />;
  };
});
```
























