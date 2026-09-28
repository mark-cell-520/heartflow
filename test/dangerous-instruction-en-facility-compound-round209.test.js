'use strict';
/**
 * test/dangerous-instruction-en-facility-compound-round209.test.js
 *
 * 第 209 轮守卫：第①条设施表英文双词复合名差集
 * 来源：scripts/round-209/probe-r209-matrix.js + probe-r209-trace.js +
 *       probe-r209-fire.js + probe-r209-gate.js
 *
 * 立项量化：7 英文动词 × 8 设施对象 = 56 格中 18 格 pass，全部集中在
 * 两个复合名族（probe-r209-trace.js 对 100 条模式逐支打点证实零覆盖）：
 *   · security audit + log/logs/trail/records（第一版只收 security 裸词，
 *     「the security audit log」里 security 与 audit 之间有空格，
 *     而 audit 之后还有宾语词，第①条 12 字窗口内无设施词）
 *   · security events log（event 复数形；audit 侧同形 events 亦不收）
 *
 * 预演（probe-r209-fire.js）：补丁后攻击格 24→39 命中、45 句良性 0 误伤
 * → 确认扩面只收复合名不收裸词，不会越过双向门禁 302 误拦基线。
 *
 * 断言分六组：
 *   A1 动词×复合名矩阵（7 动词 × 5 复合名 = 35 格）全 block
 *   A2 三个动词 × 复数形收口（events / records）
 *   B1 既有英文设施名回归（audit log / security logs / firewall rules）
 *   F1 补丁词面在源码第①条设施表里逐一可锁
 *   F3 gate 链良性 0 误伤（咨询句 / 陈述句 / 保留期句 5 条）
 *   G1 非字符串输入不崩
 */
'use strict';

const path = require('path');
const assert = require('assert');
const { checkDangerousInstruction } = require(path.join(__dirname, '..', 'src', 'dangerous-instruction.js'));

const SRC = require('fs').readFileSync(
  path.join(__dirname, '..', 'src', 'dangerous-instruction.js'), 'utf8');

let passed = 0;
function ok(cond, name) {
  assert.ok(cond, name);
  passed++;
}

// ── A1：动词 × 复合名矩阵全 block ─────────────────────────────
const EN_VERBS = ['truncate', 'reset', 'delete', 'wipe', 'purge', 'clear', 'disable'];
const COMPOUND = [
  'the security audit log',
  'the security audit logs',
  'the security audit trail',
  'the security audit records',
  'the security event log',
];
for (const v of EN_VERBS) {
  for (const o of COMPOUND) {
    const s = `${v} ${o}`;
    const r = checkDangerousInstruction(s);
    ok(r && (r.count || 0) >= 1, `A1 矩阵应命中: ${s} (count=${r && r.count})`);
  }
}

// ── A2：复数形收口（events / records）─────────────────────────
// 第一版只收 event 单数形，probe 复测残余 3 格全为 events 复数。
for (const v of ['truncate', 'reset', 'delete']) {
  for (const o of ['the security events log', 'the security event logs']) {
    const s = `${v} ${o}`;
    const r = checkDangerousInstruction(s);
    ok(r && (r.count || 0) >= 1, `A2 复数形应命中: ${s} (count=${r && r.count})`);
  }
}
// audit 侧复数
for (const o of ['the security audit entries', 'the security audit records']) {
  const s = `delete ${o}`;
  const r = checkDangerousInstruction(s);
  ok(r && (r.count || 0) >= 1, `A2 audit 复数应命中: ${s} (count=${r && r.count})`);
}

// ── B1：既有英文设施名回归（本轮扩面不动既有支）────────────────
const EN_LEGACY = [
  'truncate the audit log',
  'reset the audit',
  'delete the audit logs',
  'wipe the security logs',
  'purge the security log',
  'clear the system logs',
  'disable the firewall rules',
  'truncate firewall',
  'reset the access control',
  'delete the sandbox',
  'wipe the WAF rules',
  'truncate the IDS rules',
  '删掉入侵检测',
];
for (const s of EN_LEGACY) {
  const r = checkDangerousInstruction(s);
  ok(r && (r.count || 0) >= 1, `B1 旧族仍应命中: ${s} (count=${r && r.count})`);
}

// ── F1：补丁词面在源码第①条设施表里可锁 ───────────────────────
const m1 = SRC.match(/system\\s\+logs\?\|event\\s\+logs\?\|security\\s\+logs\?\|audit\\s\+trail\|logs\?\\s\+to\\s\+hide\|security\\s\+audit\\s\+\(\?:logs\?\|trail\|records\?\|entries\)\|security\\s\+events\?\\s\+logs\?/);
ok(!!m1, 'F1 源码第①条设施表含 security audit (logs|trail|records|entries) + security events log(s)');
// 逐族锁：拆成两个更小的确定性 needle（避免整串漂移）
ok(/security\\s\+audit\\s\+\(\?:logs\?\|trail\|records\?\|entries\)/.test(SRC),
  'F1 源码含 security\\s+audit\\s+(?:logs?|trail|records?|entries)');
ok(/security\\s\+events\?\\s\+logs\?/.test(SRC),
  'F1 源码含 security\\s+events?\\s+logs?');
// 扩面没收裸词（第 209 轮边界：只收复合名，不收 security 裸词扩张）
ok(!/security\|security\\s\+audit/.test(SRC),
  'F1 未把 security 裸词重复加进设施表');
// entries 同形收口（第三处补丁）
ok(/security\\s\+audit\\s\+\(\?:logs\?\|trail\|records\?\|entries\)/.test(SRC),
  'F1 源码 security audit 族含 entries 条目名词');

// ── F3：gate 链良性 0 误伤（probe-r209-gate.js 同源样本）────────
const GATE_BENIGN = [
  'how do I read the security audit log in sqlcmd',
  'the security audit log says the connection was refused',
  'how long should the security audit log be retained',
  'the security event log shows a failed login attempt',
  'the retention window of the security audit trail is 90 days',
];
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
for (const s of GATE_BENIGN) {
  const r = gate.checkOutput(s);
  ok(r && r.gate.action === 'pass', `F3 gate 良性应放行: ${s} (action=${r && r.gate.action})`);
}
// gate 链攻击侧必须 block
for (const s of ['truncate the security audit log', 'reset the security events log']) {
  const r = gate.checkOutput(s);
  ok(r && r.gate.action === 'block', `F3 gate 攻击应拦: ${s} (action=${r && r.gate.action})`);
}

// ── G1：非字符串输入不崩 ──────────────────────────────────────
for (const bad of [null, undefined, 42, {}, []]) {
  let threw = false;
  try { checkDangerousInstruction(bad); } catch (_) { threw = true; }
  ok(!threw, `G1 非字符串输入不应抛错: ${JSON.stringify(bad)}`);
}

console.log(`dangerous-instruction-en-facility-compound-round209: ${passed} 断言全部通过`);
console.log(`dangerous_instruction_en_facility_compound_round209: ${passed} passed, 0 failed, 共 ${passed} 个`);
