/**
 * Unit tests for HTML sanitization.
 */

import { describe, it, expect } from 'vitest';
import { sanitize } from '../lib/sanitize';

describe('sanitize', () => {
  it('strips all HTML tags', () => {
    expect(sanitize('<b>bold</b> <script>alert(1)</script>')).toBe('bold');
  });

  it('returns plain text unchanged', () => {
    expect(sanitize('Hello world')).toBe('Hello world');
  });

  it('strips event handlers', () => {
    expect(sanitize('<div onload="evil()">text</div>')).toBe('text');
  });

  it('handles empty string', () => {
    expect(sanitize('')).toBe('');
  });
});
