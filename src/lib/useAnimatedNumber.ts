'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Smoothly animates a number value toward a target using requestAnimationFrame.
 * Uses a spring-ish ease-out curve.
 *
 * @param target The value to animate toward
 * @param duration Animation duration in ms
 */
export function useAnimatedNumber(target: number, duration = 500): number {
  const [displayed, setDisplayed] = useState(target);
  const fromRef = useRef(target);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fromRef.current = displayed;
    startTimeRef.current = null;

    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // cubic ease-out

    const tick = (ts: number) => {
      if (startTimeRef.current === null) startTimeRef.current = ts;
      const elapsed = ts - startTimeRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = ease(t);
      const value = fromRef.current + (target - fromRef.current) * eased;
      setDisplayed(value);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return displayed;
}
