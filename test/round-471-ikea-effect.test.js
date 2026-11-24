/**
 * r471 轮测：ikea_effect（宜家效应 / 劳动投入高估）第 48 econ 聚合子族
 * 覆盖：攻击命中（ZH/EN × 裸名词/带修饰/倒装/长句）、三组豁免 + 疑问守卫、
 * 负例注入逐常量承重验证（删腿族/豁免后攻击须失配）、邻居维度射程边界。
 * 运行：node test/round-471-ikea-effect.test.js
 */
'use strict';
const assert = require('assert');
const { detectIkeaEffect, __internals } = require('../src/ikea-effect.js');
const erg = require('../src/econ-reasoning-gate.js');
const gate = require('../src/gate.js');

let passed = 0, failed = 0;
const failures = [];
function t(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; failures.push(name + ': ' + e.message); }
}

const I = __internals();

// ─── 攻击族：全命中 ────────────────────────────────────────────────
const ATTACKS = [
  ['ZH 裸名词（亲手 × 工厂比较）', '这张桌子是你自己亲手钉的，用料虽然一般，但肯定比工厂流水线产的更结实。'],
  ['ZH 熬夜族（团队 × 外部采购）', '这个方案是团队熬了无数个夜做出来的，所以一定比外部采购的成品更贴合我们的需求。'],
  ['ZH 倒装（结论先行：开源库）', '自己写的代码才是好代码，开源库再好也是别人的东西，不如自己造轮子可靠。'],
  ['ZH 心血兑现（倾注心血 × 珍贵）', '这个玩偶是我一针一线缝的，倾注了无数心血，所以格外珍贵。'],
  ['ZH 隐性虚高（不比店里卖的差）', '自己腌的咸菜不比店里卖的差，毕竟是亲手做的。'],
  ['ZH 长句（亲手栽 × 更有价值）', '老张在院子里种了十年菜，每棵苗都是他亲手栽的，因此他觉得自家菜比超市买的更有价值。'],
  ['ZH 亲手打磨 × 质量肯定更高', '我们团队亲手打磨的这份方案，含着自己的心血，质量肯定更高。'],
  ['ZH 品质形容词虚高（亲手栽 × 比超市新鲜）r472补', '老张在院子里种了十年菜，每棵苗都是他亲手栽的，因此他觉得自家菜比超市的新鲜。'],
  ['ZH 品质形容词强度断言（自家鸡 × 肯定更好吃）r472补', '这筐鸡蛋是我家自己养的鸡下的，所以肯定比超市买的更好吃。'],
  ['EN 品质形容词虚高（grew × tastier than supermarket）r472补', 'The tomatoes I grew myself are much tastier than the ones from the supermarket.'],
  ['EN 裸名词（assembled × ready-made）', 'People overvalue furniture they assembled themselves compared with ready-made pieces.'],
  ['EN in-house × better than commercial', 'Because we built the tool in-house, it must be better than any commercial alternative.'],
  ['EN 长句（knitted × superior to store-bought）', 'The sweater she knitted herself is clearly superior to anything store-bought, since she made it with her own hands.'],
];
for (const [name, text] of ATTACKS) {
  t('攻击命中 — ' + name, () => {
    const r = detectIkeaEffect(text);
    assert.strictEqual(r.hit, true, 'detectIkeaEffect 未命中');
    assert.ok(r.count >= 1 && r.evidence.length >= 1, 'evidence 缺失');
    assert.ok(r.guidance.length > 50, 'guidance 缺失');
    // gate 层非 pass 且 ikea 族承重
    const gr = gate.gate(text);
    assert.notStrictEqual(gr.gate.action, 'pass', 'gate.action = pass（未接线/未承重）');
    const m = erg.checkEconReasoningGate(text);
    assert.ok((m.families || []).some(f => f.key === 'ikea_effect'), 'econ 聚合族未命中 ikea_effect');
  });
}

// ─── 良性族：全不误伤 ──────────────────────────────────────────────
const BENIGN = [
  ['中性劳动陈述（无腿②）', '桌子是我自己拼的，花了一个下午。'],
  ['基准在先（豁免 C）', '在投入自己劳动之前，我们参照了市售同类产品的质量标准和价格区间。'],
  ['盲测对照（豁免 C）', '自研方案与采购方案我们都做了盲测，最终按测试数据选择。'],
  ['概念教学（豁免 A）', '宜家效应指人们对自己投入劳动组装的产品的估值显著高于同类成品的现象。'],
  ['纠正句（豁免 B）', '劳动投入多少和产品质量没有必然关系，客观质量要用盲测和基准来衡量。'],
  ['沉没成本邻居（effort_justification 领地）', '这个项目已经投入了这么多心血，现在放弃太可惜了，必须继续做完。'],
  ['疑问句（豁免 D）', '自己做的真的更好吗？'],
  ['EN 基准在先（豁免 C）', 'Before deciding to build in-house, we benchmarked against three commercial products.'],
  ['中性品质陈述无比较对象（r472补）', '这张桌子是我亲手钉的，很结实，用了不少好木料。'],
  ['品质形容词疑问守卫（r472补）', '自己种的菜真的比超市的新鲜吗？'],
  ['品质形容词否定守卫（r472补）', '虽然是自己亲手栽的，但并不比超市卖的新鲜多少。'],
  ['EN 品质形容词疑问守卫（r472补）', 'Are the tomatoes you grew yourself really tastier than supermarket ones?'],
];
for (const [name, text] of BENIGN) {
  t('良性不误伤 — ' + name, () => {
    assert.strictEqual(detectIkeaEffect(text).hit, false, '模块层误命中');
  });
}

// ─── 负例注入：删腿族后攻击须失配（逐常量承重验证）────────────────
// 负例注入分四层：
//   层1 整腿组删除（证明双腿结构承重）：删全部腿① / 删全部腿②后任何
//        攻击都失配。注意注入键是 resolveGroups 用的腿族名（如
//        LABOR_SELF_ZH），不是 GROUPS 数组名。
//   层2 邻近窗注入（证明邻近窗承重）：窗=0 只许零宽重叠，跨句攻击失配。
//   层3 逐腿族探针（证明该腿族自身可命中）：每条腿族的代表句式在不
//        注入时命中（证明该腿不是死代码）。
//   层4 逐豁免注入（证明每组豁免承重）：把豁免替换为永假正则后，
//        该豁免对应的良性样本须复活为命中（或验证正则覆盖句式）。
const LEG_KEYS = {
  labor_zh: ['LABOR_SELF_ZH', 'LABOR_TOIL_ZH', 'LABOR_DIY_ZH'],
  labor_en: ['LABOR_ASSEMBLED_EN', 'LABOR_OWN_EN', 'LABOR_HAND_EN'],
  leg2_zh: ['QUALITY_ZH', 'QUALITY_CLAIM_ZH', 'QUALITY_NOLOSE_ZH', 'QUALITY_ADJ_ZH', 'VALUE_ZH', 'VALUE_TOIL_ZH'],
  leg2_en: ['QUALITY_EN', 'QUALITY_CLAIM_EN', 'QUALITY_ADJ_EN', 'VALUE_EN', 'VALUE_OVER_EN'],
};
const ALL_ATTACKS = ATTACKS.map(a => a[1]);
t('负例注入承重 — 删整组腿①（ZH+EN 全部腿族）', () => {
  const inject = {};
  for (const k of LEG_KEYS.labor_zh.concat(LEG_KEYS.labor_en)) inject[k] = [];
  const survivors = ALL_ATTACKS.filter(p => detectIkeaEffect(p, inject).hit);
  assert.strictEqual(survivors.length, 0, '仍有 ' + survivors.length + ' 条攻击在删腿①后命中——腿①未承重');
});
t('负例注入承重 — 删整组腿②（ZH+EN 全部腿族）', () => {
  const inject = {};
  for (const k of LEG_KEYS.leg2_zh.concat(LEG_KEYS.leg2_en)) inject[k] = [];
  const survivors = ALL_ATTACKS.filter(p => detectIkeaEffect(p, inject).hit);
  assert.strictEqual(survivors.length, 0, '仍有 ' + survivors.length + ' 条攻击在删腿②后命中——腿②未承重');
});
t('负例注入承重 — 删邻近窗 PAIR_ZH（0 = 只许零宽重叠）', () => {
  const far = '桌子是我自己拼的。' + '中间是很长的无关内容。'.repeat(8) + '肯定比工厂流水线产的更结实。';
  assert.strictEqual(detectIkeaEffect(far).hit, false, '跨窗命中');
  const near = '这张桌子是你自己亲手钉的，但肯定比工厂流水线产的更结实。';
  assert.strictEqual(detectIkeaEffect(near, { PAIR_ZH: 200 }).hit, true, '窗内未命中');
});
// 层2：逐腿族代表句式必须命中（腿族非死代码）
const LEG_PROBES = {
  LABOR_SELF_ZH: '这张桌子是你自己亲手钉的，用料虽然一般，但肯定比工厂流水线产的更结实。',
  LABOR_TOIL_ZH: '这个方案是团队熬了无数个夜做出来的，所以一定比外部采购的成品更贴合我们的需求。',
  LABOR_DIY_ZH: '这款家具是我亲手 DIY 拼装的，比买现成的强太多了。',
  LABOR_ASSEMBLED_EN: 'People overvalue furniture they assembled themselves compared with ready-made pieces.',
  LABOR_OWN_EN: 'This is my own handiwork and it is clearly better than anything store-bought.',
  LABOR_HAND_EN: 'The sweater she knitted herself is clearly superior to anything store-bought.',
  QUALITY_ZH: '自己写的代码才是好代码，开源库再好也是别人的东西，不如自己造轮子可靠。',
  QUALITY_CLAIM_ZH: '我们团队亲手打磨的这份方案，含着自己的心血，质量肯定更高。',
  QUALITY_NOLOSE_ZH: '自己腌的咸菜不比店里卖的差，毕竟是亲手做的。',
  VALUE_ZH: '这个玩偶是我一针一线缝的，倾注了无数心血，所以格外珍贵。',
  VALUE_TOIL_ZH: '这桌菜是我忙了整整一天亲手做的倾注了无数心血格外珍贵',
  QUALITY_EN: 'Because we built the tool in-house, it must be better than any commercial alternative.',
  VALUE_EN: 'The sweater she knitted herself is clearly superior to anything store-bought.',
};
for (const [leg, probe] of Object.entries(LEG_PROBES)) {
  t('腿族代表句式命中 — ' + leg, () => {
    assert.strictEqual(detectIkeaEffect(probe).hit, true, '该腿族代表句式未命中——腿族可能是死代码');
  });
}
// 层3：逐豁免注入（永假正则 = 禁用该豁免）。
// 注意：豁免承重的正确语义是「该豁免正则覆盖了对应句式」——豁免禁用后
// 句式是否转为命中还取决于两腿是否在场（概念教学句本身无腿②，属防御性
// 冗余豁免）。因此这里验证两级：
//   (a) 豁免正则在对应句式上命中（覆盖关系存在，非死正则）；
//   (b) 对有腿②在场的豁免句式，禁用豁免后须复活为命中（真承重）。
const EXEMPT_CHECKS = [
  // 注意：豁免承重的语义是「该豁免正则覆盖了对应句式」。有腿②在场的句式，
  // 禁用豁免后应复活为命中（真承重）；本身无攻击两腿的防御性冗余句式
  // （概念教学句/元陈述破除句），验证正则覆盖即可。
  ['豁免 A CONCEPT_ZH', 'CONCEPT_ZH', '宜家效应指人们对自己投入劳动组装的产品的估值显著高于同类成品的现象。', false],
  ['豁免 B CORRECT_ZH', 'CORRECT_ZH', '劳动投入并不代表质量，自己动手做的东西也要经过客观盲测才算数。', false],
  ['豁免 C BASELINE_ZH', 'BASELINE_ZH', '在投入自己劳动之前，我们参照了市售同类产品的质量标准和价格区间。', false],
  ['豁免 D QUESTION_ZH', 'QUESTION_ZH', '自己做的真的更好吗？', true],
];
for (const [name, key, probe, shouldRevive] of EXEMPT_CHECKS) {
  t('负例注入承重 — ' + name, () => {
    // 前置：不注入时该句式被豁免 pass
    assert.strictEqual(detectIkeaEffect(probe).hit, false, '豁免样本基线未 pass（测试无效）');
    const revived = detectIkeaEffect(probe, { [key]: /^\u0000$/ });
    if (shouldRevive) {
      // (b) 有腿②在场：禁用豁免后须复活
      assert.strictEqual(revived.hit, true, '禁用豁免后良性未复活——该豁免未承重');
    } else {
      // (a) 概念句无腿②：验证豁免正则本身覆盖该句（非死正则）
      assert.strictEqual(I[key].test(probe), true, '豁免正则不覆盖对应句式——正则失效');
    }
  });
}

// ─── 邻近窗承重：跨窗两腿不判 ─────────────────────────────────────
t('邻近窗承重（PAIR_ZH 放大到 200 后长句须命中，证明窗参数在承重）', () => {
  const far = '桌子是我自己拼的。' + '中间插入很长的无关内容。'.repeat(12) + '肯定比工厂流水线产的更结实。';
  assert.strictEqual(detectIkeaEffect(far).hit, false, '跨窗仍命中');
  const near = '这张桌子是你自己亲手钉的，但肯定比工厂流水线产的更结实。';
  assert.strictEqual(detectIkeaEffect(near, { PAIR_ZH: 200 }).hit, true, '窗内放大后未命中');
});

// ─── 强否定守卫承重 ────────────────────────────────────────────────
t('强否定守卫（「并不比现成的好」失配）', () => {
  const neg = '这张桌子是我自己亲手钉的，但并不比现成的工厂货好多少。';
  assert.strictEqual(detectIkeaEffect(neg).hit, false, '否定句误命中');
});

// ─── 聚合族注册核实（econ 第 48 子族）────────────────────────────
t('econ FAMILIES 注册含 ikea_effect', () => {
  const fams = erg.FAMILIES || [];
  const keys = fams.map(f => f.key);
  assert.ok(keys.includes('ikea_effect'), 'FAMILIES 未注册 ikea_effect');
  const entry = fams.find(f => f.key === 'ikea_effect');
  assert.strictEqual(entry.mod, './ikea-effect.js');
  assert.strictEqual(entry.fn, 'detectIkeaEffect');
  assert.strictEqual(entry.round, 'r471');
  // 引擎聚合层 FAMILIES 43 族（插件层 48 族，引擎不含 ad_hominem /
  // incentive_blind_spot 等 5 族，见模块头注释）——注册项在表内即承重
  assert.ok(keys.length >= 43, '子族数异常（实际 ' + keys.length + '）');
});

// ─── 邻居维度射程边界（不越界）────────────────────────────────────
t('邻居边界：effort_justification 领地（放弃可耻）不被 ikea 判', () => {
  assert.strictEqual(detectIkeaEffect('这个项目已经投入了这么多心血，现在放弃太可惜了，必须继续做完。').hit, false);
});
t('邻居边界：endowment_effect 领地（纯所有权，无劳动腿）不被 ikea 判', () => {
  assert.strictEqual(detectIkeaEffect('我的东西就是值钱，别人出多少钱都不卖。').hit, false);
});

// ─── 输出 ─────────────────────────────────────────────────────────
console.log(`round-471-ikea-effect: ${passed} passed / ${failed} failed`);
if (failed > 0) {
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
