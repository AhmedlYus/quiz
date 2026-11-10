// Countdown that only nudges: it reaches zero and says so, but never stops the player. It starts
// once, when the player starts speaking or typing (startOnce), and can be paused by hand.
import { useCallback, useEffect, useRef, useState } from 'react';

export type Countdown = {
  seconds: number;
  left: number;
  isRunning: boolean;
  isOver: boolean;
  hasStarted: boolean;
  /** Starts the first time only; later calls (more typing) do nothing. */
  startOnce: () => void;
  start: () => void;
  pause: () => void;
};

export function useCountdown(seconds: number, isEnabled: boolean): Countdown {
  const [left, setLeft] = useState(seconds);
  const [isRunning, setRunning] = useState(false);
  const [hasStarted, setStarted] = useState(false);
  const leftRef = useRef(seconds);
  const deadline = useRef(0);

  useEffect(() => {
    if (!isRunning) return;
    deadline.current = Date.now() + leftRef.current * 1000;
    const id = setInterval(() => {
      const next = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      leftRef.current = next;
      setLeft(next);
      if (next <= 0) setRunning(false);
    }, 250);
    return () => clearInterval(id);
  }, [isRunning]);

  // Turning the timer off pauses it; turning it back on waits for the next start.
  useEffect(() => {
    if (!isEnabled) setRunning(false);
  }, [isEnabled]);

  const start = useCallback(() => {
    if (isEnabled && leftRef.current > 0) {
      setStarted(true);
      setRunning(true);
    }
  }, [isEnabled]);

  const startedRef = useRef(false);
  const startOnce = useCallback(() => {
    if (!isEnabled || startedRef.current) return;
    startedRef.current = true;
    start();
  }, [isEnabled, start]);

  const pause = useCallback(() => setRunning(false), []);

  return { seconds, left, isRunning, isOver: left <= 0, hasStarted, startOnce, start, pause };
}
