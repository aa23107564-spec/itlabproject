import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
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
        <div data-testid="chatbox-editor-text">{text}</div>
        <div data-testid="chatbox-editor-typing">{isTyping.toString()}</div>
      </div>
    );
  };
});

jest.mock('../SelectOption', () => {
  return function MockSelectOption() {
    return <div data-testid="select-option">Mock Select Option</div>;
  };
});

jest.mock('../DrinkCoffeeAnimation', () => {
  return function MockDrinkCoffeeAnimation() {
    return <div data-testid="drink-coffee-animation">Mock Animation</div>;
  };
});

describe('Slow Typing Effect', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('normal text typing speed is 40ms per character', async () => {
    const script = {
      opening: [
        {
          id: 'test-1',
          type: 'dialogue',
          speaker: 'protagonist',
          text: 'Normal speed text'
        }
      ]
    };

    render(<VisualNovelEngine script={script} />);

    // 計算正常速度：15個字符 × 40ms = 600ms
    act(() => {
      jest.advanceTimersByTime(600);
    });

    await waitFor(() => {
      expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('Normal speed text');
      expect(screen.getByTestId('chatbox-me-typing')).toHaveTextContent('false');
    });
  });

  test('slow tag text typing speed is 150ms per character', async () => {
    const script = {
      opening: [
        {
          id: 'test-1',
          type: 'dialogue',
          speaker: 'protagonist',
          text: '<slow>Slow speed text</slow>'
        }
      ]
    };

    render(<VisualNovelEngine script={script} />);

    // 計算慢速：14個字符 × 150ms = 2100ms
    act(() => {
      jest.advanceTimersByTime(2100);
    });

    await waitFor(() => {
      expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('Slow speed text');
      expect(screen.getByTestId('chatbox-me-typing')).toHaveTextContent('false');
    });
  });

  test('mixed normal and slow text works correctly', async () => {
    const script = {
      opening: [
        {
          id: 'test-1',
          type: 'dialogue',
          speaker: 'protagonist',
          text: 'Normal <slow>slow</slow> normal'
        }
      ]
    };

    render(<VisualNovelEngine script={script} />);

    // 計算混合速度：
    // "Normal " (7 chars × 40ms) + "slow" (4 chars × 150ms) + " normal" (7 chars × 40ms)
    // = 280ms + 600ms + 280ms = 1160ms
    act(() => {
      jest.advanceTimersByTime(1160);
    });

    await waitFor(() => {
      expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('Normal slow normal');
      expect(screen.getByTestId('chatbox-me-typing')).toHaveTextContent('false');
    });
  });

  test('punctuation marks have 400ms delay', async () => {
    const script = {
      opening: [
        {
          id: 'test-1',
          type: 'dialogue',
          speaker: 'protagonist',
          text: 'Hello, world!'
        }
      ]
    };

    render(<VisualNovelEngine script={script} />);

    // 計算包含標點的速度：
    // "Hello" (5 × 40ms) + "," (400ms) + " world" (6 × 40ms) + "!" (400ms)
    // = 200ms + 400ms + 240ms + 400ms = 1240ms
    act(() => {
      jest.advanceTimersByTime(1240);
    });

    await waitFor(() => {
      expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('Hello, world!');
      expect(screen.getByTestId('chatbox-me-typing')).toHaveTextContent('false');
    });
  });

  test('slow tag with punctuation works correctly', async () => {
    const script = {
      opening: [
        {
          id: 'test-1',
          type: 'dialogue',
          speaker: 'protagonist',
          text: '<slow>Slow, text!</slow>'
        }
      ]
    };

    render(<VisualNovelEngine script={script} />);

    // 計算慢速標點：
    // "Slow" (4 × 150ms) + "," (400ms) + " text" (5 × 150ms) + "!" (400ms)
    // = 600ms + 400ms + 750ms + 400ms = 2150ms
    act(() => {
      jest.advanceTimersByTime(2150);
    });

    await waitFor(() => {
      expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('Slow, text!');
      expect(screen.getByTestId('chatbox-me-typing')).toHaveTextContent('false');
    });
  });

  test('slow tag does not affect layout', async () => {
    const script = {
      opening: [
        {
          id: 'test-1',
          type: 'dialogue',
          speaker: 'protagonist',
          text: 'Line 1\n<slow>Line 2 slow</slow>\nLine 3'
        }
      ]
    };

    render(<VisualNovelEngine script={script} />);

    // 快進打字機動畫
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      const textElement = screen.getByTestId('chatbox-me-text');
      expect(textElement).toHaveTextContent('Line 1\nLine 2 slow\nLine 3');
      
      // 檢查文字沒有被 slow 標籤影響布局
      expect(textElement.innerHTML).not.toContain('<slow>');
      expect(textElement.innerHTML).not.toContain('</slow>');
    });
  });

  test('multiple slow tags work correctly', async () => {
    const script = {
      opening: [
        {
          id: 'test-1',
          type: 'dialogue',
          speaker: 'protagonist',
          text: 'Start <slow>first slow</slow> middle <slow>second slow</slow> end'
        }
      ]
    };

    render(<VisualNovelEngine script={script} />);

    // 計算多個 slow 標籤的速度
    act(() => {
      jest.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('Start first slow middle second slow end');
      expect(screen.getByTestId('chatbox-me-typing')).toHaveTextContent('false');
    });
  });

  test('nested tags with slow work correctly', async () => {
    const script = {
      opening: [
        {
          id: 'test-1',
          type: 'dialogue',
          speaker: 'protagonist',
          text: 'Normal <b><slow>bold slow</slow></b> normal'
        }
      ]
    };

    render(<VisualNovelEngine script={script} />);

    // 快進打字機動畫
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      const textElement = screen.getByTestId('chatbox-me-text');
      expect(textElement).toHaveTextContent('Normal bold slow normal');
      
      // 檢查 bold 標籤保留，slow 標籤被移除
      expect(textElement.innerHTML).toContain('<b>');
      expect(textElement.innerHTML).not.toContain('<slow>');
    });
  });

  test('typewriter can be skipped during slow typing', async () => {
    const script = {
      opening: [
        {
          id: 'test-1',
          type: 'dialogue',
          speaker: 'protagonist',
          text: '<slow>Very slow text that would take a long time</slow>'
        }
      ]
    };

    render(<VisualNovelEngine script={script} />);

    // 開始打字
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // 按右方向鍵跳過打字機
    fireEvent.keyDown(document, { key: 'ArrowRight' });

    // 應該立即顯示完整文字
    await waitFor(() => {
      expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('Very slow text that would take a long time');
      expect(screen.getByTestId('chatbox-me-typing')).toHaveTextContent('false');
    });
  });

  test('slow typing works with different speakers', async () => {
    const script = {
      opening: [
        {
          id: 'test-1',
          type: 'dialogue',
          speaker: 'protagonist',
          text: 'I say <slow>slowly</slow>'
        },
        {
          id: 'test-2',
          type: 'dialogue',
          speaker: 'editor',
          text: 'Editor says <slow>slowly too</slow>'
        }
      ]
    };

    render(<VisualNovelEngine script={script} />);

    // 第一句對話
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('chatbox-me-text')).toHaveTextContent('I say slowly');
    });

    // 前進到第二句
    fireEvent.keyDown(document, { key: 'ArrowRight' });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('chatbox-editor-text')).toHaveTextContent('Editor says slowly too');
    });
  });
});











