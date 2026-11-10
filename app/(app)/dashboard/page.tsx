import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";

import { getCurrentOrganization } from "@/lib/auth";
import {
  listAnalyses,
  type AnalysisListItem,
  type AnalysisState,
} from "@/lib/analyses";

const timestampFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

const stateStyles: Record<
  AnalysisState,
  { label: string; dot: string; text: string }
> = {
  pending: { label: "pending", dot: "bg-faint", text: "text-muted" },
  running: { label: "running", dot: "bg-accent", text: "text-accent" },
  complete: { label: "complete", dot: "bg-incoming", text: "text-incoming" },
  failed: { label: "failed", dot: "bg-danger", text: "text-danger" },
  unknown: { label: "unknown", dot: "bg-faint", text: "text-faint" },
};

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "—";
  }

  return timestampFormat.format(new Date(value));
}

function describeStage(analysis: AnalysisListItem): string {
  if (analysis.state === "failed" && analysis.errorStage) {
    return `failed at ${analysis.errorStage}`;
  }

  if (analysis.stageMessage) {
    return analysis.stageMessage;
  }

  if (analysis.stage) {
    return analysis.stage;
  }

  return analysis.state === "pending" ? "waiting to start" : "—";
}

function displayRole(role: string | null): string | null {
  if (!role) {
    return null;
  }

  return role.startsWith("org:") ? role.slice(4) : role;
}

function countLabel(count: number): string {
  if (count === 0) {
    return "none";
  }

  return `${count} ${count === 1 ? "analysis" : "analyses"}`;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  await auth.protect();
  const [organization, analyses] = await Promise.all([
    getCurrentOrganization(),
    listAnalyses(),
  ]);
  const role = displayRole(organization?.role ?? null);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Analyses</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted">
            <span className="truncate">
              {organization?.name ?? "No active organization"}
            </span>
            {role ? (
              <span className="rounded-sm border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted">
                {role}
              </span>
            ) : null}
          </div>
        </div>
        <p className="font-mono text-[11px] text-faint">
          {countLabel(analyses.length)}
        </p>
      </header>

      <section className="overflow-hidden rounded border border-border bg-surface">
        {analyses.length === 0 ? (
          <EmptyAnalyses />
        ) : (
          <>
            <div className="hidden grid-cols-[18px_minmax(0,1.35fr)_minmax(0,1fr)_80px_96px] gap-x-3 border-b border-border bg-surface-muted px-3 py-1.5 text-[10px] text-faint sm:grid">
              <span aria-hidden />
              <span>Repository</span>
              <span>State</span>
              <span>Commit</span>
              <span className="text-right">Started</span>
            </div>

            <ul className="divide-y divide-border">
              {analyses.map((analysis) => {
                const state = stateStyles[analysis.state];

                return (
                  <li
                    key={analysis.id}
                    className="grid grid-cols-[18px_minmax(0,1fr)] gap-x-3 px-3 py-3 sm:grid-cols-[18px_minmax(0,1.35fr)_minmax(0,1fr)_80px_96px] sm:items-start"
                  >
                    <div className="relative row-span-3 flex justify-center sm:row-span-1">
                      <span
                        className="absolute inset-y-0 w-px bg-border"
                        aria-hidden
                      />
                      <span
                        className={`relative mt-1.5 h-2 w-2 rounded-[2px] ring-2 ring-surface ${state.dot}`}
                        aria-hidden
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {analysis.projectName}
                      </p>
                      <p className="truncate font-mono text-[10px] text-faint">
                        {analysis.repoUrl}
                      </p>
                    </div>

                    <div className="min-w-0 pt-1.5 sm:pt-0">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] ${state.text}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${state.dot}`}
                          aria-hidden
                        />
                        {state.label}
                      </span>
                      <p className="mt-1 truncate text-[11px] text-muted">
                        {describeStage(analysis)}
                      </p>
                      {analysis.state === "failed" &&
                      analysis.errorMessage ? (
                        <p className="mt-0.5 line-clamp-2 text-[10px] text-danger">
                          {analysis.errorMessage}
                        </p>
                      ) : null}
                    </div>

                    <div className="col-start-2 flex items-baseline justify-between gap-3 pt-1 font-mono text-[10px] text-faint sm:col-span-2 sm:col-start-4 sm:row-start-1 sm:pt-0">
                      <span>
                        {analysis.commitSha
                          ? analysis.commitSha.slice(0, 7)
                          : "no commit"}
                      </span>
                      <span>{formatTimestamp(analysis.createdAt)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function EmptyAnalyses() {
  return (
    <div className="flex flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:gap-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-dashed border-border-strong text-faint">
        <DependencyGlyph />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">
          No analyses in this workspace.
        </p>
        <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">
          When a repository is analysed, its run and state will appear here.
        </p>
      </div>
    </div>
  );
}

function DependencyGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden
    >
      <circle cx="5" cy="6" r="2.25" />
      <circle cx="19" cy="6" r="2.25" />
      <circle cx="12" cy="18" r="2.25" />
      <path
        d="M7.25 6h9.5M6.1 8l4.5 7.8M17.9 8l-4.5 7.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DashboardFallback() {
  return (
    <div
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-6"
      aria-hidden
    >
      <div className="flex flex-col gap-2 border-b border-border pb-4">
        <div className="h-5 w-28 rounded bg-surface-muted" />
        <div className="h-3 w-40 rounded bg-surface-muted" />
      </div>
      <div className="overflow-hidden rounded border border-border bg-surface">
        <div className="h-8 border-b border-border bg-surface-muted" />
        <div className="h-16 border-b border-border" />
        <div className="h-16 border-b border-border" />
        <div className="h-16" />
      </div>
    </div>
  );
}
