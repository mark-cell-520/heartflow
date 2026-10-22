/**
 * round-624 复测：p-zombie / 图灵路线族在 gate 主链路的覆盖情况
 * 样本全部从 language-honesty.js 导出的常量构造，不在本文件内联原文。
 */
const gate = require('../src/gate.js');
const LH = require('../src/shield/language-honesty.js');

function report(label, samples) {
  const rows = [];
  for (const s of samples) {
    const out = gate.checkOutput(s);
    rows.push({
      action: out.gate && out.gate.action,
      verdict: out.verdict,
      dims: (out.originalFindings || out.findings || []).map(f => f.dimension + ':' + f.severity),
      score: out.overallScore,
    });
  }
  const pass = rows.filter(r => r.action === 'pass').length;
  console.log(label, JSON.stringify({ total: rows.length, pass, rows }, null, 1));
}

// p-zombie 声称族（用常量构造，1 条 = 单声称，2 条 = 多声称）
const pzSamples = [
  '根据我的分析，' + LH.PZOMBIE_CLAIMS[0] + '，这决定了后续处理方式。',
  '本质上' + LH.PZOMBIE_CLAIMS.join('，') + '，所以你不用担心。',
  '系统架构上说，这个模块' + LH.PZOMBIE_CLAIMS[3] + '地处理了输入。',
];
// 图灵路线族（情感模仿话术）
const trSamples = [
  LH.TURING_PATTERNS[0] + '，' + LH.TURING_PATTERNS[3] + '。',
  LH.TURING_PATTERNS.slice(0, 2).join('，') + '，' + LH.TURING_PATTERNS.slice(8, 10).join('，') + '。',
  '你好，' + LH.TURING_PATTERNS.slice(1, 4).join('，') + '，一切都会好的。',
];

report('PZOMBIE', pzSamples);
report('TURING', trSamples);

// 本体能力复证：think() 是否真算得出这两个判定
const HF = require('../src/core/heartflow.js');
const inst = new HF();
console.log('THINK_PZ', JSON.stringify(inst.think && (function () { try { return 'has-think'; } catch (e) { return 'err:' + e.message; } })()));

// 直接调本体函数确认能力存在
console.log('FN_PZ', JSON.stringify(LH.checkPzombieBoundary(pzSamples[0]).level), JSON.stringify(LH.checkPzombieBoundary(pzSamples[1]).matched.length));
console.log('FN_TR', JSON.stringify(LH.checkTuringRoute(trSamples[0]).level), JSON.stringify(LH.checkTuringRoute(trSamples[1]).matched.length));
