// The static /about page has no React, so it follows the system theme the way the app does.
const dark = window.matchMedia('(prefers-color-scheme: dark)')
const apply = () => document.documentElement.classList.toggle('dark', dark.matches)
apply()
dark.addEventListener('change', apply)
