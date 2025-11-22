# 第一章燈光設置指南 🔦

## 當前設置

✅ **所有燈光強度已降低至原來的 40%**（降低了 60%）

## 如何調整燈光強度

### 方法 1：直接修改配置文件（推薦）

編輯 `src/components/Chapter1LightConfig.js`：

```javascript
const Chapter1LightConfig = {
  // 修改這個值來調整所有燈光強度
  lightIntensityMultiplier: 0.4,  // 範圍：0.0 - 2.0
  
  // 基礎環境光
  baseAmbientLight: 0.12,
  
  // 後備燈光
  fallbackLights: {
    ambient: 0.2,
    directional: 0.4,
    point: 0.2
  }
};
```

### 方法 2：使用內建預設

配置文件中提供了 5 種預設，可以快速切換：

| 預設名稱 | 強度系數 | 適用場景 |
|---------|---------|---------|
| `cinematic` | 0.2 | 極暗，電影般的氛圍 |
| `dark` | 0.4 | **當前設置** ✅ 暗調，柔和光線 |
| `normal` | 0.7 | 標準照明，平衡明暗 |
| `bright` | 1.0 | 明亮，原始模型強度 |
| `superBright` | 1.5 | 超亮，強化照明 |

### 方法 3：精細調整單個參數

如果需要更精細的控制，可以分別調整：

```javascript
// 只調整模型中的燈光
lightIntensityMultiplier: 0.4,

// 只調整 Canvas 層級的環境光
baseAmbientLight: 0.12,

// 只調整後備燈光（當模型無燈光時）
fallbackLights: {
  ambient: 0.2,        // 環境光
  directional: 0.4,    // 方向光
  point: 0.2          // 點光源
}
```

## 參數說明

### `lightIntensityMultiplier`
- **作用**：控制從 GLB 模型中提取的所有燈光強度
- **範圍**：0.0 - 2.0（建議 0.1 - 1.5）
- **當前值**：0.4（降低 60%）
- **效果**：
  - `0.1` - 幾乎全黑，只有輪廓
  - `0.4` - 暗調，柔和光線 ✅ **當前**
  - `0.7` - 適中明亮
  - `1.0` - 原始強度
  - `1.5` - 非常明亮

### `baseAmbientLight`
- **作用**：Canvas 層級的基礎環境光
- **範圍**：0.0 - 1.0
- **當前值**：0.12
- **說明**：這是整個場景的底光，確保即使沒有直接光源，物體也能被看見

### `fallbackLights`
- **作用**：當 GLB 模型中沒有燈光時的備用照明
- **當前值**：
  - `ambient: 0.2` - 環境光
  - `directional: 0.4` - 方向光
  - `point: 0.2` - 點光源

### `debugMode`
- **作用**：是否在瀏覽器控制台顯示燈光調試信息
- **當前值**：`true`
- **建議**：開發時設為 `true`，正式上線設為 `false`

## 快速示例

### 如果你想要更暗的效果（電影感）

```javascript
lightIntensityMultiplier: 0.2,
baseAmbientLight: 0.05,
```

### 如果你想恢復正常亮度

```javascript
lightIntensityMultiplier: 1.0,
baseAmbientLight: 0.3,
```

### 如果你想要非常明亮的效果

```javascript
lightIntensityMultiplier: 1.5,
baseAmbientLight: 0.8,
```

## 調試建議

1. **打開瀏覽器控制台（F12）**
   - 會顯示每個燈光的原始強度和降低後強度
   - 可以看到提取了幾個燈光

2. **實時調整**
   - 修改配置文件後，保存
   - 瀏覽器會自動刷新（熱重載）
   - 立即看到效果

3. **調整建議**
   - 先從 `lightIntensityMultiplier` 開始調整
   - 再微調 `baseAmbientLight`
   - 最後調整 `fallbackLights`（如果需要）

## 常見問題

### Q: 為什麼修改後沒有效果？
A: 確保：
1. 配置文件已保存
2. 開發服務器正在運行
3. 瀏覽器已刷新頁面

### Q: 場景太暗，什麼都看不見？
A: 增加以下值：
```javascript
lightIntensityMultiplier: 0.6,
baseAmbientLight: 0.2,
```

### Q: 場景太亮，過度曝光？
A: 降低以下值：
```javascript
lightIntensityMultiplier: 0.3,
baseAmbientLight: 0.08,
```

### Q: 如何關閉調試信息？
A: 設置：
```javascript
debugMode: false,
```

## 技術細節

### 燈光強度計算公式

```javascript
實際燈光強度 = 模型原始強度 × lightIntensityMultiplier
```

例如：
- 模型燈光原始強度：2.5
- 系數：0.4
- 實際強度：2.5 × 0.4 = 1.0

### 支持的燈光類型

系統會自動提取並調整以下類型的燈光：
- ✅ DirectionalLight（方向光）
- ✅ PointLight（點光源）
- ✅ SpotLight（聚光燈）
- ✅ AmbientLight（環境光）
- ✅ HemisphereLight（半球光）

## 相關文件

- `src/components/Chapter1LightConfig.js` - 燈光配置文件
- `src/components/Chapter1ModelViewer.jsx` - 3D 查看器組件
- `src/components/Chapter1ModelViewer.README.md` - 詳細技術文檔
























