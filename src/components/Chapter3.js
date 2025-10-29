import React, { useState } from 'react';
import WordGame from './WordGame';
import LongPressBackToLogin from './LongPressBackToLogin';
import KeyboardIntroPage from './KeyboardIntroPage';

function Chapter3() {
  const [showIntro, setShowIntro] = useState(true);
  const [showGame, setShowGame] = useState(false);
  const [showBlackOverlay, setShowBlackOverlay] = useState(false);

  const handleSkipIntro = () => {
    setShowIntro(false);
    setShowBlackOverlay(true); // 顯示黑色覆蓋層
    // 等待黑色動畫完成後才顯示遊戲
    setTimeout(() => {
      setShowGame(true);
      // 立即隱藏黑色覆蓋層，讓第三章介面顯示
      setShowBlackOverlay(false);
    }, 3000);
  };

  return (
    <>
      {/* 鍵盤引導頁面 */}
      {showIntro && <KeyboardIntroPage onSkip={handleSkipIntro} />}
      
      {/* 章節三內容 - 只有在遊戲開始後才顯示 */}
      {showGame && (
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#6B6B6B'
        }}>
          <WordGame startDelay={2000} />
          
          {/* Long Press Back to Login Component */}
          <LongPressBackToLogin />
        </div>
      )}
      
      {/* 黑色覆蓋層 - 在過渡期間顯示 */}
      {showBlackOverlay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000000',
          zIndex: 10000,
          pointerEvents: 'none'
        }}></div>
      )}
    </>
  );
}

export default Chapter3;

