export type WriteScope = "project" | "global";
export const WRITE_SCOPES = ["project", "global"] as const satisfies readonly WriteScope[];
export type ProjectPolicyScope = WriteScope | "ask";
export const PROJECT_POLICY_SCOPES = ["project", "global", "ask"] as const satisfies readonly ProjectPolicyScope[];

export interface ProjectMemoryPolicy {
  projectId: string;
  projectName?: string;
  defaultScope: ProjectPolicyScope;
  updatedAt: string;
}

export function resolveWriteScope(
  explicitScope: WriteScope | undefined,
  projectPolicyScope: ProjectPolicyScope | undefined,
  hasProjectContext: boolean,
): WriteScope | "ask" {
  if (explicitScope) {
    return explicitScope;
  }

  if (projectPolicyScope) {
    return projectPolicyScope;
  }

  return hasProjectContext ? "project" : "global";
}
