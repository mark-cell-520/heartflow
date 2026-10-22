/**
 * scripts/negative-test-family-shame-coercion.js
 *
 * [r664] family_shame_coercion 负例脚本：逐条置空判据，证明每个判据都真的
 * 在管事。形态同 r663（guilt-induction）先例：① 证明判据在（instanceof RegExp）
 * ② 证明接线在（includes，无反斜杠歧义）③ 证明置空后行为真的改变。
 * ④ 反向对照：良性样本在任何置空组合下都不得被误判为命中。
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const fs = require('fs');
const REPO = __HF;
const mod = require(path.join(REPO, 'src/family-shame-coercion.js'));

const check = mod.checkFamilyShameCoercion;
const I = mod.__internals();

let allOk = true;
function assertLine(label, ok, detail) {
  if (!ok) allOk = false;
  console.log((ok ? '  ✅ ' : '  ❌ ') + label + (detail ? ' — ' + detail : ''));
}

// ─── 第一部分：判据存在性证明 ────────────────────────────────────────
console.log('=== 第一部分：判据存在性 ===');
const KEYS = ['SHAME_ZH', 'PURSUE2_ZH', 'HONOR_STUDY_ZH', 'CULTURE_ZH', 'THIRDPERSON_ZH', 'QUESTION_ZH'];
for (const k of KEYS) {
  assertLine(k + ' 是 RegExp', I[k] instanceof RegExp);
}

// ─── 第二部分：接线存在性证明（用 includes，无反斜杠歧义）───────────
console.log('\n=== 第二部分：接线存在性（九处）===');
const srcIdx = fs.readFileSync(path.join(REPO, 'src/index.js'), 'utf8');
const wiring = [
  ['require 计算模块', "require('./family-shame-coercion.js')"],
  ['计算点', 'checkFamilyShameCoercion(_normText)'],
  ['allDims', "name:'family_shame_coercion'"],
  ['dimMap', 'family_shame_coercion: fsc'],
  ['dimensions 登记', 'family_shame_coercion: fsc,'],
  ['VERIFY_DIMS', "'family_shame_coercion'"],
  ['summary', '处家族羞耻胁迫'],
  ['module.exports', 'checkFamilyShameCoercion,'],
  ['DIM_GUIDANCE', "'family_shame_coercion': '不得把"],
];
for (const [label, needle] of wiring) {
  assertLine(label + ': ' + (srcIdx.includes(needle) ? '在' : '缺失'), srcIdx.includes(needle));
}

// ─── 第三部分：行为负例（置空判据 → 命中必须消失）───────────────────
console.log('\n=== 第三部分：行为负例 ===');

const ATTACK = [
  '你这样做让全家丢脸，我们老×家没有你这样的人。',
  '祖宗八代的脸都让你丢尽了，你还有脸回来？',
  '你考这点分，我的脸往哪搁？',
  '你离婚的事传出去，让我们一家人在亲戚面前怎么抬头？',
  '你让我在同事面前抬不起头，你知不知道？',
  '你这样做，等于把全家的名声都毁了。',
  '咱家从来没有出过你这种丢人现眼的东西。',
  'You are disgracing the whole family with this behavior.',
  'How do you expect me to show my face after what you did?',
  'You brought shame to our family name.',
  '你让我这老脸往哪放？',
  '你干的这事，让整个家族都蒙羞。',
  '我辛辛苦苦维持的名声，一下子全毁在你手里。',
  '你这样做，我在邻里街坊面前还怎么见人？',
  'You embarrassed us in front of everyone we know.',
  '你让我们家成了全村的笑柄。',
];

const NEVER = /(?!x)x/; // 永不匹配

function negCase(label, inj, expectZero) {
  const still = ATTACK.filter(s => check(s, inj).hit).length;
  const ok = expectZero ? still === 0 : still > 0;
  assertLine(label + ': 仍命中 ' + still + '/' + ATTACK.length + (expectZero ? '（应 0）' : '（应 > 0）'), ok);
}

// ① 双腿置空 → 全红
negCase('双腿置空 → 全部回落不判', { SHAME_ZH: NEVER, PURSUE2_ZH: NEVER }, true);
// ② 只置空左腿 → 全红
negCase('只置空左腿（集体名誉受损定性缺失）→ 全部不判', { SHAME_ZH: NEVER }, true);
// ③ 只置空右腿 → 全红
negCase('只置空右腿（问责或断绝缺失）→ 全部不判', { PURSUE2_ZH: NEVER }, true);
// ④ 逐个置空四个守门 → 攻击样本仍应命中（证明守门不是命中来源）
for (const g of ['HONOR_STUDY_ZH', 'CULTURE_ZH', 'THIRDPERSON_ZH', 'QUESTION_ZH']) {
  negCase('置空守门 ' + g + ' → 攻击仍命中（守门不是命中来源）', { [g]: NEVER }, false);
}

// ─── 第四部分：正向回归（不置空时全部命中 + 良性不误伤）───────────────
console.log('\n=== 第四部分：正向回归 ===');
const hitAll = ATTACK.filter(s => check(s).hit).length;
assertLine('不置空时 16/16 攻击全命中', hitAll === ATTACK.length, '实际 ' + hitAll + '/' + ATTACK.length);

const BENIGN = [
  '家庭荣誉感是传统文化的一部分，应当理性看待。',
  '孩子考试成绩不理想时，家长应关注原因而不是责备。',
  '家族名誉不应成为绑架个人选择的工具。',
  'Social pressure from extended family can affect major life decisions.',
  '在集体主义文化中，个人成就往往与家庭荣誉相关。',
  '父母在意面子是常见现象，但不应以牺牲子女幸福为代价。',
  '宗族观念在现代社会已逐渐淡化。',
  'Family honor should never justify restricting a person autonomy.',
  '荣誉制度在不同文明中有着悠久的历史渊源。',
  '社会学研究关注家庭期望对个体职业选择的影响。',
  '家长应当区分适度的期望与过度的压力。',
  'Honor codes exist in many cultures and military academies.',
  '家族企业传承往往涉及代际之间的期望协调。',
  '在传统村落中，公共舆论对个人行为有约束作用。',
  'Studies show that family expectations shape career outcomes.',
  '面子文化是中国社会关系研究的重要课题。',
  '与亲戚的往来是很多人社交生活的重要组成部分。',
];
const fp = BENIGN.filter(s => check(s).hit).length;
assertLine('不置空时 17/17 良性零误伤', fp === 0, '实际误伤 ' + fp + '/' + BENIGN.length);

// 反向对照：置空双腿后良性同样不得命中（证明负例方向也成立）
const fpAfterBlank = BENIGN.filter(s => check(s, { SHAME_ZH: NEVER, PURSUE2_ZH: NEVER }).hit).length;
assertLine('双腿置空后良性仍零误伤（反向对照）', fpAfterBlank === 0, '实际误伤 ' + fpAfterBlank);

// ─── 结论 ────────────────────────────────────────────────────────────
console.log('\n=== 结论 ===');
console.log(allOk ? '✅ 负例脚本全部通过' : '❌ 负例脚本存在失败项');
process.exit(allOk ? 0 : 1);
