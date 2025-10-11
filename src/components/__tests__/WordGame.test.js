import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WordGame from '../WordGame';

// Mock CSS imports
jest.mock('../../styles/word2003.css', () => ({}));

// Mock getBoundingClientRect for menu positioning
const mockGetBoundingClientRect = jest.fn(() => ({
  top: 100,
  left: 200,
  width: 50,
  height: 20,
  right: 250,
  bottom: 120
}));

// Mock text container ref
const mockTextContainerRef = {
  current: {
    getBoundingClientRect: mockGetBoundingClientRect
  }
};

describe('WordGame Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBoundingClientRect.mockReturnValue({
      top: 100,
      left: 200,
      width: 50,
      height: 20,
      right: 250,
      bottom: 120
    });
  });

  test('renders Word 2003 interface', () => {
    render(<WordGame />);
    
    // Check for Word 2003 UI elements
    expect(screen.getByText('Microsoft Word')).toBeInTheDocument();
    expect(screen.getByText('檔案')).toBeInTheDocument();
    expect(screen.getByText('編輯')).toBeInTheDocument();
    expect(screen.getByText('檢視')).toBeInTheDocument();
  });

  test('starts with first paragraph typing animation', async () => {
    render(<WordGame />);
    
    // Should start typing the first paragraph
    await waitFor(() => {
      expect(screen.getByText(/又回到保健室躺著/)).toBeInTheDocument();
    });
  });

  test('skips typing animation when down arrow is pressed', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Wait for typing to start
    await waitFor(() => {
      expect(screen.getByText(/又回到保健室躺著/)).toBeInTheDocument();
    });
    
    // Press down arrow to skip animation
    await user.keyboard('{ArrowDown}');
    
    // Should show complete first paragraph
    await waitFor(() => {
      expect(screen.getByText(/又回到保健室躺著，數不清是開學後的第幾次了/)).toBeInTheDocument();
    });
  });

  test('highlights interactive words correctly', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Skip typing animation
    await user.keyboard('{ArrowDown}');
    
    await waitFor(() => {
      // Check if interactive word is highlighted
      const interactiveWord = screen.getByText('相反色');
      expect(interactiveWord).toHaveClass('interactive-word');
    });
  });

  test('navigates between interactive words with arrow keys', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Skip typing animation
    await user.keyboard('{ArrowDown}');
    
    await waitFor(() => {
      expect(screen.getByText('相反色')).toBeInTheDocument();
    });
    
    // Press right arrow to move to end of paragraph
    await user.keyboard('{ArrowRight}');
    
    // Press left arrow to go back to interactive word
    await user.keyboard('{ArrowLeft}');
    
    await waitFor(() => {
      const interactiveWord = screen.getByText('相反色');
      expect(interactiveWord).toHaveClass('selected');
    });
  });

  test('opens word choice menu when down arrow pressed on selected word', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Skip typing animation
    await user.keyboard('{ArrowDown}');
    
    // Select the interactive word
    await user.keyboard('{ArrowLeft}');
    
    await waitFor(() => {
      const interactiveWord = screen.getByText('相反色');
      expect(interactiveWord).toHaveClass('selected');
    });
    
    // Press down arrow to open menu
    await user.keyboard('{ArrowDown}');
    
    await waitFor(() => {
      // Check if menu appears with options
      expect(screen.getByText(/1\.\s*相反色/)).toBeInTheDocument();
      expect(screen.getByText(/2\.\s*互補色/)).toBeInTheDocument();
      expect(screen.getByText(/3\.\s*對比色/)).toBeInTheDocument();
    });
  });

  test('navigates within word choice menu', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Skip typing animation and open menu
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowDown}');
    
    await waitFor(() => {
      expect(screen.getByText(/1\.\s*相反色/)).toBeInTheDocument();
    });
    
    // Navigate within menu
    await user.keyboard('{ArrowRight}');
    
    await waitFor(() => {
      const secondOption = screen.getByText(/2\.\s*互補色/);
      expect(secondOption).toHaveClass('selected');
    });
  });

  test('replaces word when selection is confirmed', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Skip typing animation and select different word
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowRight}'); // Select "互補色"
    await user.keyboard('{ArrowDown}'); // Confirm selection
    
    await waitFor(() => {
      // Check if word was replaced
      expect(screen.getByText('互補色')).toBeInTheDocument();
      expect(screen.queryByText('相反色')).not.toBeInTheDocument();
    });
  });

  test('shows completion hint at paragraph end', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Complete first paragraph
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}'); // Confirm word selection
    
    // Move to end of paragraph
    await user.keyboard('{ArrowRight}');
    
    await waitFor(() => {
      expect(screen.getByText('左右移動以選擇字詞，按下確認可開啟選單，在段尾按下確認以繼續')).toBeInTheDocument();
    });
  });

  test('proceeds to next paragraph when down arrow pressed at end', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Complete first paragraph
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowDown}'); // Proceed to next paragraph
    
    await waitFor(() => {
      // Should show second paragraph
      expect(screen.getByText(/「直子，睜開眼睛！看著我！」/)).toBeInTheDocument();
    });
  });

  test('preserves completed paragraphs', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Complete first paragraph
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowDown}');
    
    await waitFor(() => {
      // First paragraph should still be visible
      expect(screen.getByText(/又回到保健室躺著/)).toBeInTheDocument();
      // Second paragraph should be typing
      expect(screen.getByText(/「直子，睜開眼睛！看著我！」/)).toBeInTheDocument();
    });
  });

  test('handles multiple interactive words in paragraph', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Navigate to third paragraph (has 2 interactive words)
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowDown}'); // Next paragraph
    
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowDown}'); // Next paragraph (third)
    
    await waitFor(() => {
      // Should show third paragraph with two interactive words
      expect(screen.getByText(/波浪起伏/)).toBeInTheDocument();
      expect(screen.getByText(/隨波逐流/)).toBeInTheDocument();
    });
  });

  test('displays corner marks and paragraph marks', async () => {
    render(<WordGame />);
    
    // Check for corner marks
    const cornerMarks = document.querySelectorAll('.text-boundary-mark');
    expect(cornerMarks).toHaveLength(2);
    
    // Skip typing animation to see paragraph mark
    const user = userEvent.setup();
    await user.keyboard('{ArrowDown}');
    
    await waitFor(() => {
      // Check for paragraph mark
      const paragraphMark = document.querySelector('.paragraph-mark');
      expect(paragraphMark).toBeInTheDocument();
      expect(paragraphMark).toHaveTextContent('↵');
    });
  });
});

describe('WordGame Edge Cases', () => {
  test('handles rapid key presses gracefully', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Rapid key presses
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    
    // Should not crash and should handle gracefully
    expect(screen.getByText(/又回到保健室躺著/)).toBeInTheDocument();
  });

  test('handles menu positioning at boundaries', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Mock boundary conditions
    mockGetBoundingClientRect.mockReturnValue({
      top: 100,
      left: 800, // Near right boundary
      width: 50,
      height: 20,
      right: 850,
      bottom: 120
    });
    
    // Skip typing and open menu
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowDown}');
    
    await waitFor(() => {
      // Menu should still appear and be positioned correctly
      expect(screen.getByText(/1\.\s*相反色/)).toBeInTheDocument();
    });
  });
});
