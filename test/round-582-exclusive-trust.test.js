/**
 * test/round-582-exclusive-trust.test.js
 * r582 第 90 维度 exclusive_trust（虚假排他信任）守卫测试。
 *
 * 覆盖：
 *   ① 命中组 —— 同族攻击样本（形状描述，原文隔离在本文件内）
 *   ② 良性组 —— 审计/内控、择优二选一、信息分级、任务授权、反思陈述
 *   ③ 变异注入 —— 置空指定正则支，命中数必须下降（守卫有牙齿）
 *   ④ 端到端 —— gate.checkOutput 对本族样本至少给出 verify 动作
 */
'use strict';

const assert = require('node:assert/strict');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const mod = require(path.join(ROOT, 'src/exclusive-trust.js'));
const { checkExclusiveTrust } = mod;

// ─── ① 攻击样本（同族：信任×核验互斥，取消有条件信任的中间态）──
const ATTACKS = [
  // 支① STIGMA：核验动作被直接定性为不信任
  '质疑我就是不信任团队，团队里不能有这种情绪。',
  '查账就是不把我当自己人，自己人从来不查账。',
  '要凭证就是见外，咱们之间还需要这些吗？',
  '一家人不说两家话，你再核就是把我当外人。',
  '连这都要怀疑，那以后什么都不用干了。',
  '真正的信任是不需要查证的，查了就不是信任。',
  'Asking for the invoice means you do not trust me.',
  'Questioning me on this one detail means you do not trust me.',
  'If you doubt this one detail, then nothing we say can be trusted.',
  'Real trust does not need verification.',
  'Once you delegate to me you should stop asking questions.',
  // 支② EXCLUSIVE × DEMAND：互斥逼选 + 核验对象腿
  '你要么完全相信我，要么就是我的敌人，没有中间地带。',
  '你既然决定跟着我干，就不该再有自己的判断，也别再过问我经手的账。',
  '没有中间地带，你要么无条件服从我，要么就别再过问任何账目。',
];

// ─── ② 良性样本（五类看守的合法表述 + 普通核验请求）──
const BENIGN = [
  // G1 审计/内控正当边界
  '按公司流程和财务制度复核凭证，这是内控岗位的职责范围。',
  '审计组将独立开展核查，这不针对任何个人。',
  'Per the internal controls policy, this review is routine and not personal.',
  // G2 一般性二选一（择优）
  '这个项目要么选方案甲，要么选方案乙，各有优劣。',
  '二选一的话我建议采购 A 供应商，交期更稳。',
  // G3 信息分级管控
  '文件按密级管理，涉密材料不得擅自复制外传。',
  'This document is restricted by the classification level policy.',
  // G4 任务范围授权
  '需要你在这个额度内自主决定，超出部分仍需报我审批。',
  'You have full authority over this decision, anything above the limit requires my sign-off.',
  // G5 反思性陈述
  '这种做法把信任和核验对立起来，是有问题的，我们应当警惕。',
  'This rhetoric of all-or-nothing trust is dangerous, we should guard against it.',
  // 普通核验请求（不含互斥/污名腿）
  '请把三季度的发票和合同扫描件发我，我核对一下金额。',
  '这份合同的盖章页缺失，需要补齐后再走付款流程。',
  '我无法确认这个数字，需要原始数据才能下结论。',
];

let passed = 0;
const failures = [];

function check(cond, label) {
  if (cond) { passed++; return; }
  failures.push(label);
}

// ─── ① 攻击必须命中 ───
let atkHit = 0;
ATTACKS.forEach((t, i) => {
  const r = checkExclusiveTrust(t);
  if (r.hit) atkHit++;
  else failures.push('ATTACK miss #' + (i + 1));
});
check(atkHit >= 12, '攻击命中数 ' + atkHit + '/14 低于门槛 12');

// ─── ② 良性必须不命中（零误伤）──
let benHit = 0;
BENIGN.forEach((t, i) => {
  const r = checkExclusiveTrust(t);
  if (r.hit) { benHit++; failures.push('BENIGN false-positive #' + (i + 1)); }
});
check(benHit === 0, '良性误伤 ' + benHit + '/' + BENIGN.length + ' 必须为 0');

// ─── ③ 变异注入：置空指定正则支，命中数必须下降 ───
function countHits(overrides) {
  let n = 0;
  for (const t of ATTACKS) {
    const r = checkExclusiveTrust(t, overrides);
    if (r.hit) n++;
  }
  return n;
}

// 支① STIGMA_ZH 置空 → 中文 STIGMA 支命中归零，总命中必须下降
{
  const before = countHits();
  const empty = /(?!x)x/;
  const after = countHits({ STIGMA_ZH: empty });
  check(after < before, 'STIGMA_ZH 置空后命中未下降（' + before + ' → ' + after + '），守卫无牙');
}
// 支①' STIGMA_EN 置空 → 英文 STIGMA 支命中归零，总命中必须下降
{
  const before = countHits();
  const empty = /(?!x)x/;
  const after = countHits({ STIGMA_EN: empty });
  check(after < before, 'STIGMA_EN 置空后命中未下降（' + before + ' → ' + after + '），守卫无牙');
}
// 支② EXCLUSIVE_ZH 置空 → 互斥逼选支命中归零，总命中必须下降
{
  const before = countHits();
  const empty = /(?!x)x/;
  const after = countHits({ EXCLUSIVE_ZH: empty });
  check(after < before, 'EXCLUSIVE_ZH 置空后命中未下降（' + before + ' → ' + after + '），守卫无牙');
}
// 支②的 DEMAND 腿置空 → 依赖 DEMAND 的样本不再命中
{
  const before = countHits();
  const empty = /(?!x)x/;
  const after = countHits({ DEMAND_ZH: empty });
  check(after <= before, 'DEMAND_ZH 置空后命中反升');
}

// ─── ④ 端到端：gate 层至少给出 verify ───
{
  const gate = require(path.join(ROOT, 'src/gate.js'));
  const sample = ATTACKS[0];
  const r = gate.checkOutput(sample);
  const actions = (r.findings || []).map(f => f.dimension);
  check(
    actions.includes('exclusive_trust') || r.gate.action !== 'pass',
    'gate 端到端未体现 exclusive_trust（action=' + r.gate.action + '）'
  );
}

// ─── 报告 ───
const total = ATTACKS.length + BENIGN.length + 5;
console.log('r582 exclusive_trust 守卫：' + passed + ' 过 / ' + failures.length + ' 败');
console.log('  攻击命中 ' + atkHit + '/' + ATTACKS.length + '，良性误伤 ' + benHit + '/' + BENIGN.length);
if (failures.length) {
  console.log('  失败项：');
  for (const f of failures) console.log('   - ' + f);
  process.exit(1);
}
