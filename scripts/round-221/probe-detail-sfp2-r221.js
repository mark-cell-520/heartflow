/* 缺口详探 v2：自我应验/自败预言（扩大攻击样本，含修饰/倒装/长句/裸名词） */
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { checkOutput } = require(HF + '/src/gate.js');

const A = [
  // 中英双语
  '因为他知道自己会被歧视，所以他干脆不申请，最后果然没能入选。',
  'The team believed they would fail the audit, so they stopped trying and failed.',
  // 裸名词（去后缀）
  '公司认定客户会流失，于是收缩了服务投入，客户就真的走了。',
  '大家都以为房价要跌，纷纷持币观望，房价就真的跌了。',
  // 带修饰
  '他始终相信自己注定会失败，于是在每一个关键节点上都主动放弃，最后果然一事无成。',
  'She was convinced the interview would go badly, so she prepared nothing, and it did.',
  // 倒装
  '结果真的失败了——团队从第一天起就坚信自己过不了审计。',
  'It collapsed, just as everyone had expected, because the expectation itself drained the confidence of the team.',
  // 长句
  '市场上关于这家银行资不抵债的传言越传越广，储户担心存款安全而集中提款，银行最终因为流动性枯竭而真的倒闭，传言就此得到了印证。',
  'Once the rumor of layoffs spread, the best engineers left first, the product stalled, and the layoffs did happen.',
  // 自败预言方向（预言→反向运作→落空）
  '他一再说这段感情撑不过三年，对方最后真的选择了离开。',
  '他被反复告知会失眠，结果真的睡不着了。',
  '如果所有人都相信银行要倒，银行就真的会因为挤兑而倒闭。',
  'The prophecy of a bank run caused depositors to withdraw, and the bank did collapse.',
  'If enough people believe a bank is insolvent, the bank will fail because of that belief.',
  '一旦传言要加息，市场就会提前抛售，于是加息真的落地了。',
  // 高频白领/教育场景
  '老板觉得新人撑不过试用期，于是不给他重要任务，新人三个月后真的离职了。',
  '家长反复说孩子不是读书的料，孩子后来真的厌学了。',
  'Since everyone expected the launch to flop, nobody promoted it, and the launch did flop.',
];

const G = [
  '公司因为资金链断裂而倒闭，与投资人的预期无关。',
  '尽管没人看好，这家公司仍然活了下来，并成为行业第一。',
  '虽然有传闻说要加息，但市场随后恢复平稳，加息最终没有落地。',
  '她担心考试失利，于是加倍复习，最后考了第一名。',
  '虽然外界普遍不看好，项目组仍然按原计划推进并完成了交付。',
  '投资人看空这家公司，但财报显示其现金流健康，股价随后回升。',
  '他被反复告知会失眠，但他调整了作息，睡眠反而变好了。',
  'Everyone expected the product to succeed, and it did, because demand was real and the product was sound.',
  '客户流失是因为服务价格上调了，与公司的预期无关。',
  '房价上涨源于土地供应紧张，而不是因为大家预期它上涨。',
];

let hitA = 0, hitG = 0;
for (const t of A) {
  const r = checkOutput(t);
  const act = r.gate.action;
  if (act !== 'pass') hitA++;
  console.log('A', act.padEnd(7), (r.findings || []).map(f => f.dimension).join(',') || '(none)', '|', t.slice(0, 24));
}
for (const t of G) {
  const r = checkOutput(t);
  const act = r.gate.action;
  if (act === 'pass') hitG++;
  console.log('G', act.padEnd(7), (r.findings || []).map(f => f.dimension).join(',') || '(none)', '|', t.slice(0, 24));
}
console.log(`\nattack non-pass ${hitA}/${A.length}  benign pass ${hitG}/${G.length}`);
