// confirm VERIFY_DIMS assertion is pre-existing (reads index.js only)
const fs = require('fs');
const s = fs.readFileSync(require('path').join(process.cwd(), 'src/index.js'), 'utf8');
const i = s.indexOf('VERIFY_DIMS');
const j = s.indexOf('relative_pration', i);
console.log('VERIFY_DIMS at', i, '| first relative_pration after it at', j, '| gap', j - i, '| test window 5000 =>', (j - i) < 5000 ? 'within (would pass)' : 'BEYOND window (pre-existing stale assertion, unrelated to r297)');
