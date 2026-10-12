/**
 * Smoke tests: verify shared constants and types are importable and correct.
 */

import { describe, it, expect } from 'vitest';
import {
  APP_NAME,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  PRIORITY_VALUES,
  COLOR_HEX,
  ORDER_GAP,
  MAX_SUBTASK_DEPTH,
} from '@karya/shared';

describe('shared constants', () => {
  it('has correct app name', () => {
    expect(APP_NAME).toBe('Karya');
  });

  it('defines all four priority levels', () => {
    expect(PRIORITY_VALUES).toEqual([1, 2, 3, 4]);
  });

  it('maps priority values to labels', () => {
    expect(PRIORITY_LABELS[4]).toBe('Urgent');
    expect(PRIORITY_LABELS[3]).toBe('High');
    expect(PRIORITY_LABELS[2]).toBe('Medium');
    expect(PRIORITY_LABELS[1]).toBe('Normal');
  });

  it('maps priority values to colors', () => {
    expect(PRIORITY_COLORS[4]).toBe('#d1453b');
    expect(PRIORITY_COLORS[1]).toBe('transparent');
  });

  it('defines color palette with hex values', () => {
    expect(COLOR_HEX.charcoal).toBeDefined();
    expect(COLOR_HEX.charcoal).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('has correct ordering gap', () => {
    expect(ORDER_GAP).toBe(1000);
  });

  it('has correct max subtask depth', () => {
    expect(MAX_SUBTASK_DEPTH).toBe(4);
  });
});
