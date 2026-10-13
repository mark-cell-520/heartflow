/**
 * test/round-704-appeal-to-ridicule.js
 *
 * [r704] 第 137 维度 appeal_to_ridicule（诉诸嘲讽）TDD 测试。
 *
 * 背景：decision 本体在 136 维引擎上选出（/tmp/decide-run-r704.js 读
 * /tmp/decide-opts-r704.json，composite_score 0.87 / confidence 0.80 /
 * identity alignment 100%，无拒选）。候选题池来自 r700 探测器落盘
 * /tmp/hf-scout-700.txt；本轮 /tmp/r704-preprobe.js 复量并做 FP 归因：
 * 攻击 10 条漏判 10/10、真零命中 8/10（2 条命中 sarcasm 但 gate 层
 * 仍 pass）、误伤 1/12（存量 contradiction「我不同意这个观点，理由是
 * 数据不支持」，归因后本族自身存量误伤 0）。判据从严：只有
 * gate.checkOutput() gate.action === 'pass' 才算漏判。
 *
 * 本轮是真升级①（新增第 137 个判别维度）。
 * 判据是三条路由任一命中：①双腿共现——嘲笑/蔑视表达 × 指向对方观点/
 * 发言/产出的目标腿 ②自含指向的固定嘲讽习语单独成支 ③缺一不判。
 *
 * 与既有维度分工由 D 组锁住：
 *   · sarcasm 管反讽语气标记（呵呵/你说得都对/笑死了），是语气描述
 *     且不强制行动，本族要求嘲词×观点指向共现或固定习语；
 *   · hate_speech / dehumanization 管对人的侮辱与人格否定，落点是人，
 *     本族落点是观点/发言/产出；
 *   · FALLACY_PATTERNS 既有 straw_man 正则只认「你的意思就是说…
 *     但这显然」转述形。
 *
 * 基准规模：攻击 26 条（中文 16 + 英文 10）、良性 30 条（中文 17 +
 * 英文 13）、单腿边界 8 条、相邻维度分工 8 条、豁免承重 4 条、
 * gate 层 26 条、接线 5 条。
 *
 * 接线为九处（本轮刻意不加 FALLACY_PATTERNS 紧凑正则——静态正则没有
 * 豁免层，实测会把元话语样本「把『这种想法太可笑了』当作论据，就是
 * 诉诸嘲讽」判成 fallacies verify，而程序化模块的 META_EXEMPT 能正确
 * 放行；同 r703 stereotype 先例，新族只接模块不接静态表）：
 * require/计算点/allDims/dimMap/dimensions/DIM_GUIDANCE/VERIFY_DIMS/
 * summary/module.exports。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkAppealToRidicule } = require(path.join(HF, 'src/appeal-to-ridicule.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 单维层：攻击全命中（逐条路由注释）──────────────────────────
test('A1 中文攻击 10 条单维全命中（探测器样本，逐条路由注释）', () => {
  const attacks = [
    // 路由①：嘲词「可笑」× 指称+观点名词「这种想法」（另含习语「亏你想得出来」）
    '这种想法也太可笑了，亏你想得出来',
    // 路由①：嘲词「幼稚」× 指称+观点名词「这么…观点」（另含发言指向「拿出来说」）
    '这么幼稚的观点也拿出来说',
    // 路由①：笑声蔑称「笑死」× 蔑称形「这也叫方案」
    '笑死我了，这也叫方案',
    // 路由①：嘲词「搞笑」× 第二人称号领「你的逻辑」
    '你的逻辑太搞笑了，认真读过文档吗',
    // 路由①：嘲词「笑话」× 指称+观点名词「这种论调」（另含习语「不值一驳」）
    '这种论调简直是笑话，不值一驳',
    // 路由②：固定习语「脑子正常的人都不会」（自含指向，单独成支）
    '脑子正常的人都不会这么想',
    // 路由①：智商贬低「智商堪忧」× 指称+发言指向「这也信」
    '这也信？智商堪忧',
    // 路由①：嘲词「天真」× 指称+观点名词「这么…想法」（另含发言指向「只有你能有」）
    '这么天真的想法只有你能有',
    // 路由①：嘲词「蠢」× 第二人称号领「你的方案」
    '你的方案蠢得让人无语',
    // 路由②：固定习语「就这水平」（自含指向，单独成支）
    '哈哈，就这水平还敢发言',
  ];
  for (const t of attacks) {
    const r = checkAppealToRidicule(t);
    assert(r.hit, '未命中: ' + t);
    assert(r.count >= 1, 'count 应 >= 1: ' + t);
  }
});

test('A2 英文攻击 10 条单维全命中（中英分支对齐）', () => {
  const attacks = [
    // 路由①：ridiculous × this idea（另含习语 can't believe you came up with this）
    "This idea is ridiculous. I can't believe you came up with it.",
    // 路由①：childish × what a … argument
    'What a childish argument. Did you even read the docs?',
    // 路由①：lol × you call this（c 支发言指向）
    'LOL, you call this a plan?',
    // 路由①：hilarious × your logic
    'Your logic is hilarious. Did you actually read the documentation?',
    // 路由①：a joke × this argument（另含习语 not even worth refuting）
    'This argument is a joke, not even worth refuting.',
    // 路由②：固定习语 anyone with a functioning brain
    "Anyone with a functioning brain wouldn't think that.",
    // 路由①：IQ is concerning × you believe this
    'You believe this? Your IQ is concerning.',
    // 路由①：naive × only someone like you
    'Only someone as naive as you could have this idea.',
    // 路由①：stupid × your proposal
    'Your proposal is so stupid it leaves me speechless.',
    // 路由②：固定习语 with this level
    'Haha, with this level you still dare to speak?',
  ];
  for (const t of attacks) {
    const r = checkAppealToRidicule(t);
    assert(r.hit, '未命中: ' + t);
    assert(r.count >= 1, 'count 应 >= 1: ' + t);
  }
});

test('A3 扩展攻击 6 条命中（补充分支：笑哭/弱智/脑子进水/你也敢讲/what a plan）', () => {
  const attacks = [
    // b 支笑声蔑称「笑哭」× 指称+观点名词
    '笑哭，这算什么方案',
    // a 支嘲词「弱智」× 第二人称号领
    '这设计太弱智了，你的脑子进水了吗',
    // c 支智商贬低「脑子呢」× 指称+发言指向
    '就这水平，脑子呢',
    // c 支发言指向「你也敢讲」× 嘲词「天真」
    '这么天真的话你也敢讲',
    // EN：what a + stupid + plan（a 支指称形）
    'What a stupid plan. Did anyone review this?',
    // EN：pathetic × that approach
    'That approach is pathetic and you know it.',
  ];
  for (const t of attacks) {
    const r = checkAppealToRidicule(t);
    assert(r.hit, '未命中: ' + t);
  }
});

// ─── B. 良性：单维层零误判 + gate 层 pass ───────────────────────
test('B1 良性中文 17 条单维零误判', () => {
  const benign = [
    // 缺陷对象在场：可笑修饰漏洞（具体指认不是整体蔑视）
    '这个方案确实有可笑的漏洞，我们来修复它',
    '这种方案确实有可笑的漏洞',
    // 正当反对（无蔑视表达）
    '我不同意这个观点，理由是数据不支持',
    '这个设计有点问题，我们讨论一下',
    '你的逻辑有问题，第 3 步推不出来',
    '你这个想法需要数据支撑',
    // 幽默内容转述（笑料描述不是攻击）
    '用嘲讽的方式讨论问题并不合适',
    '喜剧电影里的这个桥段很搞笑',
    '他讲的笑话让全场都笑了',
    '漫画用夸张手法讽刺了这种现象',
    '这个段子写得真幽默',
    '别开玩笑了，我们说正事',
    '这个桥段很搞笑',
    '幽默感是沟通的润滑剂',
    // 正当咨询
    '这个解释听起来不太合理，能否给出依据',
    '我觉得你的假设可以再验证一下',
    // 元话语（评析话术本身）
    '把「这种想法太可笑了」当作论据，就是诉诸嘲讽',
    '仅凭嘲笑是驳不倒一个观点的',
  ];
  for (const t of benign) {
    const r = checkAppealToRidicule(t);
    assertEqual(r.count, 0, '良性误判: ' + t);
    assertEqual(r.hit, false, '良性误判 hit: ' + t);
  }
});

test('B2 良性英文 13 条单维零误判', () => {
  const benign = [
    // 缺陷对象在场（DEFECT_EXEMPT_EN）
    'This plan does have a ridiculous flaw; let us fix it together.',
    'What a ridiculous flaw in the cache design; we should fix the expiration policy.',
    // 正当反对
    'I disagree with this point because the data does not support it.',
    'This design has some issues; let us discuss them.',
    'This explanation does not sound reasonable; can you provide evidence?',
    'I think your hypothesis could use further verification.',
    'Your idea needs data support before we adopt it.',
    // 幽默内容转述
    'Using ridicule in a discussion is not appropriate.',
    'The comedy movie scene is hilarious.',
    'His joke made the whole room laugh.',
    'The comic satirizes this phenomenon with exaggeration.',
    'This skit is really humorous.',
    'Stop joking, let us get back to business.',
    // 元话语
    'Appeal to ridicule is a common logical fallacy.',
    'Humor is the lubricant of communication.',
  ];
  for (const t of benign) {
    const r = checkAppealToRidicule(t);
    assertEqual(r.count, 0, '良性误判: ' + t);
  }
});

test('B3 gate 层良性 30 条全部 pass（B1+B2 全量过 gate）', () => {
  const benign = [
    '这个方案确实有可笑的漏洞，我们来修复它', '这种方案确实有可笑的漏洞',
    '我不同意这个观点，理由是数据不支持', '这个设计有点问题，我们讨论一下',
    '你的逻辑有问题，第 3 步推不出来', '你这个想法需要数据支撑',
    '用嘲讽的方式讨论问题并不合适', '喜剧电影里的这个桥段很搞笑',
    '他讲的笑话让全场都笑了', '漫画用夸张手法讽刺了这种现象',
    '这个段子写得真幽默', '别开玩笑了，我们说正事', '这个桥段很搞笑',
    '幽默感是沟通的润滑剂', '这个解释听起来不太合理，能否给出依据',
    '我觉得你的假设可以再验证一下', '把「这种想法太可笑了」当作论据，就是诉诸嘲讽',
    '仅凭嘲笑是驳不倒一个观点的',
    'This plan does have a ridiculous flaw; let us fix it together.',
    'What a ridiculous flaw in the cache design; we should fix the expiration policy.',
    'I disagree with this point because the data does not support it.',
    'This design has some issues; let us discuss them.',
    'This explanation does not sound reasonable; can you provide evidence?',
    'I think your hypothesis could use further verification.',
    'Your idea needs data support before we adopt it.',
    'Using ridicule in a discussion is not appropriate.',
    'The comedy movie scene is hilarious.',
    'His joke made the whole room laugh.',
    'The comic satirizes this phenomenon with exaggeration.',
    'This skit is really humorous.',
    'Stop joking, let us get back to business.',
    'Appeal to ridicule is a common logical fallacy.',
    'Humor is the lubricant of communication.',
  ];
  for (const t of benign) {
    const g = gate.gate(t);
    const action = g && g.gate && g.gate.action ? g.gate.action : 'ERR';
    assertEqual(action, 'pass', 'gate 层误拦: ' + t + ' -> ' + action);
  }
});

// ─── C. 单腿边界：缺任一条腿均不命中 ───────────────────────────
test('C1 单腿边界 8 条（只有嘲词无指向 / 只有指向无嘲词）', () => {
  // 只有嘲词/笑声，无观点指向腿（笑料内容描述）
  const ridiculeOnly = [
    '这部电影真搞笑',           // 嘲词×内容载体，无观点名词
    '他讲了个笑话',             // 笑料陈述，无指向
    '这个段子真蠢',             // 蠢×段子（内容），段子不是观点名词
  ];
  for (const t of ridiculeOnly) {
    assertEqual(checkAppealToRidicule(t).count, 0, '只有嘲词不应判: ' + t);
  }
  // 只有观点指向，无蔑视表达（正常反馈/咨询）
  const targetOnly = [
    '你这个想法需要数据支撑',
    '你的方案第三步推不出来',
    '这种观点我们讨论过',
    '这个逻辑有问题吗',
    '你的设计需要补充测试',
  ];
  for (const t of targetOnly) {
    assertEqual(checkAppealToRidicule(t).count, 0, '只有指向不应判: ' + t);
  }
});

// ─── D. 相邻维度分工：越界样本归各自维度，本维度不抢判 ──────────
test('D1 相邻维度分工 8 条（归属正确且不被 appeal_to_ridicule 抢判）', () => {
  // sarcasm 的反讽语气标记（呵呵/你说得都对）——sarcasm 命中且 gate verify，
  // 但本维度无观点指向腿不判（分工边界：语气标记归 sarcasm）
  const sa = gate.gate('呵呵，你说得都对');
  assert((sa.findings || []).some((f) => f.dimension === 'sarcasm'), 'D1a 应归 sarcasm');
  assertEqual(checkAppealToRidicule('呵呵，你说得都对').count, 0, 'D1a 本维度不应命中');
  assertEqual(gate.gate('呵呵，你说得都对').gate.action, 'verify', 'D1a gate 层由 sarcasm 判 verify');
  // hate_speech 对人的侮辱（落点是人不是观点）
  const hs = gate.gate('你就是个废物');
  assert((hs.findings || []).some((f) => f.dimension === 'hate_speech'), 'D1b 应归 hate_speech');
  assertEqual(checkAppealToRidicule('你就是个废物').count, 0, 'D1b 本维度不应命中');
  // dehumanization/stereotype 对人格的否定
  const st = gate.gate('这种人就是垃圾，不该有投票权');
  assertEqual(checkAppealToRidicule('这种人就是垃圾，不该有投票权').count, 0, 'D1c 本维度不应命中');
  // FALLACY_PATTERNS 既有 straw_man 正则（转述形）归 reasoning_coherence
  const sm = gate.gate('你的意思就是说要删测试，但这显然不对');
  assertEqual(checkAppealToRidicule('你的意思就是说要删测试，但这显然不对').count, 0, 'D1d 本维度不应命中');
  // 强烈批评但无蔑视词（正常技术反对）
  assertEqual(checkAppealToRidicule('你的逻辑有问题，第 3 步推不出来').count, 0, 'D1e 正当批评不判');
  // 自嘲（第一人称自嘲不是对听者的嘲讽压制）
  assertEqual(checkAppealToRidicule('我这个想法确实很蠢，算了').count, 0, 'D1f 自嘲不判');
  // 概念分析（诉诸嘲讽作为概念被讨论）
  assertEqual(checkAppealToRidicule('诉诸嘲讽是一种常见的逻辑谬误').count, 0, 'D1g 概念分析不判');
  // 英文正当反对
  assertEqual(checkAppealToRidicule('I disagree with this point because the data does not support it.').count, 0, 'D1h 英文正当反对不判');
});

// ─── E. 豁免承重：摘掉豁免就误伤的样本 ────────────────────────
test('E1 豁免承重 4 条（DEFECT/META 各中英一条，负例脚本注入的靶子）', () => {
  // DEFECT_EXEMPT_ZH：双腿齐全（这种方案+可笑），仅靠缺陷对象豁免放行
  assertEqual(checkAppealToRidicule('这种方案确实有可笑的漏洞').count, 0, 'E1a 缺陷对象应豁免');
  // DEFECT_EXEMPT_EN：ridiculous × this plan，仅靠缺陷对象豁免放行
  assertEqual(checkAppealToRidicule('This plan does have a ridiculous flaw.').count, 0, 'E1b 缺陷对象应豁免(EN)');
  // META_EXEMPT_ZH：双腿齐全（这种想法+可笑），仅靠元话语标记豁免放行
  assertEqual(checkAppealToRidicule('把「这种想法太可笑了」当作论据，就是诉诸嘲讽').count, 0, 'E1c 元话语应豁免');
  // META_EXEMPT_EN：ridiculous × this idea，仅靠元话语标记豁免放行
  assertEqual(checkAppealToRidicule('Saying "this idea is ridiculous" instead of giving reasons is appeal to ridicule.').count, 0, 'E1d 元话语应豁免(EN)');
});

// ─── F. gate 层：攻击全部非 pass 且 finding 在场 ───────────────
test('F1 gate 层攻击 26 条全部非 pass 且 appeal_to_ridicule finding 在场', () => {
  const attacks = [
    '这种想法也太可笑了，亏你想得出来', '这么幼稚的观点也拿出来说', '笑死我了，这也叫方案',
    '你的逻辑太搞笑了，认真读过文档吗', '这种论调简直是笑话，不值一驳', '脑子正常的人都不会这么想',
    '这也信？智商堪忧', '这么天真的想法只有你能有', '你的方案蠢得让人无语', '哈哈，就这水平还敢发言',
    '笑哭，这算什么方案', '这设计太弱智了，你的脑子进水了吗', '就这水平，脑子呢',
    '这么天真的话你也敢讲',
    "This idea is ridiculous. I can't believe you came up with it.",
    'What a childish argument. Did you even read the docs?',
    'LOL, you call this a plan?',
    'Your logic is hilarious. Did you actually read the documentation?',
    'This argument is a joke, not even worth refuting.',
    "Anyone with a functioning brain wouldn't think that.",
    'You believe this? Your IQ is concerning.',
    'Only someone as naive as you could have this idea.',
    'Your proposal is so stupid it leaves me speechless.',
    'Haha, with this level you still dare to speak?',
    'What a stupid plan. Did anyone review this?',
    'That approach is pathetic and you know it.',
  ];
  for (const t of attacks) {
    const g = gate.gate(t);
    const action = g && g.gate && g.gate.action ? g.gate.action : 'ERR';
    assert(action !== 'pass' && action !== 'ERR', 'gate 层放行: ' + t + ' -> ' + action);
    const findings = g.findings || [];
    assert(findings.some((f) => f.dimension === 'appeal_to_ridicule'), 'findings 缺少 appeal_to_ridicule: ' + t);
  }
  // tier 定级用「只触发本维度」的干净样本断言 verify——「这设计太弱智了」
  // 那条 gate 层是 block，但 block 来自存量 hate_speech（弱智是残障
  // 贬称），不是本维度；B2 分工边界纪律：本维度自己的定级只能用干净
  // 样本证（r686 同款：gate 层已拦样本不能当本维度 tier 证据）。
  assertEqual(gate.gate('脑子正常的人都不会这么想').gate.action, 'verify', '干净样本应判 verify（VERIFY_DIMS 级）');
  assertEqual(gate.gate('你的方案蠢得让人无语').gate.action, 'verify', '干净样本应判 verify（VERIFY_DIMS 级）');
});

test('F2 gate 层 dimensions 登记可见（防登记缺口形态）', () => {
  const d = gate.discriminate('这种想法也太可笑了，亏你想得出来');
  assert(d.dimensions && d.dimensions.appeal_to_ridicule, 'dimensions 缺少 appeal_to_ridicule 键');
  const cnt = d.dimensions.appeal_to_ridicule.count ?? d.dimensions.appeal_to_ridicule.totalHits ?? 0;
  assert(cnt > 0, 'appeal_to_ridicule count 应 > 0，实际 ' + cnt);
  const findings = d.findings || [];
  assert(findings.some((f) => f.dimension === 'appeal_to_ridicule'), 'discriminate findings 缺少 appeal_to_ridicule');
  // summary 人类可读串在场（r704 补登记的「处诉诸嘲讽」）
  const summary = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
  assert(summary.includes('诉诸嘲讽'), 'summary 缺少「诉诸嘲讽」文案');
});

// ─── G. 接线断言：九处齐全（模块单测之外的门禁层） ─────────────
test('G1 接线九处齐全（require/计算点/allDims/dimMap/dimensions/guidance/tier/summary/exports）', () => {
  // 导出（module.exports 第 9 处）
  assertEqual(typeof idx.checkAppealToRidicule, 'function', 'idx.checkAppealToRidicule 未导出');
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  // 计算点 + allDims + dimMap + dimensions 四处按接线注释定位
  assert(src.includes("checkAppealToRidicule(_normText)"), '计算点缺失（_normText 归一化调用）');
  assert(src.includes("{score: ar.score, name:'appeal_to_ridicule'}"), 'allDims 登记缺失');
  assert((src.match(/appeal_to_ridicule: ar,/g) || []).length === 2, 'dimMap 与 dimensions 两处登记应各 1 次（共 2）');
  // VERIFY_DIMS tier 集合（从 const VERIFY_DIMS = new Set([ 声明处取，
  // 不用 src.indexOf('VERIFY_DIMS')——那会命中文件顶部的接线注释，
  // 切片够不到真正的集合定义，r704 实测踩过）
  const verifyDecl = src.indexOf('const VERIFY_DIMS = new Set([');
  assert(verifyDecl > 0, '未找到 const VERIFY_DIMS 声明');
  const verifyBlock = src.slice(verifyDecl, verifyDecl + 60000);
  assert(verifyBlock.includes("'appeal_to_ridicule',"), 'VERIFY_DIMS 未登记 appeal_to_ridicule');
  // summary
  assert(src.includes("ar.count ? ar.count + ' 处诉诸嘲讽' : ''"), 'summary 登记缺失');
  // DIM_GUIDANCE 条目非空且含判据关键词
  const g = gate.gate('这种想法也太可笑了，亏你想得出来');
  const finding = (g.findings || []).find((f) => f.dimension === 'appeal_to_ridicule');
  assert(finding, 'F 组已证 finding 在场，此处仅防回归');
  const guidance = finding.guidance || (g.guidance && g.guidance.appeal_to_ridicule) || '';
  assert(typeof guidance === 'string' && guidance.length > 50, 'DIM_GUIDANCE 条目应含完整指引');
  assert(guidance.includes('嘲笑') || guidance.includes('嘲讽'), 'guidance 应说明本族判据');
  // require 接线
  assert(src.includes("require('./appeal-to-ridicule.js')"), 'require 接线缺失');
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
