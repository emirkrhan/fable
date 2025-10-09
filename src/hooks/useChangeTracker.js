import { useRef, useCallback } from 'react';

/**
 * Tracks incremental changes to ReactFlow nodes and edges
 * Returns only the changes (patches) instead of full state
 *
 * @returns {Object} - { trackChange, getChanges, clearChanges }
 */
export function useChangeTracker() {
  const changesRef = useRef([]);
  const lastStateRef = useRef({ nodes: [], edges: [] });

  /**
   * Track a change from ReactFlow
   * @param {string} type - 'nodes' or 'edges'
   * @param {Array} changes - ReactFlow change objects
   */
  const trackChange = useCallback((type, changes) => {
    if (!changes || changes.length === 0) return;

    changes.forEach(change => {
      const { type: changeType, id, item, source, target } = change;

      switch (changeType) {
        case 'add':
          if (type === 'nodes') {
            changesRef.current.push({
              type: 'addNode',
              node: item,
              timestamp: Date.now()
            });
          } else if (type === 'edges') {
            changesRef.current.push({
              type: 'addEdge',
              edge: item,
              timestamp: Date.now()
            });
          }
          break;

        case 'remove':
          if (type === 'nodes') {
            changesRef.current.push({
              type: 'deleteNode',
              id,
              timestamp: Date.now()
            });
          } else if (type === 'edges') {
            changesRef.current.push({
              type: 'deleteEdge',
              id,
              timestamp: Date.now()
            });
          }
          break;

        case 'position':
        case 'dimensions':
        case 'select':
          if (type === 'nodes' && (changeType === 'position' || changeType === 'dimensions')) {
            // Only track position/dimension changes
            changesRef.current.push({
              type: 'updateNode',
              id,
              data: change,
              timestamp: Date.now()
            });
          }
          break;

        default:
          // Handle other change types
          break;
      }
    });

    // Keep only last 100 changes to prevent memory leak
    if (changesRef.current.length > 100) {
      changesRef.current = changesRef.current.slice(-100);
    }
  }, []);

  /**
   * Track node data changes (text, properties, etc.)
   * @param {string} nodeId - Node ID
   * @param {Object} data - Updated data
   */
  const trackNodeDataChange = useCallback((nodeId, data) => {
    changesRef.current.push({
      type: 'updateNode',
      id: nodeId,
      data: { data },
      timestamp: Date.now()
    });
  }, []);

  /**
   * Track edge data changes (label, style, etc.)
   * @param {string} edgeId - Edge ID
   * @param {Object} data - Updated data
   */
  const trackEdgeDataChange = useCallback((edgeId, data) => {
    changesRef.current.push({
      type: 'updateEdge',
      id: edgeId,
      data: { data },
      timestamp: Date.now()
    });
  }, []);

  /**
   * Get all accumulated changes
   * @returns {Array} - Array of change objects
   */
  const getChanges = useCallback(() => {
    return [...changesRef.current];
  }, []);

  /**
   * Clear all tracked changes
   */
  const clearChanges = useCallback(() => {
    changesRef.current = [];
  }, []);

  /**
   * Get change count
   * @returns {number}
   */
  const getChangeCount = useCallback(() => {
    return changesRef.current.length;
  }, []);

  /**
   * Merge duplicate changes for same node/edge
   * (reduces payload size)
   * @returns {Array} - Deduplicated changes
   */
  const getMergedChanges = useCallback(() => {
    const changeMap = new Map();

    changesRef.current.forEach(change => {
      const key = `${change.type}:${change.id || change.node?.id || change.edge?.id}`;

      if (changeMap.has(key)) {
        // Merge with existing change
        const existing = changeMap.get(key);
        changeMap.set(key, {
          ...existing,
          data: { ...existing.data, ...change.data },
          timestamp: change.timestamp
        });
      } else {
        changeMap.set(key, change);
      }
    });

    return Array.from(changeMap.values());
  }, []);

  return {
    trackChange,
    trackNodeDataChange,
    trackEdgeDataChange,
    getChanges,
    getMergedChanges,
    clearChanges,
    getChangeCount
  };
}
