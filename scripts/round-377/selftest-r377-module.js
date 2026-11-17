'use strict';
// r377 模块层自测：linear_tax_revenue 攻击 10/10 命中 + 良性 14 条零误伤。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { detectLinearTaxRevenue } = require(path.join(ROOT, 'src', 'linear-tax-revenue.js'));

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + msg); } }

const ATTACK = [
  '税率提高一倍，税收自然也会翻倍，财政收入立马宽裕。',
  '减税一半，财政收入就少一半，预算立刻紧张。',
  'Doubling the tax rate will double the tax revenue the government collects.',
  '只要把税率再往上提，税收就一定跟着按比例往上涨，库房肯定更充实。',
  '税率和税收是简单的正比例关系，加税筹钱永远按税率等比见效。',
  '把企业所得税从25%降到15%，财政收入就按四成折损，一分不多一分不少。',
  '提高烟草税三成，税收收入必然跟着涨三成，瘾君子该买还是会买。',
  '税负加重多少，入库的钱就增加多少，这笔账闭着眼睛都能算。',
  'Halving the VAT rate will halve VAT receipts — the math is that simple.',
  'Tax cuts always cost the government exactly the rate cut times the current base.',
];

const BENIGN = [
  // 深探良性 10
  '税率与税收并非线性关系，超过临界点后提高税率反而可能因税基萎缩减少总收入。',
  '减税的影响取决于税基弹性，不能简单按税率比例折算财政收入变化。',
  '拉弗曲线描述税率与税收的非线性关系，具体位置取决于经济结构。',
  '在税基不变的简化假设下，税率提高会使税收同比例增加，这只是教科书推演。',
  '提高所得税率会减少劳动供给与企业投资，税基缩小会部分抵消税率效应。',
  '税收等于税率乘以税基，评估增税效果要看税基随税率的反应。',
  '减税可能通过刺激增长扩大税基，最终税收变化取决于两种效应的净结果。',
  '税制设计要权衡税率与税基，单一按比例折算财政收入会高估或低估政策效果。',
  '个人所得税专项附加扣除提高后，财政收入会有所减少，具体幅度取决于适用人数。',
  'The revenue effect of a rate change depends on how the tax base responds.',
  // 首轮池良性 4
  '在税基不变的简化假设下，税率提高税收会同比例增加，这只是教科书推演。',
  '税基会随税率调整，高税率可能促使避税与减少劳动供给，收入变化不是固定比例。',
  '拉弗曲线描述税率与税收的非线性关系，具体位置取决于经济结构。',
  'The revenue effect of a rate change depends on how the tax base responds to it.',
  // 跨族边界：tax_incidence 攻击句不得被本族命中
  '对企业征收房产税，税收由企业承担，不会转嫁给消费者，房租不会因此上涨。',
  // 事实性收入陈述（无税率变动语境）
  '去年增值税收入翻了一番，主要是因为加强了征收管理。',
];

console.log('=== r377 模块自测：linear_tax_revenue ===');
for (const t of ATTACK) {
  const r = detectLinearTaxRevenue(t);
  ok(r.hit, '攻击未命中: ' + t);
  if (!r.hit) continue;
  ok(r.score >= 0.6, 'score 未过 0.6: ' + t + ' → ' + r.score);
}
for (const t of BENIGN) {
  const r = detectLinearTaxRevenue(t);
  ok(!r.hit, '良性误伤: ' + t + (r.hit ? ' → ' + r.details : ''));
}

// 守卫/短文本
ok(!detectLinearTaxRevenue('').hit, '空文本应无命中');
ok(!detectLinearTaxRevenue('短').hit, '短文本应无命中');
ok(!detectLinearTaxRevenue(null).hit, 'null 应无命中');

// 注入 normalize 契约：空数组/永假正则不得 crash
const inj1 = detectLinearTaxRevenue(ATTACK[0], { RATE_ZH: [] });
ok(!inj1.hit, 'RATE_ZH 删条后应失效');
const inj2 = detectLinearTaxRevenue(ATTACK[0], { PROP_P3_ZH: /(?!)/i });
ok(!inj2.hit || true, 'PROP_P3_ZH 替换不得 crash');
const inj3 = detectLinearTaxRevenue(ATTACK[0], { CONCEPT_ZH: [], COND_ZH: [], CORRECT_ZH: [], NEG_ZH: [], HEDGE_ZH: [] });
ok(inj3.hit, '豁免全删后攻击 1 仍应命中（双腿承重）');

console.log(`\n模块自测: ${pass} 通过, ${fail} 失败`);
process.exit(fail > 0 ? 1 : 0);
