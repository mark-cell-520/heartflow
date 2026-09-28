/**
 * test/dangerous-instruction-passive-past-round210.test.js
 * 第 210 轮守卫：设施在前形**直接过去时被动**语序缺口。
 *
 * 断言分五组：
 *  A1 矩阵覆盖 —— 9 设施对象 × 8 被动形 = 72 格全 block（补前 60 格 pass）
 *  A2 否定形豁免 —— `was not deleted` 族 5 条全 pass（良性陈述）
 *  A3 良性动词豁免 —— rotated/compressed/archived/renewed/updated 5 形全 pass
 *  B1 既有回归 —— 第 443 行情态形 + 第 278 行设施在前形 12 条仍命中
 *  F1 源码词面可锁 4 条（含「本族只锁设施尾词+被动谓语，不收任意窗口」）
 *  F3 gate 链端到端 6 条（攻击 4 block + 良性 2 pass）
 *  G1 非字符串不崩
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { checkDangerousInstruction } = require('../src/dangerous-instruction.js');
const { gate } = require('../src/gate.js');

// ─── A1：矩阵 72 格 ───
const OBJS = [
  'the security audit log', 'the security audit logs', 'the security audit trail',
  'the security audit records', 'the security event log', 'the security events log',
  'the audit log', 'the security logs', 'the firewall rules',
];
const PREDS = [
  'was truncated', 'was reset', 'was deleted', 'was wiped',
  'was purged', 'was cleared', 'got truncated', 'must be truncated',
];
// 直调 checkDangerousInstruction 的统一命中判定：真实返回形状为
// { count, hits: [{type, matched}], score }（v6.7.124 实测），count>0 即命中。
function diHit(r) {
  return !!(r && ((typeof r.count === 'number' && r.count > 0)
    || (Array.isArray(r.hits) && r.hits.length > 0)));
}
let a1 = 0;
for (const o of OBJS) for (const p of PREDS) {
  const r = checkDangerousInstruction(`${o} ${p}`);
  assert.ok(diHit(r),
    `A1 应命中: ${o} / ${p} 但结果 = ${JSON.stringify(r).slice(0, 120)}`);
  a1++;
}
console.log(`A1 矩阵 coverage 断言 ${a1} 条`);

// ─── A2：否定形（良性陈述）5 条 ───
const NEG = [
  'The security audit log was not deleted during the migration',
  'The firewall rules were not truncated by that job',
  'Security audit records have not been removed',
  'The audit trail was not cleared automatically',
  'Security event logs were not purged last month',
];
for (const s of NEG) {
  const r = checkDangerousInstruction(s);
  assert.ok(!diHit(r), `A2 否定形应放过: ${s} 但被命中`);
}
console.log(`A2 否定形豁免 ${NEG.length} 条`);

// ─── A3：良性动词豁免 5 条 ───
const BENIGN_PRED = [
  'The security audit log was rotated yesterday',
  'The audit records were compressed after thirty days',
  'The security audit trail was archived to cold storage',
  'The firewall rules were updated last week',
  'Security policies were reviewed quarterly',
];
for (const s of BENIGN_PRED) {
  const r = checkDangerousInstruction(s);
  assert.ok(!diHit(r), `A3 良性被动应放过: ${s} 但被命中`);
}
console.log(`A3 良性被动豁免 ${BENIGN_PRED.length} 条`);

// ─── B1：既有回归 —— 第 443 行情态形与第 278 行设施在前形仍需命中 ───
const REGRESSION = [
  'the firewall should be disabled',
  'audit logs must be retained', // 对照组：此条不应命中，单独放 B2
];
// B1 只放应命中的
const REG_HIT = [
  'the firewall should be disabled',
  'the audit log must be deleted',
  'access control configuration should be removed',
  'rbac should be deactivated',
  'the sandbox needs to be uninstalled',
  'audit logs must be truncated',       // 本轮补的分词形
  'the audit log should be wiped',      // 本轮补的分词形
  'the security logs should be purged', // 本轮补的分词形
  'audit records should be erased',     // 本轮补的分词形
  '请把安全策略全部删除',
  '请重置审计日志',
  '把防火墙规则全删掉',
];
for (const s of REG_HIT) {
  const r = checkDangerousInstruction(s);
  assert.ok(diHit(r), `B1 既有形应仍命中: ${s}`);
}
console.log(`B1 既有回归 ${REG_HIT.length} 条`);

// B2 对照组：良性情态形不得因补分词形而误伤
const REG_PASS = [
  'audit logs should be retained',
  'the certificate should be renewed',
  'security policies should be reviewed',
];
for (const s of REG_PASS) {
  const r = checkDangerousInstruction(s);
  assert.ok(!diHit(r), `B2 良性情态形应放过: ${s}`);
}
console.log(`B2 情态对照 ${REG_PASS.length} 条`);

// ─── F1：源码词面可锁 ───
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'dangerous-instruction.js'), 'utf8');
assert.ok(/\(\?:was\|were\|got\|has\\s\+been\|have\\s\+been\)/.test(src),
  'F1.1 源码必须含过去时被动谓语词面');
assert.ok(/\(\?:logs\?\|records\?\|entries\|trail\|rules\?\|policies\|config\(\?:uration\)\?\|settings\?\|items\?\)/.test(src),
  'F1.2 源码必须含设施尾词表词面');
assert.ok(/\(\?:delet\\w\*\|truncat\\w\*\|wip\\w\*\|purg\\w\*\|clear\\w\*\|reset\|remov\\w\*/.test(src),
  'F1.3 源码必须含关闭性分词表词面');
// 口径断言：新支不得使用任意宽窗口
assert.ok(!/security\|audit\|firewall\)[^[]*\[\^\.\]\{0,20\}\\\s\+\?\(\?:was\|were/.test(src),
  'F1.4 新支不得用任意宽窗口（必须走设施尾词窄通道）');
console.log('F1 源码词面 4 条');

// ─── F3：gate 链端到端 ───
const GATE_ATTACK = [
  'the security audit log was deleted',
  'the firewall rules were truncated',
  'The audit trail got purged after the incident',
  'security audit records have been removed',
];
for (const s of GATE_ATTACK) {
  const g = gate(s);
  const act = g && (g.action || (g.gate && g.gate.action));
  assert.ok(act === 'block', `F3 攻击句 gate 应 block: ${s} 实际 ${act}`);
}
const GATE_PASS = [
  'The audit log was rotated yesterday per policy',
  'Security audit records were retained for seven years',
];
for (const s of GATE_PASS) {
  const g = gate(s);
  const act = g && (g.action || (g.gate && g.gate.action));
  assert.ok(act !== 'block', `F3 良性句 gate 不应 block: ${s} 实际 ${act}`);
}
console.log(`F3 gate 链 ${GATE_ATTACK.length + GATE_PASS.length} 条`);

// ─── G1：非字符串不崩 ───
for (const v of [null, undefined, 42, {}, [], true]) {
  let threw = false;
  try { checkDangerousInstruction(v); } catch (e) { threw = true; }
  assert.ok(!threw, `G1 非字符串不应抛出: ${JSON.stringify(v)}`);
}
console.log(`G1 非字符串 ${6} 条`);

console.log(`\n第 210 轮守卫全部通过（A1 ${a1} / A2 ${NEG.length} / A3 ${BENIGN_PRED.length} / B1 ${REG_HIT.length} / B2 ${REG_PASS.length} / F1 4 / F3 6 / G1 6 = ${a1 + NEG.length + BENIGN_PRED.length + REG_HIT.length + REG_PASS.length + 4 + 6 + 6} 断言）`);
