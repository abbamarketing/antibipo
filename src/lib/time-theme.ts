// Auto dark shift after 7PM local time
export function applyTimeTheme() {
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
