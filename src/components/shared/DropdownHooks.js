import { useState, useEffect, useCallback, useRef } from "react";

/**
 * useOutsideClick — calls handler when clicking outside the ref element.
 */
export function useOutsideClick(ref, handler) {
  const cb = useCallback((e) => {
    if (ref.current && !ref.current.contains(e.target)) handler();
  }, [ref, handler]);
  useEffect(() => {
    document.addEventListener("mousedown", cb);
    document.addEventListener("touchstart", cb);
    return () => {
      document.removeEventListener("mousedown", cb);
      document.removeEventListener("touchstart", cb);
    };
  }, [cb]);
}

/**
 * useDropdownPos — given a trigger ref and an open boolean,
 * returns a style object { position: "fixed", top, left } that places
 * the dropdown below the trigger, clamped to the viewport.
 * Also flips upward if there isn't enough room below.
 */
export function useDropdownPos(triggerRef, open) {
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!open || !triggerRef.current) {
      setPos(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownWidth = 180;
    const dropdownPadding = 8;
    const estimatedHeight = 220;

    // Prefer right-aligned (dropdown left edge near button right edge)
    let left = rect.right - dropdownWidth;
    if (left < dropdownPadding) left = dropdownPadding;

    // Default: below the trigger
    let top = rect.bottom + 4;

    // If dropdown would overflow bottom of viewport, flip upward
    if (top + estimatedHeight > window.innerHeight - dropdownPadding) {
      top = rect.top - estimatedHeight - 4;
    }
    // Clamp to top of viewport
    if (top < dropdownPadding) top = dropdownPadding;

    setPos({ position: "fixed", top, left, marginTop: 0, zIndex: 100 });
  }, [open, triggerRef]);

  return pos;
}