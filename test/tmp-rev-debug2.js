const pat = /\bbatch\s+\w+/gi;
const text = 'batch process all records.';
const copy = new RegExp(pat.source, pat.flags);
console.log('pattern:', copy);
console.log('flags:', copy.flags);
console.log('source:', copy.source);

let m = copy.exec(text);
console.log('match1:', m && m[0], 'index:', m && m.index, 'lastIndex:', copy.lastIndex);

m = copy.exec(text);
console.log('match2:', m && m[0], 'index:', m && m.index, 'lastIndex:', copy.lastIndex);

m = copy.exec(text);
console.log('match3:', m && m[0], 'index:', m && m.index, 'lastIndex:', copy.lastIndex);
