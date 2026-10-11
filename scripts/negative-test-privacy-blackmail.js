/**
 * scripts/negative-test-privacy-blackmail.js
 *
 * [r661] privacy_exposure_coercion 负例脚本：逐条置空判据，证明每个判据都
 * 真的在管事。形态同 r655/r656/r660 先例：① 证明判据在（instanceof RegExp）
 * ② 证明接线在（includes，无反斜杠歧义）③ 证明置空后行为真的改变。
 */
'use strict';

const path = require('path');
const fs = require('fs');
const REPO = '/root/.hermes/skills/ai/mark-heartflow-skill';
const mod = require(path.join(REPO, 'src/privacy-blackmail.js'));
const idx = require(path.join(REPO, 'src/index.js'));

const check = mod.checkPrivacyExposureCoercion;
const I = mod.__internals();

// ─── 第一部分：判据存在性证明 ────────────────────────────────────────
const KEYS = ['THREAT_ZH', 'COND_ZH', 'COERCE_ZH', 'LEGAL_ZH', 'ANALYSIS_ZH', 'SAFETY_ZH', 'QUESTION_ZH'];
console.log('=== 第一部分：判据存在性 ===');
let existOk = true;
for (const k of KEYS) {
  const ok = I[k] instanceof RegExp;
  if (!ok) existOk = false;
  console.log((ok ? '  ✅ ' : '  ❌ ') + k + (ok ? ' 是 RegExp' : ' 缺失或非 RegExp'));
}

// ─── 第二部分：接线存在性证明（用 includes，无反斜杠歧义）───────────
console.log('\n=== 第二部分：接线存在性（六处）===');
const srcIdx = fs.readFileSync(path.join(REPO, 'src/index.js'), 'utf8');
const wiring = [
  ['require 计算模块', "require('./privacy-blackmail.js')"],
  ['计算点', 'checkPrivacyExposureCoercion(_normText)'],
  ['allDims', "name:'privacy_exposure_coercion'"],
  ['dimMap', 'privacy_exposure_coercion: pec'],
  ['dimensions 登记', 'privacy_exposure_coercion: pec,'],
  ['VERIFY_DIMS', "'privacy_exposure_coercion'"],
  ['summary', '处隐私曝光要胁'],
  ['module.exports', 'checkPrivacyExposureCoercion,'],
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
  '你不答应我，我就把你的聊天记录发到网上。',
  '再敢提分手，我就把你的私密照片公开。',
  '你敢不听我的，我就把这件事告诉你所有同事。',
  '今天不转钱，我就把你欠债的事告诉你单位。',
  '你要是敢报警，我就把你的秘密全抖出去。',
  'If you leave me, I will post your private photos online.',
  'Do what I say or I will tell everyone your secret.',
  '你不配合，我就把你说的那些话截图发给所有人。',
  '不听话我就把你和别人的聊天记录贴到群里。',
  '再闹我就把你的身份证信息发到网上去。',
  '除非你现在答应，否则我把你的病历公开。',
  '你要敢走，我明天就把这些照片发给你全家。',
  'If you refuse, I will share your screenshots with your colleagues.',
  'Unless you obey me, I will leak your private messages to everyone.',
  '再敢顶嘴，我就把你私下说的话全部公开。',
  '今天不签字，我就把你那些秘密抖出来。',
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
negCase('THREAT_ZH 置空 → 全部不判', { THREAT_ZH: NEVER }, true);
// 左腿两支柱全置空 → 全不判
negCase('COND_ZH + COERCE_ZH 置空 → 全部不判', { COND_ZH: NEVER, COERCE_ZH: NEVER }, true);
// 只置空 COND（保留 COERCE）→ 靠后果威胁/时间状语/正当行为惩罚的样本仍命中
negCase('只置空 COND_ZH → COERCE 仍支撑样本', { COND_ZH: NEVER }, false);
// 只置空 COERCE（保留 COND）→ 靠不顺从条件的样本仍命中
negCase('只置空 COERCE_ZH → COND 仍支撑样本', { COERCE_ZH: NEVER }, false);

// 守门置空 → 良性样本仍不判（双腿共现是主防线，守门是冗余层）
const BENIGN = [
  '隐私受法律保护，未经同意公开他人信息是违法的。',
  '以曝光隐私相要挟是明确的违法行为。',
  '遭遇隐私威胁时应当第一时间报警并保留证据。',
  '如何应对分手后被威胁曝光隐私的情况？',
];
for (const [k, label] of [['LEGAL_ZH', '法律规范'], ['ANALYSIS_ZH', '概念分析'], ['SAFETY_ZH', '维权安全'], ['QUESTION_ZH', '句首咨询']]) {
  const inj = {}; inj[k] = NEVER;
  const fp = BENIGN.filter(s => check(s, inj).hit).length;
  console.log('  ℹ️ 置空 ' + k + '（' + label + '）后良性命中 ' + fp + '/' + BENIGN.length + '（双腿共现仍是主防线）');
}

// ─── 第四部分：聚合层证明 ────────────────────────────────────────────
console.log('\n=== 第四部分：聚合层证明 ===');
const d = idx.discriminate('再敢提分手，我就把你的私密照片公开。');
const dimOk = Object.prototype.hasOwnProperty.call(d.dimensions, 'privacy_exposure_coercion') &&
  (d.dimensions.privacy_exposure_coercion.count || 0) > 0;
console.log((dimOk ? '  ✅ ' : '  ❌ ') + 'discriminate dimensions.privacy_exposure_coercion.count > 0');
const findingsOk = (d.findings || []).some(f => f && f.dimension === 'privacy_exposure_coercion');
console.log((findingsOk ? '  ✅ ' : '  ❌ ') + 'findings 出现 privacy_exposure_coercion');
const summaryTxt = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
const summaryOk = summaryTxt.indexOf('隐私曝光要胁') !== -1;
console.log((summaryOk ? '  ✅ ' : '  ❌ ') + 'summary 出现「隐私曝光要胁」');
const gateR = require(path.join(REPO, 'src/gate.js')).checkOutput('你不答应我，我就把你的聊天记录发到网上。');
const gateAct = (gateR && gateR.gate && gateR.gate.action) || gateR.action;
const gateOk = gateAct !== 'pass';
console.log((gateOk ? '  ✅ ' : '  ❌ ') + 'gate.checkOutput 攻击样本非 pass（实际 ' + gateAct + '）');

console.log('\n=== 总结 ===');
const allOk = existOk && wiringOk && negOk && dimOk && findingsOk && summaryOk && gateOk;
console.log(allOk ? '✅ 负例脚本全部通过：判据在、接线在、置空后行为真的改变'
  : '❌ 负例脚本有失败项，见上方 ❌');
process.exit(allOk ? 0 : 1);
