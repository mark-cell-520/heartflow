// r280 探针池：时间与概率推理方向候选新族，跑 gate 实测穿透情况
// 输出分类：ZERO(全维度零命中) / OTHER(被其他维度兜住) / CAUGHT(目标维度承重)
const hf = require('/data/home/heartflow/src/gate.js');

const groups = {
  gamblers_reversal_zh: [
    '这个号十期没出了，下期出它的概率大多了。',
    '都连续黑了五把，下一把不可能再黑了。',
    '冷了这么多天，该热一把了。',
    '运气不可能一直差，下一把准赢。',
    '连着输了六个回合，再怎么也得赢一回了。',
    '概率上说也轮到它了。',
    '倒霉了这么久，下一次总该轮到我走运。',
    '已经陪了这么多把，下把我肯定能翻本。',
  ],
  gamblers_reversal_en: [
    'This number hasn\u2019t come up in ten draws, so it\u2019s got to hit soon.',
    'Luck can\u2019t stay bad forever; the next one is bound to pay out.',
    'It has been cold for so long, a hot round is due.',
    'After so many losing rounds, my win has to be coming.',
  ],
  prosecutor_zh: [
    '这个检测方法的准确率有 99%，那你没病的概率也只有 1%。',
    'DNA 比对吻合的概率是百万分之一，所以他是无辜的概率也只有百万分之一。',
    '误差率只有千分之一，这案子判错的概率也就千分之一。',
    '系统匹配度 95%，那人是他的概率就是 95%。',
    '筛查的特异性高达 99%，没筛查出来就是没病。',
  ],
  prosecutor_en: [
    'The test is 99% accurate, so the probability you are innocent is only 1%.',
    'The DNA match probability is one in a million, so the chance he is innocent is one in a million.',
    'The error rate is 0.1%, so the chance this verdict is wrong is 0.1%.',
  ],
  posthoc_zh: [
    '自从他当了主管，部门的业绩就上来了，说明他有方。',
    '换了新教练之后球队就连胜，显然是教练的功劳。',
    '打那以后风向就变了，准是他带来的运气。',
    '他上任那天开始，天气都变好了。',
    '从用了这款产品开始，业绩就涨了，可见产品有效。',
  ],
  posthoc_en: [
    'Ever since he took over, sales went up \u2014 clearly his doing.',
    'After the new policy, things improved, so the policy caused it.',
    'Once we moved to the new building, morale picked up.',
  ],
  conditional_prop_zh: [
    '要是他问心无愧，怎么不敢当面说清楚？',
    '如果真的没问题，早就公开了。',
    '倘若心里没鬼，何必躲躲藏藏？',
    '假如真的是清白的，现在就不会是这个态度。',
  ],
  conditional_prop_en: [
    'If he had nothing to hide, he would have come forward.',
    'Were she truly qualified, she would not need the exemption.',
  ],
  appeal_prob_zh: [
    '既然概率有九成，那就一定能成。',
    '希望这么大，肯定跑不了。',
    '可能性这么高，铁定会发生。',
  ],
  mean_reversion_zh: [
    '这个季度太差了，下个季度一定会好起来，差到极点就该反弹了。',
    '连亏了三年，第四年怎么也该赚回来了。',
    '上次考砸了，这次肯定能考好，因为成绩总会回归正常。',
  ],
};

const targetDim = {
  gamblers_reversal_zh: 'gamblers_fallacy',
  gamblers_reversal_en: 'gamblers_fallacy',
  prosecutor_zh: 'prosecutors_fallacy',
  prosecutor_en: 'prosecutors_fallacy',
  posthoc_zh: 'post_hoc',
  posthoc_en: 'post_hoc',
  conditional_prop_zh: 'conditional_proposition',
  conditional_prop_en: 'conditional_proposition',
  appeal_prob_zh: 'appeal_to_probability',
  mean_reversion_zh: 'regression_to_the_mean',
};

const summary = {};
for (const [g, list] of Object.entries(groups)) {
  const dim = targetDim[g];
  let zero = 0, other = 0, caught = 0;
  for (const s of list) {
    const r = hf.check(s);
    const action = r.gate ? r.gate.action : r.action;
    const dims = (r.findings || []).map(f => f.dimension);
    const hitTarget = dims.includes(dim);
    const status = hitTarget ? 'CAUGHT' : (action !== 'pass' ? 'OTHER' : 'ZERO');
    if (status === 'ZERO') zero++;
    else if (status === 'OTHER') other++;
    else caught++;
    console.log(`[${status}] ${g} :: ${s.slice(0, 38)} :: action=${action} dims=[${dims.join(',')}]`);
  }
  summary[g] = { zero, other, caught };
}
console.log('\n=== 汇总 ===');
for (const [g, s] of Object.entries(summary)) {
  console.log(`${g}: ZERO=${s.zero} OTHER=${s.other} CAUGHT=${s.caught}`);
}
