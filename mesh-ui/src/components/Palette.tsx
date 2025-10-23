import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PALETTE_GROUPS } from "@/registry";
import type { NodeDefinition } from "@/types";
import { useBackend } from "@/contexts/BackendContext";
import { Boxes } from "lucide-react";

interface PaletteProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Palette({ isCollapsed = false, onToggle }: PaletteProps) {
  const {
    agents,
    tools,
    agentsLoading,
    toolsLoading,
    agentsError,
    toolsError,
  } = useBackend();
  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    defName: string
  ) => {
    event.dataTransfer.setData("application/reactflow", defName);
    event.dataTransfer.effectAllowed = "move";
  };

  if (isCollapsed) {
    return (
      <div
        className="h-full flex flex-col items-center py-6 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="writing-mode-vertical text-sm font-semibold text-muted-foreground">
          <Boxes className="w-5 h-5 mb-4" />
          <span style={{ writingMode: "vertical-rl" }} className="text-xs">
            PALETTE
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4 bg-muted/30">
      {/* Node Palette */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">NODES</h2>
        <div className="space-y-4">
          {PALETTE_GROUPS.map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                {group.category}
              </h3>
              <div className="space-y-2">
                {group.nodes.map((node) => (
                  <PaletteNode
                    key={node.name}
                    node={node}
                    onDragStart={onDragStart}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Backend Agents */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">AVAILABLE AGENTS</h2>
        {agentsLoading && (
          <div className="text-sm text-muted-foreground">Loading agents...</div>
        )}
        {agentsError && (
          <div className="text-sm text-destructive">{agentsError}</div>
        )}
        {!agentsLoading && !agentsError && agents.length === 0 && (
          <div className="text-sm text-muted-foreground">No agents registered</div>
        )}
        {!agentsLoading && !agentsError && agents.length > 0 && (
          <div className="space-y-2">
            {agents.map((agent) => (
              <Card key={agent.id} className="border-l-4 border-l-purple-500">
                <CardContent className="p-3">
                  <div className="font-medium text-sm">{agent.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {agent.type} • {agent.id}
                  </div>
                  {agent.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {agent.description}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Backend Tools */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">AVAILABLE TOOLS</h2>
        {toolsLoading && (
          <div className="text-sm text-muted-foreground">Loading tools...</div>
        )}
        {toolsError && (
          <div className="text-sm text-destructive">{toolsError}</div>
        )}
        {!toolsLoading && !toolsError && tools.length === 0 && (
          <div className="text-sm text-muted-foreground">No tools registered</div>
        )}
        {!toolsLoading && !toolsError && tools.length > 0 && (
          <div className="space-y-2">
            {tools.map((tool) => (
              <Card key={tool.id} className="border-l-4 border-l-amber-500">
                <CardContent className="p-3">
                  <div className="font-medium text-sm">{tool.name}</div>
                  <div className="text-xs text-muted-foreground">{tool.id}</div>
                  {tool.description && (
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {tool.description}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface PaletteNodeProps {
  node: NodeDefinition;
  onDragStart: (
    event: React.DragEvent<HTMLDivElement>,
    defName: string
  ) => void;
}

function PaletteNode({ node, onDragStart }: PaletteNodeProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, node.name)}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card className="hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: node.color }}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="font-medium text-sm">{node.label}</div>
              {node.description && (
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {node.description}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
