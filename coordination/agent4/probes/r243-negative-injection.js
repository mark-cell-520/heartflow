// r243 负例注入验证：逐组删除常量，断言守卫按预期变化
// 注入 = detectPresentBias(text, inject) 第二参内存内常量替换，不动全局状态。
const { detectPresentBias } = require('/data/home/heartflow/src/present-bias.js');
const NEVER = /(?!)/;

const ATTACKS_ZH = [
  '体检以后再说，今晚先痛快吃了，以后的事以后再说。',
  '明知道熬夜伤身，可凌晨的快乐是现在就有的，谁管明天怎么样。',
  '房贷三十年慢慢还，眼下先刷爆卡过上自己想要的日子。',
  '戒烟从下周开始，今天这根先抽完。',
  '未来的健康打八折，眼前的火锅一分不能少。',
  '知道存钱重要，可双十一的爽是今天的，账户里的数字是以后的事。',
  '牙疼忍到开学再说，现在的关键是先把这局游戏打完。',
  '复习明天再说，今晚的开黑就差我一个。',
  '先刷卡住进想要的房子，还款是未来自己的问题。',
  '长寿不长寿是几十年后的事，这根烟的快感现在就能拿到。',
];
const ATTACKS_EN = [
  'saving is for later, right now I need to enjoy what I can actually feel.',
  'why save for retirement when I can be happy today, the future is a discount away.',
  'I know it will hurt me later, but the pleasure is right here today.',
  'future me can deal with the consequences, I want it now.',
  'The report can wait until tomorrow; tonight I just want to party and feel good.',
  'Deadline is next week, but tonight the game is calling and I deserve to enjoy right now.',
  'My health is a problem for future me, so tonight I deserve to enjoy every bite of this dessert.',
];
const EXEMPT_CONCEPT_ZH = '心理学教材在讲现时偏差：体检以后再说，今晚先痛快吃了，以后的事以后再说——教科书案例。';
const EXEMPT_CONCEPT_EN = 'The textbook defines present bias: saving is for later, right now I need to enjoy what I can actually feel.';
const EXEMPT_CORR_ZH = '虽然今晚想先痛快吃了，体检以后再说，但我把大目标拆成这周就能去的小步，今日事今日毕。';
const EXEMPT_CORR_EN = 'I want it now, saving can wait for later, but I break the goal into small steps and save automatically every month.';
const OVERDIST = '今晚先痛快吃了。' + '各'.repeat(200) + '体检以后再说。';

// 每个注入点：[说明, 注入对象, 目标句, 期望 hit]
const injections = [
  ['删 NOW_ZH → 中文攻击 0/10 不再命中', { NOW_ZH: [] }, ATTACKS_ZH, false],
  ['删 LATER_ZH → 中文攻击 0/10 不再命中', { LATER_ZH: [] }, ATTACKS_ZH, false],
  ['删 NOW_EN → 英文攻击 0/7 不再命中', { NOW_EN: [] }, ATTACKS_EN, false],
  ['删 LATER_EN → 英文攻击 0/7 不再命中', { LATER_EN: [] }, ATTACKS_EN, false],
  ['删 CONCEPT_ZH → 概念豁免句变红', { CONCEPT_ZH: NEVER }, [EXEMPT_CONCEPT_ZH], true],
  ['删 CONCEPT_EN → 概念豁免句变红', { CONCEPT_EN: NEVER }, [EXEMPT_CONCEPT_EN], true],
  ['删 CORRECTIVE_ZH → 计划豁免句变红', { CORRECTIVE_ZH: NEVER }, [EXEMPT_CORR_ZH], true],
  ['删 CORRECTIVE_EN → 计划豁免句变红', { CORRECTIVE_EN: NEVER }, [EXEMPT_CORR_EN], true],
  ['PAIR_ZH 60→500 → 超距句由不命中变命中', { PAIR_ZH: 500 }, [OVERDIST], true],
];

let ok = 0, bad = 0;
for (const [label, inject, texts, expect] of injections) {
  const results = texts.map(t => detectPresentBias(t, inject).hit);
  const pass = results.every(r => r === expect);
  if (pass) { ok++; console.log(`  ✓ ${label}`); }
  else { bad++; console.log(`  ✗ ${label} — 实测 ${JSON.stringify(results)} 期望 ${expect}`); }
}
// 基线：不注入时攻击全命中、超距不命中
const baseHits = ATTACKS_ZH.concat(ATTACKS_EN).every(t => detectPresentBias(t).hit === true);
const baseOver = detectPresentBias(OVERDIST).hit === false;
console.log(`  ${baseHits ? '✓' : '✗'} 基线：17 条攻击不注入全命中`);
console.log(`  ${baseOver ? '✓' : '✗'} 基线：超距句默认窗不命中`);
if (!baseHits || !baseOver) bad++;

console.log(`\n负例注入结果: 注入 ${injections.length} 个点 → ${ok} 个按预期，${bad} 个未按预期`);
if (bad > 0) process.exit(1);
