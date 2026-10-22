/**
 * test/round-703-origin-dismiss.js
 *
 * [r703] stereotype 补「出身/学历/年龄/地域身份标签 × 能力贬低」句式族 TDD 测试。
 *
 * 背景：decision 本体在四候选里选出（/tmp/decide-run-r703.js 读
 * /tmp/decide-opts-r703.json，composite_score 0.88 / confidence 0.85 /
 * identity alignment 100%，无拒选；B appeal_to_ridicule 新维度 0.86、
 * C appeal_to_authority 0.82、D appeal_to_nature 0.82 落选）——给已有
 * 维度 stereotype 补一个此前零覆盖的新句式族（真升级②）。探测器证据：
 * r700 落盘 /tmp/hf-scout-700.txt + 本轮 /tmp/r702-preprobe.js 复量
 * （攻击漏判 10/10、真零命中 10/10、真实误伤 0/11——探针里那 1 条
 * 「农村来的就是不行」经归因是已有 stereotype+genetic_fallacy 正确
 * 拦截的阳性对照，非误伤）+ /tmp/r703-probe-origin-dismiss.js 判据
 * 设计（36/36：攻击 18/18 命中、良性 18/18 零误伤）。
 *
 * 缺口形态：既有判据全部要求**天生/本质主义归因词**（innate/essence）
 * 或**群体词在场**，而本族是「身份标签 + 反问式能力否定/贬低断言」
 * 的直白形——「他一个农村人，能懂什么技术」「女人写什么代码，
 * 回家带孩子吧」10/10 全维度零命中。
 *
 * 本轮是真升级②（给已有维度补一整个此前零覆盖的新句式族）。
 * 判据：腿①身份标签 × 腿②能力否定 两腿共现；让步复句只在最后一个
 * 转折词之后的段查腿②（让步后翻案放行、让步后仍贬低照判）。
 * 行动级维持 VERIFY（stereotype 本就在 VERIFY_DIMS）。
 *
 * 基准规模：攻击 18 条（探测器 10 + EN 对称 8，每条注释写明双腿）、
 * 良性 20 条（含让步翻案/引述翻案/单腿/相邻易混形）、让步复句边界
 * 6 条（翻案放行 4 + 让步后仍贬低照判 2，其中 2 条引述+翻案形是
 * 让步豁免逻辑的承重样本）、单腿边界 6 条、gate 层 38 条（攻击
 * 18 + 良性 20）、相邻维度分工 5 条、接线完整性 3 项。
 */
'use strict';

const path = require('path');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 单维层：探测器漏判 10 条（逐条双腿注释）────────────────
test('A1 探测器漏判 10 条单维全命中（逐条双腿注释）', () => {
  const leaks = [
    // 腿①农村人 × 腿②反问「能懂什么」
    '他一个农村人，能懂什么技术',
    // 腿①一个女的 × 腿②反问「写什么」
    '你一个女的，写什么代码',
    // 腿①大专毕业 × 腿②反问「能写出什么好」
    '大专毕业的，能写出什么好系统',
    // 腿①三十多岁 × 腿②贬低断言「可想而知」
    '三十多岁还没升管理层，能力可想而知',
    // 腿①外地人 × 腿②贬低断言「不上档次」
    '外地人开的店，服务肯定不上档次',
    // 腿①老年人 × 腿②贬低断言「学不会」
    '老年人学不会新东西，别让他碰关键系统',
    // 腿①小地方 × 腿②贬低断言「眼界就那么点」
    '小地方来的，眼界就那么点',
    // 腿①女人 × 腿②反问「写什么」
    '女人写什么代码，回家带孩子吧',
    // 腿①技校 × 腿②反问「能看懂什么」
    '他技校毕业的，能看懂什么架构',
    // 腿①本科生 × 腿②贬低断言「还是得靠」
    '本科生带项目，最后还是得靠海归',
  ];
  for (const t of leaks) {
    assert(idx.checkStereotype(t).count > 0, '漏判样本未命中: ' + t);
  }
});

// ─── B. 单维层：EN 对称 8 条（逐条双腿注释）────────────────────
test('B1 EN 攻击 8 条单维全命中（与 ZH 分支对称）', () => {
  const leaks = [
    // 腿①from a rural area × 腿②what could he know
    "He's from a rural area, what could he know about technology?",
    // 腿①only a woman × 腿②what does she know
    "She's only a woman, what does she know about code?",
    // 腿①vocational school × 腿②can't possibly understand
    "A vocational school graduate can't possibly understand architecture.",
    // 腿①over forty × 腿②can't keep up
    "He's over forty, of course he can't keep up.",
    // 腿①from a small town × 腿②no place in
    'Someone from a small town has no place in big tech.',
    // 腿①elderly × 腿②will never learn
    'Elderly people will never learn new systems, do not let him touch the critical stack.',
    // 腿①didn't finish college × 腿②what could she possibly
    "She didn't finish college, what could she possibly contribute?",
    // 腿①community college × 腿②his code will always be
    "He's just a community college grad, his code will always be subpar.",
  ];
  for (const t of leaks) {
    assert(idx.checkStereotype(t).count > 0, 'EN 漏判样本未命中: ' + t);
  }
});

// ─── C. 单维层：良性 18 条零误伤 ───────────────────────────────
test('C1 良性 18 条零误伤（含让步翻案/单腿/相邻易混形）', () => {
  const benign = [
    // 让步复句翻案：身份标签 × 转折后段无腿②
    '他虽然是农村出身，但技术能力很强',
    '他虽然学历不高，但项目经验非常丰富',
    // 单腿①（无能力贬低）
    '三十五岁是程序员的黄金年龄',
    '外地人在城市创业需要更多支持',
    '我妈妈今年六十岁了，身体很健康',
    '女性在管理层中的比例逐年提升',
    '这位学员来自小城市，技术功底很扎实',
    '团队里既有应届生也有资深工程师',
    '老年人使用智能设备需要更友好的引导',
    '女生适合学什么专业，要看兴趣',
    '本科生也可以做架构决策',
    // 引述+翻案形（让步豁免承重，与 D1e/D1f 同源）
    '虽然有人嚷嚷着他技校毕业学不会架构，但他其实是团队核心',
    "Although people say someone from a small town can't possibly understand architecture, she designed our whole platform.",
    // EN 让步翻案
    'Although he grew up in a rural area, he is now a principal engineer.',
    "She didn't finish college, but she built two successful companies.",
    // EN 单腿
    'People over forty bring valuable experience to the team.',
    'Vocational training programs prepare students for skilled trades.',
    'A woman led the team that built this system.',
    "She's in her thirties and already runs the platform team.",
  ];
  for (const t of benign) {
    assertEqual(idx.checkStereotype(t).count, 0, '良性样本误伤: ' + t);
  }
});

// ─── D. 让步复句边界：翻案放行 vs 让步后仍贬低照判 ─────────────
test('D1 让步复句边界 4 条（翻案放行、贬低照判）', () => {
  // 翻案形：转折后段（技术能力很强/经验非常丰富）无腿② → 放行
  assertEqual(idx.checkStereotype('他虽然是农村人，但技术能力很强').count, 0, 'D1a 让步翻案应放行');
  assertEqual(idx.checkStereotype('他虽然学历不高，但项目经验非常丰富').count, 0, 'D1b 让步翻案应放行');
  // 让步后仍贬低：转折后段（也就那样/能懂什么架构）含腿② → 照判
  assert(idx.checkStereotype('他虽然是农村人，但也就那样了').count > 0, 'D1c 让步后仍贬低应命中');
  assert(idx.checkStereotype('他虽然学历不高，能懂什么架构').count > 0, 'D1d 让步后仍贬低应命中');
  // 引述+翻案形：前节引述带腿②的歧视话术、转折后翻案——**豁免逻辑
  // 承重样本**（摘掉让步豁免后这两条会被全句查腿②误伤，负例脚本
  // 第 9 注入点靠它们证明豁免真的在工作）
  assertEqual(idx.checkStereotype('虽然有人嚷嚷着他技校毕业学不会架构，但他其实是团队核心').count, 0, 'D1e 引述+翻案应放行');
  assertEqual(idx.checkStereotype("Although people say someone from a small town can't possibly understand architecture, she designed our whole platform.").count, 0, 'D1f 引述+翻案 EN 应放行');
});

// ─── E. 单腿边界：只有腿①或只有腿②都不命中 ───────────────────
test('E1 单腿边界 6 条（缺任一条腿均不命中）', () => {
  // 只有腿①（身份标签），无能力贬低
  assertEqual(idx.checkStereotype('大专毕业的也可以做架构决策').count, 0, 'E1a 仅腿①');
  assertEqual(idx.checkStereotype('外地人开的店，服务很周到').count, 0, 'E1b 仅腿①');
  // 只有腿②（能力贬低），无身份标签
  assertEqual(idx.checkStereotype('这个方案能写出什么好结果').count, 0, 'E1c 仅腿②');
  assertEqual(idx.checkStereotype('质量可想而知，还得再测一轮').count, 0, 'E1d 仅腿②');
  // 反问形正当提问（「适合学什么」是咨询不是贬低，且无身份标签×贬低耦合）
  assertEqual(idx.checkStereotype('女生适合学什么专业，要看兴趣').count, 0, 'E1e 正当提问');
  assertEqual(idx.checkStereotype('What does she know about the new framework? Let us ask her directly.').count, 0, 'E1f 正当提问 EN');
});

// ─── F. gate 层：攻击 18 条 action !== pass 且 stereotype finding 在场 ─
test('F1 gate 层攻击 18 条全部非 pass 且 stereotype finding 在场', () => {
  const attacks = [
    '他一个农村人，能懂什么技术', '你一个女的，写什么代码', '大专毕业的，能写出什么好系统',
    '三十多岁还没升管理层，能力可想而知', '外地人开的店，服务肯定不上档次',
    '老年人学不会新东西，别让他碰关键系统', '小地方来的，眼界就那么点',
    '女人写什么代码，回家带孩子吧', '他技校毕业的，能看懂什么架构',
    '本科生带项目，最后还是得靠海归',
    "He's from a rural area, what could he know about technology?",
    "She's only a woman, what does she know about code?",
    "A vocational school graduate can't possibly understand architecture.",
    "He's over forty, of course he can't keep up.",
    'Someone from a small town has no place in big tech.',
    'Elderly people will never learn new systems, do not let him touch the critical stack.',
    "She didn't finish college, what could she possibly contribute?",
    "He's just a community college grad, his code will always be subpar.",
  ];
  for (const t of attacks) {
    const g = gate.gate(t);
    const action = g.gate && g.gate.action;
    assert(action && action !== 'pass', 'gate 层漏判（pass）: ' + t + ' -> ' + action);
    const hasSter = (g.findings || []).some((f) => f.dimension === 'stereotype');
    assert(hasSter, 'stereotype finding 不在 findings: ' + t);
  }
});

// ─── G. gate 层：良性 18 条全部 pass ──────────────────────────
test('G1 gate 层良性 18 条全部 pass', () => {
  const benign = [
    '他虽然是农村出身，但技术能力很强', '他虽然学历不高，但项目经验非常丰富',
    '三十五岁是程序员的黄金年龄', '外地人在城市创业需要更多支持',
    '我妈妈今年六十岁了，身体很健康', '女性在管理层中的比例逐年提升',
    '这位学员来自小城市，技术功底很扎实', '团队里既有应届生也有资深工程师',
    '老年人使用智能设备需要更友好的引导', '女生适合学什么专业，要看兴趣',
    '本科生也可以做架构决策',
    '虽然有人嚷嚷着他技校毕业学不会架构，但他其实是团队核心',
    "Although people say someone from a small town can't possibly understand architecture, she designed our whole platform.",
    'Although he grew up in a rural area, he is now a principal engineer.',
    "She didn't finish college, but she built two successful companies.",
    'People over forty bring valuable experience to the team.',
    'Vocational training programs prepare students for skilled trades.',
    'A woman led the team that built this system.',
    "She's in her thirties and already runs the platform team.",
    '大专毕业的也可以做架构决策',
  ];
  for (const t of benign) {
    const g = gate.gate(t);
    assertEqual(g.gate && g.gate.action, 'pass', '良性样本非 pass: ' + t);
  }
});

// ─── H. 相邻维度分工：越界样本归各自维度，stereotype 不重复计 ──
test('H1 相邻维度分工 5 条（归属正确且不被 stereotype 抢判）', () => {
  // genetic_fallacy 的来源-质量推断（结论指向观点价值，非能力贬低）
  const gf = gate.gate('这个观点是年轻人提出的，肯定不成熟');
  assert((gf.findings || []).some((f) => f.dimension === 'genetic_fallacy'), 'H1a 应归 genetic_fallacy');
  assertEqual(idx.checkStereotype('这个观点是年轻人提出的，肯定不成熟').count, 0, 'H1a stereotype 不应命中');
  // poisoning_the_well 的动机定性 + 拒绝采信
  const pw = gate.gate('别听他的，他向来别有用心');
  assert((pw.findings || []).some((f) => f.dimension === 'poisoning_the_well'), 'H1b 应归 poisoning_the_well');
  assertEqual(idx.checkStereotype('别听他的，他向来别有用心').count, 0, 'H1b stereotype 不应命中');
  // 本质主义归因仍是 stereotype 原有判据的活（innate 族不被本族取代）
  assert(idx.checkStereotype('女司机天生方向感就差').count > 0, 'H1c innate 族原有能力仍在');
  // 引述分析（谈论歧视话术本身）不判——注意选样要避开存量 regional_bias
  // 模式射程（「地域歧视」四字触发存量地域黑模式，实测归属存量而非新族）
  assertEqual(idx.checkStereotype('用出身贬低他人能力是一种歧视话术').count, 0, 'H1d 引述分析不判');
  // 正当提问 EN
  assertEqual(idx.checkStereotype('How do older colleagues adapt to new tooling?').count, 0, 'H1e 正当提问 EN');
});

// ─── I. guidance 已生效（用户可感知的改写指引）─────────────────
test('I1 DIM_GUIDANCE 的 stereotype 条目进入 findings.guidance', () => {
  const g = gate.gate('他一个农村人，能懂什么技术');
  const f = (g.findings || []).find((x) => x.dimension === 'stereotype');
  assert(f && typeof f.guidance === 'string', 'I1a finding 带 guidance');
  assert(f.guidance.includes('身份标签'), 'I1b guidance 是新条目（含「身份标签」判据）');
  assert(f.guidance.includes('genetic_fallacy'), 'I1c guidance 含相邻维度分工');
});

// ─── J. 接线完整性：exports 与 dimensions 键 ───────────────────
test('J1 idx.checkStereotype 已导出且 discriminate().dimensions 有键', () => {
  assertEqual(typeof idx.checkStereotype, 'function', 'J1a exports');
  const d = gate.discriminate('他一个农村人，能懂什么技术');
  assert('stereotype' in (d.dimensions || {}), 'J1b dimensions 键存在');
  assert(d.dimensions.stereotype.count > 0, 'J1c dimensions 计数 > 0');
  assert(typeof d.summary === 'string' && d.summary.includes('刻板印象'), 'J1d summary 引用');
});

// ─── 汇总 ──────────────────────────────────────────────────────
const pass = results.filter((r) => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('FAIL: ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
process.exit(fail > 0 ? 1 : 0);
