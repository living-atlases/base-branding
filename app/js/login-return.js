import settings from './settings.js';

// The login link of the banner is the bare CAS login URL: the build puts it in the home, and the
// ALA apps fill ::loginURL:: with it too. That logs in to CAS and stays there, and an app that
// signs in by OIDC never learns about it. So:
// - on a page of one of the apps (settings.services), the link goes to that app's /login?path=,
//   ala-auth's LoginController: it signs in by OIDC and comes back to this page;
// - anywhere else (the static home) it goes to CAS with ?service= this page.
// The logout link gets the way back too: an app's own /logout (what the apps put there) and the
// bare CAS logout (the home) both take ?url=, and without it they land on the app root or on CAS.

const APPS = ['biocache', 'bie', 'regions', 'lists', 'collectory', 'spatial', 'images', 'alerts', 'doi', 'dashboard'];

const isCasLogin = url => /\/cas\/login\/?$/.test(url.pathname);
const isLogout = url => /\/logout\/?$/.test(url.pathname);
const hasReturn = url => ['url', 'appUrl', 'service'].some(k => url.searchParams.has(k));

// The app whose URL is the longest prefix of the page
function appOf(page, services) {
  let best = null;
  for (const key of APPS) {
    const raw = services && services[key] && services[key].url;
    if (!raw) continue;
    let app;
    try {
      app = new URL(raw);
    } catch (e) {
      continue;
    }
    const base = app.pathname.replace(/\/$/, '');
    const inside = page.origin === app.origin && (base === '' || page.pathname === base || page.pathname.startsWith(`${base}/`));
    if (inside && (!best || base.length > best.base.length)) best = { origin: app.origin, base };
  }
  return best;
}

export function addLoginReturn(root = document, here = window.location.href, services = settings.services) {
  const back = new URL(here);
  back.searchParams.delete('ticket'); // the one CAS appends when it comes back
  // the language is in the i18next cookie already, and a crafted ?lang= must not travel on
  back.searchParams.delete('lang');
  back.hash = '';
  const app = appOf(back, services);
  root.querySelectorAll('a.loginBtn, a.logoutBtn').forEach(a => {
    let url;
    try {
      url = new URL(a.getAttribute('href') || '', back);
    } catch (e) {
      return;
    }
    if (/\blogoutBtn\b/.test(a.className || '')) {
      // CAS, or an app of this same host
      if (isLogout(url) && !hasReturn(url) && (/\/cas\/logout\/?$/.test(url.pathname) || url.origin === back.origin)) {
        url.searchParams.set('url', back.href);
        a.setAttribute('href', url.href);
      }
      return;
    }
    if (!isCasLogin(url) || url.searchParams.has('service')) return;
    if (app) {
      const login = new URL(`${app.origin}${app.base}/login`);
      login.searchParams.set('path', back.pathname + back.search);
      a.setAttribute('href', login.href);
    } else {
      url.searchParams.set('service', back.href);
      a.setAttribute('href', url.href);
    }
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => addLoginReturn());
  } else {
    addLoginReturn();
  }
}
