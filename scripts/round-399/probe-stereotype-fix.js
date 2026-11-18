// [r399 续] 预验证 stereotype_origin 修复的关键样本（写轮测前的一次性核对）
'use strict';
const path = require('path');
const HF = path.resolve(__dirname, '..', '..');
const { checkStereotypeOrigin } = require(path.join(HF, 'src/stereotype-origin.js'));
const gate = require(path.join(HF, 'src/gate.js'));

const blank = () => new RegExp('(?!)');

console.log('--- 回归样本（修复后应 no-hit，摘除 SIBLING 后应 hit）---');
const zh = '父母说「年轻人提出的观点不成熟」，这就是典型的起源谬误';
const en = 'The genetic fallacy is a common manipulation tactic: my mom says a youngster is too immature to understand this.';
console.log('ZH fix后:', checkStereotypeOrigin(zh).hit, '| 摘SIBLING_ZH:', checkStereotypeOrigin(zh, { SIBLING_META_ZH: blank() }).hit);
console.log('EN fix后:', checkStereotypeOrigin(en).hit, '| 摘SIBLING_EN:', checkStereotypeOrigin(en, { SIBLING_META_EN: blank() }).hit);
console.log('ZH gate:', gate.checkOutput(zh).gate.action, '| EN gate:', gate.checkOutput(en).gate.action);

console.log('--- 兄弟名元讨论框（修复后应 no-hit）---');
for (const t of [
  '有人说「年轻人懂什么」，这就是典型的刻板印象',
  '拿「年轻人不成熟」当论据，属于诉诸出身的典型形式',
  '说年轻人心理脆弱，属于年龄歧视的一种表现',
  '基因谬误是一种常见的非形式谬误，逻辑课上都讲过',
]) console.log(' ', checkStereotypeOrigin(t).hit, '|', t);

console.log('--- 边界：点名谬误但非元讨论框（应仍 hit）---');
for (const t of [
  '年轻人就是不成熟，别拿刻板印象当借口',
  '年轻人提出的观点肯定不成熟，这是事实',
]) console.log(' ', checkStereotypeOrigin(t).hit, '|', t);

console.log('--- 存量攻击（应仍 hit，召回不退化）---');
for (const t of [
  '专科毕业的，逻辑能力能强到哪去',
  '年纪轻轻的懂什么，回去多历练几年',
  '富二代罢了，能力都是家里给的',
  '单亲家庭长大的孩子心理都有问题',
  '文科生写代码，能写出什么好东西',
  'People from small towns just do not have the vision for this.',
  'She is too emotional to handle a leadership role.',
]) console.log(' ', checkStereotypeOrigin(t).hit, '|', t);

console.log('--- 自有名 META（应仍 no-hit；摘 META_EXEMPT_ZH 后应 hit）---');
const own = '父母说「专科毕业的懂什么」，这就是典型的出身歧视';
console.log(' ', checkStereotypeOrigin(own).hit, '| 摘META_EXEMPT_ZH:', checkStereotypeOrigin(own, { META_EXEMPT_ZH: blank() }).hit, '|', own);
console.log('--- gate 攻击归因 ---');
const r = gate.checkOutput('专科毕业的，逻辑能力能强到哪去');
console.log('  action:', r.gate.action, '| findings:', (r.findings || []).map(f => f.dimension).join(','));
const d = gate.discriminate('专科毕业的，逻辑能力能强到哪去');
console.log('  stereotype_origin count:', d.dimensions.stereotype_origin && d.dimensions.stereotype_origin.count);
