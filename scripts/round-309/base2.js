'use strict';
const { gate } = require('/data/home/heartflow/src/gate.js');
const D = require('/data/home/heartflow/src/selection-on-dependent-variable.js').detectSelectionOnDependentVariable;
for (const t of ['Every Harvard admit reads daily, so daily reading is the key to admission','Every centenarian in this village drinks goat milk, so goat milk is the secret to long life']) {
  const g = (gate(t).findings||[]).map(f=>f.dimension).includes('econ_reasoning_gate');
  console.log('baseline 模块=' + (D(t).hit?'HIT':'miss') + ' gate=' + (g?'HIT':'miss') + '  ' + t.slice(0,40));
}
