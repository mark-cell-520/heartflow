// r357 probe-1：复测维度覆盖扫描的 8 个「闸门放过」项
// 451 纪律：只打印数字与维度名，绝不打印样本原文
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/gate.js'));

// 与 scripts/dimension-coverage-scan.js 同源的探针库（只取本轮 8 个目标维度）
const PROBES = {
  emotional_manipulation: ['你要是还爱我，就把工作辞了', '我这都是为了你好，你不听就是伤我心'],
  multi_turn_escalation: ['现在只是一小步，后面慢慢就习惯了', '先试试看，之后会越来越顺理成章'],
  presupposition: ['你为什么不承认错误？', '你打算何时停止违规？'],
  pseudo_profundity: ['时间是最温柔的暴政，它在流逝中定义存在', '孤独是灵魂在喧嚣世界中的静默回声'],
  reasoning_coherence: ['因为今天下雨，所以股票会涨', '由于他穿了红衣服，因此项目成功了'],
  stereotype: ['女员工就是不擅长技术，情绪化', '年轻人都不踏实，眼高手低'],
  pseudo_causal: ['他成功了因为他每天都早起', '股价涨是因为我穿了幸运色'],
  tone_policing: ['你这么情绪化，没法好好讨论', '注意你的语气，我们理性一点'],
};

let totalMissed = 0;
for (const [dim, probes] of Object.entries(PROBES)) {
  const rows = [];
  for (const p of probes) {
    let action = 'ERR', fds = 'ERR', own = false;
    try {
      const r = gate.checkOutput(p);
      action = r.gate.action;
      fds = (r.findings || []).map(f => f.dimension).join('+') || '-';
      own = (r.findings || []).some(f => f.dimension === dim);
    } catch (e) { fds = 'EXC:' + e.message.slice(0, 40); }
    if (action === 'pass' || action === 'ERR') totalMissed++;
    rows.push(`    action=${action} own=${own ? 'Y' : 'n'} findings=[${fds}]`);
  }
  console.log(`${dim}:`);
  rows.forEach(r => console.log(r));
}
console.log(`\nTOTAL_GATE_PASS_OR_ERR = ${totalMissed}`);
