import React, { useEffect, useState } from 'react';
import '../styles/keyboardIntro.css';

/**
 * 鍵盤引導頁面組件
 * 顯示白色背景和鍵盤圖標，按任意鍵跳過
 */
function KeyboardIntroPage({ onSkip, chapter = 3 }) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  // 根據章節決定顯示的內容
  const getChapterContent = () => {
    if (chapter === 2) {
      return {
        left: "a",
        leftSub: "上一句",
        center: " ",
        right: "b",
        rightSub: "下一句"
      };
    } else {
      // 第三章（默認）
      return {
        left: "◀",
        center: "選字\n確定",
        right: "▶"
      };
    }
  };

  const content = getChapterContent();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // 按下任意鍵開始淡出動畫
      if (!isFadingOut) {
        setIsFadingOut(true);
        
        // 等待淡出動畫完成後再調用onSkip
        setTimeout(() => {
          if (onSkip) {
            onSkip();
          }
        }, 3000); // 等待3秒讓淡出動畫完成
      }
    };

    // 監聽鍵盤事件
    window.addEventListener('keydown', handleKeyDown);

    // 清理事件監聽
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSkip, isFadingOut]);

  return (
    <div className="keyboard-intro-page">
      {/* 內容區域 - 吸入效果 */}
      <div className={`keyboard-intro-content ${isFadingOut ? 'suck-in-content' : ''}`}>
        {/* 鍵盤圖標和對應文字 */}
        <div className="keyboard-with-labels">
          {/* 左箭頭 - 對應左邊按鍵 */}
          <div className="keyboard-label keyboard-label-left">
            {chapter === 2 ? (
              <>
                <span className="keyboard-text keyboard-arrow">{content.left}</span>
                <span className="keyboard-text">{content.leftSub}</span>
              </>
            ) : (
              <span className="keyboard-text keyboard-arrow">{content.left}</span>
            )}
          </div>
          
          {/* 中間文字 - 對應中間按鍵 */}
          <div className="keyboard-label keyboard-label-center">
            {chapter === 3 ? (
              <>
                <span className="keyboard-text">選字</span>
                <span className="keyboard-text">確定</span>
                <span className="keyboard-text">↳  同時長按以退出  ↲</span>
              </>
            ) : (
              // 第一章和第二章
              <>
                <span className="keyboard-text">↳  同時長按以退出  ↲</span>
              </>
            )}
          </div>
          
          {/* 右箭頭 - 對應右邊按鍵 */}
          <div className="keyboard-label keyboard-label-right">
            {chapter === 2 ? (
              <>
                <span className="keyboard-text keyboard-arrow">{content.right}</span>
                <span className="keyboard-text">{content.rightSub}</span>
              </>
            ) : (
              <span className="keyboard-text keyboard-arrow">{content.right}</span>
            )}
          </div>
          
          {/* 鍵盤圖標 */}
          <img 
            src={`${process.env.PUBLIC_URL || ''}/images/icons/鍵盤.png`}
            alt="Keyboard Icon" 
            className="keyboard-icon"
          />
        </div>
        
        {/* 底部說明文字 */}
        <div className="keyboard-text-container">
          <div className="keyboard-text-line">
            <span className="keyboard-text keyboard-instruction">按下任意鍵開始</span>
          </div>
        </div>
      </div>
      
      {/* 黑色覆蓋層 */}
      {isFadingOut && <div className="black-overlay fade-in-overlay"></div>}
    </div>
  );
}

export default KeyboardIntroPage;

