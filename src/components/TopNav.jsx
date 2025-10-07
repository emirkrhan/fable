"use client";

import { memo, useState, useRef, useEffect } from "react";
import { Save, Plus, LogOut, Download, Trash2, User, Settings, FileText, Upload, Link, ChevronDown, UserPlus, Calendar as CalendarIcon, Loader, Loader2, Check, Type, Share2, ArrowLeft, Home, Cloud, CloudOff, CheckCircle2, Sun, Moon, Zap, Image as ImageIcon, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import UpgradeDialog from "./UpgradeDialog";

function TopNav({
  onSave,
  onAdd,
  onDownloadWorkspace,
  onImportWorkspace,
  onClearWorkspace,
  saveStatus,
  boardName,
  onBoardNameChange,
  onShareBoard,
  boardPermission,
  showBoardControls = false
}) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCardDropdownOpen, setIsCardDropdownOpen] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const dropdownRef = useRef(null);
  const cardDropdownRef = useRef(null);
  const [editingBoardName, setEditingBoardName] = useState(false);
  const [tempBoardName, setTempBoardName] = useState(boardName || '');

  // Update tempBoardName when boardName prop changes
  useEffect(() => {
    setTempBoardName(boardName || '');
  }, [boardName]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (cardDropdownRef.current && !cardDropdownRef.current.contains(event.target)) {
        setIsCardDropdownOpen(false);
      }
    }
    if (isDropdownOpen || isCardDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen, isCardDropdownOpen]);

  const handleBoardNameSubmit = () => {
    if (tempBoardName.trim() && onBoardNameChange) {
      onBoardNameChange(tempBoardName.trim());
    }
    setEditingBoardName(false);
  };

  return (
    <div className="w-full fixed top-0 z-50 pointer-events-none">
      <div className="w-full px-6 h-24 flex items-center justify-between">
        <div className="ps-10 flex items-center gap-2.5 pointer-events-auto">
          <img
            src="/log.png"
            alt="fable"
            className="h-10"
            style={{ mixBlendMode: theme === 'dark' ? 'lighten' : 'multiply' }}
          />

          {showBoardControls && (
            <>
              <div className="h-6 w-px bg-border mx-2" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/boards'}
                className="px-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>

              {boardPermission === 'owner' && editingBoardName ? (
                <input
                  type="text"
                  value={tempBoardName}
                  onChange={(e) => setTempBoardName(e.target.value)}
                  onBlur={handleBoardNameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleBoardNameSubmit();
                    if (e.key === 'Escape') {
                      setTempBoardName(boardName || '');
                      setEditingBoardName(false);
                    }
                  }}
                  className="px-2 py-1 text-sm font-medium bg-background border border-border rounded-md outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              ) : (
                <div
                  className={cn(
                    "text-sm font-medium px-2 py-1 rounded-md",
                    boardPermission === 'owner' && "cursor-pointer hover:bg-accent"
                  )}
                  onClick={() => boardPermission === 'owner' && setEditingBoardName(true)}
                >
                  {boardName || 'Untitled Board'}
                  {boardPermission === 'comment-only' && (
                    <span className="ml-2 text-xs text-muted-foreground">(View Only)</span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Active users removed */}

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Auto-save status indicator - Google Docs style - Always visible */}
          <div className="relative group">
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : saveStatus === 'error' ? (
                <CloudOff className="w-5 h-5 text-destructive" />
              ) : (
                <div className="relative">
                  <Cloud className="w-5 h-5 text-muted-foreground" strokeWidth={2}/>
                  <Check className="w-2.5 h-2.5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-600" strokeWidth={4} />
                </div>
              )}
            </div>
            {/* Tooltip on hover */}
            <div className="absolute top-full right-0 mt-1 px-2 py-1 bg-popover border border-border rounded text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-50">
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'error' ? 'Save failed' : 'All changes saved'}
            </div>
          </div>

          {boardPermission !== 'comment-only' && (
            <div className="relative" ref={cardDropdownRef}>
              <Button
                onClick={() => {
                  setIsCardDropdownOpen(!isCardDropdownOpen);
                  setIsDropdownOpen(false);
                }}
                className="gap-1 text-xs"
                variant="secondary"
              >
                <Plus className="w-3.5 h-3.5" />
                New Card
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>

            {isCardDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-52 bg-popover border border-border rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95">
                <div className="p-1">
                  <button
                    className="w-full px-2 py-1 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm group"
                    onClick={() => {
                      onAdd('titleCard');
                      setIsCardDropdownOpen(false);
                    }}
                  >
                    <div className="w-6 h-6 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-md flex items-center justify-center group-hover:bg-emerald-500/30 dark:group-hover:bg-emerald-500/20 transition-colors flex-shrink-0">
                      <Type className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">Title Card</div>
                      <div className="text-[11px] text-muted-foreground">Large heading text</div>
                    </div>
                  </button>
                  <button
                    className="w-full px-2 py-1 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm group"
                    onClick={() => {
                      onAdd('storyCard');
                      setIsCardDropdownOpen(false);
                    }}
                  >
                    <div className="w-6 h-6 bg-primary/20 dark:bg-primary/10 rounded-md flex items-center justify-center group-hover:bg-primary/30 dark:group-hover:bg-primary/20 transition-colors flex-shrink-0">
                      <Plus className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">Story Card</div>
                      <div className="text-[11px] text-muted-foreground">Story element</div>
                    </div>
                  </button>
                  <button
                    className="w-full px-2 py-1 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm group"
                    onClick={() => {
                      onAdd('linkCard');
                      setIsCardDropdownOpen(false);
                    }}
                  >
                    <div className="w-6 h-6 bg-blue-500/20 dark:bg-blue-500/10 rounded-md flex items-center justify-center group-hover:bg-blue-500/30 dark:group-hover:bg-blue-500/20 transition-colors flex-shrink-0">
                      <Link className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">Link Card</div>
                      <div className="text-[11px] text-muted-foreground">Resource link</div>
                    </div>
                  </button>
                  <button
                    className="w-full px-2 py-1 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm group"
                    onClick={() => {
                      onAdd('characterCard');
                      setIsCardDropdownOpen(false);
                    }}
                  >
                    <div className="w-6 h-6 bg-primary/20 dark:bg-primary/10 rounded-md flex items-center justify-center group-hover:bg-primary/30 dark:group-hover:bg-primary/20 transition-colors flex-shrink-0">
                      <UserPlus className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">Character Card</div>
                      <div className="text-[11px] text-muted-foreground">Name, image, synopsis</div>
                    </div>
                  </button>
                  <button
                    className="w-full px-2 py-1 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm group"
                    onClick={() => {
                      onAdd('timelineCard');
                      setIsCardDropdownOpen(false);
                    }}
                  >
                    <div className="w-6 h-6 bg-purple-500/20 dark:bg-purple-500/10 rounded-md flex items-center justify-center group-hover:bg-purple-500/30 dark:group-hover:bg-purple-500/20 transition-colors flex-shrink-0">
                      <CalendarIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">Timeline Card</div>
                      <div className="text-[11px] text-muted-foreground">Date marker</div>
                    </div>
                  </button>

                  <button
                    className="w-full px-2 py-1 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm group"
                    onClick={() => {
                      onAdd('locationCard');
                      setIsCardDropdownOpen(false);
                    }}
                  >
                    <div className="w-6 h-6 bg-rose-500/20 dark:bg-rose-500/10 rounded-md flex items-center justify-center group-hover:bg-rose-500/30 dark:group-hover:bg-rose-500/20 transition-colors flex-shrink-0">
                      <CalendarIcon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">Location Card</div>
                      <div className="text-[11px] text-muted-foreground">Place or Address</div>
                    </div>
                  </button>

                  <button
                    className="w-full px-2 py-1 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm group"
                    onClick={() => {
                      onAdd('imageCard');
                      setIsCardDropdownOpen(false);
                    }}
                  >
                    <div className="w-6 h-6 bg-muted/50 rounded-md flex items-center justify-center group-hover:bg-muted transition-colors flex-shrink-0">
                      <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">Image Card</div>
                      <div className="text-[11px] text-muted-foreground">Image preview</div>
                    </div>
                  </button>

                  <button
                    className="w-full px-2 py-1 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm group"
                    onClick={() => {
                      onAdd('listCard');
                      setIsCardDropdownOpen(false);
                    }}
                  >
                    <div className="w-6 h-6 bg-primary/20 dark:bg-primary/10 rounded-md flex items-center justify-center group-hover:bg-primary/30 dark:group-hover:bg-primary/20 transition-colors flex-shrink-0">
                      <List className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">List Card</div>
                      <div className="text-[11px] text-muted-foreground">Checklist items</div>
                    </div>
                  </button>

                  <button
                    className="w-full px-2 py-1 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm group"
                    onClick={() => {
                      onAdd('numberCard');
                      setIsCardDropdownOpen(false);
                    }}
                  >
                    <div className="w-6 h-6 bg-green-500/20 dark:bg-green-500/10 rounded-md flex items-center justify-center group-hover:bg-green-500/30 dark:group-hover:bg-green-500/20 transition-colors flex-shrink-0">
                      <span className="text-green-700 dark:text-green-400 text-xs font-bold">#</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">Number Card</div>
                      <div className="text-[11px] text-muted-foreground">Large numeric value</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
            </div>
          )}

          {showBoardControls && boardPermission === 'owner' && onShareBoard && (
            <Button onClick={onShareBoard} variant="secondary" className="gap-1 text-xs">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </Button>
          )}

          {user ? (
            <>
              <Button
                onClick={() => setShowUpgradeDialog(true)}
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0"
                title="Upgrade to Premium"
              >
                <Zap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" fill="currentColor" />
              </Button>

              <div className="relative" ref={dropdownRef}>
                <Avatar
                  className="cursor-pointer transition-all hover:opacity-80"
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen);
                    setIsCardDropdownOpen(false);
                  }}
                >
                  <AvatarImage
                    src={user?.photoURL}
                    alt={user?.displayName || user?.email || "User"}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2">
                  {/* User Info */}
                  <div className="px-3 py-1.5 border-b border-border">
                    <div className="font-medium text-xs leading-none text-foreground">{user.displayName}</div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">{user.email}</div>
                  </div>

                  {/* Workspace Actions */}
                  <div className="py-1 px-1">
                    <button
                      className="w-full px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        onSave();
                        setIsDropdownOpen(false);
                      }}
                      disabled={boardPermission === 'comment-only'}
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save board
                    </button>

                    <button
                      className="w-full px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm"
                      onClick={() => {
                        onDownloadWorkspace();
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export workspace
                    </button>

                    <button
                      className="w-full px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm"
                      onClick={() => {
                        onImportWorkspace();
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Import workspace
                    </button>

                    <button
                      className="w-full px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm"
                      onClick={() => {
                        setShowClearDialog(true);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear workspace
                    </button>
                  </div>

                  <div className="border-t border-border py-1 px-1">
                    {/* Future options placeholder */}
                    <button className="w-full px-2 py-1.5 text-xs text-left cursor-not-allowed opacity-50 flex items-center gap-2 rounded-sm" disabled>
                      <Settings className="w-3.5 h-3.5" />
                      Settings
                    </button>

                    <button className="w-full px-2 py-1.5 text-xs text-left cursor-not-allowed opacity-50 flex items-center gap-2 rounded-sm" disabled>
                      <FileText className="w-3.5 h-3.5" />
                      Export to PDF
                    </button>

                    <button className="w-full px-2 py-1.5 text-xs text-left cursor-not-allowed opacity-50 flex items-center gap-2 rounded-sm" disabled>
                      <User className="w-3.5 h-3.5" />
                      Account
                    </button>

                    <button
                      className="w-full px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm"
                      onClick={() => {
                        toggleTheme();
                      }}
                    >
                      {theme === 'dark' ? (
                        <>
                          <Sun className="w-3.5 h-3.5" />
                          Light mode
                        </>
                      ) : (
                        <>
                          <Moon className="w-3.5 h-3.5" />
                          Dark mode
                        </>
                      )}
                    </button>
                  </div>

                  <div className="border-t border-border py-1 px-1">
                    <button
                      className="w-full px-2 py-1.5 text-xs text-left hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 transition-colors rounded-sm"
                      onClick={() => {
                        logout();
                        setIsDropdownOpen(false);
                      }}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}

              {/* Clear Workspace Dialog */}
              <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear workspace?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all cards and connections. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onClearWorkspace}>Clear</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              </div>

              <UpgradeDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog} />
            </>
          ) : (
            <Button
              onClick={() => window.location.href = '/login'}
              variant="default"
              className="gap-1 text-xs"
            >
              <User className="w-3.5 h-3.5" />
              Login
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(TopNav);