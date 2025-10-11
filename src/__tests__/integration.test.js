import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Chapter3 from '../components/Chapter3';
import WordGame from '../components/WordGame';
import LongPressBackToLogin from '../components/LongPressBackToLogin';

// Mock CSS imports
jest.mock('../styles/word2003.css', () => ({}));

// Mock the long press hook
jest.mock('../hooks/useLongPressEnter', () => ({
  useLongPressEnter: () => ({
    state: 'idle',
    progress: 0,
    isEnabled: true
  })
}));

// Mock getBoundingClientRect for menu positioning
const mockGetBoundingClientRect = jest.fn(() => ({
  top: 100,
  left: 200,
  width: 50,
  height: 20,
  right: 250,
  bottom: 120
}));

describe('Integration Tests', () => {
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

  test('Chapter3 renders WordGame and LongPressBackToLogin together', () => {
    render(
      <BrowserRouter>
        <Chapter3 />
      </BrowserRouter>
    );
    
    // Check for Word 2003 interface
    expect(screen.getByText('Microsoft Word')).toBeInTheDocument();
    
    // LongPressBackToLogin should be present but not visible (idle state)
    const longPressComponent = document.querySelector('.long-press-overlay');
    expect(longPressComponent).toBeNull(); // Not rendered when idle
  });

  test('WordGame typing animation works with keyboard controls', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Should start typing
    await waitFor(() => {
      expect(screen.getByText(/又回到保健室躺著/)).toBeInTheDocument();
    });
    
    // Skip animation with down arrow
    await user.keyboard('{ArrowDown}');
    
    await waitFor(() => {
      expect(screen.getByText(/又回到保健室躺著，數不清是開學後的第幾次了/)).toBeInTheDocument();
    });
  });

  test('WordGame word selection and replacement flow', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Complete first paragraph interaction
    await user.keyboard('{ArrowDown}'); // Skip typing
    await user.keyboard('{ArrowLeft}'); // Select word
    await user.keyboard('{ArrowDown}'); // Open menu
    await user.keyboard('{ArrowRight}'); // Select second option
    await user.keyboard('{ArrowDown}'); // Confirm selection
    
    await waitFor(() => {
      // Word should be replaced
      expect(screen.getByText('互補色')).toBeInTheDocument();
      expect(screen.queryByText('相反色')).not.toBeInTheDocument();
    });
  });

  test('WordGame paragraph progression', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Complete first paragraph
    await user.keyboard('{ArrowDown}'); // Skip typing
    await user.keyboard('{ArrowLeft}'); // Select word
    await user.keyboard('{ArrowDown}'); // Open menu
    await user.keyboard('{ArrowDown}'); // Confirm selection
    await user.keyboard('{ArrowRight}'); // Move to end
    await user.keyboard('{ArrowDown}'); // Proceed to next paragraph
    
    await waitFor(() => {
      // Should show second paragraph
      expect(screen.getByText(/「直子，睜開眼睛！看著我！」/)).toBeInTheDocument();
      // First paragraph should still be visible
      expect(screen.getByText(/又回到保健室躺著/)).toBeInTheDocument();
    });
  });

  test('WordGame handles multiple interactive words in paragraph', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Navigate to third paragraph (has 2 interactive words)
    await user.keyboard('{ArrowDown}'); // Skip first paragraph
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowDown}'); // Next paragraph
    
    await user.keyboard('{ArrowDown}'); // Skip second paragraph
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
    
    // Test navigation between multiple words
    await user.keyboard('{ArrowRight}'); // Move to second word
    await user.keyboard('{ArrowLeft}'); // Move back to first word
    
    await waitFor(() => {
      const firstWord = screen.getByText(/波浪起伏/);
      expect(firstWord).toHaveClass('selected');
    });
  });

  test('WordGame menu positioning and interaction', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Open menu
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowDown}');
    
    await waitFor(() => {
      // Menu should appear
      expect(screen.getByText(/1\.\s*相反色/)).toBeInTheDocument();
      expect(screen.getByText(/2\.\s*互補色/)).toBeInTheDocument();
      expect(screen.getByText(/3\.\s*對比色/)).toBeInTheDocument();
    });
    
    // Navigate within menu
    await user.keyboard('{ArrowRight}');
    
    await waitFor(() => {
      const secondOption = screen.getByText(/2\.\s*互補色/);
      expect(secondOption).toHaveClass('selected');
    });
    
    // Confirm selection
    await user.keyboard('{ArrowDown}');
    
    await waitFor(() => {
      // Menu should disappear and word should be replaced
      expect(screen.queryByText(/1\.\s*相反色/)).not.toBeInTheDocument();
      expect(screen.getByText('互補色')).toBeInTheDocument();
    });
  });

  test('WordGame completion hint appears and disappears correctly', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Complete word selection
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    
    // Move to end of paragraph
    await user.keyboard('{ArrowRight}');
    
    await waitFor(() => {
      // Hint should appear
      expect(screen.getByText('左右移動以選擇字詞，按下確認可開啟選單，在段尾按下確認以繼續')).toBeInTheDocument();
    });
    
    // Proceed to next paragraph
    await user.keyboard('{ArrowDown}');
    
    await waitFor(() => {
      // Hint should disappear and new paragraph should start
      expect(screen.queryByText('左右移動以選擇字詞，按下確認可開啟選單，在段尾按下確認以繼續')).not.toBeInTheDocument();
      expect(screen.getByText(/「直子，睜開眼睛！看著我！」/)).toBeInTheDocument();
    });
  });

  test('WordGame handles rapid key presses gracefully', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Rapid key presses
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowLeft}{ArrowRight}{ArrowLeft}');
    
    // Should not crash and should handle gracefully
    await waitFor(() => {
      expect(screen.getByText(/又回到保健室躺著/)).toBeInTheDocument();
    });
  });

  test('WordGame preserves all completed paragraphs', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Complete first paragraph
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowDown}');
    
    // Complete second paragraph
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowDown}');
    
    await waitFor(() => {
      // All paragraphs should be visible
      expect(screen.getByText(/又回到保健室躺著/)).toBeInTheDocument();
      expect(screen.getByText(/「直子，睜開眼睛！看著我！」/)).toBeInTheDocument();
      expect(screen.getByText(/從雙眼皮夾縫的波浪起伏/)).toBeInTheDocument();
    });
  });

  test('WordGame handles edge cases in word selection', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Test boundary conditions
    await user.keyboard('{ArrowDown}');
    
    // Try to go left when already at first word
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowLeft}');
    
    await waitFor(() => {
      const firstWord = screen.getByText('相反色');
      expect(firstWord).toHaveClass('selected');
    });
    
    // Try to go right when at end
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowRight}');
    
    // Should still be at end
    await waitFor(() => {
      expect(screen.getByText('左右移動以選擇字詞，按下確認可開啟選單，在段尾按下確認以繼續')).toBeInTheDocument();
    });
  });
});

describe('Component Integration with Router', () => {
  test('Chapter3 integrates properly with React Router', () => {
    render(
      <BrowserRouter>
        <Chapter3 />
      </BrowserRouter>
    );
    
    // Should render without errors
    expect(screen.getByText('Wcrd')).toBeInTheDocument();
  });
});
