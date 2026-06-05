export type BackendKind = "openrouter" | "claude-cli" | "codex-cli" | "fake";

export type TaskIntent = "research" | "edit" | "review" | "test" | "summarize";

export type TaskImportance = "low" | "normal" | "high" | "critical";

export type ModelTier = "free" | "cheap" | "strong" | "critical";

export type Task = {
  id: string;
  title: string;
  intent: TaskIntent;
  importance: TaskImportance;
  modelTier: ModelTier;
  fileScope: string[];
  dependsOn: string[];
  instructions: string;
};

export type SingleModelEndpoint = {
  backend: BackendKind;
  model: string;
};

export type MultiModelEndpoint = {
  backend: BackendKind;
  models: string[];
};

export type Profile = {
  orchestrator: SingleModelEndpoint;
  critical: SingleModelEndpoint;
  strong: SingleModelEndpoint;
  cheap: SingleModelEndpoint;
  free: MultiModelEndpoint;
};

export type Limits = {
  maxWorkers: number;
  maxCostUsd: number;
  maxTasks: number;
  requirePlanApproval: boolean;
};

export type CucConfig = {
  activeProfile: string;
  profiles: Record<string, Profile>;
  limits: Limits;
};

export type ModelAssignment = SingleModelEndpoint;

export type TaskRoute = {
  tier: ModelTier;
  primary: ModelAssignment;
  fallbacks: ModelAssignment[];
};

export type WorkerUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type WorkerAttempt = {
  backend: BackendKind;
  model: string;
  status: "succeeded" | "failed";
  usage: WorkerUsage;
  costUsd: number;
  error?: string;
};

export type WorkerResult = {
  taskId: string;
  status: "succeeded" | "failed";
  response: string;
  usage: WorkerUsage;
  costUsd: number;
  error?: string;
  attempts?: WorkerAttempt[];
};
