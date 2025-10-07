import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Professional auto-save hook with debounce mechanism
 *
 * Features:
 * - Debounced saves (waits 2 seconds after last change)
 * - Tracks save status (idle, saving, saved, error)
 * - Prevents unnecessary saves when data hasn't changed
 * - Handles errors gracefully
 * - Provides manual save trigger
 *
 * @param {Function} saveFunction - Async function to save data
 * @param {any} data - Data to save (will be compared for changes)
 * @param {Object} options - Configuration options
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default: 4000)
 * @param {boolean} options.enabled - Enable/disable auto-save (default: true)
 * @returns {Object} - { status, lastSaved, triggerSave }
 */
export function useAutoSave(saveFunction, data, options = {}) {
  const {
    debounceMs = 2000,
    enabled = true,
  } = options;

  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const [lastSaved, setLastSaved] = useState(null);

  const saveTimerRef = useRef(null);
  const previousDataRef = useRef(null);
  const isSavingRef = useRef(false);
  const saveQueuedRef = useRef(false);

  const serializeData = useCallback((data) => {
    try {
      if (typeof data === 'string' || typeof data === 'number') {
        return String(data);
      }
      return JSON.stringify(data);
    } catch {
      return null;
    }
  }, []);

  // Check if data has actually changed
  const hasDataChanged = useCallback(() => {
    const currentSerialized = serializeData(data);
    const previousSerialized = previousDataRef.current;

    if (previousSerialized === null) {
      // First time, just store the data - don't consider it changed
      previousDataRef.current = currentSerialized;
      return false;
    }

    const changed = currentSerialized !== previousSerialized;
    if (changed) {
      previousDataRef.current = currentSerialized;
    }

    return changed;
  }, [data, serializeData]);

  const performSave = useCallback(async () => {
    if (isSavingRef.current) {
      saveQueuedRef.current = true;
      return;
    }

    if (!hasDataChanged()) {
      return;
    }

    isSavingRef.current = true;
    setStatus('saving');

    try {
      await saveFunction();
      setStatus('saved');
      setLastSaved(new Date());

      setTimeout(() => setStatus('idle'), 2000);

      if (saveQueuedRef.current) {
        saveQueuedRef.current = false;
        setTimeout(() => performSave(), 100);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      isSavingRef.current = false;
    }
  }, [saveFunction, hasDataChanged]);

  useEffect(() => {
    if (!enabled) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [data, enabled, debounceMs, performSave]);

  // Try to save on page hide/unload to avoid data loss
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Best-effort save
        performSave();
      }
    };

    const handleBeforeUnload = () => {
      // Best-effort save (cannot guarantee completion)
      performSave();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, performSave]);

  // Manual save trigger (bypasses debounce)
  const triggerSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    await performSave();
  }, [performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    status,
    lastSaved,
    triggerSave,
  };
}
