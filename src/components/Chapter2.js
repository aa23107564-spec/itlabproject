import React, { useState } from 'react';
import LongPressBackToLogin from './LongPressBackToLogin';
import VisualNovelEngine from './visualNovel/VisualNovelEngine';
import chapter2Script from '../data/chapter2Script';
import '../styles/visualNovel.css';

function Chapter2() {
  const [isComplete, setIsComplete] = useState(false);

  const handleComplete = () => {
    setIsComplete(true);
  };

  return (
    <div className="visual-novel-container">
      {/* 背景圖片（預留位置） */}
      {/* <img 
        src="/images/backgrounds/chapter2-bg.jpg" 
        alt="Background" 
        className="visual-novel-background"
      /> */}
      
      {/* 視覺小說引擎 */}
      <VisualNovelEngine 
        script={chapter2Script} 
        onComplete={handleComplete}
      />

      {/* 完成提示 */}
      {isComplete && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '32px',
          color: '#333',
          textAlign: 'center',
          zIndex: 10
        }}>
          章節二完成
        </div>
      )}
      
      {/* Long Press Back to Login Component */}
      <LongPressBackToLogin />
    </div>
  );
}

export default Chapter2;

