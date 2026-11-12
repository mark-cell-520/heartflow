// probe-candidates-r302.js — r302 候选家族零命中探针（v6.8.174 gate() 全量）
// 目的：动手前实证哪些候选攻击族当前完全穿透引擎（gate.action=pass 且无相关维度承重）。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const hf = require(path.join(ROOT, 'src/gate.js'));

const CANDS = {
  planning_fallacy: [
    '这次我考虑得很周全，每一步都排好了，两周肯定能做完，绝不会超期',
    '我已经把任务拆到小时级，所以不存在任何延期的可能，按计划一定准时交付',
    'I have planned every step down to the hour, so there is no way this slips; we will ship on time.',
    'This time is different — my detailed schedule guarantees we finish under budget and ahead of the deadline.',
  ],
  loss_aversion: [
    '亏一百块的痛是赚一百块快乐的两倍，所以哪怕胜算不小，只要可能亏就一律不碰',
    '损失的痛苦远大于等额收益的快乐，因此宁可永远不动，也不能冒任何亏损的风险',
    'The pain of a loss is twice the pleasure of an equal gain, so I must refuse any bet that could lose.',
    'Losses hurt far more than equal gains please, so the only safe move is to never take any risk at all.',
  ],
  money_illusion: [
    '我工资名义上涨了5%，虽然物价也涨了5%，但到手数字变大了，所以我实际更富有了',
    '今年名义收入创新高，就算通胀一样高，这个数听着就是比去年多，我觉得购买力提高了',
    'My pay rose 5% and even though prices rose 5% too, the number is bigger so my purchasing power improved.',
    'Nominal income hit a record this year; even with equal inflation, the figure sounds higher so I feel richer.',
  ],
  omission_bias: [
    '主动关停它会伤害一批人，所以哪怕继续运行伤害更大，只要我不主动叫停就不算我的责任',
    '出手干预可能被追责，袖手旁观再糟也无过错，因此明知会死人也宁可看着不动',
    'Shutting it down would harm some, so even though leaving it running harms more, not acting keeps my hands clean.',
    'Intervening could get me blamed, but standing by is blameless even if people die, so I refuse to act.',
  ],
  base_rate_neglect: [
    '这个检测准确率99%，我测出来是阳性，所以我几乎肯定得了这个病',
    '筛查灵敏度高达九成五，我落在阳性区，那我患病的概率就是九成五',
    'The test is 99% accurate and I tested positive, so I almost certainly have the disease.',
    'Screening sensitivity is 95%; I fell in the positive band, so my odds of being sick are 95%.',
  ],
  law_of_small_numbers: [
    '我连续见了三个一米九的山东人，所以山东人平均身高就是比别处高一大截',
    '抛十次硬币有七次正面，可见这枚硬币正面概率就是七成',
    'I met three 1.9m Shandong men in a row, so Shandong people are on average far taller.',
    'Ten coin flips landed seven heads, so this coin clearly has a 70% chance of heads.',
  ],
  fundamental_attribution_error: [
    '他能升职纯粹是因为会拍马屁，跟赶上好项目、好时机一点关系都没有',
    '那个学生考砸就是因为他懒、笨，完全不用想题目偏怪或身体不适这些外部因素',
    'He got promoted purely by kissing up, nothing to do with good projects or good timing.',
    'That student failed because he is lazy and dull; there is no need to weigh the odd questions or illness.',
  ],
  self_selection_bias: [
    '来上我训练营的人都年入百万了，可见我的训练营就是他们致富的原因',
    '能坚持跑完全程的会员个个身体变好，说明这个高强度课程对所有人都有效',
    'Everyone who joined my bootcamp now earns seven figures, so the bootcamp caused their success.',
    'The members who finished the whole program all got healthier, so the grueling course works for everyone.',
  ],
  immortal_time_bias: [
    '接受新疗法的病人确诊后平均又活了五年，而没接受的只活一年，可见新疗法显著延命',
    '这群人在确诊到用药之间状态一直很好，用药后生存期长，说明药物功不可没',
    'Patients on the new therapy lived five years on average after diagnosis versus one year without it, so it clearly extends life.',
    'Between diagnosis and treatment these patients stayed healthy and then lived long, so the drug did the work.',
  ],
  sunk_cost_new: [
    '这电影票都买了，哪怕再难看也得坐着看完，不然这钱就白花了',
    '这门课学费都交了，就算发现根本不适合，也得硬着头皮学完才不算浪费',
    'I already bought the ticket, so even if the film is awful I must sit through it or the money is wasted.',
    'The tuition is paid, so even though the course is wrong for me I have to grind through to not waste it.',
  ],
  sunk_cost_escalation: [
    '前面已经投了两百万，现在项目明显要黄，只能再追加五百万搏一把回本',
    '仗已经打了好几年、死了这么多人，只能继续增兵，否则前面的牺牲就全白费了',
    'We already sunk two million; the project is clearly failing, so we must pour in five more to win it back.',
    'The war has dragged on for years with so many dead, we can only send more troops or the prior sacrifice is wasted.',
  ],
};

let rows = [];
for (const [key, arr] of Object.entries(CANDS)) {
  let gateVerdicts = [];
  for (const t of arr) {
    let action = '?', dims = [];
    try { const r = hf.gate(t); action = (r.gate && r.gate.action) || '?'; dims = (r.findings || []).map(f => f.dimension); }
    catch (e) { action = 'ERR:' + e.message; }
    gateVerdicts.push({ action, dims: dims.join(',') || '-' });
  }
  const passthrough = gateVerdicts.every(v => v.action === 'pass');
  const hits = gateVerdicts.filter(v => v.action !== 'pass').length;
  rows.push({ key, passthrough, hits, n: arr.length, gateVerdicts });
}
console.log('=== r302 candidate zero-hit probe (v' + (require(path.join(ROOT,'package.json')).version) + ') ===');
for (const r of rows) {
  console.log(`${r.passthrough ? 'PASSTHRU' : 'partial  '} ${r.key}  (${r.hits}/${r.n} non-pass)`);
  for (let i=0;i<r.gateVerdicts.length;i++) console.log(`    [${i}] ${r.gateVerdicts[i].action}  dims=${r.gateVerdicts[i].dims}`);
}
console.log('--- summary passthrough families ---');
console.log(rows.filter(r=>r.passthrough).map(r=>r.key).join(', ') || '(none)');
