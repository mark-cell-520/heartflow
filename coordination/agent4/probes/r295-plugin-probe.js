// r295 探针 1：插件层 18 族攻击命中实证（样本取自各轮报告/单测真实攻击句）
// + 性能基准 + 良性零误伤 + 守卫
const plugin = require('../../../src/plugins/econ-reasoning-check/index.js');
const { analyze, FAMILIES } = plugin;

// ─── 每族攻击样本（源自各模块单测/报告 §五 的原句）──
const ATTACK = {
  budget_value_conflation: '我们预算不够，所以这件事本来就不值得做。',
  average_marginal_conflation: '单台成本已经压到这么低了，说明再生产一台更便宜。',
  mental_accounting: '这笔年终奖是意外之财，不算正经收入，所以可以放心大胆地挥霍一把。',
  perverse_incentive: '按销量发奖金最能调动积极性，员工自己进货刷单也算业绩，双赢。',
  winners_curse: '竞标赢了说明这块地就值这个价，我们的判断得到了验证。',
  tragedy_of_commons: '这片草场是公共的，每家多养几只羊自己就多挣一份，至于草场退化那是大家一起承担的。',
  illusion_of_control: '买彩票要自己选号，自己选的号码中奖率比机选高，意念是能起作用的。',
  disposition_effect: '我这只票涨了四成，先落袋为安，套牢的那只再拿拿，总能涨回来的。',
  endowment_effect: '这把吉他是我的，陪了我十年，别说三千，五千我都不卖。',
  anchoring_effect: '谈判时对方开价八千，我砍到六千五就签了，没去想这东西其实只值三千。',
  present_bias: '体检以后再说，今晚先痛快吃了，以后的事以后再说。',
  peak_end_rule: '全程都挺无聊的，就结尾特别惊艳，我觉得这趟旅行值了。',
  effort_justification: '我们熬了几个月做出来的方案，质量肯定没问题。',
  p_hacking: '测试了30个参数组合，有一组p值终于小于0.05，说明策略有效。',
  inverse_gamblers_fallacy: '他一上场就进球，肯定是个身经百战的老将。',
  significance_effect_size: 'p 小于 0.05，所以这个药有效，可以全面推广',
  selection_on_dependent_variable: '能活下来的公司都融过资，所以融资能救命',
  ad_hominem: '他是个骗子，所以他说的关于气候的数据全是假的。',
};

// ─── 良性样本（官方良性语料形状 + 典型 think 结论）──
const BENIGN = [
  '根据成本加成定价，这批货的出厂价是每件三十七块五，含原材料、人工和合理利润。',
  '专业评估报告给出的估值区间是四百八十万到五百二十万，与挂牌价基本一致。',
  '实验达到统计显著（p=0.03），效应量为 0.2 个标准差，属于小效应，需要更大样本确认。',
  '我们在二十个预设假设中做了 Bonferroni 校正，校正后仍有三个结果显著。',
  '心理学教科书指出，锚定效应是最稳健的认知偏误之一，Kahneman 和 Tversky 有经典实验。',
  '样本选择上我们只纳入了完成全程随访的患者，并用逆概率加权纠正了失访偏倚。',
  '结论：心虫引擎的辨别维度共 246 个，覆盖逻辑谬误、因果推理与统计素养等家族。',
  '建议下一步：补充可验证的数据来源，把无法验证的断言改为不确定表述。',
  'The comparable sales in the neighborhood averaged around 480k, and the formal valuation came in at 495k.',
  'We corrected for multiple comparisons across the 20 pre-registered hypotheses.',
  'Anchoring is one of the most robust findings in judgment and decision making research.',
  'The regression controls for age, income, and baseline health status.',
  "He's a known liar, so his data on climate change is worthless.", // ← 这条是攻击句的良性邻接：放这里验证它会命中（下面单独断言）
];

let pass = 0, fail = 0;
console.log('=== 攻击命中（每族）===');
for (const fam of FAMILIES) {
  const sample = ATTACK[fam.key];
  const r = analyze(sample);
  const hit = r.families.some(f => f.key === fam.key);
  if (hit) { pass++; console.log(`  ✓ ${fam.key} (${fam.group}) score=${r.score}`); }
  else { fail++; console.log(`  ✗ ${fam.key} (${fam.group}) 未命中! families=[${r.families.map(f=>f.key).join(',')}]`); }
}
console.log(`攻击: ${pass}/${FAMILIES.length} 命中`);

console.log('=== 良性零误伤（前 12 条）===');
let benignHits = 0;
for (const b of BENIGN.slice(0, 12)) {
  const r = analyze(b);
  if (r.totalHits > 0) { benignHits++; console.log(`  ✗ 误伤: "${b.slice(0, 40)}..." → ${r.families.map(f=>f.key).join(',')}`); }
}
console.log(`良性: ${12 - benignHits}/12 零误伤`);

console.log('=== 性能基准（2000 字结论 × 50 次）===');
const longText = ('根据数据，该项目的第一年成本是每单二十块，平均成本每单十五块，边际成本约十八块。'.repeat(60)).slice(0, 2000);
const t0 = Date.now();
for (let i = 0; i < 50; i++) analyze(longText);
const ms = Date.now() - t0;
console.log(`50 次 × 2000 字 = ${ms}ms（均 ${(ms/50).toFixed(1)}ms/次）`);

// 空/短文本守卫
const g1 = analyze(''), g2 = analyze('短'), g3 = analyze(null);
console.log('守卫: empty.score=', g1.score, 'short.score=', g2.score, 'null.score=', g3.score);

// only 过滤（MCP action=<family> 用）
const one = analyze(ATTACK.anchoring_effect, { only: 'anchoring_effect' });
console.log('only=anchoring_effect →', one.familyCount, '族, keys:', one.families.map(f=>f.key).join(','));
const none = analyze(ATTACK.anchoring_effect, { only: 'ad_hominem' });
console.log('only=ad_hominem 于锚定句 →', none.familyCount, '族（应为 0）');
