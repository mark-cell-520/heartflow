'use strict';
/**
 * scripts/round-726-run-chunk.js
 * [r726] 全量回归分块执行器——本会话工具前台有 420s 硬上限，全量 609 个
 * .test.js 单次跑不完，按 argv 切片分批跑；每个文件结果立即追加到
 * scratch JSONL（chunk 超时只丢在跑的那个文件，可单独补跑）。
 * 规则与 test/run-all.js 保持一致：同收集逻辑（递归/.test.js/跳过 archive）、
 * 同选 runner（mount/jest/sub）、同汇总解析（N 通过, M 失败 / 分数式 /
 * PASS 单行）、同「0通过0失败计 1 失败」口径、同零输出重试一次。
 * 用法：node scripts/round-726-run-chunk.js <chunkIndex> <chunkCount>
 * 汇总：node scripts/round-726-run-chunk.js --summary
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEST_DIR = path.join(__dirname, '..', 'test');
const ROOT = path.join(__dirname, '..');
const OUT = 'C:/Users/USER782663/AppData/Local/hermes/cache/scratch/r726-chunks.jsonl';
const CHILD_TIMEOUT = 90000;

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

function pickCmd(rel) {
  const full = path.join(TEST_DIR, rel);
  let src = '';
  try { src = fs.readFileSync(full, 'utf8'); } catch (e) {}
  const isMount = /module\.exports\s*=\s*(?:function\b|[A-Za-z_$][\w$]*\s*;|\(?[^)]*\)?\s*=>)/.test(src);
  if (isMount) return `node ${JSON.stringify(path.join(TEST_DIR, '_mount.js'))} ${JSON.stringify(full)}`;
  if (/\bdescribe\s*\(/.test(src) && !/require\(['"][^'"]*mini-expect/.test(src)) {
    return `node -r ${JSON.stringify(path.join(TEST_DIR, '_jest-globals.js'))} ${JSON.stringify(full)}`;
  }
  return `node ${JSON.stringify(full)}`;
}

function runOne(rel) {
  const cmd = pickCmd(rel);
  let out = '';
  try {
    out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', timeout: CHILD_TIMEOUT, maxBuffer: 48 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    out = (e.stdout || '').toString();
    if (!out.trim()) {
      // 零输出重试一次（同 run-all 环境噪声口径）
      try {
        out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', timeout: CHILD_TIMEOUT, maxBuffer: 48 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
      } catch (e2) {
        out = (e2.stdout || '').toString() || '[ZERO-OUTPUT] ' + (e2.message || '').split('\n')[0];
      }
    }
  }
  let passed = 0, failed = 0, kind = 'summary';
  const m = out.match(/(\d+)\s*(?:通过|passed)\s*[/,]?\s*(\d+)\s*(?:失败|failed)/);
  if (m) { passed = +m[1]; failed = +m[2]; }
  if (!m) {
    const r = out.match(/(\d+)\s*\/\s*(\d+)\s*(?:passed|通过|tests?\b|个|条)/) || out.match(/合计\s*(\d+)\s*\/\s*(\d+)/);
    if (r) { passed = +r[1]; failed = Math.max(0, +r[2] - +r[1]); kind = 'ratio'; }
  }
  if (!m && kind === 'summary') {
    const passLines = (out.match(/^\s*PASS\b.*$/gm) || []).length;
    const skipLines = (out.match(/^\s*SKIP\b.*$/gm) || []).length;
    if (passLines > 0 || skipLines > 0) { passed = passLines; kind = 'passline'; }
    else { failed = 1; kind = 'silent'; }
  }
  if (passed === 0 && failed === 0) { failed = 1; kind = 'zero-cases'; }
  return { file: rel, passed, failed, red: failed > 0, kind, tail: failed > 0 ? out.trim().split('\n').slice(-8).join(' | ').slice(-500) : '' };
}

if (process.argv[2] === '--summary') {
  const recs = fs.readFileSync(OUT, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
  const seen = new Map();
  for (const r of recs) seen.set(r.file, r); // 后跑覆盖先跑（补跑语义）
  const all = [...seen.values()];
  const total = collectTestFiles(TEST_DIR).length;
  // 口径对齐 run-all.js：PASS 单行形态每文件计 1 通过（runAll: passed += 1），
  // 不在汇总里按行数放大——否则与 run-all 的官方总数不可比。
  const norm = (r) => (r.kind === 'passline' ? { ...r, passed: 1 } : r);
  const p = all.map(norm).reduce((s, r) => s + r.passed, 0);
  const f = all.reduce((s, r) => s + r.failed, 0);
  const red = all.filter((r) => r.red).map((r) => r.file).sort();
  console.log('文件覆盖: ' + all.length + '/' + total);
  console.log('测试结果: ' + p + ' 通过, ' + f + ' 失败');
  console.log('红文件数: ' + red.length);
  for (const r of red) console.log('  ❌ ' + r);
} else if (process.argv[2] === '--only') {
  // 基线对照模式：只跑指定清单（git stash 后对红名单做基线复跑）
  const list = fs.readFileSync(process.argv[3], 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
  console.log('--only 模式: ' + list.length + ' 个文件');
  for (const rel of list) {
    const rec = runOne(rel);
    fs.appendFileSync(OUT, JSON.stringify(rec) + '\n');
    console.log((rec.red ? '❌ ' : '✅ ') + rec.file + ' (' + rec.passed + 'p/' + rec.failed + 'f' + (rec.kind !== 'summary' ? ' ' + rec.kind : '') + ')');
  }
  console.log('--only done');
} else {
  const ci = parseInt(process.argv[2], 10);
  const cc = parseInt(process.argv[3], 10);
  const files = collectTestFiles(TEST_DIR);
  const slice = files.filter((_, i) => i % cc === ci);
  console.log('chunk ' + ci + '/' + cc + ': ' + slice.length + ' 个文件');
  for (const rel of slice) {
    const rec = runOne(rel);
    fs.appendFileSync(OUT, JSON.stringify(rec) + '\n');
    console.log((rec.red ? '❌ ' : '✅ ') + rec.file + ' (' + rec.passed + 'p/' + rec.failed + 'f' + (rec.kind !== 'summary' ? ' ' + rec.kind : '') + ')');
  }
  console.log('chunk ' + ci + ' done');
}
