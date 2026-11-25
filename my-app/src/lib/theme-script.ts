/**
 * FOUC prevention: set `.dark` on <html> before React hydrates. Reads the
 * user's override from localStorage, else `prefers-color-scheme`. Inlined in
 * the root layout's <head> so it runs before first paint.
 *
 * Its SHA-256 is allowlisted in the nonce-based CSP (src/lib/csp.ts), so the
 * script runs on routes whose policy has no 'unsafe-inline' without the root
 * layout reading the per-request nonce (which would make every route
 * dynamic). Change the script and the hash together; a unit test checks they
 * match.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var e=localStorage.getItem("bh-theme");if(e==="dark"||e==="light"){document.documentElement.classList.toggle("dark",e==="dark");return}if(window.matchMedia("(prefers-color-scheme:dark)").matches){document.documentElement.classList.add("dark")}}catch(e){}})()`;

export const THEME_INIT_SCRIPT_SHA256 = "PIPFT0oN6/u7IMUmdLcVVjriRJRKZwuDGbsLASF2YTI=";
