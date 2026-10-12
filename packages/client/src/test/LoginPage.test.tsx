/**
 * Tests for LoginPage component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/auth-context';
import LoginPage from '../pages/LoginPage';

function renderLoginPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  it('renders the app name', () => {
    renderLoginPage();
    expect(screen.getByText('Karya')).toBeInTheDocument();
  });

  it('renders the tagline', () => {
    renderLoginPage();
    expect(screen.getByText('Plan less. Accomplish more.')).toBeInTheDocument();
  });

  it('renders email and password inputs', () => {
    renderLoginPage();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders login button', () => {
    renderLoginPage();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('has a link to signup page', () => {
    renderLoginPage();
    const signupLink = screen.getByText('Sign up');
    expect(signupLink).toBeInTheDocument();
    expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');
  });

  it('login button is disabled when fields are empty', () => {
    renderLoginPage();
    const button = screen.getByRole('button', { name: /log in/i });
    expect(button).toBeDisabled();
  });
});
