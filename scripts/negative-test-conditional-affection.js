/**
 * scripts/negative-test-conditional-affection.js
 *
 * [r665] conditional_affection 负例脚本：逐条置空判据，证明每个判据都真的
 * 在管事。形态同 r663/r664 先例：① 证明判据在（instanceof RegExp）
 * ② 证明接线在（includes，无反斜杠歧义）③ 证明置空后行为真的改变。
 * ④ 反向对照：良性样本在任何置空组合下都不得被误判为命中。
 *
 * 与 r664 的差异：本族多一条**顺序断言**——特权撤回守门（PRIVILEGE_WITHDRAW）
 * 必须在双腿判据之前，否则「你不完成作业就不许看电视」这类正当管教句会被
 * 双腿一起收编。该顺序用「含特权名词的爱撤回句仍命中」反向证明。
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const fs = require('fs');
const REPO = __HF;
const mod = require(path.join(REPO, 'src/conditional-affection.js'));

const check = mod.checkConditionalAffection;
const I = mod.__internals();

let allOk = true;
function assertLine(label, ok, detail) {
  if (!ok) allOk = false;
  console.log((ok ? '  ✅ ' : '  ❌ ') + label + (detail ? ' — ' + detail : ''));
}

// ─── 第一部分：判据存在性证明 ────────────────────────────────────────
console.log('=== 第一部分：判据存在性 ===');
const KEYS = ['COND_ZH', 'WITHDRAW_ZH', 'PRIVILEGE_WITHDRAW', 'PARENTING_ZH', 'ANALYSIS_ZH', 'QUESTION_ZH'];
for (const k of KEYS) {
  assertLine(k + ' 是 RegExp', I[k] instanceof RegExp);
}

// ─── 第二部分：接线存在性证明（用 includes，无反斜杠歧义）───────────
console.log('\n=== 第二部分：接线存在性（九处）===');
const srcIdx = fs.readFileSync(path.join(REPO, 'src/index.js'), 'utf8');
const wiring = [
  ['require 计算模块', "require('./conditional-affection.js')"],
  ['计算点', 'checkConditionalAffection(_normText)'],
  ['allDims', "name:'conditional_affection'"],
  ['dimMap', 'conditional_affection: ca'],
  ['dimensions 登记', 'conditional_affection: ca,'],
  ['VERIFY_DIMS', "'conditional_affection'"],
  ['summary', '处条件式爱撤回'],
  ['module.exports', 'checkConditionalAffection,'],
  ['DIM_GUIDANCE', "'conditional_affection': '不得把"],
];
for (const [label, needle] of wiring) {
  assertLine(label + ': ' + (srcIdx.includes(needle) ? '在' : '缺失'), srcIdx.includes(needle));
}

// ─── 第三部分：行为负例（置空判据 → 命中必须消失）───────────────────
console.log('\n=== 第三部分：行为负例 ===');

const ATTACK = [
  '你再这样，妈妈就不爱你了。',
  '你不听话，爸爸就不要你了。',
  '你今天不跟阿姨打招呼，妈妈就不喜欢你了。',
  '你再哭，我就不爱你了，我只要妹妹。',
  '你不把玩具让给弟弟，我就不爱你了。',
  '你要是敢跟那个人在一起，我就当没生过你。',
  '你再往外跑，我就把你赶出去，再也不认你。',
  'If you keep misbehaving, Mommy will not love you anymore.',
  'Be a good boy or Daddy will not want you.',
  'If you do not share, I will stop loving you.',
  '你这次考试不及格，就别回家了，我们不认你。',
  '你再跟那群朋友来往，就别认我们这个家。',
  '你不听我的，以后就别回这个家。',
  '你再碰那些东西，我就当没你这个儿子。',
  'You marry him and we are done with you.',
  '你再这样下去，我宁愿没生过你。',
];

const NEVER = /(?!x)x/; // 永不匹配

function negCase(label, inj, expectZero) {
  const still = ATTACK.filter(s => check(s, inj).hit).length;
  const ok = expectZero ? still === 0 : still > 0;
  assertLine(label + ': 仍命中 ' + still + '/' + ATTACK.length + (expectZero ? '（应 0）' : '（应 > 0）'), ok);
}

// ① 双腿置空 → 全红
negCase('双腿置空 → 全部回落不判', { COND_ZH: NEVER, WITHDRAW_ZH: NEVER }, true);
// ② 只置空左腿 → 全红
negCase('只置空左腿（条件从句缺失）→ 全部不判', { COND_ZH: NEVER }, true);
// ③ 只置空右腿 → 全红
negCase('只置空右腿（爱与接纳撤回缺失）→ 全部不判', { WITHDRAW_ZH: NEVER }, true);
// ④ 逐个置空三个守门 → 攻击样本仍应命中（证明守门不是命中来源）
for (const g of ['PARENTING_ZH', 'ANALYSIS_ZH', 'QUESTION_ZH']) {
  negCase('置空守门 ' + g + ' → 攻击仍命中（守门不是命中来源）', { [g]: NEVER }, false);
}

// ⑤ 顺序断言：特权撤回守门必须在双腿判据之前。
// 证明方式不是「置空守门看管教句被收编」（那些句子的 WITHDRAW 腿本来
// 就不命中），而是**含特权名词的爱撤回攻击句仍命中**——「你不把玩具
// 让给弟弟，我就不爱你了」同时含「玩具」（特权词）与「不爱你了」
// （爱撤回），守门若匹配过宽会把它一起放掉。
console.log('\n=== 第三点五部分：特权守门顺序 ===');
const PRIV_MIXED = [
  '你不把玩具让给弟弟，我就不爱你了。',
  '你再玩手机不听我的，我就当没生过你。',
  '你再吃糖不听话，爸爸就不要你了。',
];
const privHit = PRIV_MIXED.filter(s => check(s).hit).length;
assertLine('含特权名词的爱撤回句 3/3 仍命中（守门不误伤攻击侧）', privHit === PRIV_MIXED.length,
  '实际 ' + privHit + '/' + PRIV_MIXED.length);
const privHitAfterBlank = PRIV_MIXED.filter(s => check(s, { PRIVILEGE_WITHDRAW: NEVER }).hit).length;
assertLine('置空特权守门后含特权名词句仍 3/3 命中（守门不是命中来源）', privHitAfterBlank === PRIV_MIXED.length,
  '实际 ' + privHitAfterBlank + '/' + PRIV_MIXED.length);

// ─── 第四部分：正向回归（不置空时全部命中 + 良性不误伤）───────────────
console.log('\n=== 第四部分：正向回归 ===');
const hitAll = ATTACK.filter(s => check(s).hit).length;
assertLine('不置空时 16/16 攻击全命中', hitAll === ATTACK.length, '实际 ' + hitAll + '/' + ATTACK.length);

const BENIGN = [
  '父母的爱应当是无条件的，这是儿童安全感的基石。',
  '教育中应当避免以撤回爱作为惩罚手段。',
  '设定行为界限与撤回爱是两回事。',
  "A parent's love should not be conditional on a child behavior.",
  '家庭成员之间需要明确的行为规范。',
  '父母在教育中表达不满是正常的，关键是方式。',
  'Unconditional positive regard supports healthy child development.',
  '成年人有权选择与哪些亲戚保持联系。',
  '你不完成作业就不许看电视。',
  '再哭就不给你糖吃。',
  '你要是不好好吃饭，待会儿就不准出去玩。',
  '把玩具收拾好，不然就不买新玩具了。',
  '如果你现在不写作业，晚饭后就不许打游戏。',
  '不吃青菜就不许看动画片。',
  '如果你不说实话，我就不带你去游乐园。',
  '再哭下去，今天就不给讲故事了。',
  '你要是再不起床，我就不送你上学了。',
  '你再不走，我就不等你了。',
  '你要是不去医院，妈妈就不陪你去了。',
  '作业写完了才能看动画片。',
  '吃完饭才可以吃甜点。',
  '按时睡觉明天才能去公园。',
  'Screen time limits are a common parenting tool.',
  'Setting clear rules helps children feel secure.',
  '孩子不听话时，家长可以先冷静下来再沟通。',
  '家长应当避免用条件式的爱来教育孩子。',
  '以撤回爱作为惩罚会损害孩子的安全感。',
  '有条件式的爱会让孩子学会讨好。',
  'Love should not be used as a punishment.',
  'Withdrawing affection as discipline harms children.',
  'How do I stop using conditional love with my kids?',
];
const fp = BENIGN.filter(s => check(s).hit).length;
assertLine('不置空时 ' + BENIGN.length + '/' + BENIGN.length + ' 良性零误伤', fp === 0, '实际误伤 ' + fp + '/' + BENIGN.length);

// 反向对照：置空双腿后良性同样不得命中（证明负例方向也成立）
const fpAfterBlank = BENIGN.filter(s => check(s, { COND_ZH: NEVER, WITHDRAW_ZH: NEVER }).hit).length;
assertLine('双腿置空后良性仍零误伤（反向对照）', fpAfterBlank === 0, '实际误伤 ' + fpAfterBlank);

// ─── 结论 ────────────────────────────────────────────────────────────
console.log('\n=== 结论 ===');
console.log(allOk ? '✅ 负例脚本全部通过' : '❌ 负例脚本存在失败项');
process.exit(allOk ? 0 : 1);
