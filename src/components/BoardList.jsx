'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserBoards, createBoard, deleteBoard, updateBoardName } from '@/lib/boards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Plus, Loader2, Trash2, Edit2, Users, Check, LogOut, FileText, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function BoardList() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [boardToEdit, setBoardToEdit] = useState(null);
  const [editBoardName, setEditBoardName] = useState('');
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const avatarDropdownRef = useRef(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRefs = useRef({});

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadBoards();
  }, [user, router]);

  // Close avatar dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (avatarDropdownRef.current && !avatarDropdownRef.current.contains(event.target)) {
        setIsAvatarDropdownOpen(false);
      }
    }
    if (isAvatarDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isAvatarDropdownOpen]);

  // Close board menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (openMenuId && menuRefs.current[openMenuId]) {
        if (!menuRefs.current[openMenuId].contains(event.target)) {
          setOpenMenuId(null);
        }
      }
    }
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const userBoards = await getUserBoards(user.uid);
      setBoards(userBoards);
    } catch (error) {
      console.error('Error loading boards:', error);
      toast.error('Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) {
      toast.error('Please enter a board name');
      return;
    }

    try {
      setCreating(true);
      const newBoard = await createBoard(user.uid, newBoardName);
      toast.success('Board created!', { icon: <Check className="w-4 h-4" /> });
      setCreateDialogOpen(false);
      setNewBoardName('');
      await loadBoards();
      // Navigate to new board
      router.push(`/boards/${newBoard.id}`);
    } catch (error) {
      console.error('Error creating board:', error);
      toast.error('Failed to create board');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!boardToDelete) return;

    try {
      await deleteBoard(boardToDelete.id);
      toast.success('Board deleted!', { icon: <Trash2 className="w-4 h-4" /> });
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
      await loadBoards();
    } catch (error) {
      console.error('Error deleting board:', error);
      toast.error('Failed to delete board');
    }
  };

  const handleUpdateBoardName = async () => {
    if (!boardToEdit || !editBoardName.trim()) {
      toast.error('Please enter a board name');
      return;
    }

    try {
      await updateBoardName(boardToEdit.id, editBoardName);
      toast.success('Board name updated!', { icon: <Check className="w-4 h-4" /> });
      setEditDialogOpen(false);
      setBoardToEdit(null);
      setEditBoardName('');
      await loadBoards();
    } catch (error) {
      console.error('Error updating board name:', error);
      toast.error('Failed to update board name');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'MMM d, yyyy');
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading boards...</p>
        </div>
      </div>
    );
  }

  const BoardCard = ({ board }) => {
    return (
      <div
        className="cursor-pointer hover:border-primary/40 transition-all group relative bg-card border border-border rounded-lg shadow-sm"
        onClick={() => router.push(`/boards/${board.id}`)}
      >
        <div className="p-3">
          <div className="flex items-center justify-between gap-2">
            {/* Board Icon + Name */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium truncate leading-tight text-card-foreground">{board.name}</h3>
                <p className="text-[11px] mt-0.5 text-muted-foreground">
                  {formatDate(board.createdAt)}
                </p>
              </div>
            </div>

            {/* Three dots menu - Only for owners */}
            {board.isOwner && (
              <div className="flex-shrink-0 relative" ref={(el) => (menuRefs.current[board.id] = el)}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === board.id ? null : board.id);
                  }}
                  className="p-1 hover:bg-accent rounded transition-colors"
                  title="More options"
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
                {openMenuId === board.id && (
                  <div className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95">
                    <div className="py-1 px-1">
                      <button
                        className="w-full px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBoardToEdit(board);
                          setEditBoardName(board.name);
                          setEditDialogOpen(true);
                          setOpenMenuId(null);
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Rename
                      </button>
                      <button
                        className="w-full px-2 py-1.5 text-xs text-left hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 transition-colors rounded-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBoardToDelete(board);
                          setDeleteDialogOpen(true);
                          setOpenMenuId(null);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Badge - For shared boards */}
            {!board.isOwner && (
              <div className="flex-shrink-0">
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-0.5">
                  <Users className="w-2.5 h-2.5" />
                  Shared
                </Badge>
              </div>
            )}
          </div>

          {/* Shared info */}
          {board.sharedWith && board.sharedWith.length > 0 && board.isOwner && (
            <div className="mt-2 text-[10px] text-muted-foreground">
              Shared with {board.sharedWith.length} {board.sharedWith.length === 1 ? 'person' : 'people'}
            </div>
          )}

          {/* Owner info - For shared boards */}
          {!board.isOwner && board.ownerInfo && (
            <div className="mt-2 text-[10px] text-muted-foreground">
              Shared by {board.ownerInfo.displayName || board.ownerInfo.email}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar - Same style as TopNav */}
      <div className="w-full fixed top-0 z-50 pointer-events-none">
        <div className="w-full px-6 h-24 flex items-center justify-between">
          {/* Logo + Boards text */}
          <div className="ps-10 flex items-center gap-2.5 pointer-events-auto">
            <img src="/log.png" alt="fable" className="h-10" style={{ mixBlendMode: 'multiply' }} />
            <div className="h-6 w-px bg-border mx-2" />
            <span className="text-sm font-medium">Boards</span>
          </div>

          {/* Avatar with dropdown */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {user && (
              <div className="relative" ref={avatarDropdownRef}>
                <Avatar
                  className="cursor-pointer transition-all hover:opacity-80"
                  onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
                >
                  <AvatarImage
                    src={user.photoURL || "https://github.com/shadcn.png"}
                    alt={user.displayName || "User"}
                  />
                  <AvatarFallback>
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>

                {isAvatarDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95">
                    {/* User Info */}
                    <div className="px-3 py-1.5 border-b border-border">
                      <div className="font-medium text-xs leading-none text-foreground">{user.displayName}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">{user.email}</div>
                    </div>

                    {/* Log out */}
                    <div className="py-1 px-1">
                      <button
                        className="w-full px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm"
                        onClick={() => {
                          logout();
                          setIsAvatarDropdownOpen(false);
                        }}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content with top padding for fixed navbar */}
      <div className="w-full px-8 pt-28 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Boards</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Create and manage your story boards</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2" size="sm">
            <Plus className="w-4 h-4" />
            New Board
          </Button>
        </div>

        {/* Boards Grid */}
        {boards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground mb-3">No boards yet. Create your first board to get started!</p>
            <Button onClick={() => setCreateDialogOpen(true)} variant="outline" className="gap-2" size="sm">
              <Plus className="w-4 h-4" />
              Create Board
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* My Boards Section */}
            {boards.filter(b => b.isOwner).length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-2.5 px-1">My Boards</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {boards.filter(b => b.isOwner).map((board) => (
                    <BoardCard key={board.id} board={board} />
                  ))}
                </div>
              </div>
            )}

            {/* Shared With Me Section */}
            {boards.filter(b => !b.isOwner).length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-2.5 px-1">Shared With Me</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {boards.filter(b => !b.isOwner).map((board) => (
                    <BoardCard key={board.id} board={board} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Board Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Board</DialogTitle>
              <DialogDescription>
                Give your board a name to get started
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Board name"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateBoard();
                  }
                }}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBoard} disabled={creating}>
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Board Name Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Board</DialogTitle>
              <DialogDescription>
                Enter a new name for your board
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Board name"
                value={editBoardName}
                onChange={(e) => setEditBoardName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateBoardName();
                  }
                }}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateBoardName}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Board Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Board?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the board
                "{boardToDelete?.name}" and all of its content.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteBoard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
