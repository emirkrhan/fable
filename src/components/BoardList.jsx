'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getUserBoards, createBoard, deleteBoard, updateBoardName } from '@/lib/supabase-boards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Plus, Loader2, Trash2, Edit2, Users, Check, LogOut, FileText, MoreVertical, Settings, User as UserIcon, Sun, Moon, Filter, ArrowUpDown, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';

export default function BoardList() {
  const { user, logout, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
  const [filterType, setFilterType] = useState('all'); // 'all', 'owned', 'shared'
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'name', 'name-desc', 'oldest'
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const filterRef = useRef(null);
  const sortRef = useRef(null);

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }
    console.log('User data:', { photoURL: user.photoURL, displayName: user.displayName, email: user.email });
    loadBoards();
  }, [user, router, authLoading]);

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

  // Close filter/sort dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    }
    if (isFilterOpen || isSortOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isFilterOpen, isSortOpen]);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const { owned, shared } = await getUserBoards();
      // Combine owned and shared boards with ownership flag
      const allBoards = [
        ...owned.map(b => ({ ...b, isOwner: true })),
        ...shared.map(b => ({ ...b, isOwner: false }))
      ];
      setBoards(allBoards);
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
      const newBoard = await createBoard(newBoardName);
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

  // Filter, search and sort boards
  const filteredBoards = boards.filter(board => {
    // Filter by type
    if (filterType === 'owned' && !board.isOwner) return false;
    if (filterType === 'shared' && board.isOwner) return false;

    // Filter by search query
    if (searchQuery && !board.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  const sortedBoards = [...filteredBoards].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'name-desc') {
      return b.name.localeCompare(a.name);
    } else if (sortBy === 'oldest') {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateA - dateB;
    } else { // 'recent'
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB - dateA;
    }
  });

  // Skeleton Loading Component
  const BoardSkeleton = () => (
    <div className="bg-card border border-border rounded-lg shadow-sm p-3">
      <div className="flex items-center gap-2">
        <Skeleton className="w-7 h-7 rounded-md" />
        <div className="flex-1">
          <Skeleton className="h-3.5 w-32 mb-1.5" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
    </div>
  );

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
                <Badge className="text-[10px] h-5 px-2 gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                  <Users className="w-3 h-3" />
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
                  {user?.photoURL && (
                    <AvatarImage
                      src={user.photoURL}
                      alt={user?.displayName || user?.email || "User"}
                      onLoad={() => console.log('Avatar loaded:', user.photoURL)}
                      onError={() => console.log('Avatar failed:', user.photoURL)}
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                {isAvatarDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95">
                    {/* User Info */}
                    <div className="px-3 py-1.5 border-b border-border">
                      <div className="font-medium text-xs leading-none text-foreground">{user.displayName}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">{user.email}</div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1 px-1">
                      <button
                        className="w-full px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm opacity-50 cursor-not-allowed"
                        disabled
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        Account
                      </button>
                      <button
                        className="w-full px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm opacity-50 cursor-not-allowed"
                        disabled
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Settings
                      </button>
                      <button
                        className="w-full px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm"
                        onClick={() => {
                          toggleTheme();
                        }}
                      >
                        {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                      </button>
                    </div>

                    {/* Sign out */}
                    <div className="py-1 px-1 border-t border-border">
                      <button
                        className="w-full px-2 py-1.5 text-xs text-left hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 transition-colors rounded-sm"
                        onClick={() => {
                          logout();
                          setIsAvatarDropdownOpen(false);
                        }}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign out
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
        <div className="flex items-center justify-between mb-6">
          {loading ? (
            <>
              <div>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-28" />
              </div>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Boards</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Create and manage your story boards</p>
              </div>

              <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <div className="relative" ref={filterRef}>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setIsFilterOpen(!isFilterOpen);
                  setIsSortOpen(false);
                }}
              >
                <Filter className="w-4 h-4" />
                {filterType === 'all' ? 'All' : filterType === 'owned' ? 'My Boards' : 'Shared'}
              </Button>
              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95">
                  <div className="py-1 px-1 space-y-0.5">
                    <button
                      className={`w-full px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors rounded-sm ${filterType === 'all' ? 'bg-accent' : ''}`}
                      onClick={() => { setFilterType('all'); setIsFilterOpen(false); }}
                    >
                      All Boards
                    </button>
                    <button
                      className={`w-full px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors rounded-sm ${filterType === 'owned' ? 'bg-accent' : ''}`}
                      onClick={() => { setFilterType('owned'); setIsFilterOpen(false); }}
                    >
                      My Boards
                    </button>
                    <button
                      className={`w-full px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors rounded-sm ${filterType === 'shared' ? 'bg-accent' : ''}`}
                      onClick={() => { setFilterType('shared'); setIsFilterOpen(false); }}
                    >
                      Shared
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sort Button */}
            <div className="relative" ref={sortRef}>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setIsSortOpen(!isSortOpen);
                  setIsFilterOpen(false);
                }}
              >
                <ArrowUpDown className="w-4 h-4" />
                {sortBy === 'recent' ? 'Recent' : sortBy === 'name' ? 'A-Z' : sortBy === 'name-desc' ? 'Z-A' : 'Oldest'}
              </Button>
              {isSortOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95">
                  <div className="py-1 px-1 space-y-0.5">
                    <button
                      className={`w-full px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors rounded-sm ${sortBy === 'recent' ? 'bg-accent' : ''}`}
                      onClick={() => { setSortBy('recent'); setIsSortOpen(false); }}
                    >
                      Most Recent
                    </button>
                    <button
                      className={`w-full px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors rounded-sm ${sortBy === 'name' ? 'bg-accent' : ''}`}
                      onClick={() => { setSortBy('name'); setIsSortOpen(false); }}
                    >
                      Name (A-Z)
                    </button>
                    <button
                      className={`w-full px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors rounded-sm ${sortBy === 'name-desc' ? 'bg-accent' : ''}`}
                      onClick={() => { setSortBy('name-desc'); setIsSortOpen(false); }}
                    >
                      Name (Z-A)
                    </button>
                    <button
                      className={`w-full px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors rounded-sm ${sortBy === 'oldest' ? 'bg-accent' : ''}`}
                      onClick={() => { setSortBy('oldest'); setIsSortOpen(false); }}
                    >
                      Oldest First
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2" size="sm">
              <Plus className="w-4 h-4" />
              New Board
            </Button>
              </div>
            </>
          )}
        </div>

        {/* Boards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <BoardSkeleton key={i} />
            ))}
          </div>
        ) : boards.length === 0 ? (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText className="size-6" />
              </EmptyMedia>
              <EmptyTitle>No boards yet</EmptyTitle>
              <EmptyDescription>
                Create your first board to start planning your story
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Board
              </Button>
            </EmptyContent>
          </Empty>
        ) : sortedBoards.length === 0 ? (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Filter className="size-6" />
              </EmptyMedia>
              <EmptyTitle>No boards found</EmptyTitle>
              <EmptyDescription>
                No boards match the selected filter. Try changing your filter settings.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {sortedBoards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
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
