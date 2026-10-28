require('./helpers/mocha-shim.js'); // [v6.8.85] mocha shim：裸 node 可跑
const { EngineReasoner } = require('../src/core/engine-reasoner.js');
describe('EngineReasoner', () => {
  let reasoner;
  beforeEach(() => { reasoner = new EngineReasoner({}); });
  test('instance created', () => {
    expect(reasoner).toBeDefined();
  });
});
