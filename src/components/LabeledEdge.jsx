'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow } from 'reactflow';
import { X, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data = {},
  selected
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const { setEdges } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setLabel(data.label || '');
  }, [data.label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleLabelSubmit = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.blur();
    }
    setIsEditing(false);
    setEdges((edges) =>
      edges.map((edge) =>
        edge.id === id
          ? { ...edge, data: { ...edge.data, label: label.trim() } }
          : edge
      )
    );
    // Focus'u tamamen temizle
    setTimeout(() => {
      if (document.activeElement) {
        document.activeElement.blur();
      }
    }, 0);
  }, [id, label, setEdges]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLabelSubmit();
    } else if (e.key === 'Escape') {
      setLabel(data.label || '');
      setIsEditing(false);
    }
  };

  const removeLabel = useCallback(() => {
    setEdges((edges) =>
      edges.map((edge) =>
        edge.id === id
          ? { ...edge, data: { ...edge.data, label: '' } }
          : edge
      )
    );
  }, [id, setEdges]);

  const hasLabel = label && label.trim().length > 0;

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          strokeWidth: 1,
          stroke: '#c9c9c9',
          ...style
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            minWidth: hasLabel ? 'auto' : '80px',
            minHeight: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          className="nodrag nopan group opacity-100"
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value.slice(0, 50))}
              onBlur={handleLabelSubmit}
              onKeyDown={handleKeyDown}
              maxLength={50}
              className="bg-secondary text-secondary-foreground rounded-md px-2.5 py-0.5 text-xs font-semibold min-w-20 max-w-48"
              style={{
                outline: 'none',
                border: 'none',
                boxShadow: 'none',
                appearance: 'none'
              }}
              placeholder="Add label..."
            />
          ) : hasLabel ? (
            <Badge
              variant="secondary"
              className={cn(
                "group cursor-pointer transition-colors max-w-48 pr-1",
                selected && "ring-2 ring-primary/50"
              )}
              onClick={() => setIsEditing(true)}
              title="Click to edit label"
              style={{
                outline: 'none',
                boxShadow: 'none'
              }}
            >
              <span className="truncate">{label}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeLabel();
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-secondary-foreground"
                aria-label="Remove label"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ) : (
            <div className="hidden group-hover:block">
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setIsEditing(true)}
                title="Add label"
                style={{
                  outline: 'none',
                  boxShadow: 'none'
                }}
              >
                <Edit3 className="w-3 h-3 mr-1" />
                <span>Add label</span>
              </Badge>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}