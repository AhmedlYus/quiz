// Number keys on the overview open the action with that shortcut.
import { useEffect, useRef } from 'react';
import { navigate } from '@/app/router';

type Target = { href: string; shortcut?: string; isDisabled?: boolean };

export function useHomeShortcuts(targets: Target[]) {
  const ref = useRef(targets);
  ref.current = targets;
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const el = ev.target;
      if (ev.metaKey || ev.ctrlKey || ev.altKey || (el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)))) return;
      const target = ref.current.find((t) => t.shortcut === ev.key);
      if (target && !target.isDisabled) navigate(target.href);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
