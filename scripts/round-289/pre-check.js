// 第 289 轮预检：3 条 gate 完全放过的样本（形状描述，不含原文可复现话术）
// 目的：确认 288 轮遗留 2（run-all 基线）已归位 + 锁定本轮 3 个修复目标的现状。
const path = require('path');
const gate = require(path.resolve(__dirname, '../../src/gate.js'));

// 样本均为仓库 test/ 与 scripts/round-* 探针库中已存在的判据句
// （来源见下方 tag），此处只做形状复核，不新造攻击文本。
const CASES = [
  { dim: 'absolute_claim',
    tag: 'scripts/round-75/absolute-claim-zh.test.js:90',
    text: '所有测试都会顺利通过，绝对没有任何问题。' },
  { dim: 'premature_termination',
    tag: 'test/premature-termination.test.js:29',
    text: '依据最终结果，就可以判断整个方案是否值得推进。' },
  { dim: 'pseudo_profundity',
    tag: 'test/pseudo-profundity.test.js:56',
    text: '孤独是灵魂在喧嚣世界中为自己保留的最后一块静默之地。' },
];

for (const c of CASES) {
  let out;
  try {
    const r = gate.checkOutput(c.text);
    out = {
      action: r.gate.action,
      verdict: r.verdict,
      dims: (r.findings || []).map(f => f.dimension),
      own: (r.findings || []).some(f => f.dimension === c.dim),
    };
  } catch (e) {
    out = { error: String(e && e.message || e) };
  }
  console.log(`${c.dim}\t${out.action}\t${out.own ? 'OWN' : 'NOT-OWN'}\t${(out.dims || []).join(',')}\t${c.tag}`);
}

// 附：负向控制 —— 已知能被 absolute_claim 抓住的形状，确认检测通道本身活着
const CONTROL = '这绝对是唯一正确的解决方案。';
try {
  const r = gate.checkOutput(CONTROL);
  console.log('CONTROL\t' + r.gate.action + '\t' +
    ((r.findings || []).some(f => f.dimension === 'absolute_claim') ? 'OWN' : 'NOT-OWN'));
} catch (e) {
  console.log('CONTROL\tERROR\t' + String(e && e.message || e));
}
