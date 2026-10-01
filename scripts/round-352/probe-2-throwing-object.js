// r352 probe-2: 只测「隐式转换会抛错的对象」输入 gate()，确认归一化分支有效
const { gate } = require('../../src/gate.js');

function makeThrower() { return { toString() { throw new Error('boom-toString'); }, valueOf() { throw new Error('boom-valueOf'); } }; }
function makeProxyThrower() { return new Proxy({}, { get(t, k) { if (k === Symbol.toPrimitive) return () => { throw new Error('boom-primitive'); }; return undefined; } }); }
function makeBadGetter() { const o = {}; Object.defineProperty(o, 'x', { get() { throw new Error('boom-getter'); } }); return o; }

const cases = [
  ['object-throwing-toString', makeThrower()],
  ['proxy-throwing-toPrimitive', makeProxyThrower()],
  ['object-throwing-getter', makeBadGetter()],
];

let crash = 0, ok = 0;
for (const [name, v] of cases) {
  try {
    const r = gate(v);
    ok++;
    console.log('OK    ' + name + ' -> ' + (r && r.gate ? r.gate.action : 'no-gate'));
  } catch (e) {
    crash++;
    console.log('CRASH ' + name + ' -> ' + e.constructor.name + ': ' + String(e.message).slice(0, 80));
  }
}
// 良性：能正常 String() 的对象必须仍 pass（证明只砍崩点一族）
const benign = [{}, [], new Map([['a', 1]]), new Date(0)];
let bOk = 0, bCrash = 0;
for (let i = 0; i < benign.length; i++) {
  try { const r = gate(benign[i]); if (r && r.gate) bOk++; } catch (e) { bCrash++; }
}
console.log('BENIGN ok=' + bOk + ' crash=' + bCrash);
console.log('SUMMARY ok=' + ok + ' crash=' + crash);
