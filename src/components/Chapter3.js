import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WordGame from './WordGame';
import LongPressBackToLogin from './LongPressBackToLogin';
import KeyboardIntroPage from './KeyboardIntroPage';

function Chapter3() {
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(true);
  const [showGame, setShowGame] = useState(false);
  const [showBlackOverlay, setShowBlackOverlay] = useState(false);
  const [showFadeOut, setShowFadeOut] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef(null);

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

  // 處理遊戲完成
  const handleGameComplete = () => {
    // 開始淡出效果
    setShowFadeOut(true);
    
    // 淡出動畫完成後播放視頻（延長淡出時間到3秒）
    setTimeout(() => {
      setShowGame(false); // 隱藏遊戲
      setShowVideo(true); // 顯示視頻
    }, 3000); // 3秒淡出動畫
  };

  // 監聽視頻加載和播放
  useEffect(() => {
    const video = videoRef.current;
    if (video && showVideo) {
      // 當視頻可以播放時，開始播放
      const handleCanPlay = () => {
        video.play().catch(err => {
          console.warn('視頻播放失敗:', err);
        });
      };
      
      // 監聽視頻播放結束
      const handleEnded = () => {
        // 視頻播放結束後導航回登錄頁面
        navigate('/');
      };
      
      // 如果視頻已經可以播放，直接播放
      if (video.readyState >= 2) {
        video.play().catch(err => {
          console.warn('視頻播放失敗:', err);
        });
      } else {
        video.addEventListener('canplay', handleCanPlay, { once: true });
      }
      
      video.addEventListener('ended', handleEnded);
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [showVideo, navigate]);

  return (
    <>
      {/* 鍵盤引導頁面 */}
      {showIntro && <KeyboardIntroPage onSkip={handleSkipIntro} />}
      
      {/* 章節三內容 - 只有在遊戲開始後才顯示 */}
      {showGame && (
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#6B6B6B',
          position: 'relative'
        }}>
          <WordGame startDelay={2000} onGameComplete={handleGameComplete} />
          
          {/* Long Press Back to Login Component */}
          <LongPressBackToLogin />
          
          {/* 黑色淡出覆蓋層 */}
          {showFadeOut && (
            <>
              <style>{`
                @keyframes fadeToBlack {
                  from {
                    opacity: 0;
                  }
                  to {
                    opacity: 1;
                  }
                }
              `}</style>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: '#000000',
                opacity: 0,
                animation: 'fadeToBlack 3s ease-out forwards',
                zIndex: 10000,
                pointerEvents: 'none'
              }}></div>
            </>
          )}
        </div>
      )}
      
      {/* 視頻播放器 */}
      {showVideo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000000',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <video
            ref={videoRef}
            src={`${process.env.PUBLIC_URL || ''}/images/content/ch4.mp4`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            playsInline
          />
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

