export type Theme = "light" | "dark" | "system";

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}
