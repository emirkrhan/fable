'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Handle, Position, useReactFlow, useUpdateNodeInternals } from 'reactflow';
import { motion } from 'framer-motion';
import { GripVertical, Trash2, MoreVertical, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// Handle stilleri - story card ile aynı
const handleStyle = {
  width: 12,
  height: 12,
  background: '#ff0072',
  border: '2px solid #ffffff',
  borderRadius: '50%',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
};

function ImageCard({ id, data, selected }) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempUrl, setTempUrl] = useState(data.url || '');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const popoverRef = useRef(null);
  const dropdownRef = useRef(null);
  const urlInputRef = useRef(null);
  const { setNodes, setEdges, getNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  const isReadOnly = data.isReadOnly || false;

  // Sadece data değiştiğinde temp değerleri güncelle (external update için)
  useEffect(() => {
    if (!isPopoverOpen) {
      setTempUrl(data.url || '');
      setImageError(false);
    }
  }, [data.url, isPopoverOpen]);

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals]);

  const handleSave = useCallback(() => {
    if (isReadOnly) return;
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, url: tempUrl } }
          : node
      )
    );
    setIsEditing(false);
    if (typeof data.onNodeDataChange === 'function') {
      data.onNodeDataChange(id, { url: tempUrl });
    }
  }, [id, tempUrl, setNodes, isReadOnly, data]);

  const onUploadFile = useCallback(async (_file) => {
    // Upload devre dışı: Lütfen URL alanını kullanın
    toast('Upload disabled. Please paste an Image URL.');
  }, []);

  // Popover açarken z-index'i ayarla
  const openPopover = useCallback(() => {
    if (isReadOnly) return;
    setNodes((nds) => nds.map((node) =>
      node.id === id ? { ...node, zIndex: 1000 } : node
    ));
    setIsPopoverOpen(true);
    setIsEditing(true);
  }, [id, setNodes, isReadOnly]);

  // Popover kapatırken z-index'i sıfırla ve değişiklikleri kaydet
  const closePopover = useCallback(() => {
    if (isReadOnly) {
      setIsPopoverOpen(false);
      setIsEditing(false);
      setNodes((nds) => nds.map((node) =>
        node.id === id ? { ...node, zIndex: undefined } : node
      ));
      return;
    }

    setIsPopoverOpen(false);
    setIsEditing(false);

    setTimeout(() => {
      setNodes((nds) => nds.map((node) => {
        if (node.id !== id) return node;

        return {
          ...node,
          data: {
            ...node.data,
            url: tempUrl,
          },
          zIndex: undefined
        };
      }));
    }, 0);
  }, [id, setNodes, isReadOnly, tempUrl]);

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

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        closePopover();
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    }

    if (isPopoverOpen || isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isPopoverOpen, isDropdownOpen, closePopover, closeDropdown]);

  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    toast('Image card deleted.', { icon: <Trash2 className="w-4 h-4" /> });
    if (typeof data.onDeleteNode === 'function') {
      data.onDeleteNode(id);
    }
  }, [id, setNodes, setEdges, data]);

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
        type: 'imageCard',
        position: {
          x: original.position.x + 40,
          y: original.position.y + 40
        },
        data: {
          url: data.url || '',
          onNodeDataChange: data.onNodeDataChange,
          onDeleteNode: data.onDeleteNode
        },
      };
      setNodes((nds) => [...nds, newNode]);
      toast('Image card duplicated.');
      console.log('Duplicated image card:', newNode.id);
    } catch (e) {
      console.error('Duplicate failed:', e);
    }
  }, [getNodes, id, setNodes, data.url, data.onNodeDataChange, data.onDeleteNode]);

  return (
    <div className="relative">
      <div
        className={cn(
          "bg-card border border-border rounded-lg w-64 h-64 node-card relative group",
          "transition-all duration-200",
          selected && "border-primary/40",
          !isReadOnly && "cursor-pointer"
        )}
        onClick={() => { if (!isReadOnly) { openPopover(); } }}
      >
        {/* Four handles */}
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          style={{...handleStyle, top: -6}}
          isConnectable={true}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          style={{...handleStyle, right: -6}}
          isConnectable={true}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          style={{...handleStyle, bottom: -6}}
          isConnectable={true}
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          style={{...handleStyle, left: -6}}
          isConnectable={true}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="h-full flex flex-col"
        >
          {/* Header with icons */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab drag-handle" />
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
            </div>

            {!isReadOnly && (
              <div className={cn(
                "flex items-center gap-1 transition-opacity",
                isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )} ref={dropdownRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown();
                  }}
                  className="px-1 py-1.5 rounded-md hover:bg-foreground/10 transition-colors"
                  title="More options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-popover border border-border rounded-md shadow-lg z-[9999] animate-in fade-in-0 zoom-in-95">
                    <div className="py-1 px-1">
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
          </div>

          {/* Image preview */}
          <div className="flex-1 flex items-center justify-center pt-10 pb-4 px-4 overflow-hidden rounded-lg">
            {data.url && !imageError ? (
              <img
                src={data.url}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="w-12 h-12" />
                <span className="text-xs text-center">
                  {imageError ? 'Failed to load image' : 'Click to add image URL'}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete image card?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Popover */}
      {isPopoverOpen && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-2 w-80 bg-popover border border-border rounded-lg shadow-lg z-[9999] animate-in fade-in-0 zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Image URL</label>
              <input
                ref={urlInputRef}
                type="text"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    closePopover();
                  } else if (e.key === 'Escape') {
                    setTempUrl(data.url || '');
                    closePopover();
                  }
                }}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Or upload</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => { const f = e.target.files?.[0]; if (f && data.boardId) onUploadFile(f); }}
                className="w-full text-xs"
              />
            </div>

            {/* Preview in popover */}
            {tempUrl && (
              <div className="border border-border rounded-md p-2 bg-muted/20">
                <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                <div className="w-full h-32 flex items-center justify-center bg-background rounded">
                  <img
                    src={tempUrl}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                    onError={() => setImageError(true)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ImageCard);
