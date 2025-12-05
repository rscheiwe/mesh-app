import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Loader2, Bot, User, ChevronDown, ChevronRight, CheckCircle2, Circle, Loader } from "lucide-react";
import { useGraphStore } from "@/store/graph";

// Types for node execution tracking
interface NodeExecution {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: "pending" | "streaming" | "complete" | "error";
  content: string;
  metadata?: Record<string, any>;
  timestamp: string;
  error?: string;
  // Structured output support
  structuredOutput?: {
    mode: "array" | "object" | null;
    elements: any[]; // For array mode - validated elements as they stream
    partial: Record<string, any> | null; // For object mode - partial object updates
    complete: any; // Final validated output
  };
}

interface GraphExecution {
  isActive: boolean;
  traceId: string | null;
  nodeExecutions: NodeExecution[];
}

/**
 * ChatBubbleMeshChat - Chat interface using useChat hook
 *
 * Uses DefaultChatTransport with custom request preparation
 * to execute Mesh graphs via the execution API
 */

// Get API URL from environment
const API_URL = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Creates a custom transport that intercepts text-delta events
 * and routes them to the correct node based on data-node-start/complete events
 */
function createNodeAwareTransport(options: {
  api: string;
  headers?: Record<string, string>;
  prepareSendMessagesRequest: (params: { messages: any[] }) => { body: any };
  onTextDelta: (nodeId: string | null, delta: string) => void;
  onDataEvent: (data: any) => void;
}) {
  let currentNodeId: string | null = null;

  return new DefaultChatTransport({
    api: options.api,
    headers: options.headers,
    prepareSendMessagesRequest: options.prepareSendMessagesRequest,
    // Use fetch override to intercept the stream
    fetch: async (url, init) => {
      const response = await fetch(url, init);

      if (!response.body) {
        return response;
      }

      // Create a transform stream that intercepts events
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const stream = new ReadableStream({
        async start(controller) {
          let buffer = "";

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                break;
              }

              // Pass through the raw bytes
              controller.enqueue(value);

              // Also parse for our interception
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6).trim();
                  if (data === "[DONE]") continue;

                  try {
                    const parsed = JSON.parse(data);

                    // Track node changes
                    if (parsed.type === "data-node-start") {
                      const nodeId = parsed.data?.node_id;
                      if (nodeId && nodeId !== "START") {
                        currentNodeId = nodeId;
                      }
                    } else if (
                      parsed.type === "data-node-complete" ||
                      parsed.type === "data-node-error"
                    ) {
                      currentNodeId = null;
                    }

                    // Intercept text-delta events
                    if (parsed.type === "text-delta") {
                      options.onTextDelta(currentNodeId, parsed.delta);
                    }

                    // Forward data events
                    if (parsed.type?.startsWith("data-")) {
                      options.onDataEvent(parsed);
                    }
                  } catch {
                    // Skip malformed JSON
                  }
                }
              }
            }
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      });
    },
  });
}

/**
 * Prepares request body for Mesh graph execution API
 * This is called by DefaultChatTransport before sending the request
 */
const prepareMeshGraphRequest = ({
  messages,
  nodes,
  edges,
}: {
  messages: any[];
  nodes: any[];
  edges: any[];
}) => {
  // Get the most recent message
  const mostRecentMessage = messages[messages.length - 1];

  // Extract text from the most recent message
  const userInput =
    mostRecentMessage?.parts?.find((part: any) => part.type === "text")?.text ||
    "";

  // Convert graph to flow format (same as toFlowJson())
  // Filter out sticky notes - they are visual annotations only, not executable nodes
  const executableNodes = nodes.filter(
    (node) => !node.type?.toLowerCase().includes("stickynote")
  );

  const flow = {
    nodes: executableNodes.map((node) => {
      // Extract config from node.data.config and flatten to inputs
      const inputs = Object.entries(node.data.config || {}).reduce(
        (acc, [key, value]) => {
          acc[key] = value;
          return acc;
        },
        {} as Record<string, any>
      );

      return {
        id: node.id,
        type: node.type || "generic",
        position: node.position,
        data: {
          name: node.type || "generic",
          label: node.data.defName || node.type,
          inputs: inputs,
        },
      };
    }),
    // Filter edges to only include those between executable nodes
    edges: edges
      .filter((edge) => {
        const executableNodeIds = new Set(executableNodes.map((n) => n.id));
        return (
          executableNodeIds.has(edge.source) && executableNodeIds.has(edge.target)
        );
      })
      .map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      })),
  };

  return {
    body: {
      flow,
      input: userInput,
      session_id: `session-${Date.now()}`,
    },
  };
};

export default function ChatBubbleMeshChat() {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Get current graph state from zustand store
  const { nodes, edges } = useGraphStore();

  // Track graph executions per execution ID for historical rendering
  const [graphExecutions, setGraphExecutions] = useState<
    Map<string, GraphExecution>
  >(new Map());

  // Track the current execution ID (from data-execution-start trace_id)
  const currentExecutionIdRef = useRef<string | null>(null);

  // Map execution IDs to message IDs for rendering
  const [executionToMessageMap, setExecutionToMessageMap] = useState<
    Map<string, string>
  >(new Map());

  // Track current streaming node for text-delta accumulation
  const currentStreamingNodeRef = useRef<string | null>(null);

  // Track waiting state (after submit, before first event)
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [preparingStatus, setPreparingStatus] = useState<string | null>(null);

  // Helper to update graphExecution for current execution
  const updateCurrentGraphExecution = useCallback(
    (updater: (prev: GraphExecution) => GraphExecution) => {
      const executionId = currentExecutionIdRef.current;
      if (!executionId) return;

      setGraphExecutions((prev) => {
        const next = new Map(prev);
        const current = next.get(executionId) || {
          isActive: false,
          traceId: null,
          nodeExecutions: [],
        };
        next.set(executionId, updater(current));
        return next;
      });
    },
    []
  );

  // Handle custom data events from the stream
  const handleData = useCallback(
    (data: any) => {
      const eventType = data.type;

      switch (eventType) {
        case "data-preparing":
          // Server is preparing - show status
          setPreparingStatus(data.data?.status || "Preparing...");
          break;

        case "data-execution-start":
          // Graph execution started - use trace_id as execution ID
          const traceId = data.data?.metadata?.trace_id || crypto.randomUUID();
          currentExecutionIdRef.current = traceId;
          currentStreamingNodeRef.current = null;

          // Update status - keep showing until first node starts
          setPreparingStatus("Starting execution...");

          // Initialize execution state
          setGraphExecutions((prev) => {
            const next = new Map(prev);
            next.set(traceId, {
              isActive: true,
              traceId: traceId,
              nodeExecutions: [],
            });
            return next;
          });
          break;

        case "data-node-start":
          // A node started executing
          const nodeId = data.data?.node_id;
          const nodeType = data.data?.metadata?.node_type || "unknown";
          const agentId = data.data?.metadata?.agent_id;

          // Skip START node as it's internal
          if (nodeId === "START") break;

          // First real node starting - hide loading indicators
          setIsWaitingForResponse(false);
          setPreparingStatus(null);

          currentStreamingNodeRef.current = nodeId;

          updateCurrentGraphExecution((prev) => ({
            ...prev,
            nodeExecutions: [
              ...prev.nodeExecutions,
              {
                nodeId,
                nodeName: agentId || nodeId,
                nodeType,
                status: "streaming",
                content: "",
                metadata: data.data?.metadata,
                timestamp: data.data?.timestamp,
              },
            ],
          }));
          break;

        case "data-node-complete":
          // A node completed - update with final output
          const completedNodeId = data.data?.node_id;
          const output = data.data?.output;

          // Skip START node
          if (completedNodeId === "START") break;

          currentStreamingNodeRef.current = null;

          updateCurrentGraphExecution((prev) => ({
            ...prev,
            nodeExecutions: prev.nodeExecutions.map((node) =>
              node.nodeId === completedNodeId
                ? {
                    ...node,
                    status: "complete" as const,
                    content: output?.content || JSON.stringify(output) || "",
                    metadata: { ...node.metadata, ...data.data?.metadata },
                  }
                : node
            ),
          }));
          break;

        case "data-node-error":
          // A node errored
          const errorNodeId = data.data?.node_id;
          currentStreamingNodeRef.current = null;

          updateCurrentGraphExecution((prev) => ({
            ...prev,
            nodeExecutions: prev.nodeExecutions.map((node) =>
              node.nodeId === errorNodeId
                ? {
                    ...node,
                    status: "error" as const,
                    error: data.data?.errorText || "Unknown error",
                  }
                : node
            ),
          }));
          break;

        case "data-execution-complete":
          // Graph execution finished
          setIsWaitingForResponse(false);
          updateCurrentGraphExecution((prev) => ({
            ...prev,
            isActive: false,
          }));
          break;

        case "data-execution-error":
          // Graph execution errored
          setIsWaitingForResponse(false);
          updateCurrentGraphExecution((prev) => ({
            ...prev,
            isActive: false,
          }));
          break;

        // Structured output streaming events (can come as data-custom with data_type metadata)
        case "data-custom":
          // Handle wrapped structured output events from mesh backend
          const customDataType = data.data?.metadata?.data_type;
          const customNodeId = data.data?.node_id || currentStreamingNodeRef.current;
          const customContent = data.data?.content;

          if (customDataType === "data-object-element" && customNodeId) {
            // Array mode: a validated element has been received
            const element = customContent?.element;

            updateCurrentGraphExecution((prev) => ({
              ...prev,
              nodeExecutions: prev.nodeExecutions.map((node) =>
                node.nodeId === customNodeId
                  ? {
                      ...node,
                      structuredOutput: {
                        mode: "array",
                        elements: [
                          ...(node.structuredOutput?.elements || []),
                          element,
                        ],
                        partial: null,
                        complete: node.structuredOutput?.complete,
                      },
                    }
                  : node
              ),
            }));
          } else if (customDataType === "data-object-partial" && customNodeId) {
            // Object mode: partial object update
            const partial = customContent?.partial;

            updateCurrentGraphExecution((prev) => ({
              ...prev,
              nodeExecutions: prev.nodeExecutions.map((node) =>
                node.nodeId === customNodeId
                  ? {
                      ...node,
                      structuredOutput: {
                        mode: "object",
                        elements: node.structuredOutput?.elements || [],
                        partial: partial,
                        complete: node.structuredOutput?.complete,
                      },
                    }
                  : node
              ),
            }));
          } else if (customDataType === "data-object-complete" && customNodeId) {
            // Final validated structured output
            const completeObject = customContent?.object;
            const outputMode = customContent?.mode; // 'array' or 'object'

            updateCurrentGraphExecution((prev) => ({
              ...prev,
              nodeExecutions: prev.nodeExecutions.map((node) =>
                node.nodeId === customNodeId
                  ? {
                      ...node,
                      structuredOutput: {
                        mode: outputMode,
                        elements: node.structuredOutput?.elements || [],
                        partial: null,
                        complete: completeObject,
                      },
                    }
                  : node
              ),
            }));
          }
          break;

        // Direct structured output events (for future/alternative implementations)
        case "data-object-element":
          // Array mode: a validated element has been received
          const elementNodeId = currentStreamingNodeRef.current;
          if (elementNodeId) {
            const element = data.data?.element;

            updateCurrentGraphExecution((prev) => ({
              ...prev,
              nodeExecutions: prev.nodeExecutions.map((node) =>
                node.nodeId === elementNodeId
                  ? {
                      ...node,
                      structuredOutput: {
                        mode: "array",
                        elements: [
                          ...(node.structuredOutput?.elements || []),
                          element,
                        ],
                        partial: null,
                        complete: node.structuredOutput?.complete,
                      },
                    }
                  : node
              ),
            }));
          }
          break;

        case "data-object-partial":
          // Object mode: partial object update
          const partialNodeId = currentStreamingNodeRef.current;
          if (partialNodeId) {
            const partial = data.data?.partial;

            updateCurrentGraphExecution((prev) => ({
              ...prev,
              nodeExecutions: prev.nodeExecutions.map((node) =>
                node.nodeId === partialNodeId
                  ? {
                      ...node,
                      structuredOutput: {
                        mode: "object",
                        elements: node.structuredOutput?.elements || [],
                        partial: partial,
                        complete: node.structuredOutput?.complete,
                      },
                    }
                  : node
              ),
            }));
          }
          break;

        case "data-object-complete":
          // Final validated structured output
          const completeNodeId = currentStreamingNodeRef.current;
          if (completeNodeId) {
            const completeObject = data.data?.object;
            const outputMode = data.data?.mode; // 'array' or 'object'

            updateCurrentGraphExecution((prev) => ({
              ...prev,
              nodeExecutions: prev.nodeExecutions.map((node) =>
                node.nodeId === completeNodeId
                  ? {
                      ...node,
                      structuredOutput: {
                        mode: outputMode,
                        elements: node.structuredOutput?.elements || [],
                        partial: null,
                        complete: completeObject,
                      },
                    }
                  : node
              ),
            }));
          }
          break;

      }
    },
    [updateCurrentGraphExecution]
  );

  // Handle text delta events - stream text into the current node
  const handleTextDelta = useCallback(
    (nodeId: string | null, delta: string) => {
      if (!nodeId || !delta) return;

      // Update the streaming node ref
      currentStreamingNodeRef.current = nodeId;

      updateCurrentGraphExecution((prev) => ({
        ...prev,
        nodeExecutions: prev.nodeExecutions.map((node) =>
          node.nodeId === nodeId
            ? {
                ...node,
                content: node.content + delta,
              }
            : node
        ),
      }));
    },
    [updateCurrentGraphExecution]
  );

  // Create transport with node-aware streaming
  // This intercepts text-delta events and routes them to the correct node
  const transport = useMemo(
    () =>
      createNodeAwareTransport({
        api: `${API_URL}/api/chat/stream`,
        headers: {
          "Content-Type": "application/json",
        },
        prepareSendMessagesRequest: ({ messages }) =>
          prepareMeshGraphRequest({ messages, nodes, edges }),
        onTextDelta: handleTextDelta,
        onDataEvent: handleData,
      }),
    [nodes, edges, handleTextDelta, handleData]
  );

  // Use AI SDK useChat hook
  // Note: We don't use onData here because our custom transport
  // already intercepts and routes data events to handleData
  const { messages, sendMessage, status, error } = useChat({
    transport,
    onError: (error) => {
      console.error("Chat error:", error);
      // Reset waiting state on error
      setIsWaitingForResponse(false);
      setPreparingStatus(null);
    },
  });

  // Map execution ID to message ID when assistant message appears
  useEffect(() => {
    if (status === "streaming" && messages.length > 0 && currentExecutionIdRef.current) {
      // Find the latest assistant message
      const lastAssistantMessage = [...messages]
        .reverse()
        .find((m) => m.role === "assistant");
      if (lastAssistantMessage) {
        const executionId = currentExecutionIdRef.current;
        setExecutionToMessageMap((prev) => {
          if (prev.get(executionId) === lastAssistantMessage.id) return prev;
          const next = new Map(prev);
          next.set(executionId, lastAssistantMessage.id);
          return next;
        });
      }
    }
  }, [status, messages]);

  // Auto-scroll when messages change or waiting state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status, isWaitingForResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || status === "streaming") return;

    // Validate we have nodes
    if (nodes.length === 0) {
      console.warn("No nodes in graph");
      return;
    }

    // Show loading indicator immediately - before any events arrive
    setIsWaitingForResponse(true);
    setPreparingStatus(null);

    // Note: No need to reset graphExecutions - each message gets its own entry in the Map
    // The new message's graphExecution will be created when data-execution-start is received

    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Scrollable message area */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        style={{ overscrollBehavior: "contain" }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <div className="text-4xl">👋</div>
            <div className="space-y-1">
              <p className="font-semibold text-gray-900">
                Welcome to Mesh Chat
              </p>
              <p className="text-sm text-gray-600 max-w-sm">
                {nodes.length === 0
                  ? "Add nodes to your graph to get started"
                  : "Chat with your Mesh graph. Your messages will be executed through the current graph configuration."}
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => {
          // Get the full text content from useChat
          const fullTextContent =
            message.parts
              ?.filter((part) => part.type === "text")
              .map((part) => part.text)
              .join("") || "";

          // Find execution ID for this message
          let executionIdForMessage: string | undefined;
          executionToMessageMap.forEach((msgId, execId) => {
            if (msgId === message.id) {
              executionIdForMessage = execId;
            }
          });

          // Get graph execution for this message (if any)
          const messageGraphExecution = executionIdForMessage
            ? graphExecutions.get(executionIdForMessage)
            : undefined;
          const hasNodeExecutions =
            messageGraphExecution &&
            messageGraphExecution.nodeExecutions.length > 0;
          const isThisMessageStreaming =
            status === "streaming" &&
            executionIdForMessage === currentExecutionIdRef.current;

          return (
            <div key={message.id} className="space-y-1">
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Bot className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                </div>

                <div className="flex-1 max-w-[80%]">
                  {/* User message */}
                  {message.role === "user" && (
                    <div className="bg-blue-600 text-white rounded-lg px-4 py-2">
                      <p className="text-sm whitespace-pre-wrap">
                        {fullTextContent}
                      </p>
                    </div>
                  )}

                  {/* Assistant message - use node-based rendering for graph executions */}
                  {message.role === "assistant" && (
                    <>
                      {/* Show node-based rendering if we have node executions */}
                      {hasNodeExecutions ? (
                        <NodeExecutionRenderer
                          nodeExecutions={messageGraphExecution.nodeExecutions}
                          isStreaming={isThisMessageStreaming}
                        />
                      ) : isThisMessageStreaming ? (
                        /* Loading state while waiting for nodes */
                        <div className="bg-gray-100 rounded-lg px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            <span className="text-sm text-gray-600">
                              Starting graph execution...
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* Fallback to standard text rendering for non-graph responses */
                        <div className="bg-gray-100 rounded-lg px-4 py-2">
                          <p className="text-sm whitespace-pre-wrap text-gray-900">
                            {fullTextContent || "..."}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading indicator - shown immediately after submit, before events arrive */}
        {(isWaitingForResponse || preparingStatus) && (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                <Bot className="w-4 h-4 text-gray-600" />
              </div>
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-gray-600">
                  {preparingStatus || "Connecting..."}
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8" />
            <div className="bg-red-100 rounded-lg px-4 py-2 text-red-900 text-sm">
              Error: {error.message || "Something went wrong"}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Fixed input area */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              nodes.length === 0
                ? "Add nodes to your graph first..."
                : "Type your message..."
            }
            disabled={nodes.length === 0 || status === "streaming"}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={
              !input.trim() || nodes.length === 0 || status === "streaming"
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {status === "streaming" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * NodeContentRenderer - Intelligently renders node output content
 * Detects JSON/code and formats appropriately with syntax highlighting
 * Now also handles structured output streaming (arrays and objects)
 */
function NodeContentRenderer({
  content,
  nodeType,
  structuredOutput,
}: {
  content: string;
  nodeType: string;
  structuredOutput?: NodeExecution["structuredOutput"];
}) {
  // Check if content looks like JSON or code
  const isCodeLike = (str: string): boolean => {
    const trimmed = str.trim();
    // Check for JSON objects/arrays
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      return true;
    }
    // Check for common code patterns
    if (
      trimmed.includes("def ") ||
      trimmed.includes("function ") ||
      trimmed.includes("class ") ||
      trimmed.includes("import ") ||
      trimmed.includes("const ") ||
      trimmed.includes("let ") ||
      trimmed.includes("var ")
    ) {
      return true;
    }
    return false;
  };

  // Try to parse and pretty-print JSON
  const formatContent = (str: string): { formatted: string; isJson: boolean } => {
    const trimmed = str.trim();
    try {
      const parsed = JSON.parse(trimmed);
      return {
        formatted: JSON.stringify(parsed, null, 2),
        isJson: true,
      };
    } catch {
      return {
        formatted: str,
        isJson: false,
      };
    }
  };

  // If we have structured output, render it specially
  if (structuredOutput && (structuredOutput.complete || structuredOutput.elements.length > 0 || structuredOutput.partial)) {
    return (
      <StructuredOutputRenderer structuredOutput={structuredOutput} />
    );
  }

  // Tool nodes typically output JSON/code
  const shouldTreatAsCode = nodeType === "tool" || isCodeLike(content);
  const { formatted, isJson } = shouldTreatAsCode
    ? formatContent(content)
    : { formatted: content, isJson: false };

  // Render code/JSON in a code block
  if (shouldTreatAsCode || isJson) {
    return (
      <div className="relative">
        <pre className="text-xs bg-gray-50 rounded-md p-3 overflow-x-auto max-h-64 overflow-y-auto">
          <code className="text-gray-800 whitespace-pre">{formatted}</code>
        </pre>
      </div>
    );
  }

  // Render regular text content
  return (
    <div className="text-sm text-gray-700 whitespace-pre-wrap">{content}</div>
  );
}

/**
 * StructuredOutputRenderer - Renders structured output from agents
 * Handles both array mode (cards for each element) and object mode (key-value display)
 */
function StructuredOutputRenderer({
  structuredOutput,
}: {
  structuredOutput: NonNullable<NodeExecution["structuredOutput"]>;
}) {
  const { mode, elements, partial, complete } = structuredOutput;

  // Determine what to render
  const dataToRender = complete || (mode === "array" ? elements : partial);

  if (!dataToRender) {
    return (
      <div className="text-sm text-gray-400 italic">
        Waiting for structured output...
      </div>
    );
  }

  // Array mode: render as cards
  if (mode === "array" && Array.isArray(dataToRender)) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
            Structured Output
          </span>
          <span>{dataToRender.length} items</span>
          {!complete && (
            <span className="flex items-center gap-1 text-blue-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              streaming...
            </span>
          )}
        </div>
        <div className="grid gap-3">
          {dataToRender.map((item, index) => (
            <StructuredOutputCard key={index} data={item} index={index} />
          ))}
        </div>
      </div>
    );
  }

  // Object mode: render as key-value pairs
  if (mode === "object" && typeof dataToRender === "object") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
            Structured Output
          </span>
          {!complete && partial && (
            <span className="flex items-center gap-1 text-blue-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              streaming...
            </span>
          )}
        </div>
        <StructuredOutputCard data={dataToRender} />
      </div>
    );
  }

  // Fallback: render as JSON
  return (
    <div className="relative">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
          Structured Output
        </span>
      </div>
      <pre className="text-xs bg-gray-50 rounded-md p-3 overflow-x-auto max-h-64 overflow-y-auto">
        <code className="text-gray-800 whitespace-pre">
          {JSON.stringify(dataToRender, null, 2)}
        </code>
      </pre>
    </div>
  );
}

/**
 * StructuredOutputCard - Renders a single structured output object as a card
 */
function StructuredOutputCard({
  data,
  index,
}: {
  data: Record<string, any>;
  index?: number;
}) {
  // Get a "title" field if one exists (common patterns: name, title, id)
  const titleField = data.name || data.title || data.label || data.id;

  // Get other fields to display
  const entries = Object.entries(data).filter(
    ([key]) => !["name", "title", "label", "id"].includes(key) || !titleField
  );

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white hover:border-gray-300 transition-colors">
      {/* Header with index and title */}
      <div className="flex items-start gap-2 mb-2">
        {index !== undefined && (
          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs font-medium text-gray-600">
            {index + 1}
          </span>
        )}
        {titleField && (
          <span className="font-medium text-gray-900 text-sm">{String(titleField)}</span>
        )}
      </div>

      {/* Field values */}
      <div className="space-y-1.5 pl-8">
        {entries.map(([key, value]) => (
          <div key={key} className="flex gap-2 text-sm">
            <span className="text-gray-500 min-w-[80px] flex-shrink-0">
              {formatFieldName(key)}:
            </span>
            <span className="text-gray-800">
              {formatFieldValue(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper to format field names (snake_case -> Title Case)
function formatFieldName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// Helper to format field values
function formatFieldValue(value: any): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * NodeExecutionRenderer - Renders node executions for graph-based responses
 * Shows each node's output in a collapsible section with status indicators
 */
function NodeExecutionRenderer({
  nodeExecutions,
  isStreaming,
}: {
  nodeExecutions: NodeExecution[];
  isStreaming: boolean;
}) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Auto-expand all nodes by default
  useEffect(() => {
    setExpandedNodes(new Set(nodeExecutions.map((n) => n.nodeId)));
  }, [nodeExecutions.length]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const getStatusIcon = (status: NodeExecution["status"]) => {
    switch (status) {
      case "streaming":
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case "complete":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "error":
        return <Circle className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getNodeTypeLabel = (nodeType: string) => {
    const typeLabels: Record<string, string> = {
      agent: "Agent",
      llm: "LLM",
      tool: "Tool",
      rag: "RAG",
      data_handler: "Data Handler",
      unknown: "Node",
    };
    return typeLabels[nodeType] || nodeType;
  };

  const getNodeTypeColor = (nodeType: string) => {
    const typeColors: Record<string, string> = {
      agent: "bg-purple-100 text-purple-700 border-purple-200",
      llm: "bg-blue-100 text-blue-700 border-blue-200",
      tool: "bg-orange-100 text-orange-700 border-orange-200",
      rag: "bg-green-100 text-green-700 border-green-200",
      data_handler: "bg-yellow-100 text-yellow-700 border-yellow-200",
      unknown: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return typeColors[nodeType] || typeColors.unknown;
  };

  return (
    <div className="space-y-3 w-full">
      {nodeExecutions.map((node) => {
        const isExpanded = expandedNodes.has(node.nodeId);

        return (
          <div
            key={node.nodeId}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white"
          >
            {/* Node Header - Clickable */}
            <button
              onClick={() => toggleNode(node.nodeId)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              {/* Expand/Collapse Icon */}
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
              )}

              {/* Status Icon */}
              {getStatusIcon(node.status)}

              {/* Node Type Badge */}
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded border ${getNodeTypeColor(
                  node.nodeType
                )}`}
              >
                {getNodeTypeLabel(node.nodeType)}
              </span>

              {/* Node Name */}
              <span className="text-sm font-medium text-gray-900">
                {node.nodeName}
              </span>

              {/* Streaming indicator */}
              {node.status === "streaming" && (
                <span className="text-xs text-blue-500 ml-auto">
                  Streaming...
                </span>
              )}
            </button>

            {/* Node Content - Collapsible */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                {node.status === "error" ? (
                  <div className="text-sm text-red-600 bg-red-50 rounded-md p-3">
                    {node.error || "An error occurred"}
                  </div>
                ) : node.content || node.structuredOutput ? (
                  <NodeContentRenderer
                    content={node.content}
                    nodeType={node.nodeType}
                    structuredOutput={node.structuredOutput}
                  />
                ) : node.status === "streaming" ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic">
                    No output yet
                  </div>
                )}

                {/* Metadata footer */}
                {node.metadata && (node.metadata.model || node.metadata.agent_type) && (
                  <div className="mt-3 pt-2 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
                    {node.metadata.agent_type && (
                      <span>Type: {node.metadata.agent_type}</span>
                    )}
                    {node.metadata.model && (
                      <span>Model: {node.metadata.model}</span>
                    )}
                    {node.metadata.provider && (
                      <span>Provider: {node.metadata.provider}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Execution status */}
      {isStreaming && nodeExecutions.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500 px-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Graph execution in progress...</span>
        </div>
      )}
    </div>
  );
}
