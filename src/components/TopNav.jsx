"use client";

import { memo, useState, useRef, useEffect } from "react";
import { Save, Plus, LogOut, Download, Trash2, User, Settings, FileText, Upload, Link, UserPlus, Calendar as CalendarIcon, Loader, Loader2, Check, Type, Share2, ArrowLeft, Home, Cloud, CloudOff, CheckCircle2, Sun, Moon, Zap, Image as ImageIcon, List, MapPin, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import UpgradeDialog from "./UpgradeDialog";

const cardTypes = [
  { type: 'titleCard', name: 'Title Card', description: 'Large heading text', icon: Type, bgColor: 'bg-emerald-500/20 dark:bg-emerald-500/10', hoverColor: 'group-hover:bg-emerald-500/30 dark:group-hover:bg-emerald-500/20', iconColor: 'text-emerald-600 dark:text-emerald-500' },
  { type: 'storyCard', name: 'Story Card', description: 'Story element', icon: Plus, bgColor: 'bg-primary/20 dark:bg-primary/10', hoverColor: 'group-hover:bg-primary/30 dark:group-hover:bg-primary/20', iconColor: 'text-primary' },
  { type: 'linkCard', name: 'Link Card', description: 'Resource link', icon: Link, bgColor: 'bg-blue-500/20 dark:bg-blue-500/10', hoverColor: 'group-hover:bg-blue-500/30 dark:group-hover:bg-blue-500/20', iconColor: 'text-blue-600 dark:text-blue-500' },
  { type: 'characterCard', name: 'Character Card', description: 'Name & synopsis', icon: UserPlus, bgColor: 'bg-primary/20 dark:bg-primary/10', hoverColor: 'group-hover:bg-primary/30 dark:group-hover:bg-primary/20', iconColor: 'text-primary' },
  { type: 'timelineCard', name: 'Timeline Card', description: 'Date marker', icon: CalendarIcon, bgColor: 'bg-purple-500/20 dark:bg-purple-500/10', hoverColor: 'group-hover:bg-purple-500/30 dark:group-hover:bg-purple-500/20', iconColor: 'text-purple-600 dark:text-purple-500' },
  { type: 'locationCard', name: 'Location Card', description: 'Place/Address', icon: MapPin, bgColor: 'bg-rose-500/20 dark:bg-rose-500/10', hoverColor: 'group-hover:bg-rose-500/30 dark:group-hover:bg-rose-500/20', iconColor: 'text-rose-600 dark:text-rose-500' },
  { type: 'imageCard', name: 'Image Card', description: 'Image preview', icon: ImageIcon, bgColor: 'bg-muted/50', hoverColor: 'group-hover:bg-muted', iconColor: 'text-muted-foreground' },
  { type: 'listCard', name: 'List Card', description: 'Checklist items', icon: List, bgColor: 'bg-primary/20 dark:bg-primary/10', hoverColor: 'group-hover:bg-primary/30 dark:group-hover:bg-primary/20', iconColor: 'text-primary' },
  { type: 'numberCard', name: 'Number Card', description: 'Numeric value', bgColor: 'bg-green-500/20 dark:bg-green-500/10', hoverColor: 'group-hover:bg-green-500/30 dark:group-hover:bg-green-500/20', iconColor: 'text-green-700 dark:text-green-400' },
  { type: 'codeCard', name: 'Code Card', description: 'JavaScript code', bgColor: 'bg-slate-500/20 dark:bg-slate-500/10', hoverColor: 'group-hover:bg-slate-500/30 dark:group-hover:bg-slate-500/20', iconColor: 'text-slate-700 dark:text-slate-400' },
];

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
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [editingBoardName, setEditingBoardName] = useState(false);
  const [tempBoardName, setTempBoardName] = useState(boardName || '');
  const [cardSearch, setCardSearch] = useState('');
  const nameMeasureRef = useRef(null);
  const [nameWidth, setNameWidth] = useState(0);

  // Filter cards based on search
  const filteredCards = cardTypes.filter(card => 
    card.name.toLowerCase().includes(cardSearch.toLowerCase()) ||
    card.description.toLowerCase().includes(cardSearch.toLowerCase())
  );

  // Update tempBoardName when boardName prop changes
  useEffect(() => {
    setTempBoardName(boardName || '');
  }, [boardName]);

  // Measure board name width to size the input exactly to the text
  useEffect(() => {
    if (nameMeasureRef.current) {
      const width = nameMeasureRef.current.offsetWidth || 0;
      setNameWidth(width);
    }
  }, [tempBoardName, editingBoardName, boardName]);

  const handleBoardNameSubmit = () => {
    const trimmed = tempBoardName.trim();
    const current = (boardName || '').trim();
    if (trimmed && onBoardNameChange && trimmed !== current) {
      onBoardNameChange(trimmed);
    }
    setEditingBoardName(false);
  };

  return (
    <div className="w-full fixed top-0 z-50 pointer-events-none">
      <div className="w-full pt-4">
        {/* First Row: Logo, Back Button, Board Name, Right Actions */}
        <div className="h-20 flex items-center justify-between px-6">
          <div className="ps-10 flex items-center gap-2.5 pointer-events-auto">
            <img
              src="/log.png"
              alt="fable"
              className="h-10 w-10 object-contain"
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

                <div className="relative">
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
                      style={{ width: nameWidth || undefined }}
                      autoFocus
                    />
                  ) : (
                    <div
                      className={cn(
                        "text-sm font-medium rounded-md",
                        boardPermission === 'owner' && "cursor-pointer hover:bg-accent px-2 py-1"
                      )}
                      onClick={() => boardPermission === 'owner' && setEditingBoardName(true)}
                    >
                      {boardName || 'Untitled Board'}
                      {boardPermission === 'comment-only' && (
                        <span className="ml-2 text-xs text-muted-foreground">(View Only)</span>
                      )}
                    </div>
                  )}
                  {/* invisible measurer to match input width to text width, includes padding */}
                  <span
                    ref={nameMeasureRef}
                    className="invisible absolute top-0 left-0 whitespace-pre px-2 py-1 text-sm font-medium"
                  >
                    {(editingBoardName ? (tempBoardName || 'Untitled Board') : (boardName || 'Untitled Board'))}
                  </span>
                </div>

                {/* Auto-save status next to board name */}
                <div className="ml-3 relative group">
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
                  <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-popover border border-border rounded text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-50">
                    {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'error' ? 'Save failed' : 'All changes saved'}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
          {boardPermission !== 'comment-only' && (
            <Menubar className="border-none shadow-none bg-transparent p-0 h-auto">
              <MenubarMenu>
                <MenubarTrigger asChild>
                  <Button className="gap-1 text-xs" variant="secondary">
                    <Plus className="w-3.5 h-3.5" />
                    New Card
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </MenubarTrigger>
                <MenubarContent align="start" className="w-56">
                  {/* Search Box */}
                  <div className="px-2 py-2 border-b border-border mb-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        type="text"
                        placeholder="Search cards..."
                        value={cardSearch}
                        onChange={(e) => setCardSearch(e.target.value)}
                        className="pl-8 h-8 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  
                  {/* Scrollable Card List */}
                  <div className="max-h-80 overflow-y-auto">
                    {filteredCards.map((card) => {
                      const Icon = card.icon;
                      return (
                        <MenubarItem
                          key={card.type}
                          onClick={() => {
                            onAdd(card.type);
                            setCardSearch('');
                          }}
                          className="gap-2"
                        >
                          <div className={cn('w-6 h-6 rounded-md flex items-center justify-center transition-colors flex-shrink-0', card.bgColor, card.hoverColor)}>
                            {Icon ? (
                              <Icon className={cn('w-3.5 h-3.5', card.iconColor)} />
                            ) : card.type === 'numberCard' ? (
                              <span className={cn('text-xs font-bold', card.iconColor)}>#</span>
                            ) : (
                              <span className={cn('text-xs font-mono font-bold', card.iconColor)}>{'<>'}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{card.name}</div>
                            <div className="text-xs text-muted-foreground">{card.description}</div>
                          </div>
                        </MenubarItem>
                      );
                    })}
                    {filteredCards.length === 0 && (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No cards found
                      </div>
                    )}
                  </div>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
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

              <Menubar className="border-none shadow-none bg-transparent p-0 h-auto">
                <MenubarMenu>
                  <MenubarTrigger className="p-0 hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent">
                    <Avatar className="cursor-pointer transition-all hover:opacity-80 h-8 w-8">
                      <AvatarImage
                        src={user?.photoURL}
                        alt={user?.displayName || user?.email || "User"}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </MenubarTrigger>
                  <MenubarContent align="end" className="w-56">
                    {/* User Info */}
                    <div className="px-2 py-1.5 border-b border-border mb-1">
                      <div className="font-medium text-sm leading-none text-foreground">{user.displayName}</div>
                      <div className="text-xs text-muted-foreground truncate mt-1">{user.email}</div>
                    </div>

                    {/* Workspace Actions */}
                    <MenubarItem
                      onClick={() => onSave()}
                      disabled={boardPermission === 'comment-only'}
                    >
                      <Save className="w-4 h-4" />
                      Save board
                    </MenubarItem>

                    <MenubarItem onClick={() => onDownloadWorkspace()}>
                      <Download className="w-4 h-4" />
                      Export workspace
                    </MenubarItem>

                    <MenubarItem onClick={() => onImportWorkspace()}>
                      <Upload className="w-4 h-4" />
                      Import workspace
                    </MenubarItem>

                    <MenubarItem onClick={() => setShowClearDialog(true)}>
                      <Trash2 className="w-4 h-4" />
                      Clear workspace
                    </MenubarItem>

                    <MenubarSeparator />

                    <MenubarItem disabled>
                      <Settings className="w-4 h-4" />
                      Settings
                    </MenubarItem>

                    <MenubarItem disabled>
                      <FileText className="w-4 h-4" />
                      Export to PDF
                    </MenubarItem>

                    <MenubarItem disabled>
                      <User className="w-4 h-4" />
                      Account
                    </MenubarItem>

                    <MenubarItem onClick={() => toggleTheme()}>
                      {theme === 'dark' ? (
                        <>
                          <Sun className="w-4 h-4" />
                          Light mode
                        </>
                      ) : (
                        <>
                          <Moon className="w-4 h-4" />
                          Dark mode
                        </>
                      )}
                    </MenubarItem>

                    <MenubarSeparator />

                    <MenubarItem variant="destructive" onClick={() => logout()}>
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>

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

              <UpgradeDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog} />
            </>
          ) : (
            <Button
              onClick={() => router.push('/login')}
              variant="default"
              className="gap-1 text-xs"
            >
              <User className="w-3.5 h-3.5" />
              Login
            </Button>
          )}
          </div>
        </div>

        {/* Second Row: Menubar */}
        {showBoardControls && (
          <div className="h-8 -mt-5 flex items-center pointer-events-auto px-6">
            <div className="ps-10 flex items-center gap-2.5">
              {/* Fixed spacers to align exactly with first row */}
              <div className="w-[40px]" />
              <div className="w-[17px]" />
              <div className="w-[36px]" />
              {boardPermission === 'owner' && <div className="w-2" />}
              
              <Menubar className="border-none shadow-none bg-transparent p-0 h-8 -ml-4">
              <MenubarMenu>
                <MenubarTrigger className="text-sm py-1">File</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>
                    New Board <MenubarShortcut>⌘N</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>
                    Open <MenubarShortcut>⌘O</MenubarShortcut>
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>
                    Save <MenubarShortcut>⌘S</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>
                    Save as...
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>
                    Export <MenubarShortcut>⌘E</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>
                    Import
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>
                    Share <MenubarShortcut>⌘⇧S</MenubarShortcut>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              
              <MenubarMenu>
                <MenubarTrigger className="text-sm py-1">Edit</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>
                    Undo <MenubarShortcut>⌘Z</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>
                    Redo <MenubarShortcut>⌘⇧Z</MenubarShortcut>
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>
                    Cut <MenubarShortcut>⌘X</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>
                    Copy <MenubarShortcut>⌘C</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>
                    Paste <MenubarShortcut>⌘V</MenubarShortcut>
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>
                    Select All <MenubarShortcut>⌘A</MenubarShortcut>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              
              <MenubarMenu>
                <MenubarTrigger className="text-sm py-1">View</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>
                    Zoom In <MenubarShortcut>⌘+</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>
                    Zoom Out <MenubarShortcut>⌘-</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>
                    Reset Zoom <MenubarShortcut>⌘0</MenubarShortcut>
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>
                    Fit to Screen
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>
                    Toggle Dark Mode <MenubarShortcut>⌘D</MenubarShortcut>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              
              <MenubarMenu>
                <MenubarTrigger className="text-sm py-1">Help</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>
                    Documentation
                  </MenubarItem>
                  <MenubarItem>
                    Keyboard Shortcuts <MenubarShortcut>⌘/</MenubarShortcut>
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>
                    About
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(TopNav);