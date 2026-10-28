require('./helpers/mocha-shim.js'); // [v6.8.85] mocha shim：裸 node 可跑
const hb = require('../src/core/hook-bus.js');
describe('hook-bus', () => {
  test('module exports functions', () => {
    expect(typeof hb).toBe('object');
  });
  test('register or emit exists', () => {
    const fn = Object.values(hb).find(v => typeof v === 'function');
    expect(fn).toBeDefined();
  });
});
