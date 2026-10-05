import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AutosaveIndicator } from '../components/exam/AutosaveIndicator';

describe('AutosaveIndicator Component', () => {
  it('renders saving state', () => {
    render(<AutosaveIndicator state="saving" />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('renders saved state with timestamp if provided', () => {
    render(<AutosaveIndicator state="saved" lastSavedAt="10:30:00 AM" />);
    expect(screen.getByText('Saved at 10:30:00 AM')).toBeInTheDocument();
  });

  it('renders unsaved state', () => {
    render(<AutosaveIndicator state="unsaved" />);
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<AutosaveIndicator state="error" />);
    expect(screen.getByText('Save failed (retrying)')).toBeInTheDocument();
  });
});
