import { memo } from "react";
import { NodeProps } from "reactflow";
import { GenericNode } from "./GenericNode";
import type { NodeInstanceData } from "@/types";

// ConditionNode could have a diamond shape or special branching visualization
// For now, it uses GenericNode which will show multiple output handles
export const ConditionNode = memo((props: NodeProps<NodeInstanceData>) => {
  return <GenericNode {...props} />;
});

ConditionNode.displayName = "ConditionNode";
