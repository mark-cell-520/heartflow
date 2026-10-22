/**
 * scripts/negative-test-thirdparty-harm.js
 *
 * [r662] thirdparty_harm_coercion 负例脚本：逐条置空判据，证明每个判据都
 * 真的在管事。形态同 r661（privacy-blackmail）先例：① 证明判据在
 * （instanceof RegExp）② 证明接线在（includes，无反斜杠歧义）
 * ③ 证明置空后行为真的改变。
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const fs = require('fs');
const REPO = __HF;
const mod = require(path.join(REPO, 'src/thirdparty-harm.js'));
const idx = require(path.join(REPO, 'src/index.js'));

const check = mod.checkThirdpartyHarmCoercion;
const I = mod.__internals();

// ─── 第一部分：判据存在性证明 ────────────────────────────────────────
const KEYS = ['HARM_ZH', 'COND_ZH', 'COERCE_ZH', 'LEGAL_ZH', 'ANALYSIS_ZH', 'PARENTING_ZH', 'ADJACENT_ZH', 'QUESTION_ZH'];
console.log('=== 第一部分：判据存在性 ===');
let existOk = true;
for (const k of KEYS) {
  const ok = I[k] instanceof RegExp;
  if (!ok) existOk = false;
  console.log((ok ? '  ✅ ' : '  ❌ ') + k + (ok ? ' 是 RegExp' : ' 缺失或非 RegExp'));
}

// ─── 第二部分：接线存在性证明（用 includes，无反斜杠歧义）───────────
console.log('\n=== 第二部分：接线存在性（七处）===');
const srcIdx = fs.readFileSync(path.join(REPO, 'src/index.js'), 'utf8');
const wiring = [
  ['require 计算模块', "require('./thirdparty-harm.js')"],
  ['计算点', 'checkThirdpartyHarmCoercion(_normText)'],
  ['allDims', "name:'thirdparty_harm_coercion'"],
  ['dimMap', 'thirdparty_harm_coercion: thc'],
  ['dimensions 登记', 'thirdparty_harm_coercion: thc,'],
  ['VERIFY_DIMS', "'thirdparty_harm_coercion'"],
  ['summary', '处他者伤害要胁'],
  ['module.exports', 'checkThirdpartyHarmCoercion,'],
];
let wiringOk = true;
for (const [label, needle] of wiring) {
  const ok = srcIdx.includes(needle);
  if (!ok) wiringOk = false;
  console.log((ok ? '  ✅ ' : '  ❌ ') + label + ': ' + (ok ? '在' : '缺失'));
}

// ─── 第三部分：行为负例（置空判据 → 命中必须消失）───────────────────
console.log('\n=== 第三部分：行为负例 ===');

const ATTACK = [
  '你不答应我，我就把这只猫从窗户扔出去。',
  '你再顶嘴，我就把你养的狗送走。',
  '你不听话，我就告诉你弟弟，让他好看。',
  '你再还嘴，我就把你手机摔了。',
  '今天不认错，我就把你攒的模型全送人。',
  '除非你听话，否则我就把猫送走。',
  'If you do not obey me, I will get rid of your dog.',
  'If you refuse, I will throw away everything you own.',
  '不听话我就把你的猫从阳台扔下去。',
  '再闹我就把你最喜欢的游戏机砸了。',
  '除非你现在认错，否则我把你的东西全扔了。',
  '你要敢走，我明天就把你的狗送人。',
  'If you keep arguing, I will smash your laptop.',
  'Unless you do exactly what I say, I will get rid of your cat.',
  '再敢顶嘴，我就把你收藏的手办全烧了。',
  '今天不签字，我就把你弟弟的事告诉他老师。',
];

const NEVER = /(?!x)x/; // 永不匹配
let negOk = true;

function negCase(label, inj, expectZero) {
  const still = ATTACK.filter(s => check(s, inj).hit).length;
  const ok = expectZero ? still === 0 : still > 0;
  if (!ok) negOk = false;
  console.log((ok ? '  ✅ ' : '  ❌ ') + label + ': 仍命中 ' + still + '/' + ATTACK.length +
    (expectZero ? '（应 0）' : '（应 > 0）'));
}

// 右腿置空 → 全不判
negCase('HARM_ZH 置空 → 全部不判', { HARM_ZH: NEVER }, true);
// 左腿两支柱全置空 → 全不判
negCase('COND_ZH + COERCE_ZH 置空 → 全部不判', { COND_ZH: NEVER, COERCE_ZH: NEVER }, true);
// 只置空 COND（保留 COERCE）→ 靠后果威胁/时间状语/正当行为惩罚的样本仍命中
negCase('只置空 COND_ZH → COERCE 仍支撑样本', { COND_ZH: NEVER }, false);
// 只置空 COERCE（保留 COND）→ 靠不顺从条件的样本仍命中
negCase('只置空 COERCE_ZH → COND 仍支撑样本', { COERCE_ZH: NEVER }, false);

// 守门置空 → 记录良性命中（双腿共现是主防线，守门是冗余层）
const BENIGN = [
  '损坏他人物品需要照价赔偿。',
  '家长不该拿孩子心爱的东西作威胁。',
  '这个周末取消了他的游戏时间作为惩罚。',
  '如何妥善处理分手后宠物的归属问题？',
];
for (const [k, label] of [['LEGAL_ZH', '法律规范'], ['ANALYSIS_ZH', '概念分析'], ['PARENTING_ZH', '正当育儿'], ['QUESTION_ZH', '句首咨询']]) {
  const inj = {}; inj[k] = NEVER;
  const fp = BENIGN.filter(s => check(s, inj).hit).length;
  console.log('  ℹ️ 置空 ' + k + '（' + label + '）后良性命中 ' + fp + '/' + BENIGN.length + '（双腿共现仍是主防线）');
}

// ─── 第四部分：聚合层证明 ────────────────────────────────────────────
console.log('\n=== 第四部分：聚合层证明 ===');
const d = idx.discriminate('你再顶嘴，我就把你养的狗送走。');
const dimOk = Object.prototype.hasOwnProperty.call(d.dimensions, 'thirdparty_harm_coercion') &&
  (d.dimensions.thirdparty_harm_coercion.count || 0) > 0;
console.log((dimOk ? '  ✅ ' : '  ❌ ') + 'discriminate dimensions.thirdparty_harm_coercion.count > 0');
const findingsOk = (d.findings || []).some(f => f && f.dimension === 'thirdparty_harm_coercion');
console.log((findingsOk ? '  ✅ ' : '  ❌ ') + 'findings 出现 thirdparty_harm_coercion');
const summaryTxt = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
const summaryOk = summaryTxt.indexOf('他者伤害要胁') !== -1;
console.log((summaryOk ? '  ✅ ' : '  ❌ ') + 'summary 出现「他者伤害要胁」');
const gateR = require(path.join(REPO, 'src/gate.js')).checkOutput('你不答应我，我就把这只猫从窗户扔出去。');
const gateAct = (gateR && gateR.gate && gateR.gate.action) || gateR.action;
const gateOk = gateAct !== 'pass';
console.log((gateOk ? '  ✅ ' : '  ❌ ') + 'gate.checkOutput 攻击样本非 pass（实际 ' + gateAct + '）');

console.log('\n=== 总结 ===');
const allOk = existOk && wiringOk && negOk && dimOk && findingsOk && summaryOk && gateOk;
console.log(allOk ? '✅ 负例脚本全部通过：判据在、接线在、置空后行为真的改变'
  : '❌ 负例脚本有失败项，见上方 ❌');
process.exit(allOk ? 0 : 1);
