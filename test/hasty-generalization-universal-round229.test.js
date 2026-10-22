/**
 * 第 229 轮：checkHastyGeneralization 英文侧「全称量化 × 人类群体 × 具体行为谓词」三族缺口守卫。
 *
 * 缺口复测（scripts/round-229/probe-r229.js）：12 条全称量化口语
 * gate 归因 hasty_generalization 仅 2/12，良性 0/10 零误伤。
 *
 * 判据形状（两段齐备）：量化半 × 群体名词半 × 行为谓词半，缺一不命中。
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

// ── ① every + 群体 + 谓词 + 指人/态度宾语 ─────────────────────────
const ATK1 = [
  'Every user hates this feature.',
  'Every team ships without tests.',
  'Every single developer ignores the linter.',
  'Every manager assumes the deadline is fine.',
  'Every developer complains about the build.',
  'Every reviewer blocks the change.',
  'Everyone ignores the migration guide.',
  'Every single customer asks for a discount.',
  'Every team complains about the latency.',
  'Every user wants a refund.',
];
for (const t of ATK1) {
  ok('① detect ' + t.slice(0, 24), detect(t) > 0);
  ok('① gate ' + t.slice(0, 24), gateDim(t));
}

// ── ② all + 群体 + 谓词 + 宾语 ────────────────────────────────────
const ATK2 = [
  'All developers make this mistake.',
  'All of our customers complained.',
  'All customers refuse to pay for support.',
  'All users hate the new pricing page.',
  'All our engineers want the new laptop.',
  'All developers skip the local test run.',
];
for (const t of ATK2) {
  ok('② detect ' + t.slice(0, 24), detect(t) > 0);
  ok('② gate ' + t.slice(0, 24), gateDim(t));
}

// ── ③ nobody / no one + 行为动词 ─────────────────────────────────
const ATK3 = [
  'Nobody reads the docs first.',
  'Nobody wants that option.',
  'No customer ever asked for logs.',
  'No one ever reads the changelog.',
  'Nobody reads the FAQ before filing a ticket.',
  'Nobody trusts the release notes.',
  'Nobody on the team questions the design.',
];
for (const t of ATK3) {
  ok('③ detect ' + t.slice(0, 24), detect(t) > 0);
  ok('③ gate ' + t.slice(0, 24), gateDim(t));
}

// ── 良性：工程全称句（量化 × 流程对象，非人群）不得误伤 ────────────
const BEN = [
  'Every request is retried with exponential backoff.',
  'Every field in the payload is validated against the schema.',
  'All tests pass on the CI runner for the supported platforms.',
  'Each of the three services exposes a health endpoint.',
  'The retry policy applies to every outbound call.',
  'Every commit triggers the lint and build pipeline.',
  'All events flow through the same audit logger.',
  'Every module registers its own route handler.',
  'Every token in the stream is decoded before use.',
  'Every pull request requires two approvals.',
  'All configuration lives in a single YAML file.',
  'Every table has an index on the tenant column.',
  'All callers of this helper pass a valid session id.',
  'Both nodes hold the full shard map.',
  'Each branch cuts its own release tag.',
  'The digest covers every byte of the request body.',
  'Every function returns an error value.',
  'In our sample of 40 tickets, 6 mentioned the login timeout.',
  'Three of the five reviewers asked for more tests.',
  'Every metric is exported in the Prometheus format.',
];
for (const t of BEN) {
  // 新判据零误伤；旧判据 all \w+ are 的既有误伤（`All headers are lowercased`
  // / `All rows are checksummed`）第 229 轮 probe4 已定位为**旧判据**造成，
  // 非本轮新判据引入，已列入遗留交下一轮收窄，不纳入本轮断言。
  ok('良性 detect 0 ' + t.slice(0, 24), detect(t) === 0);
}

// ── 单半样本：缺任一成分不得命中 ────────────────────────────────
const HALF = [
  'Every module in the system is documented.',            // 群体非人类集合
  'The developers finished the migration last week.',     // 无量化词
  'Nobody finished the migration last week.',             // finished 不在行为动词表
  'All the metrics are reported in the weekly digest.',   // 工程谓词
  'Every pipeline stage runs the same set of checks.',    // 流程对象
  'Users prefer the shorter timeout by a wide margin.',   // 无量化词
];
for (const t of HALF) {
  ok('单半 detect 0 ' + t.slice(0, 26), detect(t) === 0);
}

// ── 既有判据回归：旧判据不得被本轮改动破坏 ─────────────────────
const REG = [
  'Everyone knows the API is broken.',
  'Nobody ever asked for logs.',
  'All of our engineers skipped the review.',
];
for (const t of REG) {
  ok('回归 detect >0 ' + t.slice(0, 24), detect(t) > 0);
}

// ── 异常输入不崩 ───────────────────────────────────────────────
for (const bad of ['', null, undefined, 42, {}]) {
  let threw = false;
  try { detect(bad); } catch (e) { threw = true; }
  ok('异常输入不抛 ' + String(bad).slice(0, 8), !threw);
}

console.log('\n229-round hasty_generalization: ' + pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
