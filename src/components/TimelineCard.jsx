'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Handle, Position, useReactFlow, useUpdateNodeInternals } from 'reactflow';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Check, X, Trash2, MoreVertical, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const handleStyle = {
  width: 12,
  height: 12,
  background: '#a855f7',
  border: '2px solid #ffffff',
  borderRadius: '50%',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
};

function TimelineCard({ id, data, selected }) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const popoverRef = useRef(null);
  const dropdownRef = useRef(null);
  const { setNodes, setEdges, getNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  const isReadOnly = data.isReadOnly || false;

  useEffect(() => { updateNodeInternals(id); }, [id, updateNodeInternals]);

  // Popover açarken z-index'i ayarla
  const openPopover = useCallback(() => {
    if (isReadOnly) return;
    setNodes((nds) => nds.map((node) => 
      node.id === id ? { ...node, zIndex: 1000 } : node
    ));
    setIsPopoverOpen(true);
  }, [id, setNodes, isReadOnly]);

  // Popover kapatırken z-index'i sıfırla
  const closePopover = useCallback(() => {
    setNodes((nds) => nds.map((node) => 
      node.id === id ? { ...node, zIndex: undefined } : node
    ));
    setIsPopoverOpen(false);
  }, [id, setNodes]);

  // Dropdown açarken z-index'i ayarla
  const toggleDropdown = useCallback(() => {
    const willOpen = !isDropdownOpen;
    setNodes((nds) => nds.map((node) => 
      node.id === id ? { ...node, zIndex: willOpen ? 1000 : undefined } : node
    ));
    setIsDropdownOpen(willOpen);
  }, [id, setNodes, isDropdownOpen]);

  // Dropdown kapatırken z-index'i sıfırla
  const closeDropdown = useCallback(() => {
    setNodes((nds) => nds.map((node) => 
      node.id === id ? { ...node, zIndex: undefined } : node
    ));
    setIsDropdownOpen(false);
  }, [id, setNodes]);

  const handleDateSelect = useCallback((date) => {
    if (isReadOnly) return;
    // Immediately save and close when date is selected
    setNodes((nds) => nds.map((node) => node.id === id ? { ...node, data: { ...node.data, date: date ? date.toISOString() : '' }, zIndex: undefined } : node));
    setIsPopoverOpen(false);
    // Persist via planner callback
    if (typeof (data && data.onNodeDataChange) === 'function') {
      data.onNodeDataChange(id, { date: date ? date.toISOString() : '' });
    }
  }, [id, setNodes, isReadOnly]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        // Don't save on outside click, just close
        closePopover();
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    }
    if (isPopoverOpen || isDropdownOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isPopoverOpen, isDropdownOpen, closePopover, closeDropdown]);

  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    toast('Timeline card deleted.', { icon: <Trash2 className="w-4 h-4" /> });
    if (typeof (data && data.onDeleteNode) === 'function') {
      data.onDeleteNode(id);
    }
  }, [id, setNodes, setEdges]);

  const duplicateCard = useCallback(() => {
    try {
      const nodes = getNodes();
      const original = nodes.find((n) => n.id === id);
      if (!original) {
        console.error('Original node not found:', id);
        return;
      }

      const newNode = {
        id: uuidv4(),
        type: 'timelineCard',
        position: {
          x: original.position.x + 40,
          y: original.position.y + 40
        },
        data: {
          date: data.date || '',
          onNodeDataChange: data.onNodeDataChange,
          onDeleteNode: data.onDeleteNode
        },
      };
      setNodes((nds) => [...nds, newNode]);
      toast('Timeline card duplicated.');
      console.log('Duplicated timeline card:', newNode.id);
    } catch (e) {
      console.error('Duplicate failed:', e);
    }
  }, [getNodes, id, setNodes, data.date, data.onNodeDataChange, data.onDeleteNode]);

  const currentDate = data.date ? new Date(data.date) : null;
  const display = currentDate ? currentDate.toLocaleDateString() : 'Pick a date';

  return (
    <div className="relative">
      <div
        className={cn(
          "bg-gradient-to-r from-purple-200 to-purple-300 dark:from-purple-950/50 dark:to-purple-900/50 border-2 border-purple-400 dark:border-purple-800 rounded-lg w-72 h-12 node-card relative group",
          "transition-all duration-200",
          selected && "border-purple-400",
          !isReadOnly && "cursor-pointer"
        )}
        onClick={() => !isReadOnly && openPopover()}
      >
        {/* Only side handles */}
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

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="h-full flex items-center px-3 gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <GripVertical className="w-3 h-3 text-purple-600 dark:text-white cursor-grab drag-handle" />
            <CalendarIcon className="w-4 h-4 text-purple-600 dark:text-white" />
          </div>
          <div className="flex-1 min-w-0 text-sm text-purple-900 dark:text-purple-100 truncate">{display}</div>
          {!isReadOnly && (
            <div className={cn(
              "flex items-center gap-1 flex-shrink-0 transition-opacity",
              isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )} ref={dropdownRef}>
            <button
              onClick={(e) => { e.stopPropagation(); toggleDropdown(); }}
              className="p-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded transition-colors"
              title="More options"
            >
              <MoreVertical className="w-3 h-3 text-purple-600 dark:text-white" />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-popover border border-border rounded-md shadow-lg z-[9999] animate-in fade-in-0 zoom-in-95">
                <div className="py-1 px-1 space-y-0.5">
                  <button
                    className="w-full px-2 py-1.5 text-xs text-left hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 transition-colors rounded-sm"
                    onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); closeDropdown(); }}
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
            <AlertDialogTitle>Delete timeline card?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isPopoverOpen && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-2 w-[320px] bg-popover border border-border rounded-lg shadow-lg z-[9999] animate-in fade-in-0 zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3">
            <Calendar
              mode="single"
              selected={currentDate ?? undefined}
              onSelect={handleDateSelect}
              captionLayout="dropdown-buttons"
              className="bg-transparent p-0"
              classNames={{ root: "w-full" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(TimelineCard);


