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

  // Get board data
  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('*')
    .eq('id', boardId)
    .single();

  console.log('📦 Board data received:', board);
  console.log('❌ Board error:', boardError);

  if (boardError) throw boardError;
  if (!board) return null;

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

// Save board content (nodes and edges)
export async function saveBoardContent(boardId, nodes, edges) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if user has permission to save (owner or shared user)
  const board = await getBoard(boardId);
  const permission = getBoardPermission(board, user.id);
  
  if (!permission) {
    throw new Error('User does not have permission to save this board');
  }

  // Comment-only users can save (to add their comments)
  // Edit users and owners can save everything
  const { error } = await supabase
    .from('boards')
    .update({
      nodes: nodes || [],
      edges: edges || []
    })
    .eq('id', boardId);

  if (error) throw error;
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
