#!/usr/bin/env node
/*
 * r572 handler 通道实测（v2）：走 JSON-RPC tools/call 真实入口
 * handleRequest({jsonrpc,method:'tools/call',params:{name,arguments}}, sessionId, headers)
 * 证明修好的 handler 本体返回真值，而不是我复刻的正确逻辑。
 *
 * 背景：r571 的 handler 读 ae.getLastProcessing()[0].layers，那个键不存在，
 * 导致所有返回字段恒为 null（假接线）。测试里复刻的正确逻辑会过，但
 * handler 本体仍是坏的——所以必须打真实入口。
 *
 * 只打印结构与计数，不打印任何样本原文。
 */
'use strict';
// [全局修复 2026-11-16] 第 24 行 require mcp-server.js 会经 require 链加载
// src/utils/stdio-guard.js——「非 JSON-RPC 帧」的 stdout 写入被改道 stderr，
// 本文件的「结果：N 过 / M 败」汇总行随之流失，run-all 只 capture stdout。
// 先例：round-733-injection-synonyms.test.js:38-45。require 前关掉守卫。
process.env.HF_KEEP_STDOUT_LOGS = process.env.HF_KEEP_STDOUT_LOGS || '1';

const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0;
function ok(tag, cond, extra) {
  if (cond) { pass++; console.log('  ✅ ' + tag + (extra ? ' — ' + extra : '')); }
  else { fail++; console.log('  ❌ ' + tag + (extra ? ' — ' + extra : '')); }
}

(async () => {
  const srv = require(path.join(ROOT, 'src/mcp-server.js'));
  ok('H1 mcp-server 可 require 且导出 handleRequest', typeof srv.handleRequest === 'function');
  ok('H2 导出 initHeartFlow（handler 依赖引擎常驻实例）',
    typeof srv.initHeartFlow === 'function');
  if (typeof srv.handleRequest !== 'function') {
    console.log('\n结果：' + pass + ' 过 / ' + fail + ' 败');
    process.exit(1);
  }
  // 与 MCP server 启动路径一致：先 initHeartFlow 再处理请求
  srv.initHeartFlow();

  async function call(name, args) {
    const resp = await srv.handleRequest({
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name, arguments: args },
    }, 'test-session', { __stdio: true });
    return resp;
  }
  function parse(resp) {
    // handleRequest 返回 { content: [{type,text}], isError }（非 JSON-RPC 包装）
    if (!resp || !Array.isArray(resp.content) || !resp.content[0]) return { __raw: resp };
    const t = resp.content[0].text;
    if (typeof t !== 'string') return { __raw: resp.content[0] };
    try { return t ? JSON.parse(t) : {}; } catch (_) { return { __raw: t }; }
  }

  // process action：图内词句（桥接图 576 词全为技术域）
  const p1 = parse(await call('heartflow_associative', {
    action: 'process', text: '代码里的函数调用算法时需要调试编译错误。',
  }));
  ok('H3 process 返回对象且无 error', !!p1 && typeof p1 === 'object' && !p1.error,
    p1 && p1.error ? 'error=' + p1.error : 'keys=' + Object.keys(p1).slice(0, 6).join(','));
  // [全局修复 2026-11-16] H4/H5 依赖 dict-data/association-graph.json（2388 节点 /
  // 7877 条真实边）——该文件在 .gitignore 内（08dc14f8 大文件移出追踪），只存在于
  // 有完整数据副本的机器。净室里 src 侧 2045 节点全空数组、桥接合并 0 边，L1 联想
  // 恒空、L3 无匹配原型——引擎行为正确（五层 success、degraded=false），是**数据
  // 缺失**不是引擎缺陷（同 classics-rules 语料库家族）。图在位时严格断言，缺失时
  // 明确 SKIP 并打原因，不伪造通过也不误报引擎失败。
  const DICT_GRAPH = path.join(ROOT, 'dict-data', 'association-graph.json');
  const graphPresent = fs.existsSync(DICT_GRAPH);
  if (!graphPresent) {
    console.log('  ⏭ SKIP H4/H5: dict-data/association-graph.json 缺失（gitignore 数据文件，本机无联想边）');
  } else {
    ok('H4 coreConcepts 非空数组（真值，非 null）',
      Array.isArray(p1.coreConcepts) && p1.coreConcepts.length > 0,
      'n=' + ((p1.coreConcepts || []).length));
    ok('H5 matchedNarrative 非空（真值，非 null）', !!p1.matchedNarrative);
  }
  ok('H6 response 非空字符串', typeof p1.response === 'string' && p1.response.length > 0,
    'len=' + ((p1.response || '').length));
  ok('H7 coherence 是 {score, issues} 真值',
    !!p1.coherence && typeof p1.coherence.score === 'number' && Array.isArray(p1.coherence.issues),
    p1.coherence ? 'score=' + p1.coherence.score + ',issues=' + p1.coherence.issues.length : 'null');
  ok('H8 layerStatuses 五层齐全且非全 null',
    !!p1.layerStatuses && ['L1', 'L2', 'L3', 'L4', 'L5'].every(k => p1.layerStatuses[k] != null),
    p1.layerStatuses ? JSON.stringify(p1.layerStatuses) : 'null');
  ok('H9 processingTime 是正数', typeof p1.processingTime === 'number' && p1.processingTime > 0,
    'ms=' + p1.processingTime);
  ok('H10 degraded 是布尔', typeof p1.degraded === 'boolean', 'degraded=' + p1.degraded);

  // 空输入必须报错而不是返回占位应答冒充成功
  const p0 = parse(await call('heartflow_associative', { action: 'process', text: '' }));
  ok('H11 空输入返回 error（不拿占位应答冒充成功）', !!p0 && !!p0.error, p0 && p0.error ? 'err' : 'no err');

  // stats action
  const p2 = parse(await call('heartflow_associative', { action: 'stats' }));
  ok('H12 stats 返回统计对象', !!p2 && !!p2.stats && typeof p2.stats.totalProcessed === 'number',
    p2 && p2.stats ? 'total=' + p2.stats.totalProcessed : 'null');

  // trace action
  const p3 = parse(await call('heartflow_associative', { action: 'trace', limit: 2 }));
  ok('H13 trace 返回数组', !!p3 && Array.isArray(p3.trace) && p3.trace.length >= 1,
    'n=' + (p3 && p3.trace ? p3.trace.length : 0));
  ok('H14 trace 条目含 layers 键名数组 + coherence + degraded',
    !!(p3 && p3.trace && p3.trace[0] && Array.isArray(p3.trace[0].layers) && 'coherence' in p3.trace[0] && 'degraded' in p3.trace[0]));

  // 未知 action 走默认分支（不抛）
  let threw = null;
  try { await call('heartflow_associative', { action: 'nope', text: 'x' }); } catch (e) { threw = e; }
  ok('H15 未知 action 不抛', !threw, threw ? threw.message : 'ok');

  // tools/list 通道含 heartflow_associative（返回 { tools: [...] } 直接挂顶层）
  const listResp = await srv.handleRequest(
    { jsonrpc: '2.0', id: 9, method: 'tools/list', params: {} },
    'test-session', { __stdio: true }
  );
  const names = (listResp && Array.isArray(listResp.tools) ? listResp.tools : [])
    .map(t => t.name);
  ok('H16 tools/list 含 heartflow_associative', names.includes('heartflow_associative'),
    '总数=' + names.length);

  console.log('\n结果：' + pass + ' 过 / ' + fail + ' 败');
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('fatal', e); process.exit(1); });
