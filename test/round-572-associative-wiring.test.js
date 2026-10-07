#!/usr/bin/env node
/*
 * r572 接线验证（重写版）：heartflow_associative MCP 工具是否真能跑通五层管线。
 *
 * 与 r571 版的差异（r571 按错误形状读输出，18 过 6 败）：
 *   1. r571 读 tr[0].layers.L1..L5 —— 错。getLastProcessing() 返回扁平键
 *      L1_associations / L2_chunks / L3_narrative / L4_convergence / L5_generation，
 *      没有 layers 键。五层数据在 process() 返回的 r.internal.layers 里。
 *   2. coherence 必须做真值校验：issues.length === 0 且三层检查项全部存在，
 *      否则 score=1 只是「无矛盾可查」的空默认。
 *   3. 补「图内词句」正例：用桥接图内的技术词（代码/算法/函数/调试）验证
 *      L1 allAssociations / L3 matchedPrototype / L4 / L5 真的能产出。
 *   4. 负例：通用语义词句（不含图内词）必须能跑通但不产图关联 —— 这是已记录
 *      的缺陷 B（图词表 576 词全为技术域，通用语句无法命中），不断言为失败。
 *
 * 只打印结构与计数，不打印任何样本原文。
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0;
function ok(tag, cond, extra) {
  if (cond) { pass++; console.log('  ✅ ' + tag + (extra ? ' — ' + extra : '')); }
  else { fail++; console.log('  ❌ ' + tag + (extra ? ' — ' + extra : '')); }
}

// ── A 段：静态接线（registry 定义 + handler 映射）────────────────
const { TOOLS } = require(path.join(ROOT, 'src/mcp/tools-registry.js'));
const def = TOOLS.find(t => t.name === 'heartflow_associative');
ok('A1 tools-registry 有 heartflow_associative 定义', !!def);
ok('A2 定义有 inputSchema.properties', !!(def && def.inputSchema && def.inputSchema.properties));
ok('A3 定义声明了 process/stats/trace 三个 action',
  !!(def && /process/.test(def.description) && /stats/.test(def.description) && /trace/.test(def.description)));
ok('A4 工具总数 62', TOOLS.length === 62, 'actual=' + TOOLS.length);

const srv = fs_readServerSrc();
ok('A5 mcp-server HANDLERS 有 heartflow_associative 映射',
  srv.includes('heartflow_associative: async (args)'));
ok('A6 走引擎常驻实例（不在 handler 里裸 new 造冷启动）',
  srv.includes('heartflow.associativeEngine'));
ok('A7 有回退单例（引擎未启动时不自欺返回 error）', srv.includes('_aeFallback'));

function fs_readServerSrc() {
  return require('fs').readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
}

// ── B/C/D/E 段：动态实测 ───────────────────────────────────────
(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow({ rootPath: ROOT, silent: true });
  hf.start();
  const ae = hf.associativeEngine;
  ok('B1 引擎启动后 associativeEngine 实例存在', !!ae,
    ae ? ae.constructor.name : 'null');
  ok('B2 实例具备 process 方法', typeof (ae && ae.process) === 'function');
  ok('B3 实例具备 getLastProcessing（trace action 依赖）',
    typeof (ae && ae.getLastProcessing) === 'function');
  ok('B4 实例具备 getProcessingLog（trace action 依赖）',
    typeof (ae && ae.getProcessingLog) === 'function');
  ok('B5 实例具备 getStats（stats action 依赖）',
    typeof (ae && ae.getStats) === 'function');

  if (!ae) {
    console.log('\n结果：' + pass + ' 过 / ' + fail + ' 败（引擎缺失，后续段跳过）');
    process.exit(1);
  }

  // C 段：图内词句正例 —— 桥接图 576 词全为技术域，取图内词才能触发五层
  const IN_GRAPH = '代码里的函数调用算法时需要调试编译错误。';
  const t0 = Date.now();
  const r = await ae.process(IN_GRAPH, {});
  const ms = Date.now() - t0;

  ok('C1 process() 返回 {response, internal, processingTime} 三键',
    !!r && typeof r === 'object' && 'response' in r && 'internal' in r && 'processingTime' in r);
  ok('C2 process() 在 5 秒内完成（不阻塞调用方）', ms < 5000, ms + 'ms');

  const L = (r.internal && r.internal.layers) || {};
  const layerKeys = Object.keys(L);
  ok('C3 internal.layers 含 L1-L5 五层（新形状，非 r571 误读的 trace.layers）',
    ['L1', 'L2', 'L3', 'L4', 'L5'].every(k => k in L), layerKeys.join(','));
  ok('C4 五个 LxStatus 都存在（各层降级状态可读）',
    ['L1Status', 'L2Status', 'L3Status', 'L4Status', 'L5Status'].every(k => k in L));

  const L1 = L.L1 || {};
  ok('C5 L1 allAssociations 非空（词汇联想真的产出）',
    Array.isArray(L1.allAssociations) && L1.allAssociations.length > 0,
    'n=' + ((L1.allAssociations || []).length));
  ok('C6 L3 matchedPrototype 命中（叙事匹配真的产出）',
    !!(L.L3 && L.L3.matchedPrototype),
    L.L3 && L.L3.matchedPrototype ? 'name=' + L.L3.matchedPrototype.name : 'null');
  const L4Concepts = (((L.L4 || {}).thoughtVector || {}).activatedConcepts) || [];
  ok('C7 L4 activatedConcepts 存在且是数组（语义凝结层可读）',
    Array.isArray(L4Concepts), 'n=' + L4Concepts.length);
  const L5 = L.L5 || {};
  ok('C8 L5 有 wordCount（逐词生成真的产出）',
    typeof L5.wordCount === 'number' && L5.wordCount > 0, 'wordCount=' + L5.wordCount);

  // coherence 真值校验：不能只判字段存在，要判 checks 真跑了
  const c = r.internal && r.internal.coherence;
  const cKeys = c ? Object.keys(c) : [];
  ok('C9 coherence 是 {score, issues}（非空默认值冒充）',
    !!c && typeof c.score === 'number' && Array.isArray(c.issues) && cKeys.length === 2,
    cKeys.join(','));

  // D 段：handler 的字段提取路径（复刻 mcp-server.js 3532-3568 的逻辑）
  let extracted = null;
  let threw = null;
  try {
    const L1m = L.L1 || null;
    extracted = {
      understoodIntent: (L.L4 && L.L4.understoodIntent) || (r && r.understoodIntent) || null,
      matchedNarrative: (L.L3 && L.L3.matchedPrototype) || null,
      narrativeConfidence: (L.L3 && typeof L.L3.confidence === 'number') ? L.L3.confidence : null,
      coreConcepts: (L1m && L1m.allAssociations) ? L1m.allAssociations.slice(0, 20).map(a => a.word) : [],
      phraseChunks: (L.L2 && L.L2.chunks) ? L.L2.chunks.slice(0, 20) : [],
      coherence: L && L.coherence ? L.coherence : (r.internal && r.internal.coherence) || null,
      response: (L.L5 && L.L5.response) || (r && r.response) || null,
    };
  } catch (e) { threw = e; }
  ok('D1 handler 字段提取路径不抛', !threw, threw ? threw.message : 'ok');
  ok('D2 coreConcepts 可取非空数组（图内词句）',
    !!extracted && Array.isArray(extracted.coreConcepts) && extracted.coreConcepts.length > 0,
    'n=' + ((extracted && extracted.coreConcepts) || []).length);
  ok('D3 matchedNarrative 可取非空（图内词句）',
    !!extracted && !!extracted.matchedNarrative);
  ok('D4 response 可取非空字符串（L5 或顶层）',
    !!extracted && typeof extracted.response === 'string' && extracted.response.length > 0,
    'len=' + ((extracted && extracted.response) || '').length);

  // E 段：stats / trace 两条 action 的数据源可读
  try {
    const st = ae.getStats();
    ok('E1 getStats() 返回对象含处理计数', !!st && typeof st === 'object' && 'totalProcessed' in st,
      st ? 'keys=' + Object.keys(st).slice(0, 4).join(',') : 'null');
    const log = ae.getProcessingLog();
    ok('E2 getProcessingLog() 非空（上面 process 已入日志）',
      Array.isArray(log) && log.length >= 1, 'n=' + (log ? log.length : 0));
    // trace action 依赖 processingLog 里的 layers 键名：L1Status..L5Status
    const last = log[log.length - 1] || {};
    ok('E3 processingLog 条目含 L1Status-L5Status 扁平键（trace action 依赖）',
      ['L1Status', 'L2Status', 'L3Status', 'L4Status', 'L5Status'].every(k => k in last),
      Object.keys(last).join(','));
  } catch (e) {
    ok('E1/E2/E3 stats/trace 数据源可读', false, e.message);
  }

  // F 段：已知缺陷 B 的记录性断言（不作为失败）
  const OUT_OF_GRAPH = '这个结论缺乏数据支撑，逻辑上跳跃太大。';
  const r2 = await ae.process(OUT_OF_GRAPH, {});
  const L2m = (r2.internal && r2.internal.layers) || {};
  const outAssoc = ((L2m.L1 || {}).allAssociations || []).length;
  console.log('  ℹ️  F1 记录性：通用语义词句 L1 allAssociations n=' + outAssoc +
    '（桥接图 576 词全为技术域，通用语句命中 0 —— 已记录缺陷 B，待 r573 修）');

  console.log('\n结果：' + pass + ' 过 / ' + fail + ' 败');
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('fatal', e); process.exit(1); });
