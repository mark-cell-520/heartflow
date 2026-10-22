// scripts/round-622-unwired-disc.js
// 目的：从 r622 零路由池里筛出「真有辨别分化」的候选（③ 类真升级选型用）。
// 口径：对每个实例方法，构造「压制/诱导类样本」与「良性样本」两组实参，
//       对比输出是否出现结构性分化（输出值/结构/状态变化）。
// 只输出数字与形状，不输出任何样本原文。
'use strict';
const path = require('path');

const HF = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));
const { HeartFlow } = HF;

// 五类入参形状（覆盖方法最常见签名），全部为形状描述不含原文：
//   A: 文本 + 上下文对象
//   B: 文本 + 数组
//   C: 纯文本
//   D: 纯对象（decision-ish）
//   E: 纯数组
const SHAPES = ['A', 'B', 'C', 'D', 'E'];

// r622 零路由池（round-616/621 probe 实测 routes=0 的 30 个）
const ZERO_ROUTE_POOL = ['outputChecklist', 'whatLearned', 'instructions', 'fieldInjector',
  'strategicRestraint', 'dreamConsolidation', 'globalWorkspace', 'associativeEngine',
  'memoryIndex', 'aiSelfPositioning', 'hypothesisDriver', 'decisionFeedback',
  'ruleGrowth', 'gapExecutor', 'decisionExecutor', 'experienceDistiller',
  'learningPulse', 'learningOrchestrator', 'taskUrgencyEstimator', 'mindWanderer',
  'phenomenology', 'agentCard', 'patternTracer', 'preferenceGuard', 'postTraining',
  'boundaryNeg', 'memoryKernel', 'core', 'daoDecision', 'selfDiagnosis'];

function makeArg(shape, kind) {
  const repressive = kind === 'repressive';
  if (shape === 'A') {
    return [
      repressive ? 'REPRESSIVE_TEXT_SHAPE_A' : 'BENIGN_TEXT_SHAPE_A',
      repressive ? { authority: 'ABSOLUTE', stage: 'COERCION' } : { authority: 'NONE', stage: 'NORMAL' }
    ];
  }
  if (shape === 'B') {
    return [repressive ? 'REPRESSIVE_TEXT_SHAPE_B' : 'BENIGN_TEXT_SHAPE_B', []];
  }
  if (shape === 'C') {
    return [repressive ? 'REPRESSIVE_TEXT_SHAPE_C' : 'BENIGN_TEXT_SHAPE_C'];
  }
  if (shape === 'D') {
    return [{ requiresVerification: repressive, requiresRestraint: repressive, riskLevel: repressive ? 3 : 0 }];
  }
  return [[]];
}

function shapeKey(v) {
  try {
    const s = JSON.stringify(v);
    return typeof s === 'string' ? s.slice(0, 120) : String(v).slice(0, 120);
  } catch (e) {
    return 'CIRCULAR';
  }
}

async function main() {
  const hf = new HeartFlow();
  hf.start();
  const ALLOWS = HeartFlow.ALLOWED_ROUTES ? Array.from(HeartFlow.ALLOWED_ROUTES) : [];
  const report = {};
  const instances = hf._modules || {};
  const KEYS = Object.keys(instances).filter(k => ZERO_ROUTE_POOL.includes(k) || ZERO_ROUTE_POOL.some(p => k.toLowerCase() === p.toLowerCase()));
  for (const key of KEYS) {
    const inst = instances[key];
    if (!inst || typeof inst !== 'object') continue;
    const proto = Object.getPrototypeOf(inst);
    if (!proto) continue;
    const methods = Object.getOwnPropertyNames(proto).filter(
      m => m !== 'constructor' && typeof inst[m] === 'function'
      // _doSaveAsync 在探针环境（无 fs 桩）下 100% 抛，属探针对比噪音，排除
      && m !== '_doSaveAsync'
    );
    if (!methods.length) continue;

    const entry = { methods: methods.length, disc: [], constant: [], error: [] };
    for (const m of methods) {
      process.stderr.write('PROBE ' + key + '.' + m + '\n');
      let anyDisc = false;
      const perShape = {};
      for (const shape of SHAPES) {
        let a, b;
        try {
          a = inst[m](...makeArg(shape, 'repressive'));
        } catch (e) {
          perShape[shape] = 'ERR';
          continue;
        }
        try {
          b = inst[m](...makeArg(shape, 'benign'));
        } catch (e) {
          perShape[shape] = 'ERR';
          continue;
        }
        const ra = (a && typeof a.then === 'function') ? await a : a;
        const rb = (b && typeof b.then === 'function') ? await b : b;
        const d = shapeKey(ra) !== shapeKey(rb);
        perShape[shape] = d ? 'DISC' : 'SAME';
        if (d) anyDisc = true;
      }
      if (anyDisc) entry.disc.push({ m, perShape });
      else entry.constant.push(m);
    }
    if (entry.disc.length) report[key] = entry;
    // 增量落盘，防半路崩掉丢全部结果
    require('fs').writeFileSync('/tmp/r622-disc-partial.json', JSON.stringify(report, null, 1));
  }

  const summary = {};
  for (const k of Object.keys(report)) {
    summary[k] = report[k].disc.map(d => d.m);
  }
  const routed = ALLOWS.filter(r => ZERO_ROUTE_POOL.some(p => r === p || r.startsWith(p + '.')));
  console.log('ZERO_POOL_ROUTED=' + routed.length + '/' + ZERO_ROUTE_POOL.length);
  console.log('DISCRIMINATING_METHODS=' + JSON.stringify(summary, null, 1));
  // 只保留有辨别分化的实例
  const keys = Object.keys(summary);
  console.log('TOTAL_INSTANCES=' + keys.length);
  console.log('INSTANCE_KEYS=' + KEYS.join(','));
}

main().then(() => process.exit(0)).catch(e => { console.log('FATAL', e && e.message); process.exit(1); });
// 兜底：即便路径上抛错，也把已完成部分落出来
process.on('exit', () => { /* 已通过 console.log 输出 */ });
