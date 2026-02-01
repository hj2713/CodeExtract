import * as React from "react"

// Ported from: source/apps/v4/hooks/use-mutation-observer.ts

/**
 * Custom hook to observe DOM mutations on a referenced element
 *
 * This hook is used to watch for attribute changes (like aria-selected)
 * to detect when a command item becomes highlighted/selected.
 */
export const useMutationObserver = (
  ref: React.RefObject<HTMLElement | null>,
  callback: MutationCallback,
  options: MutationObserverInit = {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  }
) => {
  React.useEffect(() => {
    if (ref.current) {
      const observer = new MutationObserver(callback)
      observer.observe(ref.current, options)
      return () => observer.disconnect()
    }
  }, [ref, callback, options])
}
