/**
 * Theme Controller module for Satvik Sethia Portfolio
 * Handles theme switching, system preference detection, and localStorage persistence.
 */

export function initTheme() {
  const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
  
  if (!themeToggleBtns.length) return;

  // Retrieve theme state (already initialized in head block to prevent flash)
  let currentTheme = localStorage.getItem('theme') || 
                     (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  // Function to apply the theme
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    currentTheme = theme;
  };

  // Bind click handlers to theme toggle buttons
  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(targetTheme);
    });
  });

  // Watch for system color scheme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      applyTheme(newSystemTheme);
    }
  });
}
