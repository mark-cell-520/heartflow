'use strict';
/**
 * scripts/negative-test-r216-texas-sharpshooter.js
 * [r216] 第 212 维度 texas_sharpshooter 负例脚本（近失样本零命中）。
 * 结构同 negative-test-absolute-claim-en 先例：
 *   N1 仅腿①（选择性筛选陈述出现，但无任何规律化宣称）
 *   N2 仅腿②（规律化宣称出现，但无选择性筛选陈述）
 *   N3 三层豁免（双腿齐全但被对照组/随机性/教学转述豁免）
 *   N4 商务日常近失（采购/会议/复盘等正常经营语言）
 *   N5 存量豁免（来自既有良性池的句子）
 *   N6 腿注入承重证明（抽掉任一条腿，攻击句必须变不判）
 */
'use strict';

const path = require('path');
const TS = require(path.join(__dirname, '..', 'src', 'texas-sharpshooter.js'));
const { checkTexasSharpshooter: chk } = TS;

let passed = 0, failed = 0;
function zeroHit(samples, label) {
  for (const s of samples) {
    const r = chk(s);
    if (r.hit) { failed++; console.log(`  FAIL ${label} 误命中: ${s}`); return; }
  }
  passed++;
  console.log(`  ok ${label}（${samples.length} 条零命中）`);
}

// ── N1 仅腿①：有筛选无规律化 ─────────────────────────────────────
zeroHit([
  '他只挑了自己喜欢的书。',
  '我们筛选出了三家供应商进入下一轮。',
  '她专门挑选了周末的时间去拜访客户。',
  '从候选名单里选出五个人进入面试。',
  '教练专挑状态好的球员参加热身赛。',
  '编辑挑出来三篇稿子送终审。',
  'Look only at the winners.',
  'We selected the top three vendors for the next round.',
  'She picked the red one from the shelf.',
  'The screen filtered out the expired listings.',
], 'N1 仅腿①');

// ── N2 仅腿②：有规律化无选择 ─────────────────────────────────────
zeroHit([
  '这道菜的秘诀是火候。',
  '水滴石穿，坚持不懈就是成功的秘诀。',
  '所有恒星都遵循万有引力定律。',
  '水加热到一百度会沸腾，这是物理定律。',
  '复利是世界第八大奇迹。',
  '供需关系决定价格，这是经济学的基本规律。',
  'The formula works for every case.',
  'Hard work is the secret to success.',
  'Gravity follows an inverse square law.',
  'The common thread in his novels is loneliness.',
  'Practice makes perfect — that is the rule.',
  'Supply and demand is the basic law of the market.',
  'The pattern repeats every hundred years.',
  'Their success formula was simple: ship fast.',
  'Every species adapts or dies — that is the pattern.',
], 'N2 仅腿②');

// ── N3 三层豁免：双腿齐全但正当 ───────────────────────────────────
zeroHit([
  '我们先分析成功案例的共同点，再用对照组检验这个假设是否成立。',
  '研究涨得好的股票时，必须同时看跌的那些，否则结论有偏。',
  '我们事先登记了假设，再看数据是否符合，避免先射箭后画靶。',
  'We compared survivors with non-survivors to avoid survivorship bias.',
  'The pattern was pre-registered before we looked at the data.',
  '这叫幸存者偏差，课堂上讲过：只看活下来的案例，共同点就是真理。',
  '中奖号码每期都是独立随机事件，历史号码不能预测下一期。',
  '只看成功案例的规律不能预测未来，需要对照组验证。',
  '我们既统计了盈利门店，也统计了亏损门店。',
  '研究成功企业时，失败案例也纳入了分析范围。',
  '这叫德州神枪手谬误，教科书第二章有讲过。',
  'It is called the texas sharpshooter fallacy, as the textbook explains.',
], 'N3 三层豁免');

// ── N4 商务日常近失 ──────────────────────────────────────────────
zeroHit([
  '我们先开会讨论，再写最终结论。',
  '先分工再协作，效率提高了不少。',
  '他先把数据整理好，再写结论报告。',
  '团队一起复盘，找出可以改进的地方。',
  '我们只看本季度的预算执行情况。',
  '只看报价的话，这家供应商最便宜。',
  '各部门的共同目标都是按时交付。',
  '大家推选了三名代表参加年会。',
  '筛掉不合格的样品之后，剩下九组数据。',
  '先看题目要求再动笔，这是基本流程。',
  'Look only at the price and this vendor wins.',
  'We keep only the records from this quarter.',
  'The team picked three representatives for the annual meeting.',
  'Review the agenda first, then write the minutes.',
], 'N4 商务日常近失');

// ── N5 存量豁免（既有良性池） ────────────────────────────────────
zeroHit([
  '幸福的人各有各的幸福，不幸的人却彼此相似。',
  '他专门挑了雨天去测绘，因为晴天光线太强。',
  '规律作息是健康的基础。',
  '成功没有捷径，唯有脚踏实地。',
  'He picked a rainy day for the survey on purpose.',
  'There is no single formula for happiness.',
], 'N5 存量豁免');

// ── N6 腿注入承重证明 ────────────────────────────────────────────
console.log('# N6 腿注入承重证明');
function inj(label, inject, expectHit) {
  const s = '我们先把成功的案例挑出来，再总结它们的共同点，这就是成功法则。';
  const r = chk(s, inject);
  const ok = r.hit === expectHit;
  if (ok) { passed++; console.log(`  ok ${label}`); }
  else { failed++; console.log(`  FAIL ${label}: hit=${r.hit} expect=${expectHit}`); }
}
inj('默认双腿齐全 → 判', {}, true);
inj('注入 SELECTION_ZH=[] → 不判', { SELECTION_ZH: [] }, false);
inj('注入 LAWFICATION_ZH=[] → 不判', { LAWFICATION_ZH: [] }, false);
inj('注入 SELECTION_ZH+LAWFICATION_ZH=[] → 不判', { SELECTION_ZH: [], LAWFICATION_ZH: [] }, false);
{
  const s = 'We picked the successful companies and found they all took risks — that is the pattern.';
  const ok = chk(s, { SELECTION_EN: [] }).hit === false && chk(s, { LAWFICATION_EN: [] }).hit === false;
  if (ok) { passed++; console.log('  ok EN 双腿分别抽掉均不判'); }
  else { failed++; console.log('  FAIL EN 腿注入'); }
}

console.log(`\nnegative-test-r216-texas-sharpshooter: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
