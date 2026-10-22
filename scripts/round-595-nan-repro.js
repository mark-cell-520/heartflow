// r595 最小复现：formula-safe.ebbinghausRetention 为何 NaN
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { getFormulaSafe } = require(path.join(ROOT, 'src/formula/formula-safe.js'));
const fs = getFormulaSafe();

const WEEK = 7 * 24 * 3600 * 1000;
const t = 0.5 * WEEK;
console.log('t =', t, 'S =', WEEK);
const r = fs.ebbinghausRetention(t, WEEK, () => Math.exp(-0.5 * 2));
console.log('formulaSafe result =', r, 'isFinite =', Number.isFinite(r));

// 直接看 bridge
const { getCognitiveBridge } = require(path.join(ROOT, 'src/formula/cognitive-bridge.js'));
const b = getCognitiveBridge();
console.log('bridge has ebbinghausRetention =', typeof b.ebbinghausRetention);
console.log('bridge direct =', b.ebbinghausRetention(t, WEEK));
console.log('bridge 3args =', b.ebbinghausRetention(t, WEEK, () => 1));

// 看 cognitive-bridge 是否包装过
console.log('cognitive bridge keys =', Object.getOwnPropertyNames(Object.getPrototypeOf(b)).slice(0, 20));
