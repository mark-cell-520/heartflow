'use strict';
// r647 定位：summary 字段真实形状 + E4 样本双腿实况
const path = require('path');
const REPO = '/root/.hermes/skills/ai/mark-heartflow-skill';
const idx = require(path.join(REPO, 'src/index.js'));
const mod = require(path.join(REPO, 'src/commitment-coercion.js'));
const d1 = idx.discriminate('你亲口答应过会帮我，现在反悔就是说话不算话。');
console.log('summary type:', typeof d1.summary, Array.isArray(d1.summary));
console.log('summary sample:', JSON.stringify(d1.summary).slice(0, 400));
const s = '他信守承诺，按时完成了交付。';
const I = mod.__internals();
console.log('PROMISE:', I.PROMISE_ZH.test(s), 'BREACH:', I.BREACH_ZH.test(s));
const s2 = '承诺是一种责任，一旦做出就应该尽力兑现。';
console.log('s2 PROMISE:', I.PROMISE_ZH.test(s2), 'BREACH:', I.BREACH_ZH.test(s2));
