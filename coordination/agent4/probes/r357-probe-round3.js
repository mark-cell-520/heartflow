'use strict';
// Exploratory probe r357 round3: C 干净腿框重测（round2 发现 C 句腿③被 legacy
// p4「这种病真的在变多」代承重——干净腿框纪律被违反，候选腿③形未隔离）+
// B/D/A 最终族表确认 + 良性边界。
// 干净腿框纪律：每条攻击非候选腿均取已承重形，候选腿为唯一 leg 缺口。
const hf = require('/data/home/heartflow/src/gate.js');
const itb = require('/data/home/heartflow/src/immortal-time-bias.js');
const R = itb.__internals();

function hits(list, text) { return list.some(re => { re.lastIndex = 0; return re.test(text); }); }
function diag(text) {
  const d = { leg1: [], leg2: [], leg3: [] };
  const L1 = { LEAD_SCREEN_ZH: R.LEAD_SCREEN_ZH, DETECT_UP_ZH: R.DETECT_UP_ZH, DETECT_UP_ZH4: R.DETECT_UP_ZH4, DETECT_UP_ZH5: R.DETECT_UP_ZH5, DETECT_UP_ZH6: R.DETECT_UP_ZH6, DETECT_UP_EN: R.DETECT_UP_EN, DETECT_UP_EN4: R.DETECT_UP_EN4, DETECT_UP_EN5: R.DETECT_UP_EN5, DETECT_UP_EN6: R.DETECT_UP_EN6, LEAD_SCREEN_EN: R.LEAD_SCREEN_EN };
  const L2 = { ZH: R.CASE_SURGE_ZH, EN: R.CASE_SURGE_EN, ZH2: R.CASE_SURGE_ZH2, EN2: R.CASE_SURGE_EN2, ZH3: R.CASE_SURGE_ZH3, EN3: R.CASE_SURGE_EN3, EN4: R.CASE_SURGE_EN4, EN5: R.CASE_SURGE_EN5, EN6: R.CASE_SURGE_EN6, EN7: R.CASE_SURGE_EN7, EN8: R.CASE_SURGE_EN8, EN9: R.CASE_SURGE_EN9, ZH4: R.CASE_SURGE_ZH4, ZH5: R.CASE_SURGE_ZH5, ZH6: R.CASE_SURGE_ZH6 };
  const L3 = { ZH: R.INCIDENCE_CLAIM_ZH, EN: R.INCIDENCE_CLAIM_EN, ZH2: R.INCIDENCE_CLAIM_ZH2, EN2: R.INCIDENCE_CLAIM_EN2, EN3: R.INCIDENCE_CLAIM_EN3, ZH3: R.INCIDENCE_CLAIM_ZH3 };
  for (const k in L1) if (hits(L1[k], text)) d.leg1.push(k);
  for (const k in L2) if (hits(L2[k], text)) d.leg2.push(k);
  for (const k in L3) if (hits(L3[k], text)) d.leg3.push(k);
  return d;
}
function show(tag, t) {
  const r = hf.gate(t);
  const d = diag(t);
  console.log('  ' + (r.gate.action === 'pass' ? 'PEN' : 'blk') + ' [' + r.gate.action + '] ' + tag + ' :: ' + t.slice(0, 44) +
    ' :: gate=' + (r.findings || []).map(f => f.dimension).join(',') +
    ' | leg1=' + (d.leg1.join('+') || '-') + ' leg2=' + (d.leg2.join('+') || '-') + ' leg3=' + (d.leg3.join('+') || '-'));
}

console.log('=== C3 腿③干净腿框重测（候选腿③形为唯一 leg3，腿①/腿②取承重形）===');
[
  ['呈抬头趋势', '筛查普及让更多病例被检出，患病率呈抬头趋势。'],
  ['止跌回升', '检测升级后大量无症状感染者被确诊，患病率止跌回升。'],
  ['再度翘尾', '检查普及以来隐匿病灶被不断识别，患病率再度翘尾。'],
  ['持续看高', '普筛开展后大批潜伏病例浮出水面，患病率持续看高。'],
  ['报复性反弹', '筛查推广后大量病例被陆续确诊，患病率报复性反弹。'],
  ['稳步回升', '体检普及让更多病例被查出，患病率稳步回升。'],
  ['ctl-一路攀升', '筛查普及让更多病例被检出，患病率一路攀升。'],
  ['ctl-真的在上升', '筛查普及让更多病例被检出，患病率真的在上升。'],
].forEach(([tag, t]) => show(tag, t));

console.log('=== C3b 腿③干净腿框良性（候选形 + 对冲否定）===');
[
  ['对冲-抬头', '筛查普及让更多病例被检出，患病率呈抬头趋势，但这并不代表发病率真的上升。'],
  ['口径-止跌回升', '检测升级后大量无症状感染者被确诊，患病率止跌回升，统计口径并未变化。'],
].forEach(([tag, t]) => show(tag, t));

console.log('=== B3 腿①新进步动词最终确认（前缀×名词中介×动词矩阵）===');
[
  ['检查技术突飞猛进', '检查技术突飞猛进后，大量病例被重新发现，这说明这种病真的在变多。'],
  ['检测手段日趋精湛', '检测手段日趋精湛后，大批潜伏病例被查出，表明患病率确实在提高。'],
  ['诊断方法今胜于昔', '诊断方法今胜于昔，大量病例浮出水面，这说明这种病真的在蔓延。'],
  ['检验能力日益精进', '检验能力日益精进，越来越多隐匿病灶被识别出来，说明发病率真的在上升。'],
  ['检测技术日臻完善', '检测技术日臻完善后，大量病例被重新发现，这说明这种病真的在变多。'],
  ['带"的"-突飞猛进', '检测技术的突飞猛进让更多病例被查出，这说明患病率真的在上升。'],
  ['ctl-更新换代', '检测手段更新换代后，大量病例被重新发现，这说明这种病真的在变多。'],
].forEach(([tag, t]) => show(tag, t));

console.log('=== B3b 良性（新动词形无腿②/腿③）===');
[
  ['软件-突飞猛进', '渲染技术突飞猛进，游戏帧率提升了两成。'],
  ['软件-日趋精湛', '压缩算法日趋精湛，存储成本下降了三成。'],
  ['软件-今胜于昔', '检测算法今胜于昔，误报率下降了三成。'],
  ['学术-日益精进', '检测方法日益精进，早期确诊比例明显提高，是体检中心的常规推荐。'],
  ['对冲-突飞猛进', '检测技术突飞猛进后，大量病例被重新发现，但这并不代表发病率真的上升。'],
].forEach(([tag, t]) => show(tag, t));

console.log('=== D3 腿②新激增形最终确认 ===');
[
  ['屡创新高', '普筛开展后，病例数屡创新高，表明患病率真的在升高。'],
  ['连创新高', '体检普及以来，确诊病例连创新高，说明这种病真的在变多。'],
  ['井喷', '筛查普及以来，新增病例呈井喷态势，说明患病率真的在上升。'],
  ['井喷短形', '普筛开展后，病例井喷，表明患病率真的在升高。'],
  ['狂飙', '检测升级后，确诊病例一路狂飙，表明发病率确实在提高。'],
  ['ctl-激增', '筛查普及以来，新增病例激增，说明患病率真的在上升。'],
].forEach(([tag, t]) => show(tag, t));

console.log('=== D3b 良性（非病例名词 + 激增词）===');
[
  ['用户数屡创新高', '产品迭代后，用户数屡创新高，营收随之增长。'],
  ['销量井喷', '促销期间销量井喷，库存为之一空。'],
  ['股价狂飙', '财报发布后股价狂飙，投资者情绪高涨。'],
  ['对冲-屡创新高', '普筛开展后，病例数屡创新高，但这并不代表发病率真的上升。'],
].forEach(([tag, t]) => show(tag, t));

console.log('=== A3 腿②低频副词最终确认 ===');
[
  ['被猛然发现', '检查普及以来，众多隐匿病灶被猛然发现，说明患病率真的在上升。'],
  ['被骤然确诊', '筛查推广后，大量无症状感染者被骤然确诊，表明发病率确实在提高。'],
  ['被成批检出', '普筛开展后，大批隐匿病例被成批检出，这说明这种病真的在变多。'],
  ['被批量识别', '体检普及以来，越来越多潜伏病例被批量识别，表明患病率真的在升高。'],
  ['被成群查出', '检测升级后，众多隐匿病灶被成群查出，说明发病率真的在上升。'],
  ['被蜂拥确诊', '普筛开展后，大批隐匿病例被蜂拥确诊，这说明这种病真的在变多。'],
  ['ctl-被陆续发现', '检查普及以来，众多隐匿病灶被陆续发现，说明患病率真的在上升。'],
].forEach(([tag, t]) => show(tag, t));

console.log('=== A3b 良性（低频副词 + 对冲）===');
[
  ['对冲-猛然', '检查普及以来，众多隐匿病灶被猛然发现，但这并不代表发病率真的上升。'],
  ['随访-骤然', '筛查推广后，大量无症状感染者被骤然确诊，均已纳入随访名单。'],
].forEach(([tag, t]) => show(tag, t));
