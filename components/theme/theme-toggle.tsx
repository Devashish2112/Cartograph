"use client";

import { useTheme } from "@/components/theme/theme-provider";
import type { ThemePreference } from "@/lib/theme";

const options: Array<{
  value: ThemePreference;
  label: string;
  title: string;
}> = [
  { value: "system", label: "Auto", title: "Follow the system theme" },
  { value: "light", label: "Light", title: "Force light theme" },
  { value: "dark", label: "Dark", title: "Force dark theme" },
];

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme"
      className="flex items-center rounded border border-border bg-surface-muted p-0.5"
    >
      {options.map((option) => {
        const selected = preference === option.value;

        return (
          <button
            key={option.value}
            type="button"
            title={option.title}
            aria-pressed={selected}
            onClick={() => setPreference(option.value)}
            className={
              selected
                ? "rounded bg-surface px-1.5 py-0.5 text-[11px] text-foreground"
                : "rounded px-1.5 py-0.5 text-[11px] text-faint hover:text-foreground"
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
