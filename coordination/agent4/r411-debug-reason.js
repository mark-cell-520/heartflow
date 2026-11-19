'use strict';
const { checkOutput } = require('/data/home/heartflow/src/gate.js');
const cases = ['这是唯一的出路', '唯一的选择就是明天继续讨论', '人生没有退路，只能向前'];
for (const s of cases) {
  const g = checkOutput(s);
  console.log(JSON.stringify(s), '→', g.gate.action, '|', g.gate.reason, '| score=', g.overallScore);
}
