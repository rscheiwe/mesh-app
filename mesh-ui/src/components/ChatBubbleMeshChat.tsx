import { useState, useEffect, useRef, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, convertToModelMessages } from "ai";
import { Send, Loader2, Bot, User } from "lucide-react";
import { useGraphStore } from "@/store/graph";

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
  const flow = {
    nodes: nodes.map((node) => {
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
    edges: edges.map((edge) => ({
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
  const [chatId] = useState(() => crypto.randomUUID());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Get current graph state from zustand store
  const { nodes, edges } = useGraphStore();

  // Create transport with prepareSendMessagesRequest
  // This uses DefaultChatTransport which handles SSE parsing automatically
  // Uses /api/chat/stream endpoint which formats Mesh events for AI SDK
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${API_URL}/api/chat/stream`,
        headers: {
          "Content-Type": "application/json",
        },
        prepareSendMessagesRequest: ({ id, messages }) =>
          prepareMeshGraphRequest({ messages, nodes, edges }),
      }),
    [nodes, edges]
  );

  // Use AI SDK useChat hook
  const { messages, sendMessage, status, error } = useChat({
    transport,
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // Auto-scroll when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || status === "streaming") return;

    // Validate we have nodes
    if (nodes.length === 0) {
      console.warn("No nodes in graph");
      return;
    }

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

                  {/* Assistant message */}
                  {message.role === "assistant" && (
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <p className="text-sm whitespace-pre-wrap text-gray-900">
                        {fullTextContent || "..."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

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
