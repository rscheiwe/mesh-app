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

interface FieldRendererProps {
  input: InputDef;
  value: any;
  onChange: (value: any) => void;
}

export function FieldRenderer({ input, value, onChange }: FieldRendererProps) {
  // Get current value or default
  const currentValue = value !== undefined ? value : input.default;

  // Get backend data for async options
  const backend = useBackend();

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
      // Handle dynamic options from backend
      let dynamicOptions: { name: string; label: string }[] = [];
      let isLoading = false;
      let error: string | null = null;

      if (input.dataSource === "agents") {
        dynamicOptions = backend.agents.map((agent) => ({
          name: agent.id,
          label: agent.name,
        }));
        isLoading = backend.agentsLoading;
        error = backend.agentsError;
      } else if (input.dataSource === "tools") {
        dynamicOptions = backend.tools.map((tool) => ({
          name: tool.id,
          label: tool.name,
        }));
        isLoading = backend.toolsLoading;
        error = backend.toolsError;
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
