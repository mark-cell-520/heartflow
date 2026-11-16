'use strict';
// r356 pre-test behavior check: 代拦句承重 + 边界句模块级行为
const hf = require('/data/home/heartflow/src/gate.js');
const itb = require('/data/home/heartflow/src/immortal-time-bias.js');
const hitI = (t, inj) => itb.checkImmortalTimeBias(t, inj).hit === true;

console.log('--- 代拦句 gate 承重核对（3 条）---');
for (const t of [
  '检查普及以来，众多隐匿病灶被不断识别，说明患病率真的在上升。',
  '检查普及以来，众多隐匿病灶被陆续确诊，说明患病率真的在上升。',
  '检查普及以来，众多隐匿病灶被大量确诊，说明患病率真的在上升。',
  '检查普及让更多病例被及时发现，这说明患病率真的在上升。',
]) {
  const r = hf.gate(t);
  const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
  console.log((r.gate.action !== 'pass' && f ? 'OK ' : 'FAIL') + ' [' + r.gate.action + '] itb=' + f ? '' : '');
  console.log('   action=' + r.gate.action + ' itb承重=' + !!f + ' mod=' + hitI(t) + ' :: ' + t.slice(0, 30));
}

console.log('--- 边界句模块级核对 ---');
const bounds = [
  // 缺腿①（浮现句无检出域词）
  ['大量潜伏病例浮现出来，这说明患病率真的在上升。', false],
  // 缺腿②（更新换代腿① + 腿③，无病例激增）
  ['检测升级后，检验科通过了iso认证，说明患病率真的在上升。', false],
  // 缺腿③（浮现句无发生率结论）
  ['检查普及让大量潜伏病例浮现出来。', false],
  // p2 名词中介严格性：检测流程更新 不匹配腿①
  ['检测流程更新让更多病例被重新发现，这说明患病率真的在上升。', false],
  // 疑问形
  ['检查普及让大量潜伏病例浮现出来——这说明患病率真的在上升吗？', false],
  // ZH6 副词必填：直缀形由 ZH3 承重，ZH6 置空不影响
  ['检查普及以来，众多隐匿病灶被重新发现，说明患病率真的在上升。', true],
  // ZH5 不 rescue ZH2 后置形
  ['随着检测普及，大量潜伏病例浮出水面，这说明这种病真的在变多。', true],
  // ZH3(leg3) 不收走高：走高由 legacy p1 承重
  ['检查普及让更多病例被重新发现，患病率节节走高。', true],
];
for (const [t, want] of bounds) {
  const got = hitI(t);
  console.log((got === want ? 'OK ' : 'FAIL') + ' want=' + want + ' got=' + got + ' :: ' + t.slice(0, 30));
}

console.log('--- 族隔离反向探针前置核对（删旧常量后须翻转）---');
const probes = [
  ['检查普及让大量潜伏病例浮出水面，这说明患病率真的在上升。', 'CASE_SURGE_ZH2'],
  ['检查普及让大量潜伏病例暴露出来，这说明患病率真的在上升。', 'CASE_SURGE_ZH2'],
  ['检查普及以来，众多隐匿病灶被重新发现，说明患病率真的在上升。', 'CASE_SURGE_ZH3'],
  ['检查普及以来，众多隐匿病灶被识别，说明患病率真的在上升。', 'CASE_SURGE_ZH3'],
  ['随着检测普及，浮出大量潜伏病例，这说明这种病真的在变多。', 'CASE_SURGE_ZH4'],
  ['筛查推广后，浮现出许多无症状感染者，表明患病率确实在升高。', 'CASE_SURGE_ZH4'],
  ['检测手段的进步让更多病例被查出，这说明患病率真的在上升。', 'DETECT_UP_ZH'],
  ['检查的普及让更多病例被查出，这说明患病率真的在上升。', 'DETECT_UP_ZH'],
  ['更先进的检测手段让更多病例被查出，这说明患病率真的在上升。', 'DETECT_UP_ZH5'],
  ['检测力度的加强让更多病例被查出，这说明患病率真的在上升。', 'DETECT_UP_ZH4'],
  ['检查普及让更多病例被重新发现，患病率真的在上升，这种病真的在变多。', 'INCIDENCE_CLAIM_ZH'],
  ['检查普及让更多病例被重新发现，患病率一路攀升，这种病真的在变多。', 'INCIDENCE_CLAIM_ZH2'],
];
for (const [t, key] of probes) {
  const inj = {}; inj[key] = [];
  const before = hitI(t);
  const after = hitI(t, inj);
  console.log((before === true && after === false ? 'OK ' : 'FAIL') + ' ' + key + ' before=' + before + ' after=' + after + ' :: ' + t.slice(0, 26));
}
