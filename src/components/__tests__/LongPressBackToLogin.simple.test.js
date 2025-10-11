import React from 'react';
import { render, screen } from '@testing-library/react';
import LongPressBackToLogin from '../LongPressBackToLogin';
import { useLongPressEnter } from '../../hooks/useLongPressEnter';

// Mock the hook
jest.mock('../../hooks/useLongPressEnter');

describe('LongPressBackToLogin Component - Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should not render when not enabled', () => {
    useLongPressEnter.mockReturnValue({
      state: 'idle',
      progress: 0,
      isEnabled: false
    });

    const { container } = render(<LongPressBackToLogin />);
    
    expect(container.firstChild).toBeNull();
  });

  test('should not render when in revealing state', () => {
    useLongPressEnter.mockReturnValue({
      state: 'revealing',
      progress: 0,
      isEnabled: true
    });

    const { container } = render(<LongPressBackToLogin />);
    
    expect(container.firstChild).toBeNull();
  });

  test('should render when in showing state', () => {
    useLongPressEnter.mockReturnValue({
      state: 'showing',
      progress: 50,
      isEnabled: true
    });

    render(<LongPressBackToLogin />);
    
    // Check for progress bar elements
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('should render when in completed state', () => {
    useLongPressEnter.mockReturnValue({
      state: 'completed',
      progress: 100,
      isEnabled: true
    });

    render(<LongPressBackToLogin />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('should display correct progress percentage', () => {
    useLongPressEnter.mockReturnValue({
      state: 'showing',
      progress: 75,
      isEnabled: true
    });

    render(<LongPressBackToLogin />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  test('should render with custom configuration', () => {
    useLongPressEnter.mockReturnValue({
      state: 'showing',
      progress: 30,
      isEnabled: true
    });

    const customProps = {
      loginPath: '/custom-login',
      revealDelayMs: 200,
      confirmHoldMs: 500,
      enabledPaths: ['/custom-path'],
      zIndex: 10000
    };

    render(<LongPressBackToLogin {...customProps} />);
    
    // Check that the hook was called with the expected props (excluding zIndex)
    const expectedProps = {
      loginPath: '/custom-login',
      revealDelayMs: 200,
      confirmHoldMs: 500,
      enabledPaths: ['/custom-path']
    };
    expect(useLongPressEnter).toHaveBeenCalledWith(expectedProps);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
