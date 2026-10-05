import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ExamTimer } from '../components/exam/ExamTimer';

describe('ExamTimer Component', () => {
  it('renders countdown timer formatted correctly', () => {
    // 5 minutes in future
    const dueAt = new Date(Date.now() + 300000).toISOString();
    render(<ExamTimer dueAt={dueAt} onExpire={() => {}} />);

    const timer = screen.getByRole('timer');
    expect(timer).toBeInTheDocument();
    expect(timer.textContent).toMatch(/04:5\d|05:00/);
  });

  it('triggers onExpire callback when timer hits 0', () => {
    vi.useFakeTimers();
    const onExpireMock = vi.fn();
    // 1 second in future
    const dueAt = new Date(Date.now() + 1000).toISOString();

    render(<ExamTimer dueAt={dueAt} initialRemainingSeconds={1} onExpire={onExpireMock} />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onExpireMock).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
