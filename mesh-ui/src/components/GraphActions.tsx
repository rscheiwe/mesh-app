import { Button } from "@/components/ui/button";
import { useGraphStore } from "@/store/graph";
import { Trash2, Download } from "lucide-react";

export function GraphActions() {
  const clearGraph = useGraphStore((state) => state.clearGraph);
  const toFlowJson = useGraphStore((state) => state.toFlowJson);
  const nodes = useGraphStore((state) => state.nodes);

  const handleClear = () => {
    if (nodes.length === 0) return;

    if (confirm("Are you sure you want to clear the graph?")) {
      clearGraph();
    }
  };

  const handleExport = () => {
    if (nodes.length === 0) {
      alert("Nothing to export. Add some nodes first!");
      return;
    }

    const flowJson = toFlowJson();
    const blob = new Blob([JSON.stringify(flowJson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mesh-flow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={nodes.length === 0}
        title="Export graph as JSON"
      >
        <Download className="h-4 w-4 mr-1" />
        Export
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClear}
        disabled={nodes.length === 0}
        title="Clear all nodes"
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Clear
      </Button>
    </div>
  );
}
