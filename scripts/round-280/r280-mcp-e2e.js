#!/usr/bin/env node
// round-280-mcp-e2e.js — r280：经 mcp-server handleRequest 调 heartflow_reasoning 的端到端矩阵
// 落盘原因：原脚本在 /tmp/hf-r278-mcp-final.js，未入库即不可审计（宪法纪律：探针必须落盘）。
// 注意1：handleRequest 是 async（src/mcp-server.js:5382），必须 await。
// 注意2：InferenceChain 判据只评估 inference 型中间步（_evalInferenceStep），
//        且必须有 conclusion 型步骤收口，否则 valid=false 但 jumps=[]（误报路径）。
//        正确链形状：premise* + inference(待判别步) + conclusion(收口)。
// 判定口径：攻击样本必须命中（valid:false 且 jumps>0），良性样本必须零误伤（valid=true 且 jumps=0）。
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
// 攻击形状：premise, premise, inference(踩无效式/无依据跳跃), conclusion
const ATTACK_DEFS = [
  ['肯定后件-EN', 'Is the switch on?', [
    ['premise', 'If the switch is up then the light is on.'],
    ['premise', 'The light is on.'],
    ['inference', 'Therefore the switch is up.'],
    ['conclusion', 'Therefore the switch is up.'],
  ]],
  ['否定前件-EN', 'Did she study?', [
    ['premise', 'If she studied then she passed.'],
    ['premise', 'She did not study.'],
    ['inference', 'Therefore she did not pass.'],
    ['conclusion', 'Therefore she did not pass.'],
  ]],
  ['肯定后件-ZH', '开关是否打开？', [
    ['premise', '如果开关打开那么灯会亮。'],
    ['premise', '灯亮了。'],
    ['inference', '所以开关一定被打开了。'],
    ['conclusion', '所以开关一定被打开了。'],
  ]],
  ['否定前件-ZH', '他是否学习？', [
    ['premise', '如果他学习那么他能通过考试。'],
    ['premise', '他没有学习。'],
    ['inference', '所以他不能通过考试。'],
    ['conclusion', '所以他不能通过考试。'],
  ]],
  ['无依据跳跃-量子', '方案是否可行？', [
    ['premise', '我们的预算比去年少了百分之三十，团队规模保持不变。'],
    ['premise', '去年同期我们完成了五个交付里程碑，质量指标全部达标。'],
    ['inference', '因此应采用分布式量子纠缠隧穿效应驱动的自治重构框架。'],
    ['conclusion', '该方案能彻底解决预算压缩难题。'],
  ]],
  ['无依据跳跃-裸名词', '该买吗？', [
    ['premise', '这款手机的屏幕尺寸是六点七英寸，电池容量五千毫安时。'],
    ['premise', '它的售价是三千二百元，比同档次产品便宜约百分之十五。'],
    ['inference', '所以它是斯克兰顿实控财团暗网节点共识机制的稀缺白名单载体。'],
    ['conclusion', '购买它即获得稀缺白名单资格。'],
  ]],
];

// 良性形状：同结构但 inference 步有效
const BENIGN_DEFS = [
  ['modus ponens-EN', 'Is the light on?', [
    ['premise', 'If the switch is up then the light is on.'],
    ['premise', 'The switch is up.'],
    ['inference', 'Therefore the light is on.'],
    ['conclusion', 'Therefore the light is on.'],
  ]],
  ['modus tollens-EN', 'Did she study?', [
    ['premise', 'If she studied then she passed.'],
    ['premise', 'She did not pass.'],
    ['inference', 'Therefore she did not study.'],
    ['conclusion', 'Therefore she did not study.'],
  ]],
  ['modus ponens-ZH', '灯是否亮着？', [
    ['premise', '如果开关打开那么灯会亮。'],
    ['premise', '开关已打开。'],
    ['inference', '所以灯会亮。'],
    ['conclusion', '所以灯会亮。'],
  ]],
  ['modus tollens-ZH', '他是否学习？', [
    ['premise', '如果他学习那么他能通过考试。'],
    ['premise', '他没有通过考试。'],
    ['inference', '所以他没学习。'],
    ['conclusion', '所以他没学习。'],
  ]],
  ['直言三段论', '结论是否成立？', [
    ['premise', '所有人都会死。'],
    ['premise', '苏格拉底是人。'],
    ['inference', '所以苏格拉底会死。'],
    ['conclusion', '所以苏格拉底会死。'],
  ]],
  ['归纳多数样本', '是否可靠？', [
    ['premise', '第一批两千个样本全部通过测试。'],
    ['premise', '第二批三千个样本同样全部通过测试。'],
    ['inference', '所以该批次产品的合格率很高。'],
    ['conclusion', '该批次产品合格率高。'],
  ]],
  ['多因陈述边缘良性', '为何冲突？', [
    ['premise', '预算被削减了三成，同时人员流失率上升到两成。'],
    ['premise', '上述两方面共同导致交付进度出现冲突与延迟。'],
    ['inference', '因此需要重新评估资源分配与排期。'],
    ['conclusion', '需要重新评估资源分配与排期。'],
  ]],
];

function isAttackHit(r) {
  if (!r || r.error) return false;
  const jumps = r.jumps;
  const n = Array.isArray(jumps) ? jumps.length : (typeof jumps === 'number' ? jumps : 0);
  return r.valid === false && n > 0;
}
function isBenignClean(r) {
  if (!r || r.error) return false;
  const jumps = r.jumps;
  const n = Array.isArray(jumps) ? jumps.length : (typeof jumps === 'number' ? jumps : 0);
  return r.valid === true && n === 0;
}

(async () => {
  let aHit = 0, aTot = 0, bClean = 0, bTot = 0;
  for (const [name, q, steps] of ATTACK_DEFS) {
    const r = await mkChain(q, steps);
    aTot++; const hit = isAttackHit(r);
    if (hit) aHit++;
    const jumps = r && r.jumps;
    const n = Array.isArray(jumps) ? jumps.length : (typeof jumps === 'number' ? jumps : 0);
    console.log(`${hit ? 'HIT ' : 'MISS'} attack  ${name.padEnd(22)} valid=${r && r.valid} jumps=${n}${r && r.error ? ' ERR=' + r.error : ''}`);
  }
  for (const [name, q, steps] of BENIGN_DEFS) {
    const r = await mkChain(q, steps);
    bTot++; const ok = isBenignClean(r);
    if (ok) bClean++;
    const jumps = r && r.jumps;
    const n = Array.isArray(jumps) ? jumps.length : (typeof jumps === 'number' ? jumps : 0);
    console.log(`${ok ? 'CLEAN' : 'FALSE+'} benign  ${name.padEnd(22)} valid=${r && r.valid} jumps=${n}${r && r.error ? ' ERR=' + r.error : ''}`);
  }
  console.log(`\n==== r280 MCP e2e: 攻击 ${aHit}/${aTot} 命中，良性 ${bClean}/${bTot} 零误伤 ====`);
  process.exit(aHit === aTot && bClean === bTot ? 0 : 1);
})();
