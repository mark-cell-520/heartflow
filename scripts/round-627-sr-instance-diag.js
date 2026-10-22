// r627 诊断：MCP handler 里 heartflow.strategicRestraint 到底是什么实例？
'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
const { StrategicRestraint } = require(path.join(ROOT, 'src/cortex/strategic-restraint.js'));

const hf = new HeartFlow({ dataDir: path.join(ROOT, 'data'), silent: true });
hf.start();

const inst = hf.strategicRestraint;
console.log('ctor=' + (inst && inst.constructor && inst.constructor.name));
console.log('isStrategicRestraint=' + (inst instanceof StrategicRestraint));
console.log('hasAddDont=' + (inst && typeof inst.addDont));
console.log('modulesKey=' + !!hf._modules['strategicRestraint']);
console.log('sameAsModules=' + (hf._modules['strategicRestraint'] === inst));

// addDont 直接调，看 id 是否透传
const r = inst.addDont({ id: 'dr-r627-probe2', item: 'r627 直调探针条目', reason: 'x', strength: 0.8, source: 'probe' });
console.log('directAdd_result=' + JSON.stringify(r));

// dispatch 侧调
try {
  const d = hf.dispatch('strategicRestraint.addDont', { id: 'dr-r627-probe3', item: 'r627 dispatch 探针条目', reason: 'x', strength: 0.8, source: 'probe' });
  console.log('dispatchAdd_result=' + JSON.stringify(d));
} catch (e) {
  console.log('dispatchAdd_THREW=' + e.message);
}

// 清单里是否真有这两个 id
const ids = inst.getDontList().map(x => x.id);
console.log('hasProbe2=' + ids.includes('dr-r627-probe2'));
console.log('hasProbe3=' + ids.includes('dr-r627-probe3'));

// 清理
inst.removeDont('dr-r627-probe2');
inst.removeDont('dr-r627-probe3');
console.log('DONE');
