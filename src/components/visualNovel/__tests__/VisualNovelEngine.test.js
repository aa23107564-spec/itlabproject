import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import VisualNovelEngine from '../VisualNovelEngine';

// Mock child components
jest.mock('../ChatboxMe', () => {
  return function MockChatboxMe({ text, isTyping }) {
    return (
      <div data-testid="chatbox-me">
        <div data-testid="chatbox-me-text">{text}</div>
        <div data-testid="chatbox-me-typing">{isTyping.toString()}</div>
      </div>
    );
  };
});

jest.mock('../ChatboxEditor', () => {
  return function MockChatboxEditor({ text, isTyping, name }) {
    return (
      <div data-testid="chatbox-editor">
        <div data-testid="chatbox-editor-name">{name}</div>
        <div data-testid="chatbox-editor-text">{text}</div>
        <div data-testid="chatbox-editor-typing">{isTyping.toString()}</div>
      </div>
    );
  };
});

jest.mock('../SelectOption', () => {
  return function MockSelectOption({ text, onClick, isPressed }) {
    return (
      <button 
        data-testid={`select-option-${text}`}
        onClick={onClick}
        data-pressed={isPressed.toString()}
      >
        {text}
      </button>
    );
  };
});

jest.mock('../DrinkCoffeeAnimation', () => {
  return function MockDrinkCoffeeAnimation() {
    return <div data-testid="drink-coffee-animation">Drink Coffee Animation</div>;
  };
});

// Mock script data
const mockScript = {
  opening: [
    {
      id: 'opening-1',
      type: 'dialogue',
      speaker: 'protagonist',
      text: 'Hello world!'
    },
    {
      id: 'opening-2',
      type: 'dialogue',
      speaker: 'editor',
      text: 'This is a test dialogue.'
    },
    {
      id: 'opening-choice',
      type: 'choice',
      choices: [
        { text: 'Choice A', next: 'branch-a-1' },
        { text: 'Choice B', next: 'branch-b-1' }
      ]
    },
    {
      id: 'opening-animation',
      type: 'animation',
      animationType: 'drinkCoffee',
      duration: 2500,
      next: 'opening-3'
    },
    {
      id: 'opening-3',
      type: 'dialogue',
      speaker: 'protagonist',
      text: 'After animation.'
    }
  ],
  'branch-a-1': [
    {
      id: 'branch-a-1',
      type: 'dialogue',
      speaker: 'protagonist',
      text: 'You chose A!'
    }
  ],
  'branch-b-1': [
    {
      id: 'branch-b-1',
      type: 'dialogue',
      speaker: 'protagonist',
      text: 'You chose B!'
    }
  ]
};

describe('VisualNovelEngine', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders initial dialogue correctly', async () => {
    render(<VisualNovelEngine script={mockScript} />);
    
    // 檢查初始對話是否顯示
    await waitFor(() => {
      expect(screen.getByTestId('chatbox-me')).toBeInTheDocument();
      expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('Hello world!');
    });
  });

  test('typewriter effect works correctly', async () => {
    render(<VisualNovelEngine script={mockScript} />);
    
    // 初始應該顯示空文字
    expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('');
    expect(screen.getByTestId('chatbox-me-typing')).toHaveTextContent('true');
    
    // 快進打字機動畫
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // 應該開始顯示文字
    await waitFor(() => {
      expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('Hello world!');
      expect(screen.getByTestId('chatbox-me-typing')).toHaveTextContent('false');
    });
  });

  test('keyboard navigation works correctly', async () => {
    render(<VisualNovelEngine script={mockScript} />);
    
    // 等待第一句對話完成
    await waitFor(() => {
      expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('Hello world!');
      expect(screen.getByTestId('chatbox-me-typing')).toHaveTextContent('false');
    });
    
    // 按右方向鍵前進
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    
    // 應該顯示第二句對話
    await waitFor(() => {
      expect(screen.getByTestId('chatbox-editor')).toBeInTheDocument();
      expect(screen.getByTestId('chatbox-editor-text')).toHaveTextContent('This is a test dialogue.');
    });
  });

  test('choice selection works correctly', async () => {
    render(<VisualNovelEngine script={mockScript} />);
    
    // 快進到選擇節點
    act(() => {
      jest.advanceTimersByTime(2000); // 第一句對話
    });
    
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    
    await waitFor(() => {
      expect(screen.getByTestId('chatbox-editor')).toBeInTheDocument();
    });
    
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    
    // 應該顯示選擇選項
    await waitFor(() => {
      expect(screen.getByTestId('select-option-Choice A')).toBeInTheDocument();
      expect(screen.getByTestId('select-option-Choice B')).toBeInTheDocument();
    });
    
    // 選擇選項 A
    fireEvent.click(screen.getByTestId('select-option-Choice A'));
    
    // 應該跳轉到對應分支
    await waitFor(() => {
      expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('You chose A!');
    });
  });

  test('animation node works correctly', async () => {
    const mockOnComplete = jest.fn();
    render(<VisualNovelEngine script={mockScript} onComplete={mockOnComplete} />);
    
    // 快進到動畫節點
    act(() => {
      jest.advanceTimersByTime(4000); // 前兩句對話
    });
    
    // 觸發動畫節點
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    
    // 應該顯示喝咖啡動畫
    await waitFor(() => {
      expect(screen.getByTestId('drink-coffee-animation')).toBeInTheDocument();
    });
    
    // 快進 2.5 秒（動畫持續時間）
    act(() => {
      jest.advanceTimersByTime(2500);
    });
    
    // 應該跳轉到下一個對話
    await waitFor(() => {
      expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('After animation.');
    });
  });

  test('slow typing tag works correctly', async () => {
    const scriptWithSlowTag = {
      opening: [
        {
          id: 'opening-1',
          type: 'dialogue',
          speaker: 'protagonist',
          text: 'Normal speed <slow>slow speed text</slow> normal again'
        }
      ]
    };
    
    render(<VisualNovelEngine script={scriptWithSlowTag} />);
    
    // 快進打字機動畫
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // 檢查文字是否正確顯示（slow 標籤應該被移除）
    await waitFor(() => {
      expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('Normal speed slow speed text normal again');
    });
  });

  test('back navigation works correctly', async () => {
    render(<VisualNovelEngine script={mockScript} />);
    
    // 前進到第二句對話
    await waitFor(() => {
      expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('Hello world!');
    });
    
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    
    await waitFor(() => {
      expect(screen.getByTestId('chatbox-editor')).toBeInTheDocument();
    });
    
    // 按左方向鍵回退
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    
    // 應該回到第一句對話
    await waitFor(() => {
      expect(screen.getByTestId('chatbox-me')).toBeInTheDocument();
      expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('Hello world!');
    });
  });

  test('calls onComplete when reaching end', async () => {
    const mockOnComplete = jest.fn();
    const scriptWithEnd = {
      opening: [
        {
          id: 'opening-1',
          type: 'dialogue',
          speaker: 'protagonist',
          text: 'Final dialogue',
          next: 'end'
        }
      ]
    };
    
    render(<VisualNovelEngine script={scriptWithEnd} onComplete={mockOnComplete} />);
    
    // 快進到最後一句對話
    await waitFor(() => {
      expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('Final dialogue');
    });
    
    // 按右方向鍵
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    
    // 應該調用 onComplete
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith('opening');
    });
  });

  test('handles pauseNext correctly', async () => {
    const scriptWithPause = {
      opening: [
        {
          id: 'opening-1',
          type: 'dialogue',
          speaker: 'protagonist',
          text: 'This will pause',
          pauseNext: 2000,
          next: 'opening-2'
        },
        {
          id: 'opening-2',
          type: 'dialogue',
          speaker: 'protagonist',
          text: 'After pause'
        }
      ]
    };
    
    render(<VisualNovelEngine script={scriptWithPause} />);
    
    // 等待第一句對話完成
    await waitFor(() => {
      expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('This will pause');
    });
    
    // 快進 2 秒暫停時間
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    // 應該自動前進到下一句
    await waitFor(() => {
      expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('After pause');
    });
  });

  test('cleanup on unmount', () => {
    const { unmount } = render(<VisualNovelEngine script={mockScript} />);
    
    // 確保沒有內存洩漏
    expect(() => unmount()).not.toThrow();
  });
});
