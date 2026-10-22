// r604 缺陷根因探针：SelfModel 4 个抛错方法的精确失败点。
// detectDrift / repairDrift / getStats 报 "Cannot read properties of undefined (reading 'toLo...')"
// counterfactual 报 "...(reading 'incl...')"
// 本探针用真实构造实例 + 逐方法带真实参数复跑，定位到底是
//   (a) 模块代码 bug（空实参也炸 / 字段缺失）
//   (b) 仅调用方参数缺失（带参就好）
// 只输出错误类型与字段名，不贴样本原文。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

(async () => {
  const { SelfModel } = require(path.join(ROOT, 'src/identity/self-model.js'));
  // 带真实 rootPath 构造（与 heartflow.js L2430 同参）
  const sm = new SelfModel(ROOT);
  console.log('ctor_ok, rootPath=' + ROOT);

  const tryCall = (label, fn) => {
    try {
      const r = fn();
      console.log(label + ' = OK keys=' + (r && typeof r === 'object' ? Object.keys(r).join(',') : typeof r));
    } catch (e) {
      console.log(label + ' = THROW: ' + String(e.message).slice(0, 120));
      const st = String(e.stack || '').split('\n').slice(1, 3).map(s => s.trim()).join(' | ');
      console.log('   stack: ' + st);
    }
  };

  tryCall('detectDrift()', () => sm.detectDrift());
  tryCall('getStats()', () => sm.getStats());
  tryCall('counterfactual("if x then y")', () => sm.counterfactual('if x then y'));
  tryCall('repairDrift({conflicts:[]})', () => sm.repairDrift({ conflicts: [] }));

  // 检查 _state.beliefs 的实际形态（detectDrift 里 Object.values(beliefs)）
  console.log('--- state shape ---');
  console.log('state_keys=' + Object.keys(sm._state || {}).join(','));
  const beliefs = sm._state && sm._state.beliefs;
  console.log('beliefs_type=' + (beliefs && beliefs.constructor && beliefs.constructor.name));
  if (beliefs) {
    const vals = Object.values(beliefs);
    console.log('beliefs_count=' + vals.length);
    const bad = vals.filter(b => !b || typeof b.content !== 'string');
    console.log('beliefs_bad_content=' + bad.length);
    if (bad.length) console.log('bad_sample_keys=' + Object.keys(beliefs).filter(k => !beliefs[k] || typeof beliefs[k].content !== 'string').slice(0, 5).join(','));
  }
  console.log('_persist=' + typeof sm._persist);
  console.log('_getNarrativeSummary=' + typeof sm._getNarrativeSummary);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
