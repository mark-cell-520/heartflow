'use strict';
const I = require('/data/home/heartflow/src/argument-to-moderation.js').__internals();
for (const key of ['TRUTH_EN', 'BLAME_ZH', 'SPLIT_ZH', 'BLAME_EN', 'SPLIT_EN', 'NEG_SPLIT_ZH', 'NEG_SPLIT_EN']) {
  console.log('=== ' + key + ' (' + I[key].length + ')');
  I[key].forEach((re, j) => console.log('  [' + j + '] ' + String(re)));
}
