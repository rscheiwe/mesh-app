import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { InputDef } from "@/types";
import { useBackend } from "@/contexts/BackendContext";
import type { Edge } from "reactflow";

interface FieldRendererProps {
  input: InputDef;
  value: any;
  onChange: (value: any) => void;
  nodeId?: string;
  edges?: Edge[];
}

export function FieldRenderer({ input, value, onChange, nodeId, edges }: FieldRendererProps) {
  // Get current value or default
  const currentValue = value !== undefined ? value : input.default;

  // Get backend data for async options
  const backend = useBackend();

  // State for custom fetch URL options
  const [customOptions, setCustomOptions] = useState<{ name: string; label: string }[]>([]);
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  // Fetch custom options for asyncOptions type - must be at top level (rules of hooks)
  useEffect(() => {
    if (input.type === "asyncOptions" && input.fetchUrl) {
      setCustomLoading(true);
      setCustomError(null);

      const API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

      fetch(`${API_URL}${input.fetchUrl}`)
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch options: ${res.statusText}`);
          return res.json();
        })
        .then(data => {
          setCustomOptions(data);
          setCustomLoading(false);
        })
        .catch(err => {
          setCustomError(err.message);
          setCustomLoading(false);
        });
    }
  }, [input.type, input.fetchUrl]);

  switch (input.type) {
    case "string":
      if (input.rows && input.rows > 1) {
        return (
          <div className="space-y-2">
            <Label htmlFor={input.name}>
              {input.label}
              {input.optional && (
                <span className="text-muted-foreground ml-1">(optional)</span>
              )}
            </Label>
            {input.description && (
              <p className="text-xs text-muted-foreground">
                {input.description}
              </p>
            )}
            <Textarea
              id={input.name}
              value={currentValue || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={input.placeholder}
              rows={input.rows}
            />
          </div>
        );
      }
      return (
        <div className="space-y-2">
          <Label htmlFor={input.name}>
            {input.label}
            {input.optional && (
              <span className="text-muted-foreground ml-1">(optional)</span>
            )}
            {input.name === 'id' && (
              <span className="text-xs text-amber-600 ml-2">⚠️ Changing this will update the node ID used in variable references</span>
            )}
          </Label>
          {input.description && (
            <p className="text-xs text-muted-foreground">{input.description}</p>
          )}
          <Input
            id={input.name}
            value={currentValue || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={input.placeholder}
            className={input.name === 'id' ? 'font-mono' : ''}
          />
        </div>
      );

    case "number":
      return (
        <div className="space-y-2">
          <Label htmlFor={input.name}>
            {input.label}
            {input.optional && (
              <span className="text-muted-foreground ml-1">(optional)</span>
            )}
          </Label>
          {input.description && (
            <p className="text-xs text-muted-foreground">{input.description}</p>
          )}
          <Input
            id={input.name}
            type="number"
            value={currentValue !== undefined ? currentValue : ""}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            placeholder={input.placeholder}
          />
        </div>
      );

    case "boolean":
      return (
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1">
            <Label htmlFor={input.name}>{input.label}</Label>
            {input.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {input.description}
              </p>
            )}
          </div>
          <Switch
            id={input.name}
            checked={currentValue || false}
            onCheckedChange={onChange}
          />
        </div>
      );

    case "options":
      return (
        <div className="space-y-2">
          <Label htmlFor={input.name}>
            {input.label}
            {input.optional && (
              <span className="text-muted-foreground ml-1">(optional)</span>
            )}
          </Label>
          {input.description && (
            <p className="text-xs text-muted-foreground">{input.description}</p>
          )}
          <Select value={currentValue || ""} onValueChange={onChange}>
            <SelectTrigger id={input.name}>
              <SelectValue placeholder={input.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {input.options?.map((opt) => (
                <SelectItem key={opt.name} value={opt.name}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "asyncOptions": {
      // Handle dynamic options from backend context (loaded once at startup)
      let dynamicOptions: { name: string; label: string }[] = [];
      let isLoading = false;
      let error: string | null = null;

      // Use custom fetch URL options (fetched in useEffect above) - deprecated, prefer dataSource
      if (input.fetchUrl) {
        dynamicOptions = customOptions;
        isLoading = customLoading;
        error = customError;
      } else if (input.dataSource === "agents") {
        dynamicOptions = backend.agents.map((agent) => ({
          name: agent.id,
          label: agent.name,
        }));
        isLoading = backend.agentsLoading;
        error = backend.agentsError;
      } else if (input.dataSource === "tools") {
        // Use toolNodes from context (has full metadata)
        dynamicOptions = backend.toolNodes.map((tool) => ({
          name: tool.name, // UUID
          label: tool.label,
        }));
        isLoading = backend.toolNodesLoading;
        error = backend.toolNodesError;
      } else if (input.dataSource === "agentFlows") {
        dynamicOptions = backend.agentFlows.map((flow) => ({
          name: flow.name, // UUID
          label: flow.label,
        }));
        isLoading = backend.agentFlowsLoading;
        error = backend.agentFlowsError;
      } else if (input.dataSource === "dataHandlers") {
        dynamicOptions = backend.dataHandlers.map((handler) => ({
          name: handler.name, // UUID
          label: handler.label,
        }));
        isLoading = backend.dataHandlersLoading;
        error = backend.dataHandlersError;
      }

      return (
        <div className="space-y-2">
          <Label htmlFor={input.name}>
            {input.label}
            {input.optional && (
              <span className="text-muted-foreground ml-1">(optional)</span>
            )}
          </Label>
          {input.description && (
            <p className="text-xs text-muted-foreground">{input.description}</p>
          )}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
          <Select
            value={currentValue || ""}
            onValueChange={onChange}
            disabled={isLoading || !!error}
          >
            <SelectTrigger id={input.name}>
              <SelectValue placeholder={
                isLoading
                  ? "Loading..."
                  : error
                    ? "Error loading options"
                    : input.placeholder || "Select..."
              } />
            </SelectTrigger>
            <SelectContent>
              {dynamicOptions.length === 0 && !isLoading && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No options available
                </div>
              )}
              {dynamicOptions.map((opt) => (
                <SelectItem key={opt.name} value={opt.name}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    case "multiAsyncSelect": {
      // Multi-select for tools/agents from backend context
      let dynamicOptions: { name: string; label: string }[] = [];
      let isLoading = false;
      let error: string | null = null;

      if (input.dataSource === "tools") {
        // Use toolNodes from context (has full metadata)
        dynamicOptions = backend.toolNodes.map((tool) => ({
          name: tool.name, // UUID
          label: tool.label,
        }));
        isLoading = backend.toolNodesLoading;
        error = backend.toolNodesError;
      }

      // Parse current value (array of tool IDs)
      const selectedTools = Array.isArray(currentValue) ? currentValue : [];

      return (
        <div className="space-y-2">
          <Label htmlFor={input.name}>
            {input.label}
            {input.optional && (
              <span className="text-muted-foreground ml-1">(optional)</span>
            )}
          </Label>
          {input.description && (
            <p className="text-xs text-muted-foreground">{input.description}</p>
          )}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {/* Selected tools display */}
          {selectedTools.length > 0 && (
            <div className="space-y-1 p-2 bg-muted/50 rounded-md">
              {selectedTools.map((toolId: string) => {
                const tool = dynamicOptions.find(opt => opt.name === toolId);
                return (
                  <div key={toolId} className="flex items-center justify-between text-sm">
                    <span>{tool?.label || toolId}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        onChange(selectedTools.filter((id: string) => id !== toolId));
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tool selector */}
          <Select
            value=""
            onValueChange={(toolId) => {
              if (!selectedTools.includes(toolId)) {
                onChange([...selectedTools, toolId]);
              }
            }}
            disabled={isLoading || !!error}
          >
            <SelectTrigger id={input.name}>
              <SelectValue placeholder={
                isLoading
                  ? "Loading tools..."
                  : error
                    ? "Error loading tools"
                    : "Add tool..."
              } />
            </SelectTrigger>
            <SelectContent>
              {dynamicOptions.length === 0 && !isLoading && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No tools available
                </div>
              )}
              {dynamicOptions
                .filter(opt => !selectedTools.includes(opt.name))
                .map((opt) => (
                  <SelectItem key={opt.name} value={opt.name}>
                    {opt.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    case "code":
      return (
        <div className="space-y-2">
          <Label htmlFor={input.name}>
            {input.label}
            {input.optional && (
              <span className="text-muted-foreground ml-1">(optional)</span>
            )}
          </Label>
          {input.description && (
            <p className="text-xs text-muted-foreground">{input.description}</p>
          )}
          <Textarea
            id={input.name}
            value={currentValue || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={input.placeholder}
            rows={input.rows || 8}
            className="font-mono text-xs"
          />
        </div>
      );

    case "nodeOptions": {
      // Get nodes that have edges leading into the current node
      const incomingNodeIds: string[] = [];
      if (nodeId && edges) {
        const incomingEdges = edges.filter(edge => edge.target === nodeId);
        incomingNodeIds.push(...incomingEdges.map(edge => edge.source));
      }

      return (
        <div className="space-y-2">
          <Label htmlFor={input.name}>
            {input.label}
            {input.optional && (
              <span className="text-muted-foreground ml-1">(optional)</span>
            )}
          </Label>
          {input.description && (
            <p className="text-xs text-muted-foreground">{input.description}</p>
          )}
          <Select
            value={currentValue || ""}
            onValueChange={onChange}
            disabled={incomingNodeIds.length === 0}
          >
            <SelectTrigger id={input.name}>
              <SelectValue placeholder={
                incomingNodeIds.length === 0
                  ? "No incoming connections"
                  : input.placeholder || "Select node..."
              } />
            </SelectTrigger>
            <SelectContent>
              {incomingNodeIds.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  Connect nodes to this node to see options
                </div>
              )}
              {incomingNodeIds.map((id) => (
                <SelectItem key={id} value={id}>
                  {id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    case "array":
      return (
        <div className="space-y-2">
          <Label htmlFor={input.name}>
            {input.label}
            {input.optional && (
              <span className="text-muted-foreground ml-1">(optional)</span>
            )}
          </Label>
          {input.description && (
            <p className="text-xs text-muted-foreground">{input.description}</p>
          )}
          <div className="text-sm text-muted-foreground">
            Array editing not yet implemented
          </div>
          <Button variant="outline" size="sm" disabled>
            Add Item
          </Button>
        </div>
      );

    default:
      return (
        <div className="text-sm text-muted-foreground">
          Unknown field type: {input.type}
        </div>
      );
  }
}
