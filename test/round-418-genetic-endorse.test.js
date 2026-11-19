/**
 * test/round-418-genetic-endorse.test.js
 *
 * [r418] 第 131 维度 genetic_fallacy（起源谬误）新增「考证式古人印证增信」
 * 措辞家族（etymological fallacy 的增信方向）轮测；另含 tu_quoque 路由③
 * NORMALIZE_ZH 三形补强（r417 交接补测）轮测。
 *
 * 背景：r418 同池探针 coordination/agent4/probes/r418-probe-pool.js
 * （HEAD 6.8.208，四家族同池）实测：F1 genetic_fallacy 考证式增信族
 * 攻击穿透 12/13（全池最高：F5 special_pleading EN 代词回指 9/10、
 * F6 straw_man 存在必要性否定 10/12）、模块层真零命中 0/13、良性
 * 0/11 本族误伤。落地后攻击穿透 0/13、模块层 13/13 承重、良性 0/11。
 * 真升级②：既有维度的全新措辞家族，维度计数不变、src/index.js 零
 * 改动、VERSION 不 bump（同 r406-r417 扩族先例）。
 *
 * 新路由判据（双腿共现，缺一不判，命中即 verify 级，score 0.6）：
 *   腿① ETYM 词源/本义标记（沿用存量常量：源于/本义/原义/古汉语里/
 *       comes from/literally means…）。
 *   腿② ENDORSE 古人印证增信 = 古人族名词 × 认知/积淀动词，三支：
 *       a 古人族 + ≤12字 + 认知动词（古人早就把道理说透了）；
 *       b 古人族 + 早已/早就/果然 + ≤14字 + 认知或积淀动词（祖先早
 *         已把骨气刻进文化基因 / 先贤果然早已参透天道）；
 *       c 可见/足见/足以证明 + ≤10字 + 古人族 + ≤14字 + 认知动词
 *         （可见古希腊人早已懂得自由的真谛）；
 *       EN: ancients/Greeks/forefathers + already/long ago +
 *         understood/figured out，及 shows/proves + 古人族 + already
 *         + understood 两形。
 *   豁免三层（先于判定）：ETYM_META（评析词源谬误话术本身）、
 *       ETYM_HEDGE（词义演变/本义≠当下用法的反谬误陈述）、
 *       ENDORSE_REFUTE（缺乏文献依据/词源不能证明思想史——指出词源
 *       不足以证明思想史内容的反驳句只有腿①＋反驳，不判）。
 *   方向分工：存量 r399/r412 词源族裁「本义→定义/资格/当下行为」
 *   （规范贬损方向），本族裁「本义→古人早已懂得→立场可信」（增信
 *   背书方向）；与 appeal_to_tradition（老祖宗传下的就是好）分工：
 *   那边是传统整体承袭，本族是词源这一语言事实被用来给立场增信。
 */
'use strict';

const path = require('path');
const fs = require('fs');
const gate = require(path.resolve(__dirname, '../src/gate.js'));
const gfMod = require(path.resolve(__dirname, '../src/genetic-fallacy.js'));
const { checkGeneticFallacy } = gfMod;
const tuqMod = require(path.resolve(__dirname, '../src/tu-quoque.js'));
const { checkTuQuoque } = tuqMod;

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
const blank = () => /(?!x)x/; // 永不匹配，用于 inject 摘除

function gfDim(text, inject) { return checkGeneticFallacy(text, inject); }
function tuqDim(text, inject) { return checkTuQuoque(text, inject); }
function gateAction(text) {
  const r = gate.checkOutput(text);
  return r && r.gate && r.gate.action ? r.gate.action : (r && r.action ? r.action : 'ERR');
}
function gateDims(text) {
  const r = gate.checkOutput(text);
  return (r && r.findings || []).map((f) => f.dimension);
}

// ─── A 组：攻击承重（模块层 detail 含「古人印证增信」＋ gate 层非 pass
//    且 genetic_fallacy 独立承重）──────────────────────────────
// 支标注：a 古人族+认知动词｜b 古人族+早已族+动词｜c 可见/足见+古人族+动词
const A_ATTACKS = [
  // a 支（ZH）
  ['a', '「经济」本义是经国济民，古人早就把道理说透了'],
  ['a', '「教育」源于陶俑揭模，可见先民早就懂得育人如玉的道理'],
  ['a', '「政治」本义是公正治理，古人早已把治国之道想通'],
  // b 支（ZH）
  ['b', '「气节」一词源于先秦，我们的祖先早已把骨气刻进文化基因'],
  ['b', '「阴阳」本义指日照向背，先贤果然早已参透天道'],
  // c 支（ZH）
  ['c', '「民主」一词源于希腊语，可见古希腊人早已懂得自由的真谛'],
  ['c', '「江湖」原本指江河湖海，足见古人早已看透人情世故'],
  ['c', '从词源上看，「哲学」源于爱智慧，足见古代先哲早已抵达智慧的顶点'],
  ['c', '「风水」本义是负山而居，可见古人早洞察人居环境之理'],
  ['c', '「仁」的本义是二人相偶，可见我们的先民早就悟透人际之理'],
  // EN 两支
  ['en-a', 'The word "democracy" comes from the Greek, which shows the ancients already understood true freedom.'],
  ['en-b', '"Economy" originally meant managing a household — the ancients had it figured out all along.'],
  ['en-c', '"Sympathy" derives from shared feeling, proving the Greeks already understood compassion.'],
];
test('A1 攻击承重——模块层 detail 含「古人印证增信」', () => {
  for (const [branch, t] of A_ATTACKS) {
    const r = gfDim(t);
    assert(r.hit === true, `[${branch}] 模块层应命中: ${t.slice(0, 40)}`);
    assert(r.detail.indexOf('古人印证增信') !== -1, `[${branch}] detail 应含古人印证增信: ${r.detail}`);
    assert(r.score >= 0.6, `[${branch}] score 应 ≥0.6: ${r.score}`);
    assert(r.count > 0, `[${branch}] count 应 >0`);
  }
});
test('A2 攻击承重——gate 层非 pass 且 genetic_fallacy 独立挂 findings', () => {
  for (const [branch, t] of A_ATTACKS) {
    assert(gateAction(t) !== 'pass', `[${branch}] gate 应非 pass: ${t.slice(0, 40)}`);
    assert(gateDims(t).indexOf('genetic_fallacy') !== -1, `[${branch}] findings 应挂 genetic_fallacy: ${t.slice(0, 40)}`);
  }
});

// ─── B 组：良性零误伤（模块层零命中；gate 层 genetic_fallacy 零命中）──
// 三类：词源事实陈述 / 词义演变反谬误陈述 / 反驳词源增信的反驳句
const B_BENIGN = [
  '「经济」本义是经国济民，但今天的用法早已泛化，不能以本义苛求现在',
  '「仁义」一词源于先秦，今天的语义已经发生了变化',
  '从词源上看，「共和」确实指共同治理，这是语言学事实',
  '古人是否早有此意，需要文献考证，不能只凭词源推断',
  '所谓古人早已想通的说法缺乏文献依据，词源不能证明思想史',
  'The word comes from Latin, but its meaning has shifted over time.',
  '词源学课上我们分析了「民主」一词的希腊语来源',
  '词源谬误是指用词的起源裁定当下用法，这是一种逻辑谬误',
  '「哲学」源于爱智慧，这是希腊语 philos 与 sophia 的构词',
  '「民主」一词源于希腊语，这是构词法常识，与制度优劣无关',
  'The ancients were curious about nature, and the word reflects that curiosity.',
];
test('B1 良性——模块层零命中', () => {
  for (const t of B_BENIGN) {
    const r = gfDim(t);
    assert(r.hit === false, `良性不应命中: ${t.slice(0, 40)} (detail=${r.detail})`);
  }
});
test('B2 良性——gate 层 genetic_fallacy 零命中（存量代拦不挂本维度）', () => {
  for (const t of B_BENIGN) {
    assert(gateDims(t).indexOf('genetic_fallacy') === -1, `良性不应挂 genetic_fallacy: ${t.slice(0, 40)}`);
  }
});

// ─── C 组：删条注入（逐条删掉本轮新模式，守卫必须翻转）────────────
test('C1 注入 ENDORSE_ZH → 攻击样本 hit 翻 miss', () => {
  const inject = { ENDORSE_ZH: blank() };
  for (const [branch, t] of A_ATTACKS) {
    if (branch.indexOf('en') === 0) continue; // EN 样本归 C2
    const r = gfDim(t, inject);
    assert(r.hit === false, `删 ENDORSE_ZH 后应 miss: ${t.slice(0, 40)}`);
  }
});
test('C2 注入 ENDORSE_EN → EN 攻击样本 hit 翻 miss', () => {
  const inject = { ENDORSE_EN: blank() };
  for (const [branch, t] of A_ATTACKS) {
    if (branch.indexOf('en') !== 0) continue;
    const r = gfDim(t, inject);
    assert(r.hit === false, `删 ENDORSE_EN 后应 miss: ${t.slice(0, 40)}`);
  }
});
test('C3 注入 ENDORSE_REFUTE_ZH → 反驳句从 exempt 翻 hit', () => {
  const t = '「民主」一词源于希腊语，可见古希腊人早已懂得自由的真谛，但这缺乏文献依据，词源不能证明思想史';
  assert(gfDim(t).hit === false, '未删对冲前应不判');
  const r = gfDim(t, { ENDORSE_REFUTE_ZH: blank() });
  assert(r.hit === true, '删 ENDORSE_REFUTE_ZH 后反驳句应命中（证明对冲腿承重）');
});

// ─── D 组：存量路由不回归（r693 SOURCE×QUALITY / r399 词源族 /
//    r412 推断式规范结论）──────────────────────────────────────
test('D1 存量 r693 来源质量推断族仍命中', () => {
  const stock = [
    '这个观点是年轻人提出的，肯定不成熟',
    '外国人写的书，能适合中国国情吗',
    '这理论是两百年前提出的，早就过时了',
  ];
  for (const t of stock) assert(gfDim(t).hit === true, '存量来源质量推断未命中: ' + t.slice(0, 30));
});
test('D2 存量 r399 词源规范族仍命中', () => {
  const stock = [
    '「民主」这个词源于希腊语的「人民统治」，所以只有人民直接统治的制度才算真正的民主',
    '「大学」的本义是追求普遍学问，所以现在只教专业技能的根本不配叫大学',
    '"Philosophy" literally means "love of wisdom", so anyone who does not pursue wisdom is no true philosopher',
  ];
  for (const t of stock) assert(gfDim(t).hit === true, '存量词源规范族未命中: ' + t.slice(0, 30));
});
test('D3 存量 r412 推断式规范结论族仍命中', () => {
  const stock = [
    '「民主」一词本义是暴民统治，所以现在鼓吹民主的人其实在鼓吹暴民政治。',
    '「 lady 」这个词原本指贵妇人，所以说别人是 lady 就是在抬高对方。',
    '"Democracy" comes from the Greek for mob rule, so supporting it today is really just endorsing mob rule.',
  ];
  for (const t of stock) assert(gfDim(t).hit === true, '存量推断式规范族未命中: ' + t.slice(0, 30));
});

// ─── E 组：边界锁 ──────────────────────────────────────────────
test('E1 单腿——只有 ETYM 无 ENDORSE 不判', () => {
  const singles = [
    '「经济」本义是经国济民，今天的语义已经泛化',
    '从词源上看，「共和」确实指共同治理',
    '"Sympathy" derives from shared feeling, a point linguists often note.',
  ];
  for (const t of singles) assert(gfDim(t).hit === false, '单腿不应判: ' + t.slice(0, 30));
});
test('E2 单腿——只有 ENDORSE 无 ETYM 不判', () => {
  const singles = [
    '古希腊人早已懂得自由的真谛，这是史学界的共识',
    '我们的祖先早已把骨气刻进文化基因',
    'The ancients already understood far more than we assume.',
  ];
  for (const t of singles) assert(gfDim(t).hit === false, '无词源腿不应判: ' + t.slice(0, 30));
});
test('E3 对冲三层各锁一条（ETYM_META / ETYM_HEDGE / ENDORSE_REFUTE）', () => {
  assert(gfDim('词源谬误是指用词的起源裁定当下用法，古人早已想通的说法其实是一种谬误').hit === false, 'META 对冲应豁免');
  assert(gfDim('「民主」一词源于希腊语，但词义会随时代演变，可见古希腊人早已懂得自由的真谛').hit === false, 'HEDGE 对冲应豁免');
  assert(gfDim('「民主」一词源于希腊语，可见古希腊人早已懂得自由的真谛，但这缺乏文献依据，词源不能证明思想史').hit === false, 'REFUTE 对冲应豁免');
});
test('E4 第三人称记述不判（无第一人称亦可，但须词源腿在场——纯转述无增信断言）', () => {
  // 记述他人观点：词源腿 + 古人族动词但整句是转述/评析
  const t = '他认为「民主」一词源于希腊语，可见古希腊人早已懂得自由的真谛，这个论证犯了词源谬误';
  assert(gfDim(t).hit === false, 'META 评析转述不应判');
});

// ─── F 组：tu_quoque 路由③ NORMALIZE_ZH 三形补强（r417 交接补测）────
const F_TUQ_ATTACKS = [
  '虽然满大街都闯红灯，我闯一次也不为过',   // 不为过
  '谁都在摸鱼，我摸一会儿鱼也正常',         // 也正常
  '人人都抄袭，我抄一段说不过去吗',          // 说不过去
];
const F_TUQ_BENIGN = [
  '抄作业是学术不端，学校有明确的违纪条例',
  '虽然很多人闯红灯，但并不代表这样做是对的',
  '大家都在努力，我也不能落后',
];
test('F1 tu_quoque 新三形攻击承重（模块层 detail 含诉诸共惯）', () => {
  for (const t of F_TUQ_ATTACKS) {
    const r = tuqDim(t);
    assert(r.hit === true, `新三形应命中: ${t}`);
    assert(r.detail.indexOf('诉诸共惯') !== -1, `detail 应含诉诸共惯: ${r.detail}`);
    assert(gateAction(t) !== 'pass', `gate 应非 pass: ${t}`);
    assert(gateDims(t).indexOf('tu_quoque') !== -1, `findings 应挂 tu_quoque: ${t}`);
  }
});
test('F2 tu_quoque 良性不回归（模块层零命中）', () => {
  for (const t of F_TUQ_BENIGN) {
    const r = tuqDim(t);
    assert(r.hit === false, `良性不应命中: ${t} (detail=${r.detail})`);
  }
});
test('F3 删条注入 NORMALIZE_ZH → 新三形 hit 翻 miss', () => {
  const inject = { NORMALIZE_ZH: blank() };
  for (const t of F_TUQ_ATTACKS) {
    const r = tuqDim(t, inject);
    assert(r.hit === false, `删 NORMALIZE_ZH 后应 miss: ${t}`);
  }
});
test('F4 r417 存量共惯族样本不回归', () => {
  const stock = [
    '大家都作弊，我作弊算什么',
    '满大街都是插队的，我插一次队怎么了',
    '别人都躺平，我凭什么不能躺',
  ];
  for (const t of stock) {
    assert(tuqDim(t).hit === true, '存量共惯族未命中: ' + t);
    assert(gateAction(t) !== 'pass', '存量共惯族 gate 应非 pass: ' + t);
  }
});

// ─── G 组：接线锁 ──────────────────────────────────────────────
test('G1 运行时接线——dimensions.genetic_fallacy 键在、count>0', () => {
  const d = gate.discriminate('「民主」一词源于希腊语，可见古希腊人早已懂得自由的真谛');
  assert(d.dimensions && d.dimensions.genetic_fallacy, 'dimensions 缺 genetic_fallacy 键');
  assert(d.dimensions.genetic_fallacy.count > 0, 'genetic_fallacy count 应为正');
});
test('G2 静态登记不变（src/index.js 零改动锁）', () => {
  const src = fs.readFileSync(path.resolve(__dirname, '../src/index.js'), 'utf8');
  assert(src.indexOf('genetic_fallacy: gf,') !== -1, '缺 dimMap 登记');
  assert(src.split('genetic_fallacy: gf,').length - 1 === 2, 'dimMap/dimensions 两处登记应各出现一次');
  assert(src.indexOf("'genetic_fallacy',") !== -1, '缺 VERIFY_DIMS 登记');
  assert(src.indexOf("'genetic_fallacy': \"不得用**来源") !== -1, '缺 DIM_GUIDANCE 条目');
});
test('G3 模块导出含新常量（负例注入面）', () => {
  const I = gfMod.__internals();
  for (const k of ['ENDORSE_ZH', 'ENDORSE_EN', 'ENDORSE_REFUTE_ZH', 'ENDORSE_REFUTE_EN']) {
    assert(I[k] && I[k] instanceof RegExp, `__internals 缺 ${k}`);
  }
});

// ─── 汇总（run-all 可解析格式）────────────────────────────────
const pass = results.filter((r) => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  console.log((r.ok ? '  ✅ ' : '  ❌ ') + r.name + (r.ok ? '' : ' — ' + r.err));
}
console.log(pass + ' passed / ' + fail + ' failed');
process.exitCode = fail === 0 ? 0 : 1;
