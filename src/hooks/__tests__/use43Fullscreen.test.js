import { renderHook, act } from '@testing-library/react';
import { use43Fullscreen } from '../use43Fullscreen';

// Mock window.innerWidth and window.innerHeight
let mockInnerWidth = 1024;
let mockInnerHeight = 768;

Object.defineProperty(window, 'innerWidth', {
  get: () => mockInnerWidth,
  configurable: true
});

Object.defineProperty(window, 'innerHeight', {
  get: () => mockInnerHeight,
  configurable: true
});

// Mock addEventListener and removeEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

Object.defineProperty(window, 'addEventListener', {
  writable: true,
  value: mockAddEventListener
});

Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  value: mockRemoveEventListener
});

describe('use43Fullscreen Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInnerWidth = 1024;
    mockInnerHeight = 768;
  });

  test('should return scale 1 for non-4:3 screens', () => {
    // Mock 16:9 screen (1920x1080)
    mockInnerWidth = 1920;
    mockInnerHeight = 1080;
    
    const { result } = renderHook(() => use43Fullscreen());
    
    expect(result.current).toBe(1);
  });

  test('should return scale 1 for non-4:3 screens (different ratio)', () => {
    // Mock 21:9 screen (2560x1080)
    mockInnerWidth = 2560;
    mockInnerHeight = 1080;
    
    const { result } = renderHook(() => use43Fullscreen());
    
    expect(result.current).toBe(1);
  });

  test('should calculate correct scale for 4:3 screens', () => {
    // Mock 4:3 screen (1024x768) - exact match
    mockInnerWidth = 1024;
    mockInnerHeight = 768;
    
    const { result } = renderHook(() => use43Fullscreen());
    
    expect(result.current).toBe(1); // Perfect match should be 1
  });

  test('should calculate correct scale for larger 4:3 screens', () => {
    // Mock larger 4:3 screen (2048x1536)
    mockInnerWidth = 2048;
    mockInnerHeight = 1536;
    
    const { result } = renderHook(() => use43Fullscreen());
    
    expect(result.current).toBe(2); // 2048/1024 = 2
  });

  test('should calculate correct scale for smaller 4:3 screens', () => {
    // Mock smaller 4:3 screen (512x384)
    mockInnerWidth = 512;
    mockInnerHeight = 384;
    
    const { result } = renderHook(() => use43Fullscreen());
    
    expect(result.current).toBe(0.5); // 512/1024 = 0.5
  });

  test('should handle 4:3 screens with slight ratio differences', () => {
    // Mock 4:3 screen with slight difference (1025x768)
    mockInnerWidth = 1025;
    mockInnerHeight = 768;
    
    const { result } = renderHook(() => use43Fullscreen());
    
    // Should still be considered 4:3 (within 0.1 tolerance)
    expect(result.current).toBeCloseTo(1, 2);
  });

  test('should not consider screens with large ratio differences as 4:3', () => {
    // Mock 16:10 screen (1920x1200)
    mockInnerWidth = 1920;
    mockInnerHeight = 1200;
    
    const { result } = renderHook(() => use43Fullscreen());
    
    expect(result.current).toBe(1); // Should return 1 (no scaling)
  });

  test('should handle resize events', () => {
    mockInnerWidth = 1024;
    mockInnerHeight = 768;
    
    const { result } = renderHook(() => use43Fullscreen());
    
    expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    
    // Simulate resize to larger 4:3 screen
    act(() => {
      mockInnerWidth = 2048;
      mockInnerHeight = 1536;
      
      // Get the resize handler and call it
      const resizeHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'resize'
      )[1];
      resizeHandler();
    });
    
    expect(result.current).toBe(2);
  });

  test('should clean up event listeners on unmount', () => {
    mockInnerWidth = 1024;
    mockInnerHeight = 768;
    
    const { unmount } = renderHook(() => use43Fullscreen());
    
    expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    
    unmount();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  test('should handle edge cases', () => {
    // Test with very small screen
    mockInnerWidth = 100;
    mockInnerHeight = 75;
    
    const { result } = renderHook(() => use43Fullscreen());
    
    expect(result.current).toBeCloseTo(0.097, 2); // 100/1024
  });

  test('should handle very large screen', () => {
    // Test with very large 4:3 screen
    mockInnerWidth = 4096;
    mockInnerHeight = 3072;
    
    const { result } = renderHook(() => use43Fullscreen());
    
    expect(result.current).toBe(4); // 4096/1024 = 4
  });
});
