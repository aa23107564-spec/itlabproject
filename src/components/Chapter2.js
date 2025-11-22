import React, { useState, useEffect } from 'react';
import LongPressBackToLogin from './LongPressBackToLogin';
import VisualNovelEngine from './visualNovel/VisualNovelEngine';
import KeyboardIntroPage from './KeyboardIntroPage';
import chapter2Script from '../data/chapter2Script';
import '../styles/visualNovel.css';

function Chapter2() {
  const [showIntro, setShowIntro] = useState(true); // 控制鍵盤引導頁面顯示
  const [isComplete, setIsComplete] = useState(false);
  const [showContent, setShowContent] = useState(false); // 控制內容顯示
  const [showEndingFadeOut, setShowEndingFadeOut] = useState(false); // 控制結局淡出效果
  const [isEndingBA, setIsEndingBA] = useState(false); // 標記是否是 ending-b-a 分支結局
  const [hideParticles, setHideParticles] = useState(false); // 控制顆粒動畫隱藏
  const [currentDialogueClass, setCurrentDialogueClass] = useState(''); // 當前對話的 className
  const [startAnimation, setStartAnimation] = useState(false); // 控制開場動畫開始
  const [showVideoFlicker, setShowVideoFlicker] = useState(false); // 控制視頻閃爍效果
  const [videoFlickerState, setVideoFlickerState] = useState('black'); // 'video' 或 'black'
  const [flickerCount, setFlickerCount] = useState(0); // 閃爍次數計數
  const [videoLoaded, setVideoLoaded] = useState(false); // 視頻是否已加載
  const videoRef = React.useRef(null); // 視頻元素引用
  // 使用三個圖片層來避免 src 切換導致的閃現
  const [imageOpacities, setImageOpacities] = useState({
    img22_1: 0, // 第一個 22.jpg，用於初始淡入和最終顯示
    imgDrink: 0, // drinkcoffee.jpg
    img22_2: 0  // 第二個 22.jpg，用於第二次轉場
  });

  const handleSkipIntro = () => {
    setShowIntro(false);
  };

  const handleComplete = (branchName) => {
    console.log('handleComplete 被調用，分支:', branchName);
    setIsComplete(true);
    
    // 檢查是否是 ending-b-a 分支的特殊結局
    if (branchName === 'ending-b-a') {
      console.log('ending-b-a 分支結局，對話框淡出後隱藏顆粒');
      // ending-b-a 分支：標記特殊狀態，開始對話框淡出
      setIsEndingBA(true);
      // 2秒後隱藏顆粒動畫（對話框淡出完成）
      setTimeout(() => {
        setHideParticles(true); // 隱藏顆粒動畫
        // 對話框淡出後，開始視頻閃爍效果
        setShowVideoFlicker(true);
      }, 2000);
    } else {
      console.log('其他分支結局，立即隱藏對話框後開始淡出，分支:', branchName);
      // 其他分支：立即隱藏對話框，然後開始淡出效果
      setShowContent(false); // 立即隱藏對話框
      // 短暫延遲後開始淡出動畫，確保對話框已隱藏
      setTimeout(() => {
        console.log('開始淡出效果');
        setShowEndingFadeOut(true);
      }, 100);
    }
  };

  // 開場動畫效果 - 三張圖片的交叉淡入淡出動畫（總時長8秒）
  // 只有在鍵盤引導頁面消失後才開始播放
  useEffect(() => {
    if (!showIntro) {
      // 啟動動畫開始標記（觸發 CSS 淡入動畫）
      setStartAnimation(true);
      
      // 第一階段：22.jpg 從黑屏淡入（0-2秒），使用 CSS 動畫
      // img22_1 的 opacity 由 CSS 動畫控制，從 0 到 1
      
      // 第二階段：drinkcoffee.jpg 淡入（2-3.5秒）
      const timer1 = setTimeout(() => {
        setImageOpacities({
          img22_1: 1, // 保持顯示
          imgDrink: 1, // 淡入
          img22_2: 0
        });
      }, 2000);

      // 第三階段：22.jpg 淡入覆蓋 drinkcoffee（5-6.5秒）- 拉長 drink 停留時間
      const timer2 = setTimeout(() => {
        setImageOpacities({
          img22_1: 1, // 保持顯示
          imgDrink: 1, // 保持顯示
          img22_2: 1  // 淡入覆蓋
        });
      }, 5000); // 從 3500 改為 5000，讓 drink 多停留 1.5 秒

      // 第四階段：顯示對話（8秒後）
      const contentTimer = setTimeout(() => {
        setShowContent(true);
      }, 8000); // 2s淡入 + 1.5s轉場 + 1.5s停留 + 1.5s轉場 + 1.5s延遲 = 8s
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(contentTimer);
      };
    }
  }, [showIntro]);

  // 結局淡出後的視頻閃爍效果
  useEffect(() => {
    if (showEndingFadeOut && !isEndingBA) {
      // 淡出動畫持續 3 秒，之後開始視頻閃爍效果
      const startFlickerTimer = setTimeout(() => {
        setShowVideoFlicker(true);
      }, 3000);

      return () => clearTimeout(startFlickerTimer);
    }
  }, [showEndingFadeOut, isEndingBA]);

  // 視頻閃爍效果邏輯 - 不規律地切換視頻和黑屏
  useEffect(() => {
    if (!showVideoFlicker) return;
    
    // 播放完畢後，回到登入頁面
    if (flickerCount >= 10) {
      console.log('視頻閃爍效果結束，回到登入頁面');
      setTimeout(() => {
        window.location.href = '/itlabproject/';
      }, 1000); // 最後停留 1 秒後返回
      return;
    }

    // 生成不規律的持續時間（200ms - 1000ms）
    const getRandomDuration = () => Math.random() * 800 + 200;
    
    const timer = setTimeout(() => {
      setVideoFlickerState(prevState => {
        const newState = prevState === 'black' ? 'video' : 'black';
        setFlickerCount(count => count + 1);
        return newState;
      });
    }, getRandomDuration());

    return () => clearTimeout(timer);
  }, [showVideoFlicker, videoFlickerState, flickerCount]);

  // 當視頻閃爍效果開始時，嘗試播放視頻並從視頻開始
  useEffect(() => {
    if (showVideoFlicker && videoRef.current) {
      console.log('視頻閃爍效果開始，嘗試播放視頻');
      // 設置音量
      videoRef.current.volume = 1.0;
      videoRef.current.play().then(() => {
        console.log('視頻播放成功，音量:', videoRef.current.volume);
        setVideoLoaded(true);
        // 從視頻開始，延遲一點再開始切換
        setTimeout(() => {
          setVideoFlickerState('video');
        }, 100);
      }).catch(err => {
        console.error('視頻播放失敗:', err);
      });
    }
  }, [showVideoFlicker]);

  // 根據視頻/黑屏狀態控制音量 - 黑屏時靜音，視頻時恢復聲音
  useEffect(() => {
    if (videoRef.current && showVideoFlicker) {
      if (videoFlickerState === 'black') {
        videoRef.current.volume = 0;
        console.log('切換到黑屏，靜音');
      } else if (videoFlickerState === 'video') {
        videoRef.current.volume = 1.0;
        console.log('切換到視頻，恢復聲音');
      }
    }
  }, [videoFlickerState, showVideoFlicker]);

  return (
    <>
      {/* 鍵盤引導頁面 */}
      {showIntro && <KeyboardIntroPage onSkip={handleSkipIntro} chapter={2} />}
      
      {/* 章節二內容 */}
      <div className={`visual-novel-container ${currentDialogueClass === 'shout-effect' ? 'shout-effect-background' : ''}`}>
        {/* 第一層：22.jpg - 初始淡入，z-index: 1 */}
        <img 
          src={`${process.env.PUBLIC_URL || ''}/images/backgrounds/22.jpg`}
          alt="Background 22" 
          className={`visual-novel-background bg-layer-1 ${startAnimation ? 'fade-in-start' : ''}`}
          style={{ zIndex: 1 }}
        />
        
        {/* 第二層：drinkcoffee.jpg - 第一次轉場，z-index: 2 */}
        <img 
          src={`${process.env.PUBLIC_URL || ''}/images/backgrounds/drinkcoffee.jpg`}
          alt="Background Drink Coffee" 
          className="visual-novel-background bg-layer-transition"
          style={{ 
            opacity: imageOpacities.imgDrink,
            zIndex: 2,
            transition: 'opacity 1.5s ease-in-out'
          }}
        />
        
        {/* 第三層：22.jpg - 第二次轉場，z-index: 3 */}
        <img 
          src={`${process.env.PUBLIC_URL || ''}/images/backgrounds/22.jpg`}
          alt="Background 22 Final" 
          className="visual-novel-background bg-layer-transition"
          style={{ 
            opacity: imageOpacities.img22_2,
            zIndex: 3,
            transition: 'opacity 1.5s ease-in-out'
          }}
        />
        
        {/* 視覺小說引擎 - 背景動畫完成後才顯示 */}
        {showContent && (
          <VisualNovelEngine 
            script={chapter2Script} 
            onComplete={handleComplete}
            isEndingBA={isEndingBA}
            hideParticles={hideParticles}
            onNodeChange={setCurrentDialogueClass}
          />
        )}

        {/* 結局淡出覆蓋層 */}
        {showEndingFadeOut && (
          <div className={`ending-fade-out-overlay ${isEndingBA ? 'ending-b-a-fade' : ''}`}></div>
        )}

        {/* 視頻閃爍效果層 - 在淡出後顯示 */}
        {showVideoFlicker && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 10000,
              backgroundColor: 'black'
            }}
          >
            {/* 視頻層 */}
            <video 
              ref={videoRef}
              className="video-flicker-video"
              loop
              playsInline
              preload="auto"
              webkit-playsinline="true"
              x5-playsinline="true"
              onLoadedData={() => {
                console.log('視頻數據已加載');
                setVideoLoaded(true);
              }}
              onCanPlay={() => {
                console.log('視頻可以播放');
              }}
              onError={(e) => {
                console.error('視頻加載錯誤:', e);
                console.error('視頻元素:', videoRef.current);
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: videoFlickerState === 'video' ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out'
              }}
            >
              <source src={`${process.env.PUBLIC_URL}/images/content/第四章-1.mp4`} type="video/mp4" />
              您的瀏覽器不支持視頻播放
            </video>
            {/* 黑屏層 - 通過 opacity 控制是否顯示 */}
            <div 
              className="video-flicker-black"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'black',
                opacity: videoFlickerState === 'black' ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
                pointerEvents: 'none'
              }}
            />
          </div>
        )}
        
        {/* Long Press Back to Login Component - 第二章專用白色樣式（左下偏移、放大） */}
        <LongPressBackToLogin 
          position="custom"
          customPosition={{ right: '100px', top: '80px' }}
          textColor="#ffffff"
          progressColor="#ffffff"
          progressBgColor="rgba(255, 255, 255, 0.3)"
          scale={1.3}
        />
      </div>
    </>
  );
}

export default Chapter2;

