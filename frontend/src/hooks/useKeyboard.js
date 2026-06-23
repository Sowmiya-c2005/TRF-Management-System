import { useEffect } from "react";

/**
 * useKeyboard({ "ctrl+k": handler, "Escape": handler })
 * Handles Ctrl/Cmd+key combos as well as plain keys.
 */
export function useKeyboard(bindings) {
  useEffect(() => {
    const handle = (e) => {
      const key = [
        e.ctrlKey || e.metaKey ? "ctrl" : null,
        e.shiftKey ? "shift" : null,
        e.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join("+");

      if (bindings[key]) {
        e.preventDefault();
        bindings[key](e);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [bindings]); // eslint-disable-line react-hooks/exhaustive-deps
}
