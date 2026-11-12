'use strict';
// r301 修法候选正则预演：确认补腿命中 4 个攻击样本且不碰良性样本
const CAND = {
  // 修法1: NODISTORT_EN 存在句倒装形（there is/are + no X difference + in/of + 主语）
  existInvertedEN: /\b(?:there\s+is|there'?s|there\s+are|there\s+seems?\s+to\s+be|there\s+appears?\s+to\s+be)\s+(?:no|little|hardly\s+any|barely\s+any|virtually\s+no)\s+(?:real\s+|meaningful\s+|material\s+|significant\s+|substantial\s+|measurable\s+)*(?:difference|differences|variation|disparity|gap|spread|effect|impact|distinction)\s+(?:in|of|between|among|across)\b/i,
  // 修法2: NOCHANGE_EN 监督退出断言族（no grounds/reason/need for monitoring/supervision…）
  superviseExitEN: /\b(?:there\s+is|there'?s|there\s+are|there\s+seems?\s+to\s+be|there\s+appears?\s+to\s+be)\s+(?:no|little|no\s+real|no\s+further|no\s+additional|no\s+particular)\s+(?:grounds|ground|reason|reasons|need|necessity|justification|basis|rationale|case|call|requirement)\s+(?:for|to|of)\s+(?:\w+\s+){0,3}?(?:monitoring|supervision|oversight|scrutiny|screening|vetting|auditing|policing|discipline|enforcement|regulation|inspection|surveillance|checking)\b/i,
  // 修法4: NODISTORT_ZH ②-h 单字「是」连接（定价本就是正确的）
  zhIsLink: /(?:保费|价格|费率|利率|定价|成本|收益|回报|报酬|费用|支出|收费|保费|机制|制度|结构|体系|系统|方案|安排)(?:自然|自动|当然|必然|一定|肯定|本来|终究|总归|本就|本身)?(?:就是|便是|才是|即为|是为|乃是|是|为)(?:合理|公平|公道|公允|合适|恰当|适当|正好|合宜|对等|划算|正当|正确|对的|没错|合情|可行|行得通|说得通|讲得通)/,
};

const ATTACK = [
  ['EN ②-h no meaningful difference', 'Across the pool there is no meaningful difference in default rates.', 'existInvertedEN'],
  ['EN ②-i no reason (applicant)', 'There is no reason for additional screening of the applicants.', 'superviseExitEN'],
  ['EN ②-i no grounds', 'There are no grounds for closer monitoring of the insured.', 'superviseExitEN'],
  ['ZH ②-h 定价本就正确', '这个机制下定价本就是正确的，不用再测算。', 'zhIsLink'],
];

const BENIGN = [
  ['EN 良性 risk-based', 'Without risk-based pricing, adverse selection will drive the pool toward higher-risk participants.'],
  ['EN 良性 hedge', 'It could be that behavior stays the same, but we still need to check the incentives.'],
  ['EN 良性 question', 'Will the guarantee really leave borrower behavior unchanged?'],
  ['EN 良性 corrective', 'Adverse selection is a real risk here, so we must introduce risk stratification.'],
  ['EN 良性 monitor', 'Depositors should monitor the bank, especially once coverage is universal.'],
  ['EN 良性 contribute', 'I will contribute because the public good only exists if everyone does.'],
  ['EN 良性 someone else (partial)', 'Someone else may step in, but I should not rely on that.'],
  ['EN 良性 diff exists', 'There is a meaningful difference in default rates between the two groups.'],
  ['EN 良性 grounds exist', 'There are grounds for closer monitoring of the insured under the rules.'],
  ['EN 良性 price wrong', 'The premiums are not reasonable and need to be recalculated.'],
  ['ZH 良性 正确激励', '如果不做风险分层，高风险方会大量进入，定价必然出错。'],
  ['ZH 良性 正确监督', '兜底之后必须配套行为监督，否则受保护的一方会放大冒险。'],
  ['ZH 良性 贡献显性化', '公共品需要把每个人贡献和收益对应起来，否则人人都会等别人出力。'],
  ['ZH 良性 防止搭便车', '为防止搭便车，我们设计了可核实的参与记录。'],
  ['ZH 良性 疑问句', '保费真的不会因为人群混合而变高吗？'],
  ['ZH 良性 混合池但正面', '混合池确实存在，所以我们要按风险分层定价。'],
];

console.log('=== 攻击样本（应命中）===');
let af = 0;
for (const [label, text, key] of ATTACK) {
  const hit = CAND[key].test(text);
  if (!hit) af++;
  console.log((hit ? '  HIT ' : '  MISS ') + label);
}
console.log('=== 良性样本（应不命中）===');
let bf = 0;
for (const [label, text] of BENIGN) {
  const hits = Object.keys(CAND).filter(k => CAND[k].test(text));
  if (hits.length) bf++;
  console.log((hits.length ? '  FALSE-HIT ' : '  pass ') + label + (hits.length ? ' <- ' + hits.join(',') : ''));
}
console.log('\nattack_miss=%d benign_false=%d' % (af, bf));
console.log(af === 0 && bf === 0 ? 'CANDIDATES_OK' : 'CANDIDATES_NEED_WORK');
