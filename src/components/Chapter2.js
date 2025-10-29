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

