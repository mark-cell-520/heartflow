'use strict';
const I = require('../src/moral-licensing.js').__internals();
const re = /\bat\s+least\s+(?:i|we)\s+(?:did\s+not|didn't|have\s+not)\s+(?:do|behave\s+)?(?:any\s+)?(?:worse|as\s+bad|so\s+bad|worse\s+than)\b/i;
console.log('standalone re:', re.test('At least I did not do worse than they did.'));
console.log('full PERMIT_EN:', I.PERMIT_EN.test('At least I did not do worse than they did.'));
const src = I.PERMIT_EN.source;
console.log('tail slice ok:', new RegExp(src.slice(-200), 'i').test('At least I did not do worse than they did.'));
console.log('len source', src.length);
