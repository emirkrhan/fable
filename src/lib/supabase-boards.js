import { supabase } from './supabase';

// Create a new board
export async function createBoard(boardName = 'Untitled Board') {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('boards')
    .insert({
      owner_id: user.id,
      name: boardName,
      nodes: [],
      edges: []
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get all boards for the current user (owned only)
export async function getUserBoards() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get boards owned by user
  const { data: ownedBoards, error: ownedError } = await supabase
    .from('boards')
    .select('*')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });

  if (ownedError) throw ownedError;

  return {
    owned: ownedBoards || [],
    shared: []
  };
}

// Get a single board
export async function getBoard(boardId) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log('🔍 getBoard called for boardId:', boardId, 'by user:', user.id);

  // Get board data with better error handling
  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('*')
    .eq('id', boardId)
    .maybeSingle(); // Use maybeSingle to distinguish between "not found" and "error"

  console.log('📦 Board data received:', board);

  if (boardError) {
    console.error('❌ Board error:', boardError);
    // Add more context to the error
    if (boardError.code === 'PGRST116') {
      throw new Error('Board not found or access denied');
    }
    throw new Error(`Failed to load board: ${boardError.message}`);
  }

  if (!board) {
    console.error('❌ Board not found (null result)');
    return null;
  }

  console.log('📝 Board nodes:', board.nodes?.length || 0);
  console.log('🔗 Board edges:', board.edges?.length || 0);

  const result = {
    ...board,
    ownerId: board.owner_id
  };

  console.log('✅ Final board object:', result);

  return result;
}

// Update board name
export async function updateBoardName(boardId, newName) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('boards')
    .update({ name: newName })
    .eq('id', boardId)
    .eq('owner_id', user.id);

  if (error) throw error;
  return true;
}

// Save board patches (incremental updates)
export async function saveBoardPatches(boardId, changes) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  if (!Array.isArray(changes) || changes.length === 0) {
    console.log('⏭️ No changes to save');
    return true;
  }

  console.log(`📦 Saving ${changes.length} patches to board:`, boardId);

  try {
    const { data, error } = await supabase.rpc('apply_board_patches', {
      p_board_id: boardId,
      p_user_id: user.id,
      p_changes: changes
    });

    if (error) {
      console.error('❌ Patch save error:', error);
      throw new Error(`Failed to save patches: ${error.message}`);
    }

    console.log('✅ Patches applied successfully');
    return data;
  } catch (error) {
    console.error('❌ Error calling apply_board_patches:', error);
    throw error;
  }
}

// Save board content (nodes and edges) - Full state fallback
export async function saveBoardContent(boardId, nodes, edges, options = {}) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Validate input data
  if (!Array.isArray(nodes)) {
    throw new Error('Invalid nodes data: must be an array');
  }
  if (!Array.isArray(edges)) {
    throw new Error('Invalid edges data: must be an array');
  }

  // Optimize permission check: a single filtered update ensures ownership
  // If sharing is re-enabled later, extend this condition accordingly

  // Comment-only users can save (to add their comments)
  // Edit users and owners can save everything
  let query = supabase
    .from('boards')
    .update({
      nodes: nodes || [],
      edges: edges || []
    })
    .eq('id', boardId)
    .eq('owner_id', user.id);

  // Support abort via AbortController if provided
  if (options?.signal && typeof query.abortSignal === 'function') {
    query = query.abortSignal(options.signal);
  }

  const { error, data } = await query;

  if (error) {
    console.error('❌ Save board error:', error);
    // Add more context to save errors
    if (error.code === 'PGRST116') {
      throw new Error('Board not found or you do not have permission to save');
    }
    if (error.message?.includes('payload')) {
      throw new Error('Board data is too large to save');
    }
    throw new Error(`Failed to save board: ${error.message}`);
  }

  // Check if update actually modified any rows
  if (data && data.length === 0) {
    console.warn('⚠️ Save completed but no rows were updated');
  }

  return true;
}

// Delete a board
export async function deleteBoard(boardId) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', boardId)
    .eq('owner_id', user.id);

  if (error) throw error;
  return true;
}

// Get board permission for current user
export function getBoardPermission(board, userId) {
  if (!board || !userId) return null;
  if (board.ownerId === userId || board.owner_id === userId) return 'owner';
  // No sharing support; only owners have access
  return null;
}

// No-op: Sharing disabled, keep API surface for UI compatibility
export async function shareBoardWithUser(_boardId, _userEmail, _permission = 'comment-only') {
  return { success: false, error: 'Sharing is disabled in this version' };
}

// No-op: Sharing disabled, keep API surface for UI compatibility
export async function unshareBoard(_boardId, _userId) {
  return true;
}
