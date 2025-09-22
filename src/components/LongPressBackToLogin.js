import React from 'react';
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
  zIndex = 9999
}) => {
  const { state, progress, isEnabled } = useLongPressEnter({
    loginPath,
    revealDelayMs,
    confirmHoldMs,
    enabledPaths
  });

  // Don't render if not enabled or not in showing/completed state
  if (!isEnabled || state === 'idle' || state === 'revealing') {
    return null;
  }

  // Calculate SVG circle properties for smooth progress
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getStatusText = () => {
    switch (state) {
      case 'revealing':
        return '偵測到長按，即將顯示返回選項';
      case 'showing':
        return '持續按住以返回登入頁';
      case 'completed':
        return '正在返回登入頁';
      default:
        return '';
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        right: '216px',
        bottom: '31px',
        zIndex,
        opacity: state === 'revealing' ? 0.7 : 1,
        transition: 'opacity 0.2s ease-in-out',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      {/* Circular Progress Bar */}
      <div style={{ position: 'relative', width: '40px', height: '40px' }}>
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          style={{ transform: 'rotate(-90deg)' }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="返回登入頁進度"
        >
          {/* Background circle */}
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="2.5"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="#3b82f6"
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
          color: '#374151',
          fontWeight: '500',
          whiteSpace: 'nowrap'
        }}
      >
        長按以返回
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
