#!/usr/bin/env node
/* r382 支级解剖：7 条零命中样本 × capital/permit 双腿 × 六支正则逐支穿透
 * 目的：补腿前确认每条缺口形状与既有支的射程边界，避免 r567 宽支前科。
 * 落盘 scripts/round-382/（r227 纪律：探针不留仓库根目录）
 */
const { __internals } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/moral-licensing.js');
const I = __internals();

const samples = [
  { id: 'E1', lang: 'zh', text: '我上周还做了那么多好事，这点小错就别计较了。' },
  { id: 'E4', lang: 'zh', text: '我这些年捐了那么多钱，犯一次规有什么大不了。' },
  { id: 'E5', lang: 'zh', text: '我上个月刚救了人，这次占点公家便宜你们也要揪着不放？' },
  { id: 'E9', lang: 'zh', text: '论资历我为公司立下汗马功劳，这点违规谁也别想拿我怎样。' },
  { id: 'E11', lang: 'zh', text: '相比我做的贡献，这点损失微不足道，不要再追究了。' },
  { id: 'E6', lang: 'en', text: 'I have donated thousands to charity — this one slip-up should not count against me.' },
  { id: 'E8', lang: 'en', text: 'I have been faithful for ten years — one affair does not erase that.' },
];

// 拆支函数：把 join('|') 的源按顶层 | 拆开（本模块支均为单串，无嵌套分组干扰拆支观察）
function branches(src) {
  return src.source.replace(/^\^/, '').replace(/\$$/, '').split('|');
}

const ZH_BRANCHES = branches(I.CAPITAL_ZH);
const EN_BRANCHES = branches(I.CAPITAL_EN);
const PZH_BRANCHES = branches(I.PERMIT_ZH);
const PEN_BRANCHES = branches(I.PERMIT_EN);

function which(list, text) {
  const hitIdx = [];
  list.forEach((b, i) => {
    const re = new RegExp(b, 'i');
    if (re.test(text)) hitIdx.push(`#${i}`);
  });
  return hitIdx.length ? hitIdx.join(',') : '-';
}

for (const s of samples) {
  const capZh = I.CAPITAL_ZH.test(s.text);
  const capEn = I.CAPITAL_EN.test(s.text);
  const perZh = I.PERMIT_ZH.test(s.text);
  const perEn = I.PERMIT_EN.test(s.text);
  const cap = s.lang === 'zh' ? capZh : capEn;
  const per = s.lang === 'zh' ? perZh : perEn;
  const capB = s.lang === 'zh' ? which(ZH_BRANCHES, s.text) : which(EN_BRANCHES, s.text);
  const perB = s.lang === 'zh' ? which(PZH_BRANCHES, s.text) : which(PEN_BRANCHES, s.text);
  console.log(`${s.id} [${s.lang}] capital=${cap}(${capB}) permit=${per}(${perB}) => ${cap && per ? 'HIT' : 'MISS'}`);
}
console.log('\n--- 支级计数 ---');
console.log('CAPITAL_ZH 支数:', ZH_BRANCHES.length, ' CAPITAL_EN:', EN_BRANCHES.length,
  ' PERMIT_ZH:', PZH_BRANCHES.length, ' PERMIT_EN:', PEN_BRANCHES.length);
