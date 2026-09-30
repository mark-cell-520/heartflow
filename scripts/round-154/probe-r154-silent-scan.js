// 第 154 轮探针：run-all 静默文件扫描
// 目的：回答上一轮遗留的「1 个失败未定位」到底是哪些文件、是真失败还是显示层静默。
// 做法：仿 run-all.js 的 collectTestFiles + runWithBestRunner 选路逻辑，
// 单独跑 test/ 下每个文件，收 exit code + 是否吐「N 通过, M 失败」汇总行。
// 只做扫描不改 run-all.js（硬边界）。
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const TEST_DIR = path.join(ROOT, 'test');

function collect(dir, base = dir) {
  const out = [];
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (const ent of ents) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'archive') continue;
      out.push(...collect(full, base));
    } else if (ent.name.endsWith('.test.js') && ent.name !== 'run-all.test.js') {
      out.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return out.sort();
}

const files = collect(TEST_DIR);
console.log(`扫描 ${files.length} 个测试文件\n`);

const silent = [];      // 跑了但吐不出汇总行的
const exited = [];      // 非零退出码的
const selfFail = [];    // 自报有失败数的
const ok = [];

for (const rel of files) {
  let src = '';
  try { src = fs.readFileSync(path.join(TEST_DIR, rel), 'utf8'); } catch (e) {}
  const isMount = /module\.exports\s*=\s*(?:function\b|[A-Za-z_$][\w$]*\s*;|\(?[^)]*\)?\s*=>)/.test(src);
  let cmd;
  if (isMount) cmd = `node ${JSON.stringify(path.join(TEST_DIR, '_mount.js'))} ${JSON.stringify(path.join(TEST_DIR, rel))}`;
  else if (/\bdescribe\s*\(/.test(src) && !/require\(['"][^'"]*mini-expect/.test(src)) cmd = `node -r ${JSON.stringify(path.join(TEST_DIR, '_jest-globals.js'))} ${JSON.stringify(path.join(TEST_DIR, rel))}`;
  else cmd = `node ${JSON.stringify(path.join(TEST_DIR, rel))}`;

  let out = '';
  let code = null;
  try {
    out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', timeout: 90000, maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
    code = 0;
  } catch (e) {
    out = ((e.stdout || '') + '\n' + (e.stderr || '')).toString();
    code = typeof e.status === 'number' ? e.status : -1;
  }
  const m = out.match(/(\d+)\s*(?:通过|passed)\s*[/,]?\s*(\d+)\s*(?:失败|failed)/);
  const ratio = out.match(/(\d+)\s*\/\s*(\d+)\s*(?:passed|通过|tests?\b|个|条)/);
  const passLine = (out.match(/^\s*PASS\b.*$/gm) || []).length;
  const skipLine = (out.match(/^\s*SKIP\b.*$/gm) || []).length;
  const hasSummary = !!m || !!ratio || passLine > 0 || skipLine > 0;
  if (!hasSummary) {
    silent.push({ rel, code, tail: out.trim().split('\n').slice(-3).join(' | ').slice(0, 200) });
  } else if (code !== 0) {
    exited.push({ rel, code, tail: out.trim().split('\n').slice(-2).join(' | ').slice(0, 200) });
  } else if (m && parseInt(m[2], 10) > 0) {
    selfFail.push({ rel, failed: m[2], tail: out.trim().split('\n').slice(-2).join(' | ').slice(0, 160) });
  } else {
    ok.push(rel);
  }
}

console.log(`OK(有汇总且零失败): ${ok.length}`);
console.log(`\n--- 吐不出汇总行(静默) ${silent.length} 个 ---`);
for (const s of silent) console.log(`  ${s.rel}  exit=${s.code}  tail: ${s.tail}`);
console.log(`\n--- 有汇总但非零退出 ${exited.length} 个 ---`);
for (const s of exited) console.log(`  ${s.rel}  exit=${s.code}  tail: ${s.tail}`);
console.log(`\n--- 自报失败 ${selfFail.length} 个 ---`);
for (const s of selfFail) console.log(`  ${s.rel}  failed=${s.failed}`);

fs.writeFileSync(path.join(ROOT, 'scripts', 'round-154', 'silent-scan.json'), JSON.stringify({ silent, exited, selfFail, okCount: ok.length }, null, 1));
console.log('\n结果已写 scripts/round-154/silent-scan.json');
