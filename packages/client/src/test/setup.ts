/**
 * Vitest setup file for jsdom environment.
 */

import '@testing-library/jest-dom/vitest';

// Stub window.matchMedia for components that use responsive queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
