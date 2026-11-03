// On a page shorter than the window, push the footer down to the bottom of the window instead
// of leaving it halfway up. Done here and not with html/body CSS (min-height, flex) because the
// footer reaches every module page and CAS, whose own layouts that CSS would break: only the
// footer's margin-top changes, by the empty space left under it.

const fill = footer => {
  footer.style.marginTop = '';
  // documentElement.scrollHeight never drops below the window height, so measure the footer
  const body = getComputedStyle(document.body);
  const below = (parseFloat(body.marginBottom) || 0) + (parseFloat(body.paddingBottom) || 0);
  const gap = window.innerHeight - (footer.getBoundingClientRect().bottom + window.scrollY) - below;
  if (gap > 0) {
    const base = parseFloat(getComputedStyle(footer).marginTop) || 0;
    footer.style.marginTop = `${base + gap}px`;
  }
};

const start = () => {
  const footer = document.getElementById('la-footer');
  if (!footer) return;
  let queued = false;
  const update = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; fill(footer); });
  };
  update();
  window.addEventListener('load', update);
  window.addEventListener('resize', update);
  // Content that grows later (widgets, ALA apps that render client side)
  if (window.ResizeObserver) new ResizeObserver(update).observe(document.body);
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
