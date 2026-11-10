import type { ReactNode } from "react";

export function ExplorerShell({
  rail,
  map,
  detail,
}: {
  rail?: ReactNode;
  map: ReactNode;
  detail?: ReactNode;
}) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[200px_minmax(0,1fr)_300px]">
      <aside
        className="flex min-h-0 flex-col border-r border-border bg-surface"
        aria-label="File categories"
      >
        <div className="flex h-9 shrink-0 items-center border-b border-border px-3">
          <h2 className="text-[11px] font-medium text-muted">Categories</h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{rail}</div>
      </aside>

      <section
        className="relative min-h-0 overflow-hidden bg-background"
        aria-label="Dependency map"
      >
        {map}
      </section>

      <aside
        className="flex min-h-0 flex-col border-l border-border bg-surface"
        aria-label="Details"
      >
        <div className="flex h-9 shrink-0 items-center border-b border-border px-3">
          <h2 className="text-[11px] font-medium text-muted">Details</h2>
        </div>
        <div className="min-h-0 flex-1">{detail}</div>
      </aside>
    </div>
  );
}
