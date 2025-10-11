import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LongPressBackToLogin from '../LongPressBackToLogin';
import { useLongPressEnter } from '../../hooks/useLongPressEnter';

// Mock the hook
jest.mock('../../hooks/useLongPressEnter');

// Mock window.location.assign
const mockAssign = jest.fn();
delete window.location;
window.location = {
  assign: mockAssign
};

describe('LongPressBackToLogin Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAssign.mockClear();
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
    expect(screen.getByText('返回登入頁面')).toBeInTheDocument();
  });

  test('should render when in completed state', () => {
    useLongPressEnter.mockReturnValue({
      state: 'completed',
      progress: 100,
      isEnabled: true
    });

    render(<LongPressBackToLogin />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('返回登入頁面')).toBeInTheDocument();
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

  test('should have correct ARIA attributes', () => {
    useLongPressEnter.mockReturnValue({
      state: 'showing',
      progress: 50,
      isEnabled: true
    });

    render(<LongPressBackToLogin />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label', '返回登入頁面進度');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    
    const statusText = screen.getByText('返回登入頁面');
    expect(statusText).toHaveAttribute('aria-live', 'polite');
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
    
    expect(useLongPressEnter).toHaveBeenCalledWith(customProps);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('should have correct CSS classes and styles', () => {
    useLongPressEnter.mockReturnValue({
      state: 'showing',
      progress: 60,
      isEnabled: true
    });

    render(<LongPressBackToLogin />);
    
    const container = screen.getByRole('progressbar').parentElement;
    expect(container).toHaveClass('long-press-overlay');
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveClass('long-press-progress');
  });

  test('should handle 100% progress correctly', () => {
    useLongPressEnter.mockReturnValue({
      state: 'completed',
      progress: 100,
      isEnabled: true
    });

    render(<LongPressBackToLogin />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  test('should handle 0% progress correctly', () => {
    useLongPressEnter.mockReturnValue({
      state: 'showing',
      progress: 0,
      isEnabled: true
    });

    render(<LongPressBackToLogin />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  test('should render SVG circle with correct properties', () => {
    useLongPressEnter.mockReturnValue({
      state: 'showing',
      progress: 45,
      isEnabled: true
    });

    render(<LongPressBackToLogin />);
    
    const svg = screen.getByRole('progressbar').querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    const circle = svg.querySelector('circle');
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute('r', '18');
    expect(circle).toHaveAttribute('cx', '25');
    expect(circle).toHaveAttribute('cy', '25');
  });

  test('should calculate stroke-dasharray correctly', () => {
    useLongPressEnter.mockReturnValue({
      state: 'showing',
      progress: 50,
      isEnabled: true
    });

    render(<LongPressBackToLogin />);
    
    const circle = screen.getByRole('progressbar').querySelector('circle');
    const circumference = 2 * Math.PI * 18; // radius = 18
    const expectedDashArray = `${circumference * 0.5} ${circumference}`;
    
    expect(circle).toHaveAttribute('stroke-dasharray', expectedDashArray);
  });

  test('should handle edge case progress values', () => {
    // Test with very small progress
    useLongPressEnter.mockReturnValue({
      state: 'showing',
      progress: 0.1,
      isEnabled: true
    });

    const { rerender } = render(<LongPressBackToLogin />);
    
    const circle = screen.getByRole('progressbar').querySelector('circle');
    const circumference = 2 * Math.PI * 18;
    const expectedDashArray = `${circumference * 0.001} ${circumference}`;
    
    expect(circle).toHaveAttribute('stroke-dasharray', expectedDashArray);
    
    // Test with very large progress
    useLongPressEnter.mockReturnValue({
      state: 'showing',
      progress: 99.9,
      isEnabled: true
    });

    rerender(<LongPressBackToLogin />);
    
    const updatedCircle = screen.getByRole('progressbar').querySelector('circle');
    const updatedDashArray = `${circumference * 0.999} ${circumference}`;
    
    expect(updatedCircle).toHaveAttribute('stroke-dasharray', updatedDashArray);
  });
});

describe('LongPressBackToLogin Accessibility', () => {
  test('should be accessible to screen readers', () => {
    useLongPressEnter.mockReturnValue({
      state: 'showing',
      progress: 50,
      isEnabled: true
    });

    render(<LongPressBackToLogin />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label');
    expect(progressBar).toHaveAttribute('aria-valuenow');
    expect(progressBar).toHaveAttribute('aria-valuemin');
    expect(progressBar).toHaveAttribute('aria-valuemax');
    
    const statusText = screen.getByText('返回登入頁面');
    expect(statusText).toHaveAttribute('aria-live');
  });

  test('should announce progress changes', () => {
    useLongPressEnter.mockReturnValue({
      state: 'showing',
      progress: 25,
      isEnabled: true
    });

    const { rerender } = render(<LongPressBackToLogin />);
    
    let progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '25');
    
    // Update progress
    useLongPressEnter.mockReturnValue({
      state: 'showing',
      progress: 75,
      isEnabled: true
    });

    rerender(<LongPressBackToLogin />);
    
    progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
  });
});
