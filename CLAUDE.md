# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**fable** is a professional story planning tool built with Next.js 15, React 19, and ReactFlow. It provides a visual canvas-based interface where users can create and connect various types of story cards (characters, timelines, locations, notes, etc.) to plan narratives.

The application uses Supabase for authentication (Google OAuth) and data persistence. Each user can create multiple boards that are automatically saved to the cloud.

## Common Commands

### Development
```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Build production bundle
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Environment Setup
Required environment variables (in `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Architecture

### Core Flow Architecture

The application is built around **ReactFlow** (v11), a flow/graph visualization library:

- **Main Canvas**: `src/components/ReactFlowPlanner.jsx` - Central component managing the entire board state, nodes, edges, and all user interactions
- **Node System**: 10 different card types (StoryCard, CharacterCard, TimelineCard, LocationCard, NumberCard, ListCard, TitleCard, CommentCard, LinkCard, ImageCard)
- **Edge System**: Custom labeled edges (`LabeledEdge.jsx`) that support editable connection labels
- **Handle System**: Each card has 4 connection handles (top, right, bottom, left) for creating directional relationships

### State Management Pattern

State is managed through **ReactFlow's built-in hooks** (`useNodesState`, `useEdgesState`, `useReactFlow`):

1. **Node State**: All cards are stored as nodes with position, type, and data
2. **Edge State**: Connections between cards stored separately
3. **Board Persistence**: Nodes and edges are serialized to JSON and saved to Supabase
4. **Auto-save**: Implemented via custom `useAutoSave` hook with 2-second debounce

The key pattern: Card components receive callbacks via props (`onNodeDataChange`, `onDeleteNode`) to update the parent ReactFlow state.

### Data Persistence Layer

**Supabase Integration** (`src/lib/supabase-boards.js`):
- `createBoard()` - Creates new board for current user
- `getBoard(boardId)` - Fetches board with all nodes/edges
- `saveBoardContent(boardId, nodes, edges)` - Persists board state (called by auto-save)
- `updateBoardName()` - Renames board
- `deleteBoard()` - Removes board

**Auto-save Flow** (`src/hooks/useAutoSave.js`):
- Monitors `workspaceData` (memoized nodes/edges)
- Debounces save calls (2000ms default)
- Tracks status: idle → saving → saved → error
- Prevents duplicate saves during serialization comparison

### Authentication Context

**AuthContext** (`src/contexts/AuthContext.jsx`):
- Google OAuth via Supabase
- User profile creation/sync with `users` table
- Profile creation retry logic (handles async trigger delays)
- Exports: `user`, `loading`, `bootstrapped`, `signInWithGoogle()`, `logout()`

### Database Schema

See `SUPABASE_SCHEMA_CLEAN.sql` for full schema. Key tables:

- **users**: Extended user profiles (id refs auth.users, display_name, photo_url)
- **boards**: User-owned boards (owner_id, name, nodes JSONB, edges JSONB)
- **RLS Policies**: Owner-only access (no sharing currently enabled)

### Card System

All cards follow a consistent pattern:
1. Extend from base card structure (handles on 4 sides)
2. Use memo() for performance
3. Implement drag handles (`.drag-handle` class)
4. Support read-only mode (`isReadOnly` prop)
5. Receive callbacks: `onNodeDataChange`, `onDeleteNode`, `onAddComment`

**Card Type Details**:
- **StoryCard**: Main narrative element with AI suggestions via external API
- **CharacterCard**: Profile with name, synopsis, birthdate
- **TimelineCard**: Date/time marker
- **LocationCard**: Geographic reference
- **NumberCard**: Numeric values
- **ListCard**: Checkbox lists
- **CommentCard**: Annotations with author metadata
- **TitleCard**: Section headers
- **LinkCard**: URL references with preview
- **ImageCard**: Image uploads (uses board context for storage)

### AI Integration

StoryCard includes "fablebot" AI assistant:
- External API: `https://modern-crashing-finland.mastra.cloud/api/agents/gymAgent/generate`
- Sends all board nodes for context
- Returns suggestions and chat responses
- Daily message limit: 30 per user (localStorage tracked)

### Theme System

**ThemeContext** (`src/contexts/ThemeContext.jsx`):
- Light/dark mode toggle
- Uses `next-themes` for SSR-safe theme persistence
- ReactFlow background adapts colors based on theme

## Key Files to Know

- `src/components/ReactFlowPlanner.jsx` - Main board component (844 lines, all board logic)
- `src/components/StoryCard.jsx` - Primary card type with AI features
- `src/lib/supabase-boards.js` - All database operations
- `src/hooks/useAutoSave.js` - Auto-save implementation
- `src/contexts/AuthContext.jsx` - Authentication state
- `src/app/layout.js` - Root layout with providers
- `src/app/boards/[boardId]/page.jsx` - Dynamic board route

## Import Alias

The project uses `@/*` alias for imports:
```javascript
import { Component } from '@/components/Component'
import { helper } from '@/lib/helper'
```
Configured in `jsconfig.json` with `"@/*": ["./src/*"]`

## Styling

- **Tailwind CSS 4** with custom configuration
- **shadcn/ui** components in `src/components/ui/`
- **Framer Motion** for animations
- **CSS Variables** for theme colors (defined in `globals.css`)

## Important Patterns

### Node Creation Pattern
```javascript
const newNode = {
  id: nodeIdRef.current.toString(),
  type: 'cardType',
  position: { x, y },
  data: { /* card-specific data */ },
  dragHandle: '.drag-handle',
};
setNodes((nds) => [...nds, newNode]);
nodeIdRef.current += 1;
```

### Permission System
Currently supports owner-only access:
- `getBoardPermission(board, userId)` returns 'owner' or null
- Read-only mode support exists in UI (for future sharing feature)
- Cards check `data.isReadOnly` to disable editing

### Data Serialization
Before saving, all nodes/edges are cleaned:
```javascript
const cleanNodes = nodes.map(({ id, type, position, data }) => {
  const { onAddComment, isReadOnly, isBoardOwner,
          onEditingChange, onNodeDataChange, onDeleteNode, ...cleanData } = data || {};
  return { id, type, position, data: cleanData };
});
```

## Testing Notes

- No test files currently in codebase
- Consider adding tests for:
  - Node creation/deletion operations
  - Auto-save debounce behavior
  - Supabase data persistence
  - Card data serialization/deserialization

## Known Limitations

- Sharing feature disabled (UI exists but backend no-op)
- Collaboration/realtime features removed
- 4MB payload size limit for board saves
- 15-second timeout on save operations
- AI daily message limit: 30 per user

## Board Size Considerations

Large boards may hit limits:
- Max payload: 4MB (enforced in `saveBoardContent`)
- Save timeout: 15 seconds
- Consider splitting very large boards into multiple boards
