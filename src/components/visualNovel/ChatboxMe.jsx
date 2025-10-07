import React from 'react';
import '../../styles/visualNovel.css';

/**
 * 主角對話框組件
 * 灰色背景，左下角帶三角形指標
 */
const ChatboxMe = ({ text, isTyping = false }) => {
  return (
    <div className="chatbox-me">
      <div className="chatbox-me__container handdrawn-border">
        <div className="chatbox-me__text">
          {text}
        </div>
        <div className="chatbox-me__triangle"></div>
      </div>
    </div>
  );
};

export default ChatboxMe;

