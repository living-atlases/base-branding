// npm run demo: builds every theme into demo/<theme>/ for http://localhost:4180/<theme>/ and writes
// demo/index.html, a page to switch between them. Serve demo/ with any static server
// (.claude/launch.json has one). With settings.isDevel the numbers are mocked and the charts read ALA.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = process.env.DEMO_PORT || 4180;
// The pages load the branding from this host: DEMO_HOST=<your LAN IP> to open the demo from another
// device (serve it on 0.0.0.0, as .claude/launch.json does)
const host = process.env.DEMO_HOST || 'localhost';
const themes = process.argv.slice(2).length ? process.argv.slice(2)
  : ['clean', 'cosmo', 'darkly', 'flatly', 'paper', 'sandstone', 'simplex', 'slate', 'superhero', 'yeti'];
const out = path.resolve(root, process.env.DEMO_OUT || 'demo'); // DEMO_OUT: another folder, for the check
fs.mkdirSync(out, { recursive: true });

for (const theme of themes) {
  console.log(`${theme}: building`);
  const env = { ...process.env, LA_THEME: theme, BASE_BRANDING_URL: `http://${host}:${port}/${theme}` };
  const vite = extra => execFileSync('npx', ['vite', 'build', '--logLevel', 'error'], { cwd: root, env: { ...env, ...extra }, stdio: ['ignore', 'ignore', 'inherit'] });
  vite({});
  vite({ BUILD_INIT: '1' });
  fs.rmSync(path.join(out, theme), { recursive: true, force: true });
  fs.cpSync(path.join(root, 'dist'), path.join(out, theme), { recursive: true });
}

const all = fs.readdirSync(out).filter(d => fs.existsSync(path.join(out, d, 'index.html'))).sort();
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>base-branding demo</title>
<style>
body{margin:0;font:14px system-ui,sans-serif;display:flex;flex-direction:column;height:100vh}
nav{display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:8px 12px;background:#222;color:#fff}
nav a{color:#fff;text-decoration:none;padding:4px 10px;border-radius:4px;background:#444}
nav a.on{background:#e3a72f;color:#111}
nav .w{margin-left:auto;display:flex;gap:6px}
nav label{display:flex;gap:4px;align-items:center;margin-left:12px}
iframe{flex:1;border:0;width:100%;margin:0 auto;display:block;background:#fff}
</style></head><body>
<nav><b>Theme</b> ${all.map(t => `<a href="#${t}" data-t="${t}">${t}</a>`).join(' ')}
<label title="Try another primary colour (only in this demo)">primary <input type="color" id="c" value="#00838f"></label>
<span class="w"><a href="#" data-w="100%">desktop</a><a href="#" data-w="390px">mobile</a><a href="#" data-p="testPage.html">module page</a><a href="#" data-p="">home</a></span></nav>
<iframe id="f"></iframe>
<script>
const f = document.getElementById('f');
let theme = location.hash.slice(1) || '${all[0]}', page = '';
const go = () => {
  f.src = '/' + theme + '/' + page;
  document.querySelectorAll('[data-t]').forEach(a => a.classList.toggle('on', a.dataset.t === theme));
};
document.querySelectorAll('[data-t]').forEach(a => a.onclick = () => { theme = a.dataset.t; setTimeout(go); });
document.querySelectorAll('[data-w]').forEach(a => a.onclick = e => { e.preventDefault(); f.style.width = a.dataset.w; });
document.querySelectorAll('[data-p]').forEach(a => a.onclick = e => { e.preventDefault(); page = a.dataset.p; go(); });
// Primary colour preview: the --la-* tokens that follow it, set on the page in the frame
const c = document.getElementById('c');
const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) * (1 - t) + parseInt(b.substr(i, 2), 16) * t).toString(16).padStart(2, '0')).join('');
const paint = () => {
  const d = f.contentDocument && f.contentDocument.documentElement;
  if (!d || !c.dataset.on) return;
  const st = getComputedStyle(d);
  const light = st.getPropertyValue('--la-header-ink').trim() !== '#ffffff';
  d.style.setProperty('--la-primary', c.value);
  d.style.setProperty('--la-highlight', c.value);
  d.style.setProperty('--la-primary-dark', mix(c.value, '#000000', 0.45));
  if (light) d.style.setProperty('--la-header-accent', c.value);
};
c.oninput = () => { c.dataset.on = 1; paint(); };
f.addEventListener('load', paint);
go();
</script></body></html>
`);
console.log(`demo ready: serve ${path.relative(process.cwd(), out)}/ on port ${port}, open http://${host}:${port}/`);
