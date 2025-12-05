import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGraphStore } from "@/store/graph";
import { NODE_DEF_MAP } from "@/registry";
import { FieldRenderer } from "@/lib/form/FieldRenderer";
import { Button } from "@/components/ui/button";
import { Trash2, Settings } from "lucide-react";
import { AvailableVariables } from "@/components/AvailableVariables";
import { ToolArgsReference } from "@/components/ToolArgsReference";
import { useBackend } from "@/contexts/BackendContext";

interface InspectorProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Inspector({ isCollapsed = false, onToggle }: InspectorProps) {
  const selectedNode = useGraphStore((state) => state.getSelectedNode());
  const edges = useGraphStore((state) => state.edges);
  const updateNode = useGraphStore((state) => state.updateNode);
  const deleteNode = useGraphStore((state) => state.deleteNode);

  // Get data from context (loaded once at app startup)
  const { getToolByUuid, getDataHandlerByUuid } = useBackend();

  // Get tool metadata from context when a tool is selected
  const toolMetadata = useMemo(() => {
    if (!selectedNode || selectedNode.data.defName !== "tool") {
      return null;
    }

    const toolUuid = selectedNode.data.config?.toolUuid;
    if (!toolUuid) {
      return null;
    }

    const tool = getToolByUuid(toolUuid);
    if (!tool) {
      return null;
    }

    return {
      args: (tool.inputs || []).map((inp) => ({
        name: inp.name,
        type: inp.type || 'any',
        optional: inp.optional || false,
        description: inp.description || '',
        default: inp.default,
        options: inp.options,
      })),
      outputs: tool.outputs || ['output'],
      toolName: tool.label,
    };
  }, [selectedNode?.data.defName, selectedNode?.data.config?.toolUuid, getToolByUuid]);

  // Update node config when tool is selected (for bindings default)
  useEffect(() => {
    if (!selectedNode || selectedNode.data.defName !== "tool" || !toolMetadata) {
      return;
    }

    const toolUuid = selectedNode.data.config?.toolUuid;
    if (!toolUuid) return;

    // Only update if toolOutputs not already set (avoid infinite loop)
    if (selectedNode.data.config?.toolOutputs) {
      return;
    }

    // Build default bindings JSON from args
    const defaultBindings: Record<string, any> = {};
    toolMetadata.args.forEach((arg) => {
      defaultBindings[arg.name] = arg.default !== undefined ? arg.default : null;
    });

    // Update node config with tool metadata and default bindings
    updateNode(selectedNode.id, {
      config: {
        ...selectedNode.data.config,
        toolArgs: toolMetadata.args,
        toolOutputs: toolMetadata.outputs,
        toolName: toolMetadata.toolName,
        // Only set bindings if not already set
        bindings: selectedNode.data.config?.bindings || JSON.stringify(defaultBindings, null, 2),
      },
    });
  }, [selectedNode?.id, selectedNode?.data.config?.toolUuid, toolMetadata, updateNode]);

  // Watch for DataHandler selection changes and populate fields (using context)
  useEffect(() => {
    if (!selectedNode || selectedNode.data.defName !== "data_handler") return;

    const dataHandlerUuid = selectedNode.data.config?.dataHandlerUuid;
    if (!dataHandlerUuid) return;

    // Skip if already populated
    if (selectedNode.data.config?.query) return;

    const handler = getDataHandlerByUuid(dataHandlerUuid);
    if (!handler) return;

    // Extract query and db_source from inputs
    const queryInput = handler.inputs?.find((inp) => inp.name === 'query');
    const dbSourceInput = handler.inputs?.find((inp) => inp.name === 'db_source');
    const paramsInput = handler.inputs?.find((inp) => inp.name === 'params');

    const query = queryInput?.default || '';
    const dbSource = dbSourceInput?.default || 'postgres';

    // Parse params default
    let defaultParams = {};
    if (paramsInput?.default) {
      try {
        defaultParams = typeof paramsInput.default === 'string'
          ? JSON.parse(paramsInput.default)
          : paramsInput.default;
      } catch (e) {
        console.error('Failed to parse default params:', e);
      }
    }

    // Update node config
    updateNode(selectedNode.id, {
      config: {
        ...selectedNode.data.config,
        query,
        dbSource,
        params: Object.keys(defaultParams).length > 0 ? JSON.stringify(defaultParams, null, 2) : '',
      },
    });
  }, [selectedNode?.data.config?.dataHandlerUuid, selectedNode?.id, getDataHandlerByUuid, updateNode]);

  // Check if this node type should show Available Variables
  // Must be called before any early returns to follow rules of hooks
  const shouldShowVariables = useMemo(() => {
    const defName = selectedNode?.data?.defName;
    const typesWithVariables = [
      "llm",
      "agent",
      "agent_flow",
      "tool",
      "condition",
    ];
    return typesWithVariables.includes(defName);
  }, [selectedNode?.data?.defName]);

  if (isCollapsed) {
    return (
      <div
        className="h-full flex flex-col items-center py-6 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="writing-mode-vertical text-sm font-semibold text-muted-foreground">
          <Settings className="w-5 h-5 mb-4" />
          <span style={{ writingMode: "vertical-rl" }} className="text-xs">
            INSPECTOR
          </span>
        </div>
      </div>
    );
  }

  if (!selectedNode) {
    return (
      <div className="h-full overflow-y-auto bg-muted/30 p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              Select a node to edit its properties
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const def = NODE_DEF_MAP[selectedNode.data.defName];

  if (!def) {
    return (
      <div className="h-full overflow-y-auto bg-muted/30 p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-destructive">
              Unknown node type: {selectedNode.data.defName}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    // Special handling for 'id' field - this updates the React Flow node ID
    // and automatically updates edges that reference it
    updateNode(selectedNode.id, {
      config: {
        ...selectedNode.data.config,
        [fieldName]: value,
      },
    });
  };

  const handleDelete = () => {
    deleteNode(selectedNode.id);
  };

  // Check if field should be shown based on show conditions
  const shouldShowField = (input: any) => {
    if (!input.show) return true;

    for (const [key, expectedValue] of Object.entries(input.show)) {
      const currentValue = selectedNode.data.config?.[key];

      // Handle array of expected values
      if (Array.isArray(expectedValue)) {
        if (!expectedValue.includes(currentValue)) return false;
      } else {
        if (currentValue !== expectedValue) return false;
      }
    }

    return true;
  };

  return (
    <div className="h-full overflow-y-auto bg-muted/30 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{def.label}</CardTitle>
              {def.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {def.description}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Available Variables from upstream nodes */}
          {shouldShowVariables && (
            <AvailableVariables currentNodeId={selectedNode.id} />
          )}

          {/* Tool Parameters Reference - show for Tool nodes when a tool is selected */}
          {selectedNode.data.defName === "tool" && toolMetadata && (
            <ToolArgsReference
              args={toolMetadata.args}
              outputs={toolMetadata.outputs}
              toolName={toolMetadata.toolName}
              nodeId={selectedNode.data.config?.id || selectedNode.id}
            />
          )}

          {def.inputs
            .filter(shouldShowField)
            .map((input) => (
              <FieldRenderer
                key={input.name}
                input={input}
                value={selectedNode.data.config?.[input.name]}
                onChange={(value) => handleFieldChange(input.name, value)}
                nodeId={selectedNode.id}
                edges={edges}
              />
            ))}

          {def.inputs.filter(shouldShowField).length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No configuration options available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
