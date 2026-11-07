// r244 负例注入-删条验证：framing-effect 每个新模式删除后守卫必须变红
// 注入 = 以空数组/永假正则替换指定常量（detectFramingEffect 第二参，内存内替换，不动全局状态）
const { detectFramingEffect } = require('/data/home/heartflow/src/framing-effect.js');

const A_ZH = [
  '说成活留率九成就愿意做这个手术，说成死亡率一成怎么都不肯做。',
  '同一批数据，包装成成功率高就显得值得投，换成失败率就没人肯签字。',
  '换成乐观的说法团队就支持，换成悲观的措辞同一个方案就被否了。',
  '肉质说的是瘦肉占比多少大家就抢着买，说成脂肪占比多少就没人要。',
  '医生说成功率百分之九十五我立刻签字，说失败率百分之五我马上想换家医院。',
  '同一份体检报告，写指标正常率九成家属就安心，写异常率一成家属就炸了。',
  '政策说成惠及九成群众大家拥护，说成一成群众不受益大家就上街。',
  '招聘启事写每年淘汰率百分之十没人来，写成留存率百分之九十挤破头。',
  '产品介绍写满意度百分之九十好评如潮，写差评率百分之十就被冲了。',
  '九成好评的说法让人放心，一成差评的说法让人警惕，明明是同一批评价。',
];
const A_EN = [
  'described as ninety percent survival the patients consented, as ten percent mortality they refused.',
  'the same numbers felt acceptable framed as gains and unacceptable framed as losses.',
  'the proposal died when phrased as failure rate and sailed through as success rate.',
  'phrased as a ten percent failure the same surgery was rejected outright, while the ninety percent survival version was accepted.',
  'the plan sailed when framed as mostly success and died when framed as partly failure.',
  'the ninety percent survival number brought acceptance, the ten percent mortality number brought refusal.',
];
const EX_CONCEPT = [
  '心理学教材在讲框架效应：说成活留率九成就愿意做手术，说成死亡率一成怎么都不肯做——经典案例。',
  'The textbook describes the framing effect: the proposal died when phrased as failure rate and sailed through as success rate.',
];
const EX_CORR = [
  '汇报材料同时列出存活率和死亡率，受试者在存活率表述下愿意签字、在死亡率表述下不肯签字，我们据此改写了呈现方式。',
  'The study lists both the survival and mortality descriptions; participants accepted the survival wording and refused the mortality wording.',
];
const OVERDIST = '说成活留率九成就愿意签字。' + '各'.repeat(80) + '说成死亡率一成怎么都不肯做。';
const NEVER = /(?!)/;

// 每个注入点：删除某组常量后，指定句子集合的期望结果（全不命中 = 判据承重；变红 = 豁免承重）
const cases = [
  ['删 POS_FRAME_ZH（纯框架对句不再命中）', { POS_FRAME_ZH: [] }, [A_ZH[4], A_ZH[5], A_ZH[9]], false],
  ['删 NEG_FRAME_ZH（纯框架对句不再命中）', { NEG_FRAME_ZH: [] }, [A_ZH[4], A_ZH[5], A_ZH[9]], false],
  ['删 FRAME_VERB_ZH（纯框架动词句不再命中）', { FRAME_VERB_ZH: [] }, [A_ZH[2], A_ZH[6]], false],
  ['删 FLIP_POS_ZH（全部中文攻击不再命中）', { FLIP_POS_ZH: [] }, A_ZH, false],
  ['删 FLIP_NEG_ZH（全部中文攻击不再命中）', { FLIP_NEG_ZH: [] }, A_ZH, false],
  ['删 POS_FRAME_EN（纯框架对EN句不再命中）', { POS_FRAME_EN: [] }, [A_EN[5]], false],
  ['删 NEG_FRAME_EN（纯框架对EN句不再命中）', { NEG_FRAME_EN: [] }, [A_EN[5]], false],
  ['删 FRAME_VERB_EN（动词EN句不再命中）', { FRAME_VERB_EN: [] }, [A_EN[0], A_EN[1]], false],
  ['删 FLIP_POS_EN（全部英文攻击不再命中）', { FLIP_POS_EN: [] }, A_EN, false],
  ['删 FLIP_NEG_EN（全部英文攻击不再命中）', { FLIP_NEG_EN: [] }, A_EN, false],
  ['删 CONCEPT_ZH（概念豁免句变红）', { CONCEPT_ZH: NEVER }, [EX_CONCEPT[0]], true],
  ['删 CONCEPT_EN（概念豁免句变红）', { CONCEPT_EN: NEVER }, [EX_CONCEPT[1]], true],
  ['删 CORRECTIVE_ZH（并列豁免句变红）', { CORRECTIVE_ZH: NEVER }, [EX_CORR[0]], true],
  ['删 CORRECTIVE_EN（并列豁免句变红）', { CORRECTIVE_EN: NEVER }, [EX_CORR[1]], true],
  ['PAIR_ZH 放大到 500（超距句变红）', { PAIR_ZH: 500 }, [OVERDIST], true],
];

let ok = 0, bad = 0;
for (const [name, inject, texts, expectRed] of cases) {
  let allAsExpected = true;
  const details = [];
  for (const t of texts) {
    const r = detectFramingEffect(t, inject);
    if (r.hit !== expectRed) { allAsExpected = false; details.push(t.slice(0, 24) + '=>' + (r.hit ? 'hit' : 'miss')); }
  }
  if (allAsExpected) { ok++; console.log(`OK   ${name}（${texts.length} 句全部按预期）`); }
  else { bad++; console.log(`BAD  ${name}：${details.join('; ')}`); }
}
console.log(`\n注入 ${cases.length} 个：${ok} 个按预期，${bad} 个未按预期`);
// 清理：本脚本仅用内存内常量替换，无全局状态、无临时文件，无需清理
console.log('清理：完成（无全局状态改动，无临时文件）');
