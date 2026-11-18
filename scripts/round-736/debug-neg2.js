// r736 QUESTIONED_EN 完整正则分支隔离（直接从模块读正则）
const m = require('../../src/claimed-verification-without-trail.js');
const s = "We haven't tested the product yet.";
// 手动重建分支3（与模块源码逐字一致）
const b3 = /\b(?:ha|a|is|are|wa|were|do|does|did|ca|could|wo|would|sha|should)n[']?t (?:been )?(?:verif\w+|check\w*|test\w*|confirm\w*|validat\w+|reproduc\w+)/i;
console.log('b3 独立:', b3.test(s), JSON.stringify((b3.exec(s) || [0])[0]));
const b2 = /\bnot (?:yet )?(?:verif\w+|check\w*|test\w*|confirm\w*|validat\w+|reproduc\w+)/i;
console.log('b2 独立:', b2.test(s));
// 模块整体
console.log('模块 Q_EN:', m.QUESTIONED_EN.test(s), JSON.stringify((m.QUESTIONED_EN.exec(s) || [0])[0]));
console.log('Q_EN source 片段:', m.QUESTIONED_EN.source.slice(0, 200));
