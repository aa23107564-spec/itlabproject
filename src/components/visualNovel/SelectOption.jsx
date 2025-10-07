import React from 'react';
import '../../styles/visualNovel.css';

/**
 * 選項按鈕組件
 * 膠囊形狀，hover/pressed 時黑底白字
 */
const SelectOption = ({ text, onClick, isPressed = false, className = '' }) => {
  return (
    <div
      className={`select-chat handdrawn-border ${isPressed ? 'pressed' : ''} ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="select-chat__text">{text}</div>
    </div>
  );
};

export default SelectOption;

