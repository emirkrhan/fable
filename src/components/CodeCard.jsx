'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';
import { GripVertical, MoreVertical, Trash2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const handleStyle = {
  width: 12,
  height: 12,
  background: '#c9c9c9',
  border: '2px solid #ffffff',
  borderRadius: '50%',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
};

function CodeCard({ id, data, selected }) {
  const updateNodeInternals = useUpdateNodeInternals();
  const [code, setCode] = useState(data.code || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dropdownRef = useRef(null);
  const textareaRef = useRef(null);

  const isReadOnly = data.isReadOnly || false;
  const isFocusPoint = data.isFocusPoint || false;

  useEffect(() => {
    setCode(data.code || '');
  }, [data.code]);

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals]);

  const onBlurSave = useCallback(() => {
    if (isReadOnly) return;
    if (typeof data?.onNodeDataChange === 'function') {
      data.onNodeDataChange(id, { code });
    }
  }, [id, code, isReadOnly, data]);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((p) => !p);
  }, []);

  const handleDelete = useCallback(() => {
    if (typeof data?.onDeleteNode === 'function') {
      data.onDeleteNode(id);
    }
  }, [id, data]);

  const toggleFocusPoint = useCallback(() => {
    if (isReadOnly) return;
    if (typeof data?.onNodeDataChange === 'function') {
      data.onNodeDataChange(id, { isFocusPoint: !isFocusPoint });
    }
    toast(isFocusPoint ? "Removed from focus" : "Set as focus point", {
      icon: <Star className="w-4 h-4" />
    });
  }, [id, isFocusPoint, isReadOnly, data]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
      }, 0);
    }
  }, [code]);

  return (
    <div className="relative">
      <div
        className={cn(
          'bg-card border-transparent rounded-md w-80 min-h-48 node-card relative group',
          'transition-all duration-200',
          selected && 'border-primary/40',
          !isReadOnly && 'cursor-pointer',
          isFocusPoint && "ring-4 ring-yellow-400/60 shadow-[0_0_30px_rgba(250,204,21,0.5)] border-yellow-400/50"
        )}
      >
        {/* Handles */}
        <Handle type="source" position={Position.Right} id="right" style={{ ...handleStyle, right: -6 }} isConnectable={true} />
        <Handle type="source" position={Position.Left} id="left" style={{ ...handleStyle, left: -6 }} isConnectable={true} />
        <Handle type="source" position={Position.Top} id="top" style={{ ...handleStyle, top: -6 }} isConnectable={true} />
        <Handle type="source" position={Position.Bottom} id="bottom" style={{ ...handleStyle, bottom: -6 }} isConnectable={true} />

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-slate-500/5 dark:bg-slate-500/10 rounded-t-md">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab drag-handle" />
            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-400">{'<>'} JavaScript</span>
          </div>
          {!isReadOnly && (
            <div className={cn('relative', isDropdownOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')} ref={dropdownRef}>
              <button
                onClick={(e) => { e.stopPropagation(); toggleDropdown(); }}
                className="p-1 hover:bg-accent rounded transition-colors"
                title="More options"
              >
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-md shadow-lg z-[9999] animate-in fade-in-0 zoom-in-95">
                  <div className="py-1 px-1">
                    <button
                      className="w-full px-2 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors rounded-sm"
                      onClick={(e) => { e.stopPropagation(); toggleFocusPoint(); setIsDropdownOpen(false); }}
                    >
                      <Star className={cn("w-3 h-3", isFocusPoint && "fill-yellow-500 text-yellow-500")} />
                      {isFocusPoint ? "Remove focus" : "Set as focus"}
                    </button>
                  </div>
                  <div className="py-1 px-1 border-t border-border">
                    <button
                      className="w-full px-2 py-1.5 text-xs text-left hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 transition-colors rounded-sm"
                      onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); setIsDropdownOpen(false); }}
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Code Editor */}
        <div className="p-3">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onBlur={onBlurSave}
            onKeyDown={handleKeyDown}
            placeholder="// Write your JavaScript code here..."
            disabled={isReadOnly}
            className={cn(
              'w-full min-h-32 resize-y bg-transparent outline-none border-none',
              'font-mono text-xs leading-relaxed',
              'text-foreground placeholder:text-muted-foreground',
              'scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent'
            )}
            spellCheck="false"
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete code card?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This code card will be permanently deleted and all of its connections will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default memo(CodeCard);

