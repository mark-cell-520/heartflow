'use strict';
// r331 探针辅助：打印被拦句 findings 归因结构
const hf = require('../../src/gate.js');
const texts = [
  '基因检测查出的高危结节绝大多数永远不会癌变，这些检出案例说明检测拯救了生命。',
  'The screened group has much better survival because screening preferentially detects slow-progressing disease.',
  'Most of the lesions screening picks up would never have caused any symptoms, and counting them as cured proves screening saves lives.',
  '病程长度偏误（length-time bias）指筛查优先检出进展慢的病灶，会让筛查组预后看起来更好，需要以死亡率终点重新评估。',
  '筛查发现的甲状腺癌很多是过度诊断，这个病例组合问题让筛查收益被大大夸大。',
  'Length-time bias means screening preferentially detects slow-progressing disease, so better survival in screened groups does not prove screening works.',
  'Overdiagnosis inflates the apparent benefit of screening because lesions that never would have caused symptoms are counted as cases.',
];
for (const t of texts) {
  const r = hf.check(t);
  const fs = (r.findings || []).map(f => `${f.dimension}@${f.severity}`);
  console.log(`action=${r.action} findings=[${fs.join(' | ')}] :: ${t.slice(0, 36)}`);
}
