/**
 * test/round-706-appeal-to-nature.js
 *
 * [r706] 第 139 维度 appeal_to_nature（诉诸自然谬误）TDD 测试。
 *
 * 背景：decision 本体在 138 维引擎上选出（/tmp/decide-run-706.js 读
 * /tmp/decide-opts-706.json，composite_score 0.92 / confidence 0.9 /
 * identity alignment 100%，无拒选）。轮前探针 /tmp/r705-preprobe.js
 * 复量（样本集与 r704/r705 完全一致，跨轮可比）：攻击 10 条漏判
 * 8/10、漏判中真零命中 5/8、良性误伤 1/12 且全部归因存量维度
 * （unsupported_claim/vagueness/moral_foundations/appeal_to_authority），
 * 本族自身存量误伤 0。判据从严：只有 gate.checkOutput() gate.action
 * === 'pass' 才算漏判。Phase 1.5 同律复核：5 条真零命中样本逐条跑
 * discriminate() 全维度零命中——射程外，缺口成立。
 *
 * 本轮是真升级①（新增第 139 个判别维度）。
 * 判据是一条路由：腿①自然性断言 × 腿②优越/安全结论共现，缺一不判。
 *
 * 与既有维度分工由 D 组锁住：
 *   · moral_foundations 对 3 条本族样本有沾边命中但不在 action-forcing
 *     集合（gate.action 恒 pass），本族提供行动级 verify；
 *   · confidence/unsupported_claim/vagueness 管断言强度与模糊性，
 *     不管依据类型；
 *   · 「实验室数据显示该化合物在自然条件下会降解」被存量维度 verify，
 *     本维度对它零命中（无优越断言腿）。
 *
 * 基准规模：攻击 21 条（中文 12 + 英文 9）、良性 16 条（中文 12 +
 * 英文 4）、元话语豁免 4 条、单腿边界 8 条、相邻维度分工 4 条、
 * 豁免承重 2 条、gate 层 21 条、接线 9 处。
 *
 * 接线为九处（刻意不接 FALLACY_PATTERNS 第十处——静态正则没有豁免层，
 * 同 r703/r704/r705 先例）：
 * require/计算点/allDims/dimMap/dimensions/DIM_GUIDANCE/VERIFY_DIMS/
 * summary/module.exports。
 *
 * 实现踩坑（写入测试注释防复发）：EN 正则块首版落盘 4 连反斜杠（双层，
 * 整族恒 false）+ SUPERIOR_ZH b 支漏行首 |（粘成 a2 支后缀）——均在本
 * 轮冒烟阶段抓出并修复，修复记录见 UPGRADE_LOG r706。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const { checkAppealToNature } = require(path.join(HF, 'src/appeal-to-nature.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 单维层：攻击全命中（逐条腿①×腿②注释）──────────────────────
test('A1 中文攻击 12 条单维全命中（逐条 A/B 腿注释）', () => {
  const attacks = [
    // 腿①a 纯天然植物提取 × 腿②b 肯定比化学药安全
    '这是纯天然植物提取的，肯定比化学药安全',
    // 腿①e 老祖宗传下来+做法 × 腿②e 经过时间检验
    '老祖宗传下来的做法，自然是经过时间检验的',
    // 腿①a 全天然成分 × 腿②d 没有任何添加剂 + 腿②c 放心吃
    '全天然成分，没有任何添加剂，所以放心吃',
    // 腿①c 野生 × 腿②a 比养殖的有营养
    '这东西是野生的，比养殖的有营养',
    // 腿①d 自然熟 × 腿②a 比催熟的健康（moral_foundations 沾边样本）
    '自然熟的果子比催熟的健康，这是自然规律',
    // 腿①b 纯草本配方 × 腿②d 没有任何化学成分（无比较句的否定化工形）
    '我们这是纯草本配方，没有任何化学成分',
    // 腿①f 原始森林的空气+没有工业污染 × 腿②a 比城里的好
    '原始森林里的空气比城里的好，毕竟没有工业污染',
    // 腿①h 母乳是天然的 × 腿②b 一定比配方奶好
    '母乳是天然的，所以一定比配方奶好',
    // 腿①a 天然材质 × 腿②b 肯定更高级
    '这部手机用的是天然材质，手感肯定更高级',
    // 腿①g 自然疗法 × 腿②a 比西医副作用小
    '这个疗法用的是自然疗法，比西医副作用小',
    // 腿①c 野生 × 腿②a2 比X更+健康（a2 专属：a 支名词表无「家里养」）
    '野生的比家里养的健康',
    // 腿①c 野生 × 腿②a2 比超市买的更有营养（a2 专属：a 支名词表无「超市买」，杀 a2 必 miss）
    '野生的比超市买的更有营养',
    // 腿①b 纯草本配方 × 腿②c 放心用（c 专属：无 d 支否定化工形）
    '纯草本配方，放心用',
  ];
  for (const t of attacks) {
    const r = checkAppealToNature(t);
    assert(r.hit, '未命中: ' + t);
  }
});

test('A2 英文攻击 9 条单维全命中（中英分支对照：a-h × a-e）', () => {
  const attacks = [
    // NATURE_EN-a all-natural plant extract × SUPERIOR_EN-b must be safer than
    "It's all-natural plant extract, so it must be safer than chemical medicine.",
    // NATURE_EN-c wild-caught × SUPERIOR_EN-a more nutritious than
    'Wild-caught fish is more nutritious than farmed fish.',
    // NATURE_EN-a 100% herbal × SUPERIOR_EN-d no artificial chemicals
    'Our formula is 100% herbal with no artificial chemicals.',
    // NATURE_EN-a natural materials × SUPERIOR_EN-b definitely feels more premium
    'This phone uses natural materials, so it definitely feels more premium.',
    // NATURE_EN-f primeval forest + no industrial pollution × SUPERIOR_EN-a better than
    'The air in the primeval forest is better than the city, no industrial pollution.',
    // NATURE_EN-g natural healing × SUPERIOR_EN-a fewer side effects than（EN 副作用形）
    'Natural healing has fewer side effects than western medicine, so it is the better choice.',
    // NATURE_EN-d naturally ripened × SUPERIOR_EN-a healthier than
    'Naturally ripened fruit is healthier than the forced-ripened kind.',
    // NATURE_EN-e passed down from our ancestors × SUPERIOR_EN time-tested
    'Old-fashioned methods passed down from our ancestors are time-tested.',
    // NATURE_EN-h is natural × SUPERIOR_EN-b must be better（h 专属样本）
    "Mother's milk is natural, so it must be better than formula.",
  ];
  for (const t of attacks) {
    const r = checkAppealToNature(t);
    assert(r.hit, '未命中: ' + t);
  }
});

// ─── B. 良性族：保留语/数据请求/单腿/一般句全放行 ─────────────────
test('B1 良性 16 条全放行（保留语/数据请求/无依据腿）', () => {
  const benign = [
    // 腿①在射程内但无腿②（保留语陈述）
    '纯植物提取物也可能引起过敏反应',
    '母乳喂养有诸多益处，但并非适用于所有情况',
    // 腿①窄口外（天然林场不入 f 支的空气/环境/水表）
    '天然林场的管理需要遵守环保法规',
    // 腿①野生 × 数据对比请求（无比结构）
    '我们对比一下野生种和养殖种的营养成分数据',
    // 只有腿②无腿①
    '这个新产品采用了最新的加密算法，安全性更高',
    // 无关句
    '如何用 root 权限运行 Docker？',
    '这份年报显示公司营收增长了 12%',
    '我们的产品成分表已经标注了所有添加剂',
    '这款精华含烟酰胺成分，建议先做皮肤测试',
    '实验室数据显示该化合物在自然条件下会降解',
    '谢谢你的帮助，我理解了',
    '请问这个 API 的 rate limit 是多少？',
    // EN 对偶
    'Plant-based extracts can also cause allergic reactions.',
    'We compared the nutritional data of wild and farmed varieties.',
    'This product uses the latest encryption algorithm, so it is more secure.',
    'The compound degrades under natural conditions according to lab data.',
  ];
  for (const t of benign) assert(!checkAppealToNature(t).hit, '误伤: ' + t);
});

test('B2 元话语豁免 4 条全放行（评析话术本身不是运用它）', () => {
  const benign = [
    '诉诸自然是一种常见的逻辑谬误，我们要避免',
    '这就是自然主义谬误，把天然当成安全',
    'Appeal to nature is a common logical fallacy.',
    'This is an appeal to nature argument.',
  ];
  for (const t of benign) assert(!checkAppealToNature(t).hit, '误伤: ' + t);
});

// ─── C. 单腿边界：只有一条腿不判（锁保守边界，防未来放宽） ───────
test('C1 单腿样本 8 条全部不命中（缺一不判）', () => {
  const single = [
    '原生态旅游成为新热点',                  // 腿①d 原生态，无腿②
    '深山里的空气真好',                      // 腿①f，无腿②（「真好」不入表）
    '自然疗法需要预约',                      // 腿①g，无腿②
    '这道菜肯定好吃',                        // 腿②b，无腿①
    '没有任何添加剂的食品才健康',            // 腿②d，无腿①（无自然性断言）
    'This is wild.',                        // 腿①c，无腿②
    'It must be safe.',                     // 腿②b，无腿①
    'Naturally grown vegetables are on sale.', // 腿①d，无腿②
  ];
  for (const t of single) assert(!checkAppealToNature(t).hit, '单腿误判: ' + t);
});

// ─── D. 相邻维度分工边界 ─────────────────────────────────────────
test('D1 与 moral_foundations/存量维度分工边界', () => {
  // moral_foundations 沾边 3 条：本维度双腿齐全必须命中，gate 层非 pass
  const adjacent = [
    '自然熟的果子比催熟的健康，这是自然规律',
    '原始森林里的空气比城里的好，毕竟没有工业污染',
    '这个疗法用的是自然疗法，比西医副作用小',
  ];
  for (const t of adjacent) {
    assert(checkAppealToNature(t).hit, '双腿齐全应命中: ' + t);
    const g = gate.gate(t);
    assert(g.gate && g.gate.action && g.gate.action !== 'pass', 'gate 层应非 pass: ' + t);
  }
  // 存量维度 verify 样本（实验室数据显示…）：本维度零命中（无腿②），
  // gate 层 verify 是存量行为，HEAD 对照一致非本轮引入
  assert(!checkAppealToNature('实验室数据显示该化合物在自然条件下会降解').hit, '无腿②不应命中');
  // 一般良性：本维度不命中
  assert(!checkAppealToNature('这款精华含烟酰胺成分，建议先做皮肤测试').hit, '无关句不应命中');
});

// ─── E. 豁免承重样本（摘掉豁免就必须误伤——证明豁免不是装饰） ────
test('E1 元话语豁免承重：杀 META_EXEMPT 后元话语样本必须命中', () => {
  const { __internals } = require(path.join(HF, 'src/appeal-to-nature.js'));
  const NEVER = '__negtest_never__';
  // 中英各一条含双腿的元话语句——正常必须放行
  const metaZh = '诉诸自然是常见的逻辑谬误，比如「这是纯天然植物提取的，肯定比化学药安全」就是把天然当安全';
  const metaEn = "Appeal to nature is a common fallacy, for example: \"It's all-natural plant extract, so it must be safer than chemical medicine.\"";
  assert(!checkAppealToNature(metaZh).hit, '元话语中文应放行');
  assert(!checkAppealToNature(metaEn).hit, '元话语英文应放行');
  // 注入：杀掉豁免后必须命中（证明豁免在承重——双腿都在射程内）
  const killedZh = checkAppealToNature(metaZh, { META_EXEMPT_ZH: new RegExp(NEVER), META_EXEMPT_EN: new RegExp(NEVER) });
  assert(killedZh.hit, '杀 META_EXEMPT_ZH 后元话语中文应命中（豁免承重证明）');
  const killedEn = checkAppealToNature(metaEn, { META_EXEMPT_ZH: new RegExp(NEVER), META_EXEMPT_EN: new RegExp(NEVER) });
  assert(killedEn.hit, '杀 META_EXEMPT_EN 后元话语英文应命中（豁免承重证明）');
});

// ─── F. gate 层端到端：攻击全部非 pass ─────────────────────────
test('F1 攻击 21 条 gate 层全部非 pass', () => {
  const attacks = [
    '这是纯天然植物提取的，肯定比化学药安全',
    '老祖宗传下来的做法，自然是经过时间检验的',
    '全天然成分，没有任何添加剂，所以放心吃',
    '这东西是野生的，比养殖的有营养',
    '自然熟的果子比催熟的健康，这是自然规律',
    '我们这是纯草本配方，没有任何化学成分',
    '原始森林里的空气比城里的好，毕竟没有工业污染',
    '母乳是天然的，所以一定比配方奶好',
    '这部手机用的是天然材质，手感肯定更高级',
    '这个疗法用的是自然疗法，比西医副作用小',
    '野生的比家里养的健康',
    '野生的比超市买的更有营养',
    '纯草本配方，放心用',
    "It's all-natural plant extract, so it must be safer than chemical medicine.",
    'Wild-caught fish is more nutritious than farmed fish.',
    'Our formula is 100% herbal with no artificial chemicals.',
    'This phone uses natural materials, so it definitely feels more premium.',
    'The air in the primeval forest is better than the city, no industrial pollution.',
    'Natural healing has fewer side effects than western medicine, so it is the better choice.',
    'Naturally ripened fruit is healthier than the forced-ripened kind.',
    'Old-fashioned methods passed down from our ancestors are time-tested.',
    "Mother's milk is natural, so it must be better than formula.",
  ];
  for (const t of attacks) {
    const g = gate.gate(t);
    assert(g.gate && g.gate.action && g.gate.action !== 'pass', 'gate 层放行: ' + t + ' action=' + (g.gate && g.gate.action));
  }
});

test('F2 最易误伤良性 4 条 gate 层 pass（锁死）', () => {
  const benign = [
    '纯植物提取物也可能引起过敏反应',
    '天然林场的管理需要遵守环保法规',
    '这个新产品采用了最新的加密算法，安全性更高',
    '我们对比一下野生种和养殖种的营养成分数据',
  ];
  for (const t of benign) {
    const g = gate.gate(t);
    assertEqual(g.gate && g.gate.action, 'pass', '良性应 pass: ' + t);
  }
});

// ─── G. 九处接线完整性 ─────────────────────────────────────────
test('G1 接线九处齐全（require/计算点/allDims/dimMap/dimensions/guidance/tier/summary/exports）', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("require('./appeal-to-nature.js')"), 'require 接线缺失');
  assert(src.includes('checkAppealToNature(_normText)'), '计算点缺失');
  assert(src.split("{score: atn.score, name:'appeal_to_nature'},").length - 1 === 1, 'allDims 登记应恰好 1 次');
  assert(src.split('appeal_to_nature: atn,').length - 1 === 2, 'dimMap 与 dimensions 两处登记应各 1 次（共 2）');
  const verifyDecl = src.indexOf('const VERIFY_DIMS = new Set([');
  assert(verifyDecl > 0, '未找到 const VERIFY_DIMS 声明');
  const verifyBlock = src.slice(verifyDecl, verifyDecl + 60000);
  assert(verifyBlock.includes("'appeal_to_nature',"), 'VERIFY_DIMS 未登记 appeal_to_nature');
  assert(src.includes("atn.count ? atn.count + ' 处诉诸自然' : ''"), 'summary 登记缺失');
  assert(src.includes("'appeal_to_nature': \"不得把**天然"), 'DIM_GUIDANCE 条目缺失');
  // exports：module.exports 区块内（不用全局 includes——避免命中注释）
  const expIdx = src.lastIndexOf('module.exports');
  const expBlock = src.slice(expIdx, expIdx + 200000);
  assert(expBlock.includes('  checkAppealToNature,'), 'module.exports 未导出 checkAppealToNature');
  // dimensions 键实测（引擎本体真值）
  const disc = gate.discriminate('这是纯天然植物提取的，肯定比化学药安全');
  assert(disc.dimensions.appeal_to_nature && (disc.dimensions.appeal_to_nature.count ?? 0) > 0, 'discriminate().dimensions.appeal_to_nature 应命中');
  assert(Object.keys(disc.dimensions).length === 139, 'dimensions 键数应为 139（138→139）');
  // guidance 可读性（finding 带 guidance 且含判据关键词）
  const g = gate.gate('这是纯天然植物提取的，肯定比化学药安全');
  const finding = (g.findings || []).find((f) => f.dimension === 'appeal_to_nature');
  assert(finding, 'gate finding 应含 appeal_to_nature');
  const guidance = finding.guidance || (g.guidance && g.guidance.appeal_to_nature) || '';
  assert(typeof guidance === 'string' && guidance.length > 50, 'guidance 应完整');
  assert(guidance.includes('天然'), 'guidance 应说明本族判据（自然性断言）');
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
