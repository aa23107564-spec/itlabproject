/**
 * Chapter 1 灯光配置文件
 * 
 * ⚠️ 重要：修改此文件后必须硬刷新浏览器（Ctrl+Shift+R）才能生效
 */

const Chapter1LightConfig = {
  // 配置版本号和时间戳（确保配置更新）
  configVersion: 36,
  lastUpdate: Date.now(), // 时间戳
  
  // 默认灯光强度系数
  lightIntensityMultiplier: 0.00001,
  
  // 各灯光的强度系数（原始强度都很高，需要大幅降低）
  specificLights: {
    // 主场景灯光 - 统一到相近范围
    '吊燈light': 0.00003,          // 吊灯 → 最终: 2.39
    '檯燈light': 0.002,           // 台灯 → 最终: 0.52
    '吉他light': 0.0005,          // 吉他灯 → 最终: 1.16
    '吊燈指向light': 0.000001,    // 吊灯指向 → 最终: 0.11
    '玄關light': 0.0000002,       // 玄关灯 → 最终: 0.0015
    
    // 窗户灯光 - 降低到合理范围（避免过曝）
    '窗plight': 0.08,            // 窗户1 → 最终: 7.42
    '窗2plight': 0.08,           // 窗户2 → 最终: 7.28
    '玄關補光Plight': 0.00001,     // 玄关补光 → 最终: 0.11
  },
  
  // 基础环境光
  baseAmbientLight: 0.0001,
  
  // 渲染器曝光度 - 平衡螢幕发光和整体亮度
  toneMappingExposure: 0.001,
  
  // 材质自发光系数
  emissiveMultiplier: 0.0001,
  
  // 特定材质的自发光配置
  specificEmissiveMaterials: {
    '螢幕': 1000.0,      // 螢幕强发光
    '螢幕殼': 0.1,     // 螢幕壳
    '檯燈燈罩': 0.15,  // 台灯灯罩
  },
  
  // 后备灯光
  fallbackLights: {
    ambient: 0,
    directional: 0,
    point: 0
  },
  
  // 调试模式
  debugMode: true,
  
  // 预设配置
  presets: {
    extremeLow: {
      multiplier: 0.00001,
      baseAmbient: 0.0001,
      exposure: 0.05,
      emissive: 0.00001
    },
    low: {
      multiplier: 0.0001,
      baseAmbient: 0.001,
      exposure: 0.1,
      emissive: 0.0001
    },
    normal: {
      multiplier: 0.001,
      baseAmbient: 0.01,
      exposure: 0.5,
      emissive: 0.001
    }
  }
};

export default Chapter1LightConfig;
