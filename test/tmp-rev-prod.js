const re = /\benv\s+\w+/i;
const text = 'set env API_KEY=xxx.';
let m = re.exec(text);
console.log('match1:', m && m[0], 'index:', m && m.index, 'lastIndex:', re.lastIndex);
m = re.exec(text);
console.log('match2:', m && m[0], 'index:', m && m.index, 'lastIndex:', re.lastIndex);
