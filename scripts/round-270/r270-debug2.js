'use strict';
const path = require('path');
const mod = require(path.join(__dirname, '../../src/immortal-time-bias.js'));
const I = mod.__internals();
function anyHit(list, text) { for (const re of list) { if (re.test(text)) return true; } return false; }

const s = '只有先活过三十天的患者才被纳入用药组统计，这组五年生存率显著更高，说明药物有效。';
const COMPARE = /(?:比|相较于?|相对于?|对照|compared|versus|\bvs\.?\b|higher|longer|lower|better|superior)/i;
const ABSOLUTE = /(?:极低|极低|几乎为零|近乎为零|很低|显著下降|大幅下降|极少数|明显更低)/i;
console.log('window=' + anyHit(I.IMMORTAL_WINDOW_ZH, s) + ' COMPARE=' + COMPARE.test(s) + ' ABSOLUTE=' + ABSOLUTE.test(s));
for (const re of I.IMMORTAL_WINDOW_ZH) console.log('  W match: ' + re.source.slice(0,50) + ' => ' + re.test(s));
for (const re of I.EFFICACY_ZH) { if (re.test(s)) console.log('  EFF: ' + re.source.slice(0,60)); }
// 检查 detail 里 window 路径到底走没走到
console.log('direct=' + mod.checkImmortalTimeBias(s).hit + ' detail=' + mod.checkImmortalTimeBias(s).detail);
