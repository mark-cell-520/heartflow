'use strict';
const re9 = new RegExp('(?:我|我们)?(?:从来|一贯|向来)(?:没|未|不)(?:出过|有过|遇到)(?:问题|故障|意外|事故)');
const t1 = '我从来没遇到过问题，这套流程是安全的。';
console.log('re9 on t1:', re9.test(t1));
console.log('substr:', t1.slice(0, 12));

// 逐段试
console.log('A:', new RegExp('(?:从来|一贯|向来)(?:没|未|不)').test('从来没'));
console.log('B:', new RegExp('从来没(?:出过|有过|遇到)').test('从来没遇到'));
console.log('C:', new RegExp('从来没遇到问题').test(t1));

// #11 支
const re11 = new RegExp('(?:我|我们)(?:从来|一直|从没|从未|一向|历来)(?:都)?(?:没|没有|未|不)(?:用|试|吃|开|买|操作|跑|部署)?(?:出过|有过|遇到|碰到|发生)(?:问题|故障|意外|事故|毛病|麻烦)');
console.log('re11 on t1:', re11.test(t1));
console.log('re11 on "我从未遇到过故障":', re11.test('我从未遇到过故障，说明可靠'));
console.log('re11 on "我们从没操作过，很安全":', re11.test('我们从没操作过，很安全'));
