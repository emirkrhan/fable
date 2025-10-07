/**
 * Custom hook for stable user reference
 * ✅ FIX #3: Prevents memory leaks by avoiding unnecessary useEffect re-runs
 *
 * Problem: user object changes frequently (displayName, photoURL updates)
 * This causes useEffect to re-run and re-create event listeners
 *
 * Solution: Use ref to store user data, only update when uid changes
 */

import { useRef, useEffect } from 'react';

/**
 * Returns a stable reference to user data
 * @param {Object} user - Firebase Auth user object
 * @returns {Object} stableUserRef - React ref object with current user
 *
 * Usage:
 * ```javascript
 * const userRef = useStableUser(user);
 *
 * useEffect(() => {
 *   // userRef.current won't cause re-runs when displayName/photoURL changes
 *   const listener = () => {
 *     doSomething(userRef.current.uid);
 *   };
 *   window.addEventListener('event', listener);
 *   return () => window.removeEventListener('event', listener);
 * }, []); // No user dependency!
 * ```
 */
export function useStableUser(user) {
  const userRef = useRef({
    uid: null,
    displayName: null,
    email: null,
    photoURL: null
  });

  // Update ref whenever user changes
  // This doesn't cause re-renders, just updates the ref value
  useEffect(() => {
    userRef.current = {
      uid: user?.uid || null,
      displayName: user?.displayName || null,
      email: user?.email || null,
      photoURL: user?.photoURL || null
    };
  }, [user]);

  return userRef;
}

/**
 * Returns just the user UID as a stable value
 * Useful when you only need the UID and don't want re-renders
 */
export function useStableUserId(user) {
  const userIdRef = useRef(null);

  useEffect(() => {
    userIdRef.current = user?.uid || null;
  }, [user?.uid]); // Only uid, not whole user

  return userIdRef;
}

/**
 * Custom hook for event listener with cleanup
 * ✅ Automatically handles addEventListener/removeEventListener
 * ✅ Prevents memory leaks with proper cleanup
 *
 * @param {string} eventName - Event name (e.g., 'visibilitychange')
 * @param {Function} handler - Event handler function
 * @param {Object} options - Options { enabled, target }
 */
export function useEventListener(eventName, handler, options = {}) {
  const {
    enabled = true,
    target = typeof window !== 'undefined' ? document : null
  } = options;

  const savedHandler = useRef();

  // Update ref.current value if handler changes.
  // This allows our effect below to always get latest handler
  // without us needing to pass it in effect deps array
  // and potentially cause effect to re-run every render.
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled || !target) return;

    // Create event listener that calls handler function stored in ref
    const eventListener = (event) => savedHandler.current?.(event);

    target.addEventListener(eventName, eventListener);

    return () => {
      target.removeEventListener(eventName, eventListener);
    };
  }, [eventName, enabled, target]);
}

/**
 * Custom hook for interval with cleanup
 * ✅ Automatically handles setInterval/clearInterval
 * ✅ Prevents memory leaks
 *
 * @param {Function} callback - Function to call on interval
 * @param {number} delay - Delay in milliseconds
 * @param {Object} options - Options { enabled }
 */
export function useInterval(callback, delay, options = {}) {
  const { enabled = true } = options;
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    if (!enabled || delay === null) return;

    function tick() {
      savedCallback.current?.();
    }

    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay, enabled]);
}

export default {
  useStableUser,
  useStableUserId,
  useEventListener,
  useInterval
};
