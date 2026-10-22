const fs = require('fs');
const s = fs.readFileSync('src/index.js', 'utf8');
['BLOCK_DIMS', 'REWRITE_DIMS', 'VERIFY_DIMS'].forEach(n => {
  const m = s.match(new RegExp(n + '\\s*=\\s*new Set\\(\\[([\\s\\S]*?)\\]\\)'));
  const items = m[1].split(',').map(x => x.trim().replace(/['"]/g, '')).filter(x => x && !x.startsWith('//'));
  console.log(n + ' (' + items.length + '): ' + items.join(' | '));
});
const dm = s.match(/dimMap\s*=\s*\{([\s\S]*?)\n\};/);
if (dm) {
  const keys = [...dm[1].matchAll(/([a-z_0-9]+)\s*:/g)].map(x => x[1]);
  console.log('dimMap keys (' + keys.length + ')');
}
