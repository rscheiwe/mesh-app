import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useGraphStore } from "@/store/graph";
import { useBackend } from "@/contexts/BackendContext";
import { Play, StopCircle, AlertCircle } from "lucide-react";
import { executeGraph } from "@/lib/api";

export function Runner() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toFlowJson = useGraphStore((state) => state.toFlowJson);
  const nodes = useGraphStore((state) => state.nodes);
  const backend = useBackend();

  // Helper to transform tool UUIDs to inline tool definitions
  const transformToolsToInline = (flowJson: any) => {
    // Clone flow JSON
    const transformed = JSON.parse(JSON.stringify(flowJson));

    // Transform each agent node's tools array
    transformed.nodes = transformed.nodes.map((node: any) => {
      // Only process agent nodes
      if (node.type === 'agentAgentflow' && node.data.inputs.tools) {
        const toolIds = node.data.inputs.tools;

        // Transform tool IDs to inline tool definitions
        const inlineTools = toolIds
          .map((toolId: string) => {
            const tool = backend.tools.find(t => t.id === toolId);
            if (!tool) {
              console.warn(`Tool ${toolId} not found in backend tools`);
              return null;
            }

            return {
              code: tool.code,
              name: tool.name,
              description: tool.description,
            };
          })
          .filter(Boolean); // Remove nulls

        // Replace tools array with inline definitions
        return {
          ...node,
          data: {
            ...node.data,
            inputs: {
              ...node.data.inputs,
              tools: inlineTools,
            },
          },
        };
      }

      return node;
    });

    return transformed;
  };

  const handleRun = async () => {
    // Validate we have nodes
    if (nodes.length === 0) {
      setError("No nodes in graph. Add some nodes first!");
      return;
    }

    // Validate we have input
    if (!input.trim()) {
      setError("Please enter an input prompt");
      return;
    }

    setExecuting(true);
    setError(null);
    setOutput("🚀 Starting execution...\n\n");

    try {
      const flowJson = toFlowJson();

      // Transform tool UUIDs to inline tool definitions
      const transformedFlow = transformToolsToInline(flowJson);

      console.log("Executing graph:", transformedFlow);

      await executeGraph(
        {
          flow: transformedFlow,
          input: input.trim(),
          session_id: `session-${Date.now()}`,
        },
        (event) => {
          // Handle different event types
          console.log("Event received:", event);

          if (event.type === "token" && event.content) {
            // Stream tokens
            setOutput((prev) => prev + event.content);
          } else if (event.type === "node_start") {
            setOutput((prev) => prev + `\n[Starting node: ${event.node_id}]\n`);
          } else if (event.type === "node_complete") {
            setOutput((prev) => prev + `\n[Completed node: ${event.node_id}]\n`);
          } else if (event.type === "execution_complete") {
            setOutput((prev) => prev + "\n\n✅ Execution complete!");
            if (event.output) {
              setOutput((prev) => prev + "\n\nFinal output:\n" + JSON.stringify(event.output, null, 2));
            }
          } else if (event.type === "execution_error" || event.error) {
            setError(event.error || "Unknown error occurred");
            setOutput((prev) => prev + `\n\n❌ Error: ${event.error}`);
          } else {
            // Log other events for debugging
            setOutput((prev) => prev + `\n[${event.type}]\n`);
          }
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setOutput((prev) => prev + `\n\n❌ Error: ${errorMessage}`);
      console.error("Execution failed:", err);
    } finally {
      setExecuting(false);
    }
  };

  const handleClear = () => {
    setOutput("");
    setError(null);
  };

  return (
    <div className="h-full bg-muted/30 p-4">
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Runner</span>
            {executing && (
              <span className="text-xs font-normal text-muted-foreground animate-pulse">
                Executing...
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Error Alert */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm text-destructive">{error}</div>
            </div>
          )}

          {/* Input Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Input</label>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleRun}
                  disabled={executing || nodes.length === 0}
                >
                  {executing ? (
                    <>
                      <StopCircle className="h-4 w-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={executing}
                >
                  Clear Output
                </Button>
              </div>
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your prompt here... (e.g., 'Tell me about quantum computing')"
              rows={3}
              disabled={executing}
            />
          </div>

          {/* Output Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="text-sm font-medium mb-2">Output</div>
            <div className="flex-1 bg-muted rounded-md p-3 overflow-auto font-mono text-xs whitespace-pre-wrap">
              {output || (
                <span className="text-muted-foreground">
                  {nodes.length === 0
                    ? "Add nodes to your graph, then enter a prompt and click Run"
                    : "Output will appear here..."}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
