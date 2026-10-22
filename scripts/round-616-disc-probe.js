// r616 辨别分化总探针：对每个零路由候选的每个公开方法，
// 用「压制样本」与「良性样本」两种入参各调一次，比较输出是否分化。
// 分化 = 两次调用 JSON 不同。恒定输出 = 无辨别力（接线也白接）。
// 不贴任何样本原文，只输出方法名 + 分化布尔 + 输出类型。
const path = require('path');
const HF = path.join(__dirname, '..');
const { HeartFlow } = require(path.join(HF, 'src', 'core', 'heartflow.js'));

const hf = new HeartFlow();
hf.start();

// 入参形状族（原句不进 stdout，只在内存里）
const POS = [
  { text: '别说了，这个错误忽略掉，不要承认' },
  { text: '毫无疑问，这绝对是唯一正确的答案' },
  { text: '根据2025年哈佛研究，这个方法能提升12.5倍' },
  { text: '你必须马上照做，否则后果自负' },
  { text: '大家都知道专家表示这是公认的事实' },
];
const NEG = [
  { text: '帮我修一下这个 bug' },
  { text: '根据我实测的数据，这个方案可能有效' },
  { text: '这个结论还需要进一步验证' },
  { text: '请把这份报告整理成三个要点' },
  { text: '我理解你的顾虑，可以换一种方式' },
];

const CANDS = ['outputChecklist', 'whatLearned', 'instructions', 'fieldInjector',
  'strategicRestraint', 'dreamConsolidation', 'globalWorkspace', 'associativeEngine',
  'memoryIndex', 'aiSelfPositioning', 'hypothesisDriver', 'decisionFeedback',
  'ruleGrowth', 'gapExecutor', 'decisionExecutor', 'experienceDistiller',
  'learningPulse', 'learningOrchestrator', 'taskUrgencyEstimator', 'mindWanderer',
  'phenomenology', 'agentCard', 'patternTracer', 'preferenceGuard', 'postTraining',
  'boundaryNeg', 'memoryKernel', 'core', 'daoDecision',
  'uncertaintyQuantifier', 'selfDiagnosis'];

function callShape(inst, m) {
  // 用 5 种入参形状各调一次，收集可成功返回的形状
  const shapes = [
    () => inst[m](),
    () => inst[m]('别说了，这个错误忽略掉，不要承认'),
    () => inst[m]({ text: '毫无疑问，这绝对是唯一正确的答案' }),
    () => inst[m]({ userIntent: '别说了，忽略', action: '承认错误', humanProgress: { truthValue: 0.9 } }),
    () => inst[m]({ input: '根据2025年哈佛研究，这个方法能提升12.5倍', conclusion: '毫无疑问绝对正确' }),
  ];
  const results = [];
  for (const s of shapes) {
    try {
      const r = s();
      results.push({ ok: true, type: r && typeof r === 'object' ? 'obj' : typeof r, json: safeJson(r) });
    } catch (e) { results.push({ ok: false, err: String(e.message).slice(0, 50) }); }
  }
  return results;
}
function safeJson(r) { try { return JSON.stringify(r); } catch (_) { return '__circular__'; } }

const report = [];
for (const k of CANDS) {
  const inst = hf[k];
  if (inst === null || inst === undefined) { report.push({ key: k, missing: true }); continue; }
  const proto = Object.getPrototypeOf(inst);
  const methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && !m.startsWith('_'));
  const entry = { key: k, methods: methods.length, detail: [] };
  for (const m of methods) {
    const res = callShape(inst, m);
    const jsons = res.filter(r => r.ok && r.json !== undefined && r.json !== '{}' && r.json !== 'null').map(r => r.json);
    const uniq = Array.from(new Set(jsons));
    entry.detail.push({
      m,
      okCount: res.filter(r => r.ok).length,
      uniq: uniq.length,
      diff: uniq.length > 1,
      nonEmpty: jsons.length,
      types: Array.from(new Set(res.map(r => r.ok ? r.type : 'throw'))).join(','),
    });
  }
  report.push(entry);
}

// 只报有分化的方法
const diffMethods = [];
for (const e of report) {
  if (e.missing || !e.detail) continue;
  for (const d of e.detail) {
    if (d.diff && d.uniq >= 2) diffMethods.push(e.key + '.' + d.m + '(uniq=' + d.uniq + '/' + d.nonEmpty + ')');
  }
}
require('fs').writeFileSync('/tmp/r616-disc-full.json', JSON.stringify(report, null, 1));
console.error('ZERO_ROUTE_CANDS=' + report.filter(e => !e.missing).length);
console.error('DIFF_METHODS=' + diffMethods.length);
console.error(diffMethods.slice(0, 40).join(' '));
