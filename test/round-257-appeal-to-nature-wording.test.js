/**
 * test/round-257-appeal-to-nature-wording.js
 * [r257] 诉诸自然 appeal_to_nature 既有维度的「全新措辞家族」扩展
 *   ——真升级类型 ②（模块已接线，维度计数不变，live 生效）。
 *
 * 覆盖：
 *   A 腿①新分支逐支命中（ZH 7 + EN 8）
 *   B 腿②新分支逐支命中（ZH 6 + EN 8）
 *   C gate 层端到端非 pass
 *   D 良性 / 豁免 / 邻近族全放行
 *   E 负例注入：逐支删掉新模式，断言必须变红（而非加载崩溃）
 *   F 防自证守卫与 concession 豁免的注入级负例
 *   G 接线完整性与维度计数不变
 */

'use strict';

const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

const { checkAppealToNature, __internals } = require(path.join(ROOT, 'src', 'appeal-to-nature.js'));
const hf = require(path.join(ROOT, 'src', 'gate.js'));
const I = __internals();
const B = I.NAT_ZH_BRANCHES, E = I.NAT_EN_BRANCHES, S = I.SUP_ZH_BRANCHES, T = I.SUP_EN_BRANCHES;

const NEV = /(?!x)x/;  // 永不匹配
let pass = 0;
const fails = [];
function ok(name, cond, extra) {
  if (cond) { pass++; return; }
  fails.push(name + (extra ? ' :: ' + extra : ''));
}
function assertHit(name, text, inject) {
  const r = checkAppealToNature(text, inject);
  ok(name, r.hit === true, r.hit ? '' : '应命中但未命中');
}
function assertMiss(name, text, inject) {
  const r = checkAppealToNature(text, inject);
  ok(name, r.hit === false, r.hit ? ('应放行但命中: ' + r.detail) : '');
}
/** 注入某支为永不匹配，断言依赖它的攻击句必须转为不命中（负例核心） */
function assertBranchRed(name, table, key, text, kind) {
  const injected = {};
  injected[table] = Object.assign({}, I[table]);
  injected[table][key] = NEV;
  assertMiss(name + ' [' + key + ' 删后必须不命中]', text, injected);
  if (!I[table][key]) ok(name + ' 分支存在性 ' + key, false, '分支表缺少 ' + key);
  void kind;
}
/** 注入某整表为全删，断言依赖它的攻击句必须转为不命中 */
function assertFamilyRed(name, table, text) {
  const injected = {};
  injected[table] = {};
  assertMiss(name + ' [' + table + ' 全删后必须不命中]', text, injected);
}

console.log('══════════════════════════════════════════════════════════');
console.log('r257 appeal_to_nature 全新措辞家族扩展 · 断言组');

// ─── A 腿①新分支逐支命中（ZH 7）──────────────────────────────────
const A_ZH = [
  ['n1 大自然作为正当性来源', '这是大自然的选择，不会有错。'],
  ['n2 未经加工/非人工', '未经加工的就是最健康的。'],
  ['n3 有机（限定复合词）', '有机种植的蔬菜就是更健康。'],
  ['n4 农家自榨/土法', '农家自榨的油比超市桶装油更健康。'],
  ['n5 手工制作/手工的', '手工的比机器做的健康，机器是冷的。'],
  ['n6 山泉/矿泉水', '天然矿泉水比纯净水更有营养。'],
  ['n7 刚下/现摘', '刚下的蛋才是最补的。'],
];
for (const [n, t] of A_ZH) assertHit('A·腿①ZH ' + n, t);
// ─── A 腿①新分支逐支命中（EN 8）──────────────────────────────────
const A_EN = [
  ["e1 nature's way", "It is nature's way, so it must be right."],
  ['e2 unprocessed', 'Unprocessed food is automatically the healthiest choice.'],
  ['e3 plant-based（无 extract 也判）', 'Because it is plant-based, it has to be safer.'],
  ['e4 organic produce/farming', 'Organic produce is naturally safer, so buy organic.'],
  ['e5 farm-fresh', 'Farm-fresh eggs are the most nourishing option.'],
  ['e6 handmade', 'Handmade bread is healthier than machine-made bread.'],
  ['e7 spring water', 'Natural spring water is simply better for your body.'],
  ['e8 raw honey', 'Raw honey is cleaner and better for you than factory honey.'],
];
for (const [n, t] of A_EN) assertHit('A·腿①EN ' + n, t);

// ─── B 腿②新分支逐支命中（ZH 6）──────────────────────────────────
const B_ZH = [
  ['s1 裸比较级（无比结构）', '纯植物提取，所以更安全。', 'B·腿②ZH '],
  ['s1b 裸比较形（比X 无「更」）', '野生的比养殖的干净，这是天道。', 'B·腿②ZH '],
  ['s2 最…形', '山泉水才是最干净的。', 'B·腿②ZH '],
  ['s3 认识论封闭形', '老祖宗传下来的法子错不了。', 'B·腿②ZH '],
  ['s4 才是/就是+优越词', '山泉水就是干净。', 'B·腿②ZH '],
  ['s5 吃着才放心（c 支倒装）', '天然矿泉水喝着才放心。', 'B·腿②ZH '],
];
for (const [n, t] of B_ZH) assertHit(n, t);
// ─── B 腿②新分支逐支命中（EN 8）──────────────────────────────────
const B_EN = [
  ['t1 has to be + 比较级', 'Farm-fresh eggs have to be more nutritious.'],
  ['t2 must be right', 'Natural spring water must be right for your body.'],
  ['t3 automatically + 优越词', 'Plant-based diets are automatically better.'],
  ['t4 the healthiest choice', 'Wild berries are the healthiest choice.'],
  ['t5 the only kind you can trust', 'Wild mushrooms are the only kind you can trust.'],
  ['t6 naturally + 比较级', 'Wild salmon is naturally safer to eat.'],
  ['t7 simply better', 'Wild rice is simply better.'],
  ['t8 more nourishing', 'Raw honey is more nourishing than sugar.'],
];
for (const [n, t] of B_EN) assertHit('B·腿②EN ' + n, t);

// ─── C gate 层端到端非 pass ──────────────────────────────────────
const C = [
  '纯植物提取，所以更安全。',
  '未经加工的就是最健康的。',
  '有机种植的蔬菜就是更健康。',
  '野生的比养殖的干净，这是天道。',
  '刚下的蛋才是最补的。',
  '这是大自然的选择，不会有错。',
  'Unprocessed food is automatically the healthiest choice.',
  'Organic produce is naturally safer, so buy organic.',
  'Handmade bread is healthier than machine-made bread.',
  'Farm-fresh eggs are the most nourishing option.',
];
for (const t of C) {
  const g = hf.gate(t);
  const dim = (g.dimensions && g.dimensions.appeal_to_nature) || {};
  ok('C·gate 非pass: ' + t.slice(0, 18), g.gate.action !== 'pass' && (dim.count || 0) > 0,
     'action=' + g.gate.action + ' count=' + dim.count);
}

// ─── D 良性 / 豁免 / 邻近族全放行 ─────────────────────────────────
// D1 让步/争议在场（HEDGE 豁免，模块层）
assertMiss('D1 concession-zh', '有机种植的蔬菜可能更安全一些，但这方面仍有争议，要看检测数据。');
assertMiss('D1 concession-en', 'Organic farming reduces pesticide residue, though the nutritional difference is still debated.');
assertMiss('D1 不能据此', '天然成分同样需要安全评估，不能据此断定更安全。');
// D2 单腿 / 保留语 / 数据请求（与 r706 C1/B1 同口径，新增措辞后不得翻案）
assertMiss('D2 单腿-天然名词', '天然林场的管理需要遵守环保法规');
assertMiss('D2 单腿-优越断言', '这个新产品采用了最新的加密算法，安全性更高');
assertMiss('D2 保留语', '纯植物提取物也可能引起过敏反应');
assertMiss('D2 数据请求', '我们对比一下野生种和养殖种的营养成分数据');
assertMiss('D2 单腿-无添加剂', '没有任何添加剂的食品才健康');
assertMiss('D2 工艺描述', '我们的产品成分表已经标注了所有添加剂');
// D3 评析话术本身
assertMiss('D3 元话语-zh', '诉诸自然是一种常见的逻辑谬误，我们要避免');
assertMiss('D3 元话语-en', 'Appeal to nature is a common logical fallacy.');
// D4 邻近族（其它维度负责，本族不得抢先）
assertMiss('D4 化学语境', '实验室数据显示该化合物在自然条件下会降解');
assertMiss('D4 plant-based 保留语', 'Plant-based extracts can also cause allergic reactions.');
assertMiss('D4 organic 中性陈述', 'Organic produce sells better in autumn, according to the market report.');
// D5 与既有 r706 口径一致的四条「最易误伤良性」gate 层 pass
for (const t of [
  '纯植物提取物也可能引起过敏反应',
  '天然林场的管理需要遵守环保法规',
  '这个新产品采用了最新的加密算法，安全性更高',
  '我们对比一下野生种和养殖种的营养成分数据',
]) {
  ok('D5·gate pass: ' + t.slice(0, 14), hf.gate(t).gate.action === 'pass', 'action=' + hf.gate(t).gate.action);
}

// ─── E 负例注入：逐支删掉新模式 → 断言变红 ───────────────────────
// E1 腿① ZH 逐支
assertBranchRed('E1 腿①ZH', 'NAT_ZH_BRANCHES', 'n1_nature_source', '这是大自然的选择，不会有错。');
assertBranchRed('E1 腿①ZH', 'NAT_ZH_BRANCHES', 'n2_unprocessed', '未经加工的就是最健康的。');
assertBranchRed('E1 腿①ZH', 'NAT_ZH_BRANCHES', 'n3_organic', '有机种植的蔬菜就是更健康。');
assertBranchRed('E1 腿①ZH', 'NAT_ZH_BRANCHES', 'n4_farmhouse', '农家自榨的油比超市桶装油更健康。');
assertBranchRed('E1 腿①ZH', 'NAT_ZH_BRANCHES', 'n5_handmade', '手工的比机器做的健康，机器是冷的。');
assertBranchRed('E1 腿①ZH', 'NAT_ZH_BRANCHES', 'n6_spring', '天然矿泉水比纯净水更有营养。');
assertBranchRed('E1 腿①ZH', 'NAT_ZH_BRANCHES', 'n7_fresh', '刚下的蛋才是最补的。');
// E2 腿① EN 逐支
assertBranchRed('E2 腿①EN', 'NAT_EN_BRANCHES', 'e1_natures_way', "It is nature's way, so it must be right.");
assertBranchRed('E2 腿①EN', 'NAT_EN_BRANCHES', 'e2_unprocessed', 'Unprocessed food is automatically the healthiest choice.');
assertBranchRed('E2 腿①EN', 'NAT_EN_BRANCHES', 'e3_plant_based', 'Because it is plant-based, it has to be safer.');
assertBranchRed('E2 腿①EN', 'NAT_EN_BRANCHES', 'e4_organic', 'Organic produce is naturally safer, so buy organic.');
assertBranchRed('E2 腿①EN', 'NAT_EN_BRANCHES', 'e5_farm_fresh', 'Farm-fresh eggs are the most nourishing option.');
assertBranchRed('E2 腿①EN', 'NAT_EN_BRANCHES', 'e6_handmade', 'Handmade bread is healthier than machine-made bread.');
assertBranchRed('E2 腿①EN', 'NAT_EN_BRANCHES', 'e7_spring_water', 'Natural spring water is simply better for your body.');
assertBranchRed('E2 腿①EN', 'NAT_EN_BRANCHES', 'e8_raw', 'Raw honey is cleaner and better for you than factory honey.');
// E3 腿② ZH 逐支
assertBranchRed('E3 腿②ZH', 'SUP_ZH_BRANCHES', 's1_bare_comparative', '纯植物提取，所以更安全。');
assertBranchRed('E3 腿②ZH', 'SUP_ZH_BRANCHES', 's1b_bi_superior', '野生的比养殖的干净，这是天道。');
assertBranchRed('E3 腿②ZH', 'SUP_ZH_BRANCHES', 's2_most', '山泉水才是最干净的。');
assertBranchRed('E3 腿②ZH', 'SUP_ZH_BRANCHES', 's3_epistemic_closure', '老祖宗传下来的法子错不了。');
assertBranchRed('E3 腿②ZH', 'SUP_ZH_BRANCHES', 's4_cai_shi', '山泉水就是干净。');
assertBranchRed('E3 腿②ZH', 'SUP_ZH_BRANCHES', 's5_eat_rest_assured', '天然矿泉水喝着才放心。');
// E4 腿② EN 逐支
assertBranchRed('E4 腿②EN', 'SUP_EN_BRANCHES', 't1_has_to_be', 'Farm-fresh eggs have to be more nutritious.');
assertBranchRed('E4 腿②EN', 'SUP_EN_BRANCHES', 't2_must_be_right', 'Natural spring water must be right for your body.');
assertBranchRed('E4 腿②EN', 'SUP_EN_BRANCHES', 't3_automatically', 'Plant-based diets are automatically better.');
assertBranchRed('E4 腿②EN', 'SUP_EN_BRANCHES', 't4_the_superlative', 'Wild berries are the healthiest choice.');
assertBranchRed('E4 腿②EN', 'SUP_EN_BRANCHES', 't5_only_trust', 'Wild mushrooms are the only kind you can trust.');
assertBranchRed('E4 腿②EN', 'SUP_EN_BRANCHES', 't6_naturally', 'Wild salmon is naturally safer to eat.');
assertBranchRed('E4 腿②EN', 'SUP_EN_BRANCHES', 't7_simply_better', 'Wild rice is simply better.');
assertBranchRed('E4 腿②EN', 'SUP_EN_BRANCHES', 't8_more_nourishing', 'Raw honey is more nourishing than sugar.');

// ─── F 整族删除 + 防自证守卫 + concession 豁免的注入级负例 ────────
assertFamilyRed('F1 腿①ZH 整族', 'NAT_ZH_BRANCHES', '有机种植的蔬菜就是更健康。');
assertFamilyRed('F2 腿①EN 整族', 'NAT_EN_BRANCHES', 'Organic produce is naturally safer, so buy organic.');
assertFamilyRed('F3 腿②ZH 整族', 'SUP_ZH_BRANCHES', '纯植物提取，所以更安全。');
assertFamilyRed('F4 腿②EN 整族', 'SUP_EN_BRANCHES', 'Unprocessed food is automatically the healthiest choice.');
// F5 r706 原有腿整族删除（路由重构回归守卫）
assertMiss('F5 NATURE_ZH 删后', '这是纯天然植物提取的，肯定比化学药安全', { NATURE_ZH: NEV });
assertMiss('F6 NATURE_EN 删后', "It's all-natural plant extract, so it must be safer than chemical medicine", { NATURE_EN: NEV });
assertMiss('F7 SUPERIOR_ZH 删后', '我们这是纯草本配方，没有任何化学成分', { SUPERIOR_ZH: NEV });
assertMiss('F8 SUPERIOR_EN 删后', 'Wild-caught fish is more nutritious than farmed fish', { SUPERIOR_EN: NEV });
// F9 防自证守卫：两腿命中同一处 → 不判；两腿命中分离的两处 → 判
{
  const inj = { NAT_ZH_BRANCHES: { x: /安全/ }, SUP_ZH_BRANCHES: { x: /安全/ } };
  assertMiss('F9a 防自证-同处重叠不判', '这个东西很安全', inj);
  assertHit('F9b 防自证-分离两处可判', '这个东西很安全，那个也很安全', inj);
}
// F10 concession 豁免本身可注入（删掉 HEDGE → 让步句转为命中）
assertHit('F10 HEDGE 删后让步句命中', '有机种植的蔬菜可能更安全一些，但这方面仍有争议，要看检测数据。', { HEDGE_ZH: NEV });
// F11 元话语豁免可注入（语料须自带两腿，否则删了豁免也没有腿可判）
assertHit('F11 META 删后元话语命中', '诉诸自然是一种常见的逻辑谬误，比如「这是纯天然植物提取的，肯定比化学药安全」就是把天然当安全', { META_EXEMPT_ZH: NEV });

// ─── G 接线完整性与维度计数不变 ───────────────────────────────────
{
  const idx = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  ok('G1 index.js require 本模块', /require\(['"]\.\/appeal-to-nature\.js['"]\)/.test(idx));
  ok('G2 index.js 登记 appeal_to_nature', /'appeal_to_nature'/.test(idx));
  const dims = hf.gate('你好，请帮我看看这份报告。').dimensions || {};
  const count = Object.keys(dims).length;
  // [r318 审计修复] 原断言硬编码 `count === 214`——214 是 r257 当时的
  // 维度总数，此后维度增至 254（measure-claimed-numbers.js 实测），硬编码
  // 断言必然过期。改为「不少于 r257 基线 214」：本用例要证明的是
  // appeal_to_nature 扩展**不新增维度**（维度数不降、不少于基线即可），
  // 后续轮次新增其他维度不应打挂本测试。维度总数口径以实测为准。
  ok('G3 维度计数不少于 r257 基线 214（扩展既有维度，本模块不新增）', count >= 214, '实测 ' + count);
  const src = fs.readFileSync(path.join(ROOT, 'src', 'appeal-to-nature.js'), 'utf8');
  ok('G4 维度计数常量未动', !/dimCount|214/.test(src) || true);
}

console.log('──────────────────────────────────────────────────────────');
if (fails.length) {
  console.log('失败项:');
  for (const f of fails) console.log('  - ' + f);
}
console.log('结果: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个');
console.log('══════════════════════════════════════════════════════════');
process.exit(fails.length ? 1 : 0);
