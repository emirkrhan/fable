"use client";

import { memo, useState, useRef, useEffect } from "react";
import { Save, Plus, LogOut, Download, Trash2, User, Settings, FileText, Upload, Link, ChevronDown, UserPlus, Calendar as CalendarIcon, Loader, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
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

function TopNav({ onSave, onAdd, onDownloadWorkspace, onImportWorkspace, onClearWorkspace, saveStatus }) {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCardDropdownOpen, setIsCardDropdownOpen] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const dropdownRef = useRef(null);
  const cardDropdownRef = useRef(null);

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

  return (
    <div className="w-full fixed top-0 z-50 pointer-events-none">
      <div className="w-full px-6 h-24 flex items-center justify-between">
        <div className="ps-10 flex items-center gap-2.5 pointer-events-auto">
          <img src="/log.png" alt="fable" className="h-10" style={{ mixBlendMode: 'multiply' }} />
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
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
                      onAdd('storyCard');
                      setIsCardDropdownOpen(false);
                    }}
                  >
                    <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
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
                    <div className="w-6 h-6 bg-blue-500/10 rounded-md flex items-center justify-center group-hover:bg-blue-500/20 transition-colors flex-shrink-0">
                      <Link className="w-3.5 h-3.5 text-blue-500" />
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
                    <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
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
                    <div className="w-6 h-6 bg-purple-500/10 rounded-md flex items-center justify-center group-hover:bg-purple-500/20 transition-colors flex-shrink-0">
                      <CalendarIcon className="w-3.5 h-3.5 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">Timeline Card</div>
                      <div className="text-[11px] text-muted-foreground">Date marker</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
          <Button onClick={onSave} variant="secondary" className="gap-1 text-xs" disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? (
              <>
                <Loader className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save
              </>
            )}
          </Button>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <Avatar
                className="cursor-pointer transition-all"
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  setIsCardDropdownOpen(false);
                }}
              >
                <AvatarImage
                  src={user.photoURL || "https://github.com/shadcn.png"}
                  alt={user.displayName || "User"}
                />
                <AvatarFallback>
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
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
                  <div className="py-1">
                    <button
                      className="w-full px-2 py-1.5 mx-1 text-xs text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm"
                      onClick={() => {
                        onDownloadWorkspace();
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export workspace
                    </button>

                    <button
                      className="w-full px-2 py-1.5 mx-1 text-xs text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm"
                      onClick={() => {
                        onImportWorkspace();
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Import workspace
                    </button>

                    <button
                      className="w-full px-2 py-1.5 mx-1 text-xs text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm"
                      onClick={() => {
                        setShowClearDialog(true);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear workspace
                    </button>
                  </div>

                  <div className="border-t border-border py-1">
                    {/* Future options placeholder */}
                    <button className="w-full px-2 py-1.5 mx-1 text-xs text-left cursor-not-allowed opacity-50 flex items-center gap-2 rounded-sm" disabled>
                      <Settings className="w-3.5 h-3.5" />
                      Settings
                    </button>

                    <button className="w-full px-2 py-1.5 mx-1 text-xs text-left cursor-not-allowed opacity-50 flex items-center gap-2 rounded-sm" disabled>
                      <FileText className="w-3.5 h-3.5" />
                      Export to PDF
                    </button>

                    <button className="w-full px-2 py-1.5 mx-1 text-xs text-left cursor-not-allowed opacity-50 flex items-center gap-2 rounded-sm" disabled>
                      <User className="w-3.5 h-3.5" />
                      Account
                    </button>
                  </div>

                  <div className="border-t border-border py-1">
                    <button
                      className="w-full px-2 py-1.5 mx-1 text-xs text-left hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 transition-colors rounded-sm"
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
          ) : (
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="Guest" />
              <AvatarFallback>G</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(TopNav);
