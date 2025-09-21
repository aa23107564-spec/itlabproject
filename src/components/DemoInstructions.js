import React from 'react';

function DemoInstructions() {
  return (
    <div style={{
      position: 'absolute',
      bottom: '16px',
      right: '16px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '300px',
      maxHeight: '200px',
      overflow: 'hidden',
      zIndex: 1000
    }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>LongPressBackToLogin 測試說明</h4>
      <ul style={{ margin: 0, paddingLeft: '16px' }}>
        <li>長按 Enter 0.5 秒顯示進度條</li>
        <li>再持續 1 秒完成並返回登入頁</li>
        <li>未滿 0.5 秒放開不顯示任何東西</li>
        <li>輸入框聚焦時不觸發</li>
        <li>僅在章節頁面啟用</li>
      </ul>
    </div>
  );
}

export default DemoInstructions;
