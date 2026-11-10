'use strict';
const t = '不买就不是自己人，这点觉悟总得有吧。';
console.log([...t].map(c => c + ':' + c.codePointAt(0).toString(16)).join(' '));
console.log('len', t.length);
console.log('直接匹配 就是:', t.includes('就是'));
console.log('indexOf 就是:', t.indexOf('就是'));
