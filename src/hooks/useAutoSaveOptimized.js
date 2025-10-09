import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Production-grade auto-save hook with:
 * - Debounced saves
 * - localStorage backup (offline resilience)
 * - Optimized change detection
 * - Error recovery
 * - Status tracking
 *
 * @param {Function} saveFunction - Async function to save data to server
 * @param {any} data - Data to save (workspace state)
 * @param {Object} options - Configuration options
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default: 2000)
 * @param {boolean} options.enabled - Enable/disable auto-save (default: true)
 * @param {string} options.storageKey - localStorage key for backup (default: 'board-draft')
 * @returns {Object} - { status, lastSaved, triggerSave, hasUnsavedChanges }
 */
export function useAutoSaveOptimized(saveFunction, data, options = {}) {
  const {
    debounceMs = 2000,
    enabled = true,
    storageKey = 'board-draft',
  } = options;

  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const saveTimerRef = useRef(null);
  const lastSavedDataRef = useRef(null);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const lastSaveTimeRef = useRef(0);

  // Create a hash of data for comparison
  // Uses JSON.stringify for accurate change detection
  const createHash = useCallback((obj) => {
    if (!obj) return null;

    try {
      // Use JSON.stringify for accurate comparison
      // This ensures position changes are detected
      return JSON.stringify(obj);
    } catch (error) {
      console.error('Error creating hash:', error);
      return Date.now().toString(); // Force change on error
    }
  }, []);

  // Save to localStorage as backup
  const saveToLocalStorage = useCallback((data) => {
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [storageKey]);

  // Load from localStorage (for recovery)
  const loadFromLocalStorage = useCallback(() => {
    if (!storageKey) return null;

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return parsed.data;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }, [storageKey]);

  // Clear localStorage backup after successful save
  const clearLocalStorage = useCallback(() => {
    if (!storageKey) return;

    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }, [storageKey]);

  // Perform save operation
  const performSave = useCallback(async () => {
    if (isSavingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    const currentHash = createHash(data);
    const lastSavedHash = createHash(lastSavedDataRef.current);

    // Skip if no changes
    if (currentHash === lastSavedHash) {
      console.log('⏭️ No changes detected, skipping save');
      return;
    }

    isSavingRef.current = true;
    setStatus('saving');
    setHasUnsavedChanges(true);

    // Save to localStorage first (backup)
    saveToLocalStorage(data);

    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      try {
        console.log('💾 Auto-saving to server... (attempt', retries + 1, ')');
        await saveFunction();

        // Success!
        lastSavedDataRef.current = data;
        setStatus('saved');
        setLastSaved(new Date());
        setHasUnsavedChanges(false);

        // Clear localStorage backup
        clearLocalStorage();

        setTimeout(() => {
          if (status === 'saved') {
            setStatus('idle');
          }
        }, 2000);

        // Handle pending save
        if (pendingSaveRef.current) {
          pendingSaveRef.current = false;
          setTimeout(() => performSave(), 100);
        }

        break;
      } catch (error) {
        retries++;
        console.error(`Auto-save failed (attempt ${retries}/${maxRetries + 1}):`, error);

        if (retries > maxRetries) {
          // All retries exhausted
          setStatus('error');
          setHasUnsavedChanges(true);

          setTimeout(() => setStatus('idle'), 3000);

          // Keep data in localStorage for recovery
          console.warn('⚠️ Auto-save failed, data saved to localStorage for recovery');
        } else {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    }

    isSavingRef.current = false;
  }, [saveFunction, data, createHash, saveToLocalStorage, clearLocalStorage, status]);

  // Main auto-save effect
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const currentHash = createHash(data);

    // Initialize on first render
    if (lastSavedDataRef.current === null) {
      console.log('🆕 First render - initializing');
      lastSavedDataRef.current = data;
      return;
    }

    const lastSavedHash = createHash(lastSavedDataRef.current);

    // Check if data actually changed
    if (currentHash === lastSavedHash) {
      return;
    }

    // Throttle: Don't schedule new save if we just saved recently (within 1 second)
    const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
    if (timeSinceLastSave < 1000) {
      console.log('⏸️ Throttled - just saved', timeSinceLastSave, 'ms ago');
      return;
    }

    console.log('🔄 Data changed - scheduling save in', debounceMs, 'ms');
    setHasUnsavedChanges(true);

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Schedule save
    saveTimerRef.current = setTimeout(() => {
      console.log('⏰ Debounce complete - executing save');
      lastSaveTimeRef.current = Date.now();
      performSave();
    }, debounceMs);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [data, enabled, debounceMs, performSave, createHash]);

  // Manual save trigger (bypasses debounce)
  const triggerSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    await performSave();
  }, [performSave]);

  // Handle page visibility changes (tab switching)
  // Save immediately when user returns to the tab
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && hasUnsavedChanges) {
        console.log('👁️ Tab became visible with unsaved changes - triggering save');
        // Clear any pending timer
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
        }
        // Save immediately
        performSave();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, hasUnsavedChanges, performSave]);

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
    hasUnsavedChanges,
    loadFromLocalStorage, // Expose for recovery UI
  };
}
