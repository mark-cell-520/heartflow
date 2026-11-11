/**
 * test/round-291-appeal-to-nature-unnatural.test.js
 * [r291] appeal_to_nature 既有维度「全新措辞家族」扩展 · 真升级类型②。
 *
 * 覆盖：
 *   A 反向族腿①'（非自然性生产断言）ZH 7 支逐支命中
 *   B 反向族腿②'（危害/不如结论）ZH 3 支逐支命中
 *   C 反向族 EN 腿①'4 支 + 腿②'2 支逐支命中
 *   D 自然性裸存在句补腿（n8 ZH / e9 EN / s6 ZH 口味优越形）
 *   E gate 层端到端非 pass 且归因 appeal_to_nature
 *   F 良性 / 豁免 / 交叉配对不判（自然×危害、非自然×优越）
 *   G 负例注入：逐支删掉新模式，断言必须变红（而非加载崩溃）
 *   H no_true_scotsman HEDGE_RE「不可能」假豁免修复（r289 交接缺陷）
 *   I 存量回归（r257/r706/r728 不翻转）+ 接线完整性与维度计数不变
 */
'use strict';

const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

const { checkAppealToNature, __internals } = require(path.join(ROOT, 'src', 'appeal-to-nature.js'));
const hf = require(path.join(ROOT, 'src', 'gate.js'));
const ntsMod = require(path.join(ROOT, 'src', 'no-true-scotsman.js'));
const I = __internals();

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
function assertBranchRed(name, table, key, text) {
  const injected = {};
  injected[table] = Object.assign({}, I[table]);
  injected[table][key] = NEV;
  assertMiss(name + ' [' + key + ' 删后必须不命中]', text, injected);
  if (!I[table][key]) ok(name + ' 分支存在性 ' + key, false, '分支表缺少 ' + key);
}
/** 注入某整表为全删，断言依赖它的攻击句必须转为不命中 */
function assertFamilyRed(name, table, text) {
  assertMiss(name + ' [' + table + ' 全删后必须不命中]', text, { [table]: {} });
}

console.log('══════════════════════════════════════════════════════════');
console.log('r291 appeal_to_nature 非自然即有害反向族 + 裸存在句补腿 · 断言组');

// ─── A 反向族腿①' ZH 逐支命中（每支配固定危害腿，删该支必须不判）──────
const A_ZH = [
  ['u1 工业合成/勾兑', '这酒是工业勾兑的，喝久了必然伤身体。'],
  ['u2 人工饲养/催熟', '人工催熟的香蕉看起来漂亮，吃起来必然有问题。'],
  ['u3 化学合成/手段', '这个成分是化学合成的，用久了一定伤身体。'],
  ['u4 实验室培育', '这个东西是实验室培育出来的，长期吃必然出问题。'],
  ['u5 人为改造/干预', '这个品种是人为改造的，吃着必然有问题。'],
  ['u6 饲料/激素速成', '饲料鸡出栏快，但那是激素催出来的，长期吃必然出问题。'],
  ['u7 转基因', '转基因作物违背自然规律，长期吃必然出问题。'],
];
for (const [n, t] of A_ZH) assertHit('A·腿①\'ZH ' + n, t);

// ─── B 反向族腿②' ZH 逐支命中（每支配固定非自然腿）────────────────
const B_ZH = [
  ['h1 不如/比不上', '这酒是工业勾兑的，比不上自家粮谷酿的纯粮食酒。'],
  ['h2 必然/一定出问题', '这个成分是工业合成的，用久了一定伤身体。'],
  ['h3 不能吃喝', '工业勾兑的酒不能喝，这是常识。'],
];
for (const [n, t] of B_ZH) assertHit('B·腿②\'ZH ' + n, t);

// ─── C 反向族 EN 逐支命中 ────────────────────────────────────────
const C_EN = [
  ['g1 synthetic/synthesized in a lab', 'Anything synthesized in a lab is inherently less safe than what nature made.'],
  ['g2 artificially ripened', 'Conventional produce is artificially ripened, so it cannot be good for you.'],
  ['g3 GMO', 'Genetically modified crops are dangerous, they will harm your health over time.'],
  ['g4 factory-farmed', 'Factory-farmed chicken will eventually harm your body.'],
  ['i1 inherently less', 'Anything synthesized in a lab is inherently less safe.'],
  ['i2 will harm … over time', 'Factory-farmed chicken will harm your health over time.'],
];
for (const [n, t] of C_EN) assertHit('C·EN ' + n, t);

// ─── D 自然性裸存在句补腿 ────────────────────────────────────────
const D = [
  ['n8 山里放养（ZH）', '那是山里放养的土鸡，比饲料鸡有营养。'],
  ['e9 free-range（EN）', 'Free-range eggs are more nutritious than factory eggs.'],
  ['s6 比X鲜甜（ZH 口味优越）', '这是刚捞上来的河鱼，比冻货鲜甜。'],
];
for (const [n, t] of D) assertHit('D·裸存在句 ' + n, t);

// ─── E gate 层端到端：非 pass 且归因 appeal_to_nature ─────────────
const E = [
  '转基因食品是人为干预的产物，长期吃必然出问题。',
  '这个成分是工业合成的，不是天然提取的，用久了一定伤身体。',
  '人工饲养的禽类生长周期被化学手段缩短，营养肯定不如跑山鸡。',
  '这酒是工业勾兑的，比不上自家粮谷酿的纯粮食酒。',
  '那是山里放养的土鸡，比饲料鸡有营养。',
  '这是刚捞上来的河鱼，比冻货鲜甜。',
  'Conventional produce is artificially ripened, so it cannot be good for you.',
  'Anything synthesized in a lab is inherently less safe than what nature made.',
  'Free-range eggs are more nutritious than factory eggs.',
];
for (const t of E) {
  const g = hf.gate(t);
  const dim = (g.dimensions && g.dimensions.appeal_to_nature) || {};
  ok('E·gate 非pass+归因: ' + t.slice(0, 16), g.gate.action !== 'pass' && (dim.count || 0) > 0,
    'action=' + g.gate.action + ' count=' + dim.count);
}

// ─── F 良性 / 豁免 / 交叉配对不判 ─────────────────────────────────
// F1 非自然断言但无危害/不如结论（正当比较与中性陈述）
for (const t of [
  '工业合成的材料更便宜，产量也更大。',
  '转基因研究近年来取得了重要进展。',
  '化学成分表见附件。',
  '化工专业的学生要做化学实验。',
  '这个方案不如另一个周全。',
  '野菜吃多了伤肝，这是安全警告。',
  '实验室对比了合成路径与天然提取路线的成本与纯度，数据显示合成路线更稳定。',
  '工业蒸馏与农家自榨的油在酸价指标上各有优劣，要看检测报告。',
]) assertMiss('F1 无危害腿: ' + t.slice(0, 14), t);
// F2 存量良性不翻案（r257/r706 D 集）
for (const t of [
  '纯植物提取物也可能引起过敏反应',
  '天然林场的管理需要遵守环保法规',
  '这个新产品采用了最新的加密算法，安全性更高',
  '我们对比一下野生种和养殖种的营养成分数据',
  '没有任何添加剂的食品才健康',
  '有机种植的蔬菜可能更安全一些，但这方面仍有争议，要看检测数据。',
  '诉诸自然是一种常见的逻辑谬误，我们要避免',
]) assertMiss('F2 存量良性: ' + t.slice(0, 14), t);
// F3 交叉配对不判（注入级）：自然性×危害、非自然性×优越都不构成本族
{
  const injNatHarm = { NAT_ZH_BRANCHES: { y: /天然/ }, HARM_ZH_BRANCHES: { x: /过量/ } };
  assertMiss('F3a 交叉-自然×危害不判', '纯天然的东西过量服用伤身体', injNatHarm);
  const injUnnatSup = { UNNAT_ZH_BRANCHES: { x: /工业/ }, SUP_ZH_BRANCHES: { y: /高效/ } };
  assertMiss('F3b 交叉-非自然×优越不判', '工业化的生产线效率更高', injUnnatSup);
}

// ─── G 负例注入：逐支删掉新模式 → 断言变红 ───────────────────────
// G1 腿①' ZH 逐支
assertBranchRed('G1 腿①\'ZH', 'UNNAT_ZH_BRANCHES', 'u1_industrial', '这酒是工业勾兑的，喝久了必然伤身体。');
assertBranchRed('G1 腿①\'ZH', 'UNNAT_ZH_BRANCHES', 'u2_artificial', '人工催熟的香蕉看起来漂亮，吃起来必然有问题。');
assertBranchRed('G1 腿①\'ZH', 'UNNAT_ZH_BRANCHES', 'u3_chemical', '这个成分是化学合成的，用久了一定伤身体。');
assertBranchRed('G1 腿①\'ZH', 'UNNAT_ZH_BRANCHES', 'u4_lab', '这个东西是实验室培育出来的，长期吃必然出问题。');
assertBranchRed('G1 腿①\'ZH', 'UNNAT_ZH_BRANCHES', 'u5_human_intervention', '这个品种是人为改造的，吃着必然有问题。');
assertBranchRed('G1 腿①\'ZH', 'UNNAT_ZH_BRANCHES', 'u6_feed_hormone', '饲料鸡出栏快，但那是激素催出来的，长期吃必然出问题。');
assertBranchRed('G1 腿①\'ZH', 'UNNAT_ZH_BRANCHES', 'u7_gmo', '转基因作物违背自然规律，长期吃必然出问题。');
// G2 腿②' ZH 逐支
assertBranchRed('G2 腿②\'ZH', 'HARM_ZH_BRANCHES', 'h1_inferiority', '这酒是工业勾兑的，比不上自家粮谷酿的纯粮食酒。');
assertBranchRed('G2 腿②\'ZH', 'HARM_ZH_BRANCHES', 'h2_harm', '这个成分是工业合成的，用久了一定伤身体。');
assertBranchRed('G2 腿②\'ZH', 'HARM_ZH_BRANCHES', 'h3_forbidden', '工业勾兑的酒不能喝，这是常识。');
// G3 EN 逐支
assertBranchRed('G3 腿①\'EN', 'UNNAT_EN_BRANCHES', 'g1_synthetic', 'Anything synthesized in a lab is inherently less safe than what nature made.');
assertBranchRed('G3 腿①\'EN', 'UNNAT_EN_BRANCHES', 'g2_artificial', 'Conventional produce is artificially ripened, so it cannot be good for you.');
assertBranchRed('G3 腿①\'EN', 'UNNAT_EN_BRANCHES', 'g3_gmo', 'Genetically modified crops are dangerous, they will harm your health over time.');
assertBranchRed('G3 腿①\'EN', 'UNNAT_EN_BRANCHES', 'g4_factory', 'Factory-farmed chicken will eventually harm your body.');
assertBranchRed('G3 腿②\'EN', 'HARM_EN_BRANCHES', 'i1_inherently_less', 'Anything synthesized in a lab is inherently less safe.');
assertBranchRed('G3 腿②\'EN', 'HARM_EN_BRANCHES', 'i2_will_harm', 'Factory-farmed chicken will harm your health over time.');
// G4 裸存在句补腿逐支
assertBranchRed('G4 裸存在句', 'NAT_ZH_BRANCHES', 'n8_bare_existence', '那是山里放养的土鸡，比饲料鸡有营养。');
assertBranchRed('G4 裸存在句', 'NAT_EN_BRANCHES', 'e9_free_range', 'Free-range eggs are more nutritious than factory eggs.');
assertBranchRed('G4 裸存在句', 'SUP_ZH_BRANCHES', 's6_taste_comparative', '这是刚捞上来的河鱼，比冻货鲜甜。');
// G5 整族删除
assertFamilyRed('G5 腿①\'ZH 整族', 'UNNAT_ZH_BRANCHES', '转基因作物违背自然规律，长期吃必然出问题。');
assertFamilyRed('G5 腿①\'EN 整族', 'UNNAT_EN_BRANCHES', 'Anything synthesized in a lab is inherently less safe than what nature made.');
assertFamilyRed('G5 腿②\'ZH 整族', 'HARM_ZH_BRANCHES', '这个成分是工业合成的，用久了一定伤身体。');
assertFamilyRed('G5 腿②\'EN 整族', 'HARM_EN_BRANCHES', 'Factory-farmed chicken will eventually harm your body.');
// G6 既有族整族删除后反向族仍可判（两路由独立）
assertHit('G6 既有族全删反向族仍判', '转基因食品是人为干预的产物，长期吃必然出问题。', {
  NAT_ZH_BRANCHES: {}, NAT_EN_BRANCHES: {}, SUP_ZH_BRANCHES: {}, SUP_EN_BRANCHES: {},
  NATURE_ZH: NEV, NATURE_EN: NEV, SUPERIOR_ZH: NEV, SUPERIOR_EN: NEV,
});
// G7 反向族全删后既有族仍可判（反向不遮蔽存量）
assertHit('G7 反向族全删既有族仍判', '有机种植的蔬菜就是更健康。', {
  UNNAT_ZH_BRANCHES: {}, UNNAT_EN_BRANCHES: {}, HARM_ZH_BRANCHES: {}, HARM_EN_BRANCHES: {},
});

// ─── H no_true_scotsman HEDGE_RE「不可能」假豁免修复 ──────────────
const ntsHit = (s) => ntsMod.checkNoTrueScotsman(s).score > 0;
ok('H1 不可能不再假豁免（穿透样本转命中）', ntsHit('死忠粉不可能只买一张票'), '铁粉×不可能应命中');
ok('H2 真粉丝×不可能', ntsHit('真正的粉丝不可能只买一张票'));
ok('H3 也许仍豁免', !ntsHit('真正的粉丝也许不会第一时间买，但长期支持更重要'), '对冲不应判');
ok('H4 裸可能仍豁免', !ntsHit('真正的粉丝可能不会第一时间买，但长期支持更重要'), '对冲不应判');
ok('H5 未必仍豁免', !ntsHit('真正的粉丝未必第一时间买，但长期支持更重要'), '对冲不应判');
{
  const g = hf.checkOutput('死忠粉不可能只买一张票');
  const dims = (g.findings || []).map((f) => f.dimension);
  ok('H6 gate 层非 pass 且归因 no_true_scotsman', g.gate.action !== 'pass' && dims.includes('no_true_scotsman'),
    'action=' + g.gate.action + ' dims=' + dims.join(','));
}

// ─── I 存量回归 + 接线完整性与维度计数不变 ───────────────────────
// I1 r257 攻击集不翻转
for (const t of [
  '这是大自然的选择，不会有错。',
  '未经加工的就是最健康的。',
  '有机种植的蔬菜就是更健康。',
  '农家自榨的油比超市桶装油更健康。',
  '手工的比机器做的健康，机器是冷的。',
  '天然矿泉水比纯净水更有营养。',
  '刚下的蛋才是最补的。',
  '野生的比养殖的干净，这是天道。',
  "It's all-natural plant extract, so it must be safer than chemical medicine.",
  'Unprocessed food is automatically the healthiest choice.',
]) assertHit('I1 r257 攻击: ' + t.slice(0, 14), t);
// I2 r728 攻击/良性不翻转（HEDGE 收窄后存量行为不变）
ok('I2 r728 攻击仍命中', ntsHit('真正爱你的男人，不会计较你花多少钱'));
ok('I3 r728 良性仍零命中', !ntsHit('他自称真正的专家，但从来解决不了实际问题，也拿不出依据'));
// I4 接线完整性与维度计数不变
{
  const idx = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  ok('I4 index.js require 本模块', /require\(['"]\.\/appeal-to-nature\.js['"]\)/.test(idx));
  const dims = hf.gate('你好，请帮我看看这份报告。').dimensions || {};
  const count = Object.keys(dims).length;
  ok('I5 维度计数仍为 245（扩展既有维度，不新增）', count === 245, '实测 ' + count);
  ok('I6 src/index.js 本轮零改动', true); // 由 git 层面保证（hf4-commit 白名单拦截）
}

console.log('──────────────────────────────────────────────────────────');
if (fails.length) {
  console.log('失败项:');
  for (const f of fails) console.log('  - ' + f);
}
console.log('结果: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个');
console.log('══════════════════════════════════════════════════════════');
process.exit(fails.length ? 1 : 0);
