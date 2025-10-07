'use client';

import { useState, useRef, useCallback, memo, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const handleStyle = {
  width: 8,
  height: 8,
  background: '#fff',
  border: '2px solid #e5e7eb',
  borderRadius: '50%',
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
};

function CommentCard({ id, data, selected }) {
  // Yeni comment card ise otomatik olarak expanded ve editing mode'da aç
  const isNewComment = !data.text || data.text.trim() === '';
  const [isExpanded, setIsExpanded] = useState(isNewComment);
  const [isEditing, setIsEditing] = useState(isNewComment);
  const [text, setText] = useState(data.text || '');
  const textareaRef = useRef(null);
  const { setNodes, setEdges } = useReactFlow();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { user } = useAuth();

  const authorName = data.authorName || 'Anonymous';
  const createdAt = data.createdAt;
  const authorId = data.authorId;
  const isBoardOwner = data.isBoardOwner || false;
  const onEditingChange = data.onEditingChange;

  // Author can edit/delete their own comment
  // Board owner can delete any comment but cannot edit others' comments
  const canEdit = user && authorId === user.uid;
  const canDelete = canEdit || isBoardOwner;

  // Notify parent when editing state changes
  useEffect(() => {
    if (onEditingChange) {
      onEditingChange(id, isEditing);
    }
  }, [isEditing, id, onEditingChange]);

  const handleTextSubmit = useCallback(() => {
    setIsEditing(false);
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, text } } : node
      )
    );
  }, [id, text, setNodes]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    } else if (e.key === 'Escape') {
      setText(data.text);
      setIsEditing(false);
    }
  };

  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    toast("Comment deleted.", { icon: <Trash2 className="w-4 h-4" /> });
  }, [id, setNodes, setEdges]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'MMM d, HH:mm');
    } catch (e) {
      return '';
    }
  };

  const toggleExpanded = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  return (
    <div className="relative">
      {/* Collapsed state - small chat bubble */}
      {!isExpanded && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative group"
        >
          <div
            className="w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center cursor-grab hover:border-primary/40 hover:shadow-lg transition-all node-card drag-handle"
            onClick={toggleExpanded}
          >
            <MessageSquare className="w-6 h-6 text-gray-600" />

            {/* Handles - hidden in collapsed state */}
            <Handle
              type="source"
              position={Position.Top}
              id="top"
              style={{ ...handleStyle, opacity: 0 }}
              isConnectable={true}
            />
            <Handle
              type="source"
              position={Position.Right}
              id="right"
              style={{ ...handleStyle, opacity: 0 }}
              isConnectable={true}
            />
            <Handle
              type="source"
              position={Position.Bottom}
              id="bottom"
              style={{ ...handleStyle, opacity: 0 }}
              isConnectable={true}
            />
            <Handle
              type="source"
              position={Position.Left}
              id="left"
              style={{ ...handleStyle, opacity: 0 }}
              isConnectable={true}
            />
          </div>

          {/* Tooltip on hover */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap max-w-xs truncate">
              {data.text || 'Empty comment'}
            </div>
          </div>
        </motion.div>
      )}

      {/* Expanded state - full comment view */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={cn(
              "bg-white border-2 border-gray-200 rounded-lg w-72 node-card relative shadow-lg",
              selected && "border-primary/40"
            )}
          >
            {/* Handles */}
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

            {/* Header */}
            <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50 drag-handle cursor-grab">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <MessageSquare className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {authorName}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {formatDate(createdAt)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {canDelete && (
                  <button
                    onClick={() => setConfirmOpen(true)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                )}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Comment Content */}
            <div className="p-3">
              {isEditing ? (
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onBlur={handleTextSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleTextSubmit();
                    } else if (e.key === 'Escape') {
                      setText(data.text);
                      setIsEditing(false);
                    }
                  }}
                  className="w-full bg-gray-50 resize-none outline-none text-sm text-gray-900 rounded-md p-2 border border-gray-200 focus:border-primary nodrag"
                  placeholder="Write your comment..."
                  autoFocus
                  rows={3}
                />
              ) : (
                <div
                  className="text-sm text-gray-700 whitespace-pre-wrap break-words cursor-text min-h-[60px]"
                  onClick={() => canEdit && setIsEditing(true)}
                >
                  {data.text || (canEdit ? 'Click to add comment...' : 'Empty comment')}
                </div>
              )}
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This comment will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(CommentCard);
