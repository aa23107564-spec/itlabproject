import React from 'react';
import LongPressBackToLogin from './LongPressBackToLogin';
import DemoInstructions from './DemoInstructions';

function TestPage() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <h1 style={{ fontSize: '24px', color: '#333' }}>測試頁面</h1>
      <p style={{ fontSize: '16px', color: '#666', textAlign: 'center', maxWidth: '600px' }}>
        這個頁面用來測試 LongPressBackToLogin 元件。<br/>
        請嘗試在輸入框中輸入文字，然後長按 Enter 鍵測試功能。
      </p>
      
      {/* Test input field */}
      <input
        type="text"
        placeholder="在這裡輸入文字測試輸入框排除功能"
        style={{
          padding: '10px',
          fontSize: '16px',
          border: '2px solid #ddd',
          borderRadius: '8px',
          width: '300px'
        }}
      />
      
      {/* Long Press Back to Login Component */}
      <LongPressBackToLogin 
        enabledPaths={['/test']}
        loginPath="/"
      />
      
      <div style={{ fontSize: '14px', color: '#999', textAlign: 'center' }}>
        在輸入框外長按 Enter 0.5 秒會顯示進度條，再持續 1 秒會返回登入頁
      </div>
      
      {/* Demo Instructions */}
      <DemoInstructions />
    </div>
  );
}

export default TestPage;
