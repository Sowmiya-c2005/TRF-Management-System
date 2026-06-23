import { useState, useEffect } from "react";

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { text: "Good morning",   emoji: "☀️" };
  if (h >= 12 && h < 17) return { text: "Good afternoon", emoji: "🌤️" };
  if (h >= 17 && h < 21) return { text: "Good evening",   emoji: "🌆" };
  return                         { text: "Good night",     emoji: "🌙" };
}

/**
 * Returns { greeting, emoji } and updates automatically
 * on the minute boundary so it never shows stale text.
 */
export function useGreeting() {
  const [greeting, setGreeting] = useState(getGreeting);

  useEffect(() => {
    // Align to the next full minute
    const msToNextMinute = (60 - new Date().getSeconds()) * 1000;
    const timeout = setTimeout(() => {
      setGreeting(getGreeting());
      const interval = setInterval(() => setGreeting(getGreeting()), 60_000);
      return () => clearInterval(interval);
    }, msToNextMinute);
    return () => clearTimeout(timeout);
  }, []);

  return greeting;
}
