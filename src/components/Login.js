import React, { useState, useRef, useEffect } from 'react';  
import { useNavigate } from 'react-router-dom';

function Login() {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // 組件載入時自動聚焦到輸入框
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setIsLoading(true);
      
      // 模擬加載過程
      setTimeout(() => {
        setIsLoading(false);
        // 根據輸入的數字導航到對應章節
        const input = inputValue.trim();
        if (input === 'chapter1' || input === '1') {
          navigate('/chapter1');
        } else if (input === 'chapter2' || input === '2') {
          navigate('/chapter2');
        } else if (input === 'chapter3' || input === '3') {
          navigate('/chapter3');
        } else {
          // 如果輸入其他內容，顯示錯誤提示
          setShowError(true);
          // 3秒後自動隱藏錯誤提示
          setTimeout(() => {
            setShowError(false);
          }, 3000);
        }
      }, 1500);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    // 清除錯誤狀態當用戶開始輸入
    if (showError) {
      setShowError(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };


  if (isLoading) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <div style={{ fontSize: '18px', color: '#666', fontFamily: '点点像素体-方形, monospace' }}>加載中...</div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      {/* 圖檔放置處 */}
      <div style={{
        width: '100px',
        height: '100px',
        backgroundColor: '#e0e0e0',
        border: '2px dashed #999',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: '14px',
        fontFamily: '点点像素体-方形, monospace'
      }}>
        圖檔放置處
      </div>

      {/* 標題 */}
      <h1 style={{
        fontSize: '24px',
        fontWeight: 'normal',
        color: '#333',
        marginBottom: '20px',
        textAlign: 'center',
        fontFamily: '点点像素体-方形, monospace'
      }}>
        請掃描讀取記憶
      </h1>

      {/* 輸入框 */}
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          style={{
            width: '300px',
            height: '50px',
            fontSize: '18px',
            padding: '0 15px',
            border: showError ? '2px solid #e74c3c' : '2px solid #ddd',
            borderRadius: '8px',
            outline: 'none',
            textAlign: 'center',
            fontFamily: '点点像素体-方形, monospace'
          }}
        />
        {/* 錯誤提示 */}
        {showError && (
          <div style={{
            color: '#e74c3c',
            fontSize: '16px',
            marginTop: '10px',
            textAlign: 'center',
            fontWeight: '500',
            fontFamily: '点点像素体-方形, monospace'
          }}>
            請重新掃描
          </div>
        )}
      </form>
    </div>
  );
}

export default Login;
