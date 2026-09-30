// 第 284 轮 probe5：定位 run-all 为什么没给 123 个文件走 mount/jest runner。
// 复刻 run-all 的 dispatching 逻辑，但**加上 stdout 捕获与落盘**，逐文件比对
// run-all 实际命令与探针命令的差异。只报数字与结构。
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const TESTDIR = path.join(ROOT, 'test');

const j = JSON.parse(fs.readFileSync(path.join(__dirname, 'p3-r284-empty.json'), 'utf8'));
const targets = j.rep.map(r => r.rel);

// 复刻 run-all.js 的 runChild 输出过滤：只有 "keep" 行会打印，
// 但那是 run-all 自己打印。真正的问题是 execSync 是否拿到了 stdout。
// 这里直接调 run-all 的 collectTestFiles + runWithBestRunner 判定 + 手动执行。
function collectTestFiles(dir, base = dir) {
  const out = [];
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'archive') continue;
      out.push(...collectTestFiles(full, base));
    } else if (ent.name.endsWith('.test.js') && ent.name !== 'run-all.test.js') {
      out.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return out.sort();
}

const all = collectTestFiles(TESTDIR);
console.log('run-all 收集到的文件数 ' + all.length);

// run-all 用绝对路径传给 _mount.js
const results = [];
for (const rel of targets) {
  const abs = path.join(TESTDIR, rel);
  const src = fs.readFileSync(abs, 'utf8');
  const isMount = /module\.exports\s*=\s*(?:function\b|[A-Za-z_$][\w$]*\s*;|\(?[^)]*\)?\s*=>)/.test(src);
  const isJest = /\bdescribe\s*\(/.test(src) && !/require\(['"][^'"]*mini-expect/.test(src);
  const runner = isMount ? 'mount' : (isJest ? 'jest' : 'sub');
  // run-all 传的是绝对路径给 _mount.js；p3 探针传的是相对路径
  const cmd = runner === 'mount'
    ? `node ${JSON.stringify(path.join(TESTDIR, '_mount.js'))} ${JSON.stringify(abs)}`
    : runner === 'jest'
      ? `node -r ${JSON.stringify(path.join(TESTDIR, '_jest-globals.js'))} ${JSON.stringify(abs)}`
      : `node ${JSON.stringify(abs)}`;
  let len = 0, exit = null, first = '';
  try {
    const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', timeout: 100000, maxBuffer: 48 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
    len = (out || '').length; exit = 0; first = (out || '').trim().split('\n').filter(Boolean).pop() || '';
  } catch (e) {
    len = ((e.stdout || '')).length; exit = e.status === undefined ? 'err' : e.status;
    first = ((e.stdout || '')).trim().split('\n').filter(Boolean).pop() || '';
  }
  results.push({ rel, runner, len, exit, lastLine: first.slice(0, 80) });
}
const silent = results.filter(r => r.len === 0);
console.log('按 run-all 命令复刻执行：' + results.length + ' 个文件中 ' + silent.length + ' 个零输出');
console.log('ZERO_OUT_LIST ' + silent.map(r => r.rel + '(' + r.runner + ')').join(' '));
fs.writeFileSync(path.join(__dirname, 'p5-r284-dispatch.json'), JSON.stringify({ results, silent }, null, 1));
