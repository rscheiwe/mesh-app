import { useState } from "react";
import { Palette } from "@/components/Palette";
import { Canvas } from "@/components/Canvas";
import { Inspector } from "@/components/Inspector";
import { ChatBubble } from "@/components/ChatBubble";
import { SamplesLoader } from "@/components/SamplesLoader";
import { GraphActions } from "@/components/GraphActions";
import { Button } from "@/components/ui/button";
import {
  PanelLeft,
  PanelLeftClose,
  PanelRight,
  PanelRightClose,
} from "lucide-react";

function App() {
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-background border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPaletteOpen(!paletteOpen)}
          >
            {paletteOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
          </Button>
          <img src="/mesh-network.png" alt="Mesh Logo" className="h-10 w-10" />
          <h1 className="text-xl font-medium">Mesh Agent Graph Editor</h1>
        </div>
        <div className="flex items-center gap-4">
          <SamplesLoader />
          <GraphActions />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setInspectorOpen(!inspectorOpen)}
          >
            {inspectorOpen ? (
              <PanelRightClose className="h-5 w-5" />
            ) : (
              <PanelRight className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Canvas - Full width */}
        <div className="w-full h-full">
          <Canvas />
        </div>

        {/* Collapsible Palette Sidebar - Overlay */}
        <div
          className={`absolute left-0 top-0 bottom-0 border-r bg-background shadow-lg transition-all duration-300 ease-in-out ${
            paletteOpen ? "w-[325px]" : "w-[50px]"
          }`}
        >
          <Palette
            isCollapsed={!paletteOpen}
            onToggle={() => setPaletteOpen(!paletteOpen)}
          />
        </div>

        {/* Collapsible Inspector Sidebar - Overlay */}
        <div
          className={`absolute right-0 top-0 bottom-0 border-l bg-background shadow-lg transition-all duration-300 ease-in-out ${
            inspectorOpen ? "w-[400px]" : "w-[50px]"
          }`}
        >
          <Inspector
            isCollapsed={!inspectorOpen}
            onToggle={() => setInspectorOpen(!inspectorOpen)}
          />
        </div>
      </div>

      {/* Chat Bubble */}
      <ChatBubble />
    </div>
  );
}

export default App;
