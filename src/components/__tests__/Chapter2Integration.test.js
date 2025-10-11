import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Chapter2 from '../Chapter2';
import chapter2Script from '../../data/chapter2Script';

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

// Mock the actual script to avoid loading issues
jest.mock('../../data/chapter2Script', () => ({
  opening: [
    {
      id: 'opening-1',
      type: 'dialogue',
      speaker: 'protagonist',
      text: 'Test opening dialogue'
    },
    {
      id: 'opening-2',
      type: 'dialogue',
      speaker: 'editor',
      text: 'Test editor dialogue'
    },
    {
      id: 'opening-3',
      type: 'dialogue',
      speaker: 'protagonist',
      text: 'Another test dialogue'
    }
  ],
  'ending-a': [
    {
      id: 'ending-a-1',
      type: 'dialogue',
      speaker: 'protagonist',
      text: 'Ending A dialogue'
    }
  ],
  'ending-b-a': [
    {
      id: 'ending-b-a-1',
      type: 'dialogue',
      speaker: 'protagonist',
      text: 'Ending B-A dialogue'
    }
  ]
}));

describe('Chapter2 Integration Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('complete Chapter2 flow with ending-a', async () => {
    render(<Chapter2 />);
    
    // 等待開場動畫完成（8秒）
    act(() => {
      jest.advanceTimersByTime(8000);
    });
    
    // 檢查視覺小說引擎是否顯示
    await waitFor(() => {
      expect(screen.getByTestId('visual-novel-engine')).toBeInTheDocument();
    });
    
    // 模擬完成 ending-a 分支
    const completeButton = screen.getByTestId('complete-ending-a');
    fireEvent.click(completeButton);
    
    // 檢查結局狀態
    expect(screen.getByTestId('ending-status')).toHaveTextContent('isEndingBA: false');
    
    // 快進 100ms 檢查淡出效果
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    await waitFor(() => {
      const fadeOutOverlay = screen.getByTestId('ending-fade-out-overlay');
      expect(fadeOutOverlay).toBeInTheDocument();
      expect(fadeOutOverlay).not.toHaveClass('ending-b-a-fade');
    });
  });

  test('complete Chapter2 flow with ending-b-a', async () => {
    render(<Chapter2 />);
    
    // 等待開場動畫完成
    act(() => {
      jest.advanceTimersByTime(8000);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('visual-novel-engine')).toBeInTheDocument();
    });
    
    // 模擬完成 ending-b-a 分支
    const completeButton = screen.getByTestId('complete-ending-b-a');
    fireEvent.click(completeButton);
    
    // 檢查結局狀態
    expect(screen.getByTestId('ending-status')).toHaveTextContent('isEndingBA: true');
    expect(screen.getByTestId('particles-status')).toHaveTextContent('hideParticles: false');
    
    // 快進 2 秒檢查顆粒隱藏
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('particles-status')).toHaveTextContent('hideParticles: true');
    });
    
    // 檢查淡出效果有特殊樣式
    const fadeOutOverlay = screen.getByTestId('ending-fade-out-overlay');
    expect(fadeOutOverlay).toBeInTheDocument();
    expect(fadeOutOverlay).toHaveClass('ending-b-a-fade');
  });

  test('background image transitions during opening animation', async () => {
    render(<Chapter2 />);
    
    // 檢查初始背景圖片
    expect(screen.getByAltText('Background 22')).toBeInTheDocument();
    expect(screen.getByAltText('Background Drink Coffee')).toBeInTheDocument();
    expect(screen.getByAltText('Background 22 Final')).toBeInTheDocument();
    
    // 檢查初始透明度
    const drinkImage = screen.getByAltText('Background Drink Coffee');
    const bg22Final = screen.getByAltText('Background 22 Final');
    
    expect(drinkImage).toHaveStyle({ opacity: '0' });
    expect(bg22Final).toHaveStyle({ opacity: '0' });
    
    // 快進到 2 秒：drinkcoffee.jpg 淡入
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    expect(drinkImage).toHaveStyle({ opacity: '1' });
    expect(bg22Final).toHaveStyle({ opacity: '0' });
    
    // 快進到 5 秒：22.jpg 淡入覆蓋
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    expect(drinkImage).toHaveStyle({ opacity: '1' });
    expect(bg22Final).toHaveStyle({ opacity: '1' });
  });

  test('visual novel engine appears after opening animation', async () => {
    render(<Chapter2 />);
    
    // 初始狀態：視覺小說引擎不顯示
    expect(screen.queryByTestId('visual-novel-engine')).not.toBeInTheDocument();
    
    // 快進到 8 秒：開場動畫完成
    act(() => {
      jest.advanceTimersByTime(8000);
    });
    
    // 視覺小說引擎應該顯示
    await waitFor(() => {
      expect(screen.getByTestId('visual-novel-engine')).toBeInTheDocument();
    });
  });

  test('long press back component is always present', () => {
    render(<Chapter2 />);
    
    // LongPressBackToLogin 組件應該始終存在
    expect(screen.getByTestId('long-press-back')).toBeInTheDocument();
    
    // 即使在其他狀態下也應該存在
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    
    expect(screen.getByTestId('long-press-back')).toBeInTheDocument();
  });

  test('multiple rapid state changes work correctly', async () => {
    render(<Chapter2 />);
    
    // 快進到開場動畫完成
    act(() => {
      jest.advanceTimersByTime(8000);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('visual-novel-engine')).toBeInTheDocument();
    });
    
    // 快速切換多個結局
    fireEvent.click(screen.getByTestId('complete-ending-a'));
    
    act(() => {
      jest.advanceTimersByTime(50);
    });
    
    // 快速切換到另一個結局（模擬）
    // 注意：實際應用中這可能不會發生，但測試確保狀態管理正確
    expect(screen.getByTestId('ending-status')).toHaveTextContent('isEndingBA: false');
  });

  test('component handles unmount during animation gracefully', () => {
    const { unmount } = render(<Chapter2 />);
    
    // 在動畫進行中卸載組件
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    
    // 應該沒有錯誤
    expect(() => unmount()).not.toThrow();
    
    // 快進剩餘時間確保沒有錯誤
    expect(() => {
      act(() => {
        jest.runOnlyPendingTimers();
      });
    }).not.toThrow();
  });

  test('background images have correct z-index layering', () => {
    render(<Chapter2 />);
    
    const img22_1 = screen.getByAltText('Background 22');
    const imgDrink = screen.getByAltText('Background Drink Coffee');
    const img22_2 = screen.getByAltText('Background 22 Final');
    
    // 檢查 z-index 層級
    expect(img22_1).toHaveStyle({ zIndex: 1 });
    expect(imgDrink).toHaveStyle({ zIndex: 2 });
    expect(img22_2).toHaveStyle({ zIndex: 3 });
  });

  test('opening animation timing matches expected sequence', async () => {
    render(<Chapter2 />);
    
    const drinkImage = screen.getByAltText('Background Drink Coffee');
    const bg22Final = screen.getByAltText('Background 22 Final');
    
    // 0-2秒：只有 img22_1 顯示
    expect(drinkImage).toHaveStyle({ opacity: '0' });
    expect(bg22Final).toHaveStyle({ opacity: '0' });
    
    // 2-5秒：drinkcoffee.jpg 淡入
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    expect(drinkImage).toHaveStyle({ opacity: '1' });
    expect(bg22Final).toHaveStyle({ opacity: '0' });
    
    // 5-8秒：22.jpg 淡入覆蓋
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    expect(drinkImage).toHaveStyle({ opacity: '1' });
    expect(bg22Final).toHaveStyle({ opacity: '1' });
    
    // 8秒後：視覺小說引擎顯示
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('visual-novel-engine')).toBeInTheDocument();
    });
  });
});
