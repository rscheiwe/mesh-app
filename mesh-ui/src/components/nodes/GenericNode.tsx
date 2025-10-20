import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { NODE_DEF_MAP } from "@/registry";
import type { NodeInstanceData } from "@/types";

export const GenericNode = memo(({ data, selected }: NodeProps<NodeInstanceData>) => {
  const def = NODE_DEF_MAP[data.defName];

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
      className={`w-64 border-l-4 shadow-sm transition-shadow ${
        selected ? "ring-2 ring-primary shadow-lg" : ""
      }`}
      style={{ borderLeftColor: def.color || "#64748b" }}
    >
      {/* Input Handles (Left) */}
      {inputHandles.map((inp, idx) => (
        <Handle
          key={inp.name}
          type="target"
          position={Position.Left}
          id={inp.name}
          style={{
            top: `${((idx + 1) * 100) / (inputHandles.length + 1)}%`,
            background: "#64748b",
            width: "8px",
            height: "8px",
          }}
          title={inp.label}
        />
      ))}

      {/* Output Handles (Right) */}
      {def.outputs.map((output, idx) => (
        <Handle
          key={output}
          type="source"
          position={Position.Right}
          id={output}
          style={{
            top: `${((idx + 1) * 100) / (def.outputs.length + 1)}%`,
            background: def.color || "#64748b",
            width: "8px",
            height: "8px",
          }}
          title={output}
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
              // Special handling for 'id' field - show shorter label
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

GenericNode.displayName = "GenericNode";
