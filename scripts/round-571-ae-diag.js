#!/usr/bin/env node
/* r571 诊断：heartflow.js 的导出形状 + associativeEngine 构造分支实际走哪条 */
'use strict';
const HF = require('../src/core/heartflow.js');
console.log('HF keys =', JSON.stringify(Object.keys(HF)));
const HFC = HF.HeartFlow || HF.default || HF;
console.log('HFC name =', HFC && HFC.name);
const hf = new HFC();
console.log('keys has associativeEngine =', Object.prototype.hasOwnProperty.call(hf, 'associativeEngine'), 'value =', hf.associativeEngine);
console.log('knowledgeLayer =', hf.knowledgeLayer ? hf.knowledgeLayer.constructor.name : 'null');
console.log('_initErrors =', JSON.stringify(hf._initErrors || []));
require('fs').writeFileSync('/tmp/r571-aeload.txt', [
  'prop=' + Object.prototype.hasOwnProperty.call(hf, 'associativeEngine'),
  'val=' + (hf.associativeEngine && hf.associativeEngine.constructor.name),
  'initErrors=' + JSON.stringify(hf._initErrors || []),
].join('\n'));
process.exit(0);
