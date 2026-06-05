import type {
  CucConfig,
  ModelAssignment,
  ModelTier,
  Task,
  TaskImportance,
  TaskIntent,
  TaskRoute
} from "./types.js";

export function classifyTask(task: {
  intent: TaskIntent;
  importance: TaskImportance;
}): ModelTier {
  if (task.importance === "critical") {
    return "critical";
  }

  if (task.intent === "edit" || task.intent === "test") {
    return "strong";
  }

  if (task.intent === "review" && task.importance === "high") {
    return "strong";
  }

  if (task.importance === "high") {
    return "cheap";
  }

  return "free";
}

export function routeTask(task: Task, config: CucConfig): TaskRoute {
  const profile = config.profiles[config.activeProfile];
  if (!profile) {
    throw new Error(`Profile "${config.activeProfile}" is not defined`);
  }

  const tier = task.modelTier ?? classifyTask(task);

  if (tier === "free") {
    const [primaryModel, ...fallbackModels] = profile.free.models;
    if (!primaryModel) {
      throw new Error("Free tier must define at least one model");
    }

    return {
      tier,
      primary: {
        backend: profile.free.backend,
        model: primaryModel
      },
      fallbacks: [
        ...fallbackModels.map((model): ModelAssignment => ({
          backend: profile.free.backend,
          model
        })),
        profile.cheap
      ]
    };
  }

  return {
    tier,
    primary: profile[tier],
    fallbacks: buildFallbacks(tier, config)
  };
}

function buildFallbacks(tier: Exclude<ModelTier, "free">, config: CucConfig) {
  const profile = config.profiles[config.activeProfile];

  if (!profile) {
    return [];
  }

  if (tier === "cheap") {
    return [profile.strong];
  }

  if (tier === "strong") {
    return [profile.critical];
  }

  return [];
}
