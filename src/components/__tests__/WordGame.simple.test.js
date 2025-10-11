import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WordGame from '../WordGame';

// Mock CSS imports
jest.mock('../../styles/word2003.css', () => ({}));

describe('WordGame Component - Basic Tests', () => {
  test('renders Word 2003 interface', () => {
    render(<WordGame />);
    
    // Check for Word 2003 UI elements
    expect(screen.getByText('Wcrd')).toBeInTheDocument();
    expect(screen.getByText('檔案(F)')).toBeInTheDocument();
    expect(screen.getByText('編輯(E)')).toBeInTheDocument();
    expect(screen.getByText('檢視(V)')).toBeInTheDocument();
  });

  test('starts with first paragraph typing animation', async () => {
    render(<WordGame />);

    // Should start typing the first paragraph after 2 second delay
    await waitFor(() => {
      expect(screen.getByText(/又回到保健室躺著/)).toBeInTheDocument();
    }, { timeout: 5000 }); // Increased timeout to account for 2s delay + typing time
  });

  test('skips typing animation when down arrow is pressed', async () => {
    const user = userEvent.setup();
    render(<WordGame />);
    
    // Wait for typing to start after 2 second delay
    await waitFor(() => {
      expect(screen.getByText(/又回到保健室躺著/)).toBeInTheDocument();
    }, { timeout: 5000 }); // Increased timeout to account for 2s delay + typing time
    
    // Press down arrow to skip animation
    await user.keyboard('{ArrowDown}');
    
    // Should show complete first paragraph
    await waitFor(() => {
      expect(screen.getByText(/又回到保健室躺著，數不清是開學後的第幾次了/)).toBeInTheDocument();
    });
  });

  test('shows interactive word with underline', async () => {
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
      expect(screen.getByText('互補色')).toBeInTheDocument();
      expect(screen.getByText('對比色')).toBeInTheDocument();
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
});
