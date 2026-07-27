// Paints the right theme before first frame — no flash on cold start.
// Kept as a file rather than an inline script so the desktop shell can run a
// strict CSP with no 'unsafe-inline'.
(() => {
  const stored = localStorage.getItem("habit-tracker-theme");
  const dark =
    stored === "dark" ||
    ((!stored || stored === "system") &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  if (dark) document.documentElement.classList.add("dark");
})();
