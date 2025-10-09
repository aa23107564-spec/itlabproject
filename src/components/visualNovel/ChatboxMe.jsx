import React from 'react';
import '../../styles/visualNovel.css';

/**
 * 主角對話框組件
 * 灰色背景，左下角帶三角形指標
 */
const ChatboxMe = ({ text, isTyping = false, className = '' }) => {
  return (
    <div className={`chatbox-me ${className}`}>
      <div className="chatbox-me__container handdrawn-border">
        <div 
          className="chatbox-me__text"
          dangerouslySetInnerHTML={{ __html: text }}
        />
        <div className="chatbox-me__triangle"></div>
        {!isTyping && (
          <div className="continue-indicator"></div>
        )}
      </div>
    </div>
  );
};

export default ChatboxMe;

