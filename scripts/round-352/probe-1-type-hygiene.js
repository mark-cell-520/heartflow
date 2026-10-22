// r352 probe-1: 入口类型卫生复测 —— 非字符串输入喂 gate()，看哪些还崩
// 只输出数字与形状，不打印攻击样本
const { gate } = require('../../src/gate.js');

function makeThrower() { return { toString() { throw new Error('boom-toString'); }, valueOf() { throw new Error('boom-valueOf'); } }; }
function makeProxyThrower() { return new Proxy({}, { get(t, k) { if (k === Symbol.toPrimitive) return () => { throw new Error('boom-primitive'); }; return undefined; } }); }

const cases = [
  ['null', null],
  ['undefined', undefined],
  ['number', 42],
  ['bigint', 42n],
  ['object-empty', {}],
  ['array-empty', []],
  ['boolean', true],
  ['symbol', Symbol('x')],
  ['object-throwing-toString', makeThrower()],
  ['proxy-throwing-toPrimitive', makeProxyThrower()],
  ['map', new Map([['a', 1]])],
  ['date', new Date(0)],
  ['nan', NaN],
  ['neg-zero', -0],
];

let crash = 0, ok = 0;
for (const [name, v] of cases) {
  try {
    const r = gate(v);
    ok++;
    console.log('OK    ' + name + ' -> ' + (r && r.gate ? r.gate.action : 'no-gate'));
  } catch (e) {
    crash++;
    console.log('CRASH ' + name + ' -> ' + e.constructor.name + ': ' + String(e.message).slice(0, 90)
      + ' @ ' + (e.stack || '').split('\n').filter(l => l.includes('/src/'))[0].trim());
  }
}
console.log('SUMMARY ok=' + ok + ' crash=' + crash);
