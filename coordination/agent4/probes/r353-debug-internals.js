'use strict';
const mod = require('/data/home/heartflow/src/immortal-time-bias.js');
console.log('module keys:', Object.keys(mod));
const I = mod.__internals();
console.log('internals keys:', Object.keys(I).join(','));
