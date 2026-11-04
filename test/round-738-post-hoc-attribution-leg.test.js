/**
 * test/round-738-post-hoc-attribution-leg.test.js
 * [r738] post_hoc（后此谬误）R2 的 EN 侧第三腿「归因主张」补线。
 *
 * 根因：src/post-hoc.js 的 guidance 明文承诺「缺腿不判——『上周打了补丁，
 * 今天出了故障』只有时间陈述无归因主张，是正常事件记录」，但 r720 建维度时
 * EN 侧 R2 只有「干预 × 变化」两腿，ZH 侧靠 CHANGE_ZH 常量统一带「就」做
 * 紧随相随的形状区分，EN 侧自建维度起没有对应约束。于是
 * "We applied the patch. Latency dropped 40% after the change." 与
 * "I took the medicine and got better, so the medicine works." 形状同构，
 * 判据无法区分，中性工程复盘被误判 rewrite。
 *
 * 形态纪律：
 * - 中性工程复盘 15 条：gate.action 必须全 pass（修复前 14/15 判 rewrite）
 * - r720 存量攻击样本 20 条：checkPostHoc 必须仍 count>0（含两条只有尾部
 *   因果收束、无即时性标记的 EN R2 样本——腿③两支取「或」不用「与」的原因）
 * - r720 存量良性样本 21 条：模块层必须仍零命中
 * - ZH 侧不加腿③：两侧形状不同，强行对齐会打红 r720 的 ZH 攻击样本
 * - 存量红测试 dimension-action-wiring「良性技术复盘不受 clickbait 接线影响」
 *   必须转绿
 * - 诊断 describePostHoc / postHocLegs：缺腿③时必须能指名缺哪条
 * - MCP 三处接线：工具定义 + handler 映射 + handler 函数
 */
'use strict';

const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const ph = require(path.join(ROOT, 'src', 'post-hoc.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}
const hit = (s) => ph.checkPostHoc(s).count > 0;
const act = (s) => gate.gate(s).gate.action;

// ── 1. 中性工程复盘：必须全 pass ────────────────────────────────
// 修复前这 15 条里 14 条判 rewrite（sev 6800）。它们是「干预 × 变化」的
// 形状，缺的正是把先后当成原因的那一步。
const NEUTRAL = [
  'We applied the patch. Latency dropped 40% after the change.',
  'The team switched to the new queue and throughput improved.',
  'I updated the driver and the crashes stopped.',
  'I changed the timeout setting and the failures stopped.',
  'We updated the index and query time went down.',
  'We deployed the fix and the error rate dropped.',
  'I installed the update and the crashes stopped.',
  'We switched to the new cache and latency decreased.',
  'I changed the config and the warnings stopped.',
  'We applied the migration and the backlog increased.',
  'The team switched to the new scheduler and throughput went up.',
  'I updated the firmware and the resets stopped.',
  'We changed the pool size and the wait time dropped.',
  'I installed the driver and the warnings stopped.',
  'We updated the docs and the support tickets decreased.',
];
NEUTRAL.forEach((s, i) => t('中性复盘-' + (i + 1), () => {
  assert.strictEqual(act(s), 'pass', '中性工程复盘被误判：' + s);
}));

// 模块层也必须零命中（不只是 gate 被别的层压回 pass）
NEUTRAL.forEach((s, i) => t('中性复盘-模块层零命中-' + (i + 1), () => {
  assert.strictEqual(ph.checkPostHoc(s).count, 0, '模块层仍命中：' + s);
}));

// ── 2. r720 存量攻击样本：必须仍命中 ────────────────────────────
// 与 test/round-720-post-hoc.js 的语料逐字一致，防本轮改判据时打红存量。
const attacksZh = [
  '自从换了领导，业绩就下滑了，肯定是领导的问题',
  '上次调整了策略，之后销量就涨了，说明策略对了',
  '他来了之后团队就出问题，都是他带来的',
  '自从用了新系统，bug 就多了，新系统不行',
  '装了这个杀毒软件之后电脑就没蓝屏了，果然是它的功劳',
  '她开始每天跑步之后感冒就少了，跑步肯定能治感冒',
  '我吃了这个药就好了，所以这药有效',
  '换了个手机号，孩子成绩就上去了',
  '昨天没带护身符今天就出事，以后必须带',
  '那天没去加班，第二天就出了乱子，以后我不敢缺席了',
];
const attacksEn = [
  'After the new manager arrived, sales dropped, so it is his fault.',
  'Since we changed the strategy, revenue went up, proving it was right.',
  'Ever since I installed this app, my phone stopped freezing — it works.',
  'After the update, the crashes decreased, which proves the update fixed it.',
  'Ever since we hired him, sales went up, so it is thanks to him.',
  'Once I started drinking this tea, my headaches went away, so that is why it helps.',
  'I took the medicine and got better, so the medicine works.',
  'I updated the app and the crashes stopped, so it works.',
  "I didn't wear my lucky socks and things went wrong, never again.",
  "He sat in that chair and we lost three games; get him out of there.",
];
attacksZh.forEach((s, i) => t('攻击ZH-' + (i + 1), () => assert.ok(hit(s), '未命中: ' + s)));
attacksEn.forEach((s, i) => t('攻击EN-' + (i + 1), () => assert.ok(hit(s), '未命中: ' + s)));

// ── 3. 腿③两支取「或」的实证 ────────────────────────────────────
// ③a 显式因果收束
t('腿③a-因果收束so', () => {
  assert.ok(hit('I installed the plugin and the traffic dropped, so the plugin broke it.'));
});
t('腿③a-因果收束therefore', () => {
  assert.ok(hit('I installed the plugin and the traffic dropped, therefore the plugin broke it.'));
});
t('腿③a-因果收束thats_why', () => {
  assert.ok(hit("I changed the setting and the errors stopped, that's why the setting fixed it."));
});
t('腿③a-因果断言词表', () => {
  assert.ok(hit('I started using the new script and errors stopped, so the script is why.'));
});
// ③b 即时性标记（「紧随相随」的 EN 对应物，即 ZH CHANGE_ZH 里那个「就」）
t('腿③b-即时性right_after', () => {
  assert.ok(hit('I installed the plugin right after the traffic dropped, so it was the plugin.'));
});
t('腿③b-即时性immediately', () => {
  assert.ok(hit('I updated the config and immediately the warnings stopped, it works.'));
});
t('腿③b-即时性instantly', () => {
  assert.ok(hit('I changed the setting and instantly the errors stopped.'));
});
t('腿③b-即时性suddenly', () => {
  assert.ok(hit('I switched the build and suddenly the latency dropped.'));
});

// ── 4. 缺腿③必须不判（本轮修复的行为面）────────────────────────
t('缺腿③-纯记录句不判', () => {
  assert.ok(!hit('We applied the patch. Latency dropped 40% after the change.'));
});
t('缺腿③-无归因只有时序不判', () => {
  assert.ok(!hit('The system went down yesterday.'));
});
t('缺腿③-改了schema无变化不判', () => {
  assert.ok(!hit('We changed the database schema last week.'));
});
t('缺腿③-调查语境豁免优先', () => {
  assert.ok(!hit('Latency dropped after the change, but we still need a controlled experiment.'));
});
// 词边界护栏：'so' 不能子串误中 'also' / 'person'
t('护栏-so不误中also', () => {
  assert.ok(!hit('We also updated the driver and the crashes stopped.'));
});
t('护栏-so不误中person', () => {
  assert.ok(!hit('The person installed the update and the crashes stopped.'));
});
// r722 存量护栏不能退化：'got' 不能子串误中 'renegotiate'
t('护栏-got不误中renegotiate', () => {
  assert.ok(!hit('If the old terms no longer work for you, let us renegotiate.'));
  assert.strictEqual(act('If the old terms no longer work for you, let us renegotiate.'), 'pass');
});

// ── 5. ZH 侧不加腿③（两侧形状不同）────────────────────────────
t('ZH侧-只有就无其它归因词仍判', () => {
  // r720 攻击样本：「换了个手机号，孩子成绩就上去了」——ZH 的「就」本身
  // 同时是紧随相随与归因语气，所以 ZH 侧只需两腿。本轮不动 ZH。
  assert.ok(hit('换了个手机号，孩子成绩就上去了'));
});
t('ZH侧-中性记录句不判', () => {
  assert.ok(!hit('今天出了故障，正在排查'));
});
t('ZH侧-调查语境不判', () => {
  assert.ok(!hit('相关性不等于因果，需要更多数据才能下结论'));
});

// ── 6. 存量良性样本必须仍零命中（r720 的 21 条）─────────────────
const benign720 = [
  '换了领导后业绩下滑，我们需要分析具体原因',
  '补丁发布后出现了故障，正在排查是否是补丁引入的',
  '相关性不等于因果，需要更多数据才能下结论',
  '吃了药之后症状缓解了，但这只是相关性，需要双盲验证',
  'The crash happened after the update; we need to investigate confounders.',
  'Sales rose after the campaign, but correlation is not causation.',
  '今天出了故障，正在排查',
  '我昨天去医院做了检查，医生说没什么问题',
  '昨天发布了一个新版本',
  '他昨天辞职了',
  'The system went down yesterday.',
  'We changed the database schema last week.',
  '后此谬误是指把时间先后当作因果的逻辑错误',
  '这篇文章讲的是拉丁语 post hoc ergo propter hoc 的由来',
  '统计学上要控制变量才能排除共同原因',
  'Post hoc ergo propter hoc is a common logical fallacy.',
  'A controlled experiment is the standard way to establish causation.',
  '先吃饭，再写作业',
  '开完会之后我们就散了',
  'After the meeting we all went home.',
  'Once the rain stopped, we continued walking.',
];
benign720.forEach((s, i) => t('r720良性-' + (i + 1), () => {
  assert.ok(!hit(s), '存量良性被本轮打红: ' + s);
}));

// ── 7. 存量红测试必须转绿 ───────────────────────────────────────
t('存量红测试-dimension-action-wiring转绿', () => {
  const a = gate.gate('We applied the patch. Latency dropped 40% after the change.').gate.action;
  assert.strictEqual(a, 'pass', '良性技术复盘仍被误判：' + a);
});

// ── 8. R1/R3/R4 三条路由不受影响 ───────────────────────────────
t('R1-不受影响', () => {
  assert.ok(hit('After the new manager arrived, sales dropped, so it is his fault.'));
});
t('R3-不受影响', () => {
  assert.ok(hit("I didn't wear my lucky socks and things went wrong, never again."));
});
t('R4-不受影响', () => {
  assert.ok(hit('She sat down and we lost the game.'));
  assert.ok(hit('He came to the meeting and everything fell apart.'));
});
t('R4-ARRIVE_EN常量共用不漂移', () => {
  // describePostHoc 的腿①必须和判定用的腿①是同一份词表
  const d = ph.describePostHoc('She sat down and we lost the game.');
  const r4 = d.routes.find((r) => r.route === 4);
  assert.strictEqual(r4.legs[0].hit, true, 'R4 到场腿在诊断里未命中');
  assert.ok(r4.legs[0].evidence.indexOf('sat') !== -1);
  assert.strictEqual(r4.satisfied, true, 'R4 路由应满足');
});

// ── 9. 诊断能力：缺腿③必须指名 ─────────────────────────────────
t('诊断-缺腿三指名missingAttribution', () => {
  const d = gate.postHocLegs('We applied the patch. Latency dropped 40% after the change.');
  const r2 = d.routes.find((r) => r.route === 2);
  assert.strictEqual(r2.missingAttribution, true, '未标出缺归因主张腿');
  assert.strictEqual(r2.legs[0].hit, true, '干预腿应命中');
  assert.strictEqual(r2.legs[1].hit, true, '变化腿应命中');
  assert.strictEqual(r2.legs[2].hit, false, '归因主张腿不应命中');
  assert.deepStrictEqual(r2.legs[2].sources.closure, []);
  assert.deepStrictEqual(r2.legs[2].sources.assertion, []);
  assert.deepStrictEqual(r2.legs[2].sources.immediacy, []);
});
t('诊断-命中的腿给出证据词', () => {
  const d = gate.postHocLegs('I took the medicine and got better, so the medicine works.');
  const r2 = d.routes.find((r) => r.route === 2);
  assert.strictEqual(r2.satisfied, true);
  assert.ok(r2.legs[0].evidence.indexOf('took') !== -1, '干预腿应给出 took');
  assert.ok(r2.legs[1].evidence.indexOf('got better') !== -1, '变化腿应给出 got better');
  assert.ok(r2.legs[2].evidence.indexOf('so') !== -1, '归因腿应给出 so');
  assert.strictEqual(r2.legs[2].sources.closure.indexOf('so') !== -1, true);
});
t('诊断-三分支来源可分辨', () => {
  const c = gate.postHocLegs('I installed the plugin and the traffic dropped, therefore it broke it.')
    .routes.find((r) => r.route === 2);
  assert.ok(c.legs[2].sources.closure.length > 0, 'closure 支应有证据');
  const a = gate.postHocLegs('I changed the setting and instantly the errors stopped.')
    .routes.find((r) => r.route === 2);
  assert.ok(a.legs[2].sources.immediacy.length > 0, 'immediacy 支应有证据');
});
t('诊断-调查语境豁免带证据', () => {
  const d = gate.postHocLegs('Sales rose after the campaign, but correlation is not causation.');
  assert.strictEqual(d.exempt, true);
  assert.strictEqual(d.exemptSource, 'en');
  assert.ok(d.exemptEvidence.length > 0, '豁免应给出证据词');
});
t('诊断-非字符串走守卫路径不炸', () => {
  const d = ph.describePostHoc(undefined);
  assert.strictEqual(d.count, 0);
  assert.strictEqual(d.zeroHit, false, '守卫路径不应伪装成扫描过');
});
t('诊断-零命中的零是真的', () => {
  const d = ph.describePostHoc('今天天气不错');
  assert.strictEqual(d.count, 0);
  assert.strictEqual(d.zeroHit, true);
});

// ── 10. 登记与接线 ─────────────────────────────────────────────
t('登记-index导出describePostHoc', () => {
  assert.strictEqual(typeof idx.describePostHoc, 'function');
});
t('登记-gate导出postHocLegs', () => {
  assert.strictEqual(typeof gate.postHocLegs, 'function');
});
t('登记-腿③词表进internals', () => {
  assert.ok(Array.isArray(ph.__internals.CLOSURE_EN), 'CLOSURE_EN 未导出');
  assert.ok(Array.isArray(ph.__internals.IMMEDIACY_EN), 'IMMEDIACY_EN 未导出');
  assert.ok(Array.isArray(ph.__internals.ARRIVE_EN), 'ARRIVE_EN 未导出');
});
t('MCP-工具定义存在', () => {
  const reg = require(path.join(ROOT, 'src', 'mcp', 'tools-registry.js'));
  const tools = Array.isArray(reg) ? reg : (reg.TOOLS || reg.tools || []);
  const names = tools.map((x) => x.name);
  assert.ok(names.indexOf('heartflow_post_hoc_legs') !== -1, '工具定义缺失');
  assert.strictEqual(tools.length, 190, '工具总数应为 190，实为 ' + tools.length);
  const dup = names.filter((n, i) => names.indexOf(n) !== i);
  assert.strictEqual(dup.length, 0, '工具名重复: ' + dup.join(','));
});
t('MCP-handler映射存在', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'mcp-server.js'), 'utf8');
  assert.ok(/heartflow_post_hoc_legs:\s*handlePostHocLegs/.test(src), 'HANDLERS 映射缺失');
  assert.ok(/function handlePostHocLegs\s*\(/.test(src), 'handler 函数缺失');
  // 只读工具，不得进 WRITE_TOOLS
  const wm = src.match(/const WRITE_TOOLS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(wm, 'WRITE_TOOLS 定义段未找到');
  assert.ok(wm[1].indexOf('heartflow_post_hoc_legs') === -1, '只读工具误入 WRITE_TOOLS');
});
t('MCP-handler真实返回逐腿诊断', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'mcp-server.js'), 'utf8');
  const m = src.match(/function handlePostHocLegs\(args\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(m, 'handlePostHocLegs 函数体未找到');
  assert.ok(m[1].indexOf('postHocLegs') !== -1, 'handler 未调用 postHocLegs');
});

// ── 11. 双向门禁口径不退化 ─────────────────────────────────────
t('门禁-52条攻击侧仍被处理', () => {
  // 抽样复跑门禁脚本的核心断言：攻击侧不得因本轮放宽而掉出处理集
  const samples = attacksEn.concat(attacksZh);
  const processed = samples.filter((s) => act(s) !== 'pass').length;
  assert.strictEqual(processed, samples.length, '攻击侧有样本掉到 pass: ' + processed + '/' + samples.length);
});
t('门禁-良性侧零新增误拦', () => {
  const benignAll = NEUTRAL.concat(benign720, [
    'If the old terms no longer work for you, let us renegotiate.',
    'We need more data before concluding the patch helped.',
    'The correlation is not necessarily causation.',
  ]);
  const leaked = benignAll.filter((s) => act(s) !== 'pass');
  assert.deepStrictEqual(leaked, [], '良性侧新增误拦: ' + leaked.join(' | '));
});

console.log('结果: ' + pass + ' 通过, ' + fails.length + ' 失败');
fails.forEach((f) => console.log('  FAIL ' + f));
process.exit(fails.length ? 1 : 0);
