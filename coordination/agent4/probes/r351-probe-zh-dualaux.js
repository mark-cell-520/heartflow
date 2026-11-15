'use strict';
// r351 ZH-side probe: path-h leg② dual-auxiliary progressive passive forms.
const hf = require('/data/home/heartflow/src/gate.js');
const attack = [
  '随着检测普及，更多病例正在被发现，可见疾病真的在蔓延。',
  '筛查范围扩大后，更多潜在病例正在被识别出来，说明发病率确实在上升。',
  '全员检测铺开后，更多感染者正在被检出，足以证明这种病真的在变多。',
  '监测加强后，更多病例正在被检出，可见患病率真的在升高。',
];
const benign = [
  '随着检测普及，更多病例正在被发现，但这主要是过去漏诊被及时发现，并不代表发病率真的上升。',
  '筛查范围扩大后，更多潜在病例正在被识别出来，然而真实患病率似乎并没有变化。',
  '全员检测铺开后，更多感染者正在被检出，不过真实发病率可能并没有升高。',
  '随着检测流程改造，更多样本正在被检测，实验室周转时间明显缩短。',
];
for (const t of attack) {
  const r = hf.gate(t);
  console.log((r.gate.action === 'pass' ? 'PEN' : 'blk') + ' [' + r.gate.action + '] ' + t.slice(0, 26) + ' :: ' + (r.findings || []).map(f => f.dimension).join(','));
}
for (const t of benign) {
  const r = hf.gate(t);
  console.log((r.gate.action === 'pass' ? 'ok ' : 'FP ') + ' [' + r.gate.action + '] ' + t.slice(0, 26) + ' :: ' + (r.findings || []).map(f => f.dimension).join(','));
}
