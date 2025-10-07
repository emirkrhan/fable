'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Handle, Position, useReactFlow, useUpdateNodeInternals } from 'reactflow';
import { motion } from 'framer-motion';
import { GripVertical, Trash2, MoreVertical, ExternalLink, Link as LinkIcon, Edit3, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// Handle stilleri - mavi tema
const handleStyle = {
  width: 12,
  height: 12,
  background: '#3b82f6',
  border: '2px solid #ffffff',
  borderRadius: '50%',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
};

function LinkCard({ id, data, selected }) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempUrl, setTempUrl] = useState(data.url || '');
  const [tempPreview, setTempPreview] = useState(data.preview || '');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const popoverRef = useRef(null);
  const dropdownRef = useRef(null);
  const urlInputRef = useRef(null);
  const { setNodes, setEdges, getNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  const isReadOnly = data.isReadOnly || false;

  // Sadece data değiştiğinde temp değerleri güncelle (external update için)
  useEffect(() => {
    // Eğer popover açık değilse güncelle (kullanıcı düzenlerken üzerine yazma)
    if (!isPopoverOpen) {
      setTempUrl(data.url || '');
      setTempPreview(data.preview || '');
    }
  }, [data.url, data.preview, isPopoverOpen]);

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals]);

  const handleSave = useCallback(() => {
    if (isReadOnly) return;
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, url: tempUrl, preview: tempPreview } }
          : node
      )
    );
    setIsEditing(false);
    if (typeof data.onNodeDataChange === 'function') {
      data.onNodeDataChange(id, { url: tempUrl, preview: tempPreview });
    }
  }, [id, tempUrl, tempPreview, setNodes, isReadOnly]);

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

    // Önce popover state'lerini kapat
    setIsPopoverOpen(false);
    setIsEditing(false);

    // Değişiklikleri kaydet - React batch update sonrası
    setTimeout(() => {
      setNodes((nds) => nds.map((node) => {
        if (node.id !== id) return node;

        return {
          ...node,
          data: {
            ...node.data,
            url: tempUrl,
            preview: tempPreview
          },
          zIndex: undefined
        };
      }));
    }, 0);
  }, [id, setNodes, isReadOnly, tempUrl, tempPreview]);

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

  // Close popover and dropdown when clicking outside
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
      document.addEventListener('mousedown', handleClickOutside, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isPopoverOpen, isDropdownOpen, closePopover, closeDropdown]);


  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    toast("Link card deleted.", { icon: <Trash2 className="w-4 h-4" /> });
    if (typeof data.onDeleteNode === 'function') {
      data.onDeleteNode(id);
    }
  }, [id, setNodes, setEdges]);

  const openLink = () => {
    if (data.url) {
      const url = data.url.startsWith('http') ? data.url : `https://${data.url}`;
      window.open(url, '_blank');
    }
  };

  const getDisplayText = () => {
    if (data.preview && data.preview.trim()) return data.preview;
    if (!data.url) return 'Click to add link';
    return data.url;
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "bg-gradient-to-r from-blue-200 to-blue-300 dark:from-blue-950/50 dark:to-blue-900/50 border-2 border-blue-400 dark:border-blue-800 rounded-lg w-72 h-12 node-card relative group",
          "transition-all duration-200",
          selected && "border-blue-400",
          !isReadOnly && "cursor-pointer"
        )}
        onClick={(e) => {
          if (!isReadOnly && !isPopoverOpen) {
            e.stopPropagation();
            openPopover();
          }
        }}
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="h-full flex items-center px-3 gap-3"
        >
          {/* Icon and drag handle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <GripVertical className="w-3 h-3 text-blue-600 dark:text-white cursor-grab drag-handle" />
            <LinkIcon className="w-4 h-4 text-blue-600 dark:text-white" />
          </div>

          {/* Single line text */}
          <div
            className="flex-1 min-w-0 text-sm text-blue-900 dark:text-blue-100 truncate underline decoration-blue-900 dark:decoration-blue-100 decoration-1 underline-offset-2"
          >
            {getDisplayText()}
          </div>

          {/* Actions - minimal */}
          <div className={cn(
            "flex items-center gap-1 flex-shrink-0 transition-opacity",
            isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            {data.url && (
              <button
                onClick={(e) => { e.stopPropagation(); openLink(); }}
                className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                title="Open Link"
              >
                <ExternalLink className="w-3 h-3 text-blue-600 dark:text-white" />
              </button>
            )}
            {!isReadOnly && (
              <div className="relative" ref={dropdownRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown();
                }}
                className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                title="More options"
              >
                <MoreVertical className="w-3 h-3 text-blue-600 dark:text-white" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-popover border border-border rounded-md shadow-lg z-[9999] animate-in fade-in-0 zoom-in-95">
                  <div className="py-1 px-1">
                    <button
                      className="w-full px-2 py-1.5 text-xs text-left hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 transition-colors rounded-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmOpen(true);
                        closeDropdown();
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
          </div>
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete link card?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This link card will be permanently deleted and all of its connections will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Popover: always show inputs (no read-only preview) */}
      {isPopoverOpen && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-2 w-72 bg-popover border border-border rounded-lg shadow-lg z-[9999] animate-in fade-in-0 zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Preview text</label>
              <input
                type="text"
                value={tempPreview}
                onChange={(e) => setTempPreview(e.target.value)}
                placeholder="ör. şarkı linki"
                className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
              />

              <label className="text-xs font-medium text-muted-foreground mb-1 block">URL</label>
              <input
                ref={urlInputRef}
                type="text"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />

              {/* Bottom Edit button removed */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(LinkCard);