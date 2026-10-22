// negative-test-continuous-learner-wiring-r316.js
// 注入-删条-必须变红：验证 test/continuous-learner-wiring.test.js 的守卫有效性
// 每条注入都把「接真实现」回退成 r316 修掉的形态，跑测试必须出现失败。
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = path.join(REPO, 'src/core/heartflow.js');
const SRC_PIPE = path.join(REPO, 'src/core/think-pipeline.js');
const TEST = path.join(REPO, 'test/continuous-learner-wiring.test.js');

const cases = [
  {
    name: '注入① _ContinuousLearner 改回 stub 空壳（r316 修复前形态）',
    file: SRC,
    from: "const _ContinuousLearner = _lazy('continuousLearner', () => require('../cortex/continuous-learner.js'));",
    to: "const _ContinuousLearner = _lazy('continuousLearner', () => _stubFactory('ContinuousLearner'));",
  },
  {
    name: '注入② 假 continuousLearner 全局对象回来（r316 修复前形态）',
    file: SRC,
    from: "globalThis.MacroStrategyInference = require('../cortex/self-evolution/macro-strategy-inference').MacroStrategyInference;",
    to: "globalThis.continuousLearner = { getStats: () => ({ totalConfidenceGaps: 0, topGaps: [] }) };\nglobalThis.MacroStrategyInference = require('../cortex/self-evolution/macro-strategy-inference').MacroStrategyInference;",
    anchorLine: 66, // 只在第一处（模块顶部假桥接区）注入，MacroStrategyInference 声明唯一
  },
  {
    name: '注入③ 删掉 _modules 注册（dispatch/MCP 取不到实例）',
    file: SRC,
    from: "    this._modules['continuousLearner'] = this.continuousLearner;\n",
    to: "",
  },
  {
    name: '注入④ absorbLearnerSignals 不再接收真实 getStats',
    file: SRC,
    from: "this.knowledgeExplorer.absorbLearnerSignals(this.continuousLearner.getStats());",
    to: "this.knowledgeExplorer.absorbLearnerSignals(null);",
  },
  {
    name: '注入⑤ 闭环2 的 thinkCount>10 门槛被废（低置信闭环进不去）',
    file: SRC_PIPE,
    from: "if (clStats && clStats.thinkCount > 10) {",
    to: "if (clStats && false) {",
  },
  {
    name: '注入⑥ 反复低置信→路由权重反馈的 confidence-gate 被删',
    file: SRC_PIPE,
    from: "dr.feedback('confidence-gate', 'wrong');",
    to: "dr.feedback('noop-changed', 'wrong');",
  },
  {
    name: '注入⑦ think-pipeline 的 reflect 调用点被删（后置反思断链）',
    file: SRC_PIPE,
    from: "try { if (engine.continuousLearner && engine.lesson && result && input) { engine.continuousLearner.reflect(result, input, engine.lesson); } } catch (_) { /* 非关键 */ }",
    to: "try { /* r316 注入：reflect 调用点删除 */ } catch (_) { /* 非关键 */ }",
  },
];

const results = [];
let failures = 0;

for (const c of cases) {
  const orig = fs.readFileSync(c.file, 'utf8');
  if (!orig.includes(c.from)) {
    console.log(`⚠️  ${c.name}：锚点未找到（源码已变？跳过）`);
    failures++;
    results.push({ name: c.name, ok: false, note: 'anchor missing' });
    continue;
  }
  fs.writeFileSync(c.file, orig.replace(c.from, c.to));
  let out = '';
  let red = false;
  try {
    out = execFileSync('node', [TEST], { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
    red = true;
  }
  fs.writeFileSync(c.file, orig);
  const fails = (out.match(/❌/g) || []).length;
  const m = out.match(/结果:\s*(\d+)\s*通过,\s*(\d+)\s*失败/);
  const note = m ? `${m[1]}通过/${m[2]}失败` : (red ? '测试异常退出' : '无结果行');
  const ok = red && fails >= 1;
  if (!ok) failures++;
  results.push({ name: c.name, ok, note });
  console.log(`${ok ? '✅' : '❌'} ${c.name}：${note}（红 ${fails} 条）`);
}

// 还原后复验：必须全绿
let restoreOk = false;
try {
  const out = execFileSync('node', [TEST], { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 });
  const m = out.match(/结果:\s*(\d+)\s*通过,\s*(\d+)\s*失败/);
  restoreOk = m && m[2] === '0';
  console.log(`还原后复验：${m ? `${m[1]}通过/${m[2]}失败` : '无结果行'}`);
} catch (e) {
  const out = (e.stdout || '') + (e.stderr || '');
  const m = out.match(/结果:\s*(\d+)\s*通过,\s*(\d+)\s*失败/);
  console.log(`还原后复验：${m ? `${m[1]}通过/${m[2]}失败` : '复验异常'}`);
}
if (!restoreOk) failures++;

console.log(failures === 0
  ? '\n✅ 全部注入均正确变红，守卫有效'
  : `\n❌ ${failures} 项问题（见上）`);
process.exit(failures === 0 ? 0 : 1);
