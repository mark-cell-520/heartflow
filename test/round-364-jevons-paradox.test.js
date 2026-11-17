'use strict';
// round-364：Jevons 悖论/回弹效应新子族（econ_reasoning_gate 第 21 子族 /
// 插件层第 26 族）。r364 立项探针 coordination/agent4/probes/r364-probe-jevens.js：
// 存量 21 子族 + 257 维度对「效率提升 → 总量必降/资源问题自动解决/多用摊薄」
// 攻击形 5/11 穿透——absolute_claim 等只收必然/肯定绝对形，「自然就降下来了」
// 「节水全靠技术改进」等非绝对形零覆盖。新增 src/jevons-paradox.js（双腿：
// 效率提升 × 总量下降断言/多用摊薄合理化 + CONCEPT/CORRECT 两组豁免），
// 接入 src/econ-reasoning-gate.js 与 src/plugins/econ-reasoning-check/index.js
// 两张族表。src/index.js 零改动、维度 257 不变、VERSION 不 bump。
const path = require('path');
const assert = require('assert');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const { detectJevonsParadox, __internals } = require(path.join(ROOT, 'src', 'jevons-paradox.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js')).gate;
const { checkEconReasoningGate, FAMILIES: GATE_FAMS } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + ' — ' + e.message); }
}
function gateAction(t) { const r = gate(t); return r && r.gate && r.gate.action; }
function econFams(t) { const r = checkEconReasoningGate(t); return (r && r.hit) ? (r.families || []).map(f => f.key) : []; }

// ─── 攻击语料（效率提升 × 总量下降断言 / 多用摊薄合理化）────────────
const ATTACK_ZH = [
  '燃油效率提高了，每辆车油耗更低，所以总体燃油消耗必然会下降。',                 // 1 T1
  '只要把能效提上去，能源总需求自然就降下来了，不用担心总量问题。',             // 2 T1+T2+BARE
  '提升灌溉效率就能减少总用水量，节水全靠技术改进。',                           // 3 T3
  'LED灯比白炽灯省电，所以全面换灯之后总用电量一定下降。',                       // 4 T1
  '工厂能耗强度降了，全社会能源消耗总量肯定随之下降。',                         // 5 T1
  '因为机器效率提高了，单位成本降了，所以多用一些把省下的成本赚回来是明智的。',   // 6 UM-ZH
  '新设备更节能，不如把产能拉满，把效率红利吃回来。',                           // 7 UM-ZH
  '能效提高了，就可以放心放开用，总量会自己降下来。',                           // 8 T2
];
const ATTACK_EN = [
  'Improving fuel efficiency will necessarily reduce total gasoline consumption.', // 9 TE2
  'Once irrigation efficiency improves, total water use is bound to fall.',        // 10 TE1
  'Since the machine is more efficient, we should run it more to make back the savings.', // 11 UM-EN
  'Higher efficiency will automatically reduce overall energy consumption.',       // 12 TE2
  'Since electricity is now cheaper per unit, we might as well use as much as we want.', // 13 UM-EN
  'Efficiency gains mean total demand will take care of itself.',                  // 14 TE4
  'The machines are more efficient now, so run them longer to recoup the investment.', // 15 UM-EN
  'Switching to LED bulbs lowers electricity per lamp, so overall power consumption will certainly drop.', // 16 TE3
];
// ─── 良性（模块层零误伤；单位陈述/概念教学/纠正句/易混形）────────────
const BENIGN = [
  'LED灯的单灯功耗确实低于白炽灯，这是物理事实。',
  '回弹效应是指效率提升可能被使用量增加部分抵消的现象。',
  'Jevons 悖论提醒我们，技术进步不一定带来资源消耗总量的下降。',
  '能效改进通常降低单位成本，这是微观层面的标准结论。',
  '研究表明回弹效应的大小在不同行业差异很大。',
  '回弹效应的估算需要考虑直接效应和间接效应。',
  '效率很重要，但故障率没有变化。',
  '这款空调很省电，是今年的畅销型号。',
  '单位成本下降让公司在价格战中更有优势。',
  '因为效率提高，故障就减少了三成。',
  '灌溉效率提升了，每亩用水从500方降到400方。',
  '能效是能源政策的核心指标之一。',
  'The new engine uses less fuel per kilometer.',
  'The rebound effect may offset part of the efficiency gains.',
  'Jevons paradox warns that efficiency gains can raise total consumption.',
  'Efficiency improvements lower per-unit costs.',
  'The new protocol saves bandwidth on every request.',
  'Efficiency improvements lower per-unit costs across the board.',
  'Jevons paradox describes how efficiency gains can increase total use.',
  'Energy efficiency standards were tightened last year.',
];

console.log('### A 模块命中（攻击 16/16）');
ATTACK_ZH.concat(ATTACK_EN).forEach((t, i) =>
  check('A' + (i + 1) + ' ' + t.slice(0, 16), () => { const r = detectJevonsParadox(t); assert(r && r.hit, '模块未命中'); }));

console.log('### B 引擎闸归因 + gate action（攻击全部非 pass）');
ATTACK_ZH.concat(ATTACK_EN).forEach((t, i) => check('B' + (i + 1) + ' econ=jevons_paradox & gate≠pass', () => {
  assert(econFams(t).includes('jevons_paradox'), 'econ 未归因本族: ' + JSON.stringify(econFams(t)));
  assert(gateAction(t) !== 'pass', 'gate 未拦: ' + gateAction(t));
}));

console.log('### C 良性零误伤（20/20 模块层不命中）');
BENIGN.forEach((t, i) => check('C' + (i + 1) + ' ' + t.slice(0, 16), () => {
  const r = detectJevonsParadox(t);
  assert(!(r && r.hit), '良性误命中本族');
}));

console.log('### D 负例注入（删新常量 → 对应攻击翻红，证承重）');
check('D1 删 TOTALDOWN_ZH → 攻击 1/4/5 翻红', () => {
  [ATTACK_ZH[0], ATTACK_ZH[3], ATTACK_ZH[4]].forEach(t =>
    assert(!detectJevonsParadox(t, { TOTALDOWN_ZH: [] }).hit, '删 TOTALDOWN_ZH 后仍命中: ' + t.slice(0, 18)));
});
check('D2 删 TOTALDOWN_RELIEVE_ZH → 攻击 8 翻红', () => {
  assert(!detectJevonsParadox(ATTACK_ZH[7], { TOTALDOWN_RELIEVE_ZH: [] }).hit, '删 RELIEVE_ZH 后仍命中（攻击 2 另有 T1 承重，故只锁攻击 8）');
});
check('D3 删 TOTALDOWN_FOLLOW_ZH → 攻击 3 翻红', () => {
  assert(!detectJevonsParadox(ATTACK_ZH[2], { TOTALDOWN_FOLLOW_ZH: [] }).hit, '删 FOLLOW_ZH 后仍命中');
});
check('D4 删 USEMORE_MAKEBACK_ZH → 攻击 6/7 翻红', () => {
  [ATTACK_ZH[5], ATTACK_ZH[6]].forEach(t =>
    assert(!detectJevonsParadox(t, { USEMORE_MAKEBACK_ZH: [] }).hit, '删 MAKEBACK_ZH 后仍命中: ' + t.slice(0, 18)));
});
check('D5 删 EFF_BARE_ZH → 攻击 2 翻红（腿①仅裸能效形）', () => {
  assert(!detectJevonsParadox(ATTACK_ZH[1], { EFF_BARE_ZH: [] }).hit, '删 EFF_BARE_ZH 后仍命中');
});
check('D6 删 TOTALDOWN_REDUCE_EN → 攻击 9/12 翻红', () => {
  [ATTACK_EN[0], ATTACK_EN[3]].forEach(t =>
    assert(!detectJevonsParadox(t, { TOTALDOWN_REDUCE_EN: [] }).hit, '删 REDUCE_EN 后仍命中: ' + t.slice(0, 24)));
});
check('D7 删 TOTALDOWN_WILL_EN → 攻击 10 翻红', () => {
  assert(!detectJevonsParadox(ATTACK_EN[1], { TOTALDOWN_WILL_EN: [] }).hit, '删 WILL_EN 后仍命中');
});
check('D8 删 USEMORE_MAKEBACK_EN → 攻击 11/15 翻红', () => {
  [ATTACK_EN[2], ATTACK_EN[6]].forEach(t =>
    assert(!detectJevonsParadox(t, { USEMORE_MAKEBACK_EN: [] }).hit, '删 MAKEBACK_EN 后仍命中: ' + t.slice(0, 24)));
});
check('D9 删 USEMORE_CHEAPER_EN → 攻击 13 翻红', () => {
  assert(!detectJevonsParadox(ATTACK_EN[4], { USEMORE_CHEAPER_EN: [] }).hit, '删 CHEAPER_EN 后仍命中');
});
check('D10 删 TOTALDOWN_RELIEVE_EN → 攻击 14 翻红', () => {
  assert(!detectJevonsParadox(ATTACK_EN[5], { TOTALDOWN_RELIEVE_EN: [] }).hit, '删 RELIEVE_EN 后仍命中');
});
check('D11 删 TOTALDOWN_OVERALL_EN → 攻击 16 翻红', () => {
  assert(!detectJevonsParadox(ATTACK_EN[7], { TOTALDOWN_OVERALL_EN: [] }).hit, '删 OVERALL_EN 后仍命中');
});
// 永假正则：豁免常量注入口（注入后该豁免不再生效）
const NEVER = /(?!x)x/;
check('D12 删 CONCEPT_ZH → 概念教学句翻红（证概念豁免承重）', () => {
  const t = '回弹效应存在时，能效提高并不意味着总用电量必然下降。';
  assert(!detectJevonsParadox(t).hit, '原句应被 CONCEPT_ZH 豁免');
  assert(detectJevonsParadox(t, { CONCEPT_ZH: NEVER }).hit, '删 CONCEPT_ZH 后教学句未翻红（豁免不承重）');
});
check('D13 删 CORRECT_ZH → 纠正句翻红（证纠正豁免承重）', () => {
  const t = '节能不能只靠技术，总量控制仍然必要，能效提高才能减少总排放。';
  assert(!detectJevonsParadox(t).hit, '原句应被 CORRECT_ZH 豁免');
  assert(detectJevonsParadox(t, { CORRECT_ZH: NEVER }).hit, '删 CORRECT_ZH 后纠正句未翻红（豁免不承重）');
});

console.log('### E 存量回归 + 存量族不受本轮影响');
check('E1 存量族攻击仍命中（will_rogers / tragedy_of_commons）', () => {
  const wr = detectJevonsParadox('按新标准重新分组后，两组的平均生存期都上升了，但没有一个病人多活一天。');
  assert(!(wr && wr.hit), 'Will Rogers 攻击句被本族误命中');
  assert(econFams('按新标准重新分组后，两组的平均生存期都上升了，但没有一个病人多活一天。').includes('will_rogers_phenomenon'), '存量 Will Rogers 族失配');
  assert(econFams('这片草场是公共的，每家多养几只羊自己就多挣一份，退化大家一起承担。').includes('tragedy_of_commons'), '存量 tragedy 族失配');
});
check('E2 两张族表均含 jevons_paradox 且计数 +1', () => {
  assert(GATE_FAMS.some(f => f.key === 'jevons_paradox' && f.round === 'r364'), 'gate 桥族表缺 jevons_paradox');
  assert(plugin.FAMILIES.some(f => f.key === 'jevons_paradox' && f.round === 'r364'), '插件族表缺 jevons_paradox');
  // r366 扩族义务：carbon_leakage 入表后 gate 桥 21→22、插件 26→27
  assert(GATE_FAMS.some(f => f.key === 'carbon_leakage' && f.round === 'r366'), 'gate 桥族表缺 carbon_leakage（r366 扩族漏登记）');
  assert(plugin.FAMILIES.some(f => f.key === 'carbon_leakage' && f.round === 'r366'), '插件族表缺 carbon_leakage（r366 扩族漏登记）');
  // r367 扩族义务：price_control 入表后 gate 桥 22→23、插件 27→28
  assert(GATE_FAMS.some(f => f.key === 'price_control' && f.round === 'r367'), 'gate 桥族表缺 price_control（r367 扩族漏登记）');
  assert(plugin.FAMILIES.some(f => f.key === 'price_control' && f.round === 'r367'), '插件族表缺 price_control（r367 扩族漏登记）');
  // r368 扩族义务：mercantilism 入表后 gate 桥 23→24、插件 28→29
  assert(GATE_FAMS.some(f => f.key === 'mercantilism' && f.round === 'r368'), 'gate 桥族表缺 mercantilism（r368 扩族漏登记）');
  assert(plugin.FAMILIES.some(f => f.key === 'mercantilism' && f.round === 'r368'), '插件族表缺 mercantilism（r368 扩族漏登记）');
  // r369/r371 扩族义务：paradox_of_thrift（r369）/ decoy_effect（r371）入表后 gate 桥 24→25→26、插件 29→30→31
  assert(GATE_FAMS.some(f => f.key === 'paradox_of_thrift' && f.round === 'r369'), 'gate 桥族表缺 paradox_of_thrift（r369 扩族漏登记）');
  assert(GATE_FAMS.some(f => f.key === 'decoy_effect' && f.round === 'r371'), 'gate 桥族表缺 decoy_effect（r371 扩族漏登记）');
  assert(plugin.FAMILIES.some(f => f.key === 'paradox_of_thrift' && f.round === 'r369'), '插件族表缺 paradox_of_thrift（r369 扩族漏登记）');
  assert(plugin.FAMILIES.some(f => f.key === 'decoy_effect' && f.round === 'r371'), '插件族表缺 decoy_effect（r371 扩族漏登记）');
  assert.strictEqual(GATE_FAMS.length, 27, 'gate 桥族表计数应为 27，实为 ' + GATE_FAMS.length);
  assert.strictEqual(plugin.FAMILIES.length, 32, '插件族表计数应为 32，实为 ' + plugin.FAMILIES.length);
});
check('E3 插件 analyze(jevons_paradox) 只跑本族可用', () => {
  const r = plugin.analyze('只要把能效提上去，能源总需求自然就降下来了，不用担心总量问题。', { only: 'jevons_paradox' });
  assert(r && r.totalHits > 0 && r.families.length === 1 && r.families[0].key === 'jevons_paradox', 'only=jevons_paradox 路由异常');
});

console.log('### F 内部常量导出');
check('F __internals 导出全部新常量非空', () => {
  const I = __internals();
  const names = ['EFF_NOUN_ZH', 'EFF_NOUN_REV_ZH', 'EFF_COMP_ZH', 'EFF_BARE_ZH',
    'EFF_KW_EN', 'EFF_IMPROVE_EN', 'EFF_MORE_EN', 'EFF_INTENSITY_EN', 'EFF_LESSPER_EN',
    'TOTALDOWN_ZH', 'TOTALDOWN_RELIEVE_ZH', 'TOTALDOWN_FOLLOW_ZH',
    'TOTALDOWN_WILL_EN', 'TOTALDOWN_REDUCE_EN', 'TOTALDOWN_OVERALL_EN', 'TOTALDOWN_RELIEVE_EN', 'TOTALDOWN_AUTO_EN',
    'USEMORE_MAKEBACK_ZH', 'USEMORE_RATIONALE_ZH', 'USEMORE_DIVIDEND_ZH',
    'USEMORE_MAKEBACK_EN', 'USEMORE_MIGHT_EN', 'USEMORE_CHEAPER_EN', 'USEMORE_FREELY_EN',
    'CONCEPT_ZH', 'CONCEPT_EN', 'CORRECT_ZH', 'CORRECT_EN'];
  names.forEach(n => assert(I[n], n + ' 未导出'));
});

console.log('### G 登记');
check('G 登记：claims.jsonl 含 r364 认领（agent-4/dimension）', () => {
  const claims = fs.readFileSync(path.join(ROOT, 'coordination', 'claims.jsonl'), 'utf8');
  assert(claims.includes('"round":"r364"') && claims.includes('"agent":"agent-4"') && claims.includes('"kind":"dimension"'), 'claims.jsonl 缺 r364 认领');
});

console.log('\n测试结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
if (fail > 0) process.exit(1);
