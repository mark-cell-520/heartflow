#!/usr/bin/env node
/**
 * r638 接线验证：decisionFeedback 从零可达变可 dispatch
 * 1) dispatch('decisionFeedback.<m>') 不再抛 route not allowed
 * 2) hf.routes() 有 decisionFeedback.* 路由
 * 3) 辨别力分化实测：灌 3 对 1 错 → accuracy 0.75 / weight 1.05（不是常量函数）
 * 4) 注入-删条-必须变红：删掉 _modules 注册后路由必须消失
 */
'use strict';
const path = require('path');
const srcdir = path.join(__dirname, '..', 'src');
const assert = require('assert');

function fresh() {
  const { HeartFlow } = require(path.join(srcdir, 'core', 'heartflow.js'));
  const hf = new HeartFlow();
  hf.start();
  return hf;
}

const results = [];
const ok = (n, c, extra) => { results.push({ n, pass: !!c, extra }); };

// 1) dispatch 可达性（每个公有方法都要试）
const hf = fresh();
const mod = hf.decisionFeedback;
ok('实例存在', !!mod);
const pubs = Object.getOwnPropertyNames(Object.getPrototypeOf(mod))
  .filter(m => m !== 'constructor' && !m.startsWith('_') && typeof mod[m] === 'function');
ok('公有方法 8 个', pubs.length === 8, pubs.join(','));

let na = 0, thrown = [];
for (const m of pubs) {
  try { hf.dispatch('decisionFeedback.' + m, {}); } catch (e) {
    if (/not allowed/.test(String(e && e.message))) na++;
    else thrown.push(m + ':' + String(e && e.message).slice(0, 50));
  }
}
ok('dispatch 8/8 不抛 route not allowed', na === 0, 'na=' + na);

// 2) routes() 命中（routes() 返回 { modName: [methods] } 表，不是扁平列表）
const rt = typeof hf.routes === 'function' ? hf.routes() : {};
let rtHits = [];
for (const [mn, ms] of Object.entries(rt || {})) {
  if (mn === 'decisionFeedback') rtHits = (ms || []).map(m => 'decisionFeedback.' + m);
}
ok('routes() 有 decisionFeedback.* 条目', rtHits.length >= 8, rtHits.join(','));

// 3) 辨别力分化：同一规则 3 对 1 错
const m2 = hf._modules.decisionFeedback;
const RID = 'rule_probe_' + Date.now();
let w1 = m2.getAdjustedWeight(RID);
for (let i = 0; i < 3; i++) m2.recordOutcome({ type: 'probe', ruleId: RID, confidence: 0.9, context: { i } }, true, 'probe-correct');
const w2 = m2.getAdjustedWeight(RID);
m2.recordOutcome({ type: 'probe', ruleId: RID, confidence: 0.9, context: { i: 99 } }, false, 'probe-wrong');
const eff = m2.getRuleEffectiveness(RID);
ok('权重上浮 1.0→1.15', Math.abs(w2 - 1.15) < 1e-9, 'w1=' + w1 + ' w2=' + w2);
ok('准确率 0.75', eff.accuracy === 0.75, 'acc=' + eff.accuracy);
ok('总决策 4', eff.totalDecisions === 4, 'n=' + eff.totalDecisions);
ok('权重回落 1.05', Math.abs(m2.getAdjustedWeight(RID) - 1.05) < 1e-9, 'w=' + m2.getAdjustedWeight(RID));

// 降权到底：连续 10 错 → 触到 minWeight 0.1
const R2 = 'rule_floor_' + Date.now();
for (let i = 0; i < 10; i++) m2.recordOutcome({ type: 'probe2', ruleId: R2, confidence: 0.3 }, false, 'floor');
ok('错误降权触底 0.1', Math.abs(m2.getAdjustedWeight(R2) - 0.1) < 1e-9, 'w=' + m2.getAdjustedWeight(R2));

// adjustPriorities：按 DECISION_PRIORITY 的 type 键（heal/turn/pause/rest/transmit/
// resonate/accelerate/hold）调权，不是按 ruleId。高准确 type 提权、低准确 type 降权。
const _dr = require(path.join(srcdir, 'core', 'decision-router.js'));
const PRIO_KEYS = Object.keys(_dr.DECISION_PRIORITY || {});
const hiType = PRIO_KEYS[0], loType = PRIO_KEYS[1] || PRIO_KEYS[0];
for (let i = 0; i < 20; i++) m2.recordOutcome({ type: hiType, ruleId: 'r_hi_' + Date.now(), confidence: 0.9 }, true, 'hi');
for (let i = 0; i < 20; i++) m2.recordOutcome({ type: loType, ruleId: 'r_lo_' + Date.now(), confidence: 0.9 }, false, 'lo');
const adj = m2.adjustPriorities();
ok('adjustPriorities 有调整', adj && adj.adjusted === true && Array.isArray(adj.adjustments), JSON.stringify(adj && adj.adjustments && adj.adjustments.slice(0, 2)));
ok('高准确 type 被提权', (adj.adjustments || []).some(a => a.type === hiType && a.newPriority > a.oldPriority));
ok('低准确 type 被降权', (adj.adjustments || []).some(a => a.type === loType && a.newPriority < a.oldPriority));

// 4) 负例：删掉注册块后路由必须消失（注入-删条-必须变红）
delete require.cache[require.resolve(path.join(srcdir, 'core', 'heartflow.js'))];
const hfSrc = require('fs').readFileSync(path.join(srcdir, 'core', 'heartflow.js'), 'utf8');
const stripped = hfSrc.replace(
  /if \(this\.decisionFeedback && !this\._modules\['decisionFeedback'\]\) \{[\s\S]{0,160}?this\._modules\['decisionFeedback'\] = this\.decisionFeedback;[\s\S]{0,80}?\}/,
  '/* r638 负例：注册块已删 */'
);
const changed = stripped !== hfSrc;
require('fs').writeFileSync(path.join(srcdir, 'core', '__neg638.js'), stripped);
let naNeg = 0, srcRestored = false;
try {
  delete require.cache[require.resolve(path.join(srcdir, 'core', '__neg638.js'))];
  const { HeartFlow: HF2 } = require(path.join(srcdir, 'core', '__neg638.js'));
  const hf2 = new HF2(); hf2.start();
  try { hf2.dispatch('decisionFeedback.recordOutcome', {}); } catch (e) {
    if (/not allowed/.test(String(e && e.message))) naNeg++;
  }
  ok('负例：删注册块后 route not allowed', naNeg === 1, 'naNeg=' + naNeg);
} finally {
  require('fs').unlinkSync(path.join(srcdir, 'core', '__neg638.js'));
  srcRestored = true;
}
ok('负例文件已清理', srcRestored && !require('fs').existsSync(path.join(srcdir, 'core', '__neg638.js')));

// 汇总
let pass = 0;
for (const r of results) { console.log((r.pass ? 'PASS' : 'FAIL') + '  ' + r.n + (r.extra ? '  [' + r.extra + ']' : '')); if (r.pass) pass++; }
console.log('\n# r638 汇总: ' + pass + '/' + results.length);
if (pass !== results.length) process.exit(1);
