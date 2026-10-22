// r633: 真升级方向复测——全量扫描 hidden instance（实例活、_modules 无键、ALLOWED_ROUTES 0 条）。
// 只读探针，不碰引擎。
const fs = require('fs');
const path = require('path');
const { HeartFlow } = require('../src/core/heartflow.js');

const SRC = path.join(__dirname, '..', 'src');

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = walk(SRC, []);
const dispatchSrc = fs.readFileSync(path.join(SRC, 'core', 'engine-dispatcher.js'), 'utf8');
const mcpSrc = fs.readFileSync(path.join(SRC, 'mcp-server.js'), 'utf8');

(async () => {
  const hf = new HeartFlow();
  await hf.start();
  const names = Object.keys(hf).filter(k => {
    const v = hf[k];
    return v && typeof v === 'object' && typeof v.constructor !== 'undefined' &&
      Object.getPrototypeOf(v) !== Object.prototype && Object.getPrototypeOf(v) !== Array.prototype &&
      Object.getPrototypeOf(v) !== null && Object.getPrototypeOf(v).constructor !== Object;
  });
  // 去掉原型链属于 Object 的内核字段，只留实例
  const rows = [];
  for (const n of names) {
    const inst = hf[n];
    const proto = Object.getPrototypeOf(inst);
    if (!proto || proto === Object.prototype || proto === Array.prototype || proto === Function.prototype) continue;
    const methods = Object.getOwnPropertyNames(proto)
      .filter(m => m !== 'constructor' && typeof inst[m] === 'function');
    const modKey = (hf._modules && Object.prototype.hasOwnProperty.call(hf._modules, n)) ? 1 : 0;
    const routes = (dispatchSrc.match(new RegExp('\\.' + n + '\\.', 'g')) || []).length;
    const srcRefs = files.reduce((a, f) => {
      const s = fs.readFileSync(f, 'utf8');
      return a + (s.match(new RegExp('\\.' + n + '\\.', 'g')) || []).length;
    }, 0);
    const mcp = (mcpSrc.match(new RegExp('heartflow_' + n.toLowerCase(), 'g')) || []).length;
    rows.push({ n, m: methods.length, modKey, routes, srcRefs, mcp, methods: methods.join(',') });
  }
  console.log('TOTAL_INSTANCES=' + rows.length);
  console.log('UNWIRED(modKey=0 && srcRefs=0):');
  for (const r of rows.filter(r => r.modKey === 0 && r.srcRefs === 0)) console.log('  ' + r.n + ' m=' + r.m + ' mcp=' + r.mcp + ' [' + r.methods + ']');
  console.log('WEAK(modKey=0 && srcRefs>0 && routes=0):');
  for (const r of rows.filter(r => r.modKey === 0 && r.srcRefs > 0 && r.routes === 0)) console.log('  ' + r.n + ' m=' + r.m + ' srcRefs=' + r.srcRefs + ' mcp=' + r.mcp);
  console.log('WIRED(dispatch>0):');
  for (const r of rows.filter(r => r.routes > 0)) console.log('  ' + r.n + ' m=' + r.m + ' routes=' + r.routes + ' srcRefs=' + r.srcRefs);
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
