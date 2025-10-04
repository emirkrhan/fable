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
    debounceMs = 4000,
    enabled = true,
  } = options;

  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const [lastSaved, setLastSaved] = useState(null);

  const saveTimerRef = useRef(null);
  const previousDataRef = useRef(null);
  const isSavingRef = useRef(false);
  const saveQueuedRef = useRef(false);

  // ✅ FIX #8: Smart serialization - sadece önemli field'ları serialize et
  const serializeData = useCallback((data) => {
    try {
      // Eğer data bir string ise (workspaceDataTrigger gibi), direkt kullan
      if (typeof data === 'string' || typeof data === 'number') {
        return String(data);
      }

      // Object ise akıllı serialize yap
      if (data && typeof data === 'object') {
        // Sadece node content ve edge data'sını serialize et - position değişimini ignore et
        return JSON.stringify({
          nodes: data.nodes?.map(n => ({
            id: n.id,
            type: n.type,
            data: n.data // ✅ Sadece content, position yok
          })),
          edges: data.edges?.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            data: e.data
          }))
        });
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

  // Actual save function
  const performSave = useCallback(async () => {
    if (isSavingRef.current) {
      // If already saving, queue another save
      saveQueuedRef.current = true;
      return;
    }

    // 🔒 Boş data ise kaydetme (ilk yükleme)
    const serialized = serializeData(data);
    if (!serialized || serialized === '""' || serialized === '{}' || serialized === '[]') {
      setStatus('idle');
      return;
    }

    // Check if data changed
    if (!hasDataChanged()) {
      setStatus('idle');
      return;
    }

    isSavingRef.current = true;
    setStatus('saving');

    try {
      await saveFunction();
      setStatus('saved');
      setLastSaved(new Date());

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 2000);

      // If a save was queued while we were saving, trigger it now
      if (saveQueuedRef.current) {
        saveQueuedRef.current = false;
        setTimeout(() => {
          performSave();
        }, 100);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      setStatus('error');

      // Reset to idle after 3 seconds on error
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    } finally {
      isSavingRef.current = false;
    }
  }, [saveFunction, hasDataChanged]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!enabled) return;

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Set new timer
    saveTimerRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);

    // Cleanup
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [data, enabled, debounceMs, performSave]);

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
