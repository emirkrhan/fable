'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Handle, Position, useReactFlow, useUpdateNodeInternals } from 'reactflow';
import { motion } from 'framer-motion';
import { GripVertical, Trash2, MoreVertical, User, Image as ImageIcon, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const handleStyle = {
  width: 12,
  height: 12,
  background: 'hsl(var(--primary))',
  border: '2px solid #ffffff',
  borderRadius: '50%',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
};

function CharacterCard({ id, data, selected }) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const popoverRef = useRef(null);
  const dropdownRef = useRef(null);
  const firstNameRef = useRef(null);
  const { setNodes, setEdges, getNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  const isReadOnly = data.isReadOnly || false;

  const profileUrl = data.profileUrl || '';
  const firstName = data.firstName || '';
  const lastName = data.lastName || '';
  const synopsis = data.synopsis || '';

  const [tempProfileUrl, setTempProfileUrl] = useState(profileUrl);
  const [tempFirstName, setTempFirstName] = useState(firstName);
  const [tempLastName, setTempLastName] = useState(lastName);
  const [tempSynopsis, setTempSynopsis] = useState(synopsis);

  useEffect(() => { updateNodeInternals(id); }, [id, updateNodeInternals]);

  // Sadece popover kapalıyken external update'leri al
  useEffect(() => {
    if (!isPopoverOpen) {
      setTempProfileUrl(data.profileUrl || '');
      setTempFirstName(data.firstName || '');
      setTempLastName(data.lastName || '');
      setTempSynopsis(data.synopsis || '');
    }
  }, [data.profileUrl, data.firstName, data.lastName, data.synopsis, isPopoverOpen]);

  const handleSave = useCallback(() => {
    if (isReadOnly) return;
    setNodes((nds) => nds.map((node) => node.id === id ? {
      ...node,
      data: {
        ...node.data,
        profileUrl: tempProfileUrl,
        firstName: tempFirstName,
        lastName: tempLastName,
        synopsis: tempSynopsis,
      }
    } : node));
    setIsEditing(false);
    if (typeof (data && data.onNodeDataChange) === 'function') {
      data.onNodeDataChange(id, {
        profileUrl: tempProfileUrl,
        firstName: tempFirstName,
        lastName: tempLastName,
        synopsis: tempSynopsis,
      });
    }
  }, [id, tempProfileUrl, tempFirstName, tempLastName, tempSynopsis, setNodes, isReadOnly]);

  // Popover açarken z-index'i ayarla
  const openPopover = useCallback(() => {
    if (isReadOnly) return;
    setNodes((nds) => nds.map((node) => 
      node.id === id ? { ...node, zIndex: 1000 } : node
    ));
    setIsPopoverOpen(true);
    setIsEditing(true);
    setTimeout(() => firstNameRef.current?.focus(), 0);
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
            profileUrl: tempProfileUrl,
            firstName: tempFirstName,
            lastName: tempLastName,
            synopsis: tempSynopsis,
          },
          zIndex: undefined
        };
      }));
    }, 0);
  }, [id, setNodes, isReadOnly, tempProfileUrl, tempFirstName, tempLastName, tempSynopsis]);

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
      document.addEventListener('mousedown', handleClickOutside, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isPopoverOpen, isDropdownOpen, closePopover, closeDropdown]);


  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    toast('Character card deleted.', { icon: <Trash2 className="w-4 h-4" /> });
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
        type: 'characterCard',
        position: {
          x: original.position.x + 40,
          y: original.position.y + 40
        },
        data: {
          profileUrl,
          firstName,
          lastName,
          synopsis,
          onNodeDataChange: data.onNodeDataChange,
          onDeleteNode: data.onDeleteNode
        },
      };
      setNodes((nds) => [...nds, newNode]);
      toast('Character card duplicated.');
      console.log('Duplicated character card:', newNode.id);
    } catch (e) {
      console.error('Duplicate failed:', e);
    }
  }, [getNodes, id, setNodes, profileUrl, firstName, lastName, synopsis, data.onNodeDataChange, data.onDeleteNode]);

  const initials = (firstName || lastName) ? `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase() : '';

  return (
    <div className="relative">
      <div
        className={cn(
          "bg-card border border-border rounded-lg w-80 h-auto node-card relative group",
          "transition-colors duration-150",
          selected && "border-primary/40",
          !isReadOnly && "cursor-pointer"
        )}
        onClick={() => { if (!isReadOnly) { openPopover(); } }}
      >
        {/* Four handles */}
        <Handle type="source" position={Position.Top} id="top" style={{...handleStyle, top: -6}} isConnectable={true} />
        <Handle type="source" position={Position.Right} id="right" style={{...handleStyle, right: -6}} isConnectable={true} />
        <Handle type="source" position={Position.Bottom} id="bottom" style={{...handleStyle, bottom: -6}} isConnectable={true} />
        <Handle type="source" position={Position.Left} id="left" style={{...handleStyle, left: -6}} isConnectable={true} />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 min-w-0">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab drag-handle" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center">
                  {profileUrl ? (
                    <img src={profileUrl} alt="profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground">{initials || <User className="w-4 h-4" />}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{(firstName + ' ' + lastName).trim() || 'Name Surname'}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2 max-w-[180px]">{synopsis || 'Short synopsis...'}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              {!isReadOnly && (
                <div className="relative" ref={dropdownRef}>
                <button
                  className="px-1 py-1.5 rounded-md hover:bg-foreground/10 transition-colors"
                  title="Actions"
                  onClick={(e) => { e.stopPropagation(); toggleDropdown(); }}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-md shadow-lg z-[9999] animate-in fade-in-0 zoom-in-95">
                    <div className="py-1 px-1">
                      <button
                        className="w-full px-2 py-1.5 text-sm text-left hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 transition-colors rounded-sm"
                        onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); closeDropdown(); }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete character?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Popover */}
      {isPopoverOpen && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-2 w-[360px] bg-popover border border-border rounded-lg shadow-lg z-[9999] animate-in fade-in-0 zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Profile image URL</label>
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center">
                  {tempProfileUrl ? (
                    <img src={tempProfileUrl} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <input
                  type="text"
                  value={tempProfileUrl}
                  onChange={(e) => setTempProfileUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">First name</label>
                <input
                  ref={firstNameRef}
                  type="text"
                  value={tempFirstName}
                  onChange={(e) => setTempFirstName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Last name</label>
                <input
                  type="text"
                  value={tempLastName}
                  onChange={(e) => setTempLastName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Synopsis</label>
              <textarea
                value={tempSynopsis}
                onChange={(e) => setTempSynopsis(e.target.value)}
                placeholder="2-3 cümlelik kısa karakter özeti"
                rows={4}
                className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default memo(CharacterCard);
