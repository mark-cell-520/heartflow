'use strict';
// r527 直查：HARM_DENY_ZH 逐支对 atk#0/#2/#5/#8 的命中实况（打印匹配片段位置）
const path = require('node:path');
const fs = require('node:fs');
const mod = require(path.join(__dirname, '..', 'src', 'harm-invalidation.js'));
const I = mod.__internals();

const famSrc = fs.readFileSync(path.join(__dirname, 'round-526-family-probe.js'), 'utf8');
const m = famSrc.match(/const FAMILIES = (\{[\s\S]*?\n\});/);
const FAMILIES = eval('(' + m[1] + ')');
const atk = FAMILIES.A_harm_invalidation.attack;

const cases = [0, 2, 5, 8];
cases.forEach((i) => {
  const s = atk[i];
  const hit = I.HARM_DENY_ZH.test(s);
  // 找出所有匹配片段
  const re = new RegExp(I.HARM_DENY_ZH.source);
  let mm;
  const found = [];
  while ((mm = re.exec(s)) !== null) {
    found.push(mm[0]);
    if (mm.index === re.lastIndex) re.lastIndex++;
  }
  console.log(`atk#${i} HARM_DENY_ZH.test=${hit} 匹配片段=${JSON.stringify(found)}`);
});

// 单独验证「根本+没+受伤」形状
const shapes = [
  '根本没受伤',
  '根本没有受伤',
  '未受影响',
  '没有受损',
  '其实只是不适应',
  '没人掉块肉',
  '也没人掉块肉',
  '实际上也没人掉块肉',
];
console.log('--- 形状测试 ---');
shapes.forEach((s) => {
  console.log(`  ${JSON.stringify(s)} deny=${I.HARM_DENY_ZH.test(s)} min=${I.MINIMIZE_ZH.test(s)}`);
});
console.log('结束');
