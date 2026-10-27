/**
 * Application-wide constants.
 */

// --- App ---

export const APP_NAME = 'Karya';
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// --- Priority (ADR-002) ---
// Higher number = higher priority in API/DB.
// UI labels are the inverse: p1 = urgent, p4 = normal.

export const PRIORITY_MAP = {
  4: 'p1', // urgent (red)
  3: 'p2', // high (orange)
  2: 'p3', // medium (blue)
  1: 'p4', // normal (no color)
} as const;

export const PRIORITY_VALUES = [1, 2, 3, 4] as const;

export const PRIORITY_COLORS: Record<number, string> = {
  4: '#c2542f', // clay
  3: '#c98a2c', // gold
  2: '#3d6ea5', // slate blue
  1: 'transparent',
};

export const PRIORITY_LABELS: Record<number, string> = {
  4: 'Urgent',
  3: 'High',
  2: 'Medium',
  1: 'Normal',
};

// --- Limits (ADR-004, ADR-008) ---

export const MAX_SUBTASK_DEPTH = 4;
export const MAX_CONTENT_LENGTH = 2000;
export const MAX_DESCRIPTION_LENGTH = 16000;
export const MAX_EMAIL_LENGTH = 255;
export const MAX_NAME_LENGTH = 255;
export const MAX_PASSWORD_LENGTH = 128;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_SEARCH_QUERY_LENGTH = 255;
export const MIN_SEARCH_QUERY_LENGTH = 2;

// --- Ordering (ADR-003) ---

export const ORDER_GAP = 1000;

// --- Rate Limits (ADR-008) ---

export const RATE_LIMIT_GENERAL = { windowMs: 60_000, max: 100 };       // 100 req/min per user
export const RATE_LIMIT_LOGIN = { windowMs: 15 * 60_000, max: 10 };     // 10/15min per IP
export const RATE_LIMIT_SIGNUP = { windowMs: 15 * 60_000, max: 5 };     // 5/15min per IP
export const RATE_LIMIT_RESEND = { windowMs: 60 * 60_000, max: 3 };     // 3/hour per email
export const RATE_LIMIT_EXPORT = { windowMs: 60 * 60_000, max: 1 };     // 1/hour per user

// --- Token Expiry (ADR-007) ---

export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// --- Color Palette ---
// Predefined project/label colors. Default is 'charcoal'.

export const COLOR_PALETTE = [
  'berry_red',
  'red',
  'orange',
  'yellow',
  'olive_green',
  'lime_green',
  'green',
  'mint_green',
  'teal',
  'sky_blue',
  'light_blue',
  'blue',
  'grape',
  'violet',
  'lavender',
  'magenta',
  'salmon',
  'charcoal',
  'grey',
  'taupe',
] as const;

export type ColorName = typeof COLOR_PALETTE[number];

export const COLOR_HEX: Record<ColorName, string> = {
  berry_red: '#b8255f',
  red: '#db4035',
  orange: '#ff9933',
  yellow: '#fad000',
  olive_green: '#afb83b',
  lime_green: '#7ecc49',
  green: '#299438',
  mint_green: '#6accbc',
  teal: '#158fad',
  sky_blue: '#14aaf5',
  light_blue: '#96c3eb',
  blue: '#4073ff',
  grape: '#884dff',
  violet: '#af38eb',
  lavender: '#eb96eb',
  magenta: '#e05194',
  salmon: '#ff8d85',
  charcoal: '#808080',
  grey: '#b8b8b8',
  taupe: '#ccac93',
};

export const DEFAULT_COLOR: ColorName = 'charcoal';

// --- View Styles ---

export const VIEW_STYLES = ['list', 'board'] as const;

// --- Upcoming view ---

export const DEFAULT_UPCOMING_DAYS = 14;
export const MAX_UPCOMING_DAYS = 90;
