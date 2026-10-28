require('./helpers/mocha-shim.js'); // [v6.8.85] mocha shim：裸 node 可跑
const el = require('../src/core/engine-lifecycle.js');
describe('engine-lifecycle', () => {
  test('module exports functions', () => {
    expect(typeof el).toBe('object');
    const fn = Object.values(el).find(v => typeof v === 'function');
    expect(fn).toBeDefined();
  });
  test('_bootMindSpace exists', () => {
    expect(typeof el._bootMindSpace).toBe('function');
  });
  test('_registerModules exists', () => {
    expect(typeof el._registerModules).toBe('function');
  });
});
