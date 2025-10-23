import { memo, useState } from "react";
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from "reactflow";
import { X } from "lucide-react";
import { useGraphStore } from "@/store/graph";

export const DeletableEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
  }: EdgeProps) => {
    const deleteEdge = useGraphStore((state) => state.deleteEdge);
    const [isHovered, setIsHovered] = useState(false);

    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const handleDelete = (event: React.MouseEvent) => {
      event.stopPropagation();
      deleteEdge(id);
    };

    return (
      <>
        <BaseEdge
          path={edgePath}
          markerEnd={markerEnd}
          style={style}
        />
        {/* Invisible wider path for easier hovering */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={20}
          className="cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <button
              onClick={handleDelete}
              className={`transition-opacity bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 shadow-md ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
              title="Delete edge"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
);

DeletableEdge.displayName = "DeletableEdge";
