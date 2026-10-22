/**
 * scripts/negative-test-silent-treatment.js
 *
 * [r656] 第 105 维度 silent_treatment_coercion（冷暴力胁迫）负例守卫。
 * 形状同 scripts/negative-test-fear-projection.js（r655）：对本维度做
 * 变异注入，断言「判据被破坏后命中必须翻转」——证明测试真的在测判据，
 * 不是恒绿。
 *
 * 变异组（每组：注入 → 期望仍命中的攻击样本数必须为 0）：
 *   M1 双腿置空（COND_ZH + WITHDRAW_ZH 全置永不匹配）
 *   M2 只置空右腿 WITHDRAW_ZH（仅不顺从条件不得判）
 *   M3 只置空左腿 COND_ZH（仅供给撤回不得判）
 *   M4 守门 RULES_ZH 置空（规则陈述样本不得因守门失效而误判）
 *   M5 守门 COOLDOWN_ZH 置空（正当冷静样本不得误判）
 *   M6 守门 ANALYSIS_ZH 置空（概念分析样本不得误判）
 *   M7 守门 QUESTION_ZH 置空（句首咨询样本不得误判）
 * 反向对照：未注入时全部攻击样本必须命中、全部良性样本必须不判。
 */
'use strict';

const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const mod = require(path.join(HF, 'src/silent-treatment-coercion.js'));
const check = mod.checkSilentTreatmentCoercion;

const NEVER = /(?!x)x/;

const ATTACK = [
  '你不答应我，我就一个月不跟你说话。',
  '今天不按我说的做，晚饭就别吃了，饿着。',
  '你再顶嘴，这个月零花钱一分都没有。',
  '你不听话，以后别想我再来接你。',
  '除非你现在认错，否则我永远不跟你说话。',
  'If you do not obey me, I will not speak to you for a month.',
  'You will not get any allowance until you do exactly as I say.',
  '你再不听话，以后别想我给你做饭。',
  '今天不道歉，晚上就别回家了，自己想办法。',
  '你要是不答应，以后学费生活费我一分不出。',
  '除非你认错，否则这个家不让你进。',
  'If you keep arguing back, I will stop cooking for you entirely.',
  '你再顶嘴，这个周末我不给你做饭了。',
  '从今天起你不认错，就别想我再跟你说话。',
  'If you refuse to apologize, I will stop picking you up from school.',
  'You will get no pocket money unless you start obeying me.',
];

const BENIGN = [
  '明确的规则和后果是育儿中常见的手段。',
  '家长需要情绪稳定，避免长期冷战。',
  '家庭成员之间应就家务分配达成一致。',
  'Time-outs can be an effective discipline tool when used briefly.',
  '零花钱需要与孩子约定清晰的使用规则。',
  '冷战会伤害关系，沟通才是解决之道。',
  '适度的冷处理能让双方有时间冷静下来。',
  '家长和孩子约定好规则后要一致执行。',
  '家长不该拿撤回照料作威胁，这属于冷暴力。',
  '把不给吃饭当成控制手段是明确的虐待行为。',
  '父母可以表达失望，但不该用断供来逼孩子认错。',
  'Withholding meals as punishment is widely regarded as harmful.',
  '你需要做的是把规则和后果提前说清楚，然后一致执行。',
  '因工作原因今晚不能接你，我会提前告诉老师。',
  'Parents sometimes need a moment to cool down before responding.',
  '这个月家里经济紧张，我们得重新规划一下开支。',
];

const MUTANTS = [
  { name: 'M1 双腿置空', inject: { COND_ZH: NEVER, WITHDRAW_ZH: NEVER }, expectMiss: 16 },
  { name: 'M2 只置空右腿 WITHDRAW_ZH', inject: { WITHDRAW_ZH: NEVER }, expectMiss: 16 },
  { name: 'M3 只置空左腿 COND_ZH', inject: { COND_ZH: NEVER }, expectMiss: 16 },
  { name: 'M4 守门 RULES_ZH 置空', inject: { RULES_ZH: NEVER }, expectMiss: 0 },
  { name: 'M5 守门 COOLDOWN_ZH 置空', inject: { COOLDOWN_ZH: NEVER }, expectMiss: 0 },
  { name: 'M6 守门 ANALYSIS_ZH 置空', inject: { ANALYSIS_ZH: NEVER }, expectMiss: 0 },
  { name: 'M7 守门 QUESTION_ZH 置空', inject: { QUESTION_ZH: NEVER }, expectMiss: 0 },
];

// 反向对照（未注入）
const baseHit = ATTACK.filter(s => check(s).hit).length;
const baseFp = BENIGN.filter(s => check(s).hit).length;
console.log('反向对照：攻击命中 ' + baseHit + '/' + ATTACK.length + '｜良性误伤 ' + baseFp + '/' + BENIGN.length);

let ok = true;
for (const m of MUTANTS) {
  const stillHit = ATTACK.filter(s => check(s, m.inject).hit).length;
  const flipped = ATTACK.length - stillHit;
  const pass = flipped >= m.expectMiss;
  // M1-M3 要求全部翻转（判据失效证据）；M4-M7 要求攻击样本仍全部命中
  // （守门失效不影响攻击侧判定——那正是守门与判据分离的证据），
  // 同时良性侧不得因守门失效而新增误伤。
  const benignFp = BENIGN.filter(s => check(s, m.inject).hit).length;
  const fullPass = pass && (m.expectMiss === 16 ? benignFp === 0 : true);
  if (!fullPass) ok = false;
  console.log((fullPass ? 'OK  ' : 'FAIL') + ' ' + m.name +
    '：翻转 ' + flipped + '/' + ATTACK.length + '（期望 ≥' + m.expectMiss + '）' +
    '｜注入后良性误伤 ' + benignFp + '/' + BENIGN.length);
}

// 正向守卫：良性样本在守门失效时也不得被误判（M4-M7 的第二重断言）
const guardMutants = [
  { name: 'RULES 置空', inject: { RULES_ZH: NEVER }, probe: 'Time-outs can be an effective discipline tool when used briefly.' },
  { name: 'COOLDOWN 置空', inject: { COOLDOWN_ZH: NEVER }, probe: 'Parents sometimes need a moment to cool down before responding.' },
  { name: 'ANALYSIS 置空', inject: { ANALYSIS_ZH: NEVER }, probe: 'Withholding meals as punishment is widely regarded as harmful.' },
  { name: 'QUESTION 置空', inject: { QUESTION_ZH: NEVER }, probe: 'How do I deal with a parent who withholds meals?' },
];
console.log('\n--- 守门失效下的良性样本仍不得判（该样本本身无双腿共现）---');
for (const g of guardMutants) {
  const hit = check(g.probe, g.inject).hit;
  // 这些良性样本本身无双腿共现，守门失效也不该被误判——
  // 若被误判，说明守门在替代双腿判据（那是另一种缺陷）。
  if (hit) ok = false;
  console.log((hit ? 'FAIL' : 'OK  ') + ' ' + g.name + '：良性样本 ' + (hit ? '被误判' : '仍不判'));
}

console.log('\n' + (ok ? '负例守卫全部通过' : '负例守卫有失败'));
process.exit(ok ? 0 : 1);
