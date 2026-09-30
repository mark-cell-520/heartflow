// 第 284 轮 probe5b：修 probe5 的路径 bug（rel 相对 TEST_DIR，不该再拼 TESTDIR）
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const TESTDIR = path.join(ROOT, 'test');

const j = JSON.parse(fs.readFileSync(path.join(__dirname, 'p3-r284-empty.json'), 'utf8'));
const targets = j.rep.map(r => r.rel);

const results = [];
for (const rel of targets) {
  const abs = path.join(ROOT, rel);
  const src = fs.readFileSync(abs, 'utf8');
  const isMount = /module\.exports\s*=\s*(?:function\b|[A-Za-z_$][\w$]*\s*;|\(?[^)]*\)?\s*=>)/.test(src);
  const isJest = /\bdescribe\s*\(/.test(src) && !/require\(['"][^'"]*mini-expect/.test(src);
  const runner = isMount ? 'mount' : (isJest ? 'jest' : 'sub');
  const cmd = runner === 'mount'
    ? `node ${JSON.stringify(path.join(TESTDIR, '_mount.js'))} ${JSON.stringify(abs)}`
    : runner === 'jest'
      ? `node -r ${JSON.stringify(path.join(TESTDIR, '_jest-globals.js'))} ${JSON.stringify(abs)}`
      : `node ${JSON.stringify(abs)}`;
  let len = 0, exit = null, last = '';
  try {
    const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', timeout: 100000, maxBuffer: 48 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
    len = (out || '').length; exit = 0;
    last = (out || '').trim().split('\n').filter(Boolean).pop() || '';
  } catch (e) {
    len = ((e.stdout || '')).length; exit = e.status === undefined ? 'err' : e.status;
    last = ((e.stdout || '')).trim().split('\n').filter(Boolean).pop() || '';
  }
  results.push({ rel, runner, len, exit, lastLine: last.slice(0, 80) });
}
const silent = results.filter(r => r.len === 0);
console.log('按 run-all 命令复刻执行：' + results.length + ' 个文件中 ' + silent.length + ' 个零输出');
console.log('ZERO_OUT_LIST ' + silent.map(r => r.rel + '(' + r.runner + ')').join(' '));
fs.writeFileSync(path.join(__dirname, 'p5b-r284-dispatch.json'), JSON.stringify({ results, silent }, null, 1));
