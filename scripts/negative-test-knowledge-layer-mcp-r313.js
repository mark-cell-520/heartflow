#!/usr/bin/env node
// r313 负例：注入 r312 的缺陷形态，守卫必须变红。
// 每个注入 = 把源码改坏 → 跑守卫 → 记失败数 → 还原 → 守卫必须复绿。
// 用法：node scripts/negative-test-knowledge-layer-mcp-r313.js
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/mcp-server.js');
const GUARD = path.join(ROOT, 'test/knowledge-layer-mcp-state-round313.test.js');
const OUT = '/tmp/r313-neg-guard.log';

const ORIG = fs.readFileSync(SRC, 'utf8');

function runGuard() {
  try {
    const out = execFileSync(process.execPath, [GUARD], { cwd: ROOT, timeout: 90000, stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, log: out.toString() };
  } catch (e) {
    return { code: e.status || 1, log: (e.stdout || '').toString() + (e.stderr || '').toString() };
  }
}
function parseCount(log) {
  const m = log.match(/(\d+) 通过, (\d+) 失败, 共 (\d+) 个/);
  return m ? { pass: +m[1], fail: +m[2], total: +m[3], silent: false } : { pass: 0, fail: -1, total: -1, silent: true };
}
// 静默判定走 run-all 同款口径：没有「N 通过, M 失败」行即静默
function isSilent(log) { return !/\d+ 通过, \d+ 失败, 共 \d+ 个/.test(log); }

function withBackup(fn) {
  fs.writeFileSync(SRC, ORIG);
  const cur = fs.readFileSync(SRC, 'utf8');
  const next = fn(cur);
  if (next === cur) { console.log('  [注入未生效：old_string 未匹配]'); fs.writeFileSync(SRC, ORIG); return null; }
  fs.writeFileSync(SRC, next);
  return true;
}
function restore() { fs.writeFileSync(SRC, ORIG); }

// ── 注入清单：每项 = r312/r313 前后的真实缺陷形态 ──
const INJECTIONS = [
  {
    name: '① 回退 r312 形态：handler 内 new KnowledgeLayer（跨调用状态全丢）',
    fn: (s) => s.replace(
      'const kl = (heartflow && heartflow.knowledgeLayer) || _knowledgeLayerFallback();',
      'const kl = new (require("./archive/knowledge-layer.js").KnowledgeLayer)({ maxFactsPerDomain: 5000, enableSourceTracking: true });'
    ),
  },
  {
    name: '② 引擎实例可用却回退到单例（state 走旁路，引擎看不见）',
    fn: (s) => s.replace(
      'const kl = (heartflow && heartflow.knowledgeLayer) || _knowledgeLayerFallback();',
      'const kl = _knowledgeLayerFallback();'
    ),
  },
  {
    name: '③ 回退单例每次新建（不是缓存单例，退化成与 ① 等价）',
    fn: (s) => s.replace(
      'function _knowledgeLayerFallback() {\n  if (_klFallback) return _klFallback;\n  try {',
      'function _knowledgeLayerFallback() {\n  try {'
    ),
  },
  {
    name: '④ 删掉 query 空检索词校验（静默返回空结果）',
    fn: (s) => s.replace(
      `        if (args?.question === undefined || args?.question === null || args?.question === '') {
          return { error: 'query 需要 question（域内检索词，空检索会静默返回空结果）' };
        }
`,
      ''
    ),
  },
  {
    name: '⑤ 删掉引擎侧 lazy 注册（heartflow.js 的 _lazy 行）',
    fn: (s) => s.replace(
      /const _KnowledgeLayer = _lazy\('knowledgeLayer'.*?\n/m,
      ''
    ),
    otherFile: 'src/core/heartflow.js',
  },
];

let green = 0, red = 0, inert = 0;
const rows = [];

for (const inj of INJECTIONS) {
  const targetPath = inj.otherFile ? path.join(ROOT, inj.otherFile) : SRC;
  const origTarget = fs.readFileSync(targetPath, 'utf8');

  let applied = true;
  if (inj.otherFile) {
    const next = inj.fn(origTarget);
    if (next === origTarget) { applied = false; }
    else { fs.writeFileSync(targetPath, next); }
  } else {
    applied = withBackup(inj.fn) !== null;
  }

  if (!applied) {
    inert++;
    rows.push({ name: inj.name, result: '注入未生效', fail: '-' });
    fs.writeFileSync(targetPath, origTarget);
    continue;
  }

  const r = runGuard();
  const c = parseCount(r.log);
  const silent = isSilent(r.log);
  const wentRed = silent || c.fail > 0;
  if (wentRed) red++; else green++;
  rows.push({
    name: inj.name,
    result: wentRed ? (silent ? '变红(静默)' : `变红(${c.fail} 失败)`) : '未变红 ❌',
    fail: silent ? 'silent' : c.fail,
  });
  fs.writeFileSync(targetPath, origTarget);
}

// ── 还原后必须复绿 ──
fs.writeFileSync(SRC, ORIG);
const back = runGuard();
const bc = parseCount(back.log);
const backGreen = bc.fail === 0 && bc.total > 0;

console.log('\n═══ r313 负例注入结果 ═══');
for (const r of rows) console.log(`  ${r.result.padEnd(14)} ${r.name}`);
console.log(`  还原后守卫: ${backGreen ? `复绿 (${bc.pass}/${bc.total})` : `未复绿 ❌ (${bc.pass}/${bc.total}, fail=${bc.fail})`}`);
console.log(`\n  注入 ${rows.length} 项：变红 ${red} / 未变红 ${green} / 未生效 ${inert}`);
const ok = red === rows.length && inert === 0 && backGreen;
console.log(ok ? '  ✅ 守卫有效' : '  ❌ 守卫存在漏洞');
process.exit(ok ? 0 : 1);
