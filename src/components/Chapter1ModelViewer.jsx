import React, { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Chapter1LightConfig from './Chapter1LightConfig';

// 相机控制组件 - 使用 useLayoutEffect 同步应用相机数据
function CameraController({ cameraData, zoomFactor = 0.5, offsetX = 0, offsetY = 0, lookAtOffset = { x: 0, y: 0, z: 0 } }) {
  const { camera } = useThree();
  
  // 使用 useLayoutEffect 在 DOM 更新之前同步应用，避免闪现
  useLayoutEffect(() => {
    if (cameraData) {
      // 计算拉近后的相机位置
      // zoomFactor: 0 = 原始位置, 1 = 完全到场景中心
      const sceneCenter = new THREE.Vector3(lookAtOffset.x, lookAtOffset.y, lookAtOffset.z); // 场景中心点（可调整）
      const originalPosition = cameraData.position.clone();
      const direction = sceneCenter.clone().sub(originalPosition);
      const newPosition = originalPosition.clone().add(direction.multiplyScalar(zoomFactor));
      
      // 应用 X 和 Y 偏移量（用于左右、上下移动相机）
      newPosition.x += offsetX;
      newPosition.y += offsetY;
      
      // 设置调整后的相机位置
      camera.position.copy(newPosition);
      
      // 让相机看向调整后的场景中心
      camera.lookAt(sceneCenter);
      
      // 设置相机FOV（如果有）
      if (cameraData.fov && camera.isPerspectiveCamera) {
        camera.fov = cameraData.fov;
        camera.updateProjectionMatrix();
      }
      
      // 设置相机的near和far平面（如果有）
      if (cameraData.near !== undefined) {
        camera.near = cameraData.near;
      }
      if (cameraData.far !== undefined) {
        camera.far = cameraData.far;
      }
      
      camera.updateProjectionMatrix();
    }
  }, [camera, cameraData, zoomFactor, offsetX, offsetY, lookAtOffset]);
  
  return null;
}

// 场景旋转和缩放控制组件 - 根据选中物件旋转建模，处理放大动画
function SceneRotationController({ groupRef, selectedObject, isZoomed, interactiveModel }) {
  const rotationMapRef = useRef({
    mokaPot: 0,           // 默认视角，0度
    newNote: 70,          // 顺时针旋转 70 度
    oldNote: 15,          // 顺时针旋转 15 度
    sink: 20              // 顺时针旋转 20 度
  });
  
  // 每個物件的獨立偏移量設定（世界坐標系）⭐
  const offsetMapRef = useRef({
    mokaPot: { x: 8, y: 2, z: 4 },    // 摩卡壺偏移
    newNote: { x: 5, y: 1.5, z: 2 },    // 新筆記偏移
    oldNote: { x: 8, y: 1, z: 5 },    // 舊筆記偏移
    sink: { x: 7, y: 0, z: 6 }        // 水槽偏移（z: 5 → 6，往前移動）⭐
  });
  
  // 每個物件的獨立縮放倍數設定 ⭐
  const scaleMapRef = useRef({
    mokaPot: 6.0,   // 摩卡壺：放大 6 倍（8.0 - 2）⭐
    newNote: 8.0,   // 新筆記：放大 8 倍
    oldNote: 6.0,   // 舊筆記：放大 6 倍
    sink: 4.0       // 水槽：放大 4 倍（进一步减少放大程度）⭐
  });
  
  // 每個物件的旋轉中心偏移設定（手動微調）⭐
  const rotationCenterOffsetRef = useRef({
    mokaPot: { x: -0.1, y: 0, z: -0.35 },    // 摩卡壺：向下偏移0.3（調整旋轉中心）⭐
    newNote: { x: 0, y: 0, z: 0 },       // 新筆記旋轉中心偏移
    oldNote: { x: 0, y: 0, z: 0 },       // 舊筆記旋轉中心偏移
    sink: { x: 0, y: 0, z: 0 }           // 水槽旋轉中心偏移
  });
  
  const selectedParentRef = useRef(null);
  const originalParentTransformsRef = useRef(new Map()); // 改为 Map 存储所有父节点的原始变换
  const objectPivotOffsetsRef = useRef(new Map()); // 存储每个物件的旋转中心偏移 ⭐
  
  // 提取选中物件的父节点（empty）
  useEffect(() => {
    if (!interactiveModel || !interactiveModel.nodes || !selectedObject) return;
    
    // 从 nodes 中获取父节点
    if (interactiveModel.nodes[selectedObject]) {
      const parentNode = interactiveModel.nodes[selectedObject];
      selectedParentRef.current = parentNode;
      
      // 保存父节点的原始变换信息（每个物件保存一次）
      if (!originalParentTransformsRef.current.has(selectedObject)) {
        parentNode.updateMatrixWorld(true);
        originalParentTransformsRef.current.set(selectedObject, {
          position: parentNode.position.clone(),
          scale: parentNode.scale.clone(),
          rotation: parentNode.rotation.clone()
        });
      }
    } else {
      console.error(`❌ 未找到父节点: ${selectedObject}`);
      selectedParentRef.current = null;
      originalParentTransformRef.current = null;
    }
  }, [selectedObject, interactiveModel]);
  
  useFrame(() => {
    if (!groupRef.current || !selectedObject) return;
    
    // 1. 旋转动画
    const targetRotation = rotationMapRef.current[selectedObject] || 0;
    const targetRotationRad = (targetRotation * Math.PI) / 180;
    const currentRotation = groupRef.current.rotation.y;
    const rotationDiff = targetRotationRad - currentRotation;
    const lerpFactor = 0.1;
    const newRotation = currentRotation + rotationDiff * lerpFactor;
    groupRef.current.rotation.y = newRotation;
    
    // 2. 放大/缩小动画 - 处理所有物件 ⭐
    const scaleLerpFactor = 0.08;
    
    // 遍历所有已保存的父节点，确保所有非选中物件都回到原位 ⭐
    originalParentTransformsRef.current.forEach((original, objectName) => {
      if (!interactiveModel || !interactiveModel.nodes || !interactiveModel.nodes[objectName]) return;
      
      const parentNode = interactiveModel.nodes[objectName];
      const isCurrentObject = (objectName === selectedObject);
      
      // 决定目标状态：只有当前选中且 isZoomed 为 true 时才放大
      const shouldZoom = isCurrentObject && isZoomed;
      const objectScale = scaleMapRef.current[objectName] || 8.0;
      const targetScale = shouldZoom ? objectScale : 1.0;
      
      // 🐛 调试：偶尔打印所有物件状态
      
      // 缩放父节点（所有子物件会自动跟随，保持相对位置）
      parentNode.scale.x += (original.scale.x * targetScale - parentNode.scale.x) * scaleLerpFactor;
      parentNode.scale.y += (original.scale.y * targetScale - parentNode.scale.y) * scaleLerpFactor;
      parentNode.scale.z += (original.scale.z * targetScale - parentNode.scale.z) * scaleLerpFactor;
      
      if (shouldZoom) {
        // 放大时：使用世界坐标系计算，确保物件往相机的固定方向移动 ⭐
        
        // 1️⃣ 将原始局部位置转换为世界坐标
        const originalWorldPos = new THREE.Vector3().copy(original.position);
        const parentOfParent = parentNode.parent;
        if (parentOfParent) {
          parentOfParent.localToWorld(originalWorldPos);
        }
        
        // 2️⃣ 在世界坐标系中定义偏移（根据物件从 offsetMapRef 获取）⭐
        const offset = offsetMapRef.current[objectName] || { x: 3, y: 1, z: 4 };
        const worldOffsetX = offset.x;  // 屏幕向左
        const worldOffsetY = offset.y;  // 屏幕向上
        const worldOffsetZ = offset.z;  // 屏幕向前
        
        // 3️⃣ 计算目标世界位置（基于原始位置 + 偏移）
        const targetWorldPos = new THREE.Vector3(
          originalWorldPos.x + worldOffsetX,
          originalWorldPos.y + worldOffsetY,
          originalWorldPos.z + worldOffsetZ
        );
        
        // 4️⃣ 将目标世界位置转换回父节点的局部坐标系
        if (parentOfParent) {
          parentOfParent.worldToLocal(targetWorldPos);
        }
        
        // 5️⃣ 平滑插值到目标位置
        parentNode.position.x += (targetWorldPos.x - parentNode.position.x) * scaleLerpFactor;
        parentNode.position.y += (targetWorldPos.y - parentNode.position.y) * scaleLerpFactor;
        parentNode.position.z += (targetWorldPos.z - parentNode.position.z) * scaleLerpFactor;
        
        // 6️⃣ 自转动画：检测是否完全放大，如果是则开始自转 ⭐
        const currentScale = parentNode.scale.x;
        const targetScaleValue = original.scale.x * objectScale;
        const scaleProgress = currentScale / targetScaleValue;
        
        // 当缩放进度 >= 98% 时，认为已完全放大，开始自转
        if (scaleProgress >= 0.98) {
          // 获取旋转中心偏移配置 ⭐
          const pivotOffset = rotationCenterOffsetRef.current[objectName] || { x: 0, y: 0, z: 0 };
          
          if (pivotOffset.x !== 0 || pivotOffset.y !== 0 || pivotOffset.z !== 0) {
            // 有偏移：围绕偏移的中心旋转 ⭐
            
            // 1. 先将物体移动到偏移的旋转中心
            const tempPos = parentNode.position.clone();
            tempPos.x += pivotOffset.x;
            tempPos.y += pivotOffset.y;
            tempPos.z += pivotOffset.z;
            
            // 2. 执行旋转
            const rotationSpeed = 0.005;
            const oldRotation = parentNode.rotation.y;
            parentNode.rotation.y += rotationSpeed;
            
            // 3. 计算旋转导致的位置变化，并补偿
            const angle = rotationSpeed;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            
            // 旋转偏移向量
            const newOffsetX = pivotOffset.x * cos - pivotOffset.z * sin;
            const newOffsetZ = pivotOffset.x * sin + pivotOffset.z * cos;
            
            // 应用位置补偿
            parentNode.position.x += (pivotOffset.x - newOffsetX);
            parentNode.position.z += (pivotOffset.z - newOffsetZ);
          } else {
            // 无偏移：直接旋转
            parentNode.rotation.y += 0.005; // 旋转速度，可调整
          }
          
          // 调试：输出旋转信息（只输出一次）
          if (!parentNode.userData.rotationLogged) {
            parentNode.userData.rotationLogged = true;
            console.log(`🔄 物件自转 [${objectName}]:`, {
              旋转中心偏移: `(${pivotOffset.x}, ${pivotOffset.y}, ${pivotOffset.z})`,
              当前位置: `(${parentNode.position.x.toFixed(2)}, ${parentNode.position.y.toFixed(2)}, ${parentNode.position.z.toFixed(2)})`,
              '提示': '可在 rotationCenterOffsetRef 中调整 mokaPot 的 y 偏移值'
            });
          }
        } else {
          // 未完全放大时，保持原始旋转角度
          const originalRotationY = original.rotation.y;
          parentNode.rotation.y += (originalRotationY - parentNode.rotation.y) * scaleLerpFactor;
        }
      } else {
        // 缩小时（或非当前选中物件）：回到原始位置和旋转 ⭐
        parentNode.position.x += (original.position.x - parentNode.position.x) * scaleLerpFactor;
        parentNode.position.y += (original.position.y - parentNode.position.y) * scaleLerpFactor;
        parentNode.position.z += (original.position.z - parentNode.position.z) * scaleLerpFactor;
        
        // 恢复原始旋转角度 ⭐
        parentNode.rotation.x += (original.rotation.x - parentNode.rotation.x) * scaleLerpFactor;
        parentNode.rotation.y += (original.rotation.y - parentNode.rotation.y) * scaleLerpFactor;
        parentNode.rotation.z += (original.rotation.z - parentNode.rotation.z) * scaleLerpFactor;
        
        // 重置调试标记 ⭐
        if (parentNode.userData.rotationLogged) {
          parentNode.userData.rotationLogged = false;
        }
      }
    });
    
    // 更新 selectedParentRef 为当前选中的父节点
    if (interactiveModel && interactiveModel.nodes && interactiveModel.nodes[selectedObject]) {
      selectedParentRef.current = interactiveModel.nodes[selectedObject];
    }
  });
  
  // 调试：当选中物件改变时输出日志
  useEffect(() => {
    if (selectedObject) {
      const targetRotation = rotationMapRef.current[selectedObject] || 0;
    }
  }, [selectedObject]);
  
  // 调试：当放大状态改变时输出日志
  useEffect(() => {
    if (!selectedParentRef.current && isZoomed) {
      console.error(`❌ 错误：未找到父节点！`);
    }
  }, [isZoomed, selectedObject]);
  
  return null;
}

// 灯光组件 - 直接使用配置（修改配置后需要刷新浏览器）
function Light({ lightData, isZoomed }) {
  const multiplier = Chapter1LightConfig.specificLights[lightData.name] || 
                    Chapter1LightConfig.lightIntensityMultiplier;
  // 当 isZoomed 为 true 时，将场景灯光调弱到 20% ⭐
  const intensity = isZoomed ? (lightData.intensity * multiplier * 0.2) : (lightData.intensity * multiplier);
  
  const lightRef = useRef();
  
  switch (lightData.type) {
    case 'DirectionalLight':
      return (
        <directionalLight
          ref={lightRef}
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
          ref={lightRef}
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
      // SpotLight 需要使用 ref 来设置 target
      const SpotLightWithTarget = () => {
        const spotRef = useRef();
        
        useEffect(() => {
          if (spotRef.current && lightData.target) {
            // 设置 SpotLight 的目标位置
            spotRef.current.target.position.copy(lightData.target);
            spotRef.current.target.updateMatrixWorld();
          }
        }, []);
        
        return (
          <spotLight
            ref={spotRef}
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
      };
      return <SpotLightWithTarget />;
    case 'AmbientLight':
      return (
        <ambientLight
          ref={lightRef}
          name={lightData.name}
          color={lightData.color}
          intensity={intensity}
        />
      );
    case 'HemisphereLight':
      return (
        <hemisphereLight
          ref={lightRef}
          name={lightData.name}
          color={lightData.color}
          intensity={intensity}
          position={lightData.position.toArray()}
        />
      );
    case 'RectAreaLight':
      return (
        <rectAreaLight
          ref={lightRef}
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

// 交互物件管理组件 - 使用 Empty 物件（无实际 mesh）
function InteractiveObjects({ onObjectsExtracted, interactiveModel }) {
  const [extractedMeshes, setExtractedMeshes] = useState([]);
  
  useEffect(() => {
    // 定义 4 个 empty 交互物件（从左至右顺序）
    const emptyObjects = [
      { name: 'newNote', displayName: '新筆記' },
      { name: 'mokaPot', displayName: '摩卡壺' },
      { name: 'oldNote', displayName: '舊筆記' },
      { name: 'sink', displayName: '水槽' }
    ];
    
    // 提取每个物件的子 mesh
    if (interactiveModel && interactiveModel.scene) {
      const meshesMap = {};
      
      interactiveModel.scene.traverse((child) => {
        if (child.isMesh) {
          // 根据名称判断属于哪个物件
          emptyObjects.forEach(obj => {
            if (child.name && child.name.toLowerCase().includes(obj.name.toLowerCase())) {
              if (!meshesMap[obj.name]) {
                meshesMap[obj.name] = [];
              }
              meshesMap[obj.name].push(child);
            }
          });
        }
      });
      
      setExtractedMeshes(meshesMap);
    }
    
    if (onObjectsExtracted) {
      onObjectsExtracted(emptyObjects);
    }
  }, [onObjectsExtracted, interactiveModel]);
  
  return null;
}

// 控制主场景在放大时的光照效果 ⭐
function MainSceneLightController({ isZoomed, mainScene }) {
  const materialStatesRef = useRef(new Map()); // 存储每个材质的原始状态
  
  useFrame(() => {
    if (!mainScene) return;
    
    mainScene.traverse((child) => {
      if (child.isMesh && child.userData.isMainScene && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(mat => {
          const matId = mat.uuid;
          
          // 首次遇到这个材质时，保存原始状态
          if (!materialStatesRef.current.has(matId)) {
            materialStatesRef.current.set(matId, {
              originalColor: mat.color ? mat.color.clone() : new THREE.Color(0xffffff),
              originalEmissive: mat.emissive ? mat.emissive.clone() : new THREE.Color(0, 0, 0),
              originalEmissiveIntensity: mat.emissiveIntensity || 0
            });
          }
          
          const originalState = materialStatesRef.current.get(matId);
          
          if (isZoomed) {
            // 放大时：极度降低亮度 ⭐
            if (mat.color && originalState.originalColor) {
              mat.color.copy(originalState.originalColor).multiplyScalar(0.1); // 降到10%（极暗）
            }
            
            // 极度降低自发光
            if (mat.emissive && originalState.originalEmissive) {
              mat.emissive.copy(originalState.originalEmissive).multiplyScalar(0.1); // 降到10%
            }
            
            // 极度降低自发光强度
            mat.emissiveIntensity = originalState.originalEmissiveIntensity * 0.1; // 降到10%
          } else {
            // 正常时：完全恢复原始状态 ⭐
            if (mat.color && originalState.originalColor) {
              mat.color.copy(originalState.originalColor);
            }
            
            if (mat.emissive && originalState.originalEmissive) {
              mat.emissive.copy(originalState.originalEmissive);
            }
            
            mat.emissiveIntensity = originalState.originalEmissiveIntensity;
          }
        });
      }
    });
  });
  
  return null;
}

// 控制交互物件在放大时的金属材质效果 ⭐
function InteractiveObjectMaterialController({ selectedObject, isZoomed, interactiveModel }) {
  const materialStatesRef = useRef(new Map()); // 存储每个材质的原始状态
  const { gl } = useThree();
  
  // 定义哪些物件需要金属材质效果
  const metallicObjects = ['sink', 'mokaPot'];
  
  // 创建环境贴图用于金属反射 ⭐
  const envMapRef = useRef(null);
  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    pmremGenerator.compileEquirectangularShader();
    
    // 创建一个简单的环境场景 ⭐
    const envScene = new THREE.Scene();
    
    // 设置明亮的背景色
    envScene.background = new THREE.Color(0xcccccc);
    
    // 生成环境贴图
    envMapRef.current = pmremGenerator.fromScene(envScene).texture;
    
    pmremGenerator.dispose();
  }, [gl]);
  
  useFrame(() => {
    if (!interactiveModel || !interactiveModel.nodes || !selectedObject) return;
    
    // 只处理 sink 和 mokaPot
    if (!metallicObjects.includes(selectedObject)) return;
    
    const parentNode = interactiveModel.nodes[selectedObject];
    if (!parentNode) return;
    
    // 遍历选中物件的所有子 mesh
    parentNode.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(mat => {
          const matId = mat.uuid;
          
          // 首次遇到这个材质时，保存原始状态并检查类型
          if (!materialStatesRef.current.has(matId)) {
            materialStatesRef.current.set(matId, {
              originalMetalness: mat.metalness !== undefined ? mat.metalness : 0,
              originalRoughness: mat.roughness !== undefined ? mat.roughness : 1,
              originalColor: mat.color ? mat.color.clone() : new THREE.Color(0xffffff),
              originalEmissive: mat.emissive ? mat.emissive.clone() : new THREE.Color(0, 0, 0),
              originalEmissiveIntensity: mat.emissiveIntensity || 0,
              originalEnvMap: mat.envMap,
              originalEnvMapIntensity: mat.envMapIntensity || 1,
              materialType: mat.type
            });
            
            // 调试：输出材质类型
            console.log(`🔍 材质类型 [${child.name}]: ${mat.type}, metalness支持: ${mat.metalness !== undefined}`);
          }
          
          const originalState = materialStatesRef.current.get(matId);
          
          if (isZoomed) {
            // 放大时：根据原始材质增强金属效果 ⭐
            
            // 检查材质是否支持 metalness（MeshStandardMaterial 或 MeshPhysicalMaterial）
            if (mat.metalness !== undefined) {
              // 根据原始金属度决定增强程度 ⭐
              const originalMetalness = originalState.originalMetalness;
              const originalRoughness = originalState.originalRoughness;
              
              // 摩卡壶：强制所有部件都应用强金属效果（与 sink 金属部件相同）⭐
              if (selectedObject === 'mokaPot') {
                // 直接设置为强金属效果，不依赖原始值
                mat.metalness = 0.95;  // 95%金属度（与 sink 金属部件相同）
                mat.roughness = 0.15;  // 15%粗糙度（与 sink 金属部件相同）
                
                // 设置强环境贴图
                if (envMapRef.current) {
                  mat.envMap = envMapRef.current;
                  mat.envMapIntensity = 4.0; // 极强反射（增强到4.0）⭐
                }
                
                // 提亮颜色以增强金属感 ⭐
                if (mat.color && originalState.originalColor) {
                  mat.color.copy(originalState.originalColor).multiplyScalar(2.0); // 提亮100%
                }              
              }
              // 水槽：根据原始材质智能判断
              else if (selectedObject === 'sink') {
                // 如果原始金属度 > 0.3，则认为是金属部件，增强效果
                if (originalMetalness > 0.3) {
                  // 金属部件：大幅提升金属度，降低粗糙度
                  mat.metalness = Math.min(originalMetalness + 0.3, 1.0); // 增加30%，最高1.0
                  mat.roughness = Math.max(originalRoughness * 0.5, 0.05); // 降低到原来的50%，最低0.05
                  
                  // 设置环境贴图
                  if (envMapRef.current) {
                    mat.envMap = envMapRef.current;
                    mat.envMapIntensity = 2.5; // 金属部件强反射
                  }
                } else {
                  // 非金属部件：保持原始材质
                  mat.metalness = originalMetalness;
                  mat.roughness = originalRoughness;
                }
              }
              
              // 保留所有原始颜色和自发光 ⭐
              
              mat.needsUpdate = true;
              
              // 调试：确认金属效果已应用（每个材质只输出一次）
              if (!mat.userData.metalLogPrinted) {
                mat.userData.metalLogPrinted = true;
                const isMetalPart = selectedObject === 'mokaPot' ? '✅ 强制金属' : (originalMetalness > 0.3 ? '✅ 金属部件' : '❌ 非金属');
                console.log(`✨ 材质 [${selectedObject}] - ${child.name}:`, {
                  原始metalness: originalMetalness.toFixed(2),
                  应用metalness: mat.metalness.toFixed(2),
                  原始roughness: originalRoughness.toFixed(2),
                  应用roughness: mat.roughness.toFixed(2),
                  判定: isMetalPart,
                  envMap: mat.envMap ? '✅' : '❌',
                  color: `#${mat.color.getHexString()}`
                });
              }
            } else {
              // 材质不支持 metalness，输出警告
              if (!mat.userData.metalWarnPrinted) {
                mat.userData.metalWarnPrinted = true;
                console.warn(`⚠️ Mesh [${child.name}] - 材质 ${mat.type} 不支持 metalness`);
              }
            }
          } else {
            // 正常时：完全恢复原始材质属性 ⭐
            if (mat.metalness !== undefined) {
              mat.metalness = originalState.originalMetalness;
              mat.roughness = originalState.originalRoughness;
              mat.envMap = originalState.originalEnvMap;
              mat.envMapIntensity = originalState.originalEnvMapIntensity;
              
              // 恢复原始颜色和自发光（针对摩卡壶）⭐
              if (selectedObject === 'mokaPot') {
                if (mat.color && originalState.originalColor) {
                  mat.color.copy(originalState.originalColor);
                }
                if (mat.emissive && originalState.originalEmissive) {
                  mat.emissive.copy(originalState.originalEmissive);
                }
                mat.emissiveIntensity = originalState.originalEmissiveIntensity;
              }
              
              mat.needsUpdate = true;
              
              // 重置调试标记，允许下次放大时重新输出
              mat.userData.metalLogPrinted = false;
            }
          }
        });
      }
    });
  });
  
  return null;
}

// 放大物件的额外聚光灯组件 - 从左斜前上方45度照射 ⭐
function ZoomedObjectSpotLight({ selectedObject, isZoomed, interactiveModel }) {
  const spotLightRef = useRef();
  const targetRef = useRef();
  const helperSphereRef = useRef(); // 辅助球体，显示灯光位置 ⭐
  const helperLightRef = useRef(); // 辅助点光源 ⭐
  
  // 调试模式：是否显示灯光位置标记 ⭐
  const showLightHelper = false; // 改为 false 可隐藏标记
  
  
  // 每個物件的放大倍數（與 SceneRotationController 保持一致）⭐
  const scaleMultiplierRef = useRef({
    mokaPot: 6.0,   // 与 SceneRotationController 保持一致 ⭐
    newNote: 8.0,
    oldNote: 6.0,
    sink: 4.0       // 与 SceneRotationController 保持一致 ⭐
  });
  
  // 保存每個物件的原始縮放值 ⭐
  const originalScalesRef = useRef(new Map());
  
  // 保存每個物件的原始縮放值
  useEffect(() => {
    if (!interactiveModel || !interactiveModel.nodes) return;
    
    // 遍歷所有物件並保存原始縮放
    Object.keys(scaleMultiplierRef.current).forEach((objectName) => {
      if (interactiveModel.nodes[objectName] && !originalScalesRef.current.has(objectName)) {
        const parentNode = interactiveModel.nodes[objectName];
        const originalScale = parentNode.scale.x;
        originalScalesRef.current.set(objectName, originalScale);
      }
    });
  }, [interactiveModel]);
  
  // 每個物件的獨立聚光燈配置 ⭐
  const zoomLightConfigRef = useRef({
    mokaPot: {
      distance: 6,       // 基础距离
      offsetX: 0.3,     // 左右偏移（负值=左，正值=右）
      offsetY: 0.6,      // 上下偏移（正值=上，负值=下）
      offsetZ: -0.3,      // 前后偏移（正值=前，负值=后）
      intensity: 3200,    // 灯光强度（3350 - 150）⭐
      angle: Math.PI / 6,    // 照射角度（Math.PI/6 = 30度）
      penumbra: 0.3,     // 边缘柔和度 (0-1)
      color: 0xffffff    // 灯光颜色（十六进制）
    },
    newNote: {
      distance: 3,
      offsetX: -3.5,
      offsetY: 1,
      offsetZ: 2,
      intensity: 200,
      angle: Math.PI,
      penumbra: 0.3,
      color: 0xffffff
    },
    oldNote: {
      distance: 5.5,
      offsetX: 0.8,
      offsetY: 1.3,
      offsetZ: 0.3,
      intensity: 900,
      angle: Math.PI / 3,
      penumbra: 0.3,
      color: 0xffffff
    },
    sink: {
      distance: 4,
      offsetX: 0.7,
      offsetY: 0.8,
      offsetZ: 0,
      intensity: 1000,
      angle: Math.PI / 3,
      penumbra: 0.3,
      color: 0xffffff
    }
  });
  
  useFrame(() => {
    if (!spotLightRef.current || !targetRef.current || !selectedObject || !isZoomed) {
      // 不在放大状态时隐藏灯光和辅助标记
      if (spotLightRef.current) {
        spotLightRef.current.intensity = 0;
        spotLightRef.current.visible = false;
      }
      if (helperSphereRef.current) {
        helperSphereRef.current.visible = false;
      }
      if (helperLightRef.current) {
        helperLightRef.current.visible = false;
      }
      return;
    }
    
    // 获取当前选中物件的父节点
    if (!interactiveModel || !interactiveModel.nodes || !interactiveModel.nodes[selectedObject]) {
      return;
    }
    
    const parentNode = interactiveModel.nodes[selectedObject];
    
    // 获取物件的当前缩放（用于调整灯光距离）
    const objectScale = parentNode.scale.x;
    
    // 检查物件是否接近完全放大（只在接近完全放大时才显示聚光灯）⭐
    // 获取原始缩放和放大倍数
    const originalScale = originalScalesRef.current.get(selectedObject) || 1.0;
    const scaleMultiplier = scaleMultiplierRef.current[selectedObject] || 8.0;
    const targetScale = originalScale * scaleMultiplier; // 目标缩放 = 原始缩放 × 放大倍数 ⭐
    const scaleProgress = objectScale / targetScale; // 缩放进度（0-1）
    const showThreshold = 0.85; // 达到目标缩放的 85% 时才显示 ⭐
    
    if (scaleProgress < showThreshold) {
      // 还未接近完全放大，隐藏灯光和辅助标记
      spotLightRef.current.intensity = 0;
      spotLightRef.current.visible = false;
      if (helperSphereRef.current) {
        helperSphereRef.current.visible = false;
      }
      if (helperLightRef.current) {
        helperLightRef.current.visible = false;
      }
      return;
    }
    
    // 获取物件的世界位置
    const objectWorldPos = new THREE.Vector3();
    parentNode.getWorldPosition(objectWorldPos);
    
    // 獲取當前物件的專屬聚光燈配置 ⭐
    const config = zoomLightConfigRef.current[selectedObject] || zoomLightConfigRef.current.mokaPot;
    
    // 计算聚光灯位置：根据配置调整
    const distance = config.distance * objectScale; // 距离随缩放调整
    const offsetX = distance * config.offsetX;  // 左右偏移
    const offsetY = distance * config.offsetY;  // 上下偏移
    const offsetZ = distance * config.offsetZ;  // 前后偏移
    
    spotLightRef.current.position.set(
      objectWorldPos.x + offsetX,
      objectWorldPos.y + offsetY,
      objectWorldPos.z + offsetZ
    );
    
    // 更新辅助球体位置（显示灯光位置）⭐
    if (helperSphereRef.current && showLightHelper) {
      helperSphereRef.current.position.copy(spotLightRef.current.position);
      helperSphereRef.current.visible = true;
    }
    
    // 更新辅助点光源位置 ⭐
    if (helperLightRef.current && showLightHelper) {
      helperLightRef.current.position.copy(spotLightRef.current.position);
      helperLightRef.current.visible = true;
    }
    
    // 目标点指向物件中心
    targetRef.current.position.copy(objectWorldPos);
    
    // 设置聚光灯的 target
    if (spotLightRef.current.target !== targetRef.current) {
      spotLightRef.current.target = targetRef.current;
    }
    
    // 设置聚光灯属性（使用配置）⭐
    // 计算淡入效果：从 85% 到 100% 线性增加强度
    const fadeInRange = 1.0 - showThreshold; // 0.15
    const fadeInProgress = Math.min(1, (scaleProgress - showThreshold) / fadeInRange);
    const actualIntensity = config.intensity * fadeInProgress; // 根据进度调整强度 ⭐
    
    spotLightRef.current.intensity = actualIntensity;
    spotLightRef.current.visible = true;
    spotLightRef.current.angle = config.angle;
    spotLightRef.current.penumbra = config.penumbra;
    spotLightRef.current.color.setHex(config.color);
    spotLightRef.current.decay = 2;
    spotLightRef.current.distance = distance * 3;
  });
  
  return (
    <>
      <spotLight
        ref={spotLightRef}
        intensity={0}
        angle={Math.PI / 6}
        penumbra={0.3}
        decay={2}
        castShadow={false}
        visible={false}
      />
      <object3D ref={targetRef} />
      
      {/* 辅助可视化标记 - 显示灯光位置 ⭐ */}
      {showLightHelper && (
        <>
          {/* 发光球体标记 - 标记灯光位置 */}
          <mesh ref={helperSphereRef} visible={false}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color={0xffff00} transparent opacity={0.8} />
          </mesh>
          
          {/* 辅助点光源 - 让球体发光 */}
          <pointLight 
            ref={helperLightRef}
            color={0xffff00} 
            intensity={2} 
            distance={1}
            visible={false}
          />
        </>
      )}
    </>
  );
}

// Spot 灯光控制组件 - 直接控制 GLB 中的原始灯光
function InteractiveSpotLights({ spotLightsModel, selectedObject, isZoomed, interactiveModel }) {
  const spotLightRefsRef = useRef([]); // 存储原始 spotlight 引用
  const originalScalesRef = useRef(new Map()); // 存储每个物件的原始缩放值 ⭐
  
  // 初始化：找到所有 spot 灯光并存储引用
  useEffect(() => {
    if (!spotLightsModel || !spotLightsModel.scene) {
      console.error('❌ spotLightsModel 或 spotLightsModel.scene 未加载');
      return;
    }
    
    spotLightRefsRef.current = [];
    let totalNodes = 0;
    let lightNodes = 0;
    
    spotLightsModel.scene.traverse((child) => {
      totalNodes++;
      
      if (child.isLight) {
        lightNodes++;
      }
      
      if (child.isLight && child.type === 'SpotLight') {
        // 保存原始强度和位置
        const originalIntensity = child.intensity;
        const originalAngle = child.angle;
        const originalPosition = child.position.clone();
        
        // 调整 spotlight 直径（除了 mokaPotLight）
        if (child.name !== 'mokaPotLight') {
          child.angle = child.angle * 0.7; // 缩小 30%
        }
        
        // 调整特定灯光的位置
        if (child.name === 'newNoteLight') {
          // y 座标往正值（向上）
          child.position.y += 0;
          
          // z 座标往下（减小）
          child.position.z -= 0;
        }
        
        // 强制启用阴影投射
        child.castShadow = true;
        
        // 配置阴影质量
        if (child.shadow) {
          child.shadow.mapSize.width = 1024;  // 阴影贴图宽度
          child.shadow.mapSize.height = 1024; // 阴影贴图高度
          child.shadow.camera.near = 0.1;
          child.shadow.camera.far = 50;
          // SpotLight 阴影相机的 fov
          child.shadow.camera.fov = 30;
        }
        
        // 存储灯光引用和信息
        spotLightRefsRef.current.push({
          light: child,
          name: child.name,
          originalIntensity: originalIntensity,
          originalAngle: originalAngle,
          originalPosition: originalPosition
        });
        
        // 初始设为不可见
        child.intensity = 0;
        child.visible = false;
      }
    });
    
    if (spotLightRefsRef.current.length === 0) {
      console.error('❌ 错误：没有找到任何 Spot 灯光！请检查 interactive.glb 文件');
    }
  }, [spotLightsModel]);
  
  // 直接映射：物件名称 → 灯光名称（固定结果）
  const objectToLightMap = {
    'newNote': 'newNoteLight',
    'mokaPot': 'mokaPotLight',
    'oldNote': 'oldNoteLight',
    'sink': 'sinkLight'
  };
  
  // 保存每个物件的原始缩放值 ⭐
  useEffect(() => {
    if (!interactiveModel || !interactiveModel.nodes) return;
    
    // 遍历所有物件并保存原始缩放
    Object.keys(objectToLightMap).forEach((objectName) => {
      if (interactiveModel.nodes[objectName] && !originalScalesRef.current.has(objectName)) {
        const parentNode = interactiveModel.nodes[objectName];
        const originalScale = parentNode.scale.x; // 假设 x, y, z 缩放相同
        originalScalesRef.current.set(objectName, originalScale);
      }
    });
  }, [interactiveModel]);
  
  // 根据选中物件和放大状态更新灯光状态
  useFrame(() => {
    if (spotLightRefsRef.current.length === 0 || !selectedObject) return;
    
    // 获取当前物件对应的灯光名称
    const targetLightName = objectToLightMap[selectedObject];
    
    // 检测当前选中物件是否完全回到原位（缩放接近原始值）⭐
    let isObjectAtOriginalScale = false;
    let currentScale = 0;
    let originalScale = 1.0;
    
    if (interactiveModel && interactiveModel.nodes && interactiveModel.nodes[selectedObject]) {
      const parentNode = interactiveModel.nodes[selectedObject];
      currentScale = parentNode.scale.x;
      
      // 获取保存的原始缩放值
      if (originalScalesRef.current.has(selectedObject)) {
        originalScale = originalScalesRef.current.get(selectedObject);
      }
      
      // 比较当前缩放和原始缩放，允许 18% 的误差（提早显示）⭐
      const scaleDiff = Math.abs(currentScale - originalScale);
      const tolerance = originalScale * 0.18; // 18% 容差（更宽松，提早显示）
      isObjectAtOriginalScale = (scaleDiff <= tolerance);
    }
    
    // 更新每个灯光的状态
    spotLightRefsRef.current.forEach(({ light, name, originalIntensity }) => {
      const isMatched = (name === targetLightName);
      
      // 只有在匹配、未放大、且物件完全回到原位时才显示灯光 ⭐
      if (isMatched && !isZoomed && isObjectAtOriginalScale) {
        // 匹配的灯光且物件已回到原位：显示并应用强度配置
        const multiplier = Chapter1LightConfig.specificLights[name] || Chapter1LightConfig.lightIntensityMultiplier;
        light.intensity = originalIntensity * multiplier;
        light.visible = true;
      } else {
        // 不匹配的灯光、处于放大状态、或物件未回到原位：隐藏
        light.intensity = 0;
        light.visible = false;
      }
    });
  });
  
  return null; // 不需要渲染任何东西，直接修改原始灯光
}

// 3D 模型组件
function Model({ modelPath, lightPath, spotLightsPath, onCameraExtracted, onLightsExtracted, onObjectsExtracted, selectedObject, isZoomed }) {
  const rotationGroupRef = useRef(); // 用于包含所有需要旋转的元素
  const [lights, setLights] = useState([]);
  
  // 加载主 GLB 模型（Hooks 必須在頂層調用）
  const { scene, animations, cameras } = useGLTF(modelPath);
  
  // 加载统一的灯光 GLB 文件
  const lightModel = useGLTF(lightPath);
  
  // 加载交互 Spot 灯光 GLB 文件
  const spotLightsModel = useGLTF(spotLightsPath);
  
  useEffect(() => {
    if (scene && lightModel.scene && spotLightsModel.scene) {
      // 强制更新场景的世界矩阵
      lightModel.scene.updateMatrixWorld(true);
      spotLightsModel.scene.updateMatrixWorld(true);
      
      // 启用场景中所有物体的阴影接收和投射
      let meshCount = 0;
      
      // 为主场景的所有 mesh 启用阴影并设置标记 ⭐
      let mainSceneMeshCount = 0;
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          meshCount++;
          mainSceneMeshCount++;
          
          // 标记为主场景 mesh，用于后续控制光照 ⭐
          child.userData.isMainScene = true;
          
          // 保存原始材质属性，用于光照控制
          if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(mat => {
              if (!mat.userData.originalEmissive) {
                mat.userData.originalEmissive = mat.emissive ? mat.emissive.clone() : new THREE.Color(0, 0, 0);
                mat.userData.originalEmissiveIntensity = mat.emissiveIntensity || 0;
              }
            });
          }
        }
      });
      
      console.log(`✅ 主场景 ${mainSceneMeshCount} 个 Mesh 已标记`);
      
      // 为交互物件场景的所有 mesh 启用阴影 ⭐
      let interactiveMeshCount = 0;
      spotLightsModel.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          meshCount++;
          interactiveMeshCount++;
        }
      });
      
      console.log(`✅ 交互物件 ${interactiveMeshCount} 个 Mesh 已配置`);
      
      // 提取相机数据
      let extractedCamera = null;
      
      if (cameras && cameras.length > 0) {
        const camera = cameras[0]; // 使用第一个相机
        camera.updateMatrixWorld(true);
        
        const worldPosition = new THREE.Vector3();
        camera.getWorldPosition(worldPosition);
        
        const worldQuaternion = new THREE.Quaternion();
        camera.getWorldQuaternion(worldQuaternion);
        const worldRotation = new THREE.Euler().setFromQuaternion(worldQuaternion);
        
        extractedCamera = {
          position: worldPosition.clone(),
          rotation: worldRotation.clone(),
          fov: camera.fov,
          near: camera.near,
          far: camera.far,
          aspect: camera.aspect
        };
        
        // 通知父组件相机数据已提取
        if (onCameraExtracted) {
          onCameraExtracted(extractedCamera);
        }
      } else {
        console.warn('⚠️ 模型中没有找到相机数据');
      }
      
      // 提取模型中的灯光信息
      const extractedLights = [];
      
      lightModel.scene.traverse((child) => {
        // 检查是否为灯光对象（包括所有类型）
        if (child.isLight) {
          // 保存原始强度和名称
          const originalIntensity = child.intensity;
          const lightName = child.name || '未命名灯光';
          
          // 强制更新当前节点的世界矩阵
          child.updateMatrixWorld(true);
          
          // 获取本地坐标
          const localPosition = child.position.clone();
          
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
              child.target.updateMatrixWorld(true);
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
      
      if (extractedLights.length === 0) {
        console.error('❌ 警告：没有提取到任何灯光！请检查 light.glb 文件');
      }
      
      // 处理主场景模型中的材质自发光
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
              } else if (materialName.includes('螢幕') || materialName.includes('屏')) {
                // 螢幕材质 - 强制白色发光
                const screenIntensity = emissiveConfig && emissiveConfig['螢幕'] ? emissiveConfig['螢幕'] : 10.0;
                material.emissiveIntensity = screenIntensity;
                material.emissive.setRGB(1, 1, 1); // 白色发光
              } else {
                // 其他材质大幅降低发光
                material.emissiveIntensity = originalIntensity * Chapter1LightConfig.emissiveMultiplier;
              }
            }
          });
        }
      });
      
      setLights(extractedLights);
    }
  }, [scene, lightModel.scene, spotLightsModel.scene, cameras]); // 移除回调函数依赖，使用 useCallback 稳定它们
  
  // 单独的 effect 来调用回调，避免循环依赖
  useEffect(() => {
    if (lights.length > 0 && onLightsExtracted) {
      onLightsExtracted(lights);
    }
  }, [lights.length, onLightsExtracted]); // onLightsExtracted 现在用 useCallback 包装，不会变化
  
  // 监测灯光渲染状态（只运行一次）
  return (
    <>
      {/* 旋转组 - 包含场景、交互物件、Spot 灯光和主场景灯光 */}
      <group ref={rotationGroupRef}>
        <primitive object={scene} />
        
        {/* 显示 interactive.glb 的场景（包含所有子物件 mesh） */}
        <primitive object={spotLightsModel.scene} />
        
        {/* 控制主场景在放大时的光照 ⭐ */}
        <MainSceneLightController 
          isZoomed={isZoomed}
          mainScene={scene}
        />
        
        {/* 控制交互物件在放大时的金属材质效果 ⭐ */}
        <InteractiveObjectMaterialController 
          selectedObject={selectedObject}
          isZoomed={isZoomed}
          interactiveModel={spotLightsModel}
        />
        
        {/* 交互 Spot 灯光 - 根据选中物件和放大状态显示/隐藏 */}
        <InteractiveSpotLights 
          spotLightsModel={spotLightsModel}
          selectedObject={selectedObject}
          isZoomed={isZoomed}
          interactiveModel={spotLightsModel}
        />
        
        {/* 放大物件的额外聚光灯 - 从左斜前上方45度照射 ⭐ */}
        <ZoomedObjectSpotLight 
          selectedObject={selectedObject}
          isZoomed={isZoomed}
          interactiveModel={spotLightsModel}
        />
        
        {/* 渲染从 light.glb 提取的主场景灯光（放在 group 内，随场景旋转） */}
        {lights.length > 0 ? (
          lights.map((light, index) => (
            <Light key={`light-${index}-${light.name}`} lightData={light} isZoomed={isZoomed} />
          ))
        ) : (
          <group name="no-lights-placeholder" />
        )}
        
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
      </group>
      
      {/* 场景旋转和缩放控制 - 根据选中物件旋转整个组并处理放大动画 */}
      <SceneRotationController 
        groupRef={rotationGroupRef}
        selectedObject={selectedObject}
        isZoomed={isZoomed}
        interactiveModel={spotLightsModel}
      />
      
      {/* 交互物件管理 - 使用 Empty 物件 */}
      <InteractiveObjects 
        onObjectsExtracted={onObjectsExtracted}
        interactiveModel={spotLightsModel}
      />
    </>
  );
}

// 调试按钮组件 - 用于查看 mesh 信息
function DebugMeshButton() {
  const interactiveModel = useGLTF(`${process.env.PUBLIC_URL || ''}/images/glb/interactive.glb`);
  
  return (
    <button
      onClick={() => {
        // 调试：查看 interactive.glb 的所有 Mesh 和 Light
        if (interactiveModel && interactiveModel.scene) {
          const meshes = [];
          const lights = [];
          
          interactiveModel.scene.traverse((child) => {
            if (child.isMesh) {
              meshes.push(child.name || '(unnamed)');
            }
            if (child.isLight) {
              lights.push(`${child.name || '(unnamed)'} (${child.type})`);
            }
          });
          
          console.table({
            '总Mesh数': meshes.length,
            '总Light数': lights.length,
            'Meshes': meshes.join(', '),
            'Lights': lights.join(', ')
          });
        }
      }}
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(33, 150, 243, 0.9)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        border: '1px solid #2196F3',
        cursor: 'pointer',
        fontFamily: 'monospace',
        zIndex: 100
      }}
    >
      🔍 查看所有 Mesh
    </button>
  );
}

// 主要的 3D 查看器组件
function Chapter1ModelViewer() {
  const [showInfo, setShowInfo] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [cameraData, setCameraData] = useState(null);
  const lightsCountRef = useRef(0); // 使用 ref 而不是 state 来避免无限循环
  
  // 交互物件状态
  const [interactiveObjects, setInteractiveObjects] = useState([]);
  const [selectedObjectIndex, setSelectedObjectIndex] = useState(1); // 初始索引 1 = mokaPot
  const [selectedObjectName, setSelectedObjectName] = useState('mokaPot'); // 默认选中 mokaPot
  const [isZoomed, setIsZoomed] = useState(false); // 是否处于放大状态
  
  // 5秒后隐藏提示信息
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInfo(false);
      setIsLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  
  // 键盘事件监听器 - 左右方向键切换物件，下方向键放大/缩小
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (interactiveObjects.length === 0) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        // 向左切换（前一个物件）
        setSelectedObjectIndex((prevIndex) => {
          const newIndex = prevIndex === 0 ? interactiveObjects.length - 1 : prevIndex - 1;
          const newObjectName = interactiveObjects[newIndex].name;
          setSelectedObjectName(newObjectName);
          setIsZoomed(false); // 切换物件时重置放大状态
          return newIndex;
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        // 向右切换（后一个物件）
        setSelectedObjectIndex((prevIndex) => {
          const newIndex = prevIndex === interactiveObjects.length - 1 ? 0 : prevIndex + 1;
          const newObjectName = interactiveObjects[newIndex].name;
          setSelectedObjectName(newObjectName);
          setIsZoomed(false); // 切换物件时重置放大状态
          return newIndex;
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        // 切换放大/缩小状态
        setIsZoomed((prev) => {
          const newState = !prev;
          return newState;
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [interactiveObjects, selectedObjectName]);
  
  // 注意：自动选中第一个物件的逻辑已移到 handleObjectsExtracted 回调中
  
  // 相机数据提取回调（使用 useCallback 防止每次都创建新函数）
  const handleCameraExtracted = useCallback((camera) => {
    setCameraData(camera);
  }, []);
  
  // 灯光数据提取回调（使用 useCallback 防止每次都创建新函数）
  const handleLightsExtracted = useCallback((extractedLights) => {
    lightsCountRef.current = extractedLights.length;
  }, []);
  
  // 交互物件提取回调
  const handleObjectsExtracted = useCallback((extractedObjects) => {
    setInteractiveObjects(extractedObjects);
    
    // 自动选中 mokaPot（索引 1）
    if (extractedObjects.length > 0) {
      const mokaPotIndex = extractedObjects.findIndex(obj => obj.name === 'mokaPot');
      if (mokaPotIndex !== -1) {
        setSelectedObjectName('mokaPot');
        setSelectedObjectIndex(mokaPotIndex);
      } else {
        // 如果找不到 mokaPot，默认选第一个
        const firstObject = extractedObjects[0].name;
        setSelectedObjectName(firstObject);
        setSelectedObjectIndex(0);
      }
    }
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
        camera={{ 
          position: [0, 0, -100], // 设置一个远离场景的默认位置，避免闪现
          fov: 50,
          near: 0.1,
          far: 1000
        }}
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
          background: 'transparent',
          opacity: cameraData ? 1 : 0, // 相机数据加载前隐藏画布
          transition: 'opacity 0.3s ease-in'
        }}
      >
        {/* 应用模型中的相机数据 */}
        {cameraData && (
          <CameraController 
            cameraData={cameraData} 
            zoomFactor={0.9}        // 拉近程度：0=原始, 1=完全到中心
            offsetX={1}             // X轴偏移（正值=向右移动）
            offsetY={0}             // Y轴偏移（正值=向上移动）
            lookAtOffset={{ x:10, y: 3.8, z: 0 }}  // 相机看向的点
          />
        )}
        
        {/* 环境光和主光源作为基础照明（使用配置文件） */}
        <ambientLight intensity={Chapter1LightConfig.baseAmbientLight} />
        
        {/* 加载模型和灯光 */}
        <Model 
          modelPath={`${process.env.PUBLIC_URL || ''}/images/glb/main.glb`}
          lightPath={`${process.env.PUBLIC_URL || ''}/images/glb/light.glb`}
          spotLightsPath={`${process.env.PUBLIC_URL || ''}/images/glb/interactive.glb`}
          onCameraExtracted={handleCameraExtracted}
          onLightsExtracted={handleLightsExtracted}
          onObjectsExtracted={handleObjectsExtracted}
          selectedObject={selectedObjectName}
          isZoomed={isZoomed}
        />
        
        {/* Bloom 光晕效果已禁用 */}
        
        {/* 添加网格辅助线（可选，用于调试） */}
        {/* <gridHelper args={[10, 10]} /> */}
      </Canvas>
      
      {/* 加载提示 */}
      {!cameraData && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '20px 30px',
          borderRadius: '15px',
          fontSize: '16px',
          textAlign: 'center',
          pointerEvents: 'none',
          animation: 'pulse 1.5s ease-in-out infinite',
          zIndex: 100
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            加載場景中...
          </div>
        </div>
      )}
      
      
      {/* 选中物件提示 - 根据放大状态显示不同内容 */}
      {interactiveObjects.length > 0 && selectedObjectName && !isZoomed && (
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          color: '#FFD700',
          padding: '15px 30px',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: 'bold',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 100,
          border: '2px solid #FFD700',
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
          animation: 'fadeIn 0.3s ease-in'
        }}>
          <div style={{ marginBottom: '5px' }}>
            ✨ {selectedObjectName}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#ccc',
            fontWeight: 'normal'
          }}>
            ⬅️ 左键 / 右键 ➡️ 切换物件 ({selectedObjectIndex + 1}/{interactiveObjects.length})
            <br />
            ⬇️ 下键: 放大查看详情
          </div>
        </div>
      )}
      
      {/* 放大状态的 UI 界面 - 左侧物件 + 右侧文字说明 */}
      {isZoomed && selectedObjectName && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 100,
          animation: 'fadeIn 0.3s ease-in'
        }}>
          {/* 右侧文字说明区域 - 固定在右边，垂直居中 */}
          <div style={{
            position: 'absolute',
            top: '50%',
            right: '5%',
            transform: 'translateY(-50%)',
            width: '40%',
            maxWidth: '450px',
            minHeight: '400px',
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '35px',
            borderRadius: '15px',
            border: '2px solid #FFD700',
            boxShadow: '0 0 40px rgba(255, 215, 0, 0.4)',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              fontSize: '28px',
              color: '#FFD700',
              borderBottom: '2px solid #FFD700',
              paddingBottom: '10px'
            }}>
              {selectedObjectName === 'newNote' && '新筆記本'}
              {selectedObjectName === 'oldNote' && '舊筆記本'}
              {selectedObjectName === 'mokaPot' && '摩卡壺'}
              {selectedObjectName === 'sink' && '水槽'}
            </h2>
            
            <div style={{
              fontSize: '16px',
              lineHeight: '1.8',
              color: '#e0e0e0'
            }}>
              {selectedObjectName === 'newNote' && (
                <>
                  <p>這是一本嶄新的筆記本，裡面記錄著最近的想法和靈感。</p>
                  <p>封面光滑整潔，象徵著新的開始和無限可能。</p>
                </>
              )}
              {selectedObjectName === 'oldNote' && (
                <>
                  <p>這是一本陪伴多年的舊筆記本，頁面已經泛黃。</p>
                  <p>裡面記載著過去的回憶、想法和重要的筆記。</p>
                </>
              )}
              {selectedObjectName === 'mokaPot' && (
                <>
                  <p>經典的摩卡壺，用來煮製濃郁的義式咖啡。</p>
                  <p>每天早晨的咖啡香氣，是開始新一天的儀式。</p>
                </>
              )}
              {selectedObjectName === 'sink' && (
                <>
                  <p>簡約的水槽區域，保持著整潔的狀態。</p>
                  <p>這裡是日常生活中不可或缺的一部分。</p>
                </>
              )}
            </div>
            
            <div style={{
              marginTop: '25px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255, 215, 0, 0.3)',
              fontSize: '14px',
              color: '#999',
              textAlign: 'center'
            }}>
              ⬇️ 按下鍵返回
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.05); }
        }
      `}</style>
    </div>
  );
}

// 预加载模型
useGLTF.preload(`${process.env.PUBLIC_URL || ''}/images/glb/main.glb`);
useGLTF.preload(`${process.env.PUBLIC_URL || ''}/images/glb/light.glb`);
useGLTF.preload(`${process.env.PUBLIC_URL || ''}/images/glb/interactive.glb`);

export default Chapter1ModelViewer;


