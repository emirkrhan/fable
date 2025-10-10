'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import StoryCard from './StoryCard';
import LinkCard from './LinkCard';
import CharacterCard from './CharacterCard';
import TimelineCard from './TimelineCard';
import TitleCard from './TitleCard';
import CommentCard from './CommentCard';
import ImageCard from './ImageCard';
import LocationCard from './LocationCard';
import NumberCard from './NumberCard';
import ListCard from './ListCard';
import CodeCard from './CodeCard';
import LabeledEdge from './LabeledEdge';
import { Plus, Check, Loader2, Upload, Loader } from 'lucide-react';
import TopNav from './TopNav';
import WhatsNewCard from './WhatsNewCard';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAutoSaveOptimized } from '@/hooks/useAutoSaveOptimized';
import { useChangeTracker } from '@/hooks/useChangeTracker';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import ShareBoardDialog from './ShareBoardDialog';


const nodeTypes = {
  titleCard: TitleCard,
  storyCard: StoryCard,
  linkCard: LinkCard,
  characterCard: CharacterCard,
  timelineCard: TimelineCard,
  commentCard: CommentCard,
  imageCard: ImageCard,
  listCard: ListCard,
  locationCard: LocationCard,
  numberCard: NumberCard,
  codeCard: CodeCard,
};

// Wrapper for LabeledEdge to pass permission
const createLabeledEdge = (permission) => (props) => (
  <LabeledEdge {...props} isReadOnly={permission === 'comment-only'} />
);

const edgeTypes = {
  labeled: LabeledEdge,
};

const initialNodes = [
  {
    id: '1',
    type: 'storyCard',
    position: { x: 250, y: 100 },
    data: { text: 'Story Beginning' },
    dragHandle: '.drag-handle',
  },
  {
    id: '2',
    type: 'storyCard',
    position: { x: 500, y: 200 },
    data: { text: 'Character Development' },
    dragHandle: '.drag-handle',
  },
];

const initialEdges = [
  {
    id: '1-2',
    source: '1',
    target: '2',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    type: 'labeled',
    data: { label: '' },
    animated: false,
  },
];

const isValidConnection = (connection) => {
  return connection.source !== connection.target;
};

const proOptions = { hideAttribution: true };

const STORAGE_KEY = 'story-planner:flow:v1';

export default function ReactFlowPlanner({ boardId }) {
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [nodes, setNodes, onNodesChangeOriginal] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeOriginal] = useEdgesState([]);
  const [nodeId, setNodeId] = useState(3);
  const nodeIdRef = useRef(3); // ⚠️ FIX: nodeId için ref ekledik
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [boardPermission, setBoardPermission] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Initialize change tracker for incremental updates
  const {
    trackChange,
    trackNodeDataChange,
    trackEdgeDataChange,
    getMergedChanges,
    clearChanges,
    getChangeCount
  } = useChangeTracker();

  // Remove online/offline gating: keep behavior simple

  // Collaboration disabled: no realtime updates

  // onNodesChange - with change tracking
  const onNodesChange = useCallback((changes) => {
    onNodesChangeOriginal(changes);
    trackChange('nodes', changes);
  }, [onNodesChangeOriginal, trackChange]);

  // onEdgesChange - with change tracking
  const onEdgesChange = useCallback((changes) => {
    onEdgesChangeOriginal(changes);
    trackChange('edges', changes);
  }, [onEdgesChangeOriginal, trackChange]);

  // Global click handler to close dropdowns
  useEffect(() => {
    const handleGlobalClick = (event) => {
      // Close all dropdowns when clicking outside of dropdown content
      const clickedElement = event.target;
      const isDropdownTrigger = clickedElement.closest('[data-radix-dropdown-menu-trigger]');
      const isDropdownContent = clickedElement.closest('[data-radix-dropdown-menu-content]');
      const isDialogContent = clickedElement.closest('[data-radix-dialog-content]');
      const isDialogOverlay = clickedElement.closest('[data-radix-dialog-overlay]');

      // Don't close dropdowns if clicking in a dialog
      if (isDialogContent || isDialogOverlay) {
        return;
      }

      if (!isDropdownTrigger && !isDropdownContent) {
        // Trigger escape key on all open dropdown triggers to close them
        document.querySelectorAll('[data-radix-dropdown-menu-trigger][data-state="open"]').forEach(trigger => {
          trigger.click();
        });
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, []);

  // Load board data once on mount
  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) {
      return;
    }

    if (!boardId) {
      router.push('/boards');
      return;
    }

    // Check user inside effect to avoid unnecessary re-renders
    const currentUserId = user?.uid;
    if (!currentUserId) {
      router.push('/login');
      return;
    }

    const loadBoard = async () => {
      setIsLoading(true);
      try {
        console.log('🚀 Loading board:', boardId, 'for user:', currentUserId);
        const token = getToken();
        if (!token) throw new Error("No auth token found");
        const board = await api(`/boards/${boardId}`, { token });

        if (!board) {
          console.error('❌ Board not found');
          toast.error('Board not found');
          router.push('/boards');
          return;
        }

        console.log('✅ Board loaded:', board);

        const permission = board.permission;
        console.log('🔐 User permission:', permission);
        
        if (!permission) {
          console.error('❌ No permission for this board');
          toast.error('You do not have access to this board');
          router.push('/boards');
          return;
        }

        setCurrentBoard(board);
        setBoardPermission(permission);

        console.log('📦 Setting nodes:', board.nodes?.length || 0, 'edges:', board.edges?.length || 0);

        // boardId bilgisini imageCard gibi upload kullanan nodelara inject edelim
        const nodesWithBoardContext = (board.nodes || []).map((n) =>
          n.type === 'imageCard' ? { ...n, data: { ...(n.data||{}), boardId } } : n
        );
        setNodes(nodesWithBoardContext);
        setEdges(board.edges || []);

        console.log('✅ Nodes and edges set successfully');

        // Calculate next node ID
        const boardNodes = board.nodes || [];
        if (boardNodes.length > 0) {
          const maxId = boardNodes
            .map((n) => parseInt(n.id, 10))
            .filter((n) => !Number.isNaN(n))
            .reduce((acc, n) => Math.max(acc, n), 0);
          const nextId = (maxId || 0) + 1;
          setNodeId(nextId);
          nodeIdRef.current = nextId;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('💥 Error loading board:', error);

        // Provide more specific error messages
        let errorMessage = 'Failed to load board';
        if (error.message?.includes('not authenticated')) {
          errorMessage = 'Please sign in to view this board';
        } else if (error.message?.includes('not found')) {
          errorMessage = 'Board not found';
        } else if (error.message?.includes('access denied')) {
          errorMessage = 'You do not have access to this board';
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);

        // Add a small delay before redirect to ensure toast is visible
        setTimeout(() => {
          router.push('/boards');
        }, 1500);
      } finally {
        setIsLoading(false);
      }
    };

    loadBoard();
    // Only depend on boardId and authLoading to avoid unnecessary re-fetches
    // user check is done inside the effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, authLoading]);

  const getToken = () => typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null;

  // Collaboration disabled: no cursor tracking

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) => {
    if (!user?.uid) {
      toast("Please sign in to connect cards.");
      router.push('/login');
      return eds;
    }
        return addEdge({
          ...params,
          type: 'labeled',
          data: { label: '' },
          animated: false,
        }, eds);
      }),
    [setEdges, user]
  );

  const addCommentToNode = useCallback((targetNodeId) => {
    if (!user?.uid) {
      toast("Please sign in to add comments.");
      return;
    }

    setNodes((currentNodes) => {
      const targetNode = currentNodes.find(n => n.id === targetNodeId);
      if (!targetNode) return currentNodes;

    const newPosition = {
      x: targetNode.position.x + 350,
      y: targetNode.position.y
    };

    const commentData = {
      text: '',
      authorId: user.uid,
      authorName: user.displayName || user.email || 'Anonymous',
      authorEmail: user.email || '',
      createdAt: new Date()
    };

    const newNode = {
        id: nodeIdRef.current.toString(),
      type: 'commentCard',
      position: newPosition,
      data: commentData,
      dragHandle: '.drag-handle',
    };

      nodeIdRef.current += 1;
      setNodeId(nodeIdRef.current);

      return [...currentNodes, newNode];
    });

    toast('Comment created.', { icon: <Check className="w-4 h-4" /> });
  }, [setNodes, user]);

  const addNode = useCallback((cardTypeOrEvent, position) => {
    if (!user?.uid) {
      toast("Please sign in to add cards.");
      router.push('/login');
      return;
    }

    // Check permission - if comment-only, only allow commentCard
    if (boardPermission === 'comment-only' && typeof cardTypeOrEvent === 'string' && cardTypeOrEvent !== 'commentCard') {
      toast.error("You can only add comments to this board");
      return;
    }

    // Determine if this is a cardType string or an event (double click)
    let cardType = 'storyCard';
    let newPosition;

    if (typeof cardTypeOrEvent === 'string') {
      // Called from TopNav or dropdown with cardType
      cardType = cardTypeOrEvent;
      newPosition = {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      };
    } else {
      // Called from double click
      console.log('Double click detected!', cardTypeOrEvent, position);
      // If comment-only, create comment card by default
      cardType = boardPermission === 'comment-only' ? 'commentCard' : 'storyCard';
      newPosition = position || {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      };
    }

    console.log('Creating new node at position:', newPosition, 'type:', cardType);

    let nodeData;
    switch (cardType) {
      case 'titleCard':
        nodeData = {
          text: 'New Title'
        };
        break;
      case 'linkCard':
        nodeData = {
          url: '',
          preview: ''
        };
        break;
      case 'characterCard':
        nodeData = {
          profileUrl: '',
          firstName: '',
          lastName: '',
          synopsis: '',
          birthdate: ''
        };
        break;
      case 'timelineCard':
        nodeData = {
          date: ''
        };
        break;
      case 'commentCard':
        nodeData = {
          text: '',
          authorId: user.uid,
          authorName: user.displayName || user.email || 'Anonymous',
          authorEmail: user.email || '',
          createdAt: new Date()
        };
        break;
      case 'imageCard':
        nodeData = {
          url: ''
        };
        break;
      case 'numberCard':
        nodeData = {
          value: ''
        };
        break;
      case 'locationCard':
        nodeData = {
          location: ''
        };
        break;
      case 'listCard':
        nodeData = {
          items: [
            {
              id: `item-${Date.now()}`,
              text: '',
              checked: false
            }
          ]
        };
        break;
      case 'codeCard':
        nodeData = {
          code: '// Write your JavaScript code here\nconsole.log("Hello, World!");'
        };
        break;
      case 'storyCard':
      default:
        nodeData = { text: 'New Story Element' };
        break;
    }

    const newNode = {
      id: nodeIdRef.current.toString(),
      type: cardType,
      position: newPosition,
      data: nodeData,
      dragHandle: '.drag-handle',
    };

    setNodes((nds) => {
      console.log('Previous nodes:', nds.length);
      const newNodes = [...nds, newNode];
      console.log('New nodes:', newNodes.length);
      return newNodes;
    });

    // Track add operation for incremental save (ensures first save includes addNode)
    try {
      trackChange('nodes', [{ type: 'add', item: newNode }]);
    } catch (e) {
      console.warn('Failed to track addNode change', e);
    }

    // Increment ref for next node
    nodeIdRef.current += 1;
    setNodeId(nodeIdRef.current);

    const cardTypeNames = {
      titleCard: 'Title card',
      storyCard: 'Story card',
      linkCard: 'Link card',
      characterCard: 'Character card',
      timelineCard: 'Timeline card',
      commentCard: 'Comment',
      imageCard: 'Image card',
      listCard: 'List card',
      locationCard: 'Location card',
      numberCard: 'Number card',
      codeCard: 'Code card'
    };
    const cardTypeName = cardTypeNames[cardType] || 'Card';
    toast(`${cardTypeName} created.`, { icon: <Check className="w-4 h-4" /> });
  }, [setNodes, boardPermission, user]);

  const updateNodeData = useCallback((id, newData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
    // Track data changes for incremental updates
    trackNodeDataChange(id, newData);
  }, [setNodes, trackNodeDataChange]);

  const deleteNode = useCallback((id) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  }, [setNodes, setEdges]);

  const deleteEdgeById = useCallback((id) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== id));
  }, [setEdges]);

  const handleDownloadWorkspace = useCallback(() => {
    try {
      const workspaceData = {
        nodes: nodes.map(({ id, type, position, data }) => {
          const { onAddComment, isReadOnly, isBoardOwner, onEditingChange, onNodeDataChange, onDeleteNode, ...cleanData } = data || {};
          return { id, type, position, data: cleanData };
        }),
        edges: edges.map(({ id, source, target, sourceHandle, targetHandle, type, data, animated, style }) => ({ id, source, target, sourceHandle, targetHandle, type, data, animated, style })),
        exportedAt: new Date().toISOString(),
        appVersion: "1.0.0"
      };

      const dataStr = JSON.stringify(workspaceData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `workspace-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast("Workspace downloaded!", { icon: <Check className="w-4 h-4" /> });
    } catch (error) {
      console.error('Download failed:', error);
      toast("Download failed", { variant: "destructive" });
    }
  }, [nodes, edges]);

  const handleClearWorkspace = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setNodeId(1);
    nodeIdRef.current = 1; // ⚠️ FIX: ref'i de güncelle
    toast("Workspace cleared!", { icon: <Check className="w-4 h-4" /> });
  }, [setNodes, setEdges]);

  const handleSave = useCallback(async (silent = false) => {
    if (!boardId) return;

    try {
      // Clean and filter node data - remove functions like onAddComment, isReadOnly, isBoardOwner, onEditingChange, onNodeDataChange, and onDeleteNode
      const cleanNodes = nodes.map(({ id, type, position, data }) => {
        // Remove functions and temporary props from data
        const { onAddComment, isReadOnly, isBoardOwner, onEditingChange, onNodeDataChange, onDeleteNode, boardId: _boardId, ...cleanData } = data || {};
        return {
          id: id || '',
          type: type || 'storyCard',
          position: position || { x: 0, y: 0 },
          data: cleanData
        };
      });

      // Clean and filter edge data
      const cleanEdges = edges.map(({ id, source, target, sourceHandle, targetHandle, type, data, animated, style }) => ({
        id: id || '',
        source: source || '',
        target: target || '',
        ...(sourceHandle && { sourceHandle }),
        ...(targetHandle && { targetHandle }),
        type: type || 'default',
        ...(data && { data }),
        ...(animated !== undefined && { animated }),
        ...(style && { style })
      }));

      // Size guard: if payload is too big, fail fast with clearer error
      const payloadSize = new Blob([JSON.stringify({ nodes: cleanNodes, edges: cleanEdges })]).size;
      const maxPayloadBytes = 4 * 1024 * 1024; // 4MB soft limit
      if (payloadSize > maxPayloadBytes) {
        throw new Error('Workspace too large to save (exceeds 4MB). Consider splitting.');
      }

      // Save to board with 10 second timeout
      // Reduced from 30s to fail faster on network issues
      const withTimeout = (promise, ms) =>
        new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Save timeout - operation took longer than expected. Please check your connection.'));
          }, ms);
          promise
            .then((res) => { clearTimeout(timeoutId); resolve(res); })
            .catch((err) => { clearTimeout(timeoutId); reject(err); });
        });

      // Save to board with 10 second timeout
      const token = getToken();
      if (!token) throw new Error("No auth token found");
      const saved = await withTimeout(
        api(`/boards/${boardId}`, {
          method: 'PATCH',
          token,
          body: { nodes: cleanNodes, edges: cleanEdges }
        }),
        10000
      );

      // Collaboration disabled: no broadcast

      if (saved && !silent) {
        toast("Board saved!", { icon: <Check className="w-4 h-4" /> });
      } else if (!saved && !silent) {
        toast("Failed to save board", { variant: "destructive" });
      }

    } catch (e) {
      console.error('Failed to save board', e);
      if (!silent) {
        const message = e?.message?.includes('timeout')
          ? 'Save timed out. Please check your internet connection and try again.'
          : e?.message || 'Failed to save board';
        toast(message, { variant: "destructive" });
      }
      throw e; // Re-throw for auto-save error handling
    }
  }, [boardId, nodes, edges, user]);

  const workspaceData = useMemo(() => {
    const cleanNodes = nodes.map((node) => {
      const { id, type, position, data } = node;
      if (!data) return { id, type, position, data: {} };

      // Clean data by removing functions and temporary props
      const { onAddComment, isReadOnly, isBoardOwner, onEditingChange, onNodeDataChange, onDeleteNode, boardId: _boardId, ...cleanData } = data;

      return {
        id,
        type,
        // Round position to avoid floating point precision issues
        position: position ? {
          x: Math.round(position.x * 100) / 100,
          y: Math.round(position.y * 100) / 100
        } : { x: 0, y: 0 },
        data: cleanData
      };
    });

    const cleanEdges = edges.map(({ id, source, target, sourceHandle, targetHandle, type, data, animated, style }) => ({
      id, source, target, sourceHandle, targetHandle, type, data, animated, style
    }));

    return { nodes: cleanNodes, edges: cleanEdges };
  }, [nodes, edges]);

  // Silent save function for auto-save (no toasts)
  // Uses patch-based updates when possible, falls back to full save
  const silentSave = useCallback(async () => {
    const changeCount = getChangeCount();

    // If we have tracked changes, use incremental update
    if (changeCount > 0 && changeCount < 50) {
      try {
        const patches = getMergedChanges();
        console.log(`🚀 Using incremental update (${patches.length} patches)`);
        const token = getToken();
        if (!token) throw new Error("No auth token found");
        await api(`/boards/${boardId}`, {
          method: 'PATCH',
          token,
          body: { patches }
        });

        // Clear changes after successful save
        clearChanges();

        console.log('✅ Incremental save successful');
        return;
      } catch (error) {
        console.warn('⚠️ Incremental save failed, falling back to full save:', error);
        // Fall through to full save
      }
    }

    // Fallback to full state save
    // (used for large change sets or when incremental fails)
    console.log('📦 Using full state save');
    await handleSave(true);
    clearChanges(); // Clear tracked changes after full save
  }, [handleSave, getChangeCount, getMergedChanges, clearChanges, boardId, user]);

  const {
    status: saveStatus,
    hasUnsavedChanges,
    loadFromLocalStorage,
    triggerSave
  } = useAutoSaveOptimized(
    silentSave,
    workspaceData,
    {
      debounceMs: 2000, // Reduced from 3000ms for faster response
      enabled: !!user?.uid && !isLoading,
      storageKey: `board-draft-${boardId}`, // Unique key per board
    }
  );

  // Check for localStorage recovery on mount (after auto-save hook is initialized)
  useEffect(() => {
    if (!boardId || !user?.uid || !loadFromLocalStorage) return;

    const checkForRecovery = () => {
      const draft = loadFromLocalStorage();
      if (draft && draft.nodes && draft.edges) {
        const draftTime = localStorage.getItem(`board-draft-${boardId}`)
          ? JSON.parse(localStorage.getItem(`board-draft-${boardId}`)).timestamp
          : null;

        if (draftTime) {
          const minutesAgo = Math.floor((Date.now() - new Date(draftTime).getTime()) / 60000);
          if (minutesAgo < 60) {
            toast.info(`Found unsaved changes from ${minutesAgo} minutes ago. Check console to recover.`, {
              duration: 10000,
            });
            console.log('💾 Recovered draft available:', draft);
          }
        }
      }
    };

    // Run check after a brief delay to ensure everything is loaded
    const timeoutId = setTimeout(checkForRecovery, 1000);
    return () => clearTimeout(timeoutId);
  }, [boardId, user?.uid, loadFromLocalStorage]);

  const handleImportWorkspace = useCallback(() => {
    if (!user?.uid) {
      toast("Please sign in to import workspace.");
      router.push('/login');
      return;
    }
    fileInputRef.current?.click();
  }, [user]);

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result);

        // Validate JSON structure
        if (!jsonData.nodes || !Array.isArray(jsonData.nodes)) {
          throw new Error('Invalid workspace file: missing or invalid nodes');
        }
        if (!jsonData.edges || !Array.isArray(jsonData.edges)) {
          throw new Error('Invalid workspace file: missing or invalid edges');
        }

        // Validate nodes structure
        const validNodes = jsonData.nodes.filter(node =>
          node.id &&
          node.type &&
          node.position &&
          typeof node.position.x === 'number' &&
          typeof node.position.y === 'number' &&
          node.data
        );

        // Validate edges structure
        const validEdges = jsonData.edges.filter(edge =>
          edge.id &&
          edge.source &&
          edge.target
        );

        if (validNodes.length === 0) {
          throw new Error('No valid nodes found in workspace file');
        }

        // Calculate new nodeId based on imported nodes
        const maxId = validNodes
          .map((n) => parseInt(n.id, 10))
          .filter((n) => !Number.isNaN(n))
          .reduce((acc, n) => Math.max(acc, n), 0);

        // Apply imported data
        const nextId = (maxId || 0) + 1;
        setNodes(validNodes);
        setEdges(validEdges);
        setNodeId(nextId);
        nodeIdRef.current = nextId; // ⚠️ FIX: ref'i de güncelle

        toast(`Workspace imported! (${validNodes.length} cards, ${validEdges.length} connections)`, {
          icon: <Check className="w-4 h-4" />
        });

        // Save imported workspace to current user
        handleSave();

      } catch (error) {
        console.error('Import failed:', error);
        toast(`Import failed: ${error.message}`, { variant: "destructive" });
      }
    };

    reader.onerror = () => {
      toast("Failed to read file", { variant: "destructive" });
    };

    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
  }, [setNodes, setEdges, handleSave]);

  // Handle board name change
  const handleBoardNameChange = useCallback(async (newName) => {
    if (!boardId || boardPermission !== 'owner') return;
    const current = (currentBoard?.name || '').trim();
    const next = (newName || '').trim();
    if (!next || next === current) return;

    try {
      const token = getToken();
      if (!token) throw new Error("No auth token found");
      const updatedBoard = await api(`/boards/${boardId}`, {
        method: 'PATCH',
        token,
        body: { name: newName }
      });
      
      // Update current board with all fields including permission
      if (updatedBoard) {
        setCurrentBoard(updatedBoard);
        // Also update permission if it changed
        if (updatedBoard.permission) {
          setBoardPermission(updatedBoard.permission);
        }
      }
      
      toast.success('Board name updated!', { icon: <Check className="w-4 h-4" /> });
    } catch (error) {
      console.error('Error updating board name:', error);
      toast.error('Failed to update board name');
    }
  }, [boardId, boardPermission, user]);

  // Reload board data after share dialog changes
  const reloadBoardData = useCallback(async () => {
    if (!boardId) return;

    try {
      const token = getToken();
      if (!token) throw new Error("No auth token found");
      const board = await api(`/boards/${boardId}`, { token });
      if (board) {
        setCurrentBoard(board);
      }
    } catch (error) {
      console.error('Error reloading board:', error);
    }
  }, [boardId, user]);

  const enhancedNodes = useMemo(() => {
    const isReadOnly = boardPermission === 'comment-only';
    const isBoardOwner = boardPermission === 'owner';
    return nodes.map(node => {
      const baseNode = {
        ...node,
        data: {
          ...node.data,
          isReadOnly: isReadOnly,
          isBoardOwner: isBoardOwner,
          onNodeDataChange: updateNodeData,
          onDeleteNode: deleteNode,
        },
        dragHandle: '.drag-handle',
        draggable: isReadOnly ? node.type === 'commentCard' : true,
        connectable: !isReadOnly
      };

      if (node.type === 'storyCard' || node.type === 'listCard') {
        return {
          ...baseNode,
          data: {
            ...baseNode.data,
            onAddComment: addCommentToNode
          }
        };
      }

      return baseNode;
    });
  }, [nodes, addCommentToNode, boardPermission, updateNodeData, deleteNode]);

  const enhancedEdges = useMemo(() => {
    const isReadOnly = boardPermission === 'comment-only';
    return edges.map(edge => ({
      ...edge,
      data: {
        ...edge.data,
        isReadOnly
      }
    }));
  }, [edges, boardPermission]);

  if (isLoading || authLoading) {
    return (
      <ReactFlowProvider>
      <TopNav
          onSave={() => handleSave(false)}
          onAdd={addNode}
          onDownloadWorkspace={handleDownloadWorkspace}
          onImportWorkspace={handleImportWorkspace}
          onClearWorkspace={handleClearWorkspace}
          saveStatus="idle"
          boardName={currentBoard?.name}
          onBoardNameChange={handleBoardNameChange}
          onShareBoard={() => setShareDialogOpen(true)}
          boardPermission={boardPermission}
          showBoardControls={!!boardId}
        />
        <div className="w-full bg-background">
          <div className="h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading board...</p>
            </div>
          </div>
        </div>
      </ReactFlowProvider>
    );
  }

  return (
    <ReactFlowProvider>
      <TopNav
        onSave={() => handleSave(false)}
        onAdd={addNode}
        onDownloadWorkspace={handleDownloadWorkspace}
        onImportWorkspace={handleImportWorkspace}
        onClearWorkspace={handleClearWorkspace}
        saveStatus={saveStatus}
        boardName={currentBoard?.name}
        onBoardNameChange={handleBoardNameChange}
        onShareBoard={() => setShareDialogOpen(true)}
        boardPermission={boardPermission}
        showBoardControls={!!boardId}
      />

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <div className="w-full bg-background">
        <div className="h-screen">
          <ReactFlow
          nodes={enhancedNodes}
          edges={enhancedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={boardPermission === 'comment-only' ? undefined : onEdgesChange}
          edgesFocusable={boardPermission !== 'comment-only'}
          edgesUpdatable={boardPermission !== 'comment-only'}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.3, minZoom: 0.5, maxZoom: 1.5 }}
          nodesConnectable={boardPermission !== 'comment-only'}
          elementsSelectable={true}
          onDoubleClick={(event) => {
            if (boardPermission !== 'comment-only') {
              const target = event.target;
              const isNode = target && target.closest && target.closest('.node-card');
              if (!isNode) {
                addNode(event);
              }
            }
          }}
          onEdgeDoubleClick={(event, edge) => {
            if (boardPermission !== 'comment-only') {
              event.stopPropagation();
              deleteEdgeById(edge.id);
            }
          }}
          connectionLineType="bezier"
          connectionLineStyle={{ strokeWidth: 1, stroke: '#c9c9c9' }}
          className="bg-background"
          isValidConnection={isValidConnection}
          connectionMode="Loose"
          defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
          minZoom={0.2}
          maxZoom={4}
          attributionPosition="bottom-left"
          snapToGrid={true}
          snapGrid={[20, 20]}
          deleteKeyCode="Delete"
          proOptions={proOptions}
        >
        <Background
          color={theme === 'dark' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.5)'}
          gap={30}
          variant="dots"
          size={2}
        />
        <Controls
          className="bg-card border-border text-foreground"
          showInteractive={false}
        />
          </ReactFlow>
        </div>
      </div>

      {/* Share removed */}

      {/* What's New Card */}
      <WhatsNewCard />

      {/* Cursors removed */}
    </ReactFlowProvider>
  );
}