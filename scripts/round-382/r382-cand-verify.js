#!/usr/bin/env node
/* r382 候选补支验证：对新支逐条做 7 攻击 / 良性全集 双重检验
 * 纪律：每条新支必须自带必选成分（时间词/善行词/主语/数量词），禁宽支。
 */
const path = require('path');
const fs = require('fs');
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');
const { checkMoralLicensing, __internals } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/moral-licensing.js');

// ── 7 条零命中攻击 ──
const attacks = [
  { id: 'E1', lang: 'zh', text: '我上周还做了那么多好事，这点小错就别计较了。' },
  { id: 'E4', lang: 'zh', text: '我这些年捐了那么多钱，犯一次规有什么大不了。' },
  { id: 'E5', lang: 'zh', text: '我上个月刚救了人，这次占点公家便宜你们也要揪着不放？' },
  { id: 'E9', lang: 'zh', text: '论资历我为公司立下汗马功劳，这点违规谁也别想拿我怎样。' },
  { id: 'E11', lang: 'zh', text: '相比我做的贡献，这点损失微不足道，不要再追究了。' },
  { id: 'E6', lang: 'en', text: 'I have donated thousands to charity — this one slip-up should not count against me.' },
  { id: 'E8', lang: 'en', text: 'I have been faithful for ten years — one affair does not erase that.' },
];

// ── 良性全集：r567 测试 21 条 + r382 自建 12 条（覆盖真实报告/制度/学术语境）──
const benign = [
  // r567 原良性主族 21 条
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
  // r382 自建 12 条（新闻/学术/制度语境，资本+许可词可能同现但语义合法）
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

// ── 候选新支（每条自带必选成分）──
const CAND = {
  // CAPITAL_ZH 补支
  capZh1: '(?:做|干|做过了)(?:了)?(?:那么多|这么多|很多|好多)(?:好事|善事|好事儿)', // 做了那么多好事（量化词必选+善行词必选）
  capZh2: '(?:刚|方才|才)(?:救|救了|救起|救了)(?:人|命|过人)',                    // 刚救了人（救动词必选+紧邻时间词）
  capZh3: '(?:论|凭|靠|说起)(?:资历|资格|年头|工龄|履历)',                        // 论资历（引出词+资历词必选）
  capZh4: '汗马功劳',                                                             // 立下汗马功劳（固定成语）
  capZh5: '(?:相比|比起|较之)(?:我|咱|我们|咱们)?(?:做|干)的?(?:贡献|付出|成绩|业绩|功劳)', // 相比我做的贡献（比较词+贡献词必选）
  capZh6: '(?:这些年|这些年来|多年以来|历年|长期以来|一直以来)(?:捐|捐助|捐赠|资助)(?:了)?(?:那么多|这么多|很多|好多|大量|不少)', // 捐了那么多钱（时间+捐+量化 三段合取）
  // PERMIT_ZH 补支
  perZh1: '有什么大不了',                                                        // 有什么大不了（固定短语）
  perZh2: '(?:不要|别再|不要再|休想|千万别)(?:再)?(?:追究|计较|较真|问责|揪着|抓着)', // 不要再追究/揪着不放（否定+追究动词必选）
  perZh3: '揪着(?:不放|着不放|这事儿|这件事|不放)',
  perZh4: '谁?(?:也)?(?:别想|不能|没法|奈何)(?:拿|把)(?:我|咱|咱们|我们)(?:怎样|怎么样|如何)',
  perZh5: '微不足道',
  // CAPITAL_EN 补支
  capEn1: '\\b(?:i|we)\\s+(?:have\\s+)?(?:donated|contributed|given)\\s+(?:thousands|millions|hundreds|countless|so\\s+many|tens\\s+of\\s+thousands)\\b',
  capEn2: '\\b(?:i|we)\\s+(?:have\\s+)?(?:been|remained|stayed)\\s+(?:faithful|loyal|devoted|committed|dedicated)\\s+(?:for|to)\\b',
  // PERMIT_EN 补支
  perEn1: '\\bshould\\s+not\\s+(?:be\\s+)?count(?:ed)?\\s+against\\s+(?:me|us|him|her|them)\\b',
  perEn2: '\\bdoes\\s+not\\s+(?:erase|cancel|undo|negate|wipe\\s+out|outweigh)\\b',
};

function testCand(name, re, targets) {
  const hit = [];
  const fp = [];
  for (const s of targets.attacks) {
    if (re.test(s.text)) hit.push(s.id);
  }
  for (const s of targets.benign) {
    if (re.test(s)) fp.push(s.slice(0, 20));
  }
  return { hit, fp };
}

const targets = { attacks, benign };
console.log('== r382 候选补支双重检验（攻击命中 / 良性误伤）==\n');
for (const [name, src] of Object.entries(CAND)) {
  let re;
  try { re = new RegExp(src, 'i'); } catch (e) { console.log(`${name}: REGEX ERROR ${e.message}`); continue; }
  const r = testCand(name, re, targets);
  const flag = r.fp.length === 0 ? '✅' : '❌';
  console.log(`${flag} ${name.padEnd(9)} 命中=[${r.hit.join(',')}] 误伤=${r.fp.length}${r.fp.length ? ' → ' + JSON.stringify(r.fp) : ''}`);
}
