# 按鍵組合檢測整合總結

## 📋 任務概述

將第三章中實現的「左鍵+右鍵同時按」檢測機制整合到第二章的視覺小說引擎中，確保「長按左鍵+右鍵以返回」功能在所有章節中都能正常運作，不會與遊戲操作產生衝突。

## 🎯 實現目標

### 問題背景
- **第二章**: 使用 ArrowLeft（後退）和 ArrowRight（前進）來控制對話流程
- **第三章**: 使用 ArrowLeft、ArrowDown、ArrowRight 來控制遊戲操作
- **共同需求**: 需要支援「同時按 ArrowLeft + ArrowRight」來觸發「返回登入」功能

### 挑戰
如何讓系統區分：
1. **單獨按左鍵**: 執行對話後退/遊戲操作
2. **單獨按右鍵**: 執行對話前進/遊戲操作
3. **同時按左+右鍵**: 觸發返回登入功能，不執行遊戲操作

## 🔧 技術實現

### 核心機制：延遲檢測 + 全局狀態

#### 1. **LongPressBackToLogin 組件** (`src/hooks/useLongPressEnter.js`)

**功能**: 檢測按鍵組合並管理全局狀態

```javascript
// 關鍵特性：
- 追蹤所有按下的鍵（pressedKeysRef: Set）
- 記錄每個按鍵的按下時間（keyPressTimesRef: Object）
- 150ms 時間窗口檢測同時按鍵
- 暴露全局狀態到 window 對象：
  * window.gameInteractionBlocked
  * window.combinationDetected
```

**檢測邏輯**:
```javascript
if (pressedKeysRef.current.has('ArrowLeft') && 
    pressedKeysRef.current.has('ArrowRight')) {
  const leftTime = keyPressTimesRef.current['ArrowLeft'];
  const rightTime = keyPressTimesRef.current['ArrowRight'];
  
  // 150ms 時間窗口內按下視為同時按
  if (Math.abs(leftTime - rightTime) <= 150) {
    combinationDetectedRef.current = true;
    gameInteractionBlockedRef.current = true;
    // 開始長按計時...
  }
}
```

**重置邏輯**:
```javascript
// 釋放按鍵時
if (combinationDetectedRef.current) {
  // 延遲 100ms 重置，確保所有延遲的遊戲操作都被阻擋
  setTimeout(() => {
    reset();
  }, 100);
}
```

#### 2. **視覺小說引擎** (`src/components/visualNovel/VisualNovelEngine.jsx`)

**功能**: 在執行遊戲操作前檢查全局狀態

```javascript
const handleKeyDown = (e) => {
  // 第一層檢查：立即檢查全局狀態
  const gameInteractionBlocked = window.gameInteractionBlocked || false;
  const combinationDetected = window.combinationDetected || false;
  
  if (gameInteractionBlocked || combinationDetected) {
    return; // 組合鍵已觸發，不執行任何操作
  }

  // 對話模式
  if (e.key === 'ArrowRight') {
    // 延遲 50ms 後執行，給組合鍵檢測時間
    setTimeout(() => {
      // 第二層檢查：延遲後再次確認
      const blocked = window.gameInteractionBlocked || false;
      const detected = window.combinationDetected || false;
      if (!blocked && !detected) {
        goNext(); // 確認是單鍵操作，執行前進
      }
    }, 50);
  }
  
  // ArrowLeft 同理
};
```

**應用範圍**:
- ✅ **對話模式 - 前進**: ArrowRight → `goNext()`
- ✅ **對話模式 - 後退**: ArrowLeft → `goBack()`
- ✅ **選項模式 - 選項A**: ArrowLeft → `setSelectedChoice(0)`
- ✅ **選項模式 - 選項B**: ArrowRight → `setSelectedChoice(1)`

#### 3. **WordGame 組件** (`src/components/WordGame.jsx`)

**功能**: 在執行遊戲操作前檢查全局狀態（與視覺小說引擎相同邏輯）

```javascript
const handleKeyPress = (e) => {
  // 檢查是否為左鍵或右鍵，如果是則短暫延遲以檢測組合按鍵
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    setTimeout(() => {
      const gameInteractionBlocked = window.gameInteractionBlocked || false;
      const combinationDetected = window.combinationDetected || false;
      if (gameInteractionBlocked || combinationDetected) {
        return; // 不執行遊戲操作
      }
      executeGameOperation(e, currentState);
    }, 50); // 50ms 延遲
    return;
  }
  executeGameOperation(e, currentState);
};
```

## 📊 時序圖

### 情況 1: 單獨按右鍵（前進對話）

```
t=0ms    用戶按下 ArrowRight
         ↓
t=0ms    VisualNovelEngine.handleKeyDown 觸發
         ├─ 檢查全局狀態: OK (無組合鍵)
         └─ 設置 setTimeout(goNext, 50ms)
         ↓
t=50ms   setTimeout 執行
         ├─ 再次檢查全局狀態: OK (無組合鍵)
         └─ ✅ 執行 goNext() - 對話前進
```

### 情況 2: 同時按左+右鍵（返回登入）

```
t=0ms    用戶按下 ArrowLeft
         ↓
t=0ms    useLongPressEnter.handleKeyDown 觸發
         └─ 記錄 ArrowLeft 按下時間
         ↓
t=20ms   用戶按下 ArrowRight (在 150ms 窗口內)
         ↓
t=20ms   VisualNovelEngine.handleKeyDown 觸發
         ├─ 檢查全局狀態: OK (組合鍵尚未完全檢測)
         └─ 設置 setTimeout(goNext, 50ms)
         ↓
t=20ms   useLongPressEnter.handleKeyDown 觸發
         ├─ 檢測到 ArrowLeft + ArrowRight
         ├─ 時間差 = 20ms < 150ms ✓
         ├─ 設置 combinationDetected = true
         ├─ 設置 gameInteractionBlocked = true
         └─ 暴露到 window 對象
         ↓
t=70ms   VisualNovelEngine 的 setTimeout 執行
         ├─ 檢查全局狀態: combinationDetected = true
         └─ ❌ 不執行 goNext() - 阻止對話前進
         ↓
t=...    用戶持續按住 1 秒
         └─ 長按進度條達到 100%
         ↓
         ✅ 返回登入頁面
```

### 情況 3: 按住到一半放開（不返回登入，也不執行遊戲操作）

```
t=0ms    用戶同時按下 ArrowLeft + ArrowRight
         ↓
t=0ms    檢測到組合鍵
         ├─ combinationDetected = true
         ├─ gameInteractionBlocked = true
         └─ 開始長按計時
         ↓
t=500ms  用戶放開其中一個鍵
         ↓
t=500ms  useLongPressEnter.handleKeyUp 觸發
         └─ 設置 setTimeout(reset, 100ms)
         ↓
t=600ms  重置全局狀態
         ├─ combinationDetected = false
         ├─ gameInteractionBlocked = false
         └─ 清除進度條
         ↓
         ✅ 遊戲恢復正常，可繼續操作
```

## 🎮 關鍵參數

| 參數 | 值 | 說明 |
|------|-----|------|
| **時間窗口** | 150ms | 判斷兩個按鍵是否「同時」按下的時間差閾值 |
| **遊戲操作延遲** | 50ms | 執行遊戲操作前的延遲，用於等待組合鍵檢測 |
| **重置延遲** | 100ms | 放開組合鍵後的延遲，確保所有延遲的操作都被阻擋 |
| **長按持續時間** | 1000ms | 需要持續按住的時間才會觸發返回登入 |

### 為什麼選擇這些數值？

1. **150ms 時間窗口**
   - 人類手指同時按兩個鍵的自然時間差
   - 太短：難以觸發組合鍵
   - 太長：可能誤判快速連續按鍵為組合鍵

2. **50ms 遊戲操作延遲**
   - 足夠讓組合鍵檢測完成
   - 短到用戶感知不到延遲
   - 配合 100ms 重置延遲，確保阻擋機制可靠

3. **100ms 重置延遲**
   - 從 200ms 優化而來
   - 確保所有 50ms 延遲的操作都被阻擋
   - 進度條消失反應更快，用戶體驗更流暢

## 📁 修改的文件

### 1. `src/hooks/useLongPressEnter.js`
**已實現** (之前的改進)
- ✅ 按鍵組合檢測（150ms 時間窗口）
- ✅ 全局狀態管理
- ✅ 100ms 重置延遲

### 2. `src/components/WordGame.jsx`
**已實現** (之前的改進)
- ✅ 50ms 延遲檢測
- ✅ 雙重檢查機制

### 3. `src/components/visualNovel/VisualNovelEngine.jsx`
**新實現** (本次改進)
- ✅ 50ms 延遲檢測
- ✅ 雙重檢查機制
- ✅ 應用於對話模式和選項模式

### 4. `src/components/LongPressBackToLogin.js`
**已實現** (之前的改進)
- ✅ 暴露全局狀態到 window 對象
- ✅ 更新顯示文字為「長按左鍵+右鍵以返回」

## ✅ 功能驗證

### 第二章驗證步驟

1. **測試單鍵操作**
   - 進入第二章
   - 按右鍵 → 應該前進對話 ✅
   - 按左鍵 → 應該後退對話 ✅
   - 到達選項時，按左/右鍵 → 應該選擇選項 ✅

2. **測試組合鍵**
   - 同時按左鍵+右鍵並持續 1 秒
   - 應該看到進度條 ✅
   - 進度條達到 100% → 返回登入頁面 ✅

3. **測試中途放開**
   - 同時按左鍵+右鍵
   - 看到進度條後，在 1 秒內放開
   - 進度條應該消失 ✅
   - 對話不應該前進或後退 ✅

### 第三章驗證步驟

1. **測試單鍵操作**
   - 進入第三章
   - 按左/下/右鍵 → 遊戲應該正常操作 ✅

2. **測試組合鍵**
   - 同時按左鍵+右鍵並持續 1 秒
   - 應該看到進度條 ✅
   - 進度條達到 100% → 返回登入頁面 ✅
   - 遊戲操作不應該被觸發 ✅

## 🎯 優勢

### 1. **統一的用戶體驗**
   - 所有章節使用相同的「左鍵+右鍵」組合返回登入
   - 一致的進度條UI和反饋

### 2. **可靠的操作分離**
   - 雙重檢查機制確保不會誤觸發
   - 時間窗口設計符合人體工學

### 3. **無侵入性**
   - 使用全局狀態，各組件獨立工作
   - 易於維護和擴展

### 4. **優化的性能**
   - 延遲時間短，用戶感知不到
   - 進度條反應速度提升 50%

## 🔮 未來可能的改進

1. **可配置參數**
   ```javascript
   const CONFIG = {
     timeWindow: 150,      // 時間窗口
     actionDelay: 50,      // 操作延遲
     resetDelay: 100,      // 重置延遲
     longPressDuration: 1000 // 長按持續時間
   };
   ```

2. **視覺反饋增強**
   - 當檢測到組合鍵時，可以添加輕微的視覺提示
   - 例如：邊框閃爍、按鍵圖標高亮

3. **觸摸屏支援**
   - 為移動設備添加觸摸手勢支援
   - 例如：雙指長按、特定滑動手勢

## 📝 注意事項

### 開發者須知

1. **不要干擾全局狀態**
   - `window.gameInteractionBlocked` 和 `window.combinationDetected` 由 `LongPressBackToLogin` 組件管理
   - 其他組件只應讀取，不應修改

2. **延遲時間協調**
   - 如果需要修改延遲時間，確保：
     - `resetDelay >= actionDelay`
     - 保持合理的用戶體驗

3. **測試所有章節**
   - 修改按鍵相關邏輯後，務必測試所有章節
   - 確保沒有破壞現有功能

## 🎉 總結

通過實現延遲檢測 + 全局狀態管理機制，成功解決了「單鍵操作」與「組合鍵功能」的衝突問題。現在：

- ✅ 第二章和第三章都完美支援「長按左鍵+右鍵以返回」
- ✅ 單鍵操作不受影響，遊戲流程順暢
- ✅ 中途放開不會誤觸發遊戲操作
- ✅ 統一的用戶體驗和視覺反饋
- ✅ 代碼結構清晰，易於維護

所有功能已部署到開發服務器，可通過瀏覽器測試驗證！🚀



















