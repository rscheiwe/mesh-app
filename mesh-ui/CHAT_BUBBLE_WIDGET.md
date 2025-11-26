# Chat Bubble Widget Integration

**Date:** November 25, 2025
**Status:** ✅ Complete (Ready for Testing)

## Overview

Integrated the `ChatBubbleWidget` component from llm-platform into mesh-app, adapted to work with Mesh graph execution instead of the Mosaic API.

## Files Created

### 1. `src/components/ChatBubbleWidget.tsx`

**Purpose:** Reusable chat bubble widget component with floating UI

**Features:**
- Floating chat bubble button with customizable position and size
- Expandable chat window with configurable dimensions
- Fullscreen mode with backdrop
- Auto-open capability with configurable delay
- Tooltip with auto-hide
- Customizable theme (colors, sizes, positioning)
- Footer support for custom messages/links
- Smooth animations using `motion/react` (framer-motion v12)

**Configuration:**
```typescript
{
  theme: {
    accentColor: string;          // Primary color
    button: {
      right: number;              // Distance from right (px)
      bottom: number;             // Distance from bottom (px)
      size: number;               // Button size (px)
      iconColor: string;          // Icon color
    };
    window: {
      title: string;              // Window header title
      width: number;              // Window width (px)
      height: number;             // Window height (px)
      showTitle: boolean;         // Show/hide header
    };
    tooltip: {
      show: boolean;              // Show tooltip
      message: string;            // Tooltip text
    };
  };
  autoOpen: {
    enabled: boolean;             // Auto-open on load
    delay: number;                // Delay before opening (ms)
  };
  footer: {
    text: string;                 // Footer text
    link: string;                 // Footer link URL
    linkText: string;             // Footer link text
  };
}
```

### 2. `src/components/ChatBubbleMeshChat.tsx`

**Purpose:** Chat interface using `useChat` hook from `@ai-sdk/react`

**Key Architecture:**
- Uses `useChat` hook for message management
- Custom `MeshGraphTransport` adapter for graph execution
- Converts SSE events from graph API to AI SDK format
- Backend-agnostic design (can be swapped for agent streaming)

**Features:**
- Message history with user/assistant roles
- Streaming graph execution via custom transport
- Real-time event handling from graph execution
- Auto-scrolling to latest message
- Loading states and error handling
- Integration with Zustand graph store

**How it Works:**
1. User types a message
2. `sendMessage()` from useChat is called
3. `MeshGraphTransport` receives message
4. Current graph state (nodes + edges) converted to flow format
5. Graph executed via `/api/execution/execute` endpoint
6. SSE events converted to AI SDK format (`text-delta`, `finish`, `error`)
7. useChat automatically updates message state
8. Assistant responses built incrementally from text-delta events

**Custom Transport:**
```typescript
class MeshGraphTransport extends DefaultChatTransport {
  async *sendMessages({ messages }): AsyncGenerator<any> {
    // 1. Prepare request with graph data
    // 2. Execute graph via fetch
    // 3. Parse SSE stream
    // 4. Convert to AI SDK events
    yield { type: 'text-delta', textDelta: '...' };
    yield { type: 'finish', finishReason: 'stop' };
  }
}
```

**Event Format:**
Mesh events are **AI SDK V5 compatible**!

**Standard AI SDK Events** (handled by useChat automatically):
- `start` - Generation started
- `text-start` - Text block started
- `text-delta` with `delta` field - streaming tokens
- `text-end` - Text block ended
- `tool-input-start` - Tool call started
- `tool-input-delta` - Tool arguments streaming
- `tool-input-available` - Tool ready to execute
- `tool-output-available` - Tool result ready
- `start-step` - Agent step started
- `finish-step` - Agent step finished
- `reasoning-start` - Reasoning started (o1, Claude Extended Thinking)
- `reasoning-delta` - Reasoning streaming
- `reasoning-end` - Reasoning ended
- `finish` with `finishReason` - completion
- `error` - errors

**Mesh-Specific Events** (prefixed with `data-`, handled via `onData` callback):
- `data-execution-start` - Graph execution started
- `data-execution-complete` - Graph execution finished
- `data-node-start` - Node execution started
- `data-node-complete` - Node execution finished
- `data-node-error` - Node error
- `data-state-update` - State changed

**Backend Endpoint (`/api/chat/stream`):**
- Passes through all Mesh events as-is (already AI SDK compatible!)
- Converts `data-execution-complete` → also sends `finish` event
- Converts `data-execution-error` → also sends `error` event
- Sends `[DONE]` marker at end

### 3. `src/components/ChatBubble.tsx` (Updated)

**Changes:**
- Added imports for `ChatBubbleWidget` and `ChatBubbleMeshChat`
- Added `USE_NEW_WIDGET` flag for easy toggling
- When `USE_NEW_WIDGET = true`, uses new widget
- When `USE_NEW_WIDGET = false`, uses old implementation
- Backward compatible - no breaking changes

## Key Differences from llm-platform Version

### Removed Dependencies
❌ **Removed:**
- `useKnowledgeCenter` hook (document/folder context)
- `useAgentConfig` hook (active workspace agent)
- `prepareMosaicRequest` function (Mosaic API format)
- Context banners (document/folder/agent flow)
- All Mosaic-specific API formatting

### Added Integration
✅ **Added:**
- Integration with `useGraphStore` (Zustand)
- Graph-to-flow conversion
- Mesh API execution (`executeGraph`)
- SSE event stream handling
- Session management

### Simplified UI
- No document/folder context display
- No agent flow banner
- Focused on graph execution
- Cleaner message display

## Migration from llm-platform

### Original Structure (llm-platform)
```
ChatBubbleWidget (container)
  ↓
ChatBubbleAgentWorkspace (content)
  ↓
useKnowledgeCenter + useAgentConfig (context)
  ↓
prepareMosaicRequest (API formatting)
  ↓
Mosaic API (/api/v1/mock/generate-answer-experimental)
```

### New Structure (mesh-app)
```
ChatBubbleWidget (container)
  ↓
ChatBubbleMeshChat (content)
  ↓
useGraphStore (graph state)
  ↓
executeGraph (Mesh API)
  ↓
Mesh API (/api/execution/execute)
```

## Usage

### Enable New Widget
```typescript
// In src/components/ChatBubble.tsx
const USE_NEW_WIDGET = true;
```

### Example Configuration
```typescript
<ChatBubbleWidget
  config={{
    theme: {
      accentColor: "#004b7a",
      button: {
        right: 24,
        bottom: 24,
        size: 60,
      },
      window: {
        title: "Mesh Chat",
        width: 400,
        height: 650,
      },
      tooltip: {
        show: true,
        message: "Chat with your Mesh graph! 🤖",
      },
    },
    footer: {
      text: "Powered by Mesh",
    },
  }}
>
  <ChatBubbleMeshChat />
</ChatBubbleWidget>
```

## Testing Instructions

### 1. Start Backend
```bash
cd /Users/richard.s/mesh-app/backend
uvicorn backend.main:app --reload
```

### 2. Start Frontend
```bash
cd /Users/richard.s/mesh-app/mesh-ui
npm run dev
```

### 3. Test New Widget

1. **Enable new widget:**
   - Open `src/components/ChatBubble.tsx`
   - Set `USE_NEW_WIDGET = true`

2. **Create a simple graph:**
   - Open Mesh UI (http://localhost:5173)
   - Add Start → Agent → End nodes
   - Configure agent with model/provider

3. **Test chat:**
   - Click floating chat bubble (bottom-right)
   - Type a message
   - Verify graph executes
   - Check streaming response

4. **Test features:**
   - Fullscreen mode (maximize button)
   - Close/reopen
   - Multiple messages
   - Error handling (try invalid graph)

### 4. Revert to Old Widget

```typescript
const USE_NEW_WIDGET = false;
```

## API Contract

### Request Format
```typescript
{
  flow: {
    nodes: Array<{
      id: string;
      type: string;
      data: any;
      position: { x: number; y: number };
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      sourceHandle?: string;
      targetHandle?: string;
    }>;
  };
  input: string;
  session_id?: string;
}
```

### Response Events (SSE)
```typescript
{
  type: "node-start" | "node-output" | "content" | "complete" | "error";
  node_id?: string;
  content?: string;
  output?: any;
  error?: string;
  timestamp?: string;
}
```

## Future Enhancements

### 1. Message Persistence
- Save chat history to localStorage
- Restore previous conversations
- Clear history button

### 2. Graph Context Display
- Show which graph is being executed
- Display graph name/ID in header
- Link to open graph in canvas

### 3. Rich Content Support
- Markdown rendering (add react-markdown)
- Code syntax highlighting
- Image/file attachments

### 4. Tool Call Visualization
- Show tool invocations like llm-platform
- Display chain of thought steps
- Collapsible tool details

### 5. Model Selection
- Dropdown to select model
- Toggle web search
- Temperature control

### 6. Export/Share
- Export conversation
- Share chat link
- Copy conversation to clipboard

## Dependencies

**Already Installed:**
- `motion` (^12.23.24) - For animations
- `lucide-react` (^0.446.0) - For icons
- `@ai-sdk/react` (^2.0.76) - AI chat hooks (not used yet)

**Not Installed (Optional):**
- `react-markdown` - For rich text rendering
- `react-syntax-highlighter` - Already installed for code highlighting

## Backward Compatibility

✅ **No Breaking Changes**
- Old `ChatBubble` still works by default
- Feature flag controls which implementation
- Can be toggled at runtime (just change flag)
- No API changes required

## Complete Event Flow Example

```
Graph Execution with Agent Using Tools:

data-execution-start        → onData (Mesh: graph started)
data-node-start            → onData (Mesh: Start node)
data-node-complete         → onData (Mesh: Start node done)
data-node-start            → onData (Mesh: Agent node started)
start                      → useChat (AI SDK: generation started)
start-step                 → useChat (AI SDK: agent step started)
text-start                 → useChat (AI SDK: text block started)
text-delta                 → useChat (AI SDK: "I")
text-delta                 → useChat (AI SDK: " will")
text-delta                 → useChat (AI SDK: " search")
text-end                   → useChat (AI SDK: text block ended)
tool-input-start           → useChat (AI SDK: calling web_search)
tool-input-delta           → useChat (AI SDK: tool args streaming)
tool-input-available       → useChat (AI SDK: tool ready)
tool-output-available      → useChat (AI SDK: tool result)
text-start                 → useChat (AI SDK: final response text)
text-delta                 → useChat (AI SDK: "Based")
text-delta                 → useChat (AI SDK: " on")
text-delta                 → useChat (AI SDK: " my")
text-delta                 → useChat (AI SDK: " search...")
text-end                   → useChat (AI SDK: text block ended)
finish-step                → useChat (AI SDK: agent step complete)
finish                     → useChat (AI SDK: generation complete)
data-node-complete         → onData (Mesh: Agent node done)
data-execution-complete    → onData (Mesh: graph complete) + finish
[DONE]                     → Stream ends
```

**Key Points:**
- **Standard AI SDK events** are clean - only include AI SDK specified fields
- **No extra metadata** on standard events (timestamp, node_id) - keeps validation happy
- **Mesh orchestration metadata** is in `data-*` events via `onData` callback:
  - `data-execution-start` - has timestamp, graph_id, trace_id
  - `data-node-start` - has timestamp, node_id, node_type, metadata
  - `data-node-complete` - has timestamp, node_id, output preview
- **Use `data-*` events for tracking** which node is running, execution progress, etc.
- **UI updates automatically** from standard events (text streaming, tool calls, steps)

## Using useChat with Different Backends

The key innovation is using `useChat` from `@ai-sdk/react` with custom transports. This makes the frontend component backend-agnostic.

### Current Implementation: Graph Execution
```typescript
class MeshGraphTransport extends DefaultChatTransport {
  async *sendMessages({ messages }): AsyncGenerator<any> {
    // Execute graph with current nodes/edges
    // Convert SSE events to AI SDK format
    yield { type: 'text-delta', textDelta: '...' };
    yield { type: 'finish', finishReason: 'stop' };
  }
}

const transport = new MeshGraphTransport(nodes, edges);
const { messages, sendMessage } = useChat({ transport });
```

### Alternative: Agent Streaming (Like llm-platform)
```typescript
const transport = new DefaultChatTransport({
  api: `${API_URL}/api/chat/agent-stream`,
  prepareSendMessagesRequest: ({ messages }) => ({
    body: {
      messages: convertToModelMessages(messages),
      chat_id: chatId,
      user_id: userId,
      // ...other config
    }
  })
});
const { messages, sendMessage } = useChat({ transport });
```

### Alternative: Mosaic API Format
```typescript
const transport = new DefaultChatTransport({
  api: `${TABOOLABOT_API_URL}/api/v1/mock/generate-answer-experimental`,
  prepareSendMessagesRequest: ({ id, messages }) => ({
    body: {
      chat: {
        content: extractLatestMessage(messages),
        history: convertHistory(messages),
        messages: convertToModelMessages(messages),
        chatId: id,
        // ...other config
      },
      rag_config: { /* ... */ },
      tool_config: { /* ... */ },
    }
  })
});
const { messages, sendMessage } = useChat({ transport });
```

**Key Benefits:**
1. **Same UI, Different Backends** - Swap transport, keep UI unchanged
2. **Standard AI SDK Events** - All transports yield same event types
3. **Message Management** - useChat handles state, streaming, history
4. **Type Safety** - Full TypeScript support

## Architecture Comparison

### Old Approach (Custom State Management)
```typescript
// Manual message state
const [messages, setMessages] = useState([]);
const [isExecuting, setIsExecuting] = useState(false);

// Manual event handling
await executeGraph({ flow, input }, (event) => {
  if (event.type === 'token') {
    setMessages(prev => updateLastMessage(prev, event.content));
  }
});
```

### New Approach (useChat Hook)
```typescript
// Automatic message state + streaming
const { messages, sendMessage, status } = useChat({ transport });

// Transport handles event conversion
class CustomTransport {
  async *sendMessages() {
    // Convert backend events → AI SDK events
    yield { type: 'text-delta', textDelta: '...' };
  }
}
```

## Summary

✅ **ChatBubbleWidget component created** - Reusable floating chat UI
✅ **ChatBubbleMeshChat refactored** - Now uses useChat hook
✅ **MeshGraphTransport created** - Custom transport for graph execution
✅ **ChatBubble updated** - Feature flag for easy toggling
✅ **Backend-agnostic architecture** - Easy to swap between graph/agent/chat APIs
✅ **Backward compatible** - No breaking changes
✅ **Uses AI SDK properly** - Following llm-platform patterns

**Status: Ready for End-to-End Testing** 🎉
