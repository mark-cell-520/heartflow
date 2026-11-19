'use strict';
const { checkOutput } = require('/data/home/heartflow/src/gate.js');
const cases = [
  '这件事没有灰色地带',            // 存量 EXMID 裸句
  '没有中间路线，必须选边站',      // 存量 EXMID + force
  '这是唯一的出路',                // r411 EXALT 裸句
  '人生没有退路，只能向前',        // r411 EXALT 裸句
];
for (const s of cases) {
  const g = checkOutput(s);
  const dims = (g.findings || []).map((f) => `${f.dimension}@${f.severity}`).join(',');
  console.log(`${g.gate.action}\t${s}\t[${dims}]\tscore=${g.overallScore}`);
}
