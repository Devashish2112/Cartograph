import type { FileCategory } from "@/lib/graph/model";

export function CategoryRail({ categories }: { categories: FileCategory[] }) {
  return (
    <ul className="flex flex-col py-1">
      {categories.map((category) => (
        <li
          key={category.id}
          className="flex items-center gap-2 px-3 py-1.5 text-[11px]"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-[2px]"
            style={{ backgroundColor: category.color }}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate text-muted">
            {category.label}
          </span>
          <span className="font-mono text-[10px] tabular-nums text-faint">
            {category.count}
          </span>
        </li>
      ))}
    </ul>
  );
}
