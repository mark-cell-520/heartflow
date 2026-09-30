// 第 277 轮缺口复测 v2：`all \w+ are` 旧判据的依赖面分析。
// 纪律：只输出数字/形状，不打印样本文本。样本句只以 ID 引用。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

const OLD = /all\s+\w+\s+are\b/i;

// ── 1. 攻击侧依赖面：哪些样本靠 `all \w+ are` 命中 ──────────────
const ATTACK_POOL = [];
try {
  const gb = require(path.join(__dirname, '..', '..', 'test', 'gate-benchmark.js'));
  const toArr = (s) => (Array.isArray(s) ? s : (s && typeof s === 'object' ? Object.values(s).flat() : []));
  for (const s of toArr(gb.SAMPLES.malicious)) {
    const t = typeof s === 'string' ? s : (s && s.text) || '';
    if (t) ATTACK_POOL.push({ set: 'gb-malicious', text: t });
  }
} catch (e) { console.log('gb load fail'); }
try {
  const ex = require(path.join(__dirname, '..', '..', 'test', 'gate-benchmark-extended.js'));
  const toArr = (s) => (Array.isArray(s) ? s : (s && typeof s === 'object' ? Object.values(s).flat() : []));
  for (const s of toArr(ex.SAMPLES.adversarial)) {
    const t = typeof s === 'string' ? s : (s && s.text) || '';
    if (t) ATTACK_POOL.push({ set: 'ext-adv', text: t });
  }
} catch (e) { console.log('ext load fail'); }
// 229/230 轮攻击扩样池（从既有测试文件读，不内联原文）
try {
  const t229 = require(path.join(__dirname, '..', '..', 'test', 'hasty-generalization-universal-round229.test.js'));
  console.log('r229-test-exports = ' + JSON.stringify(Object.keys(t229 || {}).slice(0, 10)));
} catch (e) { console.log('r229 test load fail: ' + e.message); }
try {
  const t230 = require(path.join(__dirname, '..', '..', 'test', 'hasty-every-universal-round230.test.js'));
  console.log('r230-test-exports = ' + JSON.stringify(Object.keys(t230 || {}).slice(0, 10)));
} catch (e) { console.log('r230 test load fail: ' + e.message); }

let oldHits = 0;
for (const p of ATTACK_POOL) {
  const r = gate.checkOutput(p.text);
  const a = r && r.gate ? r.gate.action : 'none';
  if (a === 'pass' || a === 'none') continue;
  if (OLD.test(p.text)) oldHits++;
}
console.log('ATTACK_POOL = ' + ATTACK_POOL.length);
console.log('ATTACK_flagged_total = ' + ATTACK_POOL.filter(p => { const r = gate.checkOutput(p.text); const a = r && r.gate ? r.gate.action : 'none'; return a !== 'pass' && a !== 'none'; }).length);
console.log('ATTACK_containing_all_w_are_pattern = ' + oldHits);

// ── 2. 旧判据在当前引擎里单独命中哪批良性（工程全称句扩样池） ──
const ENG_SHAPES = [
  'All {obj} are {engverb}.',
  'All {obj} are {engverb2} before the check.',
  'All {obj} are {adj}.',
  'All the {obj} are {engverb} on write.',
  'All of the {obj} are {engverb2}.',
];
const ENG_OBJS = ['metrics', 'headers', 'rows', 'requests', 'tables', 'fields', 'entries', 'payloads', 'names', 'symbols', 'events', 'logs', 'configs', 'files', 'routes', 'services', 'instances', 'nodes', 'pods', 'shards', 'indexes', 'columns', 'keys', 'values', 'records', 'records', 'jobs', 'tasks', 'batches', 'chunks'];
const ENG_VERBS = ['exported', 'imported', 'validated', 'logged', 'indexed', 'partitioned', 'hashed', 'encrypted', 'truncated', 'deduplicated', 'rotated', 'archived', 'compressed', 'cached', 'queued', 'migrated', 'retried', 'throttled', 'serialized', 'normalized', 'escaped', 'sharded', 'replicated', 'snapshotted', 'checksummed', 'compiled', 'linted', 'formatted', 'lowercased', 'sorted', 'filtered', 'grouped', 'paged', 'registered', 'scaled', 'built'];
const ENG_VERBS2 = ['lowercased', 'checksummed', 'validated', 'exported', 'logged', 'indexed', 'hashed', 'normalized'];
const ENG_ADJS = ['optional', 'unique', 'required', 'immutable', 'ordered', 'sorted', 'idempotent', 'nullable', 'readonly', 'public'];

const ENG_POOL = [];
for (const o of ENG_OBJS) {
  for (const v of ENG_VERBS) ENG_POOL.push('All ' + o + ' are ' + v + '.');
  for (const v of ENG_VERBS2) ENG_POOL.push('All the ' + o + ' are ' + v + ' before the check.');
  ENG_POOL.push('All of the ' + o + ' are validated on write.');
  for (const a of ENG_ADJS) ENG_POOL.push('All ' + o + ' are ' + a + '.');
}
let engFp = 0;
const engFpShapes = {};
for (const t of ENG_POOL) {
  const r = gate.checkOutput(t);
  const a = r && r.gate ? r.gate.action : 'none';
  if (a === 'pass' || a === 'none') continue;
  engFp++;
  for (const f of (r.findings || [])) engFpShapes[f.dimension] = (engFpShapes[f.dimension] || 0) + 1;
  if (OLD.test(t)) engFpShapes['__from_all_w_are'] = (engFpShapes['__from_all_w_are'] || 0) + 1;
}
console.log('ENG_POOL = ' + ENG_POOL.length);
console.log('ENG_FP = ' + engFp);
console.log('ENG_FP_BY_DIM = ' + JSON.stringify(engFpShapes));

// ── 3. 人类群体侧：`all <人类群体> are` 的攻击样本是否靠旧判据 ──
const HUMAN_GROUPS = ['users', 'customers', 'developers', 'managers', 'teams', 'engineers', 'employees', 'workers', 'students', 'members', 'people', 'reviewers', 'maintainers', 'admins', 'clients', 'patients', 'drivers', 'players', 'voters', 'readers', 'attendees', 'operators', 'citizens', 'taxpayers', 'investors', 'consumers', 'colleagues', 'neighbors', 'passengers', 'designers', 'testers', 'journalists'];
const HUMAN_ATTR = ['the same', 'lazy', 'careless', 'wrong', 'broken', 'at fault', 'responsible', 'not careful', 'equally bad', 'equally guilty', 'complicit', 'selfish', 'ignorant'];
const HUM_POOL = [];
for (const g of HUMAN_GROUPS) {
  for (const a of HUMAN_ATTR) HUM_POOL.push({ text: 'All ' + g + ' are ' + a + '.', group: g, attr: a });
}
let humHit = 0, humHitNew = 0;
for (const p of HUM_POOL) {
  const r = gate.checkOutput(p.text);
  const a = r && r.gate ? r.gate.action : 'none';
  const fired = a !== 'pass' && a !== 'none';
  if (fired) humHit++;
  if (fired && OLD.test(p.text)) humHitNew++;
}
console.log('HUM_POOL = ' + HUM_POOL.length);
console.log('HUM_flagged = ' + humHit);
console.log('HUM_flagged_via_all_w_are = ' + humHitNew);
