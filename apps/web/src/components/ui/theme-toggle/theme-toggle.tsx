import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-border bg-background p-1 gap-1",
        className
      )}
      role="radiogroup"
      aria-label="Theme"
    >
      <button
        role="radio"
        aria-checked={!isDark}
        suppressHydrationWarning
        onClick={() => setTheme("light")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
          !isDark
            ? "bg-muted text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sun className="size-3" />
        Light
      </button>
      <button
        role="radio"
        aria-checked={isDark}
        suppressHydrationWarning
        onClick={() => setTheme("dark")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
          isDark
            ? "bg-muted text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Moon className="size-3" />
        Dark
      </button>
    </div>
  );
}

export { ThemeToggle };
