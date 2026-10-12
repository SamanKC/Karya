/**
 * HTML sanitization for user-supplied content (ADR-008).
 *
 * Strips all HTML tags from task content and descriptions.
 * Tasks store plain text, not rich HTML.
 */

import sanitizeHtml from 'sanitize-html';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

/** Strip all HTML from a string. Returns plain text. */
export function sanitize(input: string): string {
  return sanitizeHtml(input, SANITIZE_OPTIONS).trim();
}
