import type { ResolvedResourceForm } from "./resource-forms";

export type ResourceFormSubmission = Record<string, unknown>;

export type ResourceFormSubmissionMigrationContext = {
  migrationKey: string;
  fromVersion: number;
  toVersion: number;
  stepFromVersion: number;
  stepToVersion: number;
  direction: "upgrade" | "downgrade";
};

export type ResourceFormSubmissionTransformer = (
  payload: ResourceFormSubmission,
  context: ResourceFormSubmissionMigrationContext,
) => ResourceFormSubmission;

export type ResourceFormSubmissionMigrationStep = {
  fromVersion: number;
  toVersion: number;
  transform: ResourceFormSubmissionTransformer;
};

export type ResourceFormSubmissionMigrationRegistry = Record<
  string,
  ResourceFormSubmissionMigrationStep[]
>;

export function defineResourceFormSubmissionMigrationStep(
  step: ResourceFormSubmissionMigrationStep,
): ResourceFormSubmissionMigrationStep {
  if (!Number.isInteger(step.fromVersion) || step.fromVersion <= 0) {
    throw new Error("Resource form migration fromVersion must be a positive integer.");
  }

  if (!Number.isInteger(step.toVersion) || step.toVersion <= 0) {
    throw new Error("Resource form migration toVersion must be a positive integer.");
  }

  if (step.fromVersion === step.toVersion) {
    throw new Error("Resource form migration steps must change version.");
  }

  if (typeof step.transform !== "function") {
    throw new Error("Resource form migration step must declare a transform function.");
  }

  return step;
}

export function defineResourceFormSubmissionMigrationRegistry(
  registry: ResourceFormSubmissionMigrationRegistry,
): ResourceFormSubmissionMigrationRegistry {
  for (const [migrationKey, steps] of Object.entries(registry)) {
    if (typeof migrationKey !== "string" || migrationKey.trim().length === 0) {
      throw new Error("Resource form migration registry keys must be non-empty.");
    }

    const seenEdges = new Set<string>();
    for (const step of steps) {
      const normalized = defineResourceFormSubmissionMigrationStep(step);
      const edgeKey = `${normalized.fromVersion}->${normalized.toVersion}`;
      if (seenEdges.has(edgeKey)) {
        throw new Error(
          `Duplicate resource form migration step registered for ${migrationKey} ${edgeKey}.`,
        );
      }
      seenEdges.add(edgeKey);
    }
  }

  return registry;
}

function clonePayload(payload: ResourceFormSubmission): ResourceFormSubmission {
  return { ...payload };
}

function getSortedStepsForDirection(
  steps: ResourceFormSubmissionMigrationStep[],
  direction: "upgrade" | "downgrade",
): ResourceFormSubmissionMigrationStep[] {
  return steps
    .slice()
    .sort((a, b) => direction === "upgrade"
      ? a.fromVersion - b.fromVersion || a.toVersion - b.toVersion
      : b.fromVersion - a.fromVersion || b.toVersion - a.toVersion);
}

export function planResourceFormSubmissionMigration(params: {
  registry: ResourceFormSubmissionMigrationRegistry;
  migrationKey: string;
  fromVersion: number;
  toVersion: number;
}): ResourceFormSubmissionMigrationStep[] {
  const { registry, migrationKey, fromVersion, toVersion } = params;

  if (!Number.isInteger(fromVersion) || fromVersion <= 0) {
    throw new Error("Resource form migration fromVersion must be a positive integer.");
  }
  if (!Number.isInteger(toVersion) || toVersion <= 0) {
    throw new Error("Resource form migration toVersion must be a positive integer.");
  }

  if (fromVersion === toVersion) {
    return [];
  }

  const steps = registry[migrationKey] ?? [];
  if (steps.length === 0) {
    throw new Error(
      `No resource form submission migrations registered for "${migrationKey}".`,
    );
  }

  const direction = toVersion > fromVersion ? "upgrade" : "downgrade";
  const orderedSteps = getSortedStepsForDirection(steps, direction);
  const plan: ResourceFormSubmissionMigrationStep[] = [];
  let currentVersion = fromVersion;

  while (currentVersion !== toVersion) {
    const nextStep = orderedSteps.find((step) =>
      step.fromVersion === currentVersion
    );

    if (!nextStep) {
      throw new Error(
        `Missing resource form submission migration for "${migrationKey}" at version ${currentVersion}.`,
      );
    }

    plan.push(nextStep);
    currentVersion = nextStep.toVersion;
  }

  return plan;
}

export function migrateResourceFormSubmission(params: {
  registry: ResourceFormSubmissionMigrationRegistry;
  migrationKey: string;
  fromVersion: number;
  toVersion: number;
  payload: ResourceFormSubmission;
}): ResourceFormSubmission {
  const {
    registry,
    migrationKey,
    fromVersion,
    toVersion,
    payload,
  } = params;

  const steps = planResourceFormSubmissionMigration({
    registry,
    migrationKey,
    fromVersion,
    toVersion,
  });

  if (steps.length === 0) {
    return clonePayload(payload);
  }

  const direction = toVersion > fromVersion ? "upgrade" : "downgrade";

  return steps.reduce<ResourceFormSubmission>((currentPayload, step) => {
    const nextPayload = step.transform(clonePayload(currentPayload), {
      migrationKey,
      fromVersion,
      toVersion,
      stepFromVersion: step.fromVersion,
      stepToVersion: step.toVersion,
      direction,
    });

    return clonePayload(nextPayload);
  }, clonePayload(payload));
}

export function migrateResolvedResourceFormSubmission(params: {
  registry: ResourceFormSubmissionMigrationRegistry;
  form: Pick<ResolvedResourceForm, "migrationKey" | "schemaVersion">;
  toVersion: number;
  payload: ResourceFormSubmission;
}): ResourceFormSubmission {
  return migrateResourceFormSubmission({
    registry: params.registry,
    migrationKey: params.form.migrationKey,
    fromVersion: params.form.schemaVersion,
    toVersion: params.toVersion,
    payload: params.payload,
  });
}
