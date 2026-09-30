const fs = require('fs');
const c = fs.readFileSync(process.cwd() + '/src/shield/skill-verifier.js', 'utf8');
const line = c.split(String.fromCharCode(10)).find(l => l.includes('u4e00'));
console.log('LINE: ' + JSON.stringify(line));
const BS = String.fromCharCode(92);
const target = '.replace(/[^' + BS + 'w' + BS + 'u4e00-' + BS + 'u9fff-]+/g, ' + '"' + '"' + ')';
console.log('BUILT: ' + JSON.stringify(target));
console.log('MATCH: ' + line.includes(target));
