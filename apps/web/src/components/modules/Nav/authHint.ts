// Shared by the root layout (server) and AuthSlot (client), so it lives outside
// the "use client" module

/** localStorage key for the last known sign-in state */
export const AUTH_HINT_KEY = "ia-auth";

/**
 * Runs in <head> before first paint: sets <html data-auth="in|out"> from the
 * last known session so the nav shows the right controls (and size) straight
 * away, even on static pages. Only a UI hint; the real session check is Convex.
 */
export const authHintScript = `(function(){var a="out";try{if(localStorage.getItem("${AUTH_HINT_KEY}")==="1")a="in"}catch(e){}document.documentElement.setAttribute("data-auth",a)})()`;
