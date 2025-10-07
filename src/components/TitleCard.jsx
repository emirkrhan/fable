'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Handle, Position, useReactFlow, useUpdateNodeInternals } from 'reactflow';
import { motion } from 'framer-motion';
import { Type, Trash2, MoreVertical, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const handleStyle = {
  width: 12,
  height: 12,
  background: '#10b981',
  border: '2px solid #ffffff',
  borderRadius: '50%',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
};

function TitleCard({ id, data, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const { setNodes, setEdges, getNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  const isReadOnly = data.isReadOnly || false;

  useEffect(() => {
    setText(data.text || '');
  }, [data.text]);

  useEffect(() => { 
    updateNodeInternals(id); 
  }, [id, updateNodeInternals]);

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

  const handleSubmit = useCallback(() => {
    if (isReadOnly) return;
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, text } } : node
      )
    );
    setIsEditing(false);
    if (typeof data.onNodeDataChange === 'function') {
      data.onNodeDataChange(id, { text });
    }
  }, [id, text, setNodes, isReadOnly]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setText(data.text || '');
      setIsEditing(false);
    }
  };

  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    toast('Title card deleted.', { icon: <Trash2 className="w-4 h-4" /> });
    if (typeof data.onDeleteNode === 'function') {
      data.onDeleteNode(id);
    }
  }, [id, setNodes, setEdges]);

  const handleCardClick = () => {
    if (isReadOnly || isEditing) return;
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "bg-gradient-to-r from-emerald-50 to-green-100 dark:from-emerald-950/50 dark:to-green-900/50 border-2 border-emerald-200 dark:border-emerald-800 rounded-lg w-80 h-14 node-card relative group",
          "transition-all duration-200",
          selected && "border-emerald-400"
        )}
      >
        {/* Handles */}
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          style={{...handleStyle, right: -6}}
          isConnectable={true}
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          style={{...handleStyle, left: -6}}
          isConnectable={true}
        />
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          style={{...handleStyle, top: -6}}
          isConnectable={true}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          style={{...handleStyle, bottom: -6}}
          isConnectable={true}
        />

        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.15 }} 
          className="h-full flex items-center px-4 gap-3"
          onClick={handleCardClick}
        >
          <div className="flex items-center gap-2 flex-shrink-0">
            <GripVertical className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 cursor-grab drag-handle" />
            <Type className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSubmit}
              className="flex-1 bg-transparent border-none outline-none text-emerald-900 dark:text-emerald-100 text-lg font-medium placeholder-emerald-400"
              placeholder="Enter title..."
              maxLength={100}
              readOnly={isReadOnly}
            />
          ) : (
            <div className={cn(
              "flex-1 min-w-0 text-lg font-medium text-emerald-900 dark:text-emerald-100 truncate",
              !isReadOnly && "cursor-text"
            )}>
              {text || 'Enter title...'}
            </div>
          )}

          {!isReadOnly && (
            <div className={cn(
              "flex items-center gap-1 flex-shrink-0 transition-opacity",
              isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )} ref={dropdownRef}>
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                setIsDropdownOpen(!isDropdownOpen); 
              }}
              className="p-1 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded transition-colors"
              title="More options"
            >
              <MoreVertical className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-popover border border-border rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95">
                <div className="py-1 px-1">
                  <button
                    className="w-full px-2 py-1.5 text-xs text-left hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 transition-colors rounded-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmOpen(true);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            )}
            </div>
          )}
        </motion.div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete title card?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
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

export default memo(TitleCard);

