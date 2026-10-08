// r642(本轮) 复测：platformAdapter 接线后可达性 + 白名单三分支。CJS 包装，禁顶层 await。
const path = require('path');
const fs = require('fs');
const repo = path.resolve(__dirname, '..');
const { HeartFlow } = require(path.join(repo, 'src/core/heartflow.js'));

async function main() {
  const hf = new HeartFlow();
  try { hf.start(); } catch (e) { console.log('START_WARN', e.message); }

  const out = {};
  out.hasInstance = !!hf.platformAdapter;
  out.inModules = Object.prototype.hasOwnProperty.call(hf._modules || {}, 'platformAdapter');
  const ar = HeartFlow.ALLOWED_ROUTES || new Set();
  out.paRoutes = [...ar].filter(r => String(r).startsWith('platformAdapter.'));
  try {
    const routes = hf.routes();
    out.routesHit = routes.filter(r => String(r).startsWith('platformAdapter.')).length;
  } catch (e) { out.routesError = e.message; }

  const inst = hf.platformAdapter;
  const proto = Object.getPrototypeOf(inst);
  const pubs = Object.getOwnPropertyNames(proto)
    .filter(m => !m.startsWith('_') && m !== 'constructor' && typeof inst[m] === 'function');
  const na = [], other = [];
  for (const m of pubs) {
    try { const p = hf.dispatch('platformAdapter.' + m); if (p && p.catch) p.catch(() => {}); }
    catch (e) { /not allowed/.test(String(e.message)) ? na.push(m) : other.push(m + ':' + String(e.message).slice(0, 60)); }
  }
  out.pubMethods = pubs.length;
  out.routeNotAllowed = na;
  out.otherErrors = other;

  if (out.inModules) {
    const root = hf.rootPath;
    try {
      const r1 = await hf.dispatch('platformAdapter.readFile', path.join(root, 'package.json'));
      out.readInsideRoot = r1 && r1.success === true ? 'ok(' + String(r1.content).length + ' chars)' : JSON.stringify(r1).slice(0, 120);
    } catch (e) { out.readInsideRoot = 'THREW:' + e.message; }
    try {
      const r2 = await hf.dispatch('platformAdapter.readFile', '/etc/shadow');
      out.readOutsideRoot = r2 && r2.error === 'path_not_allowed' ? 'blocked_path_not_allowed' : JSON.stringify(r2).slice(0, 140);
    } catch (e) { out.readOutsideRoot = 'THREW:' + e.message; }
    try {
      const r4 = await hf.dispatch('platformAdapter.writeFile', '/tmp/r643-should-not-exist.txt', 'x');
      out.writeOutsideRoot = r4 && r4.error === 'path_not_allowed' ? 'blocked_path_not_allowed' : JSON.stringify(r4).slice(0, 140);
    } catch (e) { out.writeOutsideRoot = 'THREW:' + e.message; }
  }
  console.log(JSON.stringify(out, null, 1));
}
main().then(() => process.exit(0)).catch(e => { console.log('FATAL', e.message); process.exit(1); });
