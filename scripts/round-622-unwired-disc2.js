// scripts/round-622-unwired-disc.js
// 目的：从 r622 零路由池（23 个有方法的实例）里筛出「真有辨别分化」的候选。
// 口径：hf[accessor] 取实例（不是 _modules 键——r616/r621 教训：_modules 是懒加载缓存键，
//       与访问器名不一致，按 _modules 遍历会得到 0 个候选）。
// 只输出数字与形状，不输出任何样本原文（451 自检铁律）。
'use strict';
const path = require('path');
const fs = require('fs');

const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));

const SHAPES = ['A', 'B', 'C', 'D', 'E'];
// 每实例方法上限：只探前 N 个，防崩在深层实例上空转
const MAX_METHODS_PER_INSTANCE = 6;
// r622 起排除项：内部状态记录依赖未初始化字段，遍历即崩（associativeEngine.recordLayer）
const SKIP_INSTANCES = ['associativeEngine'];
const ZERO_ROUTE_POOL = ['outputChecklist', 'whatLearned', 'instructions', 'fieldInjector',
  'strategicRestraint', 'dreamConsolidation', 'globalWorkspace',
  'memoryIndex', 'aiSelfPositioning', 'hypothesisDriver', 'decisionFeedback',
  'ruleGrowth', 'gapExecutor', 'decisionExecutor', 'agentCard', 'preferenceGuard',
  'postTraining', 'boundaryNeg', 'memoryKernel', 'core', 'daoDecision', 'selfDiagnosis'];

function makeArg(shape, kind) {
  const repressive = kind === 'repressive';
  if (shape === 'A') {
    return [
      repressive ? 'REPRESSIVE_TEXT_SHAPE_A' : 'BENIGN_TEXT_SHAPE_A',
      repressive ? { authority: 'ABSOLUTE', stage: 'COERCION' } : { authority: 'NONE', stage: 'NORMAL' }
    ];
  }
  if (shape === 'B') return [repressive ? 'REPRESSIVE_TEXT_SHAPE_B' : 'BENIGN_TEXT_SHAPE_B', []];
  if (shape === 'C') return [repressive ? 'REPRESSIVE_TEXT_SHAPE_C' : 'BENIGN_TEXT_SHAPE_C'];
  if (shape === 'D') return [{ requiresVerification: repressive, requiresRestraint: repressive, riskLevel: repressive ? 3 : 0 }];
  return [[]];
}

function shapeKey(v) {
  try {
    const s = JSON.stringify(v);
    return typeof s === 'string' ? s.slice(0, 120) : String(v).slice(0, 120);
  } catch (e) { return 'CIRCULAR'; }
}

async function main() {
  const hf = new HeartFlow();
  hf.start();
  const ALLOWS = HeartFlow.ALLOWED_ROUTES ? Array.from(HeartFlow.ALLOWED_ROUTES) : [];
  const routed = ALLOWS.filter(r => ZERO_ROUTE_POOL.some(p => r === p || r.startsWith(p + '.')));
  console.log('ZERO_POOL_ROUTED=' + routed.length + '/' + ZERO_ROUTE_POOL.length);

  const report = {};
  for (const key of ZERO_ROUTE_POOL) {
    if (SKIP_INSTANCES.includes(key)) continue;
    const inst = hf[key];
    if (!inst || typeof inst !== 'object') continue;
    const proto = Object.getPrototypeOf(inst);
    if (!proto) continue;
    const methods = Object.getOwnPropertyNames(proto).filter(
      m => m !== 'constructor' && typeof inst[m] === 'function' && m !== '_doSaveAsync'
    ).slice(0, MAX_METHODS_PER_INSTANCE);
    if (!methods.length) continue;

    const entry = { methods: methods.length, disc: [], constant: [], thrown: [] };
    for (const m of methods) {
      let anyDisc = false;
      const perShape = {};
      let threw = 0;
      for (const shape of SHAPES) {
        let ra, rb;
        try { ra = inst[m](...makeArg(shape, 'repressive')); }
        catch (e) { threw++; perShape[shape] = 'ERR'; continue; }
        try { rb = inst[m](...makeArg(shape, 'benign')); }
        catch (e) { threw++; perShape[shape] = 'ERR'; continue; }
        const a = (ra && typeof ra.then === 'function') ? await ra : ra;
        const b = (rb && typeof rb.then === 'function') ? await rb : rb;
        const d = shapeKey(a) !== shapeKey(b);
        perShape[shape] = d ? 'DISC' : 'SAME';
        if (d) anyDisc = true;
      }
      if (anyDisc) entry.disc.push({ m, perShape });
      else if (threw === SHAPES.length) entry.thrown.push(m);
      else entry.constant.push(m);
    }
    report[key] = entry;
    fs.writeFileSync('/tmp/r622-disc-partial.json', JSON.stringify(report, null, 1));
  }

  // 兜底：即使某实例在遍历中崩掉（未 catch 的内部异步错误），
  // 也把已完成部分从 partial 里读回来，保证产出不为空。
  for (const k of Object.keys(JSON.parse(fs.readFileSync('/tmp/r622-disc-partial.json', 'utf8')))) {
    if (!report[k]) report[k] = JSON.parse(fs.readFileSync('/tmp/r622-disc-partial.json', 'utf8'))[k];
  }

  const summary = {};
  for (const k of Object.keys(report)) summary[k] = report[k].disc.map(d => d.m);
  console.log('DISCRIMINATING=' + JSON.stringify(summary, null, 1));
  console.log('COUNTS=' + JSON.stringify(
    Object.keys(report).map(k => ({ k, disc: report[k].disc.length, const: report[k].constant.length, thrown: report[k].thrown.length })), null, 1));
  console.log('TOTAL_INSTANCES=' + Object.keys(report).length);
}

main().then(() => process.exit(0)).catch(e => { console.log('FATAL ' + (e && e.message)); process.exit(1); });
