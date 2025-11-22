# 第一章最终设定 - 版本2

## 📅 更新日期
2025年11月2日

## ⚠️ 重要提示

**修改配置文件后，必须手动硬刷新浏览器才能生效！**
- Windows/Linux: `Ctrl + Shift + R` 或 `Ctrl + F5`
- Mac: `Cmd + Shift + R`

## 🎯 当前配置（Version 31）

### 全局设置
```javascript
configVersion: 31
toneMappingExposure: 0.12     // 渲染器曝光度（平衡）
baseAmbientLight: 0.0001      // 基础环境光
emissiveMultiplier: 0.00001   // 材质默认发光系数
debugMode: false              // 关闭调试
```

### 🔦 灯光强度设置

| 灯光名称 | 原始强度 | 系数 | 最终强度 |
|---------|---------|------|---------|
| 吊燈light | 7,957 | 0.00001 | 0.08 |
| 檯燈light | 260 | 0.0005 | 0.13 |
| 吉他light | 2,313 | 0.0002 | 0.46 |
| 吊燈指向light | 112,326 | 0.0000001 | 0.01 |
| 玄關light | 7,579 | 0.0000001 | 0.0008 |
| **窗plight** | 7,421 | 0.0001 | 0.74 |
| **窗2plight** | 7,279 | 0.0001 | 0.73 |
| 玄關補光Plight | 1,081 | 0.00001 | 0.01 |

### 📺 材质自发光设置

| 材质名称 | 发光强度 |
|---------|---------|
| **螢幕** | 15.0 |
| 螢幕殼 | 0.1 |
| 檯燈燈罩 | 0.15 |
| 其他材质 | × 0.00001 |

## 🔧 如何调整

### 调整灯光强度
编辑 `src/components/Chapter1LightConfig.js`：

```javascript
specificLights: {
  '窗plight': 0.0002,  // 改这个数值
}
```

保存后 **必须硬刷新浏览器**（Ctrl+Shift+R）

### 调整螢幕发光
```javascript
specificEmissiveMaterials: {
  '螢幕': 20.0,  // 改这个数值
}
```

保存后 **必须硬刷新浏览器**（Ctrl+Shift+R）

### 调整整体曝光
```javascript
toneMappingExposure: 0.1,  // 改这个数值（0.05 - 0.2 范围）
```

保存后 **必须硬刷新浏览器**（Ctrl+Shift+R）

## 📊 降低过曝的调整方案

如果还是过曝，按顺序尝试：

### 方案1：降低窗户灯光
```javascript
'窗plight': 0.00005,   // 降低50%
'窗2plight': 0.00005,
```

### 方案2：降低吊灯指向
```javascript
'吊燈指向light': 0.00000005,  // 再降低10倍
```

### 方案3：降低曝光度
```javascript
toneMappingExposure: 0.08,  // 从 0.12 降到 0.08
```

### 方案4：降低所有灯光
```javascript
// 将所有系数都除以 10
'吊燈light': 0.000001,
'檯燈light': 0.00005,
// ... 其他灯光
```

## 🎯 目标效果

- ✅ 消除过曝
- ✅ 螢幕清晰发光
- ✅ 窗户蓝光可见但不刺眼
- ✅ 有明暗对比和阴影
- ✅ 整体氛围温馨舒适

## 💾 文件位置

- 配置文件：`src/components/Chapter1LightConfig.js`
- 查看器组件：`src/components/Chapter1ModelViewer.jsx`
- 灯光文件：`public/images/glb/light.glb`
- 模型文件：`public/images/glb/chpapter1.glb`

---

**记住：每次修改配置后，必须按 Ctrl+Shift+R 硬刷新浏览器！**























