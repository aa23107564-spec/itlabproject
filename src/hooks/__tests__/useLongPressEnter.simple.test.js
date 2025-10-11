import { renderHook } from '@testing-library/react';
import { useLongPressEnter } from '../useLongPressEnter';
import { useLocation } from 'react-router-dom';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useLocation: jest.fn()
}));

describe('useLongPressEnter Hook - Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with idle state', () => {
    useLocation.mockReturnValue({ pathname: '/chapter1' });
    
    const { result } = renderHook(() => useLongPressEnter({}));
    
    expect(result.current.state).toBe('idle');
    expect(result.current.progress).toBe(0);
    expect(result.current.isEnabled).toBe(true);
  });

  test('should not be enabled on non-enabled paths', () => {
    useLocation.mockReturnValue({ pathname: '/other-page' });
    
    const { result } = renderHook(() => useLongPressEnter({}));
    
    expect(result.current.isEnabled).toBe(false);
  });

  test('should handle custom configuration', () => {
    useLocation.mockReturnValue({ pathname: '/chapter1' });
    
    const customConfig = {
      loginPath: '/custom-login',
      revealDelayMs: 200,
      confirmHoldMs: 500,
      enabledPaths: ['/custom-path']
    };
    
    const { result } = renderHook(() => useLongPressEnter(customConfig));
    
    expect(result.current.isEnabled).toBe(false); // Not on enabled path
    
    // Change to enabled path
    useLocation.mockReturnValue({ pathname: '/custom-path' });
    
    const { result: result2 } = renderHook(() => useLongPressEnter(customConfig));
    expect(result2.current.isEnabled).toBe(true);
  });

  test('should return reset function', () => {
    useLocation.mockReturnValue({ pathname: '/chapter1' });
    
    const { result } = renderHook(() => useLongPressEnter({}));
    
    expect(typeof result.current.reset).toBe('function');
  });
});
