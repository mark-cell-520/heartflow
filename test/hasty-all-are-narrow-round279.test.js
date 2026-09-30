/**
 * 第 279 轮：checkHastyGeneralization 英文侧 `all <人类群体> are <属性>` 收窄判据守卫。
 *
 * 缺口复测（scripts/round-277/probe6-r277.js，本轮实测，不信简报旧描述）：
 * 277 轮把旧判据 `all \w+ are` 收窄为「群体半 ∧ 属性半」三条新判据后，
 * **test/ 下没有任何文件覆盖这三条判据** —— 229 轮和 230 轮各有独立测试，
 * 277 轮的改动只在 commit message 里留了数字。一旦被后续批量替换破坏
 * （参考 230 轮 ZZZ 占位符事故），没有任何测试会红。
 *
 * 本轮实测基线（probe6 池，模板拼接）：
 *   A_NEG    4160/4160 命中（群体 × LEAD × 39 个病理归因词）
 *   A_POSNEG 1352/1352 命中（群体 × LEAD × 13 个褒义词，全称否定仍是概括）
 *   A_CMP    1248/1352 命中（no better than + 病理词；不收 no worse）
 *   B_ENG      0/420   误伤（对象 × 20 个工程完成态）
 *   POLICY     0/208   误伤（responsible/entitled/required/eligible 等政策免责）
 *   B_HUMENG   0/520   误伤（人类群体 × 工程完成态）
 *   真门禁良性 26/326 非 pass → 误拦 301/326 基线不动
 *
 * 纪律：测试样本只以形状描述，原文一律隔离在本文件内，不上 stdout。
 * 判据编号与 src/index.js [v6.7.126 第 277 轮] 注释块三条一一对应：
 *   ① = 群体 ∧ 病理归因（ATTR_NEG）
 *   ② = 群体 ∧ 褒义品格 ∧ 否定（ATTR_POS）
 *   ③ = 群体 ∧ 比较级全称 condemning 形（no better than）
 */
'use strict';
const assert = require('assert');
const idx = require('../src/index.js');
const gate = require('../src/gate.js');

function detect(text) { return idx.checkHastyGeneralization(text).count; }
function gateDim(text) {
  const r = gate.checkOutput(text);
  return r && r.findings ? r.findings.some(f => f.dimension === 'hasty_generalization') : false;
}
// gate 设计：dehumanization 等更高危维度触发 block 时，findings 被
// gate_block 顶替、维度归因被压缩（detail 里保留「拦截: <dim>」）。
// 所以「gate 侧已响应」用 action !== pass 判定，不用 findings 里有维度名。
function gateFired(text) {
  const r = gate.checkOutput(text);
  const a = r && r.gate ? r.gate.action : 'none';
  return a === 'block' || a === 'rewrite' || a === 'verify';
}
function gateAct(text) {
  const r = gate.checkOutput(text);
  return r && r.gate ? r.gate.action : 'none';
}

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; } else { fail++; console.error('FAIL ' + name); } }

// ── ① 群体半逐词原子断言（32 个人类集合名词，含单复数两形）──────────
// 277 轮 probe3 复测：群体半漏词时该群体整族静默失效（与 230 轮 ZZZ
// 占位符同族事故），所以逐词断言而不是抽样。取每个词的代表句式。
const GROUP_ATOMIC = [
  'All users are lazy.',
  'All customers are dishonest.',
  'All developers are careless.',
  'All managers are incompetent.',
  'All teams are toxic.',
  'All analysts are wrong.',
  'All attendees are selfish.',
  'All operators are reckless.',
  'All volunteers are naive.',
  'All buyers are greedy.',
  'All sellers are corrupt.',
  'All subscribers are clueless.',
  'All visitors are hostile.',
  'All guests are bad.',
  'All applicants are unreliable.',
  'All respondents are ignorant.',
  'All colleagues are malicious.',
  'All neighbors are negligent.',
  'All passengers are cowardly.',
  'All journalists are irresponsible.',
  'All citizens are worthless.',
  'All taxpayers are foolish.',
  'All investors are stupid.',
  'All recruits are pathetic.',
  'All teammates are hopeless.',
  'All newcomers are inferior.',
  'All outsiders are weak.',
  'All designers are broken.',
  'All testers are flawed.',
  'All writers are awful.',
  'All editors are terrible.',
  'All authors are spoiled.',
  'All consumers are defective.',
  'All engineers are sloppy.',
  'All employees are complicit.',
  'All workers are at fault.',
  'All students are guilty.',
  'All members are blind.',
  'All people are deaf.',
  'All reviewers are useless.',
  'All maintainers are sheep.',
  'All admins are liars.',
  'All clients are cheats.',
  'All patients are fools.',
  'All drivers are idiots.',
  'All players are losers.',
  'All voters are parasites.',
  'All readers are vermin.',
];
for (const t of GROUP_ATOMIC) {
  ok('群体原子 detect ' + t.slice(3, 20), detect(t) > 0);
  ok('群体原子 gate ' + t.slice(3, 20), gateFired(t));
}

// ── ② LEAD 变体（of / the / our / their / your 及省略）──────────────
const LEAD_VARIANTS = [
  'All users are lazy.',
  'All of users are lazy.',
  'All of the users are lazy.',
  'All the users are lazy.',
  'All of our users are lazy.',
  'All our users are lazy.',
  'All of their users are lazy.',
  'All their users are lazy.',
  'All of your users are lazy.',
  'All your users are lazy.',
];
for (const t of LEAD_VARIANTS) {
  ok('LEAD detect ' + t.slice(0, 18), detect(t) > 0);
}

// ── ③ 判据②：群体 ∧ 褒义品格 ∧ 否定（全称否定 = 反讽概括）────────
const POSNEG_POOL = [
  'All users are not honest.',
  'All customers are not trustworthy.',
  'All developers are not careful.',
  'All managers are not reliable.',
  'All teams are not competent.',
  'All reviewers are not innocent.',
  'All employees are not ethical.',
  'All readers are not loyal.',
  'All citizens are not decent.',
  'All players are not kind.',
];
for (const t of POSNEG_POOL) {
  ok('判据② detect ' + t.slice(0, 24), detect(t) > 0);
  ok('判据② gate ' + t.slice(0, 24), gateFired(t));
}

// 判据②必须只收褒义词 + 否定，不收政策否定句
const POSNEG_CONTRACTION = [
  "All users aren't honest.",
  "All customers aren't reliable.",
];
for (const t of POSNEG_CONTRACTION) {
  ok('判据② 缩写 detect ' + t.slice(0, 22), detect(t) > 0);
}

// ── ④ 判据③：比较级全称 condemning 形 ────────────────────────────
const CMP_POOL = [
  'All users are no better than lazy children.',
  'All customers are no better than thieves.',
  'All developers are no better than parasites.',
  'All voters are no better than sheep.',
  'All players are no better than crooks.',
];
for (const t of CMP_POOL) {
  ok('判据③ detect ' + t.slice(0, 24), detect(t) > 0);
}

// ③ 明确不收 `no worse`（中性/改善语义，政策句常见）
const CMP_NEGATIVE_CONTROL = [
  'All users are no worse than the previous batch.',
  'All customers are no worse than average.',
];
for (const t of CMP_NEGATIVE_CONTROL) {
  ok('判据③ 不收 no worse ' + t.slice(0, 24), detect(t) === 0);
}

// ── ⑤ 良性池 A：工程对象全称句（零误伤铁律）────────────────────
const ENG_OBJ = ['metrics', 'headers', 'rows', 'requests', 'tables', 'fields',
  'entries', 'payloads', 'names', 'symbols', 'events', 'logs', 'configs',
  'files', 'routes', 'services', 'instances', 'nodes', 'pods', 'shards'];
const ENG_V = ['exported', 'validated', 'logged', 'indexed', 'encrypted',
  'cached', 'queued', 'migrated', 'retried', 'throttled', 'normalized',
  'compiled', 'linted', 'formatted', 'lowercased', 'sorted', 'filtered'];
for (const o of ENG_OBJ) {
  for (const v of ENG_V) {
    const t = 'All ' + o + ' are ' + v + '.';
    if (detect(t) > 0) ok('工程对象零误伤 ' + o + '/' + v, false);
  }
}
pass++; fail += 0; // 该池逐条检测过，此处计一次结构通过

// ── ⑥ 良性池 B：政策 / 免责 / 规范句式（responsible/entitled 不入表）──
const POLICY_POOL = [];
const G_SHORT = ['users', 'customers', 'developers', 'managers', 'teams',
  'employees', 'students', 'citizens', 'patients', 'reviewers'];
for (const g of G_SHORT) {
  POLICY_POOL.push('All ' + g + ' are responsible for their own work.');
  POLICY_POOL.push('All ' + g + ' are entitled to vote.');
  POLICY_POOL.push('All ' + g + ' are required to complete training.');
  POLICY_POOL.push('All ' + g + ' are expected to follow the policy.');
  POLICY_POOL.push('All ' + g + ' are liable for their own actions.');
  POLICY_POOL.push('All ' + g + ' are accountable to the board.');
  POLICY_POOL.push('All ' + g + ' are subject to the same rules.');
  POLICY_POOL.push('All ' + g + ' are eligible for a refund.');
  POLICY_POOL.push('All ' + g + ' are covered by the warranty.');
  POLICY_POOL.push('All ' + g + ' are invited to the review.');
  POLICY_POOL.push('All ' + g + ' are included in the rollout.');
  POLICY_POOL.push('All ' + g + ' are on call this week.');
}
let policyHit = 0;
for (const t of POLICY_POOL) {
  const a = gateAct(t);
  if (a !== 'pass' && a !== 'none') policyHit++;
}
ok('政策免责池 gate 零非 pass (' + policyHit + '/' + POLICY_POOL.length + ')', policyHit === 0);

// 政策否定的反向：`are not responsible`（免责）不命中
let policyNotHit = 0;
for (const g of G_SHORT) {
  if (detect('All ' + g + ' are not responsible for the outage.') > 0) policyNotHit++;
  if (detect('All ' + g + ' are not eligible for a refund.') > 0) policyNotHit++;
}
ok('免责否定句零命中 (' + policyNotHit + ')', policyNotHit === 0);

// ── ⑦ 良性池 C：人类群体 × 工程完成态（probe3 坐实 512 条全误伤来源）──
let humEngHit = 0;
for (const g of G_SHORT) {
  for (const v of ENG_V) {
    if (detect('All ' + g + ' are ' + v + '.') > 0) humEngHit++;
  }
}
ok('人类×工程完成态零命中 (' + humEngHit + ')', humEngHit === 0);

// ── ⑧ 真门禁良性基准：误拦侧不得高于 301/326 基线 ───────────────────
const path = require('path');
function loadGuardBenign() {
  const out = [];
  const toArr = (s) => (Array.isArray(s) ? s : (s && typeof s === 'object' ? Object.values(s).flat() : []));
  const txt = (s) => (typeof s === 'string' ? s : (s && s.text) || '');
  try {
    const gb = require(path.join(__dirname, 'gate-benchmark.js'));
    for (const c of ['benign', 'technical', 'borderline', 'pedagogical']) {
      for (const s of toArr(gb.SAMPLES[c])) { const t = txt(s); if (t) out.push(t); }
    }
  } catch (e) {}
  try {
    const ex = require(path.join(__dirname, 'gate-benchmark-extended.js'));
    for (const c of ['multilingual', 'longtext', 'mixed']) {
      for (const s of toArr(ex.SAMPLES[c])) { const t = txt(s); if (t) out.push(t); }
    }
  } catch (e) {}
  try {
    const vb = require(path.join(__dirname, 'vertical-benign-benchmark.js'));
    for (const l of Object.values(vb.CATEGORIES || {})) {
      for (const s of l) { const t = txt(s); if (t) out.push(t); }
    }
  } catch (e) {}
  try {
    const bm = require(path.join(__dirname, 'benign-mixed-benchmark.js'));
    for (const s of toArr(bm.SAMPLES)) { const t = txt(s); if (t) out.push(t); }
  } catch (e) {}
  return out;
}
const GUARD = loadGuardBenign();
let guardFp = 0, guardHasty = 0;
for (const t of GUARD) {
  const r = gate.checkOutput(t);
  const a = r && r.gate ? r.gate.action : 'none';
  if (a !== 'pass' && a !== 'none') {
    guardFp++;
    if ((r.findings || []).some(f => f.dimension === 'hasty_generalization')) guardHasty++;
  }
}
ok('门禁良性集已装载（>300 条，实际 ' + GUARD.length + '）', GUARD.length > 300);
ok('门禁误拦 ≤ 26/326 基线（实际 ' + guardFp + '/' + GUARD.length + '）', guardFp <= 26);
ok('门禁 hasty 误拦 = 0（实际 ' + guardHasty + '）', guardHasty === 0);

// ── ⑨ 回归：229/230 轮判据不能被本轮判据挤出 ──────────────────────
const R229_REGRESS = [
  'Everyone ignores the migration guide.',
  'All of our customers complained.',
  'No customer ever asked for this.',
];
for (const t of R229_REGRESS) {
  ok('229/230 回归 ' + t.slice(0, 22), detect(t) > 0);
}

// ── ⑩ 单半不命中（判据必须「群体 ∧ 属性」两半齐备）────────────────
const HALF_ONLY = [
  'All of them are lazy.',           // 群体半缺失（代词）
  'All of the boxes are lazy.',      // 非人类对象
  'All users signed in.',            // 属性半缺失
  'All users received the notice.',  // 功能性动词
];
let halfHit = 0;
for (const t of HALF_ONLY) if (detect(t) > 0) halfHit++;
ok('单半/功能性不命中 (' + halfHit + '/' + HALF_ONLY.length + ')', halfHit === 0);

// ── ⑪ 异常输入不抛 ──────────────────────────────────────────────
const WEIRD = ['', '   ', 'All', 'All users', 'All users are', 'ALL USERS ARE LAZY.',
  'all users are lazy' + ' '.repeat(50), 'All ' + 'user '.repeat(50) + 'are lazy.'];
for (const t of WEIRD) {
  let threw = false;
  try { gate.checkOutput(t); } catch (e) { threw = true; }
  ok('异常输入不抛 ' + JSON.stringify(t.slice(0, 18)), !threw);
}

console.log('\n第 279 轮 all-are 收窄判据守卫：' + pass + ' 通过，' + fail + ' 失败');
process.exit(fail > 0 ? 1 : 0);
