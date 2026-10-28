require('./helpers/mocha-shim.js'); // [v6.8.85] mocha shim：裸 node 可跑
const met = require('../src/core/mental-effort-tracker.js');
describe('mental-effort-tracker', () => {
  test('module exports functions', () => {
    expect(typeof met).toBe('object');
  });
  test('track or measure exists', () => {
    const fn = Object.values(met).find(v => typeof v === 'function');
    expect(fn).toBeDefined();
  });
});
