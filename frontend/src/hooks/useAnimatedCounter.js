import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 to `target` over `duration` ms.
 * Returns the current display value (integer).
 */
export function useAnimatedCounter(target, duration = 1200, enabled = true) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (!enabled || typeof target !== "number" || isNaN(target)) {
      setValue(typeof target === "number" ? target : 0);
      return;
    }
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-quart
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, enabled]);

  return value;
}
