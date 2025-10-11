import React, { useEffect } from 'react';
import { useLongPressEnter } from '../hooks/useLongPressEnter';

/**
 * LongPressBackToLogin Component
 * A hidden component that appears when user long-presses Enter key
 * Shows a circular progress bar and navigates back to login page
 */
const LongPressBackToLogin = ({
  loginPath = '/',
  revealDelayMs = 500,
  confirmHoldMs = 1000,
  enabledPaths = ['/chapter1', '/chapter2', '/chapter3'],
  zIndex = 9999,
  position = 'bottom-right', // 'bottom-right' 或 'top-right' 或 'custom'
  textColor = '#374151', // 預設深灰色
  progressColor = '#6b7280', // 預設灰色
  progressBgColor = '#e5e7eb', // 預設淺灰色
  customPosition = null, // 自定義位置 { right, top, left, bottom }
  scale = 1 // 縮放比例，預設為 1（100%）
}) => {
  const { state, progress, isEnabled, isGameInteractionBlocked, isCombinationDetected } = useLongPressEnter({
    loginPath,
    revealDelayMs,
    confirmHoldMs,
    enabledPaths
  });

  // 將遊戲互動阻擋狀態暴露給全局
  useEffect(() => {
    window.gameInteractionBlocked = isGameInteractionBlocked;
    window.combinationDetected = isCombinationDetected;
  }, [isGameInteractionBlocked, isCombinationDetected]);

  // Don't render if not enabled or not in showing/completed state
  if (!isEnabled || state === 'idle' || state === 'revealing') {
    return null;
  }

  // Calculate SVG circle properties for smooth progress
  const radius = 14; // 縮小進度條
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getStatusText = () => {
    switch (state) {
      case 'revealing':
        return '偵測到長按左鍵+右鍵，即將顯示返回選項';
      case 'showing':
        return '持續按住左鍵+右鍵以返回登入頁';
      case 'completed':
        return '正在返回登入頁';
      default:
        return '';
    }
  };

  // 根據 position 屬性決定位置
  let positionStyle;
  if (position === 'custom' && customPosition) {
    positionStyle = customPosition;
  } else if (position === 'top-right') {
    positionStyle = { right: '16px', top: '16px' };
  } else {
    positionStyle = { right: '216px', bottom: '31px' };
  }

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyle,
        zIndex,
        opacity: state === 'revealing' ? 0.7 : 1,
        transition: 'opacity 0.2s ease-in-out',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transform: `scale(${scale})`,
        transformOrigin: 'top right'
      }}
    >
      {/* Circular Progress Bar */}
      <div style={{ position: 'relative', width: '32px', height: '32px' }}>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          style={{ transform: 'rotate(-90deg)' }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="返回登入頁進度"
        >
          {/* Background circle */}
          <circle
            cx="16"
            cy="16"
            r={radius}
            stroke={progressBgColor}
            strokeWidth="2.5"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="16"
            cy="16"
            r={radius}
            stroke={progressColor}
            strokeWidth="2.5"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'none' // 移除 transition 確保平滑動畫
            }}
          />
        </svg>
      </div>

      {/* Text label */}
      <span
        style={{
          fontSize: '12px',
          color: textColor,
          fontWeight: '500',
          whiteSpace: 'nowrap',
          fontFamily: '点点像素体-方形, monospace'
        }}
      >
        長按左鍵+右鍵以返回
      </span>

      {/* Screen reader status */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      >
        {getStatusText()}
      </div>
    </div>
  );
};

export default LongPressBackToLogin;
