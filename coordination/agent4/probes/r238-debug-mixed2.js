// r238 调试：对比 test 文件与 debug 脚本中 MIXED 字符串的逐字符编码
'use strict';
const fs = require('fs');
const path = require('path');
const m = require(path.join(__dirname, '..', '..', '..', 'src', 'tragedy-of-commons.js'));

const testSrc = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'test', 'tragedy-of-commons.test.js'), 'utf8');
const testMixedLine = testSrc.split('\n').find(l => l.includes('const MIXED ='));
const dbg = '草场是公共的，每家多养羊自己多挣钱；The pasture is shared, so each family that adds more cattle earns more.';

// 从 test 源提取字符串字面量（去掉 const MIXED = ' 与末尾 ';）
const literal = testMixedLine.replace(/^const MIXED = '/, '').replace(/';$/, '');
console.log('test 行原文:', JSON.stringify(testMixedLine.slice(0, 60)));
console.log('literal 长度:', literal.length, ' dbg 长度:', dbg.length);
for (let i = 0; i < Math.max(literal.length, dbg.length); i++) {
  if (literal[i] !== dbg[i]) {
    console.log(`差异 @${i}: test=${JSON.stringify(literal[i])}(U+${(literal[i] || '').codePointAt(0)?.toString(16)}) dbg=${JSON.stringify(dbg[i])}(U+${(dbg[i] || '').codePointAt(0)?.toString(16)})`);
  }
}
console.log('literal count:', m.detectTragedyOfCommons(literal).count);
console.log('dbg count:', m.detectTragedyOfCommons(dbg).count);
