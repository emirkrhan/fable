'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Handle, Position, useReactFlow, useUpdateNodeInternals } from 'reactflow';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Check, X, Trash2, MoreVertical, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';

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

  const handleDateSelect = useCallback((date) => {
    if (isReadOnly) return;
    // Immediately save and close when date is selected
    setNodes((nds) => nds.map((node) => node.id === id ? { ...node, data: { ...node.data, date: date ? date.toISOString() : '' } } : node));
    setIsPopoverOpen(false);
  }, [id, setNodes, isReadOnly]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        // Don't save on outside click, just close
        setIsPopoverOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    if (isPopoverOpen || isDropdownOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isPopoverOpen, isDropdownOpen]);

  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    toast('Timeline card deleted.', { icon: <Trash2 className="w-4 h-4" /> });
  }, [id, setNodes, setEdges]);

  const currentDate = data.date ? new Date(data.date) : null;
  const display = currentDate ? currentDate.toLocaleDateString() : 'Pick a date';

  return (
    <div className="relative">
      <div
        className={cn(
          "bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-2 border-purple-200 dark:border-purple-800 rounded-lg w-72 h-12 node-card relative group",
          "transition-all duration-200",
          selected && "border-purple-400",
          !isReadOnly && "cursor-pointer"
        )}
        onClick={() => !isReadOnly && setIsPopoverOpen(true)}
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
            <GripVertical className="w-3 h-3 text-white cursor-grab drag-handle" />
            <CalendarIcon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0 text-sm text-purple-900 dark:text-purple-100 truncate">{display}</div>
          {!isReadOnly && (
            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" ref={dropdownRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }}
              className="p-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded transition-colors"
              title="More options"
            >
              <MoreVertical className="w-3 h-3 text-white" />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-popover border border-border rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95">
                <div className="py-1">
                  <button
                    className="w-full px-2 py-1.5 mx-1 text-xs text-left hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 transition-colors rounded-sm"
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
          className="absolute left-0 top-full mt-2 w-[320px] bg-popover border border-border rounded-lg shadow-lg z-50 animate-in fade-in-0 zoom-in-95"
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


