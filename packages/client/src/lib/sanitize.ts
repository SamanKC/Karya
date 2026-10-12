/**
 * Client-side HTML sanitization for rendering task descriptions.
 * Uses DOMPurify to strip dangerous tags while keeping basic formatting.
 */

import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'b', 'i', 'em', 'strong', 'a', 'p', 'br',
  'ul', 'ol', 'li', 'code', 'pre',
];

const ALLOWED_ATTR = ['href', 'target', 'rel'];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ['target'],
  });
}
