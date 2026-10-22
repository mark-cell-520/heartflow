// r604 精确候选探针 v3：真未接线判据 = ALLOWED_ROUTES 里**没有任何**以该键开头的路由。
// （上一版只用「_modules 无键」作判据，被 selfPositioning 别名骗过——selfPositioning
//   在 _modules 里、12 条路由全活，但它不是 hidden key，别名指向同一个对象。
//   本版双向核对：_modules 键 + ALLOWED_ROUTES 前缀。）
// 输出：真未接线 + 有 MCP/源码引用 + 辨别方法占比 + 零抛情况。
// 只输出布尔与名字，不贴样本原文。
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

const DISCRIMINATION_VERBS = [
  'judge', 'evaluate', 'check', 'detect', 'assess', 'discriminate', 'verify',
  'audit', 'review', 'inspect', 'score', 'validate', 'screen', 'filter',
  'guard', 'monitor', 'supervise', 'weigh', 'measure', 'estimate', 'classify', 'resolve',
];

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();

  const moduleKeys = new Set(Object.keys(hf._modules));
  const AR = HeartFlow.ALLOWED_ROUTES;
  const arKeys = new Set([...AR].map(r => r.split('.')[0]));

  // MCP 引用扫描
  const mcpSrc = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
  const srcFiles = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) { walk(path.join(dir, e.name)); continue; }
      if (!e.name.endsWith('.js')) continue;
      srcFiles.push(path.join(dir, e.name));
    }
  })(path.join(ROOT, 'src'));
  const otherTexts = srcFiles.filter(f => !f.endsWith('src/mcp-server.js') && !f.endsWith('src/core/heartflow.js'))
    .map(f => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { return ''; } });

  const rows = [];
  for (const k of Object.keys(hf)) {
    if (k.startsWith('_')) continue;
    if (moduleKeys.has(k)) continue;
    const v = hf[k];
    if (!v || typeof v !== 'object') continue;
    // 真未接线：ALLOWED_ROUTES 无该键前缀（排除别名已注册的情形）
    if (arKeys.has(k)) { continue; }
    const proto = Object.getPrototypeOf(v);
    const methods = proto && proto !== Object.prototype
      ? Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof v[m] === 'function' && !m.startsWith('_'))
      : [];
    const own = Object.keys(v).filter(m => typeof v[m] === 'function' && !m.startsWith('_'));
    const all = [...new Set([...methods, ...own])];
    if (all.length === 0) continue;

    let ok = 0, bad = 0;
    const zeroThrowMethods = [], throwMethods = [];
    for (const m of all) {
      let tag;
      try {
        const r = v[m]();
        if (r && typeof r.then === 'function') { r.then(() => {}, () => {}); tag = 'ASYNC'; }
        else tag = (r !== undefined) ? 'OK' : 'UNDEF';
      } catch (e) { tag = 'THROW'; }
      if (tag === 'THROW') { bad++; throwMethods.push(m); } else { ok++; zeroThrowMethods.push(m); }
    }

    const re = new RegExp('\\.' + k + '\\b', 'g');
    const inMcp = (mcpSrc.match(re) || []).length;
    let inSrc = 0;
    for (const s of otherTexts) inSrc += (s.match(re) || []).length;

    const disc = all.filter(m => DISCRIMINATION_VERBS.some(vb => m.toLowerCase().includes(vb)));
    const discZero = disc.filter(m => zeroThrowMethods.includes(m));
    rows.push({ k, n: all.length, ok, bad, inMcp, inSrc, discN: disc.length, discZero: discZero.length, zeroThrowMethods, throwMethods });
  }

  rows.sort((a, b) => (b.inMcp * 5 + b.inSrc + b.discZero * 4 + b.discN * 2) - (a.inMcp * 5 + a.inSrc + a.discZero * 4 + a.discN * 2));
  console.log('total_UNWIRED=' + rows.length);
  for (const r of rows) {
    console.log(`${r.k}\tn=${r.n}\tzeroThrow=${r.ok}\tthrow=${r.bad}\tmcp=${r.inMcp}\tsrc=${r.inSrc}\tdisc=${r.discN}(zero:${r.discZero})\tZT=[${r.zeroThrowMethods.join(',')}]`);
  }
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
