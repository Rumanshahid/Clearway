import { useCallback, useEffect, useRef, useState } from "react";

// Nav dropdowns (Chat/Tasks/Notifications/account) open immediately on
// mouseenter but close after a short delay on mouseleave instead of
// instantly — long enough to move the cursor from the icon into the
// dropdown panel without it snapping shut first.
export function useHoverDelay(delayMs = 250) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const onMouseEnter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), delayMs);
  }, [delayMs]);

  return { open, setOpen, onMouseEnter, onMouseLeave };
}
