import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Chapter2 from '../Chapter2';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../LongPressBackToLogin', () => {
  return function MockLongPressBackToLogin() {
    return <div data-testid="long-press-back">Long Press Back</div>;
  };
});

jest.mock('../visualNovel/VisualNovelEngine', () => {
  return function MockVisualNovelEngine({ onComplete, isEndingBA, hideParticles }) {
    return (
      <div data-testid="visual-novel-engine">
        <button 
          data-testid="complete-ending-a" 
          onClick={() => onComplete('ending-a')}
        >
          Complete Ending A
        </button>
        <button 
          data-testid="complete-ending-b-a" 
          onClick={() => onComplete('ending-b-a')}
        >
          Complete Ending B-A
        </button>
        <div data-testid="ending-status">
          isEndingBA: {isEndingBA.toString()}
        </div>
        <div data-testid="particles-status">
          hideParticles: {hideParticles.toString()}
        </div>
      </div>
    );
  };
});

// Mock chapter2Script
jest.mock('../../data/chapter2Script', () => ({
  opening: [
    {
      id: 'opening-1',
      type: 'dialogue',
      speaker: 'protagonist',
      text: 'Test dialogue'
    }
  ]
}));

describe('Chapter2 Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders Chapter2 component with background images', () => {
    render(<Chapter2 />);
    
    // 檢查背景圖片是否存在
    expect(screen.getByAltText('Background 22')).toBeInTheDocument();
    expect(screen.getByAltText('Background Drink Coffee')).toBeInTheDocument();
    expect(screen.getByAltText('Background 22 Final')).toBeInTheDocument();
    
    // 檢查 LongPressBackToLogin 組件
    expect(screen.getByTestId('long-press-back')).toBeInTheDocument();
  });

  test('initial state is correct', () => {
    render(<Chapter2 />);
    
    // 初始狀態：對話框不顯示
    expect(screen.queryByTestId('visual-novel-engine')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ending-fade-out-overlay')).not.toBeInTheDocument();
  });

  test('opening animation sequence works correctly', async () => {
    render(<Chapter2 />);
    
    // 初始狀態：對話框不顯示
    expect(screen.queryByTestId('visual-novel-engine')).not.toBeInTheDocument();
    
    // 快進到 8 秒後（開場動畫完成）
    act(() => {
      jest.advanceTimersByTime(8000);
    });
    
    // 對話框應該顯示
    await waitFor(() => {
      expect(screen.getByTestId('visual-novel-engine')).toBeInTheDocument();
    });
  });

  test('background image transitions work correctly', () => {
    render(<Chapter2 />);
    
    // 檢查初始圖片層級設置
    const img22_1 = screen.getByAltText('Background 22');
    const imgDrink = screen.getByAltText('Background Drink Coffee');
    const img22_2 = screen.getByAltText('Background 22 Final');
    
    expect(img22_1).toHaveStyle({ zIndex: 1 });
    expect(imgDrink).toHaveStyle({ zIndex: 2 });
    expect(img22_2).toHaveStyle({ zIndex: 3 });
  });

  test('handles ending-a completion correctly', async () => {
    render(<Chapter2 />);
    
    // 快進到開場動畫完成
    act(() => {
      jest.advanceTimersByTime(8000);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('visual-novel-engine')).toBeInTheDocument();
    });
    
    // 觸發 ending-a 結局
    fireEvent.click(screen.getByTestId('complete-ending-a'));
    
    // 檢查狀態
    expect(screen.getByTestId('ending-status')).toHaveTextContent('isEndingBA: false');
    
    // 快進 100ms，檢查淡出效果
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // 淡出覆蓋層應該顯示（非 ending-b-a 分支）
    await waitFor(() => {
      const fadeOutOverlay = screen.getByTestId('ending-fade-out-overlay');
      expect(fadeOutOverlay).toBeInTheDocument();
      expect(fadeOutOverlay).not.toHaveClass('ending-b-a-fade');
    });
  });

  test('handles ending-b-a completion correctly', async () => {
    render(<Chapter2 />);
    
    // 快進到開場動畫完成
    act(() => {
      jest.advanceTimersByTime(8000);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('visual-novel-engine')).toBeInTheDocument();
    });
    
    // 觸發 ending-b-a 結局
    fireEvent.click(screen.getByTestId('complete-ending-b-a'));
    
    // 檢查狀態
    expect(screen.getByTestId('ending-status')).toHaveTextContent('isEndingBA: true');
    expect(screen.getByTestId('particles-status')).toHaveTextContent('hideParticles: false');
    
    // 快進 2 秒，顆粒動畫應該被隱藏
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('particles-status')).toHaveTextContent('hideParticles: true');
    });
    
    // 淡出覆蓋層應該顯示並有 ending-b-a-fade 類
    const fadeOutOverlay = screen.getByTestId('ending-fade-out-overlay');
    expect(fadeOutOverlay).toBeInTheDocument();
    expect(fadeOutOverlay).toHaveClass('ending-b-a-fade');
  });

  test('cleanup timers on unmount', () => {
    const { unmount } = render(<Chapter2 />);
    
    // 確保沒有內存洩漏
    expect(() => unmount()).not.toThrow();
  });
});











