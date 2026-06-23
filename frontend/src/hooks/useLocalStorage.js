import { useState, useCallback } from "react";

export function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      const toStore = typeof value === "function" ? value(stored) : value;
      setStored(toStore);
      try {
        localStorage.setItem(key, JSON.stringify(toStore));
      } catch {}
    },
    [key, stored]
  );

  return [stored, setValue];
}
