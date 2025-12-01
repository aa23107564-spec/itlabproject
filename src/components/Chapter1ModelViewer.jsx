import React, { useEffect, useState, useRef, useCallback, useLayoutEffect, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Chapter1LightConfig from './Chapter1LightConfig';
import '../styles/visualNovel.css';

const flashbackSegmentMap = {
  sink: [2, 3, 4],
  mokaPot: [1],
  oldNote: [1],
  newNote: []
};

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
function SceneRotationController({ groupRef, selectedObject, isZoomed, interactiveModel, pendingInstantZoomRef, initialUserZoomsRef }) {
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
    
    // 2. 放大/缩小动画 - 优化：只在需要时处理物件 ⭐
    // 第一次放大时使用更大的 lerp 因子，让动画更快更流畅
    const scaleLerpFactor = pendingInstantZoomRef.current ? 0.5 : 0.08;
    
    if (isZoomed && selectedObject) {
      // 放大时：只处理当前选中的物件
      const original = originalParentTransformsRef.current.get(selectedObject);
      if (original && interactiveModel?.nodes?.[selectedObject]) {
        const parentNode = interactiveModel.nodes[selectedObject];
        const objectScale = scaleMapRef.current[selectedObject] || 8.0;
        const targetScale = objectScale;
        
        // 缩放父节点（所有子物件会自动跟随，保持相对位置）
        parentNode.scale.x += (original.scale.x * targetScale - parentNode.scale.x) * scaleLerpFactor;
        parentNode.scale.y += (original.scale.y * targetScale - parentNode.scale.y) * scaleLerpFactor;
        parentNode.scale.z += (original.scale.z * targetScale - parentNode.scale.z) * scaleLerpFactor;
        
        // 放大时：使用世界坐标系计算，确保物件往相机的固定方向移动 ⭐
        
        // 优化：第一次放大时缓存世界坐标转换结果，避免每帧重复计算
        if (pendingInstantZoomRef.current && !parentNode.userData.cachedTargetPos) {
          // 1️⃣ 将原始局部位置转换为世界坐标
          const originalWorldPos = new THREE.Vector3().copy(original.position);
          const parentOfParent = parentNode.parent;
          if (parentOfParent) {
            parentOfParent.localToWorld(originalWorldPos);
          }
          
          // 2️⃣ 在世界坐标系中定义偏移（根据物件从 offsetMapRef 获取）⭐
          const offset = offsetMapRef.current[selectedObject] || { x: 3, y: 1, z: 4 };
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
          
          // 缓存目标位置，避免每帧重复计算
          parentNode.userData.cachedTargetPos = targetWorldPos.clone();
        }
        
        // 使用缓存的目标位置或实时计算
        let targetWorldPos;
        if (parentNode.userData.cachedTargetPos) {
          targetWorldPos = parentNode.userData.cachedTargetPos;
        } else {
          // 非第一次放大时，实时计算（保持原有逻辑）
          const originalWorldPos = new THREE.Vector3().copy(original.position);
          const parentOfParent = parentNode.parent;
          if (parentOfParent) {
            parentOfParent.localToWorld(originalWorldPos);
          }
          
          const offset = offsetMapRef.current[selectedObject] || { x: 3, y: 1, z: 4 };
          targetWorldPos = new THREE.Vector3(
            originalWorldPos.x + offset.x,
            originalWorldPos.y + offset.y,
            originalWorldPos.z + offset.z
          );
          
          if (parentOfParent) {
            parentOfParent.worldToLocal(targetWorldPos);
          }
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
          const pivotOffset = rotationCenterOffsetRef.current[selectedObject] || { x: 0, y: 0, z: 0 };

          if (pendingInstantZoomRef.current) {
            pendingInstantZoomRef.current = false;
            if (initialUserZoomsRef.current < 2) {
              initialUserZoomsRef.current += 1;
            }
            // 清除缓存，后续使用实时计算
            if (parentNode.userData.cachedTargetPos) {
              delete parentNode.userData.cachedTargetPos;
            }
          }
          
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
            console.log(`🔄 物件自转 [${selectedObject}]:`, {
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
      }
      
      // 处理其他需要回到原位的物件（只处理那些不在原位的）
      originalParentTransformsRef.current.forEach((otherOriginal, objectName) => {
        if (objectName === selectedObject) return; // 跳过当前选中的物件
        if (!interactiveModel?.nodes?.[objectName]) return;
        
        const otherParentNode = interactiveModel.nodes[objectName];
        const currentScale = otherParentNode.scale.x;
        const originalScale = otherOriginal.scale.x;
        
        // 只处理那些不在原位的物件（scale 不是 1.0 或位置不在原位）
        const scaleDiff = Math.abs(currentScale - originalScale);
        const posDiff = Math.abs(otherParentNode.position.x - otherOriginal.position.x) +
                       Math.abs(otherParentNode.position.y - otherOriginal.position.y) +
                       Math.abs(otherParentNode.position.z - otherOriginal.position.z);
        
        if (scaleDiff > 0.01 || posDiff > 0.01) {
          // 缩放回到原位
          otherParentNode.scale.x += (originalScale - otherParentNode.scale.x) * scaleLerpFactor;
          otherParentNode.scale.y += (otherOriginal.scale.y - otherParentNode.scale.y) * scaleLerpFactor;
          otherParentNode.scale.z += (otherOriginal.scale.z - otherParentNode.scale.z) * scaleLerpFactor;
          
          // 位置回到原位
          otherParentNode.position.x += (otherOriginal.position.x - otherParentNode.position.x) * scaleLerpFactor;
          otherParentNode.position.y += (otherOriginal.position.y - otherParentNode.position.y) * scaleLerpFactor;
          otherParentNode.position.z += (otherOriginal.position.z - otherParentNode.position.z) * scaleLerpFactor;
          
          // 恢复原始旋转角度
          otherParentNode.rotation.x += (otherOriginal.rotation.x - otherParentNode.rotation.x) * scaleLerpFactor;
          otherParentNode.rotation.y += (otherOriginal.rotation.y - otherParentNode.rotation.y) * scaleLerpFactor;
          otherParentNode.rotation.z += (otherOriginal.rotation.z - otherParentNode.rotation.z) * scaleLerpFactor;
          
          // 重置调试标记
          if (otherParentNode.userData.rotationLogged) {
            otherParentNode.userData.rotationLogged = false;
          }
        }
      });
    } else {
      // 缩小时：只处理不在原位的物件，跳过已在原位的物件
      originalParentTransformsRef.current.forEach((original, objectName) => {
        if (!interactiveModel?.nodes?.[objectName]) return;
        
        const parentNode = interactiveModel.nodes[objectName];
        const currentScale = parentNode.scale.x;
        const originalScale = original.scale.x;
        
        // 检查是否已在原位（scale 和 position 都接近原始值）
        const scaleDiff = Math.abs(currentScale - originalScale);
        const posDiff = Math.abs(parentNode.position.x - original.position.x) +
                       Math.abs(parentNode.position.y - original.position.y) +
                       Math.abs(parentNode.position.z - original.position.z);
        const rotDiff = Math.abs(parentNode.rotation.x - original.rotation.x) +
                       Math.abs(parentNode.rotation.y - original.rotation.y) +
                       Math.abs(parentNode.rotation.z - original.rotation.z);
        
        // 只处理那些不在原位的物件
        if (scaleDiff > 0.01 || posDiff > 0.01 || rotDiff > 0.01) {
          // 缩放回到原位
          parentNode.scale.x += (originalScale - parentNode.scale.x) * scaleLerpFactor;
          parentNode.scale.y += (original.scale.y - parentNode.scale.y) * scaleLerpFactor;
          parentNode.scale.z += (original.scale.z - parentNode.scale.z) * scaleLerpFactor;
          
          // 位置回到原位
          parentNode.position.x += (original.position.x - parentNode.position.x) * scaleLerpFactor;
          parentNode.position.y += (original.position.y - parentNode.position.y) * scaleLerpFactor;
          parentNode.position.z += (original.position.z - parentNode.position.z) * scaleLerpFactor;
          
          // 恢复原始旋转角度
          parentNode.rotation.x += (original.rotation.x - parentNode.rotation.x) * scaleLerpFactor;
          parentNode.rotation.y += (original.rotation.y - parentNode.rotation.y) * scaleLerpFactor;
          parentNode.rotation.z += (original.rotation.z - parentNode.rotation.z) * scaleLerpFactor;
          
          // 重置调试标记
          if (parentNode.userData.rotationLogged) {
            parentNode.userData.rotationLogged = false;
          }
        }
      });
    }
    
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
      // SpotLight 需要使用 ref 来设置 target，並確保 target 跟著父層一起旋轉
      const SpotLightWithTarget = () => {
        const spotRef = useRef();
        const targetRef = useRef();
        
        useEffect(() => {
          if (spotRef.current && targetRef.current) {
            spotRef.current.target = targetRef.current;
            if (lightData.target) {
              targetRef.current.position.copy(lightData.target);
            }
            targetRef.current.updateMatrixWorld(true);
          }
        }, [lightData.target]);
        
        return (
          <>
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
            {/* Target 物件掛在同一層級，確保跟隨父層變換 */}
            <object3D ref={targetRef} />
          </>
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
function Model({ modelPath, lightPath, spotLightsPath, onCameraExtracted, onLightsExtracted, onObjectsExtracted, selectedObject, isZoomed, pendingInstantZoomRef, initialUserZoomsRef }) {
  const rotationGroupRef = useRef(); // 用于包含所有需要旋转的元素
  const [lights, setLights] = useState([]);
  const [lightsLoaded, setLightsLoaded] = useState(false); // 追蹤燈光是否已成功加載
  const [useFallback, setUseFallback] = useState(true); // 初始時使用 fallback 燈光，避免畫面全黑
  const retryTimeoutRef = useRef(null); // 重試計時器
  const maxRetriesRef = useRef(5); // 最大重試次數（增加到5次）
  const retryCountRef = useRef(0); // 當前重試次數
  const timeoutRef = useRef(null); // 超時計時器
  
  // 加载主 GLB 模型（Hooks 必須在頂層調用）
  const { scene, animations, cameras } = useGLTF(modelPath);
  
  // 加载统一的灯光 GLB 文件
  const lightModel = useGLTF(lightPath);
  
  // 加载交互 Spot 灯光 GLB 文件
  const spotLightsModel = useGLTF(spotLightsPath);
  
  // 提取燈光的函數
  const extractLights = useCallback(() => {
    if (!scene || !lightModel.scene || !spotLightsModel.scene) {
      return [];
    }
    
    // 强制更新场景的世界矩阵
    lightModel.scene.updateMatrixWorld(true);
    spotLightsModel.scene.updateMatrixWorld(true);
    
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
    
    return extractedLights;
  }, [scene, lightModel.scene, spotLightsModel.scene]);
  
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
      const extractedLights = extractLights();
      
      if (extractedLights.length === 0) {
        console.warn(`⚠️ 警告：没有提取到任何灯光！重試次數: ${retryCountRef.current}/${maxRetriesRef.current}`);
        
        // 如果還沒達到最大重試次數，則重試
        if (retryCountRef.current < maxRetriesRef.current) {
          retryCountRef.current++;
          // 清除之前的計時器
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          
          // 使用遞歸函數進行重試
          const attemptRetry = (attemptNumber) => {
            retryTimeoutRef.current = setTimeout(() => {
              // 再次檢查場景是否已加載
              if (scene && lightModel.scene && spotLightsModel.scene) {
                const retryLights = extractLights();
                if (retryLights.length > 0) {
                  // 成功提取燈光
                  setLights(retryLights);
                  setLightsLoaded(true);
                  setUseFallback(false); // 成功加載，關閉 fallback
                  retryCountRef.current = 0; // 重置重試計數
                  if (retryTimeoutRef.current) {
                    clearTimeout(retryTimeoutRef.current);
                    retryTimeoutRef.current = null;
                  }
                  console.log(`✅ 重試成功（第 ${attemptNumber} 次）：成功提取 ${retryLights.length} 個燈光`);
                } else {
                  // 重試失敗，繼續重試（如果還沒達到最大次數）
                  if (retryCountRef.current < maxRetriesRef.current) {
                    retryCountRef.current++;
                    attemptRetry(attemptNumber + 1); // 遞歸調用
                  } else {
                    // 達到最大重試次數，使用 fallback 燈光
                    setLights([]);
                    setLightsLoaded(true);
                    setUseFallback(true); // 保持 fallback
                    console.warn('⚠️ 達到最大重試次數，將使用 fallback 燈光');
                  }
                }
              } else {
                // 場景還沒加載完成，繼續重試
                if (retryCountRef.current < maxRetriesRef.current) {
                  retryCountRef.current++;
                  attemptRetry(attemptNumber + 1); // 遞歸調用
                } else {
                  // 達到最大重試次數，使用 fallback 燈光
                  setLights([]);
                  setLightsLoaded(true);
                  setUseFallback(true); // 保持 fallback
                  console.warn('⚠️ 達到最大重試次數，將使用 fallback 燈光');
                }
              }
            }, 300 * attemptNumber); // 遞增延遲：300ms, 600ms, 900ms, 1200ms, 1500ms
          };
          
          attemptRetry(retryCountRef.current);
        } else {
          // 達到最大重試次數，使用 fallback 燈光
          setLights([]);
          setLightsLoaded(true);
          setUseFallback(true); // 保持 fallback
          console.warn('⚠️ 達到最大重試次數，將使用 fallback 燈光');
        }
      } else {
        // 成功提取燈光
        setLights(extractedLights);
        setLightsLoaded(true);
        setUseFallback(false); // 成功加載，關閉 fallback
        retryCountRef.current = 0; // 重置重試計數
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
        console.log(`✅ 成功提取 ${extractedLights.length} 個燈光`);
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
    }
  }, [scene, lightModel.scene, spotLightsModel.scene, cameras, extractLights]); // 添加 extractLights 依賴
  
  // 添加超時機制：如果燈光在 3 秒內沒有加載，確保使用 fallback
  useEffect(() => {
    // 清除之前的超時計時器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // 如果還沒有成功加載燈光，設置超時
    if (!lightsLoaded || lights.length === 0) {
      timeoutRef.current = setTimeout(() => {
        if (!lightsLoaded || lights.length === 0) {
          console.warn('⚠️ 燈光加載超時，確保使用 fallback 燈光');
          setLights([]);
          setLightsLoaded(true);
          setUseFallback(true); // 確保使用 fallback
        }
      }, 3000); // 縮短到 3 秒超時
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []); // 只在組件掛載時執行一次
  
  // 清理重試計時器
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);
  
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
        {lights.length > 0 && !useFallback ? (
          lights.map((light, index) => (
            <Light key={`light-${index}-${light.name}`} lightData={light} isZoomed={isZoomed} />
          ))
        ) : null}
        
        {/* 如果模型中没有灯光或燈光加載失敗，添加基础照明（使用配置文件） */}
        {/* 在燈光加載期間也顯示 fallback 燈光，避免畫面全黑 */}
        {useFallback && (
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
        pendingInstantZoomRef={pendingInstantZoomRef}
        initialUserZoomsRef={initialUserZoomsRef}
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
  // 章节开场文字与显示控制
  const introLinesRef = useRef([
    '他蜷縮在檯燈的光暈中，鍵盤的敲擊聲如鼓點般零碎的刺破房間中的寂靜。',
    '整個房間像是被遺棄的巢穴，米黃色的牆壁貼滿著雜亂的便利貼。',
    '各個字跡扭曲，是種不曾期望他人理解的隨意。',
    '書桌旁的摩卡壺肆意尖叫，咖啡的氣味猶如燒焦的記憶，瘋狂撕裂人的理性。',
    '對於咖啡杯而言，這是今晚的第五杯咖啡了，然而對他而言，這是星期一的第71個小時了。',
    '眼睛瞪的發直並纏繞著朱紅色的血絲，在焦躁地啃咬下指甲無力的滲出鮮血。',
    '我，作家，截稿如斷頭台，勒緊神經。',
    '「我要救贖...! 你他媽的憑什麼...操，市場到底要什麼?」',
    '開始看不清楚螢幕上的文字，一塊紅綠一塊黑的，方才清晰可見的章節現在變成血、墨扭曲而成的漩渦。',
    '好不容易看清了文字，但完全無法理解，看來腦袋已經無法清晰對文字進行解碼。',
    '一個英雄的故事，但卻在每一行都清楚的表示：',
    '「黷龘靁鸞灪讜驫贇朸纔羼躚霻靇邐矙鱻黌贔鼗」。',
    '太好了，真是一個賺人熱淚的校園故事!!',
    '無力的瞥向角落的電話，就在視線合上的一瞬。',
    '出版社的電話響起...',
    '「怎麼不她媽去死! 沒錢談什麼藝術?」',
    '轉瞬之間電話開始飛行並直直砸毀於牆壁。',
    '「。。。。。。。。。。」',
    '電話斷斷續續的撥接聲在毫無規則秩序的房間中來回遊蕩，規律的、還帶點雜音。'
  ]);
  const [introVisibleLines, setIntroVisibleLines] = useState([]);
  const [isIntroDone, setIsIntroDone] = useState(false);
  const [awaitingAnyKey, setAwaitingAnyKey] = useState(false);
  const [canShowModel, setCanShowModel] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [isWarmupDone, setIsWarmupDone] = useState(false);
  const [showIntroOverlay, setShowIntroOverlay] = useState(true); // 控制开场文字覆盖层显示
  const [introOpacity, setIntroOpacity] = useState(1); // 控制开场文字的透明度
  const [showVisualEffect, setShowVisualEffect] = useState(false); // 控制视觉效果（红色色块、文字扭曲）
  const introScrollRef = useRef(null);
  const typingLineIndexRef = useRef(0);
  const typingCharIndexRef = useRef(0);
  const typingActiveRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const awaitingAnyKeyRef = useRef(false);
  const phoneRingAudioRef = useRef(null); // 电话铃声音频引用
  const phoneCrashAudioRef = useRef(null); // 电话砸墙声音频引用
  const wallHitAudioRef = useRef(null); // 槌墙声音频引用
  const bloodSprayAudioRef = useRef(null); // 喷血声音频引用
  const noteDropAudioRef = useRef(null); // 笔记掉落声音频引用
  const coffeeBeanDropAudioRef = useRef(null); // 咖啡豆掉落声音频引用
  const continuousPenClickAudioRef = useRef(null); // 连续按笔声音频引用
  const punchStomachAudioRef = useRef(null); // 拳打肚子声音频引用
  const brokenPhoneAudioRef = useRef(null); // 坏掉电话声音频引用
  const rotateModelAudioRef = useRef(null); // 旋转建模声音频引用
  const sinkDripAudioRef = useRef(null); // 水槽水滴声音频引用
  const sinkDripTimerRef = useRef(null); // 水槽水滴声定时器引用
  const bgmAudioRef = useRef(null); // 第一章背景音乐引用
  const canShowModelRef = useRef(false); // 跟踪建模画面是否已显示
  const isSceneReadyRef = useRef(false); // 跟踪场景是否加载完成
  const isWarmupDoneRef = useRef(false); // 预热是否完成
  const pressedKeysRef = useRef(new Set()); // 跟踪当前按下的键，用于检测组合键
  const keyPressTimesRef = useRef({}); // 跟踪按键时间，用于检测短时间内按下的组合键
  const pendingKeyActionRef = useRef(null); // 用于延迟执行的单个键操作
  
  // 水槽文字内容（分段）
  const sinkTexts = useRef([
    '人類總是愛怪東怪西，總說要安靜才能專注，還為了讀書跑去咖啡廳。\n\n你雖可以說咖啡廳安靜，但你不會說咖啡廳比空無一人的家中還要安靜；\n\n人類是一個奇怪的生物，我們喜歡專注，因為專注會提高我們的行事效率。\n\n但此處我不是想討論這個。',
    '你有沒有一種經驗?在寧靜的深夜，當你不斷的想要入睡\n\n但你始終會聽到那該死的鄰居不知道他家哪一個破東西一直製造出規律的聲響而導致你徹夜未眠。\n\n咚..咚..咚..咚..\n\n你好想知道到底是什麼鬼東西可以造出這種失眠製造裝置。\n\n可是奇怪了，我們可以在人流來往的咖啡廳中專注工作。\n\n那麼區區一個永不間段規律滴水交響曲怎麼會難倒你專注地睡眠呢?',
    '大二的宿舍的夜晚，我本應該準備專注打稿，卻因為室友不斷按壓的筆聲、抖腳的頻率、身影輕微在餘光的晃動，不斷的分心，腦子亂。隨手敲出一段文字，干擾又從耳邊傳來...\n\n"',
    '我一拳灌在室友肚子\n\n輕扶住他的頭，讓他的鼻軟骨與我的膝蓋親密接觸\n\n年輕真好，倒頭就睡，這下可以好好打稿了\n\n"。',
    '反應過來發現，稿子上無意識的填滿我的幻想。',
    '啊啊，為什麼會說到這邊呢?真是奇怪...隨意的擺弄手中的咖啡杯，我好像又忘記了什麼。\n\n對了!\n\n寫寫寫寫寫寫寫，又想去哪裡了\n\n我的曠世巨作還滿懷欣喜的躺臥在從隔壁學校低價買回來的課桌椅上\n\n但我還是比較習慣稱他們為天才作家的書桌。\n\n「唉...我想也就這樣了吧」話落便站起身子，沒有任何緣由的環顧四周。\n\n……'
  ]);
  
  // 水槽文字显示状态
  const [sinkDisplayedText, setSinkDisplayedText] = useState('');
  const [sinkCurrentSegment, setSinkCurrentSegment] = useState(0);
  const [sinkIsTyping, setSinkIsTyping] = useState(false);
  const sinkTypewriterTimerRef = useRef(null);
  const sinkIsTypingRef = useRef(false); // 用于跟踪打字状态，避免闭包问题
  const sinkCurrentSegmentRef = useRef(0); // 用于跟踪当前段，避免闭包问题
  
  // 摩卡壺文字内容（分段）
  const mokaPotTexts = useRef([
    '「你好，大家好，我是新來的，人類」\n\n「不知道各位會不會介意我待在這裡?」\n\n「啊，對了，忘了跟大家說，敝人有在寫一些隨感...散文?不是不是，沒有到那種程度」\n\n「但你說可以出散文集?哇，不敢當不敢當」\n\n有云不知誰云，不做無敗!意思是只要不做就沒有失敗。\n\n話說剛剛是在誰在說話?\n\n摩卡壺?別鬧了，你吃咖啡豆，乖。\n\n話說這壺是誰送的，我沒怎麼印象?',
    '其實我從來不知道要寫什麼。\n\n「哇!你在寫小說嗎?好厲害，讓我看看!」\n\n「剛來到業界先慢慢習慣吧，我們看好你。」\n\n「反應確實不錯啊，你真是上無人能及!」\n\n「說過多少遍了，你就只會寫這種東西嗎...?」\n\n「"恭喜，來自***的投稿獲得本次的金獎"網站如此刊登著。」\n\n「你有想要嘗試其他創作嗎?」\n\n我不懂，我每次都是一樣的，為什麼每次都不一樣。',
    '阿，摩卡壺是編輯送的。\n\n上次新作開天窗，他的怒容......想到就顫抖。\n\n但突然想不起她的長相?算了，不記得、沒印象、算了。'
  ]);
  
  // 摩卡壺文字显示状态
  const [mokaPotDisplayedText, setMokaPotDisplayedText] = useState('');
  const [mokaPotCurrentSegment, setMokaPotCurrentSegment] = useState(0);
  const [mokaPotIsTyping, setMokaPotIsTyping] = useState(false);
  const mokaPotTypewriterTimerRef = useRef(null);
  const mokaPotIsTypingRef = useRef(false); // 用于跟踪打字状态，避免闭包问题
  const mokaPotCurrentSegmentRef = useRef(0); // 用于跟踪当前段，避免闭包问题
  
  // 旧笔记本文字内容（分段）
  const oldNoteTexts = useRef([
    '筆記是這樣子的\n\n人們會一直持續換新的筆記本，不是因為寫完了，而是因為要記錄的東西結束了。\n\n但為了區隔開不同的事物，就算還有空間，我們也不會因此而勉強自己再寫下去。\n\n沒錯。\n\n因為已經結束了，即便還能寫下去，不同的內容不會寫在同一本筆記本裡。\n\n更何況是不同人。',
    '大四那年，有個人說我懂人心。我們約會、散步，平凡得像是呼吸。\n\n「我們分手吧。」我的腦子裡只剩下劇情。\n\n「你連我的臉都記不清」分手?故事就這樣草草了結。\n\n我清楚地記得，確認關係的那天，手中的劇本寫到男女主角論及婚嫁，但怎麼也想不起來，\n\n我和她是怎麼認識的。'
  ]);
  
  // 旧笔记本文字显示状态
  const [oldNoteDisplayedText, setOldNoteDisplayedText] = useState('');
  const [oldNoteCurrentSegment, setOldNoteCurrentSegment] = useState(0);
  const [oldNoteIsTyping, setOldNoteIsTyping] = useState(false);
  const oldNoteTypewriterTimerRef = useRef(null);
  const oldNoteIsTypingRef = useRef(false); // 用于跟踪打字状态，避免闭包问题
  const oldNoteCurrentSegmentRef = useRef(0); // 用于跟踪当前段，避免闭包问题
  
  // 新笔记本文字内容（分段）
  const newNoteTexts = useRef([
    '阿，是放到這邊了，我就有印象我這幾天寫了靈感上去。\n\n幾天前的我早就預料到我現在的靈感匱乏了吧!我真是我自己的救世主。',
    '上頭有分別用不同字跡、不同顏色、不同規範，在同樣的位置寫滿了整個筆記。\n\n整個筆記，不分正面、背面，所有的空間被凌厲的內容填充得實實在在。\n\n彷彿作者根本就沒有意識到，這個筆記有其他內容存在。\n\n上面的混沌完全無法被理解，但可以確定有特定規律。',
    '「幹!這是三小?」\n\n筆記瞬間脫手，文字符號的混亂誘導出純粹的生理恐懼。\n\n「等等，我有印象...」\n\n拖動顫抖的手、再度撿起、打開外觀嶄新的筆記。\n\n方才看不清螢幕文字的雙眼，在左一塊綠右一塊紅的血、墨扭曲而成的漩渦中\n\n清晰的筆記內容展映在腦中。\n\n「這是我?呵...呵..呵.呵呵呵呵呵」',
    '壞掉的鈴聲從支離破碎的電話中響起。\n\n「快完成了」。'
  ]);
  
  // 新笔记本文字显示状态
  const [newNoteDisplayedText, setNewNoteDisplayedText] = useState('');
  const [newNoteCurrentSegment, setNewNoteCurrentSegment] = useState(0);
  const [newNoteIsTyping, setNewNoteIsTyping] = useState(false);
  const newNoteTypewriterTimerRef = useRef(null);
  const newNoteIsTypingRef = useRef(false); // 用于跟踪打字状态，避免闭包问题
  const newNoteCurrentSegmentRef = useRef(0); // 用于跟踪当前段，避免闭包问题

  const latestSelectionRef = useRef({ name: 'mokaPot', index: 1 });
  const hasPrewarmedZoomRef = useRef(false);
  const pendingInstantZoomRef = useRef(false);
  const initialUserZoomsRef = useRef(0);
  
  // 交互物件状态
  const [interactiveObjects, setInteractiveObjects] = useState([]);
  const [selectedObjectIndex, setSelectedObjectIndex] = useState(1); // 初始索引 1 = mokaPot
  const [selectedObjectName, setSelectedObjectName] = useState('mokaPot'); // 默认选中 mokaPot
  const [isZoomed, setIsZoomed] = useState(false); // 是否处于放大状态
  
  const currentSegmentIndex = useMemo(() => {
    switch (selectedObjectName) {
      case 'sink':
        return sinkCurrentSegment;
      case 'mokaPot':
        return mokaPotCurrentSegment;
      case 'oldNote':
        return oldNoteCurrentSegment;
      case 'newNote':
        return newNoteCurrentSegment;
      default:
        return null;
    }
  }, [selectedObjectName, sinkCurrentSegment, mokaPotCurrentSegment, oldNoteCurrentSegment, newNoteCurrentSegment]);
  
  const isFlashbackActive = useMemo(() => {
    if (!isZoomed || currentSegmentIndex === null || !selectedObjectName) return false;
    const segments = flashbackSegmentMap[selectedObjectName] || [];
    return segments.includes(currentSegmentIndex);
  }, [isZoomed, selectedObjectName, currentSegmentIndex]);
  
  const infoBoxTheme = useMemo(() => ({
    background: isFlashbackActive ? '#000000' : '#FFFFFF',
    textColor: isFlashbackActive ? '#FFFFFF' : '#000000',
    borderColor: isFlashbackActive ? '#FFFFFF' : '#000000'
  }), [isFlashbackActive]);
  
  const [flashOverlayState, setFlashOverlayState] = useState('none'); // 'none' | 'enter' | 'active' | 'exit'
  const flashOverlayTimerRef = useRef(null);
  const prevFlashbackActiveRef = useRef(false);
  const [isFlashbackComplete, setIsFlashbackComplete] = useState(true); // 闪回效果是否完成
  const flashOverlayKeyRef = useRef(0); // 用于强制重新渲染
  const [flashOverlayOpacity, setFlashOverlayOpacity] = useState(1); // 闪回覆盖层的透明度
  const [flashbackVideoOpacity, setFlashbackVideoOpacity] = useState(0); // 闪回视频的透明度
  const [whiteOverlayVisible, setWhiteOverlayVisible] = useState(false); // 全白覆盖层是否显示
  const whiteOverlayKeyRef = useRef(0); // 用于强制重新渲染全白覆盖层
  const flashbackVideoRef = useRef(null);
  const flashbackVideoSrc = useMemo(() => `${process.env.PUBLIC_URL || ''}/images/backgrounds/270108_tiny.mp4`, []);
  const pageFlipAudioRef = useRef(null); // 快速翻页声音效引用
  
  // 播放快速翻页声音效的辅助函数 - 立即播放，无延迟
  const playPageFlipSound = useCallback(() => {
    if (pageFlipAudioRef.current) {
      // 立即重置并播放，不等待 promise
      pageFlipAudioRef.current.currentTime = 0;
      try {
        const playPromise = pageFlipAudioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      } catch (e) {
        // 忽略播放错误
      }
    }
  }, []);

  // 初始化快速翻页声音效，预加载以确保即时播放
  useEffect(() => {
    const audio = new Audio(`${process.env.PUBLIC_URL || ''}/audio/sfx/快速翻頁聲.mp3`);
    audio.volume = 0.7;
    audio.preload = 'auto';
    // 提前加载音频
    audio.load();
    // 预播放以"解锁"音频（在用户第一次交互后）
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
    }).catch(() => {
      // 忽略初始播放错误（因为浏览器需要用户交互）
    });
    pageFlipAudioRef.current = audio;
    return () => {
      if (pageFlipAudioRef.current) {
        pageFlipAudioRef.current.pause();
        pageFlipAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const videoEl = flashbackVideoRef.current;
    if (!videoEl) return;
    if (flashOverlayState !== 'none') {
      videoEl.currentTime = 0;
      const playPromise = videoEl.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    } else {
      videoEl.pause();
      videoEl.currentTime = 0;
    }
  }, [flashOverlayState]);

  const shouldShowTriangle = useMemo(() => {
    if (!isZoomed || !selectedObjectName) return false;
    switch (selectedObjectName) {
      case 'sink':
        return !sinkIsTyping && sinkCurrentSegment < sinkTexts.current.length - 1;
      case 'mokaPot':
        return !mokaPotIsTyping && mokaPotCurrentSegment < mokaPotTexts.current.length - 1;
      case 'oldNote':
        return !oldNoteIsTyping && oldNoteCurrentSegment < oldNoteTexts.current.length - 1;
      case 'newNote':
        return !newNoteIsTyping && newNoteCurrentSegment < newNoteTexts.current.length - 1;
      default:
        return false;
    }
  }, [
    isZoomed,
    selectedObjectName,
    sinkIsTyping,
    sinkCurrentSegment,
    mokaPotIsTyping,
    mokaPotCurrentSegment,
    oldNoteIsTyping,
    oldNoteCurrentSegment,
    newNoteIsTyping,
    newNoteCurrentSegment
  ]);
  
  useEffect(() => {
    if (isFlashbackActive && !prevFlashbackActiveRef.current) {
      // 进入闪回：先显示全白覆盖层，然后淡出，同时播放视频
      if (flashOverlayTimerRef.current) clearTimeout(flashOverlayTimerRef.current);
      setIsFlashbackComplete(false); // 闪回开始，标记为未完成
      flashOverlayKeyRef.current += 1; // 强制重新渲染以触发动画
      whiteOverlayKeyRef.current += 1; // 强制重新渲染全白覆盖层
      setWhiteOverlayVisible(true); // 显示全白覆盖层
      setFlashOverlayState('enter');
      flashOverlayTimerRef.current = setTimeout(() => {
        setFlashOverlayState('active'); // 淡入完成后保持 active 状态（50%透明度）
        setWhiteOverlayVisible(false); // 隐藏全白覆盖层
        setIsFlashbackComplete(true); // 闪回完成，可以开始打字机动画
        flashOverlayTimerRef.current = null;
      }, 4000); // 淡入时间4秒（2秒淡出 + 2秒额外等待）
    } else if (isFlashbackActive && prevFlashbackActiveRef.current) {
      // 持续在闪回状态，保持 active
      if (flashOverlayState !== 'active') {
        setFlashOverlayState('active');
        setFlashOverlayOpacity(0.5); // 保持50%透明度
        setFlashbackVideoOpacity(1); // 视频保持完全不透明
      }
    } else if (!isFlashbackActive && prevFlashbackActiveRef.current) {
      // 退出闪回：显示全白覆盖层，然后淡出
      if (flashOverlayTimerRef.current) clearTimeout(flashOverlayTimerRef.current);
      setIsFlashbackComplete(false); // 闪回退出开始，标记为未完成
      flashOverlayKeyRef.current += 1; // 强制重新渲染
      whiteOverlayKeyRef.current += 1; // 强制重新渲染全白覆盖层
      setWhiteOverlayVisible(true); // 显示全白覆盖层
      setFlashOverlayState('exit');
      flashOverlayTimerRef.current = setTimeout(() => {
        setFlashOverlayState('none');
        setWhiteOverlayVisible(false); // 隐藏全白覆盖层
        setIsFlashbackComplete(true); // 闪回退出完成
        flashOverlayTimerRef.current = null;
      }, 2000); // 淡出时间2秒
    } else if (!isFlashbackActive && !prevFlashbackActiveRef.current) {
      // 如果不在闪回状态，确保完成状态为 true
      setIsFlashbackComplete(true);
      if (flashOverlayState !== 'none') {
        setFlashOverlayState('none');
      }
    }
    prevFlashbackActiveRef.current = isFlashbackActive;
  }, [isFlashbackActive, flashOverlayState]);
  
  useEffect(() => {
    return () => {
      if (flashOverlayTimerRef.current) {
        clearTimeout(flashOverlayTimerRef.current);
        flashOverlayTimerRef.current = null;
      }
    };
  }, []);
  
  useEffect(() => {
    if (!isSceneReady && cameraData && interactiveObjects.length > 0) {
      setIsSceneReady(true);
    }
  }, [cameraData, interactiveObjects, isSceneReady]);

  // 5秒后隐藏提示信息（保留，但不影响开场文字流程）
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInfo(false);
      setIsLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  
  // 开场文字：逐句逐字打字机动画，结束后提示按任意键继续；期间不显示建模
  useEffect(() => {
    const charDelayMs = 65;      // 每字延遲（放慢）
    const lineDelayMs = 600;     // 每句之間延遲（放慢）
    window.gameInteractionBlocked = true; // 阻止游戏交互
    setIntroVisibleLines(['']);  // 準備第一行
    setIsIntroDone(false);
    setAwaitingAnyKey(false);
    setShowIntroOverlay(true); // 显示开场文字覆盖层
    setIntroOpacity(1); // 重置透明度
    setShowVisualEffect(false); // 重置视觉效果
    awaitingAnyKeyRef.current = false;
    typingLineIndexRef.current = 0;
    typingCharIndexRef.current = 0;
    typingActiveRef.current = true;
    
    // 初始化电话铃声音频
    phoneRingAudioRef.current = new Audio(`${process.env.PUBLIC_URL || ''}/audio/sfx/電話鈴聲.mp3`);
    phoneRingAudioRef.current.loop = true; // 循环播放
    phoneRingAudioRef.current.volume = 0.7; // 设置音量
    
    // 初始化电话砸墙声音频
    phoneCrashAudioRef.current = new Audio(`${process.env.PUBLIC_URL || ''}/audio/sfx/電話砸牆聲.mp3`);
    phoneCrashAudioRef.current.volume = 0.7; // 设置音量
    
    // 初始化槌墙声音效
    wallHitAudioRef.current = new Audio(`${process.env.PUBLIC_URL || ''}/audio/sfx/槌牆聲.mp3`);
    wallHitAudioRef.current.volume = 0.7; // 设置音量
    wallHitAudioRef.current.preload = 'auto';
    
    // 初始化喷血声音效
    bloodSprayAudioRef.current = new Audio(`${process.env.PUBLIC_URL || ''}/audio/sfx/噴血聲.mp3`);
    bloodSprayAudioRef.current.volume = 0.7; // 设置音量
    bloodSprayAudioRef.current.preload = 'auto';
    
    // 初始化笔记掉落声音效
    noteDropAudioRef.current = new Audio(`${process.env.PUBLIC_URL || ''}/audio/sfx/筆記掉落聲.mp3`);
    noteDropAudioRef.current.volume = 0.7; // 设置音量
    noteDropAudioRef.current.preload = 'auto';
    
    // 初始化咖啡豆掉落声音效
    coffeeBeanDropAudioRef.current = new Audio(`${process.env.PUBLIC_URL || ''}/audio/sfx/咖啡豆掉落聲.mp3`);
    coffeeBeanDropAudioRef.current.volume = 0.7; // 设置音量
    coffeeBeanDropAudioRef.current.preload = 'auto';
    
    // 初始化连续按笔声音效
    continuousPenClickAudioRef.current = new Audio(`${process.env.PUBLIC_URL || ''}/audio/sfx/連續按筆聲.mp3`);
    continuousPenClickAudioRef.current.volume = 0.7; // 设置音量
    continuousPenClickAudioRef.current.preload = 'auto';
    
    // 初始化拳打肚子声音效
    punchStomachAudioRef.current = new Audio(`${process.env.PUBLIC_URL || ''}/audio/sfx/拳打肚子聲.mp3`);
    punchStomachAudioRef.current.volume = 1.0; // 设置音量（150%）
    punchStomachAudioRef.current.preload = 'auto';
    
    // 初始化坏掉电话声音效
    brokenPhoneAudioRef.current = new Audio(`${process.env.PUBLIC_URL || ''}/audio/sfx/壞掉電話聲.mp3`);
    brokenPhoneAudioRef.current.volume = 0.7; // 设置音量
    brokenPhoneAudioRef.current.preload = 'auto';
    
    // 初始化旋转建模声音效
    rotateModelAudioRef.current = new Audio(`${process.env.PUBLIC_URL || ''}/audio/sfx/建模旋轉聲.mp3`);
    rotateModelAudioRef.current.volume = 0.7; // 设置音量
    rotateModelAudioRef.current.preload = 'auto';
    
    // 初始化水槽水滴声音效
    sinkDripAudioRef.current = new Audio(`${process.env.PUBLIC_URL || ''}/audio/sfx/水槽水滴聲.mp3`);
    sinkDripAudioRef.current.volume = 0.5; // 设置音量
    sinkDripAudioRef.current.preload = 'auto';
    
    // 初始化第一章背景音乐
    bgmAudioRef.current = new Audio(`${process.env.PUBLIC_URL || ''}/audio/bgm/第一章bgm.mp3`);
    bgmAudioRef.current.volume = 0.5; // 设置音量
    bgmAudioRef.current.loop = false; // 不自动循环，手动控制
    bgmAudioRef.current.preload = 'auto'; // 预加载音频
    
    // 监听音频加载完成事件
    bgmAudioRef.current.addEventListener('canplaythrough', () => {
      // 音频加载完成后尝试播放
      if (bgmAudioRef.current && bgmAudioRef.current.paused) {
        bgmAudioRef.current.play().catch(err => {
          console.warn('播放背景音乐失败（自动播放被阻止）:', err);
          // 如果自动播放失败，等待用户交互后再播放
        });
      }
    });
    
    // 监听音乐结束事件，结束后等待1秒再重新播放
    bgmAudioRef.current.addEventListener('ended', () => {
      setTimeout(() => {
        if (bgmAudioRef.current) {
          bgmAudioRef.current.play().catch(err => {
            console.warn('播放背景音乐失败:', err);
          });
        }
      }, 1000); // 等待1秒
    });
    
    // 监听音频加载错误
    bgmAudioRef.current.addEventListener('error', (e) => {
      console.error('背景音乐加载失败:', e);
    });
    
    // 尝试开始播放背景音乐（如果浏览器允许自动播放）
    // 如果失败，会在用户第一次交互时通过其他事件触发播放
    bgmAudioRef.current.play().catch(err => {
      console.warn('播放背景音乐失败（可能需要用户交互）:', err);
    });
    
    // 在打字机动画开始时尝试播放背景音乐
    // 延迟一点时间，确保音频已加载
    setTimeout(() => {
      if (bgmAudioRef.current && bgmAudioRef.current.paused) {
        bgmAudioRef.current.play().catch(err => {
          console.warn('打字机动画开始时播放背景音乐失败:', err);
        });
      }
    }, 500);
    
    const tick = () => {
      if (!typingActiveRef.current) return;
      const lineIndex = typingLineIndexRef.current;
      const charIndex = typingCharIndexRef.current;
      const lines = introLinesRef.current;
      if (lineIndex >= lines.length) {
        typingActiveRef.current = false;
        setIsIntroDone(true);
        return;
      }
      
      // 特殊处理：索引8（视觉效果句子）不显示文字，直接触发视觉效果
      if (lineIndex === 8 && charIndex === 0) {
        // 播放喷血声音效
        if (bloodSprayAudioRef.current) {
          bloodSprayAudioRef.current.currentTime = 0;
          bloodSprayAudioRef.current.play().catch(err => {
            console.warn('播放喷血声失败:', err);
          });
        }
        // 触发视觉效果
        setShowVisualEffect(true);
        // 视觉效果持续3秒后，继续下一句
        setTimeout(() => {
          setShowVisualEffect(false);
          typingLineIndexRef.current = 9; // 跳到下一句（索引9）
          typingCharIndexRef.current = 0;
          setIntroVisibleLines(prev => [...prev, '']);
          typingTimeoutRef.current = setTimeout(tick, charDelayMs);
        }, 3000); // 视觉效果持续时间：3秒
        return;
      }
      
      const fullLine = lines[lineIndex];
      const nextCharIndex = charIndex + 1;
      if (nextCharIndex <= fullLine.length) {
        // 特殊处理：索引16（「轉瞬之間電話開始飛行並直直砸毀於牆壁」）播放到「並」字时播放音效
        // 「並」字在这句话中的位置是第10个字符（索引9）
        if (lineIndex === 16 && nextCharIndex === 10) {
          if (phoneCrashAudioRef.current) {
            phoneCrashAudioRef.current.play().catch(err => {
              console.warn('播放电话砸墙声失败:', err);
            });
          }
        }
        
        setIntroVisibleLines(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = fullLine.slice(0, nextCharIndex);
          return copy;
        });
        typingCharIndexRef.current = nextCharIndex;
        typingTimeoutRef.current = setTimeout(tick, charDelayMs);
      } else {
        // 本行完成
        const nextLine = lineIndex + 1;
        if (nextLine < lines.length) {
          typingLineIndexRef.current = nextLine;
          typingCharIndexRef.current = 0;
          
          // 特殊处理：第5句（索引4）完成后，停留5秒，然后淡出，清空所有文字，重新开始显示第6句（索引5）
          if (lineIndex === 4 && nextLine === 5) {
            // 停留5秒
            setTimeout(() => {
              // 触发淡出动画（opacity变为0）
              setIntroOpacity(0);
              // 等待淡出动画完成（约1秒）
              setTimeout(() => {
                // 清空所有显示的文字
                setIntroVisibleLines(['']);
                // 重置透明度为1
                setIntroOpacity(1);
                // 继续显示下一行
                typingTimeoutRef.current = setTimeout(tick, charDelayMs);
              }, 1000); // 淡出动画时间：1秒
            }, 5000); // 停留时间：5秒
          } 
          // 特殊处理：第7句（索引7）完成后，立即触发视觉效果，停留5秒，然后直接清空所有文字，跳过索引8直接到索引9（无淡出效果）
          else if (lineIndex === 7 && nextLine === 8) {
            // 播放喷血声音效
            if (bloodSprayAudioRef.current) {
              bloodSprayAudioRef.current.currentTime = 0;
              bloodSprayAudioRef.current.play().catch(err => {
                console.warn('播放喷血声失败:', err);
              });
            }
            // 立即触发视觉效果（模糊和红色色块）
            setShowVisualEffect(true);
            // 停留5秒（在这5秒内，视觉效果持续显示）
            setTimeout(() => {
              // 关闭视觉效果
              setShowVisualEffect(false);
              // 直接清空所有显示的文字（不淡出）
              setIntroVisibleLines(['']);
              // 跳过索引8（视觉效果句子），直接跳到索引9
              typingLineIndexRef.current = 9;
              typingCharIndexRef.current = 0;
              typingTimeoutRef.current = setTimeout(tick, charDelayMs);
            }, 5000); // 停留时间：5秒
          } 
          // 特殊处理：索引13（电话相关句子）完成后，播放电话铃声，停顿3秒，然后继续
          else if (lineIndex === 13 && nextLine === 14) {
            // 播放电话铃声
            if (phoneRingAudioRef.current) {
              phoneRingAudioRef.current.play().catch(err => {
                console.warn('播放电话铃声失败:', err);
              });
            }
            // 停顿3秒
            setTimeout(() => {
              setIntroVisibleLines(prev => [...prev, '']);
              typingTimeoutRef.current = setTimeout(tick, charDelayMs);
            }, 3000); // 停顿时间：3秒
          } else {
            // 正常情况：添加新行
            setTimeout(() => {
              setIntroVisibleLines(prev => [...prev, '']);
              typingTimeoutRef.current = setTimeout(tick, charDelayMs);
            }, lineDelayMs);
          }
        } else {
          // 最后一行完成
          typingActiveRef.current = false;
          setIsIntroDone(true);
        }
      }
    };
    
    const startTimer = setTimeout(tick, 300);
    
    // 开发模式：跳过打字机动画的快捷键（Ctrl+Shift+S）
    const handleSkipAnimation = (e) => {
      // 如果建模画面已显示，不再处理此事件
      if (canShowModelRef.current) return;
      // 只在开发环境启用（process.env.NODE_ENV === 'development'）
      if (process.env.NODE_ENV === 'development' && e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        // 停止打字机动画
        typingActiveRef.current = false;
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        clearTimeout(startTimer);
        
        // 关闭视觉效果（如果有）
        setShowVisualEffect(false);
        
        // 显示所有文字
        const allLines = introLinesRef.current;
        setIntroVisibleLines(allLines);
        
        // 播放电话铃声（因为跳过了所有动画，直接显示所有文字，所以应该播放）
        if (phoneRingAudioRef.current) {
          phoneRingAudioRef.current.play().catch(err => {
            console.warn('播放电话铃声失败:', err);
          });
        }
        
        // 直接进入等待按任意键状态
        setIsIntroDone(true);
        
        console.log('🚀 开发模式：已跳过打字机动画');
      }
    };
    
    const handleAnyKey = (e) => {
      // 如果建模画面已显示，不再处理此事件，让事件继续传播
      if (canShowModelRef.current) return;
      if (!awaitingAnyKeyRef.current) return;
      if (!isSceneReadyRef.current || !isWarmupDoneRef.current) return;
      
      // 尝试播放背景音乐（用户交互后应该可以播放）
      if (bgmAudioRef.current && bgmAudioRef.current.paused) {
        bgmAudioRef.current.play().catch(err => {
          console.warn('用户交互后播放背景音乐失败:', err);
        });
      }
      
      e.preventDefault();
      e.stopPropagation(); // 阻止事件继续传播
      
      // 尝试播放背景音乐（用户交互后应该可以播放）
      if (bgmAudioRef.current && bgmAudioRef.current.paused) {
        bgmAudioRef.current.play().catch(err => {
          console.warn('用户交互后播放背景音乐失败:', err);
        });
      }
      
      // 先更新 ref，确保其他监听器能立即看到最新状态
      awaitingAnyKeyRef.current = false;
      canShowModelRef.current = true;
      window.gameInteractionBlocked = false;
      
      // 然后更新状态
      setAwaitingAnyKey(false);
      setShowIntroOverlay(false); // 立即隐藏开场文字覆盖层
      setCanShowModel(true); // 立即显示建模界面
      
      // 使用 setTimeout 确保在下一个事件循环中移除监听器，避免在事件处理过程中移除
      setTimeout(() => {
        window.removeEventListener('keydown', handleAnyKey);
        window.removeEventListener('keydown', handleSkipAnimation);
      }, 0);
      
      // 淡出电话铃声（在后台进行，不阻塞界面显示）
      if (phoneRingAudioRef.current) {
        const fadeOutDuration = 1000; // 淡出时间：1秒
        const fadeOutInterval = 50; // 每50ms降低一次音量
        const volumeStep = phoneRingAudioRef.current.volume / (fadeOutDuration / fadeOutInterval);
        
        const fadeOutTimer = setInterval(() => {
          if (phoneRingAudioRef.current) {
            phoneRingAudioRef.current.volume = Math.max(0, phoneRingAudioRef.current.volume - volumeStep);
            if (phoneRingAudioRef.current.volume <= 0) {
              clearInterval(fadeOutTimer);
              phoneRingAudioRef.current.pause();
              phoneRingAudioRef.current.currentTime = 0; // 重置播放位置
              phoneRingAudioRef.current.volume = 0.7; // 恢复音量以便下次使用
            }
          }
        }, fadeOutInterval);
      }
    };
    window.addEventListener('keydown', handleAnyKey);
    window.addEventListener('keydown', handleSkipAnimation);
    
    return () => {
      typingActiveRef.current = false;
      clearTimeout(startTimer);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      window.removeEventListener('keydown', handleAnyKey);
      window.removeEventListener('keydown', handleSkipAnimation);
      // 停止并清理音频
      if (phoneRingAudioRef.current) {
        phoneRingAudioRef.current.pause();
        phoneRingAudioRef.current.currentTime = 0;
        phoneRingAudioRef.current = null;
      }
      if (phoneCrashAudioRef.current) {
        phoneCrashAudioRef.current.pause();
        phoneCrashAudioRef.current.currentTime = 0;
        phoneCrashAudioRef.current = null;
      }
      if (wallHitAudioRef.current) {
        wallHitAudioRef.current.pause();
        wallHitAudioRef.current.currentTime = 0;
        wallHitAudioRef.current = null;
      }
      if (bloodSprayAudioRef.current) {
        bloodSprayAudioRef.current.pause();
        bloodSprayAudioRef.current.currentTime = 0;
        bloodSprayAudioRef.current = null;
      }
      if (noteDropAudioRef.current) {
        noteDropAudioRef.current.pause();
        noteDropAudioRef.current.currentTime = 0;
        noteDropAudioRef.current = null;
      }
      if (coffeeBeanDropAudioRef.current) {
        coffeeBeanDropAudioRef.current.pause();
        coffeeBeanDropAudioRef.current.currentTime = 0;
        coffeeBeanDropAudioRef.current = null;
      }
      if (continuousPenClickAudioRef.current) {
        continuousPenClickAudioRef.current.pause();
        continuousPenClickAudioRef.current.currentTime = 0;
        continuousPenClickAudioRef.current = null;
      }
      if (punchStomachAudioRef.current) {
        punchStomachAudioRef.current.pause();
        punchStomachAudioRef.current.currentTime = 0;
        punchStomachAudioRef.current = null;
      }
      if (brokenPhoneAudioRef.current) {
        brokenPhoneAudioRef.current.pause();
        brokenPhoneAudioRef.current.currentTime = 0;
        brokenPhoneAudioRef.current = null;
      }
      if (rotateModelAudioRef.current) {
        rotateModelAudioRef.current.pause();
        rotateModelAudioRef.current.currentTime = 0;
        rotateModelAudioRef.current = null;
      }
      if (sinkDripAudioRef.current) {
        sinkDripAudioRef.current.pause();
        sinkDripAudioRef.current.currentTime = 0;
        sinkDripAudioRef.current = null;
      }
      if (sinkDripTimerRef.current) {
        clearInterval(sinkDripTimerRef.current);
        sinkDripTimerRef.current = null;
      }
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current.currentTime = 0;
        bgmAudioRef.current = null;
      }
    };
  }, []);
  
  // 监听水槽放大状态，播放水滴声
  useEffect(() => {
    // 只有在建模画面已显示时才播放水滴声，避免开场动画时误播放
    if (!canShowModel) {
      // 如果建模画面未显示，确保停止定时器
      if (sinkDripTimerRef.current) {
        clearInterval(sinkDripTimerRef.current);
        sinkDripTimerRef.current = null;
      }
      return;
    }
    
    const isSinkZoomed = isZoomed && selectedObjectName === 'sink';
    
    if (isSinkZoomed) {
      // 水槽放大时，立即播放一次，然后每隔3秒播放一次
      if (sinkDripAudioRef.current) {
        sinkDripAudioRef.current.currentTime = 0;
        sinkDripAudioRef.current.play().catch(err => {
          console.warn('播放水槽水滴声失败:', err);
        });
      }
      
      // 设置定时器，每隔3秒播放一次
      sinkDripTimerRef.current = setInterval(() => {
        if (sinkDripAudioRef.current) {
          sinkDripAudioRef.current.currentTime = 0;
          sinkDripAudioRef.current.play().catch(err => {
            console.warn('播放水槽水滴声失败:', err);
          });
        }
      }, 3000); // 3秒 = 3000毫秒
    } else {
      // 水槽缩小时，只停止定时器，让当前正在播放的音效继续播放完
      if (sinkDripTimerRef.current) {
        clearInterval(sinkDripTimerRef.current);
        sinkDripTimerRef.current = null;
      }
      // 不立即停止音频，让它自然播放完
      // 音频会在播放完成后自动停止
    }
    
    // 清理函数
    return () => {
      if (sinkDripTimerRef.current) {
        clearInterval(sinkDripTimerRef.current);
        sinkDripTimerRef.current = null;
      }
    };
  }, [isZoomed, selectedObjectName, canShowModel]);
  
  // 新字出現時自動滾動至底部，避免超出螢幕
  useEffect(() => {
    if (introScrollRef.current) {
      introScrollRef.current.scrollTop = introScrollRef.current.scrollHeight;
    }
  }, [introVisibleLines]);
  
  // 同步 canShowModel 状态到 ref
  useEffect(() => {
    canShowModelRef.current = canShowModel;
  }, [canShowModel]);
  
  useEffect(() => {
    isSceneReadyRef.current = isSceneReady;
  }, [isSceneReady]);

useEffect(() => {
  isWarmupDoneRef.current = isWarmupDone;
}, [isWarmupDone]);
  
  // 同步 awaitingAnyKey 状态到 ref
  useEffect(() => {
    awaitingAnyKeyRef.current = awaitingAnyKey;
  }, [awaitingAnyKey]);

  useEffect(() => {
    latestSelectionRef.current = { name: selectedObjectName, index: selectedObjectIndex };
  }, [selectedObjectName, selectedObjectIndex]);

  useEffect(() => {
    if (!isSceneReady || !showIntroOverlay || hasPrewarmedZoomRef.current || interactiveObjects.length === 0) return;
    hasPrewarmedZoomRef.current = true;
    setIsWarmupDone(false);
    isWarmupDoneRef.current = false;

    let cancelled = false;
    const originalSelection = latestSelectionRef.current;
    const warmList = interactiveObjects.map((obj, index) => ({ name: obj.name, index }));
    let idx = 0;

    const warmUpNext = () => {
      if (cancelled) return;
      if (idx >= warmList.length) {
        setSelectedObjectName(originalSelection.name);
        setSelectedObjectIndex(originalSelection.index);
        setIsZoomed(false);
        setIsWarmupDone(true);
        isWarmupDoneRef.current = true;
        return;
      }
      const target = warmList[idx];
      setSelectedObjectIndex(target.index);
      setSelectedObjectName(target.name);
      setIsZoomed(true);
      setTimeout(() => {
        if (cancelled) return;
        setIsZoomed(false);
        idx += 1;
        setTimeout(warmUpNext, 80);
      }, 140);
    };

    const startTimer = setTimeout(warmUpNext, 120);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
    };
  }, [isSceneReady, showIntroOverlay, interactiveObjects]);

  useEffect(() => {
    if (!isSceneReady || !showIntroOverlay || hasPrewarmedZoomRef.current || interactiveObjects.length === 0) return;
    hasPrewarmedZoomRef.current = true;
    let cancelled = false;
    const originalSelection = latestSelectionRef.current;
    const warmList = interactiveObjects.map((obj, index) => ({ name: obj.name, index }));
    let idx = 0;

    const warmUpNext = () => {
      if (cancelled) return;
      if (idx >= warmList.length) {
        setSelectedObjectName(originalSelection.name);
        setSelectedObjectIndex(originalSelection.index);
        setIsZoomed(false);
        return;
      }
      const target = warmList[idx];
      setSelectedObjectIndex(target.index);
      setSelectedObjectName(target.name);
      setIsZoomed(true);
      setTimeout(() => {
        if (cancelled) return;
        setIsZoomed(false);
        idx += 1;
        setTimeout(warmUpNext, 80);
      }, 140);
    };

    const startTimer = setTimeout(warmUpNext, 120);
    return () => {
      cancelled = true;
      clearTimeout(startTimer);
    };
  }, [isSceneReady, showIntroOverlay, interactiveObjects]);

  useEffect(() => {
    latestSelectionRef.current = { name: selectedObjectName, index: selectedObjectIndex };
  }, [selectedObjectName, selectedObjectIndex]);
  
  useEffect(() => {
    if (!showIntroOverlay) return;
    if (isIntroDone && isSceneReady && isWarmupDone && !awaitingAnyKeyRef.current) {
      setAwaitingAnyKey(true);
      awaitingAnyKeyRef.current = true;
    }
  }, [isIntroDone, isSceneReady, isWarmupDone, showIntroOverlay]);
  
  // 键盘事件监听器 - 左右方向键切换物件，下方向键放大/缩小
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 只处理方向键
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowDown') {
        return;
      }
      
      // 跟踪按下的键和时间（用于检测组合键）
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const currentKey = e.key;
        pressedKeysRef.current.add(currentKey);
        keyPressTimesRef.current[currentKey] = Date.now();
        
        // 清除之前延迟执行的单个键操作（如果另一个键也按下了）
        if (pendingKeyActionRef.current) {
          clearTimeout(pendingKeyActionRef.current);
          pendingKeyActionRef.current = null;
        }
        
        // 检查是否同时按下左右键（在150ms内）
        if (pressedKeysRef.current.has('ArrowLeft') && pressedKeysRef.current.has('ArrowRight')) {
          const leftTime = keyPressTimesRef.current['ArrowLeft'];
          const rightTime = keyPressTimesRef.current['ArrowRight'];
          
          if (leftTime && rightTime && Math.abs(leftTime - rightTime) <= 150) {
            // 检测到组合键，不阻止事件传播，让 useLongPressEnter hook 处理
            return;
          }
        }
        
        // 对于单个左右键，延迟150ms执行，以便检测是否有组合键
        // 如果在这150ms内检测到组合键，则取消执行
        // 先不阻止事件传播，让 useLongPressEnter 可以检测组合键
        // 延迟执行单个键的处理逻辑
        pendingKeyActionRef.current = setTimeout(() => {
          // 再次检查是否有组合键（防止在延迟期间按下另一个键）
          if (pressedKeysRef.current.has('ArrowLeft') && pressedKeysRef.current.has('ArrowRight')) {
            const leftTime = keyPressTimesRef.current['ArrowLeft'];
            const rightTime = keyPressTimesRef.current['ArrowRight'];
            if (leftTime && rightTime && Math.abs(leftTime - rightTime) <= 200) {
              // 检测到组合键，不执行单个键操作
              pendingKeyActionRef.current = null;
              return;
            }
          }
          
            // 检查是否被游戏交互阻止
      if (window.gameInteractionBlocked || window.combinationDetected) {
              pendingKeyActionRef.current = null;
        return;
      }
      
          // 执行单个键的操作
          if (interactiveObjects.length === 0 || !isWarmupDoneRef.current) {
            pendingKeyActionRef.current = null;
            return;
          }
          if (!isSceneReady) {
            pendingKeyActionRef.current = null;
            return;
          }
          if (!canShowModelRef.current || awaitingAnyKeyRef.current) {
            pendingKeyActionRef.current = null;
            return;
          }
          
          // 执行单个键操作
          // 如果当前没有物件被放大（交互物件选择模式），播放旋转建模声
          if (!isZoomed) {
            if (rotateModelAudioRef.current) {
              rotateModelAudioRef.current.currentTime = 0;
              rotateModelAudioRef.current.play().catch(err => {
                console.warn('播放旋转建模声失败:', err);
              });
            }
          }
          
          if (currentKey === 'ArrowLeft') {
        setSelectedObjectIndex((prevIndex) => {
          const newIndex = prevIndex === 0 ? interactiveObjects.length - 1 : prevIndex - 1;
          const newObjectName = interactiveObjects[newIndex].name;
          setSelectedObjectName(newObjectName);
              setIsZoomed(false);
          return newIndex;
        });
          } else if (currentKey === 'ArrowRight') {
        setSelectedObjectIndex((prevIndex) => {
          const newIndex = prevIndex === interactiveObjects.length - 1 ? 0 : prevIndex + 1;
          const newObjectName = interactiveObjects[newIndex].name;
          setSelectedObjectName(newObjectName);
              setIsZoomed(false);
          return newIndex;
        });
          }
          
          pendingKeyActionRef.current = null;
        }, 150);
        
        // 不阻止事件传播，让 useLongPressEnter 可以处理
        return;
      }
      
      // 处理下方向键（不受组合键影响）
      if (e.key === 'ArrowDown') {
        if (interactiveObjects.length === 0 || !isWarmupDoneRef.current) return;
        if (!isSceneReady) return;
        if (!canShowModelRef.current || awaitingAnyKeyRef.current) {
          return;
        }
        if (window.gameInteractionBlocked || window.combinationDetected) {
          return;
        }
        
        // 阻止事件继续传播，确保其他监听器不会处理
        e.stopPropagation();
        e.preventDefault();
        
        // 处理下方向键（e.key 已经是 'ArrowDown'）
        // 如果水槽、摩卡壺、旧笔记本或新笔记本放大，处理文字分段
        // 音效播放逻辑在 goNext 函数中，只有在真正切换段落时才播放
        if (isZoomed && selectedObjectName === 'sink') {
          goNextSinkSegment();
        } else if (isZoomed && selectedObjectName === 'mokaPot') {
          goNextMokaPotSegment();
        } else if (isZoomed && selectedObjectName === 'oldNote') {
          goNextOldNoteSegment();
        } else if (isZoomed && selectedObjectName === 'newNote') {
          goNextNewNoteSegment();
        } else {
          // 其他情况切换放大/缩小状态
        setIsZoomed((prev) => {
          const newState = !prev;
            if (newState && isWarmupDoneRef.current && initialUserZoomsRef.current < 2) {
              pendingInstantZoomRef.current = true;
            } else if (!newState) {
              pendingInstantZoomRef.current = false;
            }
          return newState;
        });
        }
      }
    };
    
    // 处理键释放事件，清理按下的键和取消延迟操作
    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        pressedKeysRef.current.delete(e.key);
        delete keyPressTimesRef.current[e.key];
        
        // 如果键释放时还有延迟操作，取消它（因为可能是组合键检测失败的情况）
        // 但不完全取消，因为用户可能快速释放后再次按下
        // 实际应该在延迟期间检查组合键状态
      }
    };
    
    // 使用捕获阶段，确保此监听器在其他监听器之前执行
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      // 清理延迟操作
      if (pendingKeyActionRef.current) {
        clearTimeout(pendingKeyActionRef.current);
        pendingKeyActionRef.current = null;
      }
    };
  }, [interactiveObjects, selectedObjectName, isZoomed, goNextSinkSegment, goNextMokaPotSegment, goNextOldNoteSegment, goNextNewNoteSegment, isSceneReady, playPageFlipSound]);
  
  // 水槽打字机动画
  const startSinkTypewriter = useCallback((text) => {
    setSinkDisplayedText('');
    setSinkIsTyping(true);
    sinkIsTypingRef.current = true; // 同步更新 ref
    
    let charIndex = 0;
    const textLength = text.length;
    const wallHitPlayedRef = { current: false }; // 用于跟踪是否已播放槌墙声
    const continuousPenClickPlayedRef = { current: false }; // 用于跟踪是否已播放连续按笔声
    const continuousPenClickAudioInstancesRef = { current: [] }; // 用于跟踪所有连续按笔声的音频实例
    const continuousPenClickStoppedRef = { current: false }; // 用于标记是否已停止连续按笔声
    const punchStomachPlayedRef = { current: false }; // 用于跟踪是否已播放拳打肚子声
    
    // 找到「咚..咚..咚..咚..」的位置
    const targetText = '咚..咚..咚..咚..';
    const targetIndex = text.indexOf(targetText);
    
    // 找到「卻因為室友不斷按壓的筆聲」的「因」字的位置
    const penClickTargetText = '卻因為室友不斷按壓的筆聲';
    const penClickTargetIndex = text.indexOf(penClickTargetText);
    const penClickTargetCharIndex = penClickTargetIndex !== -1 ? penClickTargetIndex + 2 : -1; // 「因」字在「卻因為室友不斷按壓的筆聲」中的位置是索引2
    
    // 找到「我一拳灌在室友肚子」的「我」字的位置
    const punchStomachTargetText = '我一拳灌在室友肚子';
    const punchStomachTargetIndex = text.indexOf(punchStomachTargetText);
    const punchStomachTargetCharIndex = punchStomachTargetIndex !== -1 ? punchStomachTargetIndex + 0 : -1; // 「我」字在「我一拳灌在室友肚子」中的位置是索引0
    
    const type = () => {
      if (charIndex < textLength) {
        const displayedText = text.substring(0, charIndex + 1);
        setSinkDisplayedText(displayedText);
        charIndex++;
        
        // 检查是否显示到「我一拳灌在室友肚子」的「我」字并播放音效
        // charIndex 在递增后表示已显示的字符数，所以需要检查 charIndex - 1 或 charIndex === targetIndex + 1
        if (punchStomachTargetCharIndex !== -1 && charIndex === punchStomachTargetCharIndex + 1 && !punchStomachPlayedRef.current) {
          // 如果连续按笔声还在播放，立即停止所有实例
          // 先设置停止标志，这样即使 ended 事件触发，也不会继续播放
          continuousPenClickStoppedRef.current = true;
          
          // 停止所有正在播放的连续按笔声实例
          const instancesToStop = [...continuousPenClickAudioInstancesRef.current]; // 创建副本以避免在遍历时修改数组
          instancesToStop.forEach(audio => {
            if (audio && !audio.paused) {
              try {
                // 立即停止音频并重置
                audio.pause();
                audio.currentTime = 0;
                // 重新加载音频以移除所有事件监听器
                audio.load();
              } catch (err) {
                // 如果 load() 失败，至少确保暂停和重置
                try {
                  audio.pause();
                  audio.currentTime = 0;
                } catch (e) {
                  console.warn('停止连续按笔声失败:', e);
                }
              }
            }
          });
          continuousPenClickAudioInstancesRef.current = []; // 清空数组
          
          if (punchStomachAudioRef.current) {
            punchStomachAudioRef.current.currentTime = 0;
            punchStomachAudioRef.current.play().catch(err => {
              console.warn('播放拳打肚子声失败:', err);
            });
            punchStomachPlayedRef.current = true; // 标记已播放
          }
        }
        
        // 检查是否显示到「卻因為室友不斷按壓的筆聲」的「因」字并播放音效（重复播放两次）
        if (penClickTargetCharIndex !== -1 && charIndex === penClickTargetCharIndex && !continuousPenClickPlayedRef.current) {
          if (continuousPenClickAudioRef.current) {
            let playCount = 0;
            const maxPlayCount = 2;
            
            const playPenClickSound = () => {
              // 检查是否已被停止
              if (continuousPenClickStoppedRef.current) {
                return; // 如果已停止，不再播放
              }
              
              if (playCount < maxPlayCount) {
                // 创建新的音频实例以避免冲突
                const audio = continuousPenClickAudioRef.current.cloneNode();
                audio.volume = continuousPenClickAudioRef.current.volume;
                audio.currentTime = 0;
                
                // 将音频实例添加到跟踪数组中
                continuousPenClickAudioInstancesRef.current.push(audio);
                
                // 监听播放结束事件，播放下一次
                audio.addEventListener('ended', () => {
                  // 检查是否已被停止
                  if (continuousPenClickStoppedRef.current) {
                    return; // 如果已停止，不再播放
                  }
                  
                  // 从跟踪数组中移除
                  const index = continuousPenClickAudioInstancesRef.current.indexOf(audio);
                  if (index > -1) {
                    continuousPenClickAudioInstancesRef.current.splice(index, 1);
                  }
                  
                  playCount++;
                  if (playCount < maxPlayCount && !continuousPenClickStoppedRef.current) {
                    playPenClickSound();
                  }
                });
                
                audio.play().catch(err => {
                  console.warn('播放连续按笔声失败:', err);
                  
                  // 检查是否已被停止
                  if (continuousPenClickStoppedRef.current) {
                    return; // 如果已停止，不再播放
                  }
                  
                  // 从跟踪数组中移除
                  const index = continuousPenClickAudioInstancesRef.current.indexOf(audio);
                  if (index > -1) {
                    continuousPenClickAudioInstancesRef.current.splice(index, 1);
                  }
                  
                  playCount++;
                  if (playCount < maxPlayCount && !continuousPenClickStoppedRef.current) {
                    playPenClickSound();
                  }
                });
              }
            };
            
            // 开始播放
            playPenClickSound();
            continuousPenClickPlayedRef.current = true; // 标记已播放
          }
        }
        
        // 检查是否接近「咚..咚..咚..咚..」（提前约0.2秒播放，约5个字符）
        // 普通字符40ms，0.2秒 = 200ms，约5个字符
        if (targetIndex !== -1 && !wallHitPlayedRef.current) {
          const charsBeforeTarget = targetIndex - charIndex;
          // 如果距离目标文字还有约5个字符（提前0.2秒），开始播放音效
          if (charsBeforeTarget <= 5 && charsBeforeTarget >= 0) {
            if (wallHitAudioRef.current) {
              wallHitAudioRef.current.currentTime = 0;
              wallHitAudioRef.current.play().catch(err => {
                console.warn('播放槌墙声失败:', err);
              });
              wallHitPlayedRef.current = true; // 标记已播放
            }
          }
        }
        
        // 标点符号停顿400ms，普通字符40ms
        const punctuationMarks = ['，', '。', '！', '？', '；', '：', '、', '…', '─', '—', '～', '‧'];
        const currentChar = text[charIndex - 1];
        const delay = punctuationMarks.includes(currentChar) ? 400 : 40;
        
        sinkTypewriterTimerRef.current = setTimeout(type, delay);
      } else {
        setSinkDisplayedText(text);
        setSinkIsTyping(false);
        sinkIsTypingRef.current = false; // 同步更新 ref
      }
    };
    
    type();
  }, []);
  
  // 停止水槽打字机动画
  const skipSinkTypewriter = useCallback(() => {
    if (sinkTypewriterTimerRef.current) {
      clearTimeout(sinkTypewriterTimerRef.current);
      sinkTypewriterTimerRef.current = null;
    }
    if (sinkCurrentSegment < sinkTexts.current.length) {
      setSinkDisplayedText(sinkTexts.current[sinkCurrentSegment]);
      setSinkIsTyping(false);
      sinkIsTypingRef.current = false; // 同步更新 ref
    }
  }, [sinkCurrentSegment]);
  
  // 水槽文字下一段
  const goNextSinkSegment = useCallback(() => {
    // 如果正在打字，不允许继续，必须等文字全部显示完（使用 ref 获取最新值）
    if (sinkIsTypingRef.current) {
      return;
    }
    
    // 检查是否还有下一段（使用 ref 获取最新值，避免闭包问题）
    const currentSegment = sinkCurrentSegmentRef.current;
    const nextSegment = currentSegment + 1;
    const segments = flashbackSegmentMap['sink'] || [];
    const isCurrentSegmentFlashback = segments.includes(currentSegment);
    const isNextSegmentFlashback = segments.includes(nextSegment);
    
    // 如果当前是回忆段，下一段不是回忆段（退出回忆），播放音效
    if (isCurrentSegmentFlashback && !isNextSegmentFlashback && nextSegment < sinkTexts.current.length) {
      playPageFlipSound();
    }
    // 如果当前不是回忆段，下一段是回忆段（进入回忆），播放音效
    if (!isCurrentSegmentFlashback && isNextSegmentFlashback) {
      playPageFlipSound();
    }
    
    if (nextSegment < sinkTexts.current.length) {
      // 清除当前文字
      setSinkDisplayedText('');
      // 移动到下一段
      setSinkCurrentSegment(prev => {
        const next = prev + 1;
        sinkCurrentSegmentRef.current = next; // 同步更新 ref
        return next;
      });
    } else {
      // 所有段落显示完毕，缩小建模归位
      // 如果当前是回忆段，退出时播放音效
      if (isCurrentSegmentFlashback) {
        playPageFlipSound();
      }
      // 先停止打字机定时器
      if (sinkTypewriterTimerRef.current) {
        clearTimeout(sinkTypewriterTimerRef.current);
        sinkTypewriterTimerRef.current = null;
      }
      // 直接缩小建模，让资讯框立即隐藏
      setIsZoomed(false);
    }
  }, [playPageFlipSound]);
  const startMokaPotTypewriter = useCallback((text) => {
    setMokaPotDisplayedText('');
    setMokaPotIsTyping(true);
    mokaPotIsTypingRef.current = true; // 同步更新 ref
    
    let charIndex = 0;
    const textLength = text.length;
    const coffeeBeanDropPlayedRef = { current: false }; // 用于跟踪是否已播放咖啡豆掉落声
    
    // 找到「摩卡壺?別鬧了，你吃咖啡豆，乖」的「鬧」字的位置
    const targetText = '摩卡壺?別鬧了，你吃咖啡豆，乖';
    const targetIndex = text.indexOf(targetText);
    const targetCharIndex = targetIndex !== -1 ? targetIndex + 4 : -1; // 「鬧」字在「摩卡壺?別鬧了，你吃咖啡豆，乖」中的位置是索引4
    
    const type = () => {
      if (charIndex < textLength) {
        const displayedText = text.substring(0, charIndex + 1);
        setMokaPotDisplayedText(displayedText);
        charIndex++;
        
        // 检查是否显示到「摩卡壺?別鬧了，你吃咖啡豆，乖」的「鬧」字并播放音效
        if (targetCharIndex !== -1 && charIndex === targetCharIndex && !coffeeBeanDropPlayedRef.current) {
          if (coffeeBeanDropAudioRef.current) {
            coffeeBeanDropAudioRef.current.currentTime = 0;
            coffeeBeanDropAudioRef.current.play().catch(err => {
              console.warn('播放咖啡豆掉落声失败:', err);
            });
            coffeeBeanDropPlayedRef.current = true; // 标记已播放
          }
        }
        
        // 标点符号停顿400ms，普通字符40ms
        const punctuationMarks = ['，', '。', '！', '？', '；', '：', '、', '…', '─', '—', '～', '‧'];
        const currentChar = text[charIndex - 1];
        const delay = punctuationMarks.includes(currentChar) ? 400 : 40;
        
        mokaPotTypewriterTimerRef.current = setTimeout(type, delay);
      } else {
        setMokaPotDisplayedText(text);
        setMokaPotIsTyping(false);
        mokaPotIsTypingRef.current = false; // 同步更新 ref
      }
    };
    
    type();
  }, []);
  
  // 停止摩卡壺打字机动画
  const skipMokaPotTypewriter = useCallback(() => {
    if (mokaPotTypewriterTimerRef.current) {
      clearTimeout(mokaPotTypewriterTimerRef.current);
      mokaPotTypewriterTimerRef.current = null;
    }
    if (mokaPotCurrentSegment < mokaPotTexts.current.length) {
      setMokaPotDisplayedText(mokaPotTexts.current[mokaPotCurrentSegment]);
      setMokaPotIsTyping(false);
      mokaPotIsTypingRef.current = false; // 同步更新 ref
    }
  }, [mokaPotCurrentSegment]);
  
  // 摩卡壺文字下一段
  const goNextMokaPotSegment = useCallback(() => {
    // 如果正在打字，不允许继续，必须等文字全部显示完（使用 ref 获取最新值）
    if (mokaPotIsTypingRef.current) {
      return;
    }
    
    // 检查是否还有下一段（使用 ref 获取最新值，避免闭包问题）
    const currentSegment = mokaPotCurrentSegmentRef.current;
    const nextSegment = currentSegment + 1;
    const segments = flashbackSegmentMap['mokaPot'] || [];
    const isCurrentSegmentFlashback = segments.includes(currentSegment);
    const isNextSegmentFlashback = segments.includes(nextSegment);
    
    // 如果当前是回忆段，下一段不是回忆段（退出回忆），播放音效
    if (isCurrentSegmentFlashback && !isNextSegmentFlashback && nextSegment < mokaPotTexts.current.length) {
      playPageFlipSound();
    }
    // 如果当前不是回忆段，下一段是回忆段（进入回忆），播放音效
    if (!isCurrentSegmentFlashback && isNextSegmentFlashback) {
      playPageFlipSound();
    }
    
    if (nextSegment < mokaPotTexts.current.length) {
      // 清除当前文字
      setMokaPotDisplayedText('');
      // 移动到下一段
      setMokaPotCurrentSegment(prev => {
        const next = prev + 1;
        mokaPotCurrentSegmentRef.current = next; // 同步更新 ref
        return next;
      });
    } else {
      // 所有段落显示完毕，缩小建模归位
      // 如果当前是回忆段，退出时播放音效
      if (isCurrentSegmentFlashback) {
        playPageFlipSound();
      }
      // 先停止打字机定时器
      if (mokaPotTypewriterTimerRef.current) {
        clearTimeout(mokaPotTypewriterTimerRef.current);
        mokaPotTypewriterTimerRef.current = null;
      }
      // 直接缩小建模，让资讯框立即隐藏
      setIsZoomed(false);
    }
  }, [playPageFlipSound, skipMokaPotTypewriter]);
  
  // 旧笔记本打字机动画
  const startOldNoteTypewriter = useCallback((text) => {
    setOldNoteDisplayedText('');
    setOldNoteIsTyping(true);
    oldNoteIsTypingRef.current = true; // 同步更新 ref
    
    let charIndex = 0;
    const textLength = text.length;
    
    const type = () => {
      if (charIndex < textLength) {
        setOldNoteDisplayedText(text.substring(0, charIndex + 1));
        charIndex++;
        
        // 标点符号停顿400ms，普通字符40ms
        const punctuationMarks = ['，', '。', '！', '？', '；', '：', '、', '…', '─', '—', '～', '‧'];
        const currentChar = text[charIndex - 1];
        const delay = punctuationMarks.includes(currentChar) ? 400 : 40;
        
        oldNoteTypewriterTimerRef.current = setTimeout(type, delay);
      } else {
        setOldNoteDisplayedText(text);
        setOldNoteIsTyping(false);
        oldNoteIsTypingRef.current = false; // 同步更新 ref
      }
    };
    
    type();
  }, []);
  
  // 停止旧笔记本打字机动画
  const skipOldNoteTypewriter = useCallback(() => {
    if (oldNoteTypewriterTimerRef.current) {
      clearTimeout(oldNoteTypewriterTimerRef.current);
      oldNoteTypewriterTimerRef.current = null;
    }
    if (oldNoteCurrentSegment < oldNoteTexts.current.length) {
      setOldNoteDisplayedText(oldNoteTexts.current[oldNoteCurrentSegment]);
      setOldNoteIsTyping(false);
      oldNoteIsTypingRef.current = false; // 同步更新 ref
    }
  }, [oldNoteCurrentSegment]);
  
  // 旧笔记本文字下一段
  const goNextOldNoteSegment = useCallback(() => {
    // 如果正在打字，不允许继续，必须等文字全部显示完（使用 ref 获取最新值）
    if (oldNoteIsTypingRef.current) {
      return;
    }
    
    // 检查是否还有下一段（使用 ref 获取最新值，避免闭包问题）
    const currentSegment = oldNoteCurrentSegmentRef.current;
    const nextSegment = currentSegment + 1;
    const segments = flashbackSegmentMap['oldNote'] || [];
    const isCurrentSegmentFlashback = segments.includes(currentSegment);
    const isNextSegmentFlashback = segments.includes(nextSegment);
    
    // 如果当前是回忆段，下一段不是回忆段（退出回忆），播放音效
    if (isCurrentSegmentFlashback && !isNextSegmentFlashback && nextSegment < oldNoteTexts.current.length) {
      playPageFlipSound();
    }
    // 如果当前不是回忆段，下一段是回忆段（进入回忆），播放音效
    if (!isCurrentSegmentFlashback && isNextSegmentFlashback) {
      playPageFlipSound();
    }
    
    if (nextSegment < oldNoteTexts.current.length) {
      // 清除当前文字
      setOldNoteDisplayedText('');
      // 移动到下一段
      setOldNoteCurrentSegment(prev => {
        const next = prev + 1;
        oldNoteCurrentSegmentRef.current = next; // 同步更新 ref
        return next;
      });
    } else {
      // 所有段落显示完毕，缩小建模归位
      // 如果当前是回忆段，退出时播放音效
      if (isCurrentSegmentFlashback) {
        playPageFlipSound();
      }
      // 先停止打字机定时器
      if (oldNoteTypewriterTimerRef.current) {
        clearTimeout(oldNoteTypewriterTimerRef.current);
        oldNoteTypewriterTimerRef.current = null;
      }
      // 直接缩小建模，让资讯框立即隐藏
      setIsZoomed(false);
    }
  }, [playPageFlipSound]);
  
  // 新笔记本打字机动画
  const startNewNoteTypewriter = useCallback((text) => {
    setNewNoteDisplayedText('');
    setNewNoteIsTyping(true);
    newNoteIsTypingRef.current = true; // 同步更新 ref
    
    let charIndex = 0;
    const textLength = text.length;
    const noteDropPlayedRef = { current: false }; // 用于跟踪是否已播放笔记掉落声（用于「筆記瞬間脫手」）
    const noteDropPlayedRef2 = { current: false }; // 用于跟踪是否已播放笔记掉落声（用于「「幹!這是三小?」」）
    const brokenPhonePlayedRef = { current: false }; // 用于跟踪是否已播放坏掉电话声
    
    // 找到「筆記瞬間脫手」的「筆」字的位置
    const targetText = '筆記瞬間脫手';
    const targetIndex = text.indexOf(targetText);
    // 提前0.6秒播放，约15-16个字符（普通字符40ms，0.6秒=600ms，约15个字符）
    const targetCharIndex = targetIndex !== -1 ? targetIndex - 16 : -1; // 在「筆」字之前16个字符的位置播放
    
    // 找到「「幹!這是三小?」」的「小」字的位置
    const targetText2 = '「幹!這是三小?」';
    const targetIndex2 = text.indexOf(targetText2);
    const targetCharIndex2 = targetIndex2 !== -1 ? targetIndex2 + 6 : -1; // 「小」字在「「幹!這是三小?」」中的位置是索引6
    
    // 找到「壞掉的鈴聲從支離破碎的電話中響起。」的「聲」字的位置
    const brokenPhoneTargetText = '壞掉的鈴聲從支離破碎的電話中響起。';
    const brokenPhoneTargetIndex = text.indexOf(brokenPhoneTargetText);
    const brokenPhoneTargetCharIndex = brokenPhoneTargetIndex !== -1 ? brokenPhoneTargetIndex + 3 : -1; // 「聲」字在「壞掉的鈴聲從支離破碎的電話中響起。」中的位置是索引3
    
    const type = () => {
      if (charIndex < textLength) {
        const displayedText = text.substring(0, charIndex + 1);
        setNewNoteDisplayedText(displayedText);
        charIndex++;
        
        // 检查是否显示到「壞掉的鈴聲從支離破碎的電話中響起。」的「聲」字并播放音效
        // charIndex 在递增后表示已显示的字符数，所以需要检查 charIndex === targetIndex + 1
        if (brokenPhoneTargetCharIndex !== -1 && charIndex === brokenPhoneTargetCharIndex + 1 && !brokenPhonePlayedRef.current) {
          if (brokenPhoneAudioRef.current) {
            brokenPhoneAudioRef.current.currentTime = 0;
            brokenPhoneAudioRef.current.play().catch(err => {
              console.warn('播放坏掉电话声失败:', err);
            });
            brokenPhonePlayedRef.current = true; // 标记已播放
          }
        }
        
        // 检查是否显示到「「幹!這是三小?」」的「小」字并播放音效
        if (targetCharIndex2 !== -1 && charIndex === targetCharIndex2 && !noteDropPlayedRef2.current) {
          if (noteDropAudioRef.current) {
            noteDropAudioRef.current.currentTime = 0;
            noteDropAudioRef.current.play().catch(err => {
              console.warn('播放笔记掉落声失败:', err);
            });
            noteDropPlayedRef2.current = true; // 标记已播放
          }
        }
        
        // 检查是否显示到「筆記瞬間脫手」的「筆」字并播放音效
        if (targetIndex !== -1 && !noteDropPlayedRef.current) {
          // 检查是否到达目标位置（在「筆」字之前16个字符）
          if (charIndex >= targetCharIndex && targetCharIndex >= 0) {
            if (noteDropAudioRef.current) {
              noteDropAudioRef.current.currentTime = 0;
              noteDropAudioRef.current.play().catch(err => {
                console.warn('播放笔记掉落声失败:', err);
              });
              noteDropPlayedRef.current = true; // 标记已播放
            }
          }
        }
        
        // 标点符号停顿400ms，普通字符40ms
        const punctuationMarks = ['，', '。', '！', '？', '；', '：', '、', '…', '─', '—', '～', '‧'];
        const currentChar = text[charIndex - 1];
        const delay = punctuationMarks.includes(currentChar) ? 400 : 40;
        
        newNoteTypewriterTimerRef.current = setTimeout(type, delay);
      } else {
        setNewNoteDisplayedText(text);
        setNewNoteIsTyping(false);
        newNoteIsTypingRef.current = false; // 同步更新 ref
      }
    };
    
    type();
  }, []);
  
  // 停止新笔记本打字机动画
  const skipNewNoteTypewriter = useCallback(() => {
    if (newNoteTypewriterTimerRef.current) {
      clearTimeout(newNoteTypewriterTimerRef.current);
      newNoteTypewriterTimerRef.current = null;
    }
    if (newNoteCurrentSegment < newNoteTexts.current.length) {
      setNewNoteDisplayedText(newNoteTexts.current[newNoteCurrentSegment]);
      setNewNoteIsTyping(false);
      newNoteIsTypingRef.current = false; // 同步更新 ref
    }
  }, [newNoteCurrentSegment]);
  
  // 新笔记本文字下一段
  const goNextNewNoteSegment = useCallback(() => {
    // 如果正在打字，不允许继续，必须等文字全部显示完（使用 ref 获取最新值）
    if (newNoteIsTypingRef.current) {
      return;
    }
    
    // 检查是否还有下一段（使用 ref 获取最新值，避免闭包问题）
    const currentSegment = newNoteCurrentSegmentRef.current;
    const nextSegment = currentSegment + 1;
    const segments = flashbackSegmentMap['newNote'] || [];
    const isCurrentSegmentFlashback = segments.includes(currentSegment);
    const isNextSegmentFlashback = segments.includes(nextSegment);
    
    // 如果当前是回忆段，下一段不是回忆段（退出回忆），播放音效
    if (isCurrentSegmentFlashback && !isNextSegmentFlashback && nextSegment < newNoteTexts.current.length) {
      playPageFlipSound();
    }
    // 如果当前不是回忆段，下一段是回忆段（进入回忆），播放音效
    if (!isCurrentSegmentFlashback && isNextSegmentFlashback) {
      playPageFlipSound();
    }
    
    if (nextSegment < newNoteTexts.current.length) {
      // 清除当前文字
      setNewNoteDisplayedText('');
      // 移动到下一段
      setNewNoteCurrentSegment(prev => {
        const next = prev + 1;
        newNoteCurrentSegmentRef.current = next; // 同步更新 ref
        return next;
      });
    } else {
      // 所有段落显示完毕，缩小建模归位
      // 如果当前是回忆段，退出时播放音效
      if (isCurrentSegmentFlashback) {
        playPageFlipSound();
      }
      // 先停止打字机定时器
      if (newNoteTypewriterTimerRef.current) {
        clearTimeout(newNoteTypewriterTimerRef.current);
        newNoteTypewriterTimerRef.current = null;
      }
      // 直接缩小建模，让资讯框立即隐藏
      setIsZoomed(false);
    }
  }, [playPageFlipSound]);
  
  // 当水槽被放大时，初始化打字机动画
  useEffect(() => {
    if (isZoomed && selectedObjectName === 'sink') {
      // 重置到第一段
      setSinkCurrentSegment(0);
      sinkCurrentSegmentRef.current = 0; // 同步更新 ref
      setSinkDisplayedText('');
      setSinkIsTyping(false);
      sinkIsTypingRef.current = false; // 同步更新 ref
      if (sinkTypewriterTimerRef.current) {
        clearTimeout(sinkTypewriterTimerRef.current);
        sinkTypewriterTimerRef.current = null;
      }
    } else {
      // 当水槽缩小或切换物件时，清理状态
      if (sinkTypewriterTimerRef.current) {
        clearTimeout(sinkTypewriterTimerRef.current);
        sinkTypewriterTimerRef.current = null;
      }
      setSinkDisplayedText('');
      setSinkCurrentSegment(0);
      sinkCurrentSegmentRef.current = 0; // 同步更新 ref
      setSinkIsTyping(false);
      sinkIsTypingRef.current = false; // 同步更新 ref
    }
  }, [isZoomed, selectedObjectName]);
  
  // 当水槽当前段改变时，开始新的打字机动画
  useEffect(() => {
    if (isZoomed && selectedObjectName === 'sink' && sinkCurrentSegment < sinkTexts.current.length && sinkCurrentSegment >= 0) {
      if (sinkTypewriterTimerRef.current) {
        clearTimeout(sinkTypewriterTimerRef.current);
        sinkTypewriterTimerRef.current = null;
      }
      
      // 检查当前段和前一段是否是闪回段
      const segments = flashbackSegmentMap['sink'] || [];
      const isCurrentSegmentFlashback = segments.includes(sinkCurrentSegment);
      const isPrevSegmentFlashback = sinkCurrentSegment > 0 && segments.includes(sinkCurrentSegment - 1);
      
      // 如果是闪回段，立即清空文字，等待闪回效果完成后再开始打字机动画
      if (isCurrentSegmentFlashback) {
        setSinkDisplayedText('');
        setSinkIsTyping(false);
        sinkIsTypingRef.current = false;
      }
      
      // 如果当前段是闪回段，但前一段也是闪回段，说明是在闪回段落内部切换，不需要等待
      // 只有在进入闪回（前一段不是闪回，当前段是闪回）时才需要等待
      const delay = (isCurrentSegmentFlashback && !isPrevSegmentFlashback) ? 4050 : 50; // 进入闪回效果4秒 + 50ms缓冲
      
      const timer = setTimeout(() => {
        startSinkTypewriter(sinkTexts.current[sinkCurrentSegment]);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [sinkCurrentSegment, isZoomed, selectedObjectName, startSinkTypewriter]);
  
  // 当摩卡壺被放大时，初始化打字机动画
  useEffect(() => {
    if (isZoomed && selectedObjectName === 'mokaPot') {
      // 重置到第一段
      setMokaPotCurrentSegment(0);
      mokaPotCurrentSegmentRef.current = 0; // 同步更新 ref
      setMokaPotDisplayedText('');
      setMokaPotIsTyping(false);
      mokaPotIsTypingRef.current = false; // 同步更新 ref
      if (mokaPotTypewriterTimerRef.current) {
        clearTimeout(mokaPotTypewriterTimerRef.current);
        mokaPotTypewriterTimerRef.current = null;
      }
    } else {
      // 当摩卡壺缩小或切换物件时，清理状态
      if (mokaPotTypewriterTimerRef.current) {
        clearTimeout(mokaPotTypewriterTimerRef.current);
        mokaPotTypewriterTimerRef.current = null;
      }
      setMokaPotDisplayedText('');
      setMokaPotCurrentSegment(0);
      mokaPotCurrentSegmentRef.current = 0; // 同步更新 ref
      setMokaPotIsTyping(false);
      mokaPotIsTypingRef.current = false; // 同步更新 ref
    }
  }, [isZoomed, selectedObjectName]);
  
  // 当摩卡壺当前段改变时，开始新的打字机动画
  useEffect(() => {
    if (isZoomed && selectedObjectName === 'mokaPot' && mokaPotCurrentSegment < mokaPotTexts.current.length && mokaPotCurrentSegment >= 0) {
      if (mokaPotTypewriterTimerRef.current) {
        clearTimeout(mokaPotTypewriterTimerRef.current);
        mokaPotTypewriterTimerRef.current = null;
      }
      
      // 检查当前段是否是闪回段
      const segments = flashbackSegmentMap['mokaPot'] || [];
      const isCurrentSegmentFlashback = segments.includes(mokaPotCurrentSegment);
      
      // 如果是闪回段，立即清空文字，等待闪回效果完成后再开始打字机动画
      if (isCurrentSegmentFlashback) {
        setMokaPotDisplayedText('');
        setMokaPotIsTyping(false);
        mokaPotIsTypingRef.current = false;
      }
      
      // 如果是闪回段，等待闪回效果完成（4秒淡入+等待）；否则正常延迟
      const delay = isCurrentSegmentFlashback ? 4050 : 50; // 闪回效果4秒 + 50ms缓冲
      
      const timer = setTimeout(() => {
        startMokaPotTypewriter(mokaPotTexts.current[mokaPotCurrentSegment]);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [mokaPotCurrentSegment, isZoomed, selectedObjectName, startMokaPotTypewriter]);
  
  // 当旧笔记本被放大时，初始化打字机动画
  useEffect(() => {
    if (isZoomed && selectedObjectName === 'oldNote') {
      // 重置到第一段
      setOldNoteCurrentSegment(0);
      oldNoteCurrentSegmentRef.current = 0; // 同步更新 ref
      setOldNoteDisplayedText('');
      setOldNoteIsTyping(false);
      oldNoteIsTypingRef.current = false; // 同步更新 ref
      if (oldNoteTypewriterTimerRef.current) {
        clearTimeout(oldNoteTypewriterTimerRef.current);
        oldNoteTypewriterTimerRef.current = null;
      }
    } else {
      // 当旧笔记本缩小或切换物件时，清理状态
      if (oldNoteTypewriterTimerRef.current) {
        clearTimeout(oldNoteTypewriterTimerRef.current);
        oldNoteTypewriterTimerRef.current = null;
      }
      setOldNoteDisplayedText('');
      setOldNoteCurrentSegment(0);
      oldNoteCurrentSegmentRef.current = 0; // 同步更新 ref
      setOldNoteIsTyping(false);
      oldNoteIsTypingRef.current = false; // 同步更新 ref
    }
  }, [isZoomed, selectedObjectName]);
  
  // 当旧笔记本当前段改变时，开始新的打字机动画
  useEffect(() => {
    if (isZoomed && selectedObjectName === 'oldNote' && oldNoteCurrentSegment < oldNoteTexts.current.length && oldNoteCurrentSegment >= 0) {
      if (oldNoteTypewriterTimerRef.current) {
        clearTimeout(oldNoteTypewriterTimerRef.current);
        oldNoteTypewriterTimerRef.current = null;
      }
      
      // 检查当前段是否是闪回段
      const segments = flashbackSegmentMap['oldNote'] || [];
      const isCurrentSegmentFlashback = segments.includes(oldNoteCurrentSegment);
      
      // 如果是闪回段，立即清空文字，等待闪回效果完成后再开始打字机动画
      if (isCurrentSegmentFlashback) {
        setOldNoteDisplayedText('');
        setOldNoteIsTyping(false);
        oldNoteIsTypingRef.current = false;
      }
      
      // 如果是闪回段，等待闪回效果完成（4秒淡入+等待）；否则正常延迟
      const delay = isCurrentSegmentFlashback ? 4050 : 50; // 闪回效果4秒 + 50ms缓冲
      
      const timer = setTimeout(() => {
        startOldNoteTypewriter(oldNoteTexts.current[oldNoteCurrentSegment]);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [oldNoteCurrentSegment, isZoomed, selectedObjectName, startOldNoteTypewriter]);
  
  // 当新笔记本被放大时，初始化打字机动画
  useEffect(() => {
    if (isZoomed && selectedObjectName === 'newNote') {
      // 重置到第一段
      setNewNoteCurrentSegment(0);
      newNoteCurrentSegmentRef.current = 0; // 同步更新 ref
      setNewNoteDisplayedText('');
      setNewNoteIsTyping(false);
      newNoteIsTypingRef.current = false; // 同步更新 ref
      if (newNoteTypewriterTimerRef.current) {
        clearTimeout(newNoteTypewriterTimerRef.current);
        newNoteTypewriterTimerRef.current = null;
      }
    } else {
      // 当新笔记本缩小或切换物件时，清理状态
      if (newNoteTypewriterTimerRef.current) {
        clearTimeout(newNoteTypewriterTimerRef.current);
        newNoteTypewriterTimerRef.current = null;
      }
      setNewNoteDisplayedText('');
      setNewNoteCurrentSegment(0);
      newNoteCurrentSegmentRef.current = 0; // 同步更新 ref
      setNewNoteIsTyping(false);
      newNoteIsTypingRef.current = false; // 同步更新 ref
    }
  }, [isZoomed, selectedObjectName]);
  
  // 当新笔记本当前段改变时，开始新的打字机动画
  useEffect(() => {
    if (isZoomed && selectedObjectName === 'newNote' && newNoteCurrentSegment < newNoteTexts.current.length && newNoteCurrentSegment >= 0) {
      if (newNoteTypewriterTimerRef.current) {
        clearTimeout(newNoteTypewriterTimerRef.current);
        newNoteTypewriterTimerRef.current = null;
      }
      
      // 检查当前段是否是闪回段
      const segments = flashbackSegmentMap['newNote'] || [];
      const isCurrentSegmentFlashback = segments.includes(newNoteCurrentSegment);
      
      // 如果是闪回段，立即清空文字，等待闪回效果完成后再开始打字机动画
      if (isCurrentSegmentFlashback) {
        setNewNoteDisplayedText('');
        setNewNoteIsTyping(false);
        newNoteIsTypingRef.current = false;
      }
      
      // 如果是闪回段，等待闪回效果完成（4秒淡入+等待）；否则正常延迟
      const delay = isCurrentSegmentFlashback ? 4050 : 50; // 闪回效果4秒 + 50ms缓冲
      
      const timer = setTimeout(() => {
        startNewNoteTypewriter(newNoteTexts.current[newNoteCurrentSegment]);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [newNoteCurrentSegment, isZoomed, selectedObjectName, startNewNoteTypewriter]);
  
  // 清理打字机定时器
  useEffect(() => {
    return () => {
      if (sinkTypewriterTimerRef.current) {
        clearTimeout(sinkTypewriterTimerRef.current);
      }
      if (mokaPotTypewriterTimerRef.current) {
        clearTimeout(mokaPotTypewriterTimerRef.current);
      }
      if (oldNoteTypewriterTimerRef.current) {
        clearTimeout(oldNoteTypewriterTimerRef.current);
      }
      if (newNoteTypewriterTimerRef.current) {
        clearTimeout(newNoteTypewriterTimerRef.current);
      }
    };
  }, []);
  
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
          // 相机数据加载前隐藏；开场未结束也隐藏
          opacity: cameraData && canShowModel ? 1 : 0,
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
          pendingInstantZoomRef={pendingInstantZoomRef}
          initialUserZoomsRef={initialUserZoomsRef}
        />
        
        {/* Bloom 光晕效果已禁用 */}
        
        {/* 添加网格辅助线（可选，用于调试） */}
        {/* <gridHelper args={[10, 10]} /> */}
      </Canvas>
      
      {/* 第一章開場 - 逐句淡入，結束後提示任意鍵繼續；期間隱藏建模 */}
      {showIntroOverlay && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          color: '#eaeaea',
          zIndex: 200,
          padding: '40px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            width: 'min(900px, 90vw)',
            lineHeight: 1.9,
            fontSize: '18px',
            letterSpacing: '0.5px',
            textAlign: 'left',
            fontWeight: 400,
            opacity: introOpacity,
            position: 'relative',
            filter: showVisualEffect ? 'none' : 'none',
            transform: showVisualEffect ? 'perspective(500px) rotateX(2deg) scale(1.02)' : 'none',
            transition: showVisualEffect ? 'transform 0.1s linear' : 'opacity 1s ease-out',
            animation: showVisualEffect ? 'breatheBlurText 2.5s ease-in-out infinite' : 'none'
          }}>
            {/* 模糊呼吸效果覆盖层 */}
            {showVisualEffect && (
              <>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  WebkitBackdropFilter: 'blur(1px)',
                  backdropFilter: 'blur(1px)',
                  animation: 'breatheBlur 2.5s ease-in-out infinite',
          pointerEvents: 'none',
                  zIndex: 1.5,
                  mixBlendMode: 'overlay',
                  opacity: 0.7
                }} />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  WebkitBackdropFilter: 'blur(3px)',
                  backdropFilter: 'blur(3px)',
                  animation: 'breatheBlur 2.8s ease-in-out infinite 0.5s',
                  pointerEvents: 'none',
                  zIndex: 1.5,
                  mixBlendMode: 'hard-light',
                  opacity: 0.5
                }} />
              </>
            )}
            <div
              ref={introScrollRef}
              style={{
                maxHeight: '70vh',   // 垂直邊界
                paddingTop: '6vh',
                paddingBottom: '6vh',
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                scrollbarWidth: 'none',
                position: 'relative',
                zIndex: 1
              }}
            >
              {introVisibleLines.map((line, idx) => (
                <div
                  key={`intro-line-${idx}`}
                  style={{
                    marginBottom: '10px',
                    color: '#f0f0f0',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    transform: showVisualEffect ? `rotate(${Math.sin(idx * 0.5) * 2}deg) skewX(${Math.cos(idx * 0.3) * 1}deg)` : 'none',
                    transition: showVisualEffect ? 'transform 0.1s linear' : 'none',
                    animation: !showVisualEffect && line ? 'introFadeIn 0.6s ease-out forwards' : 'none'
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
            {isIntroDone && !awaitingAnyKey && !isSceneReady && showIntroOverlay && (
              <div style={{
                marginTop: '16px',
                color: '#cccccc',
                textAlign: 'center',
                fontSize: '14px',
                opacity: 0.8
              }}>
                場景載入中...
          </div>
            )}
            {awaitingAnyKey && (
              <div style={{
                marginTop: '16px',
                color: '#FFD700',
                textAlign: 'center',
                fontSize: '14px',
                opacity: 0.9
              }}>
                按下任意鍵繼續
              </div>
            )}
            
            {/* 视觉效果：红色不规则色块覆盖层 */}
            {showVisualEffect && (
              <>
                {/* 红色色块1 - 液体飞溅效果 */}
                <div style={{
                  position: 'absolute',
                  top: '10%',
                  left: '15%',
                  transform: 'rotate(15deg)',
                  transformOrigin: 'center center',
                  zIndex: 2,
                  pointerEvents: 'none'
                }}>
                  <div style={{
                    width: '120px',
                    height: '80px',
                    background: 'rgba(180, 30, 30, 0.6)',
                    clipPath: 'polygon(15% 0%, 25% 5%, 35% 2%, 50% 0%, 65% 8%, 75% 15%, 85% 25%, 92% 40%, 95% 55%, 88% 70%, 75% 85%, 60% 95%, 45% 100%, 30% 95%, 18% 85%, 8% 70%, 2% 55%, 0% 40%, 5% 25%, 10% 12%, 12% 3%)',
                    animation: 'breatheBlock 2.3s ease-in-out infinite, breatheBlockScale 2.3s ease-in-out infinite',
                    transformOrigin: 'center center'
                  }} />
                </div>
                {/* 红色色块2 - 液体飞溅效果 */}
                <div style={{
                  position: 'absolute',
                  top: '40%',
                  right: '20%',
                  width: '150px',
                  height: '100px',
                  background: 'rgba(200, 20, 20, 0.5)',
                  clipPath: 'polygon(0% 20%, 8% 10%, 20% 5%, 35% 2%, 50% 0%, 65% 5%, 78% 12%, 88% 22%, 95% 35%, 98% 50%, 95% 65%, 88% 78%, 75% 88%, 60% 95%, 45% 98%, 30% 95%, 18% 88%, 8% 75%, 2% 60%, 0% 45%, 3% 30%, 8% 18%)',
                  transform: 'rotate(-20deg)',
                  transformOrigin: 'center center',
                  animation: 'breatheBlock 2.6s ease-in-out infinite, breatheBlockScale 2.6s ease-in-out infinite',
                  zIndex: 2,
                  pointerEvents: 'none'
                }} />
                {/* 红色色块3 - 液体飞溅效果 */}
                <div style={{
                  position: 'absolute',
                  bottom: '30%',
                  left: '30%',
                  width: '100px',
                  height: '90px',
                  background: 'rgba(160, 40, 40, 0.55)',
                  clipPath: 'polygon(20% 0%, 30% 8%, 40% 5%, 55% 2%, 70% 0%, 82% 8%, 90% 18%, 95% 32%, 98% 48%, 95% 65%, 88% 78%, 75% 88%, 60% 95%, 45% 98%, 30% 92%, 18% 82%, 8% 68%, 2% 52%, 0% 38%, 5% 25%, 12% 12%)',
                  transform: 'rotate(25deg)',
                  transformOrigin: 'center center',
                  animation: 'breatheBlock 2.4s ease-in-out infinite, breatheBlockScale 2.4s ease-in-out infinite',
                  zIndex: 2,
                  pointerEvents: 'none'
                }} />
                {/* 红色色块4 - 液体飞溅效果 */}
                <div style={{
                  position: 'absolute',
                  top: '60%',
                  left: '5%',
                  width: '130px',
                  height: '85px',
                  background: 'rgba(190, 25, 25, 0.5)',
                  clipPath: 'polygon(5% 25%, 12% 15%, 25% 8%, 40% 3%, 55% 0%, 70% 5%, 82% 12%, 90% 22%, 95% 35%, 98% 50%, 95% 65%, 88% 78%, 75% 88%, 60% 95%, 45% 98%, 30% 92%, 18% 82%, 8% 68%, 2% 52%, 0% 38%, 3% 25%, 8% 15%)',
                  transform: 'rotate(-15deg)',
                  transformOrigin: 'center center',
                  animation: 'breatheBlock 2.5s ease-in-out infinite, breatheBlockScale 2.5s ease-in-out infinite',
                  zIndex: 2,
                  pointerEvents: 'none'
                }} />
                {/* 红色色块5 - 液体飞溅效果 */}
                <div style={{
                  position: 'absolute',
                  bottom: '20%',
                  right: '10%',
                  width: '110px',
                  height: '95px',
                  background: 'rgba(170, 35, 35, 0.6)',
                  clipPath: 'polygon(25% 0%, 35% 8%, 45% 5%, 58% 2%, 72% 0%, 85% 8%, 92% 18%, 96% 32%, 98% 48%, 95% 65%, 88% 78%, 75% 88%, 60% 95%, 45% 98%, 30% 92%, 18% 82%, 8% 68%, 2% 52%, 0% 38%, 5% 25%, 12% 12%, 18% 3%)',
                  transform: 'rotate(10deg)',
                  transformOrigin: 'center center',
                  animation: 'breatheBlock 2.2s ease-in-out infinite, breatheBlockScale 2.2s ease-in-out infinite',
                  zIndex: 2,
                  pointerEvents: 'none'
                }} />
                {/* 黑色色块（墨迹效果）- 液体飞溅效果 */}
                <div style={{
                  position: 'absolute',
                  top: '25%',
                  right: '35%',
                  width: '90px',
                  height: '70px',
                  background: 'rgba(10, 10, 10, 0.7)',
                  clipPath: 'polygon(12% 20%, 22% 12%, 35% 8%, 50% 5%, 65% 8%, 78% 15%, 88% 25%, 92% 38%, 95% 52%, 92% 65%, 85% 75%, 75% 82%, 62% 85%, 48% 82%, 35% 75%, 22% 65%, 12% 52%, 8% 38%, 5% 25%, 8% 15%)',
                  transform: 'rotate(-30deg)',
                  transformOrigin: 'center center',
                  animation: 'breatheBlock 2.7s ease-in-out infinite, breatheBlockScale 2.7s ease-in-out infinite',
                  zIndex: 2,
                  pointerEvents: 'none'
                }} />
                
                {/* 小飞溅点1 */}
                <div style={{
                  position: 'absolute',
                  top: '15%',
                  left: '25%',
                  width: '25px',
                  height: '35px',
                  background: 'rgba(200, 30, 30, 0.5)',
                  clipPath: 'polygon(30% 0%, 50% 10%, 70% 5%, 85% 15%, 95% 30%, 100% 50%, 90% 70%, 75% 85%, 55% 95%, 35% 90%, 18% 80%, 5% 65%, 0% 45%, 5% 25%, 15% 10%)',
                  transform: 'rotate(45deg)',
                  animation: 'breatheBlock 2.1s ease-in-out infinite, breatheBlockScale 2.1s ease-in-out infinite',
                  zIndex: 2,
                  pointerEvents: 'none'
                }} />
                
                {/* 小飞溅点2 */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '8%',
                  width: '20px',
                  height: '30px',
                  background: 'rgba(180, 25, 25, 0.5)',
                  clipPath: 'polygon(25% 0%, 45% 8%, 65% 3%, 80% 12%, 92% 28%, 98% 48%, 90% 68%, 75% 82%, 55% 92%, 35% 88%, 20% 78%, 8% 62%, 2% 42%, 8% 22%, 18% 8%)',
                  transform: 'rotate(-35deg)',
                  animation: 'breatheBlock 2.4s ease-in-out infinite, breatheBlockScale 2.4s ease-in-out infinite',
                  zIndex: 2,
                  pointerEvents: 'none'
                }} />
                
                {/* 小飞溅点3 */}
                <div style={{
                  position: 'absolute',
                  bottom: '25%',
                  right: '25%',
                  width: '22px',
                  height: '32px',
                  background: 'rgba(190, 20, 20, 0.5)',
                  clipPath: 'polygon(28% 0%, 48% 8%, 68% 4%, 82% 14%, 92% 30%, 96% 50%, 88% 70%, 72% 85%, 52% 94%, 32% 89%, 16% 79%, 5% 63%, 0% 43%, 6% 23%, 16% 9%)',
                  transform: 'rotate(60deg)',
                  animation: 'breatheBlock 2.3s ease-in-out infinite, breatheBlockScale 2.3s ease-in-out infinite',
                  zIndex: 2,
                  pointerEvents: 'none'
                }} />
                
                {/* 小飞溅点4 */}
                <div style={{
                  position: 'absolute',
                  top: '35%',
                  right: '8%',
                  width: '18px',
                  height: '28px',
                  background: 'rgba(170, 35, 35, 0.5)',
                  clipPath: 'polygon(22% 0%, 42% 7%, 62% 3%, 78% 11%, 90% 26%, 95% 46%, 87% 66%, 70% 81%, 50% 90%, 30% 86%, 14% 76%, 3% 60%, 0% 40%, 5% 20%, 14% 6%)',
                  transform: 'rotate(-50deg)',
                  animation: 'breatheBlock 2.5s ease-in-out infinite, breatheBlockScale 2.5s ease-in-out infinite',
                  zIndex: 2,
                  pointerEvents: 'none'
                }} />
              </>
            )}
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
          width: 'auto',
          minWidth: '400px',
          maxWidth: '600px',
          pointerEvents: 'none',
          zIndex: 100,
          animation: 'fadeIn 0.3s ease-in'
        }}>
          <div className="handdrawn-border" style={{
            background: '#FFFFFF',
            padding: '20px 30px',
            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
          <div style={{ 
              fontFamily: '点点像素体-方形, monospace',
              fontStyle: 'normal',
              fontWeight: 500,
              fontSize: '24px',
              lineHeight: '30px',
              textAlign: 'center',
              color: '#000000'
            }}>
              {selectedObjectName === 'newNote' && '新筆記本'}
              {selectedObjectName === 'oldNote' && '舊筆記本'}
              {selectedObjectName === 'mokaPot' && '摩卡壺'}
              {selectedObjectName === 'sink' && '水槽'}
            </div>
          </div>
        </div>
      )}
      
      {/* 全白不透明覆盖层 - 在回忆开始前显示 */}
      {whiteOverlayVisible && (
        <div
          key={`white-overlay-${whiteOverlayKeyRef.current}`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#FFFFFF',
            pointerEvents: 'none',
            zIndex: 145,
            opacity: 1,
            animation: 'white-overlay-fadeout 2s ease-out forwards'
          }}
        />
      )}
      
      {/* 全屏闪回效果覆盖层 */}
      {flashOverlayState !== 'none' && (
        <div
          key={`flash-${flashOverlayState}-${flashOverlayKeyRef.current}`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#000',
            pointerEvents: 'none',
            zIndex: 140,
            overflow: 'hidden',
            opacity: flashOverlayState === 'active' ? 0.5 : 
                     flashOverlayState === 'enter' ? 0 : 
                     flashOverlayState === 'exit' ? 0.5 : flashOverlayOpacity,
            animation: flashOverlayState === 'enter' ? 'flash-overlay-fadein 2s ease-out forwards' : 
                       flashOverlayState === 'exit' ? 'flash-overlay-fadeout 2s ease-out forwards' : 'none'
          }}
        >
          <video
            ref={flashbackVideoRef}
            src={flashbackVideoSrc}
            muted
            loop
            playsInline
            preload="auto"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'grayscale(0.2) contrast(1.35) brightness(1.05)',
              opacity: flashOverlayState === 'active' ? 1 : 
                       flashOverlayState === 'enter' ? 0 : 
                       flashOverlayState === 'exit' ? 1 : flashbackVideoOpacity,
              transform: 'scale(1.02)',
              animation: flashOverlayState === 'enter' ? 'flash-video-fadein 2s ease-out forwards' : 
                         flashOverlayState === 'exit' ? 'flash-video-fadeout 2s ease-out forwards' : 'none'
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: flashOverlayState === 'exit'
                ? 'rgba(0, 0, 0, 0.8)'
                : 'rgba(255, 255, 255, 0.8)',
              mixBlendMode: flashOverlayState === 'exit' ? 'multiply' : 'screen'
            }}
          />
        </div>
      )}
      
      {/* 放大状态的 UI 界面 - 左侧物件 + 右侧文字说明 */}
      {isZoomed && selectedObjectName && (
        (selectedObjectName !== 'sink' && selectedObjectName !== 'mokaPot' && selectedObjectName !== 'oldNote' && selectedObjectName !== 'newNote') ||
        (selectedObjectName === 'sink' && sinkDisplayedText) ||
        (selectedObjectName === 'mokaPot' && mokaPotDisplayedText) ||
        (selectedObjectName === 'oldNote' && oldNoteDisplayedText) ||
        (selectedObjectName === 'newNote' && newNoteDisplayedText)
      ) && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 150
        }}>
          {/* 右侧文字说明区域 - 固定在右边，垂直居中 */}
          <div style={{
            position: 'absolute',
            top: '50%',
            right: '5%',
            transform: 'translateY(-50%)',
            width: (selectedObjectName === 'sink' || selectedObjectName === 'mokaPot' || selectedObjectName === 'oldNote' || selectedObjectName === 'newNote') ? '50%' : '40%',
            maxWidth: (selectedObjectName === 'sink' || selectedObjectName === 'mokaPot' || selectedObjectName === 'oldNote' || selectedObjectName === 'newNote') ? '600px' : '450px',
            minHeight: (selectedObjectName === 'sink' || selectedObjectName === 'mokaPot' || selectedObjectName === 'oldNote' || selectedObjectName === 'newNote') ? '500px' : '400px',
            pointerEvents: 'none',
            opacity: 1,
            transition: 'opacity 0.3s ease-in'
          }}>
            <div className="handdrawn-border" style={{
              background: infoBoxTheme.background,
              border: `3px solid ${infoBoxTheme.borderColor}`,
            padding: '35px',
              boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              width: '100%',
              minHeight: (selectedObjectName === 'sink' || selectedObjectName === 'mokaPot' || selectedObjectName === 'oldNote' || selectedObjectName === 'newNote') ? '500px' : '400px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
          }}>
            <h2 style={{
                fontFamily: '点点像素体-方形, monospace',
                fontStyle: 'normal',
                fontWeight: 500,
              margin: '0 0 20px 0',
              fontSize: '28px',
                lineHeight: '30px',
                color: infoBoxTheme.textColor,
                borderBottom: `1px solid ${infoBoxTheme.borderColor}`,
              paddingBottom: '10px'
            }}>
              {selectedObjectName === 'newNote' && '新筆記本'}
              {selectedObjectName === 'oldNote' && '舊筆記本'}
              {selectedObjectName === 'mokaPot' && '摩卡壺'}
              {selectedObjectName === 'sink' && '水槽'}
            </h2>
            
            <div style={{
                fontFamily: '点点像素体-方形, monospace',
                fontStyle: 'normal',
                fontWeight: 500,
                fontSize: '24px',
                lineHeight: '30px',
                color: infoBoxTheme.textColor,
                flex: 1,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
            }}>
              {selectedObjectName === 'newNote' && newNoteDisplayedText}
              {selectedObjectName === 'oldNote' && oldNoteDisplayedText}
              {selectedObjectName === 'mokaPot' && mokaPotDisplayedText}
              {selectedObjectName === 'sink' && sinkDisplayedText}
            </div>
            
              {shouldShowTriangle && (
            <div style={{
                  position: 'absolute',
                  bottom: '15px',
                  right: '20px',
                  width: 0,
                  height: 0,
                  borderLeft: '10px solid transparent',
                  borderRight: '10px solid transparent',
                  borderTop: `15px solid ${infoBoxTheme.textColor}`,
                  animation: 'blink-indicator 2s ease-in-out infinite',
                  pointerEvents: 'none'
                }}></div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes introFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.05); }
        }
        @keyframes pulseRed {
          from { opacity: 0.5; transform: scale(1) rotate(0deg); }
          to { opacity: 0.8; transform: scale(1.1) rotate(5deg); }
        }
        @keyframes breatheBlur {
          0%, 100% { 
            -webkit-backdrop-filter: blur(1px);
            backdrop-filter: blur(1px);
            opacity: 0.3;
          }
          50% { 
            -webkit-backdrop-filter: blur(4px);
            backdrop-filter: blur(4px);
            opacity: 0.6;
          }
        }
        @keyframes breatheBlurText {
          0%, 100% { 
            filter: blur(1px) contrast(1.5) saturate(2);
          }
          50% { 
            filter: blur(3px) contrast(1.8) saturate(2.5);
          }
        }
        @keyframes breatheBlock {
          0%, 100% { 
            opacity: 0.5;
            filter: brightness(1);
          }
          50% { 
            opacity: 0.75;
            filter: brightness(1.3);
          }
        }
        @keyframes breatheBlockScale {
          0%, 100% { 
            transform: scale(1) rotate(0deg);
          }
          50% { 
            transform: scale(1.15) rotate(8deg);
          }
        }
        @keyframes blink-indicator {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
        @keyframes flash-enter {
          0% { 
            opacity: 1;
          }
          100% { 
            opacity: 0.5;
          }
        }
        @keyframes flash-exit {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes flash-overlay-fadein {
          from { opacity: 0; }
          to { opacity: 0.5; }
        }
        @keyframes flash-overlay-fadeout {
          from { opacity: 0.5; }
          to { opacity: 0; }
        }
        @keyframes flash-video-fadein {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes flash-video-fadeout {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes white-overlay-fadeout {
          from { opacity: 1; }
          to { opacity: 0; }
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





