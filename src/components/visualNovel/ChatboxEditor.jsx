import React from 'react';
import '../../styles/visualNovel.css';

/**
 * 編輯對話框組件
 * 白色背景，黑色邊框，頂部帶黑色名牌
 */
const ChatboxEditor = ({ text, name = '編輯', isTyping = false, className = '' }) => {
  return (
    <div className={`chatbox-editor ${className}`}>
      <div className="chatbox-editor__name-tag">
        <div className="chatbox-editor__name-tag-text">{name}</div>
      </div>
      <div className="chatbox-editor__container handdrawn-border">
        <div 
          className="chatbox-editor__text"
          dangerouslySetInnerHTML={{ __html: text }}
        />
        {!isTyping && (
          <div className="continue-indicator"></div>
        )}
      </div>
    </div>
  );
};

export default ChatboxEditor;

