/**
 * 第 230 轮：checkHastyGeneralization 英文侧 every/each 主判据修复守卫。
 *
 * 缺口复测（scripts/round-230/probe4-r230.js）：229 轮提交的主判据群体表
 * 被写成 5 个 `ZZZ` 字面占位符（批量替换残留，永不命中），且缺
 * user/customer/developer/manager/team/analyst/attendee 七大高频群体，
 * 不支持 each 别名。10 条 every+高频群体行为句 gate 命中 2/10。
 *
 * 判据形状：量化半（every/each）× 群体半（30 个人类角色）× 谓词半
 * （负面/态度动词枚举）三半齐备才命中；谓词改枚举表后功能性动词
 * （gets/receives/signs/approves/owns/documents）天然不命中。
 *
 * 纪律：测试样本只以形状描述，原文一律隔离在本文件内，不上 stdout。
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

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; } else { fail++; console.error('FAIL ' + name); } }

// ── ① every/each + 高频群体 + 负面谓词 + 宾语 ────────────────────
// 复测坐实 6 大群体词原先全在 ZZZ 占位符位置（永不命中）
const ATK_GROUP_WORDS = [
  'Every user ignores the warning.',
  'Every customer wants a refund.',
  'Every developer skips the review.',
  'Every manager overrides the design.',
  'Every team ignores the plan.',
  'Every analyst trusts the model.',
  'Every operator restarts the box.',
  'Every attendee asked the same question.',
  'Every reviewer blocks the change.',
  'Every engineer doubts the change.',
];
for (const t of ATK_GROUP_WORDS) {
  ok('群体词 detect ' + t.slice(0, 26), detect(t) > 0);
  ok('群体词 gate ' + t.slice(0, 26), gateDim(t));
}

// ── ② each 别名（旧判据只认 every）──────────────────────────────
const ATK_EACH = [
  'Each team ignores the rollback plan.',
  'Each reviewer skips the checklist.',
  'Each customer complains about the fees.',
];
for (const t of ATK_EACH) {
  ok('each detect ' + t.slice(0, 26), detect(t) > 0);
  ok('each gate ' + t.slice(0, 26), gateDim(t));
}

// ── ③ 谓词表新补族：破坏动词 / refused to / writes no ───────────
const ATK_VERBS = [
  'Every user breaks the build.',
  'Every customer refused to pay.',
  'Every developer writes no comment.',
];
for (const t of ATK_VERBS) {
  ok('新谓词 detect ' + t.slice(0, 26), detect(t) > 0);
  ok('新谓词 gate ' + t.slice(0, 26), gateDim(t));
}

// ── ④ 每词独立断言（群体表逐词独立，防回退）──────────────────────
const GROUP_ATOMIC = [
  'users', 'customers', 'developers', 'managers', 'teams', 'analysts',
  'attendees', 'operators', 'volunteers', 'buyers', 'sellers', 'subscribers',
  'colleagues', 'neighbors', 'citizens', 'taxpayers', 'investors', 'designers',
  'testers', 'writers', 'editors', 'authors', 'consumers', 'guests',
];
for (const w of GROUP_ATOMIC) {
  const s = 'Every ' + w + ' ignores the changelog.';
  ok('原子群体 ' + w, detect(s) > 0);
}

// ── ⑤ 良性功能性陈述（量化 × 群体 × 行为，但语义是流程职责）──────
// 这是本轮把谓词槽改成枚举表的原因：旧通配 + 宽宾语会误伤这组
const BEN_FUNCTIONAL = [
  'Each user gets a notification when the job finishes.',
  'Every customer receives an invoice at month end.',
  'Every developer signs the commit with a verified GPG key.',
  'Every manager approves the budget once a quarter.',
  'Every team owns a runbook for its on-call rotation.',
  'Each reviewer can block the merge if tests fail.',
  'Every analyst documents the assumptions in the ticket.',
  'Every operator follows the runbook during rotation.',
  'Every attendee receives the agenda before the meeting.',
  'Each plugin registers its own route handler.',
  'Every user must accept the terms before signing in.',
  'Each customer can export the data at any time.',
  'Every tenant gets a dedicated namespace.',
  'Every applicant passes the same screening step.',
  'Every respondent answers the same questionnaire.',
];
for (const t of BEN_FUNCTIONAL) {
  ok('功能性 detect 0 ' + t.slice(0, 26), detect(t) === 0);
}

// ── ⑥ 良性工程全称句（量化 × 流程对象，非人群）──────────────────
// 其中旧判据 `all \w+ are` 的历史误伤（exported/lowercased/…）在第 229 轮
// probe4 已定位归因，不纳入本轮断言；此处断言的 12 条是新判据必须零伤
const BEN_ENGINEERING_NEW = [
  'Every request is retried twice.',
  'Every field is validated before insert.',
  'Each service is health-checked.',
  'Every deploy is rolled back on failure.',
  'Every endpoint is rate limited.',
  'Every config key has a default.',
  'Every dependency is pinned.',
  'Every commit triggers the pipeline.',
  'Every job runs in an isolated sandbox.',
  'Each region keeps its own replica.',
  'Every table is partitioned by month.',
  'Every module in the system is documented.',
];
for (const t of BEN_ENGINEERING_NEW) {
  ok('工程 detect 0 ' + t.slice(0, 26), detect(t) === 0);
}

// ── ⑦ 单半样本：缺任一成分不得命中 ─────────────────────────────
const HALF = [
  'Every module in the system is documented.',            // 群体非人类集合
  'The developers finished the migration last week.',     // 无量化词
  'Nobody finished the migration last week.',             // finished 不在行为动词表
  'Every pull request requires two approvals.',           // 流程对象
  'Users prefer the shorter timeout by a wide margin.',   // 无量化词
  'Every respondent answers the same questionnaire.',     // 功能性动词
];
for (const t of HALF) {
  ok('单半 detect 0 ' + t.slice(0, 26), detect(t) === 0);
}

// ── ⑧ 229 轮回归：本轮改动不得破坏旧样本 ───────────────────────
const REG = [
  'Every user hates this feature.',
  'Every team ships without tests.',
  'Every single developer ignores the linter.',
  'Every manager assumes the deadline is fine.',
  'Every reviewer blocks the change.',
  'Everyone knows the API is broken.',
  'Nobody ever asked for logs.',
  'All of our engineers skipped the review.',
  'All developers make this mistake.',
  'All of our customers complained.',
];
for (const t of REG) {
  ok('229 回归 detect >0 ' + t.slice(0, 26), detect(t) > 0);
}

// ── ⑨ 异常输入不崩 ─────────────────────────────────────────────
for (const bad of ['', null, undefined, 42, {}]) {
  let threw = false;
  try { detect(bad); } catch (e) { threw = true; }
  ok('异常输入不抛 ' + String(bad).slice(0, 8), !threw);
}

console.log('\n230-round every/each hasty_generalization: ' + pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
