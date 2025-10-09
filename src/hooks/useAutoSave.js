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

  // Optimized comparison for workspace data
  // Use JSON.stringify but only when data structure is reasonable size
  const createDataFingerprint = useCallback((data) => {
    try {
      if (typeof data === 'string' || typeof data === 'number') {
        return String(data);
      }

      // For workspace data, we need to detect content changes too
      // JSON.stringify is necessary but we'll optimize by doing it only once per check
      return JSON.stringify(data);
    } catch (error) {
      console.error('Error creating fingerprint:', error);
      return null;
    }
  }, []);

  // Check if data has actually changed using fingerprint comparison
  const hasDataChanged = useCallback(() => {
    const currentFingerprint = createDataFingerprint(data);
    const previousFingerprint = previousDataRef.current;

    if (previousFingerprint === null) {
      // First render: seed snapshot, do not trigger save
      previousDataRef.current = currentFingerprint;
      return false;
    }

    return currentFingerprint !== previousFingerprint;
  }, [data, createDataFingerprint]);

  const performSave = useCallback(async () => {
    if (isSavingRef.current) {
      saveQueuedRef.current = true;
      return;
    }

    const currentFingerprint = createDataFingerprint(data);
    const previousFingerprint = previousDataRef.current;

    // Check if data has changed
    if (previousFingerprint !== null && currentFingerprint === previousFingerprint) {
      return;
    }

    isSavingRef.current = true;
    setStatus('saving');

    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      try {
        // saveFunction kendi içinde zaman aşımı/iptal yönetimi yapar
        await saveFunction();
        // Update snapshot AFTER successful save to avoid losing retries on failure
        previousDataRef.current = currentFingerprint;
        setStatus('saved');
        setLastSaved(new Date());

        setTimeout(() => setStatus('idle'), 2000);

        if (saveQueuedRef.current) {
          saveQueuedRef.current = false;
          setTimeout(() => performSave(), 100);
        }

        // Success - break out of retry loop
        break;
      } catch (error) {
        retries++;
        console.error(`Auto-save failed (attempt ${retries}/${maxRetries + 1}):`, error);

        if (retries > maxRetries) {
          // All retries exhausted
          setStatus('error');
          setTimeout(() => setStatus('idle'), 3000);
        } else {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    }

    isSavingRef.current = false;
  }, [saveFunction, createDataFingerprint, data]);

  useEffect(() => {
    if (!enabled) {
      console.log('🔴 Auto-save disabled');
      return;
    }

    const currentFingerprint = createDataFingerprint(data);

    // Initialize snapshot on first render
    if (previousDataRef.current === null) {
      console.log('🆕 First render - initializing fingerprint');
      previousDataRef.current = currentFingerprint;
      return;
    }

    // Check if data actually changed before setting timer
    if (currentFingerprint === previousDataRef.current) {
      console.log('✅ Data unchanged - skipping save');
      return;
    }

    console.log('🔄 Data changed - scheduling save in', debounceMs, 'ms');

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      console.log('💾 Executing auto-save');
      performSave();
    }, debounceMs);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [data, enabled, debounceMs, performSave, createDataFingerprint]);

  // No visibility/unload behavior: keep auto-save strictly debounce-on-change

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
