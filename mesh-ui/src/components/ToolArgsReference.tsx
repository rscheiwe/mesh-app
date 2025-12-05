import { useState } from "react";
import { ChevronDown, ChevronRight, Info, Copy, Check } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ToolArg {
  name: string;
  type?: string;
  optional?: boolean;
  description?: string;
  default?: any;
  options?: { name: string; label: string }[];
}

interface ToolArgsReferenceProps {
  args?: ToolArg[];
  outputs?: string[];
  toolName?: string;
  nodeId: string;
}

/**
 * ToolArgsReference - Shows the tool's input parameters and outputs as a reference
 * Helps users understand what parameters the tool expects and what it returns
 */
export function ToolArgsReference({
  args,
  outputs,
  toolName,
  nodeId,
}: ToolArgsReferenceProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyOutput = async (field: string) => {
    const variable = `{{${nodeId}.output.${field}}}`;
    try {
      await navigator.clipboard.writeText(variable);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if ((!args || args.length === 0) && (!outputs || outputs.length === 0)) {
    return null;
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="border rounded-lg overflow-hidden mb-4 bg-amber-50/50">
        <CollapsibleTrigger className="w-full flex items-center gap-2 px-3 py-2 bg-amber-100 hover:bg-amber-200 transition-colors text-left">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-amber-700" />
          ) : (
            <ChevronRight className="w-4 h-4 text-amber-700" />
          )}
          <span className="font-medium text-amber-800 text-sm">
            Tool Parameters
          </span>
          {toolName && (
            <span className="text-xs text-amber-600">({toolName})</span>
          )}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-3 space-y-2">
            {/* Args Section */}
            {args && args.length > 0 && (
              <>
                <div className="text-xs font-medium text-amber-800 mb-2">
                  Input Parameters
                </div>
                <div className="flex items-start gap-2 text-xs text-amber-700 mb-3 bg-amber-100/50 p-2 rounded">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>null</strong> = LLM generates the value at runtime.{" "}
                    <strong>Fixed values</strong> = always use this value.{" "}
                    <strong>{"{{node.output}}"}</strong> = use variable from
                    another node.
                  </span>
                </div>

                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-amber-800 border-b border-amber-200">
                      <th className="py-1 px-2 font-medium">Parameter</th>
                      <th className="py-1 px-2 font-medium">Type</th>
                      <th className="py-1 px-2 font-medium">Required</th>
                      <th className="py-1 px-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {args.map((arg, index) => (
                      <tr
                        key={arg.name || index}
                        className="border-b border-amber-100 last:border-0"
                      >
                        <td className="py-1.5 px-2">
                          <code className="bg-amber-100 px-1 rounded text-amber-900 font-mono">
                            {arg.name}
                          </code>
                        </td>
                        <td className="py-1.5 px-2 text-amber-700">
                          {arg.type || "any"}
                          {arg.options && (
                            <span className="text-amber-500 ml-1">
                              [
                              {arg.options
                                .map((o) => o.name || o.label)
                                .join(", ")}
                              ]
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2">
                          {arg.optional ? (
                            <span className="text-amber-500">optional</span>
                          ) : (
                            <span className="text-red-600 font-medium">
                              required
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-gray-600">
                          {arg.description || "-"}
                          {arg.default !== undefined && (
                            <span className="text-amber-600 ml-1">
                              (default: {JSON.stringify(arg.default)})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Outputs Section */}
            {outputs && outputs.length > 0 && (
              <>
                {args && args.length > 0 && (
                  <div className="border-t border-amber-200 my-3" />
                )}
                <div className="text-xs font-medium text-amber-800 mb-2">
                  Output Fields
                </div>
                <p className="text-xs text-amber-600 mb-2">
                  These fields will be available after the tool runs. Click to
                  copy the variable reference.
                </p>
                <div className="flex flex-wrap gap-2">
                  {outputs.map((field) => (
                    <button
                      key={field}
                      onClick={() => handleCopyOutput(field)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-100 hover:bg-green-200 rounded text-xs font-mono text-green-800 transition-colors"
                      title={`Click to copy: {{${nodeId}.output.${field}}}`}
                    >
                      <span>{field}</span>
                      {copiedField === field ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-green-500" />
                      )}
                    </button>
                  ))}
                </div>
                {nodeId && (
                  <p className="text-xs text-gray-500 mt-2">
                    Example:{" "}
                    <code className="bg-gray-100 px-1 rounded">{`{{${nodeId}.output.${outputs[0] || "result"}}}`}</code>
                  </p>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
