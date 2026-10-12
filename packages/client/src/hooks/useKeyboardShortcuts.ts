/**
 * Global keyboard shortcut system.
 *
 * Registers document-level keydown listeners and suppresses them
 * when focus is inside an input, textarea, or contenteditable element.
 * Shortcuts are defined as a map of key combos to callbacks.
 */

import { useEffect, useRef } from 'react';

export interface ShortcutDef {
  /** The key value (e.g. 'q', '/', 'Escape'). Case-insensitive for letters. */
  key: string;
  /** Require Ctrl (or Cmd on Mac). */
  ctrl?: boolean;
  /** Require Shift. */
  shift?: boolean;
  /** Require Alt (or Option on Mac). */
  alt?: boolean;
  /** Fire even when an input/textarea is focused. */
  allowInInput?: boolean;
  /** Handler. Return false to let the event propagate. */
  handler: (e: KeyboardEvent) => void | false;
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

/**
 * Register global keyboard shortcuts. Shortcuts are re-registered
 * whenever the array reference changes, so wrap in useMemo or
 * define outside the component if the list is static.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutDef[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      for (const shortcut of shortcutsRef.current) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        if (!keyMatch) continue;

        const ctrlMatch = shortcut.ctrl
          ? e.ctrlKey || e.metaKey
          : !e.ctrlKey && !e.metaKey;
        if (!ctrlMatch) continue;

        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        if (!shiftMatch) continue;

        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        if (!altMatch) continue;

        if (!shortcut.allowInInput && isInputFocused()) continue;

        e.preventDefault();
        const result = shortcut.handler(e);
        if (result !== false) return;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
