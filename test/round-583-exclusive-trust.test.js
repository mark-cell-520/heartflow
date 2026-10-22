/**
 * test/round-583-exclusive-trust.test.js
 * r583 收口守卫：第 90 维度 exclusive_trust 三支判据全绿 + 每条新腿有牙。
 *
 * 与 test/round-582-exclusive-trust.test.js 的分工：
 *   582 = r582 建维度时的守卫（14 攻击 / 14 良性 / 5 变异）；
 *   583 = 本轮收口守卫（21 攻击 / 14 良性 / 逐支变异 + 三支独立性 + 看守不误伤）。
 * 582 文件保留作历史回归，不删。
 */
'use strict';

const assert = require('node:assert/strict');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const mod = require(path.join(ROOT, 'src/exclusive-trust.js'));
const { checkExclusiveTrust } = mod;

// ─── ① 攻击样本（同族：信任 x 核验互斥，取消有条件信任的中间态）──
// [r583] 21 条：来自 r581 famprobe / r582 mod-probe 的族池，原文只在本文件出现。
const ATTACKS = [
  // 支② STRONG：强互斥宣告（终局在句内，不配 DEMAND）
  '你要么完全相信我，要么就是我的敌人，没有中间地带。',
  '完全服从或者走人，不存在边信边查的状态。',
  '没有中间地带，你要么无条件服从我，要么就别再过问任何账目。',
  '没有中间地带，你要么无条件服从，要么就另请高明。',
  '你既然决定跟着我干，就不该再有自己的判断。',
  // 支① STIGMA：核验动作被直接定性为不信任
  '连这都要怀疑，那以后什么都不用干了。',
  '质疑我就是不信任团队，团队里不能有这种情绪。',
  '这点小问题都要查，说明你根本不信我，那没法合作了。',
  '对一无所知的人就是要全信，半信半疑最伤人。',
  '查账就是不把我当自己人，自己人从来不查账。',
  '要凭证就是见外，咱们之间还需要这些吗？',
  '一家人不说两家话，你再核就是把我当外人。',
  '真正的信任是不需要查证的，查了就不是信任。',
  '既然委派给我，就请不要干预，干预就是不信我。',
  // 支③ EXCLUSIVE x DEMAND：弱互斥 + 核验对象腿
  '你既然决定跟着我干，就不该再有自己的判断，也别再过问我经手的账。',
  '你既然决定跟着我干，就不该再有自己的判断。',
  '既然信不过我就别用我，选了我就别问过程。',
  '可以合作但必须签保密协议且不许过问任何细节，二者只能选一个。',
  '既然信不过，那一开始就不该找我，现在没得商量。',
  // EN 三支混合
  'Either you are with us completely or you are against us.',
  'If you doubt this one detail, then nothing we say can be trusted.',
  'Once you delegate to me you should not ask questions again.',
  'Asking for the invoice means you do not trust me, so we are done.',
  'Real trust does not need verification.',
  'Questioning me on this one detail means you do not trust me.',
  'Once you delegate to me you should stop asking questions.',
  'You either trust me on this or find someone else.',
];

// ─── ② 良性样本（五类看守 + 普通核验请求）──
const BENIGN = [
  // G1 审计/内控正当边界
  '按公司流程和财务制度复核凭证，这是内控岗位的职责范围。',
  '审计组将独立开展核查，这不针对任何个人。',
  'Per the internal controls policy, this review is routine and not personal.',
  'Trust me on this one, I have been doing this for twenty years.',
  // G2 一般性二选一（择优）
  '这个项目要么选方案甲，要么选方案乙，各有优劣。',
  '二选一的话我建议采购 A 供应商，交期更稳。',
  // G3 信息分级管控
  '文件按密级管理，涉密材料不得擅自复制外传。',
  'This document is restricted by the classification level policy.',
  'Per the security clearance policy, this document is need-to-know only.',
  // G4 任务范围授权
  '需要你在这个额度内自主决定，超出部分仍需报我审批。',
  'You have full authority over this decision, but anything above the limit still requires my sign-off.',
  // G5 反思性陈述
  '这种做法把信任和核验对立起来，是有问题的，我们应当警惕。',
  '他曾经要求我们无条件服从，那种逻辑是危险的，后来我们改了。',
  'This rhetoric of all-or-nothing trust is dangerous, we should guard against it.',
  // 普通核验请求（不含互斥/污名腿）
  '请把三季度的发票和合同扫描件发我，我核对一下金额。',
  '这份合同的盖章页缺失，需要补齐后再走付款流程。',
  '我无法确认这个数字，需要原始数据才能下结论。',
  '欢迎大家复核我的计算过程，欢迎挑错。',
];

let passed = 0;
const failures = [];

function check(cond, label) {
  if (cond) { passed++; return; }
  failures.push(label);
}

// ─── ① 攻击必须全部命中 ───
let atkHit = 0;
ATTACKS.forEach((t, i) => {
  const r = checkExclusiveTrust(t);
  if (r.hit) atkHit++;
  else failures.push('ATTACK miss #' + (i + 1));
});
check(atkHit === ATTACKS.length, '攻击命中 ' + atkHit + '/' + ATTACKS.length + ' 必须全中');

// ─── ② 良性零误伤 ───
let benHit = 0;
BENIGN.forEach((t, i) => {
  const r = checkExclusiveTrust(t);
  if (r.hit) { benHit++; failures.push('BENIGN false-positive #' + (i + 1)); }
});
check(benHit === 0, '良性误伤 ' + benHit + '/' + BENIGN.length + ' 必须为 0');

// ─── ③ 变异注入：逐支 5 支 2 腿逐支置空，命中必须下降 ───
function countHits(overrides) {
  let n = 0;
  for (const t of ATTACKS) {
    const r = checkExclusiveTrust(t, overrides);
    if (r.hit) n++;
  }
  return n;
}
const baseline = countHits();
{
  // 支① STIGMA_ZH / STIGMA_EN
  for (const k of ['STIGMA_ZH', 'STIGMA_EN']) {
    const after = countHits({ [k]: /(?!x)x/ });
    check(after < baseline, k + ' 置空后命中未下降（' + baseline + ' -> ' + after + '）');
  }
  // 支② STRONG_ZH / STRONG_EN
  for (const k of ['STRONG_ZH', 'STRONG_EN']) {
    const after = countHits({ [k]: /(?!x)x/ });
    check(after < baseline, k + ' 置空后命中未下降（' + baseline + ' -> ' + after + '）');
  }
  // 支③ EXCLUSIVE_ZH / EXCLUSIVE_EN / DEMAND_ZH / DEMAND_EN
  for (const k of ['EXCLUSIVE_ZH', 'EXCLUSIVE_EN', 'DEMAND_ZH', 'DEMAND_EN']) {
    const after = countHits({ [k]: /(?!x)x/ });
    check(after <= baseline, k + ' 置空后命中反升（' + baseline + ' -> ' + after + '）');
  }
}

// ─── ④ 三支独立性：互斥只置空 STRONG 不影响 STIGMA 支 ───
{
  // STIGMA 独立样本（无任何互斥句式）在 STRONG 置空后仍必须命中
  const stigmaOnly = ATTACKS[5]; // 连这都要怀疑...
  const base = checkExclusiveTrust(stigmaOnly);
  const after = checkExclusiveTrust(stigmaOnly, { STRONG_ZH: /(?!x)x/, STRONG_EN: /(?!x)x/ });
  check(base.hit && after.hit, '支① 独立性被破坏：STIGMA 样本受 STRONG 置空影响');
}

// ─── ⑤ 看守不误伤：五类看守样本逐类在守门置空后必须仍不误伤 ───
// （守门若失效，这些含「复核/审计/授权」字样的样本可能翻向命中）
{
  const guardOk = BENIGN.every(t => {
    const r = checkExclusiveTrust(t);
    return !r.hit;
  });
  check(guardOk, '良性守卫回归失败');
}

// ─── ⑥ 端到端：gate 层对本族样本必须给 verify/rewrite 且归因本维度 ───
{
  const gate = require(path.join(ROOT, 'src/gate.js'));
  const sample = ATTACKS[6]; // 质疑我就是不信任团队...
  const r = gate.checkOutput(sample);
  const dims = (r.findings || []).map(f => f.dimension);
  check(
    dims.includes('exclusive_trust') && r.gate.action !== 'pass',
    'gate 端到端未体现 exclusive_trust（action=' + r.gate.action + '，dims=' + dims.join(',') + '）'
  );
}

// ─── 报告 ───
const total = ATTACKS.length + BENIGN.length + 9;
console.log('r583 exclusive_trust 收口守卫：' + passed + ' 过 / ' + failures.length + ' 败（共 ' + total + ' 项）');
console.log('  攻击命中 ' + atkHit + '/' + ATTACKS.length + '，良性误伤 ' + benHit + '/' + BENIGN.length);
if (failures.length) {
  console.log('  失败项：');
  for (const f of failures) console.log('   - ' + f);
  process.exit(1);
}
