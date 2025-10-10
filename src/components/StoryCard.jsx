'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Handle, Position, useReactFlow, useUpdateNodeInternals } from 'reactflow';
import { motion } from 'framer-motion';
import { GripVertical, Trash2, X, MoreVertical, Bot, Zap, RefreshCw, Check, Loader, Send, MessageSquare, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Kbd } from '@/components/ui/kbd';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

// Handle stilleri - varsayılan React Flow konumlandırması
const handleStyle = {
  width: 12,
  height: 12,
  background: '#ff0072',
  border: '2px solid #ffffff',
  borderRadius: '50%',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
};

function StoryCard({ id, data, selected, onAddComment }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text || '');
  const textareaRef = useRef(null);
  const divRef = useRef(null);
  const { getNodes, setEdges } = useReactFlow();
  const [title, setTitle] = useState(data.title || '');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const titleInputRef = useRef(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [bulkTags, setBulkTags] = useState('');
  const bulkInputRef = useRef(null);
  const updateNodeInternals = useUpdateNodeInternals();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatContainerRef = useRef(null);
  const [dailyMessageCount, setDailyMessageCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user } = useAuth();

  // Check if card is read-only (from shared board with comment-only permission)
  const isReadOnly = data.isReadOnly || false;
  const onEditingChange = data.onEditingChange;
  const isFocusPoint = data.isFocusPoint || false;

  useEffect(() => {
    setText(data.text || '');
  }, [data.text]);

  useEffect(() => {
    setTitle(data.title || '');
  }, [data.title]);

  // Notify parent when editing state changes
  useEffect(() => {
    if (onEditingChange) {
      onEditingChange(id, isEditing);
    }
  }, [isEditing, id, onEditingChange]);

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  const { onNodeDataChange } = data;

  const handleTitleSubmit = useCallback(() => {
    if (isReadOnly) return;
    if (typeof onNodeDataChange === 'function') {
      onNodeDataChange(id, { title });
    }
  }, [id, title, onNodeDataChange, isReadOnly]);

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSubmit();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setTitle(data.title || '');
      e.currentTarget.blur();
    }
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const divHeight = divRef.current?.offsetHeight || 0;
      textareaRef.current.style.height = divHeight + 'px';
      textareaRef.current.focus();
      textareaRef.current.select();

      // Then adjust to content
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
      });
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [text, isEditing]);

  const handleTextSubmit = useCallback(() => {
    if (isReadOnly) return;
    setIsEditing(false);
    if (typeof onNodeDataChange === 'function') {
      onNodeDataChange(id, { text });
    }
  }, [id, text, onNodeDataChange, isReadOnly]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    } else if (e.key === 'Escape') {
      setText(data.text);
      setIsEditing(false);
    }
  };

  const handleDelete = useCallback(() => {
    if (typeof data?.onDeleteNode === 'function') {
      data.onDeleteNode(id);
    }
    toast("Card deleted.", { icon: <Trash2 className="w-4 h-4" /> });
  }, [id, data]);

  const duplicateCard = useCallback(() => {
    try {
      const nodes = getNodes?.() || [];
      const original = nodes.find((n) => n.id === id);
      const maxId = nodes
        .map((n) => parseInt(n.id, 10))
        .filter((n) => !Number.isNaN(n))
        .reduce((acc, n) => Math.max(acc, n), 0);
      const newId = (maxId || 0) + 1;
      const newPosition = original?.position
        ? { x: original.position.x + 40, y: original.position.y + 40 }
        : { x: 120, y: 120 };
      const newNode = {
        id: String(newId),
        type: original?.type || 'storyCard',
        position: newPosition,
        data: { ...(original?.data || {}) },
      };
      // Can't use setNodes here, so we'll need a different approach
      // For now, let's just log it. This feature might need a dedicated prop.
      console.log("TODO: Implement duplication via props", newNode);
      toast("Card duplication needs to be refactored.");
    } catch (e) {
      console.warn('Duplicate failed', e);
    }
  }, [getNodes, id]);

  const focusTitle = useCallback(() => {
    setTimeout(() => titleInputRef.current?.focus(), 0);
  }, []);

  const openTagDialog = useCallback(() => {
    setTagDialogOpen(true);
    setTimeout(() => bulkInputRef.current?.focus(), 0);
  }, []);

  // Global kısayollar (yalnızca kart seçiliyken aktif): Alt+E (title), Alt+T (tag), Alt+D (duplicate)
  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (e) => {
      if (e.defaultPrevented) return;
      const target = e.target;
      const isEditable = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      // Alt kombinasyonları tarayıcıyla çakışmaz; input içindeyken tetikleme
      if (!e.altKey) return;
      const key = (e.key || '').toLowerCase();
      if (key === 'e') {
        e.preventDefault();
        focusTitle();
      } else if (key === 't') {
        e.preventDefault();
        openTagDialog();
      } else if (key === 'd') {
        e.preventDefault();
        duplicateCard();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected, focusTitle, openTagDialog, duplicateCard]);

  // Debounced change propagation while typing (ensures patches include latest text/title)
  const textDebounceRef = useRef(null);
  useEffect(() => {
    if (isReadOnly) return;
    if (!isEditing) return;
    if (typeof onNodeDataChange !== 'function') return;
    if (textDebounceRef.current) clearTimeout(textDebounceRef.current);
    textDebounceRef.current = setTimeout(() => {
      try { onNodeDataChange(id, { text }); } catch (_) {}
    }, 300);
    return () => {
      if (textDebounceRef.current) clearTimeout(textDebounceRef.current);
    };
  }, [text, isEditing, isReadOnly, onNodeDataChange, id]);

  const titleDebounceRef = useRef(null);
  useEffect(() => {
    if (isReadOnly) return;
    if (typeof onNodeDataChange !== 'function') return;
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    titleDebounceRef.current = setTimeout(() => {
      try { onNodeDataChange(id, { title }); } catch (_) {}
    }, 300);
    return () => {
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    };
  }, [title, isReadOnly, onNodeDataChange, id]);

  const tags = Array.isArray(data.tags) ? data.tags : [];
  const [tempTags, setTempTags] = useState([]);

  // When dialog opens, initialize tempTags with current tags
  useEffect(() => {
    if (tagDialogOpen) {
      setTempTags([...tags]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagDialogOpen]);

  const addTagToTemp = useCallback(() => {
    const tag = (bulkTags || '').trim();
    if (!tag) return;
    setTempTags((prev) => {
      if (prev.includes(tag)) {
        return prev;
      }
      return [...prev, tag];
    });
    setBulkTags('');
  }, [bulkTags]);

  const removeTagFromTemp = useCallback((tag) => {
    setTempTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const saveTagsFromDialog = useCallback(() => {
    // Use the latest tempTags state
    if (typeof onNodeDataChange === 'function') {
      onNodeDataChange(id, { tags: tempTags });
    }
    setTagDialogOpen(false);
    setBulkTags('');
  }, [id, onNodeDataChange, tempTags]);

  const removeTag = useCallback((value) => {
    if (isReadOnly) return;
    if (typeof onNodeDataChange === 'function') {
      const currentTags = Array.isArray(data.tags) ? data.tags : [];
      onNodeDataChange(id, { tags: currentTags.filter((t) => t !== value) });
    }
  }, [id, onNodeDataChange, data.tags, isReadOnly]);

  const toggleFocusPoint = useCallback(() => {
    if (isReadOnly) return;
    if (typeof onNodeDataChange === 'function') {
      onNodeDataChange(id, { isFocusPoint: !isFocusPoint });
    }
    toast(isFocusPoint ? "Removed from focus" : "Set as focus point", {
      icon: <Star className="w-4 h-4" />
    });
  }, [id, isFocusPoint, onNodeDataChange, isReadOnly]);

  const handleAiGenerate = useCallback(async (userComment = '') => {
    setAiLoading(true);
    setAiPanelOpen(true);
    try {
      const allNodes = getNodes();
      const nodes = allNodes.map(node => ({
        nodeId: parseInt(node.id),
        title: node.data.title || '',
        text: node.data.text || ''
      }));

      const requestBody = {
        nodes,
        currentNode: parseInt(id)
      };

      if (userComment && typeof userComment === 'string' && userComment.trim()) {
        requestBody.userComment = userComment.trim();
      }

      const response = await fetch('https://modern-crashing-finland.mastra.cloud/api/agents/gymAgent/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: JSON.stringify(requestBody)
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // text içindeki JSON'ı parse et
      let suggestion = 'No suggestion received';
      let chatMessage = '';

      if (result.text) {
        try {
          const parsedText = JSON.parse(result.text);
          suggestion = parsedText.suggestion || 'No suggestion received';
          chatMessage = parsedText.chat || '';
        } catch (parseError) {
          console.error('Failed to parse text as JSON:', parseError);
          suggestion = result.text; // Fallback olarak raw text kullan
        }
      }

      setAiSuggestion(suggestion);

      // Chat mesajını ekle
      if (chatMessage) {
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          type: 'bot',
          message: chatMessage,
          suggestion: suggestion && suggestion !== 'No suggestion received' ? suggestion : null,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      setAiSuggestion('Failed to generate suggestion. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }, [id, getNodes]);

  // Update daily message count in localStorage
  const updateDailyMessageCount = useCallback(async () => {
    if (!user) return false;

    try {
      const today = new Date().toISOString().split('T')[0];
      const storageKey = `dailyMessages_${user.uid}_${today}`;

      const currentCount = parseInt(localStorage.getItem(storageKey) || '0', 10);

      if (currentCount >= 30) {
        toast.error("Daily message limit reached (30/30). Try again tomorrow!");
        return false;
      }

      const newCount = currentCount + 1;
      localStorage.setItem(storageKey, newCount.toString());
      setDailyMessageCount(newCount);
      return true;
    } catch (error) {
      console.error('Error updating daily message count:', error);
      toast.error("Failed to update message count. Please try again.");
      return false;
    }
  }, [user]);

  const sendChatMessage = useCallback(async () => {
    if (!chatInput.trim()) return;

    // Check daily message limit
    const canSend = await updateDailyMessageCount();
    if (!canSend) return;

    // Kullanıcı mesajını chat'e ekle
    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: chatInput,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);

    // Input'u temizle
    const messageToSend = chatInput;
    setChatInput('');

    // AI'ya gönder
    await handleAiGenerate(messageToSend);
  }, [chatInput, handleAiGenerate, updateDailyMessageCount]);

  const useAiSuggestion = useCallback((suggestionText) => {
    setText(suggestionText);
    if (typeof onNodeDataChange === 'function') {
      onNodeDataChange(id, { text: suggestionText });
    }
    toast("AI suggestion applied to card.");
  }, [id, onNodeDataChange]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, aiLoading]);

  // Load daily message count from localStorage
  useEffect(() => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const storageKey = `dailyMessages_${user.uid}_${today}`;
      const count = parseInt(localStorage.getItem(storageKey) || '0', 10);
      setDailyMessageCount(count);
    } catch (error) {
      console.error('Error loading daily message count:', error);
    }
  }, [user]);

  return (
    <div className="relative">
      <div
        className={cn(
          "bg-card border-transparent rounded-lg w-80 h-auto node-card relative group",
          "transition-all duration-200",
          selected && "border-primary/40",
          isFocusPoint && "ring-4 ring-yellow-400/60 shadow-[0_0_30px_rgba(250,204,21,0.5)] border-yellow-400/50"
        )}
      >
      {/* Handle'lar - React Flow varsayılan konumlandırması */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={handleStyle}
        isConnectable={true}
      />

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={handleStyle}
        isConnectable={true}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={handleStyle}
        isConnectable={true}
      />

      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={handleStyle}
        isConnectable={true}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-border bg-muted/50 rounded-t-lg">
          <div className="flex items-center gap-2 min-w-0">
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab drag-handle" />
            <input
              type="text"
              value={title}
              onChange={(e) => !isReadOnly && setTitle(e.target.value.slice(0, 100))}
              onBlur={handleTitleSubmit}
              onKeyDown={handleTitleKeyDown}
              maxLength={100}
              placeholder="Title"
              className={cn(
                "bg-transparent text-sm outline-none placeholder:text-muted-foreground px-2 py-1 rounded-md transition-colors max-w-[200px] truncate",
                !isReadOnly && "hover:bg-foreground/5 focus:bg-foreground/5"
              )}
              title={title}
              ref={titleInputRef}
              readOnly={isReadOnly}
            />
          </div>
          <div className="flex items-center">
            {!isReadOnly && (
              <button
                onClick={handleAiGenerate}
                disabled={aiLoading}
                className="px-1 py-1.5 rounded-md hover:bg-foreground/10 transition-colors disabled:opacity-50"
                title="AI Suggestion"
              >
                <Zap className="w-4 h-4 text-purple-500" />
              </button>
            )}
            
            {/* Dropdown - always show, but with different options based on permissions */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="px-1 py-1.5 rounded-md hover:bg-foreground/10 transition-colors"
                title="Actions"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2">
                  {!isReadOnly && (
                    <div className="py-1 px-1">
                      <button
                        className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground flex items-center justify-between transition-colors rounded-sm"
                        onClick={() => {
                          focusTitle();
                          setIsDropdownOpen(false);
                        }}
                      >
                        Edit title
                        <Kbd>Alt+E</Kbd>
                      </button>
                      <button
                        className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground flex items-center justify-between transition-colors rounded-sm"
                        onClick={() => {
                          openTagDialog();
                          setIsDropdownOpen(false);
                        }}
                      >
                        Add tag
                        <Kbd>Alt+T</Kbd>
                      </button>
                    </div>
                  )}
                  
                  {/* Focus point button */}
                  {!isReadOnly && (
                    <div className="py-1 px-1 border-t border-border">
                      <button
                        className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm"
                        onClick={() => {
                          toggleFocusPoint();
                          setIsDropdownOpen(false);
                        }}
                      >
                        <Star className={cn("w-4 h-4", isFocusPoint && "fill-yellow-500 text-yellow-500")} />
                        {isFocusPoint ? "Remove focus" : "Set as focus"}
                      </button>
                    </div>
                  )}

                  {/* Add comment button - show for everyone if onAddComment exists */}
                  {onAddComment && (
                    <div className={cn("py-1 px-1", !isReadOnly && "border-t border-border")}>
                      <button
                        className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm"
                        onClick={() => {
                          onAddComment(id);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <MessageSquare className="w-4 h-4" />
                        Add comment
                      </button>
                    </div>
                  )}

                  {!isReadOnly && (
                    <div className="border-t border-border py-1 px-1">
                      <button
                        className="w-full px-2 py-1.5 text-sm text-left hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 transition-colors rounded-sm"
                        onClick={() => {
                          setConfirmOpen(true);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete card
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isReadOnly && (
              <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This card will be permanently deleted and all of its connections and data will be removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-3 pt-3">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleTextSubmit}
              onKeyDown={handleKeyDown}
              onWheel={(e) => { e.stopPropagation(); }}
              onWheelCapture={(e) => { e.stopPropagation(); }}
              onTouchMoveCapture={(e) => { e.stopPropagation(); }}
              className="w-full bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground overflow-auto mb-3 nodrag"
              placeholder="Enter story element..."
              style={{
                lineHeight: '1.5',
                padding: 0,
                margin: 0,
                border: 'none',
                boxSizing: 'border-box',
                minHeight: '80px',
                fontSize: '0.875rem'
              }}
            />
          ) : (
            <div
              ref={divRef}
              className={cn(
                "text-sm whitespace-pre-wrap break-words text-foreground mb-3",
                !isReadOnly && "cursor-text"
              )}
              onClick={() => !isReadOnly && setIsEditing(true)}
              onWheel={(e) => { e.stopPropagation(); }}
              onWheelCapture={(e) => { e.stopPropagation(); }}
              onTouchMoveCapture={(e) => { e.stopPropagation(); }}
              style={{
                lineHeight: '1.5',
                padding: 0,
                margin: 0,
                boxSizing: 'border-box',
                minHeight: '80px',
                fontSize: '0.875rem'
              }}
            >
              {data.text || 'Click to edit...'}
            </div>
          )}

          {/* Tags: only render if exists */}
          {tags.length > 0 && (
            <div className="mt-4 pb-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-2 w-full">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="pr-1.5 break-words text-xs bg-white/50 dark:bg-white/10">
                    {tag}
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 inline-flex items-center justify-center rounded-sm hover:bg-foreground/10"
                        aria-label={`Remove ${tag}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Tag Dialog */}
        <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
          <DialogContent className="sm:max-w-[400px] p-4">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-base">Add tags</DialogTitle>
              <DialogDescription className="text-xs">Press Enter to add each tag</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <input
                ref={bulkInputRef}
                value={bulkTags}
                onChange={(e) => setBulkTags(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTagToTemp();
                  }
                }}
                placeholder="Type a tag and press Enter"
                className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {tempTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {tempTags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="pr-1.5 text-xs bg-white/50 dark:bg-white/10">
                      {tag}
                      <button
                        onClick={() => removeTagFromTemp(tag)}
                        className="ml-1 inline-flex items-center justify-center rounded-sm hover:bg-foreground/10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter className="pt-2">
              <Button variant="secondary" onClick={() => setTagDialogOpen(false)} className="text-xs h-8">Cancel</Button>
              <Button onClick={saveTagsFromDialog} className="text-xs h-8">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Visual feedback removed to avoid perceived extra space */}
      </motion.div>
      </div>

      {/* AI Suggestion Panel - Kartın yanında */}
      {aiPanelOpen && (
        <div className="absolute left-full top-0 ml-4 w-[480px] bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-500" />
                <h3 className="text-sm font-semibold">fablebot</h3>
                <span className="text-xs text-muted-foreground">({dailyMessageCount}/30)</span>
              </div>
              <button
                onClick={() => setAiPanelOpen(false)}
                className="p-1 hover:bg-foreground/10 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {/* Chat Messages */}
              <div
                ref={chatContainerRef}
                className="h-64 overflow-y-auto space-y-2 p-2 bg-muted/20 rounded-lg overscroll-contain"
                onWheel={(e) => { e.stopPropagation(); }}
                onWheelCapture={(e) => { e.stopPropagation(); }}
                onTouchMoveCapture={(e) => { e.stopPropagation(); }}
              >
                {chatMessages.length === 0 && !aiLoading && (
                  <div className="text-xs text-muted-foreground text-center py-6">
                    No messages yet. Click the generate button to start.
                  </div>
                )}

                {chatMessages.map((msg) => (
                  <div key={msg.id}>
                    <div className={`flex gap-2 ${msg.type === 'user' ? 'justify-end' : ''}`}>
                      <div className={`text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.type === 'user'
                          ? 'bg-purple-500 text-white px-2 py-1 rounded-lg max-w-[80%]'
                          : ''
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                    {msg.suggestion && (
                      <div className="mt-2">
                        <div className="bg-white/20 rounded-md p-2">
                          <div className="text-xs leading-relaxed whitespace-pre-wrap mb-2">
                            {msg.suggestion}
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() => useAiSuggestion(msg.suggestion)}
                              className="px-2 py-1 bg-white text-black rounded text-xs hover:bg-gray-100 transition-colors flex items-center gap-1"
                              title="Use This Suggestion"
                            >
                              <Check className="w-2.5 h-2.5" />
                              Use
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {aiLoading && (
                  <div className="flex gap-2">
                    <Loader className="w-3 h-3 animate-spin text-white mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-muted-foreground">Loading</div>
                  </div>
                )}
              </div>


              {/* Chat Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-2 py-1.5 text-xs bg-muted/50 border border-border rounded-lg outline-none focus:border-purple-500 transition-colors"
                  disabled={aiLoading}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || aiLoading}
                  className="px-2 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Send Message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(StoryCard);