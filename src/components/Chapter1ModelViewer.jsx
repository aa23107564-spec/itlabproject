import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import Chapter1LightConfig from './Chapter1LightConfig';

// 灯光组件 - 直接使用配置（修改配置后需要刷新浏览器）
function Light({ lightData }) {
  const multiplier = Chapter1LightConfig.specificLights[lightData.name] || 
                    Chapter1LightConfig.lightIntensityMultiplier;
  const intensity = lightData.intensity * multiplier;
  
  // 调试：输出每个灯光的配置应用情况（只在第一次渲染时输出）
  if (Chapter1LightConfig.debugMode && !window._lightDebugLogged) {
    if (!window._lightDebugStarted) {
      window._lightDebugStarted = true;
      console.log('\n════════════════════════════════════════');
      console.log('🔦 灯光配置加载信息');
      console.log('配置版本:', Chapter1LightConfig.configVersion);
      console.log('配置时间戳:', new Date(Chapter1LightConfig.lastUpdate).toLocaleTimeString());
      console.log('════════════════════════════════════════\n');
    }
    console.log(`💡 ${lightData.name}:`, {
      原始强度: lightData.intensity.toFixed(2),
      系数: multiplier,
      最终强度: intensity.toFixed(4)
    });
  }
  
  switch (lightData.type) {
    case 'DirectionalLight':
      return (
        <directionalLight
          name={lightData.name}
          color={lightData.color}
          intensity={intensity}
          position={lightData.position.toArray()}
          castShadow={lightData.castShadow}
        />
      );
    case 'PointLight':
      return (
        <pointLight
          name={lightData.name}
          color={lightData.color}
          intensity={intensity}
          position={lightData.position.toArray()}
          distance={lightData.distance}
          decay={lightData.decay}
          castShadow={lightData.castShadow}
        />
      );
    case 'SpotLight':
      return (
        <spotLight
          name={lightData.name}
          color={lightData.color}
          intensity={intensity}
          position={lightData.position.toArray()}
          angle={lightData.angle}
          penumbra={lightData.penumbra}
          distance={lightData.distance}
          decay={lightData.decay}
          castShadow={lightData.castShadow}
        />
      );
    case 'AmbientLight':
      return (
        <ambientLight
          name={lightData.name}
          color={lightData.color}
          intensity={intensity}
        />
      );
    case 'HemisphereLight':
      return (
        <hemisphereLight
          name={lightData.name}
          color={lightData.color}
          intensity={intensity}
          position={lightData.position.toArray()}
        />
      );
    case 'RectAreaLight':
      return (
        <rectAreaLight
          name={lightData.name}
          color={lightData.color}
          intensity={intensity}
          width={lightData.width}
          height={lightData.height}
          position={lightData.position.toArray()}
          rotation={lightData.rotation.toArray()}
        />
      );
    default:
      return null;
  }
}

// 3D 模型组件
function Model({ modelPath, lightPath }) {
  const modelRef = useRef();
  const [lights, setLights] = useState([]);
  const [error, setError] = useState(null);
  
  // 加载主 GLB 模型（添加錯誤處理）
  let scene, animations;
  try {
    const gltf = useGLTF(modelPath);
    scene = gltf.scene;
    animations = gltf.animations;
  } catch (err) {
    console.error('Failed to load model:', err);
    setError(err);
    return null;
  }
  
  // 加载统一的灯光 GLB 文件
  let lightModel;
  try {
    lightModel = useGLTF(lightPath);
  } catch (err) {
    console.error('Failed to load lights:', err);
  }
  
  useEffect(() => {
    if (scene && lightModel.scene) {
      // 提取模型中的灯光信息
      const extractedLights = [];
      
      lightModel.scene.traverse((child) => {
        // 检查是否为灯光对象（包括所有类型）
        if (child.isLight) {
          // 保存原始强度和名称
          const originalIntensity = child.intensity;
          const lightName = child.name || '未命名灯光';
          
          // 计算世界坐标位置（考虑父节点的变换）
          const worldPosition = new THREE.Vector3();
          child.getWorldPosition(worldPosition);
          
          // 计算世界坐标旋转
          const worldQuaternion = new THREE.Quaternion();
          child.getWorldQuaternion(worldQuaternion);
          const worldRotation = new THREE.Euler().setFromQuaternion(worldQuaternion);
          
          // 提取灯光信息并保存（使用世界坐标）
          const lightInfo = {
            name: lightName,
            type: child.type,
            color: child.color.clone(),
            intensity: originalIntensity,
            position: worldPosition.clone(),
            rotation: worldRotation.clone(),
            target: child.target ? (() => {
              const targetWorldPos = new THREE.Vector3();
              child.target.getWorldPosition(targetWorldPos);
              return targetWorldPos;
            })() : null,
            distance: child.distance,
            angle: child.angle,
            penumbra: child.penumbra,
            decay: child.decay,
            castShadow: child.castShadow
          };
          
          // 如果是 RectAreaLight，保存额外属性
          if (child.type === 'RectAreaLight') {
            lightInfo.width = child.width;
            lightInfo.height = child.height;
          }
          
          extractedLights.push(lightInfo);
          
          // 禁用模型中的原始灯光，使用我们自己创建的灯光
          child.intensity = 0;
          child.visible = false;
        }
      });
      
      // 处理主场景模型中的材质自发光
      console.log('\n🎨 处理材质自发光效果...');
      let emissiveMaterialsCount = 0;
      
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach(material => {
            if (material.emissive && material.emissiveIntensity > 0) {
              const materialName = material.name || '未命名材质';
              const originalIntensity = material.emissiveIntensity;
              emissiveMaterialsCount++;
              
              // 特定材质保留或增强发光效果
              const emissiveConfig = Chapter1LightConfig.specificEmissiveMaterials;
              
              if (emissiveConfig && emissiveConfig[materialName] !== undefined) {
                // 使用特定配置的绝对值
                const configValue = emissiveConfig[materialName];
                material.emissiveIntensity = configValue;
                // 确保发光颜色是白色或原始颜色
                if (materialName.includes('螢幕') || materialName.includes('屏')) {
                  material.emissive.setRGB(1, 1, 1); // 设置为白色发光
                }
                console.log(`  ✨ ${materialName}: 强度=${configValue}, 颜色=${material.emissive.getHexString()}`);
              } else if (materialName.includes('螢幕') || materialName.includes('屏')) {
                // 螢幕材质 - 强制白色发光
                const screenIntensity = emissiveConfig && emissiveConfig['螢幕'] ? emissiveConfig['螢幕'] : 10.0;
                material.emissiveIntensity = screenIntensity;
                material.emissive.setRGB(1, 1, 1); // 白色发光
                console.log(`  📺 ${materialName}: 强度=${screenIntensity}, 颜色=白色(#ffffff)`);
              } else {
                // 其他材质大幅降低发光
                material.emissiveIntensity = originalIntensity * Chapter1LightConfig.emissiveMultiplier;
                if (Chapter1LightConfig.debugMode) {
                  console.log(`  - ${materialName}: ${originalIntensity.toFixed(2)} → ${material.emissiveIntensity.toFixed(4)}`);
                }
              }
            }
          });
        }
      });
      
      console.log(`✅ 处理了 ${emissiveMaterialsCount} 个有自发光的材质\n`);
      
      setLights(extractedLights);
    }
  }, [scene, lightModel.scene]);
  
  return (
    <>
      <primitive object={scene} />
      
      {/* 渲染从模型中提取的灯光 */}
      {lights.map((light, index) => (
        <Light key={`light-${index}-${light.name}`} lightData={light} />
      ))}
      
      {/* 如果模型中没有灯光，添加基础照明（使用配置文件） */}
      {lights.length === 0 && (
        <>
          <ambientLight intensity={Chapter1LightConfig.fallbackLights.ambient} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={Chapter1LightConfig.fallbackLights.directional} 
            castShadow 
          />
          <pointLight 
            position={[-10, -10, -5]} 
            intensity={Chapter1LightConfig.fallbackLights.point} 
          />
        </>
      )}
    </>
  );
}

// 主要的 3D 查看器组件
function Chapter1ModelViewer() {
  const [showInfo, setShowInfo] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // 5秒后隐藏提示信息
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInfo(false);
      setIsLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: 'linear-gradient(135deg,rgb(67, 67, 67) 0%,rgb(35, 35, 35) 100%)'
    }}>
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        shadows
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: Chapter1LightConfig.toneMappingExposure
        }}
        onCreated={({ gl }) => {
          // 使用配置文件中的曝光度设置
          gl.toneMappingExposure = Chapter1LightConfig.toneMappingExposure;
          
          // 處理 WebGL 上下文丟失和恢復
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            console.warn('WebGL context lost - 可能是 GPU 記憶體不足');
            e.preventDefault(); // 阻止預設行為，嘗試恢復
          });
          
          gl.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored');
            window.location.reload(); // 恢復後重新載入頁面
          });
        }}
        style={{ 
          width: '100%', 
          height: '100%',
          background: 'transparent'
        }}
      >
        {/* 环境光和主光源作为基础照明（使用配置文件） */}
        <ambientLight intensity={Chapter1LightConfig.baseAmbientLight} />
        
        {/* 加载模型和灯光 */}
        <Model 
          modelPath={`${process.env.PUBLIC_URL || ''}/images/glb/chpapter1.glb`}
          lightPath={`${process.env.PUBLIC_URL || ''}/images/glb/light.glb`}
        />
        
        {/* 轨道控制器 - 允许用户旋转、缩放、平移视图 */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={20}
          maxPolarAngle={Math.PI / 1.5}
        />
        
        {/* 添加网格辅助线（可选，用于调试） */}
        {/* <gridHelper args={[10, 10]} /> */}
      </Canvas>
      
      {/* 控制说明 */}
      {showInfo && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '10px',
          fontSize: '14px',
          textAlign: 'center',
          pointerEvents: 'none',
          animation: 'fadeIn 0.5s ease-in',
          zIndex: 10
        }}>
          <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>
            🖱️ 操作提示
          </div>
          <div>左鍵拖動：旋轉視角 | 滾輪：縮放 | 右鍵拖動：平移</div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// 预加载模型
useGLTF.preload(`${process.env.PUBLIC_URL || ''}/images/glb/chpapter1.glb`);
useGLTF.preload(`${process.env.PUBLIC_URL || ''}/images/glb/light.glb`);

export default Chapter1ModelViewer;

