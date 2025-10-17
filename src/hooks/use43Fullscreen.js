import { useState, useEffect } from 'react';

/**
 * Hook for handling 4:3 fullscreen optimization
 * This is NOT responsive design - it's specifically for 4:3 screens
 * @returns {number} Scale factor for 4:3 fullscreen
 */
export const use43Fullscreen = () => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calculateScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // 4:3 容器的基準尺寸
      const containerWidth = 1024;
      const containerHeight = 768;
      
      // 計算縮放比例，優先填滿高度（上下邊界）
      const scaleByHeight = viewportHeight / containerHeight;
      const scaleByWidth = viewportWidth / containerWidth;
      
      // 始終按高度縮放以填滿上下邊界，維持4:3比例
      setScale(scaleByHeight);
    };

    // 初始計算
    calculateScale();

    // 監聽視窗大小變化
    window.addEventListener('resize', calculateScale);

    return () => {
      window.removeEventListener('resize', calculateScale);
    };
  }, []);

  return scale;
};



















