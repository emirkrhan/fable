'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position, useReactFlow, useUpdateNodeInternals } from 'reactflow';
import { GripVertical, MoreVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';

const handleStyle = {
  width: 12,
  height: 12,
  background: '#c9c9c9', // neutral gray
  border: '2px solid #ffffff',
  borderRadius: '50%',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
};

function NumberCard({ id, data, selected }) {
  const { setNodes, setEdges } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const [value, setValue] = useState(typeof data.value === 'number' ? String(data.value) : (data.value || ''));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isReadOnly = data.isReadOnly || false;

  useEffect(() => {
    setValue(typeof data.value === 'number' ? String(data.value) : (data.value || ''));
  }, [data.value]);

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals]);

  const onBlurSave = useCallback(() => {
    if (isReadOnly) return;
    // Only numeric (integer or decimal), allow empty
    const trimmed = (value || '').trim();
    const numeric = trimmed === '' ? '' : (Number(trimmed));
    if (trimmed !== '' && Number.isNaN(numeric)) {
      // Revert on invalid
      setValue(typeof data.value === 'number' ? String(data.value) : (data.value || ''));
      return;
    }
    setNodes((nds) => nds.map((node) => node.id === id ? { ...node, data: { ...node.data, value: trimmed === '' ? '' : Number(numeric) } } : node));
    if (typeof data.onNodeDataChange === 'function') {
      data.onNodeDataChange(id, { value: trimmed === '' ? '' : Number(numeric) });
    }
  }, [id, value, setNodes, isReadOnly, data]);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((p) => !p);
  }, []);

  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    if (typeof data.onDeleteNode === 'function') data.onDeleteNode(id);
  }, [id, setNodes, setEdges, data]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <div className="relative">
      <div
        className={cn(
          'bg-card border border-border rounded-sm w-24 h-24 node-card relative group',
          'transition-all duration-200',
          selected && 'border-primary/40',
          !isReadOnly && 'cursor-pointer'
        )}
      >
        {/* Side handles */}
        <Handle type="source" position={Position.Right} id="right" style={{ ...handleStyle, right: -6 }} isConnectable={true} />
        <Handle type="source" position={Position.Left} id="left" style={{ ...handleStyle, left: -6 }} isConnectable={true} />
        <Handle type="source" position={Position.Top} id="top" style={{ ...handleStyle, top: -6 }} isConnectable={true} />
        <Handle type="source" position={Position.Bottom} id="bottom" style={{ ...handleStyle, bottom: -6 }} isConnectable={true} />

        <div className="absolute top-2 left-2">
          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab drag-handle" />
        </div>

        <div className="w-full h-full flex items-center justify-center p-0">
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={onBlurSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { onBlurSave(); e.currentTarget.blur(); }
              if (e.key === 'Escape') { setValue(typeof data.value === 'number' ? String(data.value) : (data.value || '')); e.currentTarget.blur(); }
            }}
            placeholder="0"
            disabled={isReadOnly}
            className={cn(
              'w-full text-center text-3xl font-extrabold tracking-tight leading-none bg-transparent outline-none border-none m-0 p-0',
              'text-foreground'
            )}
          />
        </div>

        {!isReadOnly && (
          <div className={cn('absolute top-2 right-2', isDropdownOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')} ref={dropdownRef}>
            <button
              onClick={(e) => { e.stopPropagation(); toggleDropdown(); }}
              className="p-1 hover:bg-accent rounded transition-colors"
              title="More options"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-popover border border-border rounded-md shadow-lg z-[9999] animate-in fade-in-0 zoom-in-95">
                <div className="py-1 px-1">
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete number card?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This number card will be permanently deleted and all of its connections will be removed.
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

export default memo(NumberCard);


