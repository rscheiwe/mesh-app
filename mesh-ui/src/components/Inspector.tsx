import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGraphStore } from "@/store/graph";
import { NODE_DEF_MAP } from "@/registry";
import { FieldRenderer } from "@/lib/form/FieldRenderer";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function Inspector() {
  const selectedNode = useGraphStore((state) => state.getSelectedNode());
  const updateNode = useGraphStore((state) => state.updateNode);
  const deleteNode = useGraphStore((state) => state.deleteNode);

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
          {def.inputs
            .filter(shouldShowField)
            .map((input) => (
              <FieldRenderer
                key={input.name}
                input={input}
                value={selectedNode.data.config?.[input.name]}
                onChange={(value) => handleFieldChange(input.name, value)}
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
