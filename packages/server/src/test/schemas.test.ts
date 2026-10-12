/**
 * Unit tests for shared zod validation schemas.
 */

import { describe, it, expect } from 'vitest';
import {
  signupSchema,
  loginSchema,
  changePasswordSchema,
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
} from '@karya/shared';

describe('signupSchema', () => {
  it('accepts valid input and applies transforms', () => {
    const result = signupSchema.safeParse({
      email: 'Test@Example.com',
      password: 'securepass123',
      name: ' Alice ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
      expect(result.data.name).toBe('Alice');
      expect(result.data.timezone).toBe('UTC');
    }
  });

  it('rejects short password', () => {
    const result = signupSchema.safeParse({
      email: 'a@b.com',
      password: 'short',
      name: 'Bob',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = signupSchema.safeParse({
      email: 'not-an-email',
      password: 'securepass',
      name: 'Bob',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = signupSchema.safeParse({
      email: 'a@b.com',
      password: 'securepass',
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password over 128 characters', () => {
    const result = signupSchema.safeParse({
      email: 'a@b.com',
      password: 'a'.repeat(129),
      name: 'Alice',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts valid input and lowercases email', () => {
    const result = loginSchema.safeParse({
      email: 'Test@Example.com',
      password: 'anything',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });

  it('rejects missing password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com' });
    expect(result.success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('accepts valid password change', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpass',
      newPassword: 'newsecure123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short new password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpass',
      newPassword: 'short',
    });
    expect(result.success).toBe(false);
  });
});

describe('createTaskSchema', () => {
  it('accepts minimal task with defaults', () => {
    const result = createTaskSchema.safeParse({ content: 'Buy milk' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe('Buy milk');
      expect(result.data.priority).toBe(1);
      expect(result.data.dueDate).toBeNull();
      expect(result.data.labelIds).toEqual([]);
    }
  });

  it('rejects empty content', () => {
    const result = createTaskSchema.safeParse({ content: '' });
    expect(result.success).toBe(false);
  });

  it('rejects content over max length', () => {
    const result = createTaskSchema.safeParse({ content: 'a'.repeat(2001) });
    expect(result.success).toBe(false);
  });

  it('accepts valid priority values', () => {
    for (const p of [1, 2, 3, 4]) {
      const result = createTaskSchema.safeParse({ content: 'Task', priority: p });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid priority value', () => {
    const result = createTaskSchema.safeParse({ content: 'Task', priority: 5 });
    expect(result.success).toBe(false);
  });

  it('accepts valid due date format', () => {
    const result = createTaskSchema.safeParse({
      content: 'Task',
      dueDate: '2025-01-15',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid due date format', () => {
    const result = createTaskSchema.safeParse({
      content: 'Task',
      dueDate: '01/15/2025',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid label IDs', () => {
    const result = createTaskSchema.safeParse({
      content: 'Task',
      labelIds: ['550e8400-e29b-41d4-a716-446655440000'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID label IDs', () => {
    const result = createTaskSchema.safeParse({
      content: 'Task',
      labelIds: ['not-a-uuid'],
    });
    expect(result.success).toBe(false);
  });
});

describe('updateTaskSchema', () => {
  it('accepts empty update (all fields optional)', () => {
    const result = updateTaskSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial updates', () => {
    const result = updateTaskSchema.safeParse({ priority: 3 });
    expect(result.success).toBe(true);
  });

  it('accepts setting parentId to null', () => {
    const result = updateTaskSchema.safeParse({ parentId: null });
    expect(result.success).toBe(true);
  });
});

describe('taskQuerySchema', () => {
  it('parses completed as boolean', () => {
    const result = taskQuerySchema.safeParse({ completed: 'true' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.completed).toBe(true);
    }
  });

  it('coerces priority from string to number', () => {
    const result = taskQuerySchema.safeParse({ priority: '3' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe(3);
    }
  });

  it('rejects search query under 2 chars', () => {
    const result = taskQuerySchema.safeParse({ search: 'a' });
    expect(result.success).toBe(false);
  });
});
