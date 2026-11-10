// Keyboard for a question: 1-8 or A-H answer, S skips, Enter / Space / right arrow go to the next
// question. Ignored while typing and when a modifier key is held.
import { useEffect, useRef } from 'react';

export const LETTERS = 'ABCDEFGH';

type Handlers = {
  optionCount: number;
  answered: boolean;
  canSkip: boolean;
  /** Is the keyboard locked, e.g. while an answer is being sent? */
  isBusy: boolean;
  onChoose: (position: number) => void;
  onSkip: () => void;
  onNext: () => void;
};

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
const isControl = (el: EventTarget | null) => el instanceof HTMLElement && el.closest('button, a, [role="button"]') !== null;

export function useOptionShortcuts(handlers: Handlers) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const h = ref.current;
      if (ev.metaKey || ev.ctrlKey || ev.altKey || isTyping(ev.target) || ev.isComposing) return;
      if (h.isBusy) return;
      if (!h.answered) {
        const key = ev.key.length === 1 ? ev.key.toUpperCase() : '';
        if (key === 'S' && h.canSkip) return h.onSkip();
        const n = /^[1-8]$/.test(key) ? Number(key) - 1 : LETTERS.indexOf(key);
        if (key && n >= 0 && n < h.optionCount) h.onChoose(n);
        return;
      }
      if (ev.key === 'ArrowRight' || ((ev.key === 'Enter' || ev.key === ' ') && !isControl(ev.target))) {
        ev.preventDefault();
        h.onNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
