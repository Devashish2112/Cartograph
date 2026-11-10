import type { FileCategory } from "@/lib/graph/model";

function CategoryRailContent({
  categories,
  activeCategoryId,
  onSelect,
}: {
  categories: FileCategory[];
  activeCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
}) {
  return (
    <ul className="flex flex-col py-1">
      {categories.map((category) => (
        <li
          key={category.id}
          className="px-1"
        >
          <button
            type="button"
            className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-[11px] ${
              activeCategoryId === category.id
                ? "bg-accent/10 text-foreground"
                : "text-muted hover:bg-surface-muted"
            }`}
            onClick={() =>
              onSelect(activeCategoryId === category.id ? null : category.id)
            }
          >
            <span
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: category.color }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate">{category.label}</span>
            <span className="font-mono text-[10px] tabular-nums text-faint">
              {category.count}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function InteractiveCategoryRail({
  categories,
  activeCategoryId,
  onSelect,
}: {
  categories: FileCategory[];
  activeCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
}) {
  return (
    <CategoryRailContent
      categories={categories}
      activeCategoryId={activeCategoryId}
      onSelect={onSelect}
    />
  );
}
