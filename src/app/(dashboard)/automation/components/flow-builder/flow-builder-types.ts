import type { Edge, Node } from "@xyflow/react";

import type {
  ConversationFlowNodeData,
  ConversationFlowNodeType,
} from "@/types/dashboard-config";

export type FlowCanvasNode = Node<
  ConversationFlowNodeData,
  ConversationFlowNodeType
>;

export type FlowCanvasEdge = Edge;

export type FlowValidationIssueView = {
  code: string;
  message: string;
  nodeId?: string;
  severity: "error" | "warning";
};

export type FlowValidationView = {
  valid: boolean;
  errors: FlowValidationIssueView[];
  warnings: FlowValidationIssueView[];
};

export type FlowPreviewResult = {
  sandbox: boolean;
  messages: string[];
  outcome: string | null;
  needsHuman: boolean;
  handoffTarget?: string;
  error?: string;
  decision?: {
    grounded: boolean;
    confidence: number;
    source?: string;
    intent: string;
  } | null;
  trace: Array<{
    nodeId: string;
    nodeType: ConversationFlowNodeType;
    label: string;
    outcome?: string;
  }>;
};
