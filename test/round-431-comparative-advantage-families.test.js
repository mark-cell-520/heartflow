'use strict';
/**
 * test/round-431-comparative-advantage-families.test.js
 * r431 轮测：comparative_advantage 既有维度补腿（真升级类型②）
 *
 * 背景：r426+r430 累积改动（ADV6/7/8 + NOGAIN5/1 反极性族扩展）未提交，
 * r431 探针实证（scripts/round-431/probe-r431.js）发现 6 处真漏判 + 1 处正则残肢：
 *   1. ADV_ZH_F8 正则前三个裸量词分支未接成本名词+极性（r430 引入的正则残肢，
 *      匹配到「每一项」即返回，evidence 残缺）→ 修复为完整三分支交替；
 *   2. ADV_EN_F1 的 `(?:both|all|every)\b` 的 `\b` 使 `everything` 匹配失败
 *      （every 后跟 thing 时 \b 不成立）→ `\w*`；
 *   3. ADV_EN_F8 不收 `costs more than` 与 `beats every rival` 形；
 *   4. ADV_ZH_F6 名词表缺「技术」、前缀缺「各方面」；
 *   5. ADV_ZH_F7 量词表缺「每一件/每个/每条/每一类」；
 *   6. NOGAIN_ZH_F1 情态词缺插入变体「没有必要」（原只有「没必要」连写形）；
 *   7. 新增 NOGAIN_ZH_F7（谈不上/称不上 + 收益）与 NOGAIN_ZH_F8
 *      （「外购是更好的选择」替代推荐形）。
 *
 * 判据不变：腿① ADV 绝对/相对优势（劣势）前提 × 腿② NOGAIN 无获益结论，
 * 邻近窗（ZH 45 字 / EN 150 字符）内共现，缺一不判；腿② neg/hedge 守卫。
 */
'use strict';
const assert = require('assert');
const CA = require('../src/comparative-advantage.js');
const { checkOutput } = require('../src/gate.js');

// ── A 组：攻击样本（双腿共现，应命中）─────────────────────
const attacks = [
  // ADV6 全面劣势 × NOGAIN（r426 族，r431 修复后生效）
  '在所有商品的生产效率都低于别国，所以我们根本没有必要和他们贸易。',
  '各方面的技术都落后于海外，这种分工合作谈不上什么收益。',
  // ADV7 都比X差 × NOGAIN（r431 补量词后生效）
  '每一件产品都比国外同类差一截，买了就是白费钱。',
  // ADV8 成本劣势 × NOGAIN（r430 族，r431 修正则后生效）
  '每一项工业品的成本都高于我们，外购是更好的选择。',
  '各类商品的劳动力成本都高于国内，所以没必要自己生产。',
  // ADV8 补形 × NOGAIN
  '每一项任务的质量都劣于国内厂商，进口毫无意义。',
  // EN 双腿（r431 修 F1 every\w* / F8 costs-more / beats-every 后生效）
  'They are worse at everything than our domestic firms, so there is no point in trading with them.',
  'We are less efficient at all tasks than overseas plants, which makes outsourcing pointless.',
  'Their labor costs are higher than ours, so outsourcing makes no sense.',
  'Every product costs more than the imported equivalent, so trade cannot benefit us.',
  'We produce everything more efficiently, but there is no point in trading with them.',
  'Our plants beat every rival, yet this outsourcing makes no sense.',
  // NOGAIN5 × ADV
  '我们每一项产品的生产效率都高于他们，但进口国根本没法从这种贸易中获益。',
  '我们的技术全面领先，可双方都无从获得比较优势收益，合资是纯粹的浪费。',
  // NOGAIN5 EN × ADV
  'We produce everything more efficiently, but there is no point in trading with them.',
  'Our plants beat every rival, yet this outsourcing makes no sense.',
];

// ── B 组：良性样本（模块层零命中）──────────────────────────
const benign = [
  '我们的生产效率高于行业平均水平，这是比较优势。',
  '进口商品的价格比国产低，消费者得到了实惠。',
  '这项技术比国外先进，值得我们引进。',
  '通过分工合作，双方都获得了实实在在的收益。',
  'Our firm produces everything more efficiently than rivals.',
  'Trade with that country benefits both sides enormously.',
  'The new equipment is cheaper than the old one.',
  'We benefit greatly from specialization and exchange.',
  '昨天的会议讨论了下一季度的采购计划。',
  '产品价格下降让更多家庭用上了它。',
  '他每天上班的成本是三十块钱地铁费。',
  'Our team completed every task on schedule.',
  '劳动力成本上升促使企业加快了自动化改造。',
  '进口商品的价格下降了，老百姓得到了实实在在的好处。',
];

// ── C 组：豁免样本（概念讨论/纠正句，应零命中）────────────
const exemptions = [
  '比较优势理论指出，即使一国在所有商品上都有绝对优势，贸易仍能带来收益。',
  '这里混淆了绝对优势与比较优势，是教科书级的谬误。',
  '这其实是对绝对优势概念的误读，机会成本决定贸易收益。',
  'The misconception that absolute advantage precludes gains from trade is a classic fallacy.',
];

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log(`  ok  ${name}`); }
  catch (e) { fail++; console.log(`  FAIL ${name}: ${e.message}`); }
}

console.log('A 组：攻击样本应模块层命中');
for (let i = 0; i < attacks.length; i++) {
  check(`attack[${i}] ${attacks[i].slice(0, 18)}...`, () => {
    const r = CA.detectComparativeAdvantage(attacks[i]);
    assert.strictEqual(r.hit, true, `expected hit, got ${JSON.stringify(r)}`);
  });
}

console.log('A 组：攻击样本应 gate 非 pass 且 econ_reasoning_gate 承重');
for (let i = 0; i < attacks.length; i++) {
  check(`gate[${i}] ${attacks[i].slice(0, 18)}...`, () => {
    const o = checkOutput(attacks[i]);
    assert.ok(o && o.gate, 'no gate result');
    assert.notStrictEqual(o.gate.action, 'pass', `gate action was pass`);
    const dims = (o.findings || []).map(f => f.dimension);
    assert.ok(dims.some(d => /econ/i.test(d)),
      `no econ finding; dims=${dims.join(',')} action=${o.gate.action}`);
  });
}

console.log('B 组：良性样本应模块层零命中');
for (let i = 0; i < benign.length; i++) {
  check(`benign[${i}] ${benign[i].slice(0, 18)}...`, () => {
    const r = CA.detectComparativeAdvantage(benign[i]);
    assert.strictEqual(r.hit, false, `false positive: ${JSON.stringify(r)}`);
  });
}

console.log('C 组：豁免样本应模块层零命中');
for (let i = 0; i < exemptions.length; i++) {
  check(`exempt[${i}] ${exemptions[i].slice(0, 18)}...`, () => {
    const r = CA.detectComparativeAdvantage(exemptions[i]);
    assert.strictEqual(r.hit, false, `exemption broken: ${JSON.stringify(r)}`);
  });
}

console.log(`\nr431 comparative-advantage: pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);
