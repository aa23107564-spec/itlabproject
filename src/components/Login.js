import React, { useState, useRef, useEffect } from 'react';  
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
      }, 2000);
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
        width: '100vw',
        height: '100vh',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '40px',
          width: '50px',
          height: '50px',
          position: 'relative'
        }}>
          {Array.from({ length: 8 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{
                opacity: index === 0 ? 1 : 0
              }}
              style={{
                position: 'absolute',
                width: '4px',
                height: '12px',
                backgroundColor: '#666',
                borderRadius: '2px',
                transformOrigin: 'center 25px',
                transform: `rotate(${index * 45}deg)`
              }}
              animate={{
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                delay: index * 0.2,
                ease: [0.4, 0.0, 0.2, 1],
                times: index === 0 ? [0, 0.3, 1] : [0, 0.5, 1]
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: '18px', color: '#666', fontFamily: '点点像素体-方形, monospace' }}>加載中...</div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      overflow: 'hidden'
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
        fontWeight: '500',
        color: '#333',
        marginBottom: '20px',
        textAlign: 'center',
        fontFamily: '点点像素体-方形, monospace',
        fontStyle: 'normal'
      }}>
        請掃描條碼讀取記憶
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
            height: '40px',
            fontSize: '18px',
            padding: '0 15px',
            border: 'none',
            borderRadius: '0',
            outline: 'none',
            textAlign: 'center',
            fontFamily: '点点像素体-方形, monospace',
            backgroundColor: '#D4D4DE'
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
