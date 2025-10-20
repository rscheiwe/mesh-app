import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGraphStore } from "@/store/graph";
import { FileDown, Loader2 } from "lucide-react";

interface Sample {
  id: string;
  name: string;
  description: string;
  file: string;
}

export function SamplesLoader() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSample, setSelectedSample] = useState<string>("");
  const fromFlowJson = useGraphStore((state) => state.fromFlowJson);

  // Load samples index on mount
  useEffect(() => {
    fetch("/samples/index.json")
      .then((res) => res.json())
      .then((data) => setSamples(data))
      .catch((err) => console.error("Failed to load samples:", err));
  }, []);

  const handleLoadSample = async () => {
    if (!selectedSample) return;

    setLoading(true);
    try {
      const response = await fetch(`/samples/${selectedSample}`);
      const flowJson = await response.json();

      // Load the flow into the graph
      fromFlowJson(flowJson);

      // Reset selection
      setSelectedSample("");
    } catch (error) {
      console.error("Failed to load sample:", error);
      alert("Failed to load sample flow");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedSample} onValueChange={setSelectedSample}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Load sample..." />
        </SelectTrigger>
        <SelectContent>
          {samples.map((sample) => (
            <SelectItem key={sample.id} value={sample.file}>
              <div>
                <div className="font-medium">{sample.name}</div>
                <div className="text-xs text-muted-foreground">
                  {sample.description}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        onClick={handleLoadSample}
        disabled={!selectedSample || loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
