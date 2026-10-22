// r345 probe-6：定位 pseudo_causal 三漏判句分别缺哪一半。
// 判据全部从 index.js 静态提取，逐条试命中，报「哪条判据 / 缺哪一半」。
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
function grab(name) {
  const m = src.match(new RegExp('const ' + name + ' = (/[\\s\\S]*?/);'));
  return m ? eval(m[1]) : null;
}
const SEQ = grab('PC_SEQ_ZH'), ATTRIB = grab('PC_ATTRIB_ZH'), ACT = grab('PC_ACT_LUCK_ZH'), RES = grab('PC_RES_LUCK_ZH');
const NUMERIC = grab('PC_NUMERIC_ZH'), HEDGE = grab('PC_HEDGE_ZH'), PROB = grab('PC_PROB_ZH'), OTHER = grab('PC_OTHERFACTOR_ZH');

const SAMPLES = [
  '他成功就是因为他每天都早起',
  '股价上涨是因为我穿了幸运色',
  '项目能成是因为我那天朝东边拜了拜',
];

for (const s of SAMPLES) {
  console.log('--- 样本');
  console.log('  SEQ?', !!SEQ.exec(s), 'ATTRIB?', !!ATTRIB.exec(s), 'ACT?', !!ACT.exec(s), 'RES?', !!RES.exec(s));
  console.log('  NUMERIC护栏?', NUMERIC.test(s), 'HEDGE对冲?', HEDGE.test(s), 'PROB统计谦辞?', PROB.test(s), 'OTHER?', OTHER.test(s));
  // 三条主判据单独试
  const p1 = new RegExp(SEQ.source + '[^。]{0,44}?' + ATTRIB.source);
  const p9 = new RegExp(SEQ.source + '[^。]{0,14}(?:下降|上升|降低|减少|变少|下滑|提高)');
  const p10 = new RegExp(ACT.source + '[^。]{0,20}' + RES.source);
  console.log('  判据① 顺序×归因?', !!p1.exec(s), ' ⑨ 顺序×指标?', !!p9.exec(s), ' ⑩ 动作×结果?', !!p10.exec(s));
  // 松鼠缺口：没有顺序词也没有归因词，全靠「因为…所以…」显式因果
  console.log('  「因为」在句首?', s.indexOf('因为') >= 0, ' 「是因为」?', s.indexOf('是因为') >= 0);
}
