'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Handle, Position, useReactFlow, useUpdateNodeInternals } from 'reactflow';
import { MapPin, GripVertical, MoreVertical, Trash2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';

// LinkCard tarzı: mavi ton yerine farklı (rose) tonlarla aynı yapı
const handleStyle = {
  width: 12,
  height: 12,
  background: '#f43f5e', // rose-500
  border: '2px solid #ffffff',
  borderRadius: '50%',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
};

function LocationCard({ id, data, selected }) {
  const { setNodes, setEdges } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isReadOnly = data.isReadOnly || false;
  const isFocusPoint = data.isFocusPoint || false;
  const [location, setLocation] = useState(data.location || '');

  useEffect(() => {
    setLocation(data.location || '');
  }, [data.location]);

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals]);

  const onSaveLocation = useCallback(() => {
    if (isReadOnly) return;
    const trimmed = (location || '').trim();

    // Use callback pattern - no setNodes needed
    if (typeof data?.onNodeDataChange === 'function') {
      data.onNodeDataChange(id, { location: trimmed });
    }
  }, [id, location, isReadOnly, data]);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const handleDelete = useCallback(() => {
    // Use callback pattern from ReactFlowPlanner
    if (typeof data?.onDeleteNode === 'function') {
      data.onDeleteNode(id);
    }
    toast('Location card deleted.');
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
    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <div className="relative">
      <div
        className={cn(
          'bg-gradient-to-r from-rose-200 to-rose-300 dark:from-rose-950/50 dark:to-rose-900/50 border-2 border-rose-400 dark:border-rose-800 rounded-lg w-72 h-12 node-card relative group',
          'transition-all duration-200',
          selected && 'border-rose-400',
          !isReadOnly && 'cursor-pointer',
          isFocusPoint && "ring-4 ring-yellow-400/60 shadow-[0_0_30px_rgba(250,204,21,0.5)] border-yellow-400/50"
        )}
        onClick={(e) => {
          if (!isReadOnly) e.stopPropagation();
        }}
      >
        {/* Only side handles (LinkCard gibi) */}
        <Handle type="source" position={Position.Right} id="right" style={{ ...handleStyle, right: -6 }} isConnectable={true} />
        <Handle type="source" position={Position.Left} id="left" style={{ ...handleStyle, left: -6 }} isConnectable={true} />

        <div className="h-full flex items-center px-3 gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <GripVertical className="w-3 h-3 text-rose-700 dark:text-white cursor-grab drag-handle" />
            <MapPin className="w-4 h-4 text-rose-700 dark:text-white" />
          </div>

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onBlur={onSaveLocation}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { onSaveLocation(); e.currentTarget.blur(); }
              if (e.key === 'Escape') { setLocation(data.location || ''); e.currentTarget.blur(); }
            }}
            placeholder="City, Country or Address"
            disabled={isReadOnly}
            className={cn(
              'flex-1 min-w-0 text-sm text-rose-900 dark:text-rose-100 truncate bg-transparent outline-none border-none',
              !location && 'opacity-70',
              isReadOnly && 'cursor-not-allowed'
            )}
          />

          {!isReadOnly && (
            <div className={cn(
              'flex items-center gap-1 flex-shrink-0 transition-opacity',
              isDropdownOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleDropdown(); }}
                  className="p-1 hover:bg-rose-200 dark:hover:bg-rose-800 rounded transition-colors"
                  title="More options"
                >
                  <MoreVertical className="w-3 h-3 text-rose-700 dark:text-white" />
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
            </div>
          )}
        </div>
      </div>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete location card?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This location card will be permanently deleted and all of its connections will be removed.
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

export default memo(LocationCard);


