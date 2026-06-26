import { useEffect, useRef, useState } from "react";

/**
 * useAnimatedCounter
 * ──────────────────────────────────────────────────────────────────────────
 * Animates a number from 0 → target using ease-out-quart easing.
 * Triggers automatically when target changes (e.g. after API data loads).
 * Optionally triggers only when the element enters the viewport.
 *
 * @param {number}  target   — final value
 * @param {number}  duration — ms (default 1400)
 * @param {boolean} enabled  — pass false to skip animation
 * @returns {{ value: number, ref: React.RefObject }}
 */
export function useAnimatedCounter(target, duration = 1400, enabled = true) {
  const [value,  setValue]  = useState(0);
  const rafRef   = useRef(null);
  const elRef    = useRef(null);
  // Track whether we've already observed the element entering the viewport
  const observedRef = useRef(false);

  const animate = (to) => {
    cancelAnimationFrame(rafRef.current);
    if (!enabled || typeof to !== "number" || isNaN(to)) {
      setValue(typeof to === "number" ? to : 0);
      return;
    }
    setValue(0);
    const t0 = performance.now();
    const tick = (now) => {
      const elapsed  = now - t0;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 4); // ease-out-quart
      setValue(Math.round(eased * to));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // Re-animate whenever target changes
  useEffect(() => {
    if (!enabled) { setValue(typeof target === "number" ? target : 0); return; }
    if (typeof target !== "number" || isNaN(target)) return;

    const el = elRef.current;

    // If no element ref is attached, or element is already visible, start immediately
    if (!el || observedRef.current) {
      animate(target);
      return;
    }

    // Wait for element to enter viewport before starting
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observedRef.current = true;
          observer.disconnect();
          animate(target);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, enabled]);

  // Cleanup RAF on unmount
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return { value, ref: elRef };
}
