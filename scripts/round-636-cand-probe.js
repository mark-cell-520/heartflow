// r636 候选探测器：针对辨别者定位，列出未接线实例的方法清单与自检可行性
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { HeartFlow } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));
const hf = new HeartFlow();
try { hf.start(); } catch (e) {}

const list = process.argv.slice(2).length ? process.argv.slice(2)
  : ['aiSelfPositioning', 'outputChecklist', 'selfDiagnosis', 'globalWorkspace', 'decisionExecutor'];

for (const name of list) {
  const inst = hf[name];
  console.log('=== ' + name + ' ===');
  if (!inst) { console.log('  实例不存在'); continue; }
  const seen = new Set();
  try { for (const k of Object.getOwnPropertyNames(Object.getPrototypeOf(inst))) { if (k !== 'constructor' && typeof inst[k] === 'function') seen.add(k); } } catch (e) {}
  for (const k of Object.getOwnPropertyNames(inst)) { if (typeof inst[k] === 'function' && k !== 'constructor') seen.add(k); }
  const ms = Array.from(seen);
  // 零抛测试：空实参调用，统计内部故障
  let zeroThrow = 0, contract = 0, internal = 0;
  for (const m of ms) {
    try { hf.dispatch(name + '.' + m, {}); zeroThrow++; }
    catch (e) {
      const msg = String(e.message || '');
      if (/not allowed/.test(msg)) { /* route not allowed, 单独统计 */ }
      else zeroThrow++;
    }
  }
  console.log('  方法数: ' + ms.length);
  console.log('  方法名: ' + ms.join(', '));
  // 构造最小有意义的实参试跑第一个方法看返回形状
  try {
    const r = inst[ms[0]]({});
    console.log('  ' + ms[0] + '({}) → typeof=' + (typeof r) + ' keys=' + (r && typeof r === 'object' ? Object.keys(r).slice(0, 12).join(',') : String(r).slice(0, 120)));
  } catch (e) { console.log('  ' + ms[0] + '({}) 抛: ' + e.message); }
}
