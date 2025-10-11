import React, { useState, useEffect } from 'react';

function ScreenInfo() {
  const [screenInfo, setScreenInfo] = useState({
    screenWidth: 0,
    screenHeight: 0,
    windowWidth: 0,
    windowHeight: 0,
    devicePixelRatio: 1,
    aspectRatio: ''
  });

  useEffect(() => {
    const updateScreenInfo = () => {
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const devicePixelRatio = window.devicePixelRatio || 1;
      
      // 計算寬高比
      const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
      const divisor = gcd(screenWidth, screenHeight);
      const aspectRatio = `${screenWidth / divisor}:${screenHeight / divisor}`;

      setScreenInfo({
        screenWidth,
        screenHeight,
        windowWidth,
        windowHeight,
        devicePixelRatio,
        aspectRatio
      });
    };

    updateScreenInfo();
    window.addEventListener('resize', updateScreenInfo);

    return () => {
      window.removeEventListener('resize', updateScreenInfo);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 10000,
      minWidth: '200px'
    }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>螢幕資訊</h4>
      <div>螢幕解析度: {screenInfo.screenWidth} × {screenInfo.screenHeight}</div>
      <div>視窗大小: {screenInfo.windowWidth} × {screenInfo.windowHeight}</div>
      <div>寬高比: {screenInfo.aspectRatio}</div>
      <div>像素密度: {screenInfo.devicePixelRatio}x</div>
      <div>實際像素: {Math.round(screenInfo.screenWidth * screenInfo.devicePixelRatio)} × {Math.round(screenInfo.screenHeight * screenInfo.devicePixelRatio)}</div>
    </div>
  );
}

export default ScreenInfo;











