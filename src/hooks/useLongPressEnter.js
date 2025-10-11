import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Hook for handling long press Left+Right arrow keys functionality
 * @param {Object} options - Configuration options
 * @param {string} options.loginPath - Path to navigate to on completion
 * @param {number} options.revealDelayMs - Delay before showing UI (default: 500ms)
 * @param {number} options.confirmHoldMs - Time for progress bar completion (default: 1000ms)
 * @param {string[]} options.enabledPaths - Paths where this hook is enabled
 * @returns {Object} Hook state and handlers
 */
export const useLongPressEnter = ({
  loginPath = '/',
  revealDelayMs = 500,
  confirmHoldMs = 1000,
  enabledPaths = ['/chapter1', '/chapter2', '/chapter3']
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState('idle'); // 'idle' | 'revealing' | 'showing' | 'completed'
  const [progress, setProgress] = useState(0);
  
  const revealTimerRef = useRef(null);
  const progressTimerRef = useRef(null);
  const startTimeRef = useRef(null);
  const isLongPressingRef = useRef(false);
  const pressedKeysRef = useRef(new Set()); // Track pressed keys
  const keyPressTimesRef = useRef({}); // Track key press times
  const gameInteractionBlockedRef = useRef(false); // Block game interaction when combination detected
  const combinationDetectedRef = useRef(false); // Track if combination was detected

  // Check if current path is enabled
  const isEnabled = enabledPaths.includes(location.pathname);

  // Check if current active element is an input field
  const isInputFocused = useCallback(() => {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );
  }, []);

  // Reset all timers and state
  const reset = useCallback(() => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    if (progressTimerRef.current) {
      cancelAnimationFrame(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setState('idle');
    setProgress(0);
    isLongPressingRef.current = false;
    pressedKeysRef.current.clear(); // Clear pressed keys
    keyPressTimesRef.current = {}; // Clear key press times
    gameInteractionBlockedRef.current = false; // Reset game interaction block
    combinationDetectedRef.current = false; // Reset combination detection
  }, []);

  // Start reveal timer
  const startRevealTimer = useCallback(() => {
    if (revealTimerRef.current) return;
    
    setState('revealing');
    revealTimerRef.current = setTimeout(() => {
      setState('showing');
      startProgressTimer();
    }, revealDelayMs);
  }, [revealDelayMs, startProgressTimer]);

  // Start progress timer with smooth animation using requestAnimationFrame + performance.now()
  const startProgressTimer = useCallback(() => {
    startTimeRef.current = performance.now();
    
    const updateProgress = (currentTime) => {
      if (!isLongPressingRef.current) return;
      
      const elapsed = currentTime - startTimeRef.current;
      const progressPercent = Math.min((elapsed / confirmHoldMs) * 100, 100);
      
      // 使用 requestAnimationFrame 確保平滑更新
      setProgress(progressPercent);
      
      if (progressPercent >= 100) {
        setState('completed');
        // Navigate to login page using React Router
        navigate(loginPath);
        return;
      }
      
      // 繼續下一幀動畫
      progressTimerRef.current = requestAnimationFrame(updateProgress);
    };
    
    // 開始動畫循環
    progressTimerRef.current = requestAnimationFrame(updateProgress);
  }, [confirmHoldMs, loginPath, navigate]);

  // Handle keydown event
  const handleKeyDown = useCallback((event) => {
    if (!isEnabled || isInputFocused()) {
      return;
    }

    // Track pressed keys and times
    pressedKeysRef.current.add(event.key);
    keyPressTimesRef.current[event.key] = Date.now();
    
    // Check if both Left and Right arrow keys are pressed within 150ms
    if (pressedKeysRef.current.has('ArrowLeft') && pressedKeysRef.current.has('ArrowRight')) {
      const leftTime = keyPressTimesRef.current['ArrowLeft'];
      const rightTime = keyPressTimesRef.current['ArrowRight'];
      
      if (leftTime && rightTime && Math.abs(leftTime - rightTime) <= 150) {
        if (isLongPressingRef.current) return; // Prevent multiple triggers
        
        combinationDetectedRef.current = true; // Mark combination as detected
        gameInteractionBlockedRef.current = true; // Block game interaction
        isLongPressingRef.current = true;
        startRevealTimer();
      }
    }
  }, [isEnabled, isInputFocused, startRevealTimer]);

  // Handle keyup event
  const handleKeyUp = useCallback((event) => {
    if (!isEnabled) return;
    
    // Remove released key from pressed keys
    pressedKeysRef.current.delete(event.key);
    delete keyPressTimesRef.current[event.key];
    
    // If either Left or Right arrow key is released, reset
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      // If combination was detected, keep blocking game interaction for a short time
      if (combinationDetectedRef.current) {
        // Keep blocking for 100ms to prevent any delayed game operations
        setTimeout(() => {
          reset();
        }, 100);
      } else {
        reset();
      }
    }
  }, [isEnabled, reset]);

  // Handle visibility change (tab switching)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      reset();
    }
  }, [reset]);

  // Setup event listeners
  useEffect(() => {
    if (!isEnabled) return;

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      reset();
    };
  }, [isEnabled, handleKeyDown, handleKeyUp, handleVisibilityChange, reset]);

  return {
    state,
    progress,
    isEnabled,
    reset,
    isGameInteractionBlocked: gameInteractionBlockedRef.current,
    isCombinationDetected: combinationDetectedRef.current
  };
};
