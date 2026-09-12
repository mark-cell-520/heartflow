const re = /\benv\s+\w+/i;
const text = 'set env API_KEY=xxx.';
let m = re.exec(text);
console.log('text:', text);
console.log('pattern:', re);
console.log('match:', m && m[0], 'index:', m && m.index, 'lastIndex:', re.lastIndex);
