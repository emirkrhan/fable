import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const BOARDS_COLLECTION = 'boards';

/**
 * Create a new board
 */
export async function createBoard(userId, boardName) {
  try {
    const boardData = {
      name: boardName || 'Untitled Board',
      ownerId: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      nodes: [],
      edges: [],
      sharedWith: []
    };

    const docRef = await addDoc(collection(db, BOARDS_COLLECTION), boardData);
    console.log('Board created with ID:', docRef.id);
    return { id: docRef.id, ...boardData };
  } catch (error) {
    console.error('Error creating board:', error);
    throw error;
  }
}

/**
 * Get all boards for a user (owned + shared)
 */
export async function getUserBoards(userId) {
  try {
    // Get owned boards
    const ownedQuery = query(
      collection(db, BOARDS_COLLECTION),
      where('ownerId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const ownedSnapshot = await getDocs(ownedQuery);
    const ownedBoards = ownedSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isOwner: true
    }));

    // Get shared boards
    const sharedQuery = query(
      collection(db, BOARDS_COLLECTION),
      where('sharedWith', 'array-contains', { userId, permission: 'comment-only' })
    );

    // Note: Firestore array-contains doesn't work with objects directly
    // We need to get all boards and filter manually
    const allBoardsSnapshot = await getDocs(collection(db, BOARDS_COLLECTION));
    const sharedBoards = allBoardsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(board =>
        board.ownerId !== userId &&
        board.sharedWith?.some(share => share.userId === userId)
      )
      .map(board => ({ ...board, isOwner: false }));

    return [...ownedBoards, ...sharedBoards];
  } catch (error) {
    console.error('Error getting user boards:', error);
    throw error;
  }
}

/**
 * Get a single board by ID
 */
export async function getBoard(boardId) {
  try {
    const boardRef = doc(db, BOARDS_COLLECTION, boardId);
    const boardSnap = await getDoc(boardRef);

    if (boardSnap.exists()) {
      return { id: boardSnap.id, ...boardSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting board:', error);
    throw error;
  }
}

/**
 * Update board name
 */
export async function updateBoardName(boardId, newName) {
  try {
    const boardRef = doc(db, BOARDS_COLLECTION, boardId);
    await updateDoc(boardRef, {
      name: newName,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating board name:', error);
    throw error;
  }
}

/**
 * Save board content (nodes and edges)
 */
export async function saveBoardContent(boardId, nodes, edges) {
  try {
    const boardRef = doc(db, BOARDS_COLLECTION, boardId);
    await updateDoc(boardRef, {
      nodes,
      edges,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error saving board content:', error);
    throw error;
  }
}

/**
 * Delete a board (owner only)
 */
export async function deleteBoard(boardId) {
  try {
    const boardRef = doc(db, BOARDS_COLLECTION, boardId);
    await deleteDoc(boardRef);
    console.log('Board deleted:', boardId);
    return true;
  } catch (error) {
    console.error('Error deleting board:', error);
    throw error;
  }
}

/**
 * Share board with a user by email
 */
export async function shareBoardWithUser(boardId, userEmail, currentUserId) {
  try {
    // First, find user by email in users collection
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', userEmail)
    );
    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.empty) {
      throw new Error('User not found with this email');
    }

    const targetUser = usersSnapshot.docs[0];
    const targetUserId = targetUser.id;

    // Check if user is trying to share with themselves
    if (targetUserId === currentUserId) {
      throw new Error('Cannot share board with yourself');
    }

    // Get current board
    const board = await getBoard(boardId);

    // Check if already shared
    if (board.sharedWith?.some(share => share.userId === targetUserId)) {
      throw new Error('Board already shared with this user');
    }

    // Add to sharedWith array
    const boardRef = doc(db, BOARDS_COLLECTION, boardId);
    const newSharedWith = [
      ...(board.sharedWith || []),
      {
        userId: targetUserId,
        email: userEmail,
        permission: 'comment-only',
        sharedAt: Timestamp.now()
      }
    ];

    await updateDoc(boardRef, {
      sharedWith: newSharedWith,
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error('Error sharing board:', error);
    throw error;
  }
}

/**
 * Remove user from shared board
 */
export async function unshareBoard(boardId, userId) {
  try {
    const board = await getBoard(boardId);
    const newSharedWith = board.sharedWith?.filter(share => share.userId !== userId) || [];

    const boardRef = doc(db, BOARDS_COLLECTION, boardId);
    await updateDoc(boardRef, {
      sharedWith: newSharedWith,
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error('Error unsharing board:', error);
    throw error;
  }
}

/**
 * Check user permission for a board
 */
export function getBoardPermission(board, userId) {
  if (!board || !userId) return null;

  if (board.ownerId === userId) {
    return 'owner';
  }

  const sharedAccess = board.sharedWith?.find(share => share.userId === userId);
  return sharedAccess?.permission || null;
}

/**
 * Join board - Mark user as active
 * Uses server timestamp for accurate presence tracking
 */
export async function joinBoard(boardId, userId, userName, photoURL) {
  try {
    const boardRef = doc(db, BOARDS_COLLECTION, boardId);
    const board = await getBoard(boardId);
    
    if (!board) return false;

    // Mevcut aktif kullanıcıları al
    const activeUsers = board.activeUsers || [];
    
    // Kullanıcı zaten aktif mi?
    const existingUserIndex = activeUsers.findIndex(u => u.userId === userId);
    
    // Mevcut kullanıcının rengini koru veya yeni renk oluştur
    const userColor = existingUserIndex >= 0 
      ? activeUsers[existingUserIndex].color 
      : getRandomUserColor();
    
    const newUser = {
      userId,
      userName: userName || 'Anonymous',
      photoURL: photoURL || '',
      color: userColor,
      lastSeen: Timestamp.now() // ⚡ Server timestamp kullan - daha güvenilir
    };
    
    let updatedActiveUsers;
    if (existingUserIndex >= 0) {
      // Varsa güncelle (rengi koru)
      updatedActiveUsers = [...activeUsers];
      updatedActiveUsers[existingUserIndex] = newUser;
    } else {
      // Yoksa ekle
      updatedActiveUsers = [...activeUsers, newUser];
    }
    
    await updateDoc(boardRef, {
      activeUsers: updatedActiveUsers
    });
    
    return true;
  } catch (error) {
    console.error('Error joining board:', error);
    return false;
  }
}

/**
 * Update heartbeat - Keep user alive without full rejoin
 * Lightweight operation - only updates timestamp
 */
export async function updateUserHeartbeat(boardId, userId) {
  try {
    const boardRef = doc(db, BOARDS_COLLECTION, boardId);
    const board = await getBoard(boardId);
    
    if (!board) return false;

    const activeUsers = board.activeUsers || [];
    const userIndex = activeUsers.findIndex(u => u.userId === userId);
    
    if (userIndex === -1) {
      // User not in list - they need to join first
      return false;
    }
    
    // Sadece timestamp'i güncelle - minimal write operation
    const updatedActiveUsers = [...activeUsers];
    updatedActiveUsers[userIndex] = {
      ...updatedActiveUsers[userIndex],
      lastSeen: Timestamp.now()
    };
    
    await updateDoc(boardRef, {
      activeUsers: updatedActiveUsers
    });
    
    return true;
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    return false;
  }
}

/**
 * Leave board - Remove user from active users
 */
export async function leaveBoard(boardId, userId) {
  try {
    const boardRef = doc(db, BOARDS_COLLECTION, boardId);
    const board = await getBoard(boardId);
    
    if (!board) return false;

    const updatedActiveUsers = (board.activeUsers || []).filter(
      user => user.userId !== userId
    );
    
    await updateDoc(boardRef, {
      activeUsers: updatedActiveUsers
    });
    
    return true;
  } catch (error) {
    console.error('Error leaving board:', error);
    return false;
  }
}

/**
 * Get random user color for avatar
 */
function getRandomUserColor() {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Orange
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky blue
    '#F8B500', // Amber
    '#52B788', // Green
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
