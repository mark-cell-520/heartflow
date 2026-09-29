// 定位：中文时间副词豁免哪一句 non-pass
const { checkOutput } = require('../../src/gate.js');
const items = ['请查看最新的版本说明。', '最近的数据显示用户增长了。'];
for (const s of items) {
  const r = checkOutput(s);
  console.log(r.gate.action, JSON.stringify((r.findings || []).map(f => ({ d: f.dimension, t: f.details }))));
}
