const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const ic = require(path.join(REPO, 'src', 'illicit-conversion.js'));
const s = 'The inductees are without exception top performers, hence top performers are inductees.';
console.log('current:', JSON.stringify(ic.checkIllicitConversion(s)));
