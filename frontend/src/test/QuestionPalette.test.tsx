import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionPalette } from '../components/exam/QuestionPalette';

describe('QuestionPalette Component', () => {
  it('renders all question numbers and correct answered tally', () => {
    const answered = new Set([0, 2]);
    const flagged = new Set([1]);
    const onSelectMock = vi.fn();

    render(
      <QuestionPalette
        totalQuestions={5}
        currentIndex={0}
        answeredIndices={answered}
        flaggedIndices={flagged}
        onSelectQuestion={onSelectMock}
      />
    );

    expect(screen.getByText(/Questions \(2\/5\)/)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    // Clicking question 4
    fireEvent.click(screen.getByText('4'));
    expect(onSelectMock).toHaveBeenCalledWith(3);
  });
});
