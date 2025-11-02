/**
 * Chapter 1 灯光配置文件
 * 
 * 用于统一管理第一章 3D 场景中的灯光强度
 */

const Chapter1LightConfig = {
  // 配置版本号（用于追踪）
  configVersion: 27,  // 当前版本 - 提高曝光度以显示螢幕发光
  
  // 灯光强度系数（0.0 - 1.0）
  // 默认强度系数，用于没有特别指定的灯光
  lightIntensityMultiplier: 0.0001,
  
  // 针对特定灯光的强度系数配置（使用建模文件中的实际名称）
  specificLights: {
    // 极限降低所有灯光强度，解决严重过曝问题
    '吊燈light': 0.0005,          // 吊灯（原始强度: 7957）→ 最终: 3.98
    '檯燈light': 0.002,           // 台灯（原始强度: 260）→ 最终: 0.52
    '吉他light': 0.0008,          // 吉他灯（原始强度: 2313）→ 最终: 1.85
    '吊燈指向light': 0.00001,     // 吊灯指向（原始强度: 112326！超高）→ 最终: 1.12
    '玄關light': 0.0000004,       // 玄关灯（原始强度: 7579）→ 最终: 0.003
    
    // 窗户灯光
    '窗plight': 0.5,              // 窗户1（原始强度: 7421）→ 最终: 3710.78
    '窗2plight': 0.5,             // 窗户2（原始强度: 7279）→ 最终: 3639.87
    '玄關補光Plight': 0.0005,     // 玄关补光（原始强度: 1081）→ 最终: 0.54
  },
  
  // 基础环境光强度（Canvas 层级）- 极低
  baseAmbientLight: 0.00005,
  
  // 渲染器曝光度（0.0 - 2.0，默认 1.0）- 提高以显示发光材质
  toneMappingExposure: 0.001,
  
  // 材质自发光强度系数（0.0 - 1.0）- 大幅降低发光材质的亮度
  emissiveMultiplier: 0.0001,
  
  // 特定材质的自发光配置（直接设置 emissiveIntensity 值）
  specificEmissiveMaterials: {
    '螢幕': 10.0,              // 螢幕加强发光效果（3倍）
    '螢幕殼': 0.05,           // 螢幕壳稍微发光
    '檯燈燈罩': 0.1,          // 台灯灯罩适度发光
    // 其他材质自动使用 emissiveMultiplier
  },
  
  // 后备灯光配置（当模型中没有灯光时使用）- 提供基础照明
  fallbackLights: {
    ambient: 0,
    directional: 0,
    point: 0
  },
  
  // 是否在控制台显示灯光调试信息
  debugMode: true,
  
  // 预设配置（可快速切换）
  presets: {
    // 极限低（解决严重过曝）- 当前设置
    extremeLow: {
      multiplier: 0.002,
      baseAmbient: 0.0005,
      exposure: 0.05,
      emissive: 0.002
    },
    // 超低
    ultraLow: {
      multiplier: 0.005,
      baseAmbient: 0.001,
      exposure: 0.1,
      emissive: 0.005
    },
    // 极低
    veryLow: {
      multiplier: 0.01,
      baseAmbient: 0.005,
      exposure: 0.2,
      emissive: 0.01
    },
    // 低
    low: {
      multiplier: 0.05,
      baseAmbient: 0.01,
      exposure: 0.3,
      emissive: 0.05
    },
    // 暗（电影感）
    dark: {
      multiplier: 0.1,
      baseAmbient: 0.02,
      exposure: 0.5,
      emissive: 0.1
    },
    // 正常
    normal: {
      multiplier: 0.3,
      baseAmbient: 0.08,
      exposure: 0.8,
      emissive: 0.3
    },
    // 明亮
    bright: {
      multiplier: 0.7,
      baseAmbient: 0.2,
      exposure: 1.0,
      emissive: 0.7
    }
  }
};

export default Chapter1LightConfig;

