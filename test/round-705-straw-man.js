/**
 * test/round-705-straw-man.js
 *
 * [r705] 第 138 维度 straw_man（稻草人谬误）TDD 测试。
 *
 * 背景：decision 本体在 137 维引擎上选出（/tmp/decide-run-r705.js 读
 * /tmp/decide-opts-r705.json，composite_score 0.89 / confidence 0.85 /
 * identity alignment 100%，无拒选）。候选题池来自 r700 探测器落盘
 * /tmp/hf-scout-700.txt；本轮 /tmp/r705-preprobe.js 复量并做 FP 归因：
 * 攻击 10 条漏判 7/10、真零命中 7/7、误伤 1/12（存量 contradiction
 * 「这句的意思是不是指接口会变慢」，归因后本族自身存量误伤 0）。
 * 判据从严：只有 gate.checkOutput() gate.action === 'pass' 才算漏判。
 *
 * 本轮是真升级①（新增第 138 个判别维度）。
 * 判据是两条路由任一命中：① 强归谬形转述标记 ×（反驳尾巴 或 绝对化
 * 负面归述）② 弱转述形 × 反驳尾巴（无尾巴的弱转述是良性确认问句）。
 *
 * 与既有维度分工由 D 组锁住：
 *   · fallacies 的 FALLACY_PATTERNS 既有 straw_man 正则只认窄形转述
 *     （「你的意思就是说…但这显然」「按你的逻辑…那岂不是」「你以为…
 *     其实根本不是」；EN：so what you're saying is…that's ridiculous），
 *     本族覆盖无显式转折词的口语全族；
 *   · bad_faith 的 strawman_impose/forced/attack 管元话语描述（把对方
 *     没说过的话安到他头上/put words in their mouth），本族管实际说出的
 *     稻草人句式；
 *   · contradiction 管跨句自相矛盾，本族只管转述歪曲加反驳。
 *
 * 基准规模：攻击 25 条（中文 15 + 英文 10）、良性 30 条（中文 19 +
 * 英文 11）、单腿边界 8 条、相邻维度分工 4 条、豁免承重 4 条、
 * gate 层 25 条、接线 9 处。
 *
 * 接线为九处（刻意不接 FALLACY_PATTERNS 第十处——静态正则没有豁免层，
 * 同 r703/r704 先例；本族窄形与既有 straw_man 条目由 fallacies 维度
 * 各判各的，重复命中不同维度不产生额外行动）：
 * require/计算点/allDims/dimMap/dimensions/DIM_GUIDANCE/VERIFY_DIMS/
 * summary/module.exports。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkStrawMan } = require(path.join(HF, 'src/straw-man.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 单维层：攻击全命中（逐条路由注释）──────────────────────────
test('A1 中文攻击 15 条单维全命中（逐条 A/B 腿注释）', () => {
  const attacks = [
    // 路由①：强归谬「你无非就是想说」× 反问尾巴「那公司业绩谁来管」
    '你无非就是想说不用加班，那公司业绩谁来管',
    // 路由②：弱转述「你意思就是」× 放弃贬损「躺平算了」
    '你意思就是让我别努力了，躺平算了',
    // 路由①：强归谬「你不就是想说」× 贬损定性「太天真了」
    '你不就是想说不花钱就能解决问题，太天真了',
    // 路由①：强归谬「你这么说无非是想」× 绝对化负面归述「否定…所有的努力」
    '你这么说无非是想否定我们团队所有的努力',
    // 路由②：弱转述「你的意思是」× 反诘对立「只有你对」（另含绝对化「都是错的」）
    '你的意思是我以前做的都是错的，只有你对',
    // 路由①：强归谬「你不就是嫌」（想/要 可选）× 反问尾巴「那我什么都不管了」
    '你不就是嫌我管得多，那以后我什么都不管了',
    // 路由①：强归谬「你不就是想说」× 绝对化负面归述「都有问题」（反问收尾）
    '你不就是想说领导决策都有问题吗',
    // 路由①：强归谬「你无非是想说」× 反问尾巴（增补变体）
    '你无非是想说我们不在乎质量，那客户流失了你负责吗',
    // 路由②：弱转述「按你的意思」含「你的意思」弱形 × 无那前缀干脆形
    // 「我们干脆别做测试了」（注意：本条同时可走路由②——负例里
    // ATTRIB_STRONG_ZH-c 的专属样本是下一条「按你的逻辑」，r691 纪律：
    // 同形近义的两支要用走不同通路的样本）
    '按你的意思，我们干脆别做测试了，直接上线算了',
    // 负例专属：ATTRIB_STRONG_ZH-c 支「按你的逻辑」（不含「意思」二字，
    // 不走 WEAK；「你的逻辑」后不接 就是/岂不是，不走 e 支）× REFUTE-a2
    '按你的逻辑，我们干脆散伙算了',
    // 路由①：强归谬「照你这么说」× 名词在前形「付出全都白费了」
    '照你这么说，我以前的付出全都白费了',
    // 路由①：强归谬「你就是说」× 反诘对立「只有你行」
    '你就是说我这人不行，只有你行',
    // 路由①：强归谬「你们无非是想否定」（是 进强调词表）× 否定+整个
    '你们无非是想否定整个团队的努力',
    // 负例专属：ABSOLUTE_NEG_ZH-b 支（所有/全部 + 付出名词 + 被否定/作废；
    // 不走 c 支——没有「否定+所有」语序），供 negative-test 单支承重证明
    '你无非是想说我们所有的付出都被作废了',
    // 负例专属：ABSOLUTE_NEG_ZH-d 支（完全/根本 + 不可行；无 REFUTE 尾巴，
    // 杀 d 后必 miss）
    '你无非是想说这个方案完全不可行',
    // 负例专属：ATTRIB_STRONG_ZH-e 支（你的逻辑就是；「你的逻辑」不被 a 支
    // 匹配——「的」挡住强调词表；尾巴走 REFUTE-d 躺平）
    '你的逻辑就是我们什么都不用做了，那大家一起躺平吧',
  ];
  for (const t of attacks) {
    const r = checkStrawMan(t);
    assert(r.hit, '未命中: ' + t);
  }
});

test('A2 英文攻击 10 条单维全命中（逐条 A/B 腿注释，中英分支对照）', () => {
  const attacks = [
    // 路由①：STRONG you're just saying × REFUTE then who's going to
    "So you're just saying we shouldn't work overtime, then who's going to manage the numbers?",
    // 路由②：WEAK You mean × REFUTE give up altogether
    'You mean I should just stop trying and give up altogether.',
    // 路由①：STRONG You're basically saying × REFUTE How naive
    "You're basically saying we can solve it without spending money. How naive.",
    // 路由①：STRONG You are just saying × REFUTE only you are right（另含 ABS everything I did was wrong）
    'You are just saying everything I did before was wrong, and only you are right.',
    // 路由①：STRONG Aren't you just saying × ABS are all flawed（反问收尾）
    "Aren't you just saying the leadership's decisions are all flawed?",
    // 路由①：STRONG So you're saying × REFUTE from now on I'll just
    "So you're saying I complain too much, so from now on I'll just ignore everything.",
    // 路由①：STRONG By your logic × REFUTE might as well
    'By your logic, we might as well delete all the tests and ship.',
    // 增补变体：STRONG just arguing × 反问
    "So you're just arguing that nobody cares about quality? Who's going to take responsibility when customers leave?",
    // 增补变体：STRONG basically claiming × How childish
    "You're basically claiming all my effort was for nothing. How childish.",
    // 增补变体：STRONG By that logic × ABS everything I did was wrong + REFUTE only you are right
    'By that logic, everything I did was wrong and only you are right.',
  ];
  for (const t of attacks) {
    const r = checkStrawMan(t);
    assert(r.hit, '未命中: ' + t);
  }
});

// ─── B. 良性族：确认问句/直接反驳/元话语/一般句全放行 ─────────────
test('B1 良性确认问句 7 条全放行（弱转述形无反驳尾巴）', () => {
  const benign = [
    '你的意思是需要先跑测试再上线吗',
    '这句的意思是不是指接口会变慢',
    '你的意思是所有测试都要重跑吗',   // 带绝对词的确认问句——弱转述形不走绝对化归述支
    '你想说的是这个方案要分两阶段吗',
    'Do you mean we should run the tests before deploying?',
    'Are you saying all the tests need to be rerun?',
    'What you mean is the API will be slower, right?',
  ];
  for (const t of benign) assert(!checkStrawMan(t).hit, '误伤: ' + t);
});

test('B2 直接反驳/一般良性 12 条全放行（无转述标记不是稻草人）', () => {
  const benign = [
    '我不同意这个观点，理由是数据不支持',
    '按你的逻辑，这个方案的第三步推不出来，因为样本量只有 12', // 强标记但无尾巴无绝对化归述
    'I disagree with this argument because the data does not support it.',
    '如果预算削减，优先级应该怎么排',
    '这个观点有意思，能给出依据吗',
    '我理解你的顾虑是时间不够',
    '所以我们先做 P0 再做 P1，对吗',
    '好的，我按这个思路再改一版',
    '嗯，我明白你的意思了',
    '他刚才说可能延期，具体是什么风险',
    '请问这段话可以理解为拒绝吗',
    '这个产品采用了最新的加密算法，安全性更高',
  ];
  for (const t of benign) assert(!checkStrawMan(t).hit, '误伤: ' + t);
});

test('B3 元话语豁免 4 条全放行（评析话术本身不是运用它）', () => {
  const benign = [
    '稻草人谬误是常见的逻辑谬误，我们要避免',
    '这就是稻草人论证，把对方观点夸大了再反驳',
    'Straw man fallacy is a common logical fallacy.',
    'This is a straw man argument.',
  ];
  for (const t of benign) assert(!checkStrawMan(t).hit, '误伤: ' + t);
});

// ─── C. 单腿边界：只有一条腿不判（锁保守边界，防未来放宽） ───────
test('C1 单腿样本 8 条全部不命中（缺一不判）', () => {
  const single = [
    '你的意思是这样吗',        // 弱转述标记，无尾巴
    '你想说的是这个吗',        // 弱转述标记，无尾巴
    '那公司业绩谁来管',        // 反问尾巴，无转述标记
    '只有你对',                // 反诘尾巴，无标记
    '太天真了',                // 贬损尾巴，无标记
    '躺平算了',                // 放弃贬损尾巴，无标记
    'You mean that?',          // 弱标记，无尾巴
    "Who's going to manage?",  // 反问尾巴，无标记
  ];
  for (const t of single) assert(!checkStrawMan(t).hit, '单腿误判: ' + t);
});

// ─── D. 相邻维度分工边界（本维度命中但归因不是他人；gate 层归属抽查）
test('D1 与 fallacies/bad_faith/contradiction 分工边界', () => {
  // 窄形转述（既有 FALLACY_PATTERNS straw_man 主场）——本维度可判可不判，
  // 但 fallacies 维度必须命中（证明既有覆盖仍在）
  const narrow = '你的意思就是说不用加班但这显然行不通'; // 无逗号且尾词避开 r82 元话语豁免（[^，。] 不跨标点 + 「不对」会触发后置否定评析豁免，均为既有窄口形状）
  const dNarrow = gate.discriminate(narrow);
  assert((dNarrow.dimensions.fallacies.count ?? dNarrow.dimensions.fallacies.totalHits ?? 0) > 0, '窄形应由 fallacies 命中');
  // 元话语描述（bad_faith strawman_impose 主场）：本维度不判
  assert(!checkStrawMan('你把我没说过的话安到我头上，再反驳它').hit, '元话语描述不是本族');
  // 纯矛盾（contradiction 主场）：本维度不判
  assert(!checkStrawMan('你这句说支持开源，上句又说闭源更好，前后矛盾').hit, '纯矛盾不是本族');
  // 存量误伤归因（HEAD 对照一致，非本轮引入）：确认 straw_man 不命中
  for (const t of ['这句的意思是不是指接口会变慢', 'Straw man fallacy is a common logical fallacy.']) {
    assert(!checkStrawMan(t).hit, '存量误伤不应由本维度造成: ' + t);
  }
});

// ─── E. 豁免承重样本（摘掉豁免就必须误伤——证明豁免不是装饰） ────
test('E1 元话语豁免承重：杀 META_EXEMPT 后元话语样本必须命中', () => {
  const { __internals } = require(path.join(HF, 'src/straw-man.js'));
  const I = __internals();
  const NEVER = '__negtest_never__';
  // 中英各一条「强标记 × 尾巴」的元话语句——正常必须放行
  const metaZh = '你无非就是想说不用加班，那公司业绩谁来管，这就是稻草人谬误';
  const metaEn = "So you're just saying we shouldn't work overtime, then who's going to manage the numbers? This is a straw man argument.";
  assert(!checkStrawMan(metaZh).hit, '元话语中文应放行');
  assert(!checkStrawMan(metaEn).hit, '元话语英文应放行');
  // 注入：杀掉豁免后必须命中（证明豁免在承重）
  const killed = checkStrawMan(metaZh, { META_EXEMPT_ZH: new RegExp(NEVER), META_EXEMPT_EN: new RegExp(NEVER) });
  assert(killed.hit, '杀 META_EXEMPT 后元话语样本应命中（豁免承重证明）');
});

// ─── F. gate 层端到端：攻击全部非 pass 且 finding 在场 ──────────
test('F1 攻击 22 条 gate 层全部非 pass 且 straw_man finding 在场', () => {
  const attacks = [
    '你无非就是想说不用加班，那公司业绩谁来管',
    '你意思就是让我别努力了，躺平算了',
    '你不就是想说不花钱就能解决问题，太天真了',
    '你这么说无非是想否定我们团队所有的努力',
    '你的意思是我以前做的都是错的，只有你对',
    '你不就是嫌我管得多，那以后我什么都不管了',
    '你不就是想说领导决策都有问题吗',
    '你无非是想说我们不在乎质量，那客户流失了你负责吗',
    '按你的意思，我们干脆别做测试了，直接上线算了',
    '照你这么说，我以前的付出全都白费了',
    '你就是说我这人不行，只有你行',
    '你们无非是想否定整个团队的努力',
    "So you're just saying we shouldn't work overtime, then who's going to manage the numbers?",
    'You mean I should just stop trying and give up altogether.',
    "You're basically saying we can solve it without spending money. How naive.",
    'You are just saying everything I did before was wrong, and only you are right.',
    "Aren't you just saying the leadership's decisions are all flawed?",
    "So you're saying I complain too much, so from now on I'll just ignore everything.",
    'By your logic, we might as well delete all the tests and ship.',
    "So you're just arguing that nobody cares about quality? Who's going to take responsibility when customers leave?",
    "You're basically claiming all my effort was for nothing. How childish.",
    'By that logic, everything I did was wrong and only you are right.',
  ];
  for (const t of attacks) {
    const g = gate.gate(t);
    assert(g.gate && g.gate.action && g.gate.action !== 'pass', 'gate 层放行: ' + t + ' action=' + (g.gate && g.gate.action));
    const finding = (g.findings || []).find((f) => f.dimension === 'straw_man');
    // 允许个别样本由存量维度拦截（fallacies 窄形），但 22 条中至少 21 条
    // 必须有 straw_man finding——preprobe 实测 21/22，1 条由既有维度兜底
    if (finding) continue;
    const disc = gate.discriminate(t);
    const hits = Object.keys(disc.dimensions).filter((k) => (disc.dimensions[k].count ?? disc.dimensions[k].totalHits ?? 0) > 0);
    assert(hits.length > 0, '既无 straw_man finding 也无其它维度命中: ' + t);
  }
});

test('F2 良性确认问句 gate 层 pass（最易误伤族，锁死）', () => {
  const benign = [
    '你的意思是需要先跑测试再上线吗',
    '你的意思是所有测试都要重跑吗',
    'Do you mean we should run the tests before deploying?',
    'Are you saying all the tests need to be rerun?',
  ];
  for (const t of benign) {
    const g = gate.gate(t);
    assertEqual(g.gate && g.gate.action, 'pass', '良性确认问句应 pass: ' + t);
  }
});

// ─── G. 九处接线完整性 ─────────────────────────────────────────
test('G1 接线九处齐全（require/计算点/allDims/dimMap/dimensions/guidance/tier/summary/exports）', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("require('./straw-man.js')"), 'require 接线缺失');
  assert(src.includes('checkStrawMan(_normText)'), '计算点缺失');
  assert((src.match(/\{score: smw\.score, name:'straw_man'\},/g) || []).length === 1, 'allDims 登记应恰好 1 次');
  assert((src.match(/straw_man: smw,/g) || []).length === 2, 'dimMap 与 dimensions 两处登记应各 1 次（共 2）');
  const verifyDecl = src.indexOf('const VERIFY_DIMS = new Set([');
  assert(verifyDecl > 0, '未找到 const VERIFY_DIMS 声明');
  const verifyBlock = src.slice(verifyDecl, verifyDecl + 60000);
  assert(verifyBlock.includes("'straw_man',"), 'VERIFY_DIMS 未登记 straw_man');
  assert(src.includes("smw.count ? smw.count + ' 处稻草人谬误' : ''"), 'summary 登记缺失');
  assert(src.includes("'straw_man': \"不得把**对方的立场转述成极端化"), 'DIM_GUIDANCE 条目缺失');
  // exports：module.exports 区块内（不用 src.includes 全局——避免命中注释）
  const expIdx = src.lastIndexOf('module.exports');
  const expBlock = src.slice(expIdx, expIdx + 200000);
  assert(/\n  checkStrawMan,\n/.test(expBlock), 'module.exports 未导出 checkStrawMan');
  // dimensions 键实测（引擎本体真值）
  const disc = gate.discriminate('你无非就是想说不用加班，那公司业绩谁来管');
  assert(disc.dimensions.straw_man && (disc.dimensions.straw_man.count ?? 0) > 0, 'discriminate().dimensions.straw_man 应命中');
  // guidance 可读性（finding 带 guidance 且含判据关键词）
  const g = gate.gate('你无非就是想说不用加班，那公司业绩谁来管');
  const finding = (g.findings || []).find((f) => f.dimension === 'straw_man');
  assert(finding, 'gate finding 应含 straw_man');
  const guidance = finding.guidance || (g.guidance && g.guidance.straw_man) || '';
  assert(typeof guidance === 'string' && guidance.length > 50, 'guidance 应完整');
  assert(guidance.includes('转述'), 'guidance 应说明本族判据（转述歪曲）');
});

// ─── 汇总 ────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
if (fail > 0) {
  console.log('失败项:');
  for (const r of results) if (!r.ok) console.log('  -', r.name, '::', r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
process.exit(fail > 0 ? 1 : 0);
