// r225：探测 emotion / psychology / dream / introspect 四个「死能力」的运行时可达性
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

function probeOne(modPath, expr) {
  try {
    const mod = require(path.join(ROOT, modPath));
    const keys = Object.keys(mod || {});
    return { ok: true, keys: keys.slice(0, 30), count: keys.length };
  } catch (e) {
    return { ok: false, error: String(e && e.message).slice(0, 120) };
  }
}

const targets = [
  'src/cortex/emotion.js',
  'src/cortex/psychology.js',
  'src/cortex/dream.js',
  'src/cortex/introspect.js',
  'src/cortex/judgment.js',
  'src/cortex/empathy.js',
];

const out = [];
for (const t of targets) {
  const r = probeOne(t, null);
  out.push({ module: t, ...r });
  console.log(`${t}  ${r.ok ? 'OK exports=' + r.count + ' [' + (r.keys.join(',') || '(none)') + ']' : 'FAIL ' + r.error}`);
}

// 运行时主对象上是否挂载
try {
  const main = require(path.join(ROOT, 'src', 'index.js'));
  const topKeys = Object.keys(main || {}).filter(k => /^[a-z]/.test(k));
  console.log('\n=== src/index.js 可调用导出（小写开头）===');
  console.log(topKeys.join(', '));
} catch (e) {
  console.log('index require FAIL: ' + (e && e.message).slice(0, 160));
}
