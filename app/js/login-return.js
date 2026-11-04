// The login link of the banner is the bare CAS login URL: the build puts it in the home, and the
// ALA apps fill ::loginURL:: with it too. Without ?service= CAS does not know where to go back
// after the login, so it stays on its own page. Point it back to the page the visitor is on.

const isCasLogin = url => /\/cas\/login\/?$/.test(url.pathname);

export function addLoginReturn(root = document, here = window.location.href) {
  const back = new URL(here);
  back.searchParams.delete('ticket'); // the one CAS appends when it comes back
  back.hash = '';
  root.querySelectorAll('a.loginBtn').forEach(a => {
    let url;
    try {
      url = new URL(a.getAttribute('href') || '', back);
    } catch (e) {
      return;
    }
    if (!isCasLogin(url) || url.searchParams.has('service')) return;
    url.searchParams.set('service', back.href);
    a.setAttribute('href', url.href);
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => addLoginReturn());
  } else {
    addLoginReturn();
  }
}
