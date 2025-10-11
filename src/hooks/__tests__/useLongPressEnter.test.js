import { renderHook, act } from '@testing-library/react';
import { useLongPressEnter } from '../useLongPressEnter';
import { useLocation } from 'react-router-dom';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useLocation: jest.fn()
}));

// Mock window.location.assign
const mockAssign = jest.fn();
delete window.location;
window.location = {
  assign: mockAssign
};

// Mock performance.now
let mockTime = 0;
global.performance = {
  now: () => mockTime
};

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});
global.requestAnimationFrame = mockRequestAnimationFrame;

// Mock setTimeout and clearTimeout
const mockSetTimeout = jest.fn((callback, delay) => {
  return setTimeout(callback, delay);
});
const mockClearTimeout = jest.fn();
global.setTimeout = mockSetTimeout;
global.clearTimeout = mockClearTimeout;

describe('useLongPressEnter Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTime = 0;
    mockAssign.mockClear();
    
    // Mock document.activeElement
    Object.defineProperty(document, 'activeElement', {
      value: document.body,
      writable: true
    });
  });

  test('should initialize with idle state', () => {
    useLocation.mockReturnValue({ pathname: '/chapter1' });
    
    const { result } = renderHook(() => useLongPressEnter());
    
    expect(result.current.state).toBe('idle');
    expect(result.current.progress).toBe(0);
    expect(result.current.isEnabled).toBe(true);
  });

  test('should not be enabled on non-enabled paths', () => {
    useLocation.mockReturnValue({ pathname: '/other-page' });
    
    const { result } = renderHook(() => useLongPressEnter());
    
    expect(result.current.isEnabled).toBe(false);
  });

  test('should start revealing when Enter is pressed', () => {
    useLocation.mockReturnValue({ pathname: '/chapter1' });
    
    const { result } = renderHook(() => useLongPressEnter());
    
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);
    });
    
    expect(result.current.state).toBe('revealing');
  });

  test('should not start when input is focused', () => {
    useLocation.mockReturnValue({ pathname: '/chapter1' });
    
    // Mock input element as active
    const mockInput = { tagName: 'INPUT' };
    Object.defineProperty(document, 'activeElement', {
      value: mockInput,
      writable: true
    });
    
    const { result } = renderHook(() => useLongPressEnter());
    
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);
    });
    
    expect(result.current.state).toBe('idle');
  });

  test('should reset when Enter is released', () => {
    useLocation.mockReturnValue({ pathname: '/chapter1' });
    
    const { result } = renderHook(() => useLongPressEnter());
    
    // Press Enter
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);
    });
    
    expect(result.current.state).toBe('revealing');
    
    // Release Enter
    act(() => {
      const event = new KeyboardEvent('keyup', { key: 'Enter' });
      document.dispatchEvent(event);
    });
    
    expect(result.current.state).toBe('idle');
    expect(result.current.progress).toBe(0);
  });

  test('should show UI after reveal delay', async () => {
    useLocation.mockReturnValue({ pathname: '/chapter1' });
    
    const { result } = renderHook(() => useLongPressEnter({
      revealDelayMs: 100
    }));
    
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);
    });
    
    expect(result.current.state).toBe('revealing');
    
    // Wait for reveal delay
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });
    
    expect(result.current.state).toBe('showing');
  });

  test('should complete and navigate after confirm hold time', async () => {
    useLocation.mockReturnValue({ pathname: '/chapter1' });
    
    const { result } = renderHook(() => useLongPressEnter({
      revealDelayMs: 50,
      confirmHoldMs: 100
    }));
    
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);
    });
    
    // Wait for reveal
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(result.current.state).toBe('showing');
    
    // Simulate progress over time
    act(() => {
      mockTime = 50; // Half progress
    });
    
    // Wait for completion
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    act(() => {
      mockTime = 100; // Full progress
    });
    
    expect(result.current.state).toBe('completed');
    expect(mockAssign).toHaveBeenCalledWith('/');
  });

  test('should reset when page becomes hidden', () => {
    useLocation.mockReturnValue({ pathname: '/chapter1' });
    
    const { result } = renderHook(() => useLongPressEnter());
    
    // Start long press
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);
    });
    
    expect(result.current.state).toBe('revealing');
    
    // Simulate page becoming hidden
    act(() => {
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true
      });
      const event = new Event('visibilitychange');
      document.dispatchEvent(event);
    });
    
    expect(result.current.state).toBe('idle');
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

  test('should clean up event listeners on unmount', () => {
    useLocation.mockReturnValue({ pathname: '/chapter1' });
    
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    const { unmount } = renderHook(() => useLongPressEnter());
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });
});
