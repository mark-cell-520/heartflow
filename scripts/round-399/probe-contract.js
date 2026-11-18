// r399 契约断言诊断：为什么 /\[\^。！？!?\\n\]\{0,\d+\}/ 匹配不上真实 source
const m = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js');
const src = m.EN_SIGNALS.ability_dependence[0].source;
const i = src.indexOf('[^');
const frag = src.slice(i, i + 16);
console.log('真实片段:', JSON.stringify(frag));

// 测试文件里的断言（源码字面 /\[\^。！？!?\\n\]\{0,\d+\}/）
const assertRe = /\[\^。！？!?\\n\]\{0,\d+\}/;
console.log('断言正则 source:', JSON.stringify(assertRe.source));
console.log('断言正则 test 片段:', assertRe.test(frag));

// 片段中 \\n 两个字符
const nlIdx = frag.indexOf('\\');
console.log('片段中反斜杠位置:', nlIdx, '其后两个字符:', JSON.stringify(frag.slice(nlIdx, nlIdx + 2)));

// 直接逐字符 source 比较
const exp = '[^。！？!?\\n]{0,60}';
console.log('手工构造 == 片段?', exp === frag.slice(0, 13));
console.log('断言 test 手工串:', assertRe.test(exp));

// 结论：断言正则中 \\n 在源码里 = 一个反斜杠 + n，与片段一致，
// 那唯一剩下的可能：\{0,\d+\} 中 \d 在测试文件里可能被写成其它形式。
console.log('片段尾部:', JSON.stringify(frag.slice(10)));
