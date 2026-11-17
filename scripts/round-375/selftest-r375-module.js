'use strict';
// r375 模块自测：攻击穿透 + 良性零误伤（接线前快速验证）。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { detectGovernmentHouseholdAnalogy: d } = require(path.join(ROOT, 'src', 'government-household-analogy.js'));

const attacks = [
  '国家财政跟家庭账本是一个道理，收入多少才能花多少，欠的债必须连本带利还清，否则就是破产。',
  '政府借钱和普通人借钱一样，花超了就是破产，所以财政赤字必须立刻清零。',
  'The government budget works just like a household budget — spend only what you earn and pay off the debt.',
  '治理国家要像居家过日子一样量入为出，绝不能用借钱的方式过日子。',
  '国债到期就必须全额偿还，跟还信用卡一个道理，不然国家信用就破产了。',
  '政府和企业一样，赚不到钱就会破产倒闭，所以财政必须年年有盈余。',
  'A country is no different from a family: if it spends more than it earns, it goes bankrupt.',
  '国家欠的债和房贷一样，迟早是要还的，借得越多还得越惨。',
  '政府赤字就好比个人透支信用卡，拆东墙补西墙，最后一定崩盘。',
  '家庭都知道节俭持家，国家更应该如此，财政赤字就是败家行为。',
  'A national government is just like a family maxing out its credit cards: the debt must be paid off in full or the country goes bankrupt.',
  'The treasury is like a household that has run up its credit cards — insolvency is only a matter of time.',
];
const benign = [
  '家庭预算要量入为出，个人借贷过度同样会导致债务危机。',
  '政府长期过度举债会推高利息负担并挤压公共支出，需要关注债务可持续性。',
  '主权政府可以滚动续借债务，这与家庭债务在机制上存在重要差异。',
  '政府在基础设施投资上的回报周期比企业长，评估标准应当不同。',
  '财政赤字的合理性与债务结构、增长前景有关，需要具体分析。',
  '国债收益率曲线反映了市场对未来利率和通胀的预期。',
  'A household that spends more than it earns will eventually face insolvency.',
  'Sovereign debt sustainability depends on growth, inflation, and debt structure.',
  'The company must repay its bonds at maturity or it will default.',
  '政府预算不等于家庭账本，主权政府可以滚动发债，不会因为债台高筑而破产。',
  '政府跟家庭一样要过日子，但并不意味着债台高筑就会破产。',
  'The government works like a household budget, but that does not mean it will go bankrupt.',
];
let hit = 0;
console.log('=== 攻击（期望命中；#4/#10 为已知软边界可不命中）===');
attacks.forEach((t, i) => { const r = d(t); if (r.hit) hit++; console.log((r.hit ? 'HIT ' : 'miss') + ' | #' + (i + 1) + ' ' + t.slice(0, 40)); });
console.log('攻击命中 ' + hit + '/' + attacks.length);
console.log('=== 良性（期望零命中）===');
let bHit = 0;
benign.forEach((t, i) => { const r = d(t); if (r.hit) { bHit++; console.log('HIT! | #' + (i + 1) + ' ' + t.slice(0, 40) + ' :: ' + (r.details || '').slice(0, 80)); } });
console.log('良性误命中 ' + bHit + '/' + benign.length);
process.exit(bHit === 0 ? 0 : 1);
