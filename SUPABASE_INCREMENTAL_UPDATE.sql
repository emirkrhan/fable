-- =====================================================
-- INCREMENTAL BOARD UPDATE FUNCTION
-- =====================================================
-- Bu fonksiyon boards tablosunda incremental JSONB update yapar
-- Full state yerine sadece değişen node/edge'leri günceller

-- 1. Apply board patches function
CREATE OR REPLACE FUNCTION apply_board_patches(
  p_board_id UUID,
  p_user_id UUID,
  p_changes JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_nodes JSONB;
  v_current_edges JSONB;
  v_change JSONB;
  v_change_type TEXT;
  v_node_id TEXT;
  v_edge_id TEXT;
  v_updated_nodes JSONB;
  v_updated_edges JSONB;
  v_node_index INT;
  v_edge_index INT;
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM boards
    WHERE id = p_board_id AND owner_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Board not found or access denied';
  END IF;

  -- Get current state
  SELECT nodes, edges INTO v_current_nodes, v_current_edges
  FROM boards
  WHERE id = p_board_id;

  -- Initialize with current state
  v_updated_nodes := v_current_nodes;
  v_updated_edges := v_current_edges;

  -- Apply each change
  FOR v_change IN SELECT * FROM jsonb_array_elements(p_changes)
  LOOP
    v_change_type := v_change->>'type';

    CASE v_change_type
      -- Update node (position, data, etc.)
      WHEN 'updateNode' THEN
        v_node_id := v_change->>'id';

        -- Find node index
        SELECT idx - 1 INTO v_node_index
        FROM jsonb_array_elements(v_updated_nodes) WITH ORDINALITY arr(elem, idx)
        WHERE elem->>'id' = v_node_id;

        IF v_node_index IS NOT NULL THEN
          -- Merge changes into existing node
          v_updated_nodes := jsonb_set(
            v_updated_nodes,
            ARRAY[v_node_index::text],
            v_updated_nodes->v_node_index || (v_change->'data')
          );
        END IF;

      -- Add new node
      WHEN 'addNode' THEN
        v_updated_nodes := v_updated_nodes || jsonb_build_array(v_change->'node');

      -- Delete node
      WHEN 'deleteNode' THEN
        v_node_id := v_change->>'id';

        SELECT jsonb_agg(elem) INTO v_updated_nodes
        FROM jsonb_array_elements(v_updated_nodes) elem
        WHERE elem->>'id' != v_node_id;

      -- Update edge
      WHEN 'updateEdge' THEN
        v_edge_id := v_change->>'id';

        SELECT idx - 1 INTO v_edge_index
        FROM jsonb_array_elements(v_updated_edges) WITH ORDINALITY arr(elem, idx)
        WHERE elem->>'id' = v_edge_id;

        IF v_edge_index IS NOT NULL THEN
          v_updated_edges := jsonb_set(
            v_updated_edges,
            ARRAY[v_edge_index::text],
            v_updated_edges->v_edge_index || (v_change->'data')
          );
        END IF;

      -- Add new edge
      WHEN 'addEdge' THEN
        v_updated_edges := v_updated_edges || jsonb_build_array(v_change->'edge');

      -- Delete edge
      WHEN 'deleteEdge' THEN
        v_edge_id := v_change->>'id';

        SELECT jsonb_agg(elem) INTO v_updated_edges
        FROM jsonb_array_elements(v_updated_edges) elem
        WHERE elem->>'id' != v_edge_id;

      ELSE
        RAISE NOTICE 'Unknown change type: %', v_change_type;
    END CASE;
  END LOOP;

  -- Update board with new state
  UPDATE boards
  SET
    nodes = v_updated_nodes,
    edges = v_updated_edges,
    updated_at = NOW()
  WHERE id = p_board_id;

  -- Return updated state
  RETURN jsonb_build_object(
    'nodes', v_updated_nodes,
    'edges', v_updated_edges,
    'updated_at', NOW()
  );
END;
$$;

-- 2. Grant execute permission
GRANT EXECUTE ON FUNCTION apply_board_patches TO authenticated;

-- 3. Create index for faster JSONB lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_boards_nodes_gin ON boards USING gin(nodes);
CREATE INDEX IF NOT EXISTS idx_boards_edges_gin ON boards USING gin(edges);

-- =====================================================
-- USAGE EXAMPLE:
-- =====================================================
-- SELECT apply_board_patches(
--   'board-uuid-here'::uuid,
--   'user-uuid-here'::uuid,
--   '[
--     {"type": "updateNode", "id": "1", "data": {"position": {"x": 100, "y": 200}}},
--     {"type": "addNode", "node": {"id": "2", "type": "storyCard", "data": {...}}},
--     {"type": "deleteEdge", "id": "edge-1"}
--   ]'::jsonb
-- );
