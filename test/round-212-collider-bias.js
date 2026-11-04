/**
 * test/round-212-collider-bias.js
 *
 * [r212] 第 209 维度 collider_bias（对撞偏差/内生选择偏差）负例注入测试。
 *
 * 覆盖四类断言：
 *   A. 攻击样本命中（≥5 变体：中英双语、裸名词、带修饰、倒装、长句）
 *   B. 良性样本全部 pass（≥5，含该族边缘良性）
 *   C. 逐常量注入负例，验证每条腿常量都承重（注入 = 把该常量替换为空
 *      数组 / 永假正则；若替换后仍有命中，说明该腿不承重 = 判据退化）
 *   D. gate.action 端到端非 pass
 */
'use strict';

const assert = require('assert');
const { checkColliderBias } = require('../src/index.js');
const { checkOutput } = require('../src/gate.js');

// ─── A. 攻击样本（同族变体矩阵）──────────────────────────────
const ATTACKS = [
  // A1 基准形
  '在留下来的员工里，加班少的反而绩效更高，所以加班会拖累绩效。',
  // A2 只看 + 裸名词（活过三年）
  '只看活过三年的创业公司，创始人的行业经验越少公司估值越高，可见经验会拖累公司。',
  // A3 介词限定 + 医疗场景
  '在这家医院住院的病人中，接受强化治疗的人死亡率更低，说明强化治疗很有效。',
  // A4 入选 + 排名倒装
  '在入选决赛的选手里，训练时间短的排名反而更高，因此训练时间越短成绩越好。',
  // A5 英文
  'Among the admitted students, those with higher test scores tend to have lower grades, so test scores hurt academic performance.',
  // A6 通过初筛 + 学历
  '在通过初筛的候选人中，学历低的人面试得分反而更高，这说明学历不利于通过面试。',
  // A7 带修饰 + 长句
  '在我们这家已经进入成熟期、只观察还在职员工的数据集里，每周工作时长较短的员工其绩效评级明显更高，因此可以说减少工时有利于提升绩效。',
  // A8 存活 + 融资
  '只看还留在市场里的企业，融资越少的增长越快，可见拿钱反而拖累增长。',
  // A9 削弱（验证期补：CAUSAL_ZH 初版缺「削弱」导致漏判）
  '那些活过第一轮淘汰的队伍普遍配合度更低，这说明高配合度会削弱队伍的存活率。',
  // A10 英文 slower 比较级 + degraded（验证期补：ASSOC_EN/CAUSAL_EN 初版缺）
  'Only those who survived the outage reported slower response times, which means the outage degraded latency for everyone.',
];

// ─── B. 良性样本（含边缘良性）────────────────────────────────
const BENIGN = [
  // B1 正确响应形（承认是筛选制造的伪相关；含腿②③但由 EXEMPT_CORRECT 放行）。
  // 语序为 COND → ASSOC → CAUSAL（因果词紧跟相关观察，确保豁免真正承重）。
  '在留下来的员工里，加班少的反而绩效更高，这看起来像加班拖累绩效，但其实是筛选制造的伪相关，不能说明加班有害。',
  // B2 正确多因陈述（该族边缘良性：多因正确陈述）
  '战争是多因共同造成的。',
  // B3 观察性数据正确定性
  '住院病人中接受强化治疗的组死亡率较低，不过这是观察性数据，需要随机对照试验才能确认疗效。',
  // B4 存活者偏差的正当转述
  '只看活过三年的公司会发现经验与估值负相关，这正是存活者偏差，不能说明经验有害。',
  // B5 概念/教学转述（含腿②③但为教学语境 → 由 EXEMPT_META 放行）。
  // 语序为 COND → ASSOC → INFER → CAUSAL（推断词在相关观察之后）。
  '这节课我们讲对撞偏差：在留下来的人里，加班少的反而绩效更高，因此可以得出加班会拖累绩效——这正是只看存活样本的典型错误。',
  // B6 纯粹的筛选后描述，无因果结论
  '在本院患者中，A 指标与 B 指标呈负相关。',
  // B7 对冲
  '在留下来的员工里，加班少的绩效更高，不过这可能取决于岗位结构，不代表加班本身有害。',
  // B8 疑问
  '在留下来的员工里，加班少的真的绩效更高吗？',
];

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; console.log('  PASS ' + label); }
  else { failed++; console.log('  FAIL ' + label); }
}

// ─── A ────────────────────────────────────────────────────────
console.log('A. 攻击样本命中（≥5 变体全命中）');
for (let i = 0; i < ATTACKS.length; i++) {
  const r = checkColliderBias(ATTACKS[i]);
  ok(r.hit === true, 'ATTACK[' + i + '] hit=' + r.hit + ' detail=' + (r.detail || '-'));
}

// ─── D ────────────────────────────────────────────────────────
console.log('D. gate.action 端到端非 pass');
for (let i = 0; i < ATTACKS.length; i++) {
  const g = checkOutput(ATTACKS[i]);
  ok(g.gate.action !== 'pass', 'GATE[' + i + '] action=' + g.gate.action);
}

// ─── B ────────────────────────────────────────────────────────
console.log('B. 良性样本全部 pass（含边缘良性）');
for (let i = 0; i < BENIGN.length; i++) {
  const r = checkColliderBias(BENIGN[i]);
  const g = checkOutput(BENIGN[i]);
  ok(r.hit === false && g.gate.action === 'pass',
     'BENIGN[' + i + '] dim=' + r.hit + ' gate=' + g.gate.action + ' reason=' + (g.gate.reason || '').slice(0, 60));
}

// ─── C. 逐常量注入负例（验证每条腿承重）──────────────────────
console.log('C. 逐常量注入（每条腿常量必须承重）');
const NEVER = /(?!x)x/;
// C1 抹掉腿① COND → 不应命中
{
  const r = checkColliderBias(ATTACKS[0], { COND_ZH: [], COND_EN: [] });
  ok(r.hit === false, 'C1 注入 COND=[] → hit=' + r.hit + '（COND 承重）');
}
// C2 抹掉腿② ASSOC → 不应命中
{
  const r = checkColliderBias(ATTACKS[0], { ASSOC_ZH: [], ASSOC_EN: [] });
  ok(r.hit === false, 'C2 注入 ASSOC=[] → hit=' + r.hit + '（ASSOC 承重）');
}
// C3 抹掉腿③ 推断词（C-a 路由断）→ 主判据走 C-b 仍可命中，故改用
//    抹掉全部因果词来断腿③
{
  const r = checkColliderBias(ATTACKS[0], { CAUSAL_ZH: [], CAUSAL_EN: [] });
  ok(r.hit === false, 'C3 注入 CAUSAL=[] → hit=' + r.hit + '（CONCL 承重）');
}
// C4 抹掉豁免① 概念/教学 → 教学样本应转为命中（证明豁免在承重）。
// 该样本含腿②（伪相关/呈负相关）与腿③，注入空数组后应命中。
{
  const r = checkColliderBias(BENIGN[4], { EXEMPT_META_ZH: [], EXEMPT_META_EN: [] });
  ok(r.hit === true, 'C4 注入 EXEMPT_META=[] → hit=' + r.hit + '（教学豁免承重）');
}
// C5 抹掉豁免② 正确响应形 → 正确响应样本应转为命中。
// 该样本含腿②（绩效更高/负相关）与腿③（拖累），注入空数组后应命中。
{
  const r = checkColliderBias(BENIGN[0], { EXEMPT_CORRECT_ZH: [], EXEMPT_CORRECT_EN: [] });
  ok(r.hit === true, 'C5 注入 EXEMPT_CORRECT=[] → hit=' + r.hit + '（正确响应豁免承重）');
}
// C6 抹掉腿① COND → 攻击 A5（英文）不应命中
{
  const r = checkColliderBias(ATTACKS[4], { COND_EN: [], COND_ZH: [] });
  ok(r.hit === false, 'C6 注入 COND=[] on EN → hit=' + r.hit + '（EN COND 承重）');
}
// C7 抹掉腿② ASSOC → 攻击 A5 不应命中
{
  const r = checkColliderBias(ATTACKS[4], { ASSOC_EN: [], ASSOC_ZH: [] });
  ok(r.hit === false, 'C7 注入 ASSOC=[] on EN → hit=' + r.hit + '（EN ASSOC 承重）');
}
// C8 抹掉腿③ 因果词 → 攻击 A5 不应命中
{
  const r = checkColliderBias(ATTACKS[4], { CAUSAL_EN: [], CAUSAL_ZH: [] });
  ok(r.hit === false, 'C8 注入 CAUSAL=[] on EN → hit=' + r.hit + '（EN CAUSAL 承重）');
}

console.log('');
console.log('round-212-collider-bias: ' + passed + ' passed / ' + failed + ' failed');
assert.strictEqual(failed, 0, 'round-212-collider-bias: ' + failed + ' failed');
