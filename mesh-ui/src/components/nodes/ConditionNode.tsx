import { memo, useMemo, useEffect } from "react";
import { Handle, Position, NodeProps, useUpdateNodeInternals } from "reactflow";
import { Card } from "@/components/ui/card";
import { NODE_DEF_MAP } from "@/registry";
import type { NodeInstanceData } from "@/types";

export const ConditionNode = memo(({ data, selected, id }: NodeProps<NodeInstanceData>) => {
  const def = NODE_DEF_MAP[data.defName];
  const updateNodeInternals = useUpdateNodeInternals();

  // Parse conditions or scenarios from config to determine dynamic outputs
  const outputHandles = useMemo(() => {
    const handles: Array<{ id: string; label: string }> = [];
    const routingMode = data.config?.conditionRouting || "deterministic";

    if (routingMode === "deterministic") {
      // Parse conditions JSON
      const conditionsJson = data.config?.conditions;
      if (conditionsJson) {
        try {
          const conditions = JSON.parse(conditionsJson);
          if (Array.isArray(conditions)) {
            conditions.forEach((condition) => {
              if (condition.name) {
                handles.push({
                  id: condition.name,
                  label: condition.name,
                });
              }
            });
          }
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
    } else if (routingMode === "ai") {
      // Parse scenarios JSON
      const scenariosJson = data.config?.scenarios;
      if (scenariosJson) {
        try {
          const scenarios = JSON.parse(scenariosJson);
          if (Array.isArray(scenarios)) {
            scenarios.forEach((scenario) => {
              if (scenario.name) {
                handles.push({
                  id: scenario.name,
                  label: scenario.name,
                });
              }
            });
          }
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
    }

    // Add default output if defaultTarget is specified
    if (data.config?.defaultTarget) {
      handles.push({
        id: "default",
        label: "default",
      });
    }

    // Fallback: if no handles, show generic output
    if (handles.length === 0) {
      handles.push({
        id: "output",
        label: "output",
      });
    }

    return handles;
  }, [data.config?.conditions, data.config?.scenarios, data.config?.defaultTarget, data.config?.conditionRouting]);

  // Force ReactFlow to recalculate node internals when handles change
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, outputHandles, updateNodeInternals]);

  if (!def) {
    return (
      <Card className="p-2 w-64 border-2 border-destructive">
        <div className="text-sm text-destructive">Unknown node: {data.defName}</div>
      </Card>
    );
  }

  // Filter inputs that should have handles
  const inputHandles = def.inputs.filter(
    (inp) => inp.acceptVariable || inp.acceptNodeOutputAsVariable
  );

  // Get summary fields to display in node
  const summaryFields = def.inputs.filter((inp) => inp.showInNode);

  // Truncate long values
  const truncate = (value: any, maxLength = 30) => {
    if (value === undefined || value === null || value === "") return "—";
    const str = String(value);
    return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
  };

  return (
    <Card
      className={`w-64 min-h-[140px] border-t-4 shadow-sm transition-shadow ${
        selected ? "ring-2 ring-primary shadow-lg" : ""
      }`}
      style={{ borderTopColor: def.color || "#64748b" }}
    >
      {/* Input Handles (Top) */}
      {inputHandles.map((inp, idx) => (
        <Handle
          key={inp.name}
          type="target"
          position={Position.Top}
          id={inp.name}
          style={{
            left: `${((idx + 1) * 100) / (inputHandles.length + 1)}%`,
            background: "#64748b",
            width: "8px",
            height: "8px",
          }}
          title={inp.label}
        />
      ))}

      {/* Dynamic Output Handles (Bottom) - based on conditions */}
      {outputHandles.map((output, idx) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Bottom}
          id={output.id}
          style={{
            left: `${((idx + 1) * 100) / (outputHandles.length + 1)}%`,
            background: def.color || "#64748b",
            width: "8px",
            height: "8px",
          }}
          title={output.label}
        />
      ))}

      {/* Node Body */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sm">{def.label}</span>
          {def.type && (
            <span className="text-xs text-muted-foreground uppercase">
              {def.type}
            </span>
          )}
        </div>

        {def.description && (
          <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {def.description}
          </div>
        )}

        {/* Summary Fields */}
        {summaryFields.length > 0 && (
          <div className="mt-2 space-y-1 border-t pt-2">
            {summaryFields.map((field) => {
              const displayLabel = field.name === 'id' ? 'Node ID' : field.label;
              const value = data.config?.[field.name] || field.default;

              return (
                <div
                  key={field.name}
                  className="flex justify-between text-xs gap-2"
                >
                  <span className="text-muted-foreground">{displayLabel}:</span>
                  <span className="font-mono truncate font-semibold">
                    {truncate(value)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
});

ConditionNode.displayName = "ConditionNode";
