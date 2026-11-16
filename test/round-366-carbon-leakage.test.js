'use strict';
// round-366：碳泄漏/污染避难所新子族（econ_reasoning_gate 聚合族第 23 子族）。
// r366 立项探针 coordination/agent4/probes/r366-probe-candidates.js（v6.8.188
// pristine 基线）：存量 econ 22 子族 + 258 维度对「产业/排放转移到外部 → 本地
// 或全球问题解决」攻击形 5/6 穿透（唯一非穿透条被既有维度代拦）、良性 3/3
// 零误伤。同池候选 lump_of_labor 2/6、paradox_of_thrift 3/5、price_control
// 3/4、mercantilism 3/4、is_ought 0/2——碳泄漏穿透最高且与 r364 Jevons 族
// 腿①零交集（效率提升 vs 空间转移）。海外扫描空返（GitHub 0 命中、arXiv
// parse-fail、S2 429 限流），按 Copeland & Taylor 贸易与环境文献既有形态自建。
// src/index.js 零改动、维度 258 不变、VERSION 不 bump。
const path = require('path');
const assert = require('assert');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const { detectCarbonLeakage, __internals } = require(path.join(ROOT, 'src', 'carbon-leakage.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js')).gate;
const { checkEconReasoningGate } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + ' — ' + e.message); }
}
function gateAction(t) { const r = gate(t); return r && r.gate && r.gate.action; }
function econFams(t) { const r = checkEconReasoningGate(t); return (r && r.hit) ? (r.families || []).map(f => f.key) : []; }

// ─── 攻击语料（产能转移 × 问题解决断言/外部化免责）────────────────
const ATTACK_ZH = [
  // 探针穿透原样 3 条
  '只要发达国家把碳排放大户转移到发展中国家，全球变暖就能得到控制。',
  '碳排放主要靠产业转移解决，转出去就等于降下来了。',
  '把高耗能企业迁到境外，碳排放指标就算完成了。',
  // 补充形 2 条
  '把钢铁产能都转移到海外之后，咱们这的空气就好起来了，环保账上已经达标。',
  '工厂都搬走了，污染问题就不关我们的事了。',
];
const ATTACK_EN = [
  // 探针穿透原样 3 条
  'We solved our carbon problem by moving the dirty factories overseas.',
  'Emissions only look low here because the heavy industry has shifted abroad.',
  'Our carbon footprint dropped as soon as we outsourced the steel mills abroad.',
  // 补充形 4 条
  'We shipped our dirtiest production overseas, so the pollution is no longer our problem.',
  'After the steel mills moved abroad, our local air quality improved, so the climate issue is handled.',
  'The factories are offshored now, so emissions are down and that is the end of it.',
  'Once the mines are relocated abroad, environmental problems are settled.',
];
// ─── 存量 jevons 攻击（划界回归：腿①效率提升形不得被本族误吞）──────
const REGRESSION_JEAVONS = [
  '只要把能效提上去，能源总需求自然就降下来了，不用担心总量问题。',
  'Improving fuel efficiency will necessarily reduce total gasoline consumption.',
];
// ─── 良性（零误伤；含概念教学/纠正句/中性转移陈述/疑问形）────────
// 注意：C4 原样「环保标准更严格倒逼高污染产能外迁…但这只是转移了污染」被
// monocausal_attribution（既有维度，severity 45）代拦——r366 实测确认属
// 既有基线行为（本族零命中），不属本族误伤，单独断言见 C4 条。
const BENIGN = [
  // 探针良性原样 3 条
  '产业转移可能带来碳泄漏问题，需要全球协同减排才能真正应对气候变化。',
  '发达国家将部分产能转移出去，全球碳排放总量未必下降。',
  'Carbon leakage occurs when strict climate rules in one region push emissions to looser jurisdictions.',
  // 补充良性
  '把污染产业迁到国外并不能真正解决全球环境问题。',
  '通过国际产业分工，发展中国家承接了制造业转移。',
  '企业为了靠近市场把工厂搬到了越南，这是正常的全球化布局。',
  'Outsourcing manufacturing to other countries is a normal business decision.',
  'Climate policy must address emissions globally, not just domestically.',
  '把工厂迁走真的能解决全球变暖吗？这需要审慎评估。',
  'The company offshored production to cut costs, a standard supply-chain move.',
  '各国应加强环保合作，避免污染避难所效应。',
  // 豁免承重样本（腿① + 腿②均在场，靠 CONCEPT/CORRECT 豁免不失配——
  //   D6a/D6b 负例注入的对象；其中 CORRECT 样本的「所以…就解决了」句式
  //   会被 monocausal_attribution 既有维度代拦，单独断言见 C12 条）
  '碳泄漏机制提醒我们：工厂迁到国外之后本地污染问题就解决了，这正是碳泄漏要警惕的幻觉。',
];
// CORRECT 豁免腿样本（单列：gate 层被 monocausal_attribution@45 既有基线
// 代拦——r366 实测确认非本族误伤，断言本族零命中 + 归因记录）
const BENIGN_CORRECT_LEG = '工厂都迁到国外了，本地空气质量改善了不少，所以污染问题就解决了——但这只是转移了污染，全球总量并未下降。';

console.log('### A 模块命中（碳泄漏攻击 12/12）');
ATTACK_ZH.concat(ATTACK_EN).forEach((t, i) =>
  check('A' + i + ' ' + t.slice(0, 18), () => { const r = detectCarbonLeakage(t); assert(r && r.hit, '模块未命中'); }));

console.log('### B 引擎闸归因 + gate action');
ATTACK_ZH.concat(ATTACK_EN).forEach((t, i) =>
  check('B' + i + ' gate 非 pass 且 carbon_leakage 承重 ' + t.slice(0, 16), () => {
    assert.notStrictEqual(gateAction(t), 'pass', 'gate 仍 pass');
    assert.ok(econFams(t).includes('carbon_leakage'), 'econ 归因缺 carbon_leakage: ' + econFams(t).join(','));
  }));

console.log('### C 良性零误伤（12/12）');
BENIGN.forEach((t, i) =>
  check('C' + i + ' ' + t.slice(0, 18), () => {
    const r = detectCarbonLeakage(t);
    assert(!(r && r.hit), '良性误命中本族');
    assert.strictEqual(gateAction(t), 'pass', '良性被 gate 拦: ' + gateAction(t));
  }));
check('C4 边界良性（外迁+只是转移了污染）本族零命中；gate verify 归因为 monocausal_attribution 既有基线', () => {
  const t = '环保标准更严格倒逼高污染产能外迁，本地空气改善了，但这只是转移了污染。';
  assert(!detectCarbonLeakage(t).hit, '本族误命中');
  const f = (gate(t).findings || []).map(x => x.dimension);
  assert.ok(!f.includes('carbon_leakage'), 'gate findings 出现 carbon_leakage');
  assert.ok(f.includes('monocausal_attribution'), '代拦维度不是 monocausal_attribution（基线变了）: ' + f.join(','));
});
check('C12 CORRECT 豁免腿样本（SOLVED_LOCAL_ZH 腿②在场 + 只是转移了污染）本族零命中；gate verify 归因为 monocausal_attribution 既有基线', () => {
  assert(!detectCarbonLeakage(BENIGN_CORRECT_LEG).hit, '本族误命中');
  const f = (gate(BENIGN_CORRECT_LEG).findings || []).map(x => x.dimension);
  assert.ok(!f.includes('carbon_leakage'), 'gate findings 出现 carbon_leakage');
  assert.ok(f.includes('monocausal_attribution'), '代拦维度不是 monocausal_attribution（基线变了）: ' + f.join(','));
});

console.log('### D 负例注入（删腿族常量 → 攻击翻红，证承重）');
check('D1 删 SHIFT_ZH 三组 → ZH 攻击全部翻红', () => {
  ATTACK_ZH.forEach(t => { assert(!detectCarbonLeakage(t, { SHIFT_VERB_ZH: [], SHIFT_NOUN_ZH: [], SHIFT_OUT_ZH: [] }).hit, '删 SHIFT_ZH 后仍命中: ' + t.slice(0, 18)); });
});
check('D2 删 SHIFT_EN 四组 → EN 攻击全部翻红', () => {
  ATTACK_EN.forEach(t => { assert(!detectCarbonLeakage(t, { SHIFT_ABROAD_EN: [], SHIFT_OUTSRC_EN: [], SHIFT_TOCOUNTRIES_EN: [], SHIFT_SHIP_EN: [] }).hit, '删 SHIFT_EN 后仍命中: ' + t.slice(0, 24)); });
});
check('D3 删 SOLVED_ZH 四组 → ZH 解决腿攻击全部翻红', () => {
  ATTACK_ZH.slice(0, 4).forEach(t => { assert(!detectCarbonLeakage(t, { SOLVED_ZH: [], SOLVED_SHIFT_ZH: [], SOLVED_BOOK_ZH: [], SOLVED_LOCAL_ZH: [] }).hit, '删 SOLVED_ZH 后仍命中: ' + t.slice(0, 18)); });
});
check('D4 删 SOLVED_EN 四组 → EN 解决腿攻击全部翻红', () => {
  [ATTACK_EN[0], ATTACK_EN[1], ATTACK_EN[2], ATTACK_EN[4], ATTACK_EN[6]].forEach(t => { assert(!detectCarbonLeakage(t, { SOLVED_PROBLEM_EN: [], SOLVED_CONTROL_EN: [], SOLVED_DROP_EN: [], SOLVED_NOLONGER_EN: [] }).hit, '删 SOLVED_EN 后仍命中: ' + t.slice(0, 24)); });
});
check('D5 删 NOTOURS 两组 → 免责腿攻击翻红', () => {
  assert(!detectCarbonLeakage(ATTACK_ZH[4], { NOTOURS_ZH: [], NOTOURS_SHIFT_ZH: [] }).hit, '删 NOTOURS_ZH 后仍命中');
  assert(!detectCarbonLeakage(ATTACK_EN[3], { NOTOURS_EN: [], NOTOURS_HANDS_EN: [], NOTOURS_EXPORT_EN: [] }).hit, '删 NOTOURS_EN 后仍命中');
});
check('D6a CORRECT 豁免永假正则注入 → CORRECT 腿样本必须翻红（证豁免承重）', () => {
  const never = /(?!x)x/;
  assert(detectCarbonLeakage(BENIGN_CORRECT_LEG, { CORRECT_ZH: never, CORRECT_EN: never }).hit, 'CORRECT_ZH 注入后腿样本未翻红');
});
check('D6b CONCEPT_ZH 豁免永假正则注入 → CONCEPT 腿样本必须翻红（证豁免承重）', () => {
  const never = /(?!x)x/;
  assert(detectCarbonLeakage(BENIGN[11], { CONCEPT_ZH: never, CONCEPT_EN: never }).hit, 'CONCEPT_ZH 注入后腿样本未翻红');
});
check('D6c 良性 0 单腿安全：腿① SHIFT_NOUN_ZH 在场，注翻四组豁免后仍不命中（无腿②，证判据结构承重）', () => {
  const never = /(?!x)x/;
  const t = BENIGN[0];
  const I = __internals();
  assert(I.SHIFT_NOUN_ZH.test(t), '良性 0 腿①不在场（样本失去单腿证明意义）');
  assert(!detectCarbonLeakage(t, { CONCEPT_ZH: never, CONCEPT_EN: never, CORRECT_ZH: never, CORRECT_EN: never }).hit, '注入豁免后良性 0 翻红（存在隐藏腿②）');
});

console.log('### E 存量划界回归（jevons 攻击仍归 jevons，本族不得代揽）');
REGRESSION_JEAVONS.forEach((t, i) =>
  check('E' + i + ' jevons 攻击仍非 pass ' + t.slice(0, 16), () => {
    assert.notStrictEqual(gateAction(t), 'pass', 'jevens 攻击变 pass');
    assert.ok(econFams(t).includes('jevons_paradox'), 'jevens 归因丢失');
    assert.ok(!econFams(t).includes('carbon_leakage'), 'jevens 攻击被本族代揽');
  }));

console.log('### F 内部常量导出');
check('F __internals 导出三组腿族常量非空', () => {
  const I = __internals();
  assert(Array.isArray(I.SHIFT_ZH) && I.SHIFT_ZH.length > 0, 'SHIFT_ZH 未导出');
  assert(Array.isArray(I.SHIFT_EN) && I.SHIFT_EN.length > 0, 'SHIFT_EN 未导出');
  assert(Array.isArray(I.SOLVED_ZH_ARR) && I.SOLVED_ZH_ARR.length > 0, 'SOLVED_ZH_ARR 未导出');
  assert(Array.isArray(I.SOLVED_EN_ARR) && I.SOLVED_EN_ARR.length > 0, 'SOLVED_EN_ARR 未导出');
  assert(Array.isArray(I.NOTOURS_ZH_ARR) && I.NOTOURS_ZH_ARR.length > 0, 'NOTOURS_ZH_ARR 未导出');
  assert(Array.isArray(I.NOTOURS_EN_ARR) && I.NOTOURS_EN_ARR.length > 0, 'NOTOURS_EN_ARR 未导出');
  assert(typeof I.findSignatures === 'function', 'findSignatures 未导出');
});

console.log('### G 登记');
check('G 登记：claims.jsonl 含 r366 认领（agent-4/dimension）', () => {
  const claims = fs.readFileSync(path.join(ROOT, 'coordination', 'claims.jsonl'), 'utf8');
  assert(claims.includes('"round":"r366"') && claims.includes('"agent":"agent-4"') && claims.includes('"kind":"dimension"'), 'claims.jsonl 缺 r366 认领');
});

console.log('\n测试结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
if (fail > 0) process.exit(1);
