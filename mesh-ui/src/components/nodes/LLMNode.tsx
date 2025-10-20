import { memo } from "react";
import { NodeProps } from "reactflow";
import { GenericNode } from "./GenericNode";
import type { NodeInstanceData } from "@/types";

// LLMNode is just a wrapper around GenericNode with the same functionality
// You could add custom badges or styling here if needed
export const LLMNode = memo((props: NodeProps<NodeInstanceData>) => {
  return <GenericNode {...props} />;
});

LLMNode.displayName = "LLMNode";
