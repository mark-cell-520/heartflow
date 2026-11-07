/**
 * r249-negation-inject.js — 计数-比率混淆负例注入验证
 * 方法：以 inject 参数逐条删除/替换模块的每一组常量，断言「守卫必须
 * 变红」——攻击族不再命中（判据承重）或豁免句转为命中（豁免承重）。
 * 全部注入点必须按预期变红；任何未变红即说明该组判据不承重。
 * 最后一行做清理：确认未注入时模块恢复全绿。
 */
'use strict';
const M = require('/data/home/heartflow/src/count-rate-conflation.js');
const detect = M.detectCountRateConflation;
const I = M.__internals();

const NEVER = /(?!)/;

// 攻击族（与测试文件同源，取子集用于注入）
const A_ZH = [
  '我们市癌症病例全国第一，所以这里最不安全',
  '邻省传染病病例是我们的三倍，他们防疫做得更差',
  '本省交通事故起数比邻省多四成，司机开车更野',
  '这家医院死在手术台上的人最多，说明他们技术最差',
  '投诉量全网第一，这家店服务肯定最糟',
  '我校竞赛获奖数是邻校的两倍，所以我们的教育更强',
  '他们厂工伤人数比去年多了一倍，说明车间更危险了',
  '本店差评量是同行的三倍，我们的产品明显更差',
  '该市感染人数居首，可见这里医疗水平最差',
  '这个系挂科人数全校第一，老师教得最烂',
];
const A_EN = [
  'Our city has the most cancer cases in the country, so it is the most dangerous place',
  'This city reported twice the cases, so its containment is clearly worse',
  'The province logged 40% more crashes, so its drivers are more reckless',
  'Their plant recorded double the injuries, so the workshop is more dangerous',
  'Our department has the most failures in the school, so the teaching is the worst',
  'This airline had the most incidents, so it is the least safe',
];

// 豁免句（带真实签名）
const EX_CORRECTIVE_ZH = '我们市癌症病例全国第一，所以这里看起来最不安全——但按人口算发病率只排第十二，是人口大市。';
const EX_CORRECTIVE_EN = 'Their city reported twice the cases, so containment looks worse — yet per capita the rate is lower than ours.';
const EX_CONCEPT_ZH = '统计学课上讲过计数与比率：我们市癌症病例全国第一，所以这里最不安全——这就是把原始计数当比率的典型错误。';
const EX_CONCEPT_EN = 'The lecture on raw counts: our city has the most cases, so it is the most dangerous place — counts are not comparable until normalised.';

// 超距句（窗承重证明）
const FAR_QTY_ZH = '我们市癌症病例在过去十二个月里持续攀升，最终汇总出来的总量排名全国第一，所以这里最不安全';
const FAR_PAIR2_ZH = '我们市癌症病例全国第一，随后市政府组织开展了为期数周的专项复核工作，逐家医院核对原始登记台账，交叉比对了历年的统计报表并走访了大量社区，动员了上百名工作人员参与数据清洗与校验，经过多轮复核确认数据无误，所以这里最不安全。';

let total = 0, red = 0, notRed = [];
function inject(name, patch, texts, expect) {
  // expect: 'miss' = 注入后攻击必须不再命中；'hit' = 注入后豁免句必须转为命中
  total++;
  const results = texts.map(t => {
    const r = detect(t, patch);
    return expect === 'miss' ? r.hit === false : r.hit === true;
  });
  const ok = results.every(Boolean);
  if (ok) { red++; console.log(`  ✓ [${name}] ${texts.length} 条按预期变红`); }
  else {
    notRed.push(name);
    console.log(`  ✗ [${name}] 未按预期变红（${results.filter(Boolean).length}/${texts.length}）`);
    texts.forEach((t, i) => { if (!results[i]) console.log(`      失配: ${t.slice(0, 50)}`); });
  }
}

console.log('r249 计数-比率混淆 负例注入验证:\n');

console.log('— 腿① 计数名词族 —');
inject('COUNT_ZH 整族删除', { COUNT_ZH: [] }, A_ZH, 'miss');
inject('COUNT_EN 整族删除', { COUNT_EN: [] }, A_EN, 'miss');
inject('COUNT_ZH 疾病/公卫子族删除', { COUNT_ZH: I.COUNT_ZH.slice(2) }, [
  '我们市癌症病例全国第一，所以这里最不安全',
  '邻省传染病病例是我们的三倍，他们防疫做得更差',
  '该市感染人数居首，可见这里医疗水平最差',
], 'miss');
inject('COUNT_ZH 工伤/伤害子族删除（含「死」族）', { COUNT_ZH: I.COUNT_ZH.slice(0, 2).concat(I.COUNT_ZH.slice(5)) }, [
  '他们厂工伤人数比去年多了一倍，说明车间更危险了',
  '这家医院死在手术台上的人最多，说明他们技术最差',
], 'miss');
inject('COUNT_EN injuries 子族删除', { COUNT_EN: I.COUNT_EN.filter((_, i) => i !== 2) }, [
  'Their plant recorded double the injuries, so the workshop is more dangerous',
], 'miss');

console.log('\n— 腿① 比较量级族 —');
inject('QTY_ZH 整族删除', { QTY_ZH: [] }, A_ZH, 'miss');
inject('QTY_EN 整族删除', { QTY_EN: [] }, A_EN, 'miss');
inject('QTY_ZH 最高级/首位子族删除', { QTY_ZH: I.QTY_ZH.slice(1) }, [
  '我们市癌症病例全国第一，所以这里最不安全',
  '投诉量全网第一，这家店服务肯定最糟',
  '该市感染人数居首，可见这里医疗水平最差',
], 'miss');
inject('QTY_ZH 倍率子族删除（「三倍/两倍」「是的X倍」「高于/于是…」三组同删）', { QTY_ZH: I.QTY_ZH.filter((_, i) => i !== 1 && i !== 2 && i !== 4) }, [
  '邻省传染病病例是我们的三倍，他们防疫做得更差',
  '我校竞赛获奖数是邻校的两倍，所以我们的教育更强',
], 'miss');
inject('QTY_EN 最高级子族删除', { QTY_EN: I.QTY_EN.slice(1) }, [
  'Our city has the most cancer cases in the country, so it is the most dangerous place',
  'Our department has the most failures in the school, so the teaching is the worst',
], 'miss');
inject('QTY_EN 倍率子族删除', { QTY_EN: I.QTY_EN.slice(0, 1).concat(I.QTY_EN.slice(2)) }, [
  'This city reported twice the cases, so its containment is clearly worse',
], 'miss');

console.log('\n— 腿② 未归一化裁定族 —');
inject('VERDICT_ZH 整族删除', { VERDICT_ZH: [] }, A_ZH, 'miss');
inject('VERDICT_EN 整族删除', { VERDICT_EN: [] }, A_EN, 'miss');
inject('VERDICT_ZH 安全性子族删除', { VERDICT_ZH: I.VERDICT_ZH.slice(1) }, [
  '我们市癌症病例全国第一，所以这里最不安全',
  '他们厂工伤人数比去年多了一倍，说明车间更危险了',
], 'miss');
inject('VERDICT_ZH 质量/水平裁定子族删除（更差/最差/最烂/更糟/更强…）', { VERDICT_ZH: I.VERDICT_ZH.filter((_, i) => i !== 1) }, [
  '投诉量全网第一，这家店服务肯定最糟',
  '该市感染人数居首，可见这里医疗水平最差',
  '这个系挂科人数全校第一，老师教得最烂',
], 'miss');
inject('VERDICT_ZH 治理/服务行业子族删除（防疫/教育/服务/味道）', { VERDICT_ZH: I.VERDICT_ZH.filter((_, i) => i !== 3) }, [
  '该市感染人数居首，可见这里教育做得最强',
  '我校竞赛获奖数是邻校的两倍，所以我们的教育最强',
], 'miss');
inject('VERDICT_ZH 人的能力/风格子族删除', { VERDICT_ZH: I.VERDICT_ZH.slice(0, 5).concat(I.VERDICT_ZH.slice(6)) }, [
  '本省交通事故起数比邻省多四成，司机开车更野',
], 'miss');
inject('VERDICT_EN 安全性子族删除', { VERDICT_EN: I.VERDICT_EN.slice(1) }, [
  'Our city has the most cancer cases in the country, so it is the most dangerous place',
  'This airline had the most incidents, so it is the least safe',
], 'miss');
inject('VERDICT_EN 质量/水平裁定子族删除（worse/better/stronger…）', { VERDICT_EN: I.VERDICT_EN.filter((_, i) => i !== 1) }, [
  'This city reported twice the cases, so its containment is clearly worse',
], 'miss');

console.log('\n— 距离窗 —');
inject('PAIR_ZH 默认窗 14 下超距句不命中（放大到 500 转命中）', { PAIR_ZH: 500 }, [FAR_QTY_ZH], 'hit');
inject('PAIR2_ZH 默认窗 40 下超距句不命中（放大到 500 转命中）', { PAIR2_ZH: 500 }, [FAR_PAIR2_ZH], 'hit');
inject('PAIR2_ZH 收紧到 0 后全部攻击不再命中', { PAIR2_ZH: 0 }, A_ZH, 'miss');
inject('PAIR2_EN 收紧到 0 后全部攻击不再命中', { PAIR2_EN: 0 }, A_EN, 'miss');

console.log('\n— 豁免族 —');
inject('CORRECTIVE_ZH 删除后口径意识句转命中', { CORRECTIVE_ZH: NEVER }, [EX_CORRECTIVE_ZH], 'hit');
inject('CORRECTIVE_EN 删除后口径意识句转命中', { CORRECTIVE_EN: NEVER }, [EX_CORRECTIVE_EN], 'hit');
inject('CONCEPT_ZH+CORRECTIVE_ZH 删除后概念教学句转命中', { CONCEPT_ZH: NEVER, CORRECTIVE_ZH: NEVER }, [EX_CONCEPT_ZH], 'hit');
inject('CONCEPT_EN+CORRECTIVE_EN 删除后概念教学句转命中', { CONCEPT_EN: NEVER, CORRECTIVE_EN: NEVER }, [EX_CONCEPT_EN], 'hit');

console.log('\n— 方向约束（行为证明，非常量注入）—');
{
  total++;
  const rev = detect('这里明显更差，因为我们市癌症病例全国第一。', {});
  const fwd = detect('我们市癌症病例全国第一，所以这里明显更差', {});
  if (rev.hit === false && fwd.hit === true) { red++; console.log('  ✓ [方向约束] 反置不命中、正置命中——约束承重'); }
  else { notRed.push('方向约束'); console.log(`  ✗ [方向约束] 反置 hit=${rev.hit} 正置 hit=${fwd.hit}`); }
}

console.log(`\n==== 负例注入汇总：注入 ${total} 个点 → ${red} 个按预期变红，${notRed.length} 个未按预期 ====`);
if (notRed.length) console.log('未按预期: ' + notRed.join(' | '));

// 清理：确认未注入时模块恢复全绿（攻击全命中、豁免全不命中）
const pristine =
  A_ZH.concat(A_EN).every(t => detect(t, null).hit === true) &&
  [EX_CORRECTIVE_ZH, EX_CORRECTIVE_EN, EX_CONCEPT_ZH, EX_CONCEPT_EN].every(t => detect(t, null).hit === false);
console.log(`清理校验：未注入时模块恢复预期（攻击全命中 + 豁免全不命中）= ${pristine}`);
if (!pristine || notRed.length) process.exit(1);
