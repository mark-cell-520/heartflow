'use strict';
// 找出文件里 OWN_EN 的真实 source：node 正则里 \b 的两种表示
const R = new RegExp(['\\b(?:i|we)\\s+x'].join('|'), 'i');
console.log('A:', R.source, R.test('i x'));
const R2 = new RegExp(['\b(?:i|we)\s+x'].join('|'), 'i');
console.log('B:', R2.source, R2.test('i x'));
