import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useVideoTexture } from '@react-three/drei';

function BrainMesh() {
  const meshRef = useRef();
  const videoTexture = useVideoTexture('/images/icons/brain.webm', { loop: true, muted: true });

  useFrame((state) => {
    if (meshRef.current) {
      // 輕微的旋轉動畫
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial map={videoTexture} transparent />
    </mesh>
  );
}

function BrainAnimation3D() {
  return (
    <div style={{
      width: '150px',
      height: '150px',
      marginBottom: '20px',
      border: 'none',
      overflow: 'hidden'
    }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <BrainMesh />
      </Canvas>
    </div>
  );
}

export default BrainAnimation3D;

