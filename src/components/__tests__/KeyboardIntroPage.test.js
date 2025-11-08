import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import KeyboardIntroPage from '../KeyboardIntroPage';

describe('KeyboardIntroPage Component', () => {
  test('renders keyboard intro page with icon and text', () => {
    render(<KeyboardIntroPage />);
    
    const keyboardIcon = screen.getByAltText('Keyboard Icon');
    expect(keyboardIcon).toBeInTheDocument();
    expect(keyboardIcon).toHaveClass('keyboard-icon');
    
    // 檢查文字內容
    expect(screen.getByText('選字')).toBeInTheDocument();
    expect(screen.getByText('確定')).toBeInTheDocument();
    expect(screen.getByText('按下任意鍵開始')).toBeInTheDocument();
    
    // 檢查箭頭
    expect(screen.getByText('◀')).toBeInTheDocument();
    expect(screen.getByText('▶')).toBeInTheDocument();
  });

  test('text elements have correct styling classes', () => {
    render(<KeyboardIntroPage />);
    
    const textElements = screen.getAllByText(/選字|確定|按下任意鍵開始|◀|▶/);
    textElements.forEach(element => {
      expect(element).toHaveClass('keyboard-text');
    });
  });

  test('keyboard labels have correct structure', () => {
    render(<KeyboardIntroPage />);
    
    // 檢查標籤容器
    const keyboardWithLabels = screen.getByText('選字').closest('.keyboard-with-labels');
    expect(keyboardWithLabels).toBeInTheDocument();
    
    // 檢查各個標籤位置
    expect(screen.getByText('◀').closest('.keyboard-label')).toHaveClass('keyboard-label-left');
    expect(screen.getByText('選字').closest('.keyboard-label')).toHaveClass('keyboard-label-center');
    expect(screen.getByText('▶').closest('.keyboard-label')).toHaveClass('keyboard-label-right');
  });

  test('arrow elements have correct styling', () => {
    render(<KeyboardIntroPage />);
    
    const leftArrow = screen.getByText('◀');
    const rightArrow = screen.getByText('▶');
    
    expect(leftArrow).toHaveClass('keyboard-arrow');
    expect(rightArrow).toHaveClass('keyboard-arrow');
  });

  test('instruction text has correct styling', () => {
    render(<KeyboardIntroPage />);
    
    const instruction = screen.getByText('按下任意鍵開始');
    expect(instruction).toHaveClass('keyboard-instruction');
  });

  test('calls onSkip when any key is pressed', () => {
    const mockOnSkip = jest.fn();
    render(<KeyboardIntroPage onSkip={mockOnSkip} />);
    
    // 按下任意鍵
    fireEvent.keyDown(window, { key: 'Enter' });
    
    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  test('calls onSkip for different key presses', () => {
    const mockOnSkip = jest.fn();
    render(<KeyboardIntroPage onSkip={mockOnSkip} />);
    
    // 測試不同的按鍵
    fireEvent.keyDown(window, { key: 'Space' });
    expect(mockOnSkip).toHaveBeenCalledTimes(1);
    
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(mockOnSkip).toHaveBeenCalledTimes(2);
    
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnSkip).toHaveBeenCalledTimes(3);
  });

  test('cleans up event listener on unmount', () => {
    const mockOnSkip = jest.fn();
    const { unmount } = render(<KeyboardIntroPage onSkip={mockOnSkip} />);
    
    unmount();
    
    // 卸載後按鍵不應觸發回調
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(mockOnSkip).not.toHaveBeenCalled();
  });

  test('has correct styling classes', () => {
    render(<KeyboardIntroPage />);
    
    const introPage = screen.getByAltText('Keyboard Icon').closest('.keyboard-intro-content').parentElement;
    expect(introPage).toHaveClass('keyboard-intro-page');
  });

  test('keyboard icon has correct src', () => {
    render(<KeyboardIntroPage />);
    
    const keyboardIcon = screen.getByAltText('Keyboard Icon');
    expect(keyboardIcon).toHaveAttribute('src', expect.stringContaining('鍵盤.png'));
  });

  test('text elements have pixel font styling', () => {
    render(<KeyboardIntroPage />);
    
    const textElements = screen.getAllByText(/選字|確定|按下任意鍵開始|◀|▶/);
    textElements.forEach(element => {
      expect(element).toHaveStyle({
        fontFamily: expect.stringContaining('PixelFont')
      });
    });
  });
});

