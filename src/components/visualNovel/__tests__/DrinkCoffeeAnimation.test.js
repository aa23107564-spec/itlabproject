import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import DrinkCoffeeAnimation from '../DrinkCoffeeAnimation';

describe('DrinkCoffeeAnimation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders drink coffee animation component', () => {
    render(<DrinkCoffeeAnimation />);
    
    expect(screen.getByTestId('drink-coffee-animation')).toBeInTheDocument();
    expect(screen.getByAltText('Drink Coffee')).toBeInTheDocument();
    expect(screen.getByAltText('Background 22')).toBeInTheDocument();
  });

  test('initial opacity states are correct', () => {
    render(<DrinkCoffeeAnimation />);
    
    const drinkImage = screen.getByAltText('Drink Coffee');
    const bg22Image = screen.getByAltText('Background 22');
    
    // 初始狀態：兩張圖片都是透明的
    expect(drinkImage).toHaveStyle({ opacity: '0' });
    expect(bg22Image).toHaveStyle({ opacity: '0' });
  });

  test('animation timeline works correctly', async () => {
    render(<DrinkCoffeeAnimation />);
    
    const drinkImage = screen.getByAltText('Drink Coffee');
    const bg22Image = screen.getByAltText('Background 22');
    
    // 初始狀態
    expect(drinkImage).toHaveStyle({ opacity: '0' });
    expect(bg22Image).toHaveStyle({ opacity: '0' });
    
    // 快進 50ms：drinkcoffee.jpg 開始淡入
    act(() => {
      jest.advanceTimersByTime(50);
    });
    
    await waitFor(() => {
      expect(drinkImage).toHaveStyle({ opacity: '1' });
      expect(bg22Image).toHaveStyle({ opacity: '0' });
    });
    
    // 快進到 2.5 秒：22.jpg 開始淡入覆蓋
    act(() => {
      jest.advanceTimersByTime(2450);
    });
    
    await waitFor(() => {
      expect(drinkImage).toHaveStyle({ opacity: '1' });
      expect(bg22Image).toHaveStyle({ opacity: '1' });
    });
  });

  test('CSS transitions are applied correctly', () => {
    render(<DrinkCoffeeAnimation />);
    
    const drinkImage = screen.getByAltText('Drink Coffee');
    const bg22Image = screen.getByAltText('Background 22');
    
    // 檢查過渡動畫設置
    expect(drinkImage).toHaveStyle({ 
      transition: 'opacity 1s ease-in-out',
      zIndex: '2'
    });
    
    expect(bg22Image).toHaveStyle({ 
      transition: 'opacity 1s ease-in-out',
      zIndex: '3'
    });
  });

  test('component structure is correct', () => {
    render(<DrinkCoffeeAnimation />);
    
    const container = screen.getByTestId('drink-coffee-animation');
    const images = screen.getAllByRole('img');
    
    // 容器應該包含兩張圖片
    expect(container).toBeInTheDocument();
    expect(images).toHaveLength(2);
    
    // 檢查圖片路徑
    const drinkImage = screen.getByAltText('Drink Coffee');
    const bg22Image = screen.getByAltText('Background 22');
    
    expect(drinkImage).toHaveAttribute('src', '/images/backgrounds/drinkcoffee.jpg');
    expect(bg22Image).toHaveAttribute('src', '/images/backgrounds/22.jpg');
  });

  test('cleanup timers on unmount', () => {
    const { unmount } = render(<DrinkCoffeeAnimation />);
    
    // 啟動動畫
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // 卸載組件
    expect(() => unmount()).not.toThrow();
    
    // 快進剩餘時間，確保沒有錯誤
    expect(() => {
      act(() => {
        jest.runOnlyPendingTimers();
      });
    }).not.toThrow();
  });

  test('animation completes within expected timeframe', async () => {
    render(<DrinkCoffeeAnimation />);
    
    const drinkImage = screen.getByAltText('Drink Coffee');
    const bg22Image = screen.getByAltText('Background 22');
    
    // 快進完整動畫時間（5秒）
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // 動畫應該完成
    await waitFor(() => {
      expect(drinkImage).toHaveStyle({ opacity: '1' });
      expect(bg22Image).toHaveStyle({ opacity: '1' });
    });
  });

  test('handles rapid timer advances correctly', async () => {
    render(<DrinkCoffeeAnimation />);
    
    const drinkImage = screen.getByAltText('Drink Coffee');
    const bg22Image = screen.getByAltText('Background 22');
    
    // 快速快進到動畫結束
    act(() => {
      jest.advanceTimersByTime(10000); // 超過動畫時間
    });
    
    // 應該保持最終狀態
    await waitFor(() => {
      expect(drinkImage).toHaveStyle({ opacity: '1' });
      expect(bg22Image).toHaveStyle({ opacity: '1' });
    });
  });
});
