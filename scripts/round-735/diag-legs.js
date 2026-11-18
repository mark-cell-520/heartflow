'use strict';
// r735 诊断：每条攻击样本命中哪条路由/哪条腿（供变异守卫选探针）
const M = require('/data/home/heartflow/src/circular-reasoning.js');
const { checkCircularReasoning, __internals } = M;
const I = __internals();
const attacks = [
  '幸福的定义就是感到幸福，所以感到幸福的人一定幸福。',
  '好的设计就是设计得好的东西，所以这件作品显然是好设计。',
  '效率的定义就是有效率地做事，所以我们这样做很有效率。',
  '安全的状态就是没有危险，所以没出事故说明我们是安全的。',
  '安全的状态就是没有危险，所以零事故的系统显然足够安全。',
  '公平就是对所有人公平，所以这种分配很公平。',
  '成功的定义是取得成功，所以没取得成功就是没成功。',
  '健康就是不生病，所以他没生病因此很健康。',
  '教育的本质是培养人，所以培养人的活动都是教育。',
  '真理就是正确的认识，所以这个认识是真理因此它正确。',
  '成功的定义是获得成就，所以没有成就的人都是失败的。',
  '健康的定义是没有疾病，所以有病的人就不健康。',
  '幸福就是感到幸福，所以不感到幸福的人不幸福。',
  '成功就是获得成就，所以成就意味着成功。',
  '这个方案成本高，所以它显然是个高成本方案。',
  'Truth is what is true, therefore this statement is true.',
  'Health is defined as being healthy, so he is healthy by definition.',
  'Health is defined as being healthy, so he stays healthy.',
  'Wisdom is defined as wise judgment, therefore this judgment shows wisdom.',
  'A good book is full of good content, therefore this is a good book.',
  'Efficiency means doing things efficiently, thus our process is efficient.',
  'Justice is giving each his due, so this verdict is just.',
  'Success is achieving success, therefore he is successful.',
  'A safe system has no accidents, so we have had no accidents and are safe.',
  'Fairness is treating everyone fairly, hence this distribution is fair.',
  'Education is the cultivation of people, so this activity is education.',
  "Freedom is acting on one's own will, therefore he is free.",
  'A quality product is well made, so this product is of quality.',
  'Wisdom is knowing what is wise, thus he is wise.',
  'Friendship means mutual help, so he who does not help is no friend.',
  'Education is by definition cultivation, so anything else is not education.',
  'Health means absence of disease, so anyone ill is unhealthy.',
  'Justice is defined as fairness, so an unfair act is not justice.',
  'Courage is defined as facing fear, so avoiding danger is not courage.',
];
// 逐常量作废，看哪些样本掉落（in-process 注入）
const MUT = {
  DEF_FRAME_ZH: [/^$/],
  DEF_FRAME_EN: [/^$/],
  USE_ZH: [/^$/],
  USE_EN: [/^$/],
  CONN_ZH: [/^$/],
  CONN_EN: [/^$/],
  TAUT_SYN_ZH: [],
  TAUT_SYN_EN: [],
  ANTONYM_ZH: [],
  ZH_COPULAR: /^$/,
  EN_COPULAR: /^$/,
  DEF_HEDGE_ZH: /(?:)/,
  DEF_HEDGE_EN: /(?:)/,
};
const base = attacks.map((t) => checkCircularReasoning(t).hit);
console.log('基线命中 ' + base.filter(Boolean).length + '/' + attacks.length);
for (const [k, v] of Object.entries(MUT)) {
  const dropped = [];
  attacks.forEach((t, i) => {
    const r = checkCircularReasoning(t, { [k]: v });
    if (base[i] && !r.hit) dropped.push(i);
  });
  console.log(`作废 ${k}: 掉落 ${dropped.length} 条` + (dropped.length ? ' -> ' + dropped.map((i) => attacks[i].slice(0, 34)).join(' | ') : ''));
}
