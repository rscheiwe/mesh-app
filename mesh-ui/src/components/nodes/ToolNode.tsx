import { memo } from "react";
import { NodeProps } from "reactflow";
import { GenericNode } from "./GenericNode";
import type { NodeInstanceData } from "@/types";

// ToolNode could show tool icons or method badges
// For now, uses GenericNode with the tool's color accent
export const ToolNode = memo((props: NodeProps<NodeInstanceData>) => {
  return <GenericNode {...props} />;
});

ToolNode.displayName = "ToolNode";
