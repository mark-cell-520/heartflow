'use strict';
const t1 = '这么久都不出来澄清，显然是心虚。';
const re1 = /(?:都|也|还|一直|至今|到现在|迟迟)?没(?:有)?(?:出来)?(?:否认|澄清|回应|回答|解释|辟谣|发声|作声|吭声)/;
console.log('t1 len:', t1.length, 'charAt(3..8):', JSON.stringify(t1.slice(3, 9)));
console.log('re1 test:', re1.test(t1));
// 手工拆解
console.log('都没出来澄清 slice:', JSON.stringify(t1.slice(3, 9)));
console.log('逐段: 都=', t1[3], '没=', t1[4], '出来=', t1.slice(5, 7), '澄清=', t1.slice(7, 9));
// 单独测前缀组
console.log('re-noprefix:', /没(?:有)?(?:出来)?(?:否认|澄清|回应|回答|解释|辟谣|发声|作声|吭声)/.test(t1));
console.log('re-with-prefix:', /(?:都|也|还|一直|至今|到现在|迟迟)?没(?:有)?(?:出来)?(?:否认|澄清|回应|回答|解释|辟谣|发声|作声|吭声)/.test('都没出来澄清'));
console.log('re-plain:', /没出来澄清/.test(t1));
