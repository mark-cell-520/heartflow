'use strict';
// Exploratory probe r357 round2: refined candidates after round1.
// round1 发现：
//   B 腿①新进步动词 3/4 gate 穿透（突飞猛进/日趋精湛/今非昔比穿透；日臻成熟
//     被 pseudo_causal 代拦但 legs=111——腿①被某既有族意外命中，需诊断来源）
//   A 腿②低频副词 1/5 gate 穿透（被猛然发现穿透；骤然/成批/批量/成群被
//     reverse_causal/pseudo_causal 代拦，legs=101 模块级 leg2=- 缺口真实）
//   C 腿③新趋势动词 0/5——legs=111 全部已承重，需诊断腿③命中来源常量
//   D 腿②新激增形 1/4（屡创新高穿透；井喷/狂飙被代拦 legs=101；滚雪球 legs=111 已承重）
//   E 名词中介良性 leg1=0 零误配（交接项②隐患不成立）
// 本轮：
//   B2 逐词穿透 + 日臻熟成腿①命中来源诊断
//   C2 腿③命中来源常量诊断（证 C 无缺口）
//   D2 屡创新高/井喷 legs 诊断 + 纯缺口腿框隔离复测
//   A2 低频副词逐词穿透
const hf = require('/data/home/heartflow/src/gate.js');
const itb = require('/data/home/heartflow/src/immortal-time-bias.js');
const R = itb.__internals();

const LEG1 = {
  LEAD_SCREEN_ZH: R.LEAD_SCREEN_ZH, LEAD_SCREEN_EN: R.LEAD_SCREEN_EN,
  DETECT_UP_EN: R.DETECT_UP_EN, DETECT_UP_ZH: R.DETECT_UP_ZH,
  DETECT_UP_EN4: R.DETECT_UP_EN4, DETECT_UP_ZH4: R.DETECT_UP_ZH4,
  DETECT_UP_EN5: R.DETECT_UP_EN5, DETECT_UP_ZH5: R.DETECT_UP_ZH5,
  DETECT_UP_EN6: R.DETECT_UP_EN6, DETECT_UP_ZH6: R.DETECT_UP_ZH6,
};
const LEG2 = {
  CASE_SURGE_ZH: R.CASE_SURGE_ZH, CASE_SURGE_EN: R.CASE_SURGE_EN,
  CASE_SURGE_ZH2: R.CASE_SURGE_ZH2, CASE_SURGE_EN2: R.CASE_SURGE_EN2,
  CASE_SURGE_ZH3: R.CASE_SURGE_ZH3, CASE_SURGE_EN3: R.CASE_SURGE_EN3,
  CASE_SURGE_EN4: R.CASE_SURGE_EN4, CASE_SURGE_EN5: R.CASE_SURGE_EN5,
  CASE_SURGE_EN6: R.CASE_SURGE_EN6, CASE_SURGE_EN7: R.CASE_SURGE_EN7,
  CASE_SURGE_EN8: R.CASE_SURGE_EN8, CASE_SURGE_EN9: R.CASE_SURGE_EN9,
  CASE_SURGE_ZH4: R.CASE_SURGE_ZH4, CASE_SURGE_ZH5: R.CASE_SURGE_ZH5,
  CASE_SURGE_ZH6: R.CASE_SURGE_ZH6,
};
const LEG3 = {
  INCIDENCE_CLAIM_ZH: R.INCIDENCE_CLAIM_ZH, INCIDENCE_CLAIM_EN: R.INCIDENCE_CLAIM_EN,
  INCIDENCE_CLAIM_ZH2: R.INCIDENCE_CLAIM_ZH2, INCIDENCE_CLAIM_EN2: R.INCIDENCE_CLAIM_EN2,
  INCIDENCE_CLAIM_EN3: R.INCIDENCE_CLAIM_EN3, INCIDENCE_CLAIM_ZH3: R.INCIDENCE_CLAIM_ZH3,
};
function hits(list, text) { return list.some(re => { re.lastIndex = 0; return re.test(text); }); }
function diag(text) {
  const d = { leg1: [], leg2: [], leg3: [] };
  for (const k in LEG1) if (hits(LEG1[k], text)) d.leg1.push(k);
  for (const k in LEG2) if (hits(LEG2[k], text)) d.leg2.push(k);
  for (const k in LEG3) if (hits(LEG3[k], text)) d.leg3.push(k);
  return d;
}
function show(tag, t) {
  const r = hf.gate(t);
  const d = diag(t);
  console.log('  ' + (r.gate.action === 'pass' ? 'PEN' : 'blk') + ' [' + r.gate.action + '] ' + tag + ' :: ' + t.slice(0, 42) +
    ' :: gate=' + (r.findings || []).map(f => f.dimension).join(',') +
    ' | leg1=' + (d.leg1.join('+') || '-') + ' leg2=' + (d.leg2.join('+') || '-') + ' leg3=' + (d.leg3.join('+') || '-'));
}

console.log('=== B2 腿①新进步动词逐词穿透（腿②/腿③取承重形）===');
const B2 = [
  ['突飞猛进', '检测技术突飞猛进后，大量病例被重新发现，这说明这种病真的在变多。'],
  ['日趋精湛', '诊断技术日趋精湛，大批潜伏病例被查出，表明患病率确实在提高。'],
  ['今胜于昔', '检测能力今胜于昔，大量病例浮出水面，这说明这种病真的在蔓延。'],
  ['日臻成熟', '检出手段日臻成熟，越来越多隐匿病灶被识别出来，说明发病率真的在上升。'],
  ['日臻完善', '检验方法日臻完善，大量病例被重新发现，这说明这种病真的在变多。'],
  ['日益精进', '检测技术日益精进，大批潜伏病例被查出，表明患病率确实在提高。'],
  ['ctl-更新换代', '检测手段更新换代后，大量病例被重新发现，这说明这种病真的在变多。'],
  ['ctl-进步', '检测手段的进步让更多病例被查出，这说明患病率真的在上升。'],
];
B2.forEach(([tag, t]) => show(tag, t));

console.log('=== B2b 良性对照（新动词形 + 非路径 h 语境）===');
[
  ['软件-突飞猛进', '渲染技术突飞猛进，游戏帧率提升了两成。'],
  ['软件-日趋精湛', '压缩算法日趋精湛，存储成本下降了三成。'],
  ['对冲-突飞猛进', '检测技术突飞猛进后，大量病例被重新发现，但这并不代表发病率真的上升。'],
  ['学术-日臻成熟', '检测方法日臻成熟，早期确诊比例明显提高，是体检中心的常规推荐。'],
].forEach(([tag, t]) => show(tag, t));

console.log('=== C2 腿③命中来源诊断（round1 C 五句 + 控制句）===');
[
  ['抬头趋势', '筛查普及让更多病例被检出，患病率呈抬头趋势，这种病真的在变多。'],
  ['止跌回升', '检测升级后大量无症状感染者被确诊，患病率止跌回升，说明疾病真的在蔓延。'],
  ['再度翘尾', '检查普及以来隐匿病灶被不断识别，患病率再度翘尾，表明发病率真的在上升。'],
  ['持续看高', '普筛开展后大批潜伏病例浮出水面，患病率持续看高，这说明这种病真的在高发。'],
  ['报复性反弹', '筛查推广后大量病例被陆续确诊，患病率报复性反弹，表明这种病真的在蔓延。'],
  ['ctl-一路走强', '筛查普及让更多病例被检出，患病率一路走强，这种病真的在变多。'],
].forEach(([tag, t]) => show(tag, t));

console.log('=== D2 腿②新激增形诊断（腿②纯缺口隔离 + 承重腿框）===');
[
  ['屡创新高-裸', '病例数屡创新高'],
  ['屡创新高-腿框', '普筛开展后，病例数屡创新高，表明患病率真的在升高。'],
  ['连创新高-腿框', '普筛开展后，病例数连创新高，表明患病率真的在升高。'],
  ['井喷-腿框', '筛查普及以来，新增病例呈井喷态势，说明患病率真的在上升。'],
  ['井喷-短形', '病例呈井喷态势'],
  ['狂飙-腿框', '检测升级后，确诊病例一路狂飙，表明发病率确实在提高。'],
  ['ctl-激增', '筛查普及以来，新增病例激增，说明患病率真的在上升。'],
].forEach(([tag, t]) => show(tag, t));

console.log('=== A2 腿②低频副词逐词穿透（腿①/腿③取承重形）===');
[
  ['被猛然发现', '检查普及以来，众多隐匿病灶被猛然发现，说明患病率真的在上升。'],
  ['被骤然确诊', '筛查推广后，大量无症状感染者被骤然确诊，表明发病率确实在提高。'],
  ['被成批检出', '普筛开展后，大批隐匿病例被成批检出，这说明这种病真的在变多。'],
  ['被批量识别', '体检普及以来，越来越多潜伏病例被批量识别，表明患病率真的在升高。'],
  ['被成群查出', '检测升级后，众多隐匿病灶被成群查出，说明发病率真的在上升。'],
  ['被蜂拥确诊', '普筛开展后，大批隐匿病例被蜂拥确诊，这说明这种病真的在变多。'],
  ['ctl-被陆续发现', '检查普及以来，众多隐匿病灶被陆续发现，说明患病率真的在上升。'],
].forEach(([tag, t]) => show(tag, t));
