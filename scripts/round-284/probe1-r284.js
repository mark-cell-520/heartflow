// 第 284 轮 probe1：列出所有「未输出 N 通过, M 失败 汇总行」的测试文件（run-all 假失败清单）
// 只报数字和文件名，不贴样本原文。
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const TESTDIR = path.join(ROOT, 'test');

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.test.js')) acc.push(p);
  }
  return acc;
}

// 与 run-all.js 的识别口径保持一致（多格式）
function parseSummary(out) {
  let m = out.match(/(\d+)\s*(?:通过|passed)\s*[/,]?\s*(\d+)\s*(?:失败|failed)/);
  if (m) return { passed: parseInt(m[1], 10), failed: parseInt(m[2], 10), how: 'summary' };
  const r = out.match(/(\d+)\s*\/\s*(\d+)\s*(?:passed|通过|tests?\b|个|条)/)
    || out.match(/合计\s*(\d+)\s*\/\s*(\d+)/);
  if (r) return { passed: parseInt(r[1], 10), failed: Math.max(0, parseInt(r[2], 10) - parseInt(r[1], 10)), how: 'ratio' };
  const passLines = (out.match(/^\s*PASS\b.*$/gm) || []).length;
  const skipLines = (out.match(/^\s*SKIP\b.*$/gm) || []).length;
  if (passLines > 0 || skipLines > 0) return { passed: passLines, failed: 0, how: 'passline' };
  return null;
}

const files = walk(TESTDIR, []);
const silent = [];
let n = 0;
for (const f of files) {
  n++;
  let out = '';
  try {
    out = execSync(`node "${f}"`, { cwd: ROOT, encoding: 'utf8', timeout: 100000, maxBuffer: 48 * 1024 * 1024 });
  } catch (e) {
    out = (e.stdout || '').toString();
  }
  const parsed = parseSummary(out);
  if (!parsed) {
    const rel = path.relative(ROOT, f);
    const lines = out.trim().split('\n');
    silent.push({
      file: rel,
      exitLines: lines.filter(l => /通过|passed|失败|failed|✗|PASS|SKIP/i.test(l)).slice(0, 3),
      tail: lines.slice(-2).join(' | ').slice(0, 160),
      len: out.length,
    });
  }
}
console.log(JSON.stringify({ scanned: n, silentCount: silent.length, silent }, null, 1));
fs.writeFileSync(path.join(__dirname, 'p1-r284-silent.json'), JSON.stringify({ scanned: n, silentCount: silent.length, silent }, null, 1));
