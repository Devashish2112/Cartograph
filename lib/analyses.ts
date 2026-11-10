import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AnalysisState =
  | "pending"
  | "running"
  | "complete"
  | "failed"
  | "unknown";

export type AnalysisListItem = {
  id: string;
  state: AnalysisState;
  stage: string | null;
  stageMessage: string | null;
  errorStage: string | null;
  errorMessage: string | null;
  commitSha: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  projectName: string;
  repoUrl: string;
};

function toAnalysisState(value: string): AnalysisState {
  switch (value) {
    case "pending":
    case "running":
    case "complete":
    case "failed":
      return value;
    default:
      return "unknown";
  }
}

/**
 * Deliberately has no organization filter. The active organization comes from
 * the Clerk token and the row-level policy decides which analyses come back.
 */
export async function listAnalyses(limit = 50): Promise<AnalysisListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("analyses")
    .select(
      "id, status, stage, stage_message, error_stage, error_message, commit_sha, created_at, started_at, finished_at, project:projects(name, repo_url)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Could not load analyses: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    state: toAnalysisState(row.status),
    stage: row.stage,
    stageMessage: row.stage_message,
    errorStage: row.error_stage,
    errorMessage: row.error_message,
    commitSha: row.commit_sha,
    createdAt: row.created_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    projectName: row.project?.name ?? "Unknown project",
    repoUrl: row.project?.repo_url ?? "",
  }));
}
