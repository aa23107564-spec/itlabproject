import React, { useState } from 'react';
import LongPressBackToLogin from './LongPressBackToLogin';
import KeyboardIntroPage from './KeyboardIntroPage';
import Chapter1ModelViewer from './Chapter1ModelViewer';

function Chapter1() {
  const [showIntro, setShowIntro] = useState(true);

  const handleSkipIntro = () => {
    setShowIntro(false);
  };

  return (
    <>
      {/* 鍵盤引導頁面 */}
      {showIntro && <KeyboardIntroPage onSkip={handleSkipIntro} chapter={1} />}
      
      {/* 章節一內容 - 3D 模型查看器 */}
      {!showIntro && (
        <div style={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <Chapter1ModelViewer />
          
          {/* Long Press Back to Login Component */}
          <LongPressBackToLogin />
        </div>
      )}
    </>
  );
}

export default Chapter1;

