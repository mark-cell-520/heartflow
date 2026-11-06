/**
 * test/appeal-to-future.test.js — r233 诉诸未来维度测试
 * 覆盖：攻击命中（中英）、良性零误伤、三组豁免族（让步反驳/元话语/纪律否定，
 * 均以"嵌入真实签名 + 豁免标记"构造，可负例注入证明承重）、边界锁、
 * 中英混排多签名、负例注入（腿族删除/豁免删除/距离窗承重）。
 * 与 r228-r232 模块同一测试范式：每个负例注入删除一组常量后，
 * 攻击必须不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectAppealToFuture } = require('../src/appeal-to-future.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组豁免）
const NEVER = /(?!)/;

// ─── 攻击样本（应命中）────────────────────────────────────────
const ATTACKS_ZH = [
  '未来的技术终将解决碳排放，所以现在不必急着能源转型。',
  '等以后研发出更便宜的清洁能源，化石燃料污染自然会被淘汰，现在何必急着限排。',
  'AI迟早会自己学会纠错，我们现在不用人工审核。',
  '将来医学进步了一定能治好这病，现在没必要投入预防。',
  '等下一代人想出办法，气候问题总会解决，我们这代该排放排放。',
  '未来会有更高效的材料，现在担心资源枯竭是杞人忧天。',
  '技术奇点临近，届时一切难题都会迎刃而解，当务之急不是当下这些琐事。',
  '等可控核聚变商用，能源危机自解，现在扩建电网纯属浪费。',
  '将来机器人什么都能干，眼下讨论就业保障毫无意义。',
  '以后算力会无限便宜，如今优化算法是徒劳。',
];
const ATTACKS_EN = [
  'Future technology will solve carbon emissions, so there is no need to transition now.',
  'AI will eventually learn to correct itself, so we do not need human review yet.',
  'Medicine will surely cure this disease in the future, so prevention spending now is unnecessary.',
  'The singularity is near, and every problem will be solved then, so today issues do not matter.',
  'Someone will invent cheap clean energy down the road, so why bother cutting emissions today.',
];

// ─── 良性样本（不得命中）──────────────────────────────────────
const BENIGN = [
  '未来技术可能缓解部分排放，但当下仍需减排作为过渡。',
  '他会成功，因为他准备了很久而且数据支持。',
  '银行因资本金不足而倒闭，这是资产负债表的结果。',
  'Future tech may help, but we must act now as well.',
  'We should invest in prevention now because early treatment is cheaper.',
  '我们为未来的扩张预留了接口。',
  '与其赌未来技术，不如现在就把制度建好。',
  '未来的市场很难预测，所以投资要分散。',
  '我们要未雨绸缪，为将来的危机提早做准备。',
  '这项技术目前还不成熟，需要继续投入研发。',
];

// ─── 豁免族（真实签名 + 各组豁免标记，不得命中；删除标记后应变红）──
// 让步/反驳：嵌入"未来方案×免除当下"签名，但当下行动被肯定（并未 commit 该谬误）
const EXEMPT_REBUTTAL = [
  '未来的技术终将解决碳排放，于是有人主张现在不必转型——但当下仍必须减排，不能把希望全押在未来。',
  'Future technology will solve emissions, so some say there is no need to act now — but we still must cut emissions today.',
];
// 元话语：引用本族名称 + 真实签名（教学/定义句）
const EXEMPT_META = [
  '诉诸未来指的是用"未来的技术终将解决它"来论证"现在不必行动"。',
  'Techno-solutionism is the appeal to the future: "future tech will solve it, so no need to act now."',
];
// 纪律否定：明确指出本族错误（不含裸"诉诸未来"字样，确保与 META 独立承重）
const EXEMPT_DISAVOW = [
  '我们不能把责任推给未来，拿"以后技术会突破"当"现在不用投入"的借口。',
  'We must avoid passing the buck to the future, treating "future technology will solve it" as "no need to invest now."',
];

// ─── 边界锁（既有维度领地/缺腿/超距，不得命中）────────────────
const BOUNDARY = [
  '我相信只要我们足够努力，未来一定会成功。',   // wishful_thinking 领地（信念→结果，无免除腿②）
  '这个方案不够完美，既然做不到百分之百，那就干脆什么都不做。', // nirvana_fallacy 领地（无未来锚点）
  '结果现在还没出来，所以现在不必下结论。',       // 缺腿①（无未来方案锚点）
  '未来的技术会有突破。',                         // 缺腿②（有未来锚点，无免除当下）
];
// 双腿超距（腿①在句首、腿②在句末，默认窗 ZH50 不命中）
const OVERDIST = '未来的技术终将取得突破，这一点毫无疑问；与此同时，我们今天在基础设施、人才培养、资金储备、供应链安全等方方面面都做了大量且充分的准备工作，各个部门协同推进，执行得非常扎实到位，所以现在完全不必为此感到焦虑。';

const MIXED = '未来的技术终将解决碳排放，所以现在不必转型；Future tech will solve it, so no need to act now.';
const MULTI_ZH = '未来的技术终将解决碳排放，所以现在不必转型；等可控核聚变商用，现在建电网纯属浪费。';

console.log('appeal-to-future（r233 诉诸未来）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectAppealToFuture, 'function');
  assert.equal(detectAppealToFuture('').hit, false);
  assert.equal(detectAppealToFuture(null).hit, false);
  assert.equal(detectAppealToFuture('短').hit, false);
});

check('攻击命中：中文 10 条', () => {
  for (const t of ATTACKS_ZH) {
    const r = detectAppealToFuture(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'appeal_to_future');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.details.length > 10, 'details 非空');
    assert.ok(r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance.length > 20, 'guidance 非空');
  }
});

check('攻击命中：英文 5 条', () => {
  for (const t of ATTACKS_EN) {
    const r = detectAppealToFuture(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('良性零误伤：10 条', () => {
  for (const t of BENIGN) assert.equal(detectAppealToFuture(t).hit, false, '误伤: ' + t);
});

check('豁免族：让步反驳/元话语/纪律否定（中英 6 条）', () => {
  for (const t of EXEMPT_REBUTTAL.concat(EXEMPT_META, EXEMPT_DISAVOW)) {
    assert.equal(detectAppealToFuture(t).hit, false, '误伤: ' + t);
  }
});

check('边界锁：既有维度领地/缺腿/超距不判', () => {
  for (const t of BOUNDARY) assert.equal(detectAppealToFuture(t).hit, false, '误判: ' + t);
  assert.equal(detectAppealToFuture(OVERDIST).hit, false, '默认窗超距不命中');
});

check('中英混排与多签名加分档', () => {
  const m = detectAppealToFuture(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.equal(m.count, 2, '中英双签名');
  assert.ok(Math.abs(m.score - 0.72) < 1e-9, '双签名加分档');
  const z = detectAppealToFuture(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.equal(z.count, 2);
  assert.ok(Math.abs(z.score - 0.72) < 1e-9, '双签名加分档');
});

check('负例注入：四组腿族删除后攻击全部不再命中', () => {
  assert.equal(detectAppealToFuture(ATTACKS_ZH[1], { FUTURE_ZH: [] }).hit, false, '删未来锚点ZH');
  assert.equal(detectAppealToFuture(ATTACKS_ZH[0], { DEFER_ZH: [] }).hit, false, '删免除当下ZH');
  assert.equal(detectAppealToFuture(ATTACKS_EN[0], { FUTURE_EN: [] }).hit, false, '删未来锚点EN');
  assert.equal(detectAppealToFuture(ATTACKS_EN[0], { DEFER_EN: [] }).hit, false, '删免除当下EN');
});

check('负例注入：三组豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectAppealToFuture(EXEMPT_REBUTTAL[0], { REBUTTAL_ZH: NEVER }).hit, true, '删让步反驳ZH');
  assert.equal(detectAppealToFuture(EXEMPT_REBUTTAL[1], { REBUTTAL_EN: NEVER }).hit, true, '删让步反驳EN');
  assert.equal(detectAppealToFuture(EXEMPT_META[0], { META_ZH: NEVER }).hit, true, '删元话语ZH');
  assert.equal(detectAppealToFuture(EXEMPT_META[1], { META_EN: NEVER }).hit, true, '删元话语EN');
  assert.equal(detectAppealToFuture(EXEMPT_DISAVOW[0], { DISAVOW_ZH: NEVER }).hit, true, '删纪律否定ZH');
  assert.equal(detectAppealToFuture(EXEMPT_DISAVOW[1], { DISAVOW_EN: NEVER }).hit, true, '删纪律否定EN');
});

check('负例注入：距离窗承重（放大到 500 后长距句命中）', () => {
  assert.equal(detectAppealToFuture(OVERDIST).hit, false, '默认窗不命中');
  assert.equal(detectAppealToFuture(OVERDIST, { PAIR_ZH: 500 }).hit, true, '放大窗后命中');
});

check('引擎闸：良性样本不得以 appeal_to_future 进 findings（含接线后守卫）', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('appeal_to_future'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
