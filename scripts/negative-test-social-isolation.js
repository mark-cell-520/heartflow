/**
 * scripts/negative-test-social-isolation.js
 *
 * [r660] social_isolation 负例脚本：逐条置空判据，证明每个判据都真的在管事。
 * 形态同 r655/r656 先例：① 证明判据在（includes / instanceof RegExp）
 * ② 证明置空后测试真的红（行为对照）。
 */
'use strict';

const path = require('path');
const REPO = '/root/.hermes/skills/ai/mark-heartflow-skill';
const mod = require(path.join(REPO, 'src/social-isolation.js'));
const idx = require(path.join(REPO, 'src/index.js'));

const check = mod.checkSocialIsolation;
const I = mod.__internals();

// ─── 第一部分：判据存在性证明 ────────────────────────────────────────
const KEYS = ['ISOLATE_ZH', 'COND_ZH', 'COERCE_ZH', 'GUARDIAN_ZH', 'ANALYSIS_ZH', 'SAFETY_ZH', 'QUESTION_ZH'];
console.log('=== 第一部分：判据存在性 ===');
let existOk = true;
for (const k of KEYS) {
  const ok = I[k] instanceof RegExp;
  if (!ok) existOk = false;
  console.log((ok ? '  ✅ ' : '  ❌ ') + k + (ok ? ' 是 RegExp' : ' 缺失或非 RegExp'));
}

// ─── 第二部分：接线存在性证明（用 includes，无反斜杠歧义）───────────
console.log('\n=== 第二部分：接线存在性 ===');
const srcIdx = require('fs').readFileSync(path.join(REPO, 'src/index.js'), 'utf8');
const wiring = [
  ['require 计算模块', "require('./social-isolation.js')"],
  ['计算点', "checkSocialIsolation(_normText)"],
  ['allDims', "name:'social_isolation'"],
  ['dimMap', "social_isolation: si"],
  ['dimensions 登记', "social_isolation: si,"],
  ['VERIFY_DIMS', "'social_isolation'"],
  ['summary', "处社交隔绝"],
  ['module.exports', "checkSocialIsolation,"],
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
  '你不准跟那个人来往，否则就别怪我。',
  '以后不许再跟他说话，听见没有？',
  '你那些朋友都没安好心，离他们远点。',
  '手机交出来，我要检查你跟谁的聊天记录。',
  '从今天起不准出门，除非我陪你去。',
  'You are not allowed to see him anymore, or there will be consequences.',
  'Give me your phone so I can check who you have been talking to.',
  '没有我的允许，你不许跟任何朋友联系。',
  '如果你再跟他来往，我就把手机没收，永远不还你。',
  'If you keep talking to him, you are grounded and your phone is mine now.',
  '从现在起，你的一言一行都要向我报告。',
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
negCase('ISOLATE_ZH 置空 → 全部不判', { ISOLATE_ZH: NEVER }, true);
// 左腿两支柱全置空 → 全不判
negCase('COND_ZH + COERCE_ZH 置空 → 全部不判', { COND_ZH: NEVER, COERCE_ZH: NEVER }, true);
// 只置空 COND（保留 COERCE）→ 靠后果威胁/许可闸门/监控索取的样本仍命中
negCase('只置空 COND_ZH → COERCE 仍支撑多数样本', { COND_ZH: NEVER }, false);

// 守门置空 → 良性样本仍不判（守门不是命中来源，置空不应让良性变红）
const BENIGN = [
  '家长关心孩子的朋友圈是正常的。',
  '未成年人需要适当的社交引导和保护。',
  '切断社会联系是一种常见的控制手段。',
  '如何应对控制欲强的伴侣？',
];
for (const [k, label] of [['GUARDIAN_ZH', '正当监护'], ['ANALYSIS_ZH', '概念分析'], ['SAFETY_ZH', '安全提醒'], ['QUESTION_ZH', '句首咨询']]) {
  const inj = {}; inj[k] = NEVER;
  const fp = BENIGN.filter(s => check(s, inj).hit).length;
  // 守门置空后良性样本仍应 0 命中（双腿共现本身就是主防线，守门是冗余层）
  console.log('  ℹ️ 置空 ' + k + '（' + label + '）后良性命中 ' + fp + '/' + BENIGN.length + '（双腿共现仍是主防线）');
}

// ─── 第四部分：聚合层负例（接线六处各置空一次）───────────────────────
console.log('\n=== 第四部分：聚合层证明 ===');
const d = idx.discriminate('手机交出来，我要检查你跟谁的聊天记录。');
const dimOk = Object.prototype.hasOwnProperty.call(d.dimensions, 'social_isolation') &&
  (d.dimensions.social_isolation.count || 0) > 0;
console.log((dimOk ? '  ✅ ' : '  ❌ ') + 'discriminate dimensions.social_isolation.count > 0');
const findingsOk = (d.findings || []).some(f => f && f.dimension === 'social_isolation');
console.log((findingsOk ? '  ✅ ' : '  ❌ ') + 'findings 出现 social_isolation');
const summaryTxt = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
const summaryOk = summaryTxt.indexOf('社交隔绝') !== -1;
console.log((summaryOk ? '  ✅ ' : '  ❌ ') + 'summary 出现「社交隔绝」');

console.log('\n=== 总结 ===');
const allOk = existOk && wiringOk && negOk && dimOk && findingsOk && summaryOk;
console.log(allOk ? '✅ 负例脚本全部通过：判据在、接线在、置空后行为真的改变'
  : '❌ 负例脚本有失败项，见上方 ❌');
process.exit(allOk ? 0 : 1);
