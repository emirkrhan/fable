'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Handle, Position, useReactFlow, useUpdateNodeInternals } from 'reactflow';
import { motion } from 'framer-motion';
import { GripVertical, Trash2, MoreVertical, Plus, MessageSquare, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

// Handle stilleri - Story Card ile aynı
const handleStyle = {
  width: 12,
  height: 12,
  background: '#ff0072',
  border: '2px solid #ffffff',
  borderRadius: '50%',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
};

function ListCard({ id, data, selected, onAddComment }) {
  const [items, setItems] = useState(data.items || []);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const { setEdges } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  const isReadOnly = data.isReadOnly || false;
  const isFocusPoint = data.isFocusPoint || false;

  useEffect(() => {
    setItems(data.items || []);
  }, [data.items]);

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

  const toggleItem = useCallback((itemId) => {
    if (isReadOnly) return;
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    setItems(updatedItems);
    // Update nodes directly - this triggers auto-save
    if (typeof data.onNodeDataChange === 'function') {
      data.onNodeDataChange(id, { items: updatedItems });
    }
  }, [id, items, isReadOnly, data]);

  const addItem = useCallback(() => {
    if (isReadOnly) return;
    const newItem = {
      id: `item-${Date.now()}`,
      text: 'New item',
      checked: false
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    // Update nodes directly - this triggers auto-save
    if (typeof data.onNodeDataChange === 'function') {
      data.onNodeDataChange(id, { items: updatedItems });
    }
  }, [id, items, isReadOnly, data]);

  const deleteItem = useCallback((itemId) => {
    if (isReadOnly) return;
    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);
    // Update nodes directly - this triggers auto-save
    if (typeof data.onNodeDataChange === 'function') {
      data.onNodeDataChange(id, { items: updatedItems });
    }
  }, [id, items, isReadOnly, data]);

  const handleDelete = useCallback(() => {
    // Use callback pattern from ReactFlowPlanner
    if (typeof data?.onDeleteNode === 'function') {
      data.onDeleteNode(id);
    }
    toast("List card deleted.", { icon: <Trash2 className="w-4 h-4" /> });
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

  return (
    <div className="relative">
      <div
        className={cn(
          "bg-card border border-border rounded-lg w-80 h-auto node-card relative group",
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
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab drag-handle" />
              <span className="text-sm font-medium text-muted-foreground">Checklist</span>
            </div>
            <div className="flex items-center">
              {/* Dropdown */}
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
                    {/* Focus point button */}
                    {!isReadOnly && (
                      <div className="py-1 px-1">
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
                      <div className={cn("py-1 px-1", onAddComment && "border-t border-border")}>
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
                        This action cannot be undone. This list card will be permanently deleted and all of its connections will be removed.
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

          {/* Content - Todo Items */}
          <div className="px-3 pt-3 pb-2 space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-2 group/item">
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={() => toggleItem(item.id)}
                  disabled={isReadOnly}
                  className="mt-0.5"
                />
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => {
                    if (isReadOnly) return;
                    const updatedItems = items.map(i =>
                      i.id === item.id ? { ...i, text: e.target.value } : i
                    );
                    setItems(updatedItems);
                  }}
                  onBlur={(e) => {
                    if (isReadOnly) return;
                    // Get latest items state and trigger auto-save
                    const updatedItems = items.map(i =>
                      i.id === item.id ? { ...i, text: e.target.value } : i
                    );
                    if (typeof data.onNodeDataChange === 'function') {
                      data.onNodeDataChange(id, { items: updatedItems });
                    }
                  }}
                  placeholder="Type here..."
                  className={cn(
                    "flex-1 text-sm break-words bg-transparent border-none outline-none placeholder:text-muted-foreground/50",
                    item.checked && "line-through text-muted-foreground"
                  )}
                  disabled={isReadOnly}
                />
                {!isReadOnly && (
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                    title="Delete item"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                )}
              </div>
            ))}

            {/* Add New Item Button */}
            {!isReadOnly && (
              <div className="flex justify-center pt-1 mb-1">
                <button
                  onClick={addItem}
                  className="w-full py-2.5 px-1.5 bg-primary/10 rounded-md transition-colors flex items-center justify-center gap-2 text-sm text-primary"
                  title="Add item"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default memo(ListCard);

