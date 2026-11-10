const fs = require('fs');
const lines = fs.readFileSync('/data/home/heartflow/src/gamblers-fallacy.js', 'utf8').split('\n');
for (const l of lines) {
  if (l.includes('fortune')) {
    const i = l.indexOf('fortune');
    console.log(JSON.stringify(l.slice(i, i + 90)));
    // 逐字符 codepoint
    const seg = l.slice(i, i + 60);
    console.log([...seg].map(c => c.codePointAt(0) > 127 ? 'U+' + c.codePointAt(0).toString(16) : c).join(''));
  }
}
