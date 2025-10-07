# 視覺小說系統說明

## 📁 檔案結構

```
src/
├── components/
│   ├── visualNovel/
│   │   ├── ChatboxMe.jsx          # 主角對話框組件
│   │   ├── ChatboxEditor.jsx      # 編輯對話框組件
│   │   ├── SelectOption.jsx       # 選項按鈕組件
│   │   ├── VisualNovelEngine.jsx  # 視覺小說引擎核心
│   │   └── README.md              # 本說明文件
│   └── Chapter2.js                # 章節二主組件
├── data/
│   └── chapter2Script.js          # 章節二劇本數據
└── styles/
    └── visualNovel.css            # 視覺小說樣式表
```

---

## 🎮 操作說明

### 對話模式
- **方向鍵右鍵 (→)**
  - 打字中：跳過打字動畫，直接顯示完整文字
  - 文字顯示完成：進入下一句對話

- **方向鍵左鍵 (←)**
  - 返回上一句對話

### 選項模式
- **方向鍵左鍵 (←)**
  - 選擇選項 A（上面的選項）
  - 按下時顯示 hover 樣式

- **方向鍵右鍵 (→)**
  - 選擇選項 B（下面的選項）
  - 按下時顯示 hover 樣式

---

## 🎨 組件說明

### ChatboxMe
主角對話框，灰色背景，左下角帶三角形指標。

**Props:**
- `text` (string): 要顯示的文字
- `isTyping` (boolean): 是否正在打字（顯示游標）

### ChatboxEditor
編輯對話框，白色背景，黑色邊框，頂部帶黑色名牌。

**Props:**
- `text` (string): 要顯示的文字
- `name` (string): 角色名稱（默認為"編輯"）
- `isTyping` (boolean): 是否正在打字（顯示游標）

### SelectOption
選項按鈕，膠囊形狀，hover 時黑底白字。

**Props:**
- `text` (string): 選項文字
- `onClick` (function): 點擊事件
- `isPressed` (boolean): 是否被按下（鍵盤操作時）

### VisualNovelEngine
視覺小說引擎核心組件，管理對話流程、打字機效果和鍵盤控制。

**Props:**
- `script` (object): 劇本數據對象
- `onComplete` (function): 故事完成時的回調函數

---

## 📝 劇本數據格式

劇本數據結構位於 `src/data/chapter2Script.js`

### 對話節點
```javascript
{
  id: 'unique-id',
  type: 'dialogue',
  speaker: 'protagonist' | 'editor',
  text: '對話文字',
  next: 'next-node-id'
}
```

### 選項節點
```javascript
{
  id: 'unique-id',
  type: 'choice',
  choices: [
    {
      text: '選項 A 文字',
      next: 'branch-a'
    },
    {
      text: '選項 B 文字',
      next: 'branch-b'
    }
  ]
}
```

### 分支結構
```javascript
const script = {
  'opening': [...],           // 開場對話
  'branch-a': [...],          // 分支 A
  'branch-b': [...],          // 分支 B
  'ending-a-a': [...],        // 結局 A-A
  'ending-a-b': [...],        // 結局 A-B
  'ending-b-a': [...],        // 結局 B-A
  'ending-b-b': [...],        // 結局 B-B
  'end': []                   // 結束標記
};
```

---

## 🎨 樣式自訂

所有樣式變數定義在 `src/styles/visualNovel.css` 的 `:root` 中：

```css
:root {
  /* 顏色 */
  --vn-color-surface-white: #FFFFFF;
  --vn-color-surface-black: #000000;
  --vn-color-icon-secondary: #D4D4DE;
  
  /* 字體 */
  --vn-font-family-pixel: '点点像素体-方形', 'DotGothic16', monospace, sans-serif;
  --vn-font-size-chatbox: 40px;
  --vn-font-size-body: 30px;
  
  /* 動畫速度 */
  --vn-typewriter-speed: 50ms;
  
  /* 其他... */
}
```

---

## 🖼️ 添加背景圖片

在 `Chapter2.js` 中取消註解背景圖片代碼：

```jsx
<img 
  src="/images/backgrounds/chapter2-bg.jpg" 
  alt="Background" 
  className="visual-novel-background"
/>
```

將背景圖片放置在 `public/images/backgrounds/` 目錄下。

---

## 🔧 擴展功能

### 添加新角色
1. 在 `src/components/visualNovel/` 創建新的對話框組件
2. 在 `VisualNovelEngine.jsx` 中添加新的 speaker 類型處理

### 添加音效和音樂
1. 在 `VisualNovelEngine.jsx` 中添加音頻播放邏輯
2. 在劇本數據中添加音效/音樂標記

### 添加演出效果
1. 在 CSS 中定義動畫效果
2. 在劇本數據中添加演出標記
3. 在引擎中處理演出觸發

---

## 📊 當前功能狀態

✅ 已完成：
- 三種對話框組件
- 打字機效果
- 鍵盤控制（左右方向鍵）
- 對話歷史與回退
- 分支選擇系統
- 劇本數據結構

⏳ 待添加：
- 音效和音樂
- 演出效果（黑屏、轉場等）
- 角色立繪
- 存檔/讀檔功能

---

## 🐛 故障排除

### 打字機效果不正常
檢查 `--vn-typewriter-speed` CSS 變數設定

### 鍵盤控制無效
確認 `VisualNovelEngine` 組件已正確掛載，且沒有其他元素捕獲鍵盤事件

### 樣式顯示異常
確認 `visualNovel.css` 已正確導入到組件中

---

## 📮 聯絡資訊

如有問題或建議，請聯繫開發團隊。

