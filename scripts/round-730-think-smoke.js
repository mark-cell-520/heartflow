// r730 think() 真实调用冒烟：silence_imputation 双腿扩展 + 混排配对。
// 正例必须判出 silence_imputation，干净良性必须零命中，边界良性本族零命中
// （别族 gate 级行为是预存污染，按维度归因——r728/r729 教训）。
'use strict';
const path = require('path');
const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));

const POS = [
  '他缄口不言，所以这事是真的。',
  '她未发一言，可见确有其事。',
  '当事人未置一词，等于默认了。',
  '他始终没开过口，说明指控属实。',
  'He stayed mum about the payments, which speaks for itself.',
  'The company offered no explanation, which confirms the allegations.',
  '他没有回应，which confirms his guilt.',
];
const NEG_CLEAN = [
  '他缄口不言，直到律师到场。',
  '公司决定不置评，等调查结果出来。',
  '保持沉默是当事人的权利，不能据此定罪。',
  'He stayed mum until his lawyer arrived.',
  'She kept mum, which is her right.',
];
const NEG_BOUNDARY = [
  '这篇讲义指出：「他缄口不言，所以这事是真的。」是典型的诉诸沉默谬误',
  '他缄口不言，所以这事是真的？也许事情的真相还不清楚，先核实再说',
  '他拒不认罪，警方还在核实证据。',
];

(async () => {
  const hf = new HeartFlow();
  await hf.start();
  let posOk = 0, negOk = 0, bndOk = 0;
  for (const t of POS) {
    try {
      const r = await hf.think(t);
      const dims = (r && r._inputDiscrimination && r._inputDiscrimination.dims) || {};
      const hit = !!dims.silence_imputation;
      console.log((hit ? 'HIT ' : 'MISS') + ' ' + t);
      if (hit) posOk++; else console.log('  ^ 正例漏判');
    } catch (e) { console.log('正例崩 ' + t + ' — ' + e.message); }
  }
  for (const t of NEG_CLEAN) {
    try {
      const r = await hf.think(t);
      const dims = (r && r._inputDiscrimination && r._inputDiscrimination.dims) || {};
      const keys = Object.keys(dims).filter(k => dims[k] && (dims[k].score > 0 || dims[k].count > 0));
      console.log((keys.length ? 'FP  ' : 'ok  ') + ' ' + t.slice(0, 40) + (keys.length ? ' -> ' + keys.join(',') : ''));
      if (keys.length === 0) negOk++; else console.log('  ^ 干净良性误伤');
    } catch (e) { console.log('反例崩 ' + t + ' — ' + e.message); }
  }
  for (const t of NEG_BOUNDARY) {
    try {
      const r = await hf.think(t);
      const dims = (r && r._inputDiscrimination && r._inputDiscrimination.dims) || {};
      const others = Object.keys(dims).filter(k => k !== 'silence_imputation' && dims[k] && (dims[k].score > 0 || dims[k].count > 0));
      const mine = !!dims.silence_imputation;
      console.log((mine ? 'FP  ' : 'ok  ') + ' [boundary] ' + t.slice(0, 30) + (others.length ? ' (别族命中: ' + others.join(',') + ')' : ''));
      if (!mine) bndOk++; else console.log('  ^ 边界样本本族误伤');
    } catch (e) { console.log('边界崩 ' + t + ' — ' + e.message); }
  }
  console.log(`think-smoke: 正例 ${posOk}/${POS.length} 命中, 干净良性 ${negOk}/${NEG_CLEAN.length} 零命中, 边界良性 ${bndOk}/${NEG_BOUNDARY.length} 本族零命中`);
  process.exit(posOk === POS.length && negOk === NEG_CLEAN.length && bndOk === NEG_BOUNDARY.length ? 0 : 1);
})();
