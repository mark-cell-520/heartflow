const path = require('path');
const PRE = '/data/home/.hermes/cache/scratch/wpt-r266-pre/src/illicit-conversion.js';
const ic = require(PRE);
const s = 'The inductees are without exception top performers, hence top performers are inductees.';
console.log('pre-change:', JSON.stringify(ic.checkIllicitConversion(s)).slice(0, 260));
