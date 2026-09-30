'use strict';
const path = require('path');
const src = require('fs').readFileSync(path.join(__dirname, '..', '..', 'src', 'index.js'), 'utf8');
const tm = src.match(/const AUTHORITY_FIRST_PERSON = \{[\s\S]*?\n\};/);
const table = eval('(' + tm[0].replace(/^const \w+ = /, '').replace(/;\s*$/, '') + ')');
const t = 'As the CEO, I have decided this.';
const halves = table.en;
console.log('identity=' + halves.identity.map((re, i) => re.test(t) ? 'Y' + i : '').filter(Boolean).join(','));
console.log('obey=' + halves.obey.map((re, i) => re.test(t) ? 'Y' + i : '').filter(Boolean).join(','));
console.log('dismiss=' + halves.dismiss.map((re, i) => re.test(t) ? 'Y' + i : '').filter(Boolean).join(','));
// 逐条看 identity 哪条命中
halves.identity.forEach((re, i) => { if (re.test(t)) console.log('  id[' + i + '] ' + re.source); });
halves.obey.forEach((re, i) => { if (re.test(t)) console.log('  ob[' + i + '] ' + re.source); });
halves.dismiss.forEach((re, i) => { if (re.test(t)) console.log('  ds[' + i + '] ' + re.source); });
