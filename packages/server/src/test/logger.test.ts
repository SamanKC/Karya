/**
 * Unit tests for the structured logger.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('logger.info calls console.log', async () => {
    const { logger } = await import('../lib/logger.js');
    logger.info('test message');
    expect(console.log).toHaveBeenCalled();
  });

  it('logger.error calls console.error', async () => {
    const { logger } = await import('../lib/logger.js');
    logger.error('error message');
    expect(console.error).toHaveBeenCalled();
  });

  it('logger.warn calls console.warn', async () => {
    const { logger } = await import('../lib/logger.js');
    logger.warn('warning message');
    expect(console.warn).toHaveBeenCalled();
  });

  it('includes meta data in output', async () => {
    const { logger } = await import('../lib/logger.js');
    logger.info('with meta', { userId: '123' });
    const output = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(output).toContain('with meta');
    expect(output).toContain('123');
  });
});
