// Theme modes: "auto" (time-based), "dark" (always dark), "light" (always light)
export type ThemeMode = "auto" | "dark" | "light";

const THEME_STORAGE_KEY = "lifebit-theme-mode";

export function getThemeMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light" || stored === "auto") return stored;
  return "auto";
}

export function setThemeMode(mode: ThemeMode) {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  applyTimeTheme();
}

// Auto dark shift after 7PM local time, or manual override
export function applyTimeTheme() {
  const mode = getThemeMode();

  if (mode === "dark") {
    document.documentElement.classList.add("dark");
    return;
  }
  if (mode === "light") {
    document.documentElement.classList.remove("dark");
    return;
  }

  // Auto mode: time-based
  const hour = new Date().getHours();
  const isEvening = hour >= 19 || hour < 6;

  if (isEvening) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function startTimeThemeWatcher() {
  applyTimeTheme();
  // Check every minute
  const interval = setInterval(applyTimeTheme, 60000);
  return () => clearInterval(interval);
}
