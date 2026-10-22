/**
 * 第 599 轮守卫测试：lesson-bank 同一认知盲区重复折叠（consolidateRepeat）
 *
 * 背景（实测）：
 *   160 条 auto_reflection 归一化后唯一形状 = 1（同一盲区记了 160 遍），
 *   真实知识条目被稀释到 3.6%，query 相关召回几乎全被同型噪声占据。
 * 新能力：同型盲区折叠为一条母本教训（frequency 累加），不逐条新增。
 *
 * 用法: node test/round-599-repeat-consolidation.test.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

// 用临时数据文件副本，绝不污染真实记忆库。
// 源码是从 src/cortex/ 拷贝到临时目录的，其相对 require（../utils/... 等）
// 会脱离源树解析失败 —— 因此在临时目录里 symlink 回源树的 utils/core，
// 只把数据路径指向临时目录（真正的隔离手段是数据文件位置）。
const REAL_DIR = path.join(__dirname, '..', 'data');

// 注意：OS tmpdir 受 TMPDIR 影响会指向 scratch（不在 path-guard 白名单），
// 白名单含 /tmp，故测试夹具显式用 /tmp 前缀，让落盘语义真实生效（不只是内存态）。
const mkTmp = () => fs.mkdtempSync('/tmp/hf-bank-r599-');

const TMP_DIRS = [];

function makeBank() {
  const dir = mkTmp();
  TMP_DIRS.push(dir);
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'cortex', 'lesson-bank.js'), 'utf8')
    .replace(/path\.join\(__dirname, '\.\.\/\.\.\/data\//g, `path.join(${JSON.stringify(dir)}, '`)
    // 源码只此一处相对 require；拷贝到临时目录后会脱离源树，改写为绝对路径
    .replace("../utils/safe-fs", path.join(__dirname, '..', 'src', 'utils', 'safe-fs.js'));
  fs.writeFileSync(path.join(dir, 'lesson-bank.js'), src);
  // symlink 回源树，保证被拷贝源码的相对 require 可解析
  for (const dep of ['utils', 'core']) {
    const depPath = path.join(__dirname, '..', 'src', dep);
    const linkPath = path.join(dir, dep);
    if (fs.existsSync(depPath) && !fs.existsSync(linkPath)) {
      fs.symlinkSync(depPath, linkPath, 'dir');
    }
  }
  const mod = require(path.join(dir, 'lesson-bank.js'));
  const bank = mod.lessonBank;
  if (typeof bank.load === 'function') bank.load();
  return bank;
}

const lessonBank = require(path.join(__dirname, '..', 'src', 'cortex', 'lesson-bank.js')).lessonBank;

let passed = 0, failed = 0;
const failures = [];
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; failures.push(`${name}: ${e.message}`); console.log(`  ❌ ${name} — ${e.message}`); }
}

// 每个断言用独立的临时 bank 实例，避免相互污染

check('consolidateRepeat 已导出且为函数', () => {
  assert.equal(typeof lessonBank.consolidateRepeat, 'function', '未导出 consolidateRepeat');
});

check('同一盲区重复 20 次只留下 1 条母本教训', () => {
  const bank = makeBank();
  for (let i = 0; i < 20; i++) {
    // 模拟 continuous-learner：每次 detail 含不同 think#NNN（逐字不同）
    bank.add({
      type: 'self_learned',
      content: `[confidence_gap] think#${500 + i}: 对「某输入...」置信度仅 0.2`,
      importance: 5,
      trigger: 'auto_reflection',
    });
    bank.consolidateRepeat({ insightTypes: ['confidence_gap'], importance: 5 });
  }
  const consolidated = bank.lessons.filter(l =>
    l.trigger === 'auto_reflection' && String(l.content).startsWith('[盲区累积:confidence_gap]'));
  assert.equal(consolidated.length, 1,
    `母本教训应有 1 条，实际 ${consolidated.length}`);
  assert.equal(consolidated[0].frequency, 20,
    `母本 frequency 应累加到 20，实际 ${consolidated[0].frequency}`);
});

check('不同盲区不得互相折叠（confidence_gap 与 spinning_detected 各一条）', () => {
  const bank = makeBank();
  bank.consolidateRepeat({ insightTypes: ['confidence_gap'] });
  bank.consolidateRepeat({ insightTypes: ['spinning_detected'] });
  bank.consolidateRepeat({ insightTypes: ['confidence_gap'] });
  const tags = bank.lessons.map(l => String(l.content).match(/^\[盲区累积:([^\]]+)\]/)?.[1]).filter(Boolean);
  assert.deepEqual(tags.sort(), ['confidence_gap', 'spinning_detected'],
    `应各一条且互不合并，实际 ${JSON.stringify(tags)}`);
});

check('同族多 type 的组合键与单 type 不冲突', () => {
  const bank = makeBank();
  bank.consolidateRepeat({ insightTypes: ['confidence_gap', 'spinning_detected'] });
  bank.consolidateRepeat({ insightTypes: ['spinning_detected', 'confidence_gap'] }); // 顺序不同也应命中同一母本
  bank.consolidateRepeat({ insightTypes: ['confidence_gap'] });
  const tags = bank.lessons.map(l => String(l.content).match(/^\[盲区累积:([^\]]+)\]/)?.[1]).filter(Boolean);
  assert.deepEqual(tags.sort(), ['confidence_gap', 'confidence_gap/spinning_detected'],
    `组合键应与顺序无关，实际 ${JSON.stringify(tags)}`);
});

check('空 insightTypes 返回 noop 且不写库', () => {
  const bank = makeBank();
  const before = bank.lessons.length;
  const r = bank.consolidateRepeat({ insightTypes: [] });
  assert.equal(r.action, 'noop', `应 noop，实际 ${r.action}`);
  assert.equal(bank.lessons.length, before, 'noop 不应新增条目');
});

check('母本条可被 query 命中（折叠不等于丢失检索能力）', () => {
  const bank = makeBank();
  for (let i = 0; i < 5; i++) bank.consolidateRepeat({ insightTypes: ['boundary_hit'] });
  const hits = bank.query('盲区累积');
  assert.equal(hits.length, 1, `母本条应可被检索，实际 ${hits.length}`);
});

check('既有真实知识条目不受影响', () => {
  const bank = makeBank();
  const k = bank.add({ type: 'insight', content: '梁文锋/DeepSeek核心战略：克制比进取更重要。', importance: 8 });
  assert.equal(k.action, 'added');
  for (let i = 0; i < 10; i++) bank.consolidateRepeat({ insightTypes: ['confidence_gap'] });
  const kept = bank.lessons.filter(l => String(l.content).includes('DeepSeek'));
  assert.equal(kept.length, 1, '真实知识条目必须原样保留');
  assert.equal(bank.lessons.filter(l => l.trigger === 'auto_reflection').length, 1,
    'auto_reflection 应只剩母本一条');
});

check('母本折叠必须真实落盘（不只是内存态）', () => {
  const bank = makeBank();
  const dir = TMP_DIRS[TMP_DIRS.length - 1];
  for (let i = 0; i < 3; i++) bank.consolidateRepeat({ insightTypes: ['confidence_gap'] });
  const onDisk = JSON.parse(fs.readFileSync(path.join(dir, 'lesson-bank.json'), 'utf8'));
  const mothers = (Array.isArray(onDisk) ? onDisk : onDisk.lessons || [])
    .filter(l => l.trigger === 'auto_reflection');
  assert.equal(mothers.length, 1, `落盘应只有 1 条母本，实际 ${mothers.length}`);
  assert.equal(mothers[0].frequency, 3, `落盘 frequency 应为 3，实际 ${mothers[0].frequency}`);
});

console.log(`\n== 结果: ${passed} 过 / ${failed} 败 ==`);
if (failed > 0) { failures.forEach(f => console.log(`  - ${f}`)); process.exit(1); }
for (const d of TMP_DIRS) { try { fs.rmSync(d, { recursive: true, force: true }); } catch (_) {} }
