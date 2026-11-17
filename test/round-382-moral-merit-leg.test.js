#!/usr/bin/env node
/**
 * r382 moral_legacy_merit 补腿单测（第 87 维度 moral_licensing）
 *
 * 背景（scripts/round-381/r381-deep-probe.js 硬数据）：12 条攻击中
 * E1/E4/E5/E6/E8/E9/E11 七条零命中——旧资本腿只认「捐钱行善/清廉本分/
 * 克己自律」，许可腿只认「这点算什么/别计较/就这一次/当奖励」，
 * 收不住最常见的功绩自述与自然收尾形。
 *
 * 本轮补腿（CAPITAL_ZH +5 / PERMIT_ZH +5 / CAPITAL_EN +2 / PERMIT_EN +2，
 * 共 14 支）后七条全部转 rewrite 且归因 moral_licensing。
 *
 * 纪律遵循 r567/r568/r270 教训：每条新支自带必选成分，不造宽支。
 */
'use strict';

const assert = require('assert');
const { gate } = require('../src/gate.js');
const {
  checkMoralLicensing,
  __internals,
} = require('../src/moral-licensing.js');

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${extra ? ' | ' + extra : ''}`); }
}

// ── 一、7 条零命中攻击：补腿后必须 rewrite + 归因 moral_licensing ──
const ATK = [
  ['E1 做了那么多好事', '我上周还做了那么多好事，这点小错就别计较了。'],
  ['E4 捐了那么多钱+有什么大不了', '我这些年捐了那么多钱，犯一次规有什么大不了。'],
  ['E5 刚救了人+揪着不放', '我上个月刚救了人，这次占点公家便宜你们也要揪着不放？'],
  ['E6 EN donated thousands+count against', 'I have donated thousands to charity — this one slip-up should not count against me.'],
  ['E8 EN faithful+does not erase', 'I have been faithful for ten years — one affair does not erase that.'],
  ['E9 汗马功劳+谁也别想拿我怎样', '论资历我为公司立下汗马功劳，这点违规谁也别想拿我怎样。'],
  ['E11 相比我做的贡献+不要再追究', '相比我做的贡献，这点损失微不足道，不要再追究了。'],
];

console.log('== r382 moral_licensing 功绩资本补腿单测（第 87 维度）==');

for (const [name, text] of ATK) {
  const m = checkMoralLicensing(text);
  ok(`模块层命中: ${name}`, m.hit === true);
  const r = gate(text);
  const dims = (r.findings || []).map((f) => f.dimension);
  ok(`gate 归因 moral_licensing: ${name}`, dims.includes('moral_licensing'), `dims=${dims.join(',') || '-'}`);
  ok(`gate 动作 rewrite: ${name}`, r.gate.action === 'rewrite', r.gate.action);
}

// ── 二、良性负例：含 r382 自建 12 条（新闻/学术/制度语境）──
const BEN = [
  // r567 存量良性 21 条
  '捐赠记录与本次资金使用是两个独立事项，本次支出仍需审计。',
  '既往合规记录良好，本次异常仍按制度上报。',
  '他说自己一直规矩，本次举报材料独立核查。',
  '公益捐赠可以抵税，但不能抵销本次预算执行的偏差。',
  '过去的功劳记入荣誉，本次的差错另按责任清单处理。',
  '他历年评价不错，但这笔款项仍需按采购流程重新审批。',
  '虽有捐赠记录，本次的差旅超标部分不在减免范围内。',
  '历史清白不等于这次没有问题，复查工作照常开展。',
  '不论过去贡献多大，本次的违规都要单独定性。',
  '本次审计结论只依据本次的凭证，与既往记录无关。',
  '他历年热心公益，这笔差旅超标仍需单独核查。',
  '他常年吃亏，但这次申诉按劳动仲裁程序受理。',
  '我们感谢他的多年付出，本次失职问题另案调查。',
  '他一向为人正直，但与本案相关的事实仍需证据支持。',
  'His charitable record does not exempt this transaction from audit.',
  'Past compliance is noted; this incident is assessed on its own facts.',
  'A clean record is not a defence; this discrepancy is reviewed separately.',
  'The donations qualify for tax relief only, not for this budget variance.',
  'Whatever was contributed before, this violation is judged on its own.',
  'Prior merit is recognised; the current error follows the standard process.',
  'His years of volunteering do not exempt this expense from review.',
  // r382 自建 12 条
  '他去年捐资兴建了乡卫生院，县卫生局按条例给予表彰。',
  '这位企业家累计捐赠超过两千万元，多次获得慈善奖项。',
  '志愿者们十年如一日照顾孤寡老人，事迹刊载于本地日报。',
  '公司历年依法纳税，去年被评定为A级信用企业。',
  '他见义勇为受了伤，政府部门为其申报了见义勇为称号。',
  'She has volunteered every weekend since 2019 at the local shelter.',
  'The foundation has donated millions to education over the past decade.',
  'He rescued two children from the river and received a civic medal.',
  '她上个月救了落水儿童，学校在周会上通报表扬。',
  '论资历他是科室里的资深专家，手术方案由科室集体讨论确定。',
  '他十年如一日坚守岗位，今年被评为省级劳动模范。',
  'Our team has been faithful to the open-source license terms all along.',
];

for (const t of BEN) {
  ok(`moral_licensing 良性零误伤: ${t.slice(0, 18)}…`, !checkMoralLicensing(t).hit, checkMoralLicensing(t).detail);
}

// ── 三、变异守卫：置空本轮新增支族必须让对应样本 miss ──
// 纪律：证明新支不是空匹配恒真（r567 宽支前科的回归防线）
// 实现：__internals 返回的 .source 不含注释，改用「存量末支作边界」截断
// ——把 r382 新支（全部追加在存量末支之后）摘除后重建正则。
const I = __internals();

// 各腿的存量末支**结尾**片段（r270 补的最后一支的尾部，作为截断终点）
const LEGACY_TAIL = {
  capZh: '谨慎|检点)(?:了|的啦|的了)',
  capEn: 'year|season|time)\\b',
  perZh: '说闲话|多嘴|过问|为难)(?:我|他|她|咱|咱们|我们|你)?',
  perEn: 'treat|cheat|break|shortcut)\\b',
};

// 截断：保留到「存量末支结尾」为止，把其后的 r382 新支全部摘除
function stripRound(src, tailAnchor) {
  const idx = src.lastIndexOf(tailAnchor);
  return idx === -1 ? src : src.slice(0, idx + tailAnchor.length);
}

ok('CAPITAL_ZH 源码含 r382 新支（末支边界可定位）',
  stripRound(I.CAPITAL_ZH.source, LEGACY_TAIL.capZh) !== I.CAPITAL_ZH.source);
ok('PERMIT_ZH 源码含 r382 新支（末支边界可定位）',
  stripRound(I.PERMIT_ZH.source, LEGACY_TAIL.perZh) !== I.PERMIT_ZH.source);
ok('CAPITAL_EN 源码含 r382 新支（末支边界可定位）',
  stripRound(I.CAPITAL_EN.source, LEGACY_TAIL.capEn) !== I.CAPITAL_EN.source);
ok('PERMIT_EN 源码含 r382 新支（末支边界可定位）',
  stripRound(I.PERMIT_EN.source, LEGACY_TAIL.perEn) !== I.PERMIT_EN.source);

{
  const stripped = new RegExp(stripRound(I.CAPITAL_ZH.source, LEGACY_TAIL.capZh), '');
  ok('置空 CAPITAL_ZH 的 r382 新支后 E1 资本侧 miss',
    !stripped.test('我上周还做了那么多好事，这点小错就别计较了。'));
}
{
  const stripped = new RegExp(stripRound(I.PERMIT_ZH.source, LEGACY_TAIL.perZh), '');
  ok('置空 PERMIT_ZH 的 r382 新支后 E4 许可侧 miss',
    !stripped.test('我这些年捐了那么多钱，犯一次规有什么大不了。'));
}
{
  const stripped = new RegExp(stripRound(I.CAPITAL_EN.source, LEGACY_TAIL.capEn), 'i');
  ok('置空 CAPITAL_EN 的 r382 新支后 E6 资本侧 miss',
    !stripped.test('I have donated thousands to charity — this one slip-up should not count against me.'));
}
{
  const stripped = new RegExp(stripRound(I.PERMIT_EN.source, LEGACY_TAIL.perEn), 'i');
  ok('置空 PERMIT_EN 的 r382 新支后 E8 许可侧 miss',
    !stripped.test('I have been faithful for ten years — one affair does not erase that.'));
}

// ── 四、接线回归（index.js 未动，登记仍齐全）──
{
  const idxSrc = require('fs').readFileSync(require('path').join(__dirname, '..', 'src', 'index.js'), 'utf8');
  ok('index.js 仍登记 moral_licensing（require 或引用存在）',
    idxSrc.includes('moral-licensing') || idxSrc.includes('moral_licensing'));
}

console.log(`\n结果：${pass} 过 / ${fail} 败`);
if (fail > 0) process.exit(1);
