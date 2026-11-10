#!/usr/bin/env node
// r280-matrix.js — r280 变体矩阵实测（同族 ≥5 变体全命中 + ≥5 良性全 pass）
// 路径必须与 r280-mcp-e2e.js 一致：经 mcp-server handleRequest 调 heartflow_reasoning 的
// chain（premise* + inference 待判别步 + conclusion 收口）。直接 gate() 不跑推理链层。
'use strict';
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const server = require(path.join(REPO, 'src/mcp-server.js'));

async function call(args) {
  const res = await server.handleRequest({
    jsonrpc: '2.0', id: 1, method: 'tools/call',
    params: { name: 'heartflow_reasoning', arguments: args },
  });
  let payload = res;
  const text = res && res.content && res.content[0] && res.content[0].text;
  if (typeof text === 'string') { try { payload = JSON.parse(text); } catch (e) { payload = { raw: text }; } }
  return payload;
}
async function mkChain(question, steps) {
  const c = await call({ action: 'chain_new', question });
  if (c && c.error) return { error: 'chain_new: ' + c.error };
  const chainId = c && (c.chainId || c.id);
  if (!chainId) return { error: 'chain_new 未返回 chainId', raw: c };
  for (const s of steps) {
    const a = await call({ action: 'chain_add', chainId, type: s[0], text: s[1] });
    if (a && a.error) return { error: 'chain_add: ' + a.error };
  }
  return call({ action: 'chain_analyze', chainId });
}

// 每个样本：[名称, 问题, 步骤数组]；步骤为 [type, text]
const ATTACKS = [
  // 否定前件族（跨前提否定 → 推出后件被否定）
  ['否定前件-EN 标准', 'Did she study?', [
    ['premise', 'If she studied then she passed.'],
    ['premise', 'She did not study.'],
    ['inference', 'Therefore she did not pass.'],
    ['conclusion', 'Therefore she did not pass.'],
  ]],
  ['否定前件-EN 带修饰', 'Was the audit verified?', [
    ['premise', 'If the audit was independently verified then the report is trustworthy.'],
    ['premise', 'The audit was clearly not independently verified.'],
    ['inference', 'So the report is untrustworthy.'],
    ['conclusion', 'So the report is untrustworthy.'],
  ]],
  ['否定前件-EN 倒装', 'Was the match cancelled?', [
    ['premise', 'The match will be cancelled if it rains.'],
    ['premise', 'It did not rain.'],
    ['inference', 'Hence the match was not cancelled.'],
    ['conclusion', 'Hence the match was not cancelled.'],
  ]],
  ['否定前件-ZH 标准', '他学习了吗？', [
    ['premise', '如果他学习那么他能通过考试。'],
    ['premise', '他没有学习。'],
    ['inference', '所以他不能通过考试。'],
    ['conclusion', '所以他不能通过考试。'],
  ]],
  ['否定前件-ZH 带修饰', '数据可信吗？', [
    ['premise', '如果数据是随机抽样的那么结论可推广。'],
    ['premise', '这些数据明显不是随机抽样的。'],
    ['inference', '所以结论完全不能推广。'],
    ['conclusion', '所以结论完全不能推广。'],
  ]],
  ['否定前件-ZH 倒装', '他能通过吗？', [
    ['premise', '他能通过考试，如果他学习。'],
    ['premise', '他没有学习。'],
    ['inference', '可见他不能通过考试。'],
    ['conclusion', '可见他不能通过考试。'],
  ]],
  ['否定前件-ZH 长句', '新药获批了吗？', [
    ['premise', '如果这个新药通过了全部三期临床试验那么它就获得了上市批准。'],
    ['premise', '这个新药并没有通过全部三期临床试验。'],
    ['inference', '所以它一定没有获得上市批准。'],
    ['conclusion', '所以它一定没有获得上市批准。'],
  ]],
  // 无依据跳跃族（专名堆砌，无任何继承）
  ['跳跃-裸名词 标准', '结论是什么？', [
    ['premise', '斯克兰顿财团控制了暗网。'],
    ['inference', '所以斯克兰顿实控财团暗网节点共识机制'],
    ['conclusion', '所以斯克兰顿实控财团暗网节点共识机制'],
  ]],
  ['跳跃-裸名词 双语', '结论是什么？', [
    ['premise', '该公司在运营一个跨境节点网络。'],
    ['inference', '所以该公司星际节点量子共识机制'],
    ['conclusion', '所以该公司星际节点量子共识机制'],
  ]],
  ['跳跃-裸名词 长句', '结论是什么？', [
    ['premise', '该组织有一个地下网络。'],
    ['inference', '所以该组织跨境地下网络节点共识机制决定了整个市场的走向'],
    ['conclusion', '所以该组织跨境地下网络节点共识机制决定了整个市场的走向'],
  ]],
];

const BENIGNS = [
  ['modus ponens-EN', 'Did she study?', [
    ['premise', 'If she studied then she passed.'],
    ['premise', 'She studied.'],
    ['inference', 'Therefore she passed.'],
    ['conclusion', 'Therefore she passed.'],
  ]],
  ['modus tollens-EN', 'Did she study?', [
    ['premise', 'If she studied then she passed.'],
    ['premise', 'She did not pass.'],
    ['inference', 'Therefore she did not study.'],
    ['conclusion', 'Therefore she did not study.'],
  ]],
  ['modus ponens-ZH', '他学习了吗？', [
    ['premise', '如果他学习那么他能通过考试。'],
    ['premise', '他学习了。'],
    ['inference', '所以他能通过考试。'],
    ['conclusion', '所以他能通过考试。'],
  ]],
  ['modus tollens-ZH', '他学习了吗？', [
    ['premise', '如果他学习那么他能通过考试。'],
    ['premise', '他没能通过考试。'],
    ['inference', '所以他没有学习。'],
    ['conclusion', '所以他没有学习。'],
  ]],
  ['归纳多数样本（边缘良性）', '合格率如何？', [
    ['premise', '这批样本全部通过了测试。'],
    ['inference', '所以该批次产品的合格率很高。'],
    ['conclusion', '所以该批次产品的合格率很高。'],
  ]],
  ['多因陈述（边缘良性）', '战争为何爆发？', [
    ['premise', '资源争夺是战争的原因之一。'],
    ['premise', '地缘政治也是战争的原因。'],
    ['inference', '所以战争是多因共同造成的。'],
    ['conclusion', '所以战争是多因共同造成的。'],
  ]],
  ['规范收尾（边缘良性）', '该怎么办？', [
    ['premise', '预算超支了。'],
    ['inference', '所以需要重新评估资源分配与排期。'],
    ['conclusion', '所以需要重新评估资源分配与排期。'],
  ]],
  ['直言三段论', '苏格拉底会死吗？', [
    ['premise', '所有人都会死。'],
    ['premise', '苏格拉底是人。'],
    ['inference', '所以苏格拉底会死。'],
    ['conclusion', '所以苏格拉底会死。'],
  ]],
  ['EN 归纳（边缘良性）', 'Pass rate?', [
    ['premise', 'All 40 sampled units passed inspection.'],
    ['inference', 'So the product pass rate is high.'],
    ['conclusion', 'So the product pass rate is high.'],
  ]],
];

(async () => {
  let aHit = 0; const aMiss = [];
  for (const [name, q, steps] of ATTACKS) {
    const r = await mkChain(q, steps);
    const valid = r && r.analysis && typeof r.analysis.valid === 'boolean' ? r.analysis.valid
      : (r && typeof r.valid === 'boolean' ? r.valid : null);
    const jumps = r && r.analysis && Array.isArray(r.analysis.jumps) ? r.analysis.jumps.length
      : (r && Array.isArray(r.jumps) ? r.jumps.length : -1);
    const hit = valid === false && jumps > 0;
    if (hit) aHit++; else aMiss.push(`${name}(valid=${valid},jumps=${jumps})`);
  }
  let bPass = 0; const bFail = [];
  for (const [name, q, steps] of BENIGNS) {
    const r = await mkChain(q, steps);
    const valid = r && r.analysis && typeof r.analysis.valid === 'boolean' ? r.analysis.valid
      : (r && typeof r.valid === 'boolean' ? r.valid : null);
    const jumps = r && r.analysis && Array.isArray(r.analysis.jumps) ? r.analysis.jumps.length
      : (r && Array.isArray(r.jumps) ? r.jumps.length : -1);
    const ok = valid === true && jumps === 0;
    if (ok) bPass++; else bFail.push(`${name}(valid=${valid},jumps=${jumps})`);
  }
  console.log('==== r280 变体矩阵（heartflow_reasoning 链路径）====');
  console.log(`攻击: ${aHit}/${ATTACKS.length} 命中` + (aMiss.length ? '\n  MISS: ' + aMiss.join('\n        ') : ''));
  console.log(`良性: ${bPass}/${BENIGNS.length} 零误伤` + (bFail.length ? '\n  FALSE+: ' + bFail.join('\n        ') : ''));
  console.log(aHit === ATTACKS.length && bPass === BENIGNS.length ? 'MATRIX PASS' : 'MATRIX FAIL');
})();
