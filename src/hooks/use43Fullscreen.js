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
      
      // 計算視窗的寬高比
      const viewportRatio = viewportWidth / viewportHeight;
      const containerRatio = containerWidth / containerHeight; // 4:3 = 1.333...
      
      // 如果是 4:3 螢幕（比例接近 1.333），則填滿整個螢幕
      if (Math.abs(viewportRatio - containerRatio) < 0.1) {
        // 4:3 螢幕：計算填滿螢幕的縮放比例
        const scaleX = viewportWidth / containerWidth;
        const scaleY = viewportHeight / containerHeight;
        const fullscreenScale = Math.min(scaleX, scaleY);
        setScale(fullscreenScale);
      } else {
        // 非 4:3 螢幕：保持原始尺寸，周圍顯示黑邊
        setScale(1);
      }
    };

    // 初始計算
    calculateScale();

    // 監聽視窗大小變化（僅用於全螢幕切換）
    window.addEventListener('resize', calculateScale);

    return () => {
      window.removeEventListener('resize', calculateScale);
    };
  }, []);

  return scale;
};



















