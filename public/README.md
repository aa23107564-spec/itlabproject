# 媒體檔案組織說明

## 📁 資料夾結構

### 🖼️ 圖檔 (images/)
- **backgrounds/**: 背景圖片
  - 建議格式: JPG, PNG, WebP
  - 建議尺寸: 1920x1080 或更高解析度
  
- **icons/**: 圖示檔案
  - 建議格式: SVG, PNG (透明背景)
  - 建議尺寸: 16x16, 24x24, 32x32, 48x48, 64x64
  
- **ui/**: UI 相關圖片
  - 按鈕、介面元素、裝飾圖片
  - 建議格式: PNG (透明背景), SVG
  
- **content/**: 內容相關圖片
  - 遊戲內容、角色、場景圖片
  - 建議格式: JPG, PNG, WebP

### 🎵 音檔 (audio/)
- **bgm/**: 背景音樂
  - 建議格式: MP3, OGG, WAV
  - 建議品質: 128-320 kbps
  
- **sfx/**: 音效
  - 按鈕點擊、遊戲音效
  - 建議格式: MP3, OGG, WAV
  - 建議品質: 64-128 kbps
  
- **voice/**: 語音檔案
  - 旁白、角色語音
  - 建議格式: MP3, OGG, WAV
  - 建議品質: 128-256 kbps

## 💻 在程式碼中使用

### 圖檔使用範例
```javascript
// 在 React 組件中
<img src="/images/backgrounds/main-bg.jpg" alt="主背景" />
<img src="/images/icons/play-button.svg" alt="播放按鈕" />
```

### 音檔使用範例
```javascript
// 在 React 組件中
const audio = new Audio('/audio/bgm/background-music.mp3');
const clickSound = new Audio('/audio/sfx/button-click.mp3');
```

## 📝 注意事項

1. **檔案命名**: 使用英文和連字號，避免空格和特殊字符
2. **檔案大小**: 圖片建議壓縮，音檔建議適當品質
3. **瀏覽器支援**: 使用現代瀏覽器支援的格式
4. **路徑引用**: 使用絕對路徑 `/images/...` 或 `/audio/...`

## 🔧 建議工具

- **圖片壓縮**: TinyPNG, ImageOptim
- **音檔處理**: Audacity, FFmpeg
- **格式轉換**: Online-Convert, CloudConvert










