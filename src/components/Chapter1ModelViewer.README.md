# Chapter 1 Model Viewer - 3D 模型查看器

## 功能說明

這個組件使用 Three.js 和 React Three Fiber 來加載和顯示 GLB 3D 模型，並自動提取和應用模型中的燈光信息。

## 主要特性

### 1. 自動燈光提取
- 自動掃描 GLB 模型中的所有燈光對象
- 支持多種燈光類型：
  - `AmbientLight` - 環境光
  - `DirectionalLight` - 方向光
  - `PointLight` - 點光源
  - `SpotLight` - 聚光燈
  - `HemisphereLight` - 半球光

### 2. 燈光信息保留
提取並應用模型中的完整燈光屬性：
- 顏色 (color)
- 強度 (intensity)
- 位置 (position)
- 距離 (distance)
- 角度 (angle)
- 半影 (penumbra)
- 衰減 (decay)
- 陰影投射 (castShadow)

### 3. 交互控制
- **左鍵拖動**：旋轉視角
- **滾輪**：縮放視圖
- **右鍵拖動**：平移場景
- 平滑的阻尼效果
- 自動限制視角範圍

### 4. 後備照明
如果 GLB 模型中沒有內建燈光，系統會自動添加默認照明：
- 環境光（強度 0.5）
- 方向光（位置 [10, 10, 5]，強度 1）
- 點光源（位置 [-10, -10, -5]，強度 0.5）

## 技術實現

### 使用的庫
- `three` - 核心 3D 引擎
- `@react-three/fiber` - React 的 Three.js 渲染器
- `@react-three/drei` - Three.js 的實用工具集合

### 核心代碼邏輯

```javascript
// 1. 加載 GLB 模型
const { scene, animations } = useGLTF(modelPath);

// 2. 提取燈光信息
scene.traverse((child) => {
  if (child.isLight) {
    // 保存燈光屬性
    extractedLights.push({
      type: child.type,
      color: child.color,
      intensity: child.intensity,
      position: child.position.clone(),
      // ... 其他屬性
    });
  }
});

// 3. 在場景中重新創建燈光
{lights.map((light, index) => {
  switch (light.type) {
    case 'DirectionalLight':
      return <directionalLight {...lightProps} />;
    // ... 其他類型
  }
})}
```

## 文件結構

```
src/components/
├── Chapter1.js                    # 第一章主組件
├── Chapter1ModelViewer.jsx        # 3D 模型查看器
├── Chapter1LightConfig.js         # 🔦 燈光配置文件（重要）
└── Chapter1ModelViewer.README.md  # 本說明文件

public/images/glb/
└── chpapter1.glb                  # 3D 模型文件
```

## 使用方式

在 Chapter1 組件中已經集成：

```javascript
import Chapter1ModelViewer from './Chapter1ModelViewer';

function Chapter1() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Chapter1ModelViewer />
    </div>
  );
}
```

## 性能優化

1. **模型預加載**：使用 `useGLTF.preload()` 提前加載模型
2. **高性能渲染**：啟用硬件加速 (`powerPreference: "high-performance"`)
3. **抗鋸齒**：啟用 WebGL 抗鋸齒
4. **平滑控制**：啟用阻尼效果，提供更流暢的交互體驗

## 自定義選項

### 🔦 調整燈光強度（重要！）

所有燈光設置都集中在 `Chapter1LightConfig.js` 文件中，方便統一管理：

```javascript
// Chapter1LightConfig.js
const Chapter1LightConfig = {
  // 主要設置：燈光強度系數（0.0 - 1.0）
  lightIntensityMultiplier: 0.4,  // 當前：40%（已降低60%）
  
  // 基礎環境光強度
  baseAmbientLight: 0.12,
  
  // 後備燈光（當模型無燈光時）
  fallbackLights: {
    ambient: 0.2,
    directional: 0.4,
    point: 0.2
  }
};
```

**快速切換預設：**

如果想要不同的光照效果，可以使用內建預設：

- **`cinematic`** (極暗，電影感): `multiplier: 0.2`
- **`dark`** (暗，當前設置): `multiplier: 0.4` ✅
- **`normal`** (正常): `multiplier: 0.7`
- **`bright`** (明亮): `multiplier: 1.0`
- **`superBright`** (超亮): `multiplier: 1.5`

### 調整相機位置
```javascript
<Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
```

### 修改控制器限制
```javascript
<OrbitControls
  minDistance={2}      // 最小縮放距離
  maxDistance={20}     // 最大縮放距離
  maxPolarAngle={Math.PI / 1.5}  // 最大垂直角度
/>
```

### 添加自定義動畫
在 `useFrame` hook 中添加動畫邏輯：
```javascript
useFrame((state, delta) => {
  if (modelRef.current) {
    modelRef.current.rotation.y += delta * 0.1; // 旋轉動畫
  }
});
```

## 調試功能

### 查看燈光信息
打開瀏覽器控制台，可以看到提取的燈光信息：
```
發現燈光: {類型: "DirectionalLight", 顏色: "#ffffff", 強度: 1, 位置: [10, 10, 5]}
從模型中提取了 3 個燈光
```

### 啟用網格輔助線
取消註釋這一行來顯示網格：
```javascript
<gridHelper args={[10, 10]} />
```

## 故障排除

### 模型不顯示
1. 確認模型路徑正確：`/images/glb/chpapter1.glb`
2. 檢查瀏覽器控制台是否有加載錯誤
3. 確認模型文件大小合理（建議 < 50MB）

### 燈光效果不理想
1. 檢查控制台的燈光提取信息
2. 手動調整後備燈光的強度和位置
3. 考慮在 3D 建模軟件中調整燈光設置後重新導出

### 性能問題
1. 減少模型多邊形數量
2. 優化紋理大小
3. 減少燈光數量
4. 禁用陰影：移除 `castShadow` 屬性

## 未來擴展

可以添加的功能：
- [ ] 動畫播放控制
- [ ] 多個視角預設
- [ ] 燈光編輯器
- [ ] 截圖功能
- [ ] VR/AR 支持
- [ ] 後期處理效果（bloom、SSAO 等）

## 參考資源

- [Three.js 官方文檔](https://threejs.org/docs/)
- [React Three Fiber 文檔](https://docs.pmnd.rs/react-three-fiber/)
- [Drei 工具集](https://github.com/pmndrs/drei)

