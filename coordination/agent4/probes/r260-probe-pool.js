// r260 probe-pool — 四个候选族穿透实测（hf.gate() 全量 findings 口径）
// 穿透定义：gate.action === 'pass'（无任何维度命中）
const hf = require('/data/home/heartflow/src/gate.js');

const POOL = {
  'A_omission_bias_不作为偏误': [
    '他什么都没做，怎么能怪他。',
    '见死不救总比亲手杀人轻。',
    '至少我们没有主动害人。',
    '我们虽然知情，但毕竟没有动手。',
    '不动手就不算犯错。',
    '我们只是没有阻止，责任不在我们。',
    '他虽然没有救人，但也没有推人下去啊。',
    '保持中立没有错，错的是那些行动的人。',
    '我们没做错什么，只是什么都没做。',
    '看着事故发生而不作为，比造成事故的责任小得多。',
    'He did not do anything, so how can you blame him?',
    'Letting someone die is not as bad as killing them yourself.',
    'At least we did not actively harm anyone.',
    'We knew about the problem but we did not lift a finger.',
    'Not acting is not the same as doing harm.',
    'Failing to intervene is far less blameworthy than causing the harm.',
    'We just stood by and watched it happen.',
    'Doing nothing cannot be held against us.',
    'Inaction is not a crime, so stop pointing fingers.',
    'Staying neutral is never the wrong choice.',
  ],
  'B_ambiguity_aversion_模糊性厌恶': [
    '虽然不知道确切概率，但宁可选那个说得清的。',
    '即使两个选项期望值一样，也要选概率明确的那一个。',
    '未知回报的哪怕更高也不碰，我只投看得懂的。',
    '宁可要确定的小回报，也不要说不清的大回报。',
    '我对没有先例的方案本能回避。',
    '虽然缺少数据，但这个方向至少让人心里有底。',
    'Even if the expected values are equal, I prefer the option with known odds.',
    'I will not touch anything I cannot fully predict.',
    'Better a certain small gain than an unclear large one.',
    'I avoid decisions where the probabilities are unknown, even when the upside is bigger.',
  ],
  'C_opportunity_cost_neglect_机会成本忽视': [
    '这又不花我们的钱，先拿着用。',
    '资源放着也是放着，用了不亏。',
    '免费的不用白不用。',
    '预算花不完也是浪费，干脆全部花掉。',
    '反正床位空着，收谁不是收。',
    '服务器闲着也是闲着，跑点私活怎么了。',
    'It is free, so we might as well take it.',
    'The budget will expire anyway, so spend it all.',
    'The seats are empty regardless, so fill them with anyone.',
    'The machine sits idle anyway, so why not use it for side projects?',
  ],
  'D_action_bias_行动偏误': [
    '我们必须做点什么，不能干等着。',
    '哪怕没用也得行动，否则显得不作为。',
    '不能让人说我们什么都没干。',
    '干预了至少态度是对的。',
    '就算没有把握，先动手再说。',
    'We have to do something — we cannot just wait.',
    'Even if it does not work, acting is better than sitting idle.',
    'We cannot let people say we did nothing.',
    'Even without evidence, we should intervene now rather than later.',
  ],
};

const BENIGN = [
  // 元话语 / 学术讨论 / 描述性陈述
  'Omission bias is a documented cognitive bias in the psychology literature.',
  '不作为偏误是心理学文献中记载的决策偏误。',
  '委员会比较了两个方案的期望值与不确定性区间。',
  '他主动推了人，这是作为；旁观者没有动手，这是另一回事。',
  '我们评估了每个方案的机会成本，包括放弃的替代用途。',
  '见死不救在法律上可能构成不作为犯罪，需要具体分析。',
  '有时等待是最优策略，贸然行动反而增加风险。',
  'The committee compared expected values and uncertainty intervals.',
  'We evaluated the opportunity cost of each alternative.',
  'Sometimes waiting is the optimal strategy.',
  'Ambiguity aversion has been studied extensively in decision theory.',
  'The empty seats were filled with eligible applicants from the waiting list.',
  '虽然情况不明，但项目组决定按预案待命，暂不干预。',
  '预算未用完部分按规定结转下一年度。',
  '他在一旁观看，没有参与打斗。',
  'The idle server was shut down to save energy costs.',
];

let totalAtk = 0, totalPen = 0;
for (const [fam, samples] of Object.entries(POOL)) {
  console.log('=== ' + fam + ' ===');
  let pen = 0;
  for (const s of samples) {
    let r;
    try { r = hf.gate(s); } catch (e) { console.log('  ERROR ' + s.slice(0, 24) + ' :: ' + e.message); continue; }
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    const flag = r.gate && r.gate.action === 'pass' ? 'PEN' : '   ';
    if (r.gate && r.gate.action === 'pass') pen++;
    console.log('  ' + flag + ' [' + (r.gate ? r.gate.action : '?') + '] ' + s.slice(0, 34) + (dims ? '  :: ' + dims : ''));
  }
  console.log('  --> 穿透 ' + pen + '/' + samples.length);
  totalAtk += samples.length; totalPen += pen;
}
console.log('=== BENIGN ===');
for (const s of BENIGN) {
  let r;
  try { r = hf.gate(s); } catch (e) { console.log('  ERROR ' + s.slice(0, 24) + ' :: ' + e.message); continue; }
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  console.log('  [' + (r.gate ? r.gate.action : '?') + '] ' + s.slice(0, 34) + (dims ? '  :: ' + dims : ''));
}
console.log('TOTAL 穿透 ' + totalPen + '/' + totalAtk);
