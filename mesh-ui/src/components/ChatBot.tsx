import { useState } from "react";
import {
  AlertCircle,
  User,
  Bot,
  Circle,
  Play,
  CheckCircle,
  Zap,
} from "lucide-react";
import { useGraphStore } from "@/store/graph";
import { executeGraph } from "@/lib/api";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { Loader } from "@/components/ai-elements/loader";

interface ExecutionStep {
  id: string;
  type: string;
  node_id?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: ExecutionStep[];
}

function ExecutionSteps({ steps }: { steps: ExecutionStep[] }) {
  if (!steps || steps.length === 0) return null;

  const getStepIcon = (type: string) => {
    if (type.includes("start")) return <Play className="h-3 w-3" />;
    if (type.includes("complete")) return <CheckCircle className="h-3 w-3" />;
    return <Circle className="h-3 w-3" />;
  };

  const getStepLabel = (step: ExecutionStep) => {
    return step.type;
  };

  return (
    <div className="mt-3 space-y-1 border-l-2 border-muted-foreground/30 pl-3 text-xs text-muted-foreground">
      {steps.map((step) => {
        const isNodeEvent = step.type === "node_start" || step.type === "node_complete";
        return (
          <div
            key={step.id}
            className="flex items-center gap-2"
            style={{ paddingLeft: isNodeEvent ? "0" : "1rem" }}
          >
            <div className="flex-shrink-0">{getStepIcon(step.type)}</div>
            <span>{getStepLabel(step)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toFlowJson = useGraphStore((state) => state.toFlowJson);
  const nodes = useGraphStore((state) => state.nodes);

  const handleSubmit = async (message: PromptInputMessage) => {
    const userInput = message.text?.trim();
    if (!userInput || isExecuting) return;

    // Validate we have nodes
    if (nodes.length === 0) {
      setError("No nodes in graph. Add some nodes first!");
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    setError(null);
    setIsExecuting(true);

    // Create assistant message that will be streamed
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      steps: [],
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const flowJson = toFlowJson();

      await executeGraph(
        {
          flow: flowJson,
          input: userInput,
          session_id: `session-${Date.now()}`,
        },
        (event) => {
          console.log("Event received:", event);

          if (event.type === "token" && event.content) {
            // Ensure content is a string
            const tokenContent =
              typeof event.content === "string"
                ? event.content
                : JSON.stringify(event.content);

            // Stream tokens to the assistant message
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: msg.content + tokenContent }
                  : msg
              )
            );
          } else if (
            event.type === "node_start" ||
            event.type === "node_complete" ||
            event.type === "step_start" ||
            event.type === "step_complete" ||
            event.type === "message_start" ||
            event.type === "message_complete"
          ) {
            // Filter out START node events
            if (event.node_id === "START") {
              return;
            }

            // Track execution steps with unique ID based on event properties
            const stepId = `${event.type}-${event.node_id}-${event.timestamp}`;
            const step: ExecutionStep = {
              id: stepId,
              type: event.type,
              node_id: event.node_id,
              timestamp: event.timestamp || new Date().toISOString(),
              metadata: event.metadata,
            };

            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === assistantMessageId) {
                  // Prevent duplicates by checking if step already exists
                  const existingSteps = msg.steps || [];
                  if (existingSteps.some((s) => s.id === stepId)) {
                    return msg;
                  }
                  return { ...msg, steps: [...existingSteps, step] };
                }
                return msg;
              })
            );
          } else if (event.type === "execution_complete") {
            // Final output - only use if we didn't stream any content
            if (event.output) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId && !msg.content
                    ? { ...msg, content: JSON.stringify(event.output, null, 2) }
                    : msg
                )
              );
            }
          } else if (event.type === "execution_error" || event.error) {
            const errorMsg = event.error || "Unknown error occurred";
            setError(errorMsg);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: `❌ Error: ${errorMsg}` }
                  : msg
              )
            );
          }
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: `❌ Error: ${errorMessage}` }
            : msg
        )
      );
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Error Banner */}
      {error && (
        <div className="bg-destructive/10 border-b border-destructive/20 p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <div className="text-sm text-destructive flex-1">{error}</div>
        </div>
      )}

      {/* Conversation */}
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground text-sm">
              <div>
                <p className="mb-2 font-medium">Welcome to Mesh UI Chat</p>
                <p className="text-xs">
                  {nodes.length === 0
                    ? "Add nodes to your graph to get started"
                    : "Enter a message to execute your graph"}
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="w-full">
                {message.role === "assistant" && message.steps && (
                  <ExecutionSteps steps={message.steps} />
                )}
                <Message from={message.role}>
                  <MessageContent>
                    {message.content ? (
                      <Response>{message.content}</Response>
                    ) : (
                      <Loader />
                    )}
                  </MessageContent>
                  <Avatar className="size-8 ring-1 ring-border">
                    <AvatarFallback>
                      {message.role === "user" ? (
                        <User className="size-4" />
                      ) : (
                        <Bot className="size-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                </Message>
              </div>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input */}
      <PromptInput onSubmit={handleSubmit}>
        <PromptInputBody>
          <PromptInputTextarea
            placeholder={
              nodes.length === 0
                ? "Add nodes to your graph first..."
                : "Type your message..."
            }
            disabled={nodes.length === 0 || isExecuting}
          />
        </PromptInputBody>
        <PromptInputFooter>
          <div />
          <PromptInputSubmit
            disabled={nodes.length === 0}
            status={isExecuting ? "streaming" : undefined}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
