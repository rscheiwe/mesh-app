import { Palette } from "@/components/Palette";
import { Canvas } from "@/components/Canvas";
import { Inspector } from "@/components/Inspector";
import { Runner } from "@/components/Runner";
import { SamplesLoader } from "@/components/SamplesLoader";
import { GraphActions } from "@/components/GraphActions";

function App() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-background border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Mesh UI</h1>
        <div className="flex items-center gap-4">
          <SamplesLoader />
          <GraphActions />
          <p className="text-sm text-muted-foreground">
            Lightweight ReactFlow Graph Editor
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Three-column layout */}
        <div className="flex-1 grid grid-cols-[16rem_1fr_20rem] overflow-hidden">
          {/* Left: Palette */}
          <div className="border-r overflow-hidden">
            <Palette />
          </div>

          {/* Center: Canvas */}
          <div className="overflow-hidden">
            <Canvas />
          </div>

          {/* Right: Inspector */}
          <div className="border-l overflow-hidden">
            <Inspector />
          </div>
        </div>
      </div>

      {/* Bottom: Runner */}
      <div className="h-64 border-t">
        <Runner />
      </div>
    </div>
  );
}

export default App;
