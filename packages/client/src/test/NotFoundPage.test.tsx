/**
 * Tests for the NotFoundPage component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFoundPage from '../pages/NotFoundPage';

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  );
}

describe('NotFoundPage', () => {
  it('renders 404 heading', () => {
    renderWithRouter();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('shows "Page not found" message', () => {
    renderWithRouter();
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('has a link to inbox', () => {
    renderWithRouter();
    const inboxLink = screen.getByText('Go to Inbox');
    expect(inboxLink).toBeInTheDocument();
    expect(inboxLink.closest('a')).toHaveAttribute('href', '/inbox');
  });

  it('has a link to today view', () => {
    renderWithRouter();
    const todayLink = screen.getByText('View Today');
    expect(todayLink).toBeInTheDocument();
    expect(todayLink.closest('a')).toHaveAttribute('href', '/today');
  });
});
