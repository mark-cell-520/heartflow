/**
 * scripts/round-386/probe-candidates2.js — r386 第二轮候选族零命中探针
 * 族：OR≈RR 误读 / HR≈累积生存误读 / 百分点vs百分比 / 特设假说救援 /
 *     期望值≈最可能结果 / 独立事件相加 / 多组比较不校正 / 存量族新措辞
 */
'use strict';
const hf = require('../../src/gate.js');

const CANDIDATES = {
  H_or_as_rr: {
    zh: [
      ' logistic 回归显示 OR 为 3.2，说明服药者患病的风险是普通人的 3.2 倍。',
      '病例对照研究的 OR 达到 4，这意味着暴露组的发病概率是对照组的 4 倍。',
      'OR=1.5 就代表风险只上升五成，这个因素不值得担心。',
    ],
    en: [
      'The odds ratio was 3.2, so the exposed group has 3.2 times the risk.',
      'An OR of 4 means the probability of disease is four times higher.',
    ],
  },
  I_hr_as_survival: {
    zh: [
      '风险比 HR=0.7，说明新药把五年生存率从 50% 提高到了 85%。',
      'HR 为 0.8，意味着患者的死亡风险在任何时间点都直接少了 20 个百分点。',
      '风险比降到 0.5，等于患者活过五年的概率翻倍。',
    ],
    en: [
      'A hazard ratio of 0.7 means five-year survival improved by 30 percentage points.',
      'HR = 0.5 means the probability of surviving five years is doubled.',
    ],
  },
  J_pctpoint_pct: {
    zh: [
      '失业率只从 5% 升到 7.5%，不过是 2.5 个百分点的小事，说明就业形势没有实质恶化。',
      '支持率从 40% 降到 38%，只下降了 2 个百分点，所以其实相当于基本没掉。',
    ],
    en: [
      'Unemployment rose only 2.5 percentage points, from 5% to 7.5%, so nothing really changed.',
    ],
  },
  K_adhoc_rescue: {
    zh: [
      '预测没有应验，说明这次实验的条件不够理想，等条件更纯粹时理论自然成立。',
      '理论预言的效应没出现，是因为观测设备的精度还不够，换成更灵敏的仪器就能看到。',
      '实验否证了模型，但这正说明现实世界太嘈杂，在理想环境下模型一定对。',
    ],
    en: [
      'The prediction failed because the conditions were not ideal; in a cleaner setting the theory would hold.',
      'The experiment refuted the model, which just shows the real world is too noisy.',
    ],
  },
  L_ev_vs_mode: {
    zh: [
      '这个投资的期望收益是正的，所以最可能的结果就是赚钱。',
      '期望回报率为正，意味着你大概率会赚钱。',
    ],
    en: [
      'The expected return is positive, so the most likely outcome is making money.',
    ],
  },
  M_indep_add: {
    zh: [
      '每条链路失败的概率是 10%，两条并联链路的失败概率就是 20%。',
      '每次不中奖的概率是 50%，抽两次不中奖的概率就是 100%。',
    ],
    en: [
      'Each component has a 10% failure rate, so two components in parallel fail 20% of the time.',
    ],
  },
  N_multi_nocorrect: {
    zh: [
      '我们同时检验了 30 个假设，其中 3 个达到了显著，这 3 个发现都很扎实。',
      '二十个指标里有两个 p 值小于 0.05，这两个指标对销量的影响是确凿的。',
    ],
    en: [
      'We tested thirty hypotheses and three came out significant; all three findings are solid.',
    ],
  },
  O_surv_new_wording: {
    zh: [
      '只看活到项目结束的用户，留存曲线后段依然漂亮，说明产品长期价值没问题。',
      '能熬过试用期的客户满意度最高，可见忠诚用户才是基本盘。',
      '统计阵亡客户会让数据难看，所以放弃售后支持后剩下的客户反而更优质。',
    ],
    en: [
      'Looking only at users who survived to the end, the retention curve still looks great.',
    ],
  },
};

function run(text) {
  const r = hf.gate(text);
  return { action: r.gate ? r.gate.action : r.action, dims: (r.findings || []).map(f => f.dimension) };
}

let totalAttack = 0, penetrated = 0;
for (const [fam, data] of Object.entries(CANDIDATES)) {
  console.log('\n=== ' + fam + ' ===');
  for (const t of [...(data.zh || []), ...(data.en || [])]) {
    const r = run(t);
    totalAttack++;
    const pass = r.action === 'pass';
    if (pass) penetrated++;
    console.log((pass ? 'PENETRATED' : 'caught(' + r.action + ')') + ' | ' + JSON.stringify(r.dims) + ' | ' + t.slice(0, 54));
  }
}
console.log('\n=== 汇总：攻击 ' + totalAttack + ' 条，穿透 ' + penetrated + ' 条 ===');
