// r305 负例注入：删掉 META_ANCHOR/META_DOM 双腿族 → 元语言攻击必须从 hit 翻 miss
// 目的：证明承重确实来自 r305 新腿，而非其他维度搭便车。
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Module = require('module');

const SRC = path.resolve(__dirname, '../src/anchoring-effect.js');
const orig = fs.readFileSync(SRC, 'utf8');

const ATTACK = [
  '他先开的价是锚点，所以不管后面怎么谈，最后成交价都会锚在那个数附近。',
  '商家把原价当心理锚，顾客一看现价就觉得格外便宜。',
  '谈判一开始的数字成了锚，后续每一步让步都绕不开它。',
  '他以最初那个数为参照，之后所有的估价都围着它转。',
  '这个数字一直没独立估过，判断全被它牵引着。',
  'The list price is an anchor, so the final price stays near it.',
  'They anchored the talks on the first number, and every later offer orbits it.',
  'The premium tier acts as an anchor — nobody ever recalibrated.',
];

function loadWith(text) {
  fs.writeFileSync(SRC, text);
  delete require.cache[require.resolve(SRC)];
  const mod = require(SRC);
  fs.writeFileSync(SRC, orig);
  delete require.cache[require.resolve(SRC)];
  return mod;
}

// ── 注入：抹掉 r305 双腿族的「真实匹配内容」（保留结构，注释不动）──
// 直接把 META_ANCHOR / META_DOM 四个 const 的正则字面量清空为永不匹配的 /(?!)/。
function neutralise(text) {
  return text.replace(/const\s+(META_ANCHOR_ZH|META_ANCHOR_EN|META_DOM_ZH|META_DOM_EN)\s*=\s*\[[\s\S]*?\n\];/g,
    (_m, name) => `const ${name} = [/(?!x)x/];`);
}

const stripped = neutralise(orig);
assert.notStrictEqual(stripped, orig, '注入未生效——未找到 META_* 数组声明');

const withLegs = loadWith(orig).detectAnchoringEffect;
const noLegs = loadWith(stripped).detectAnchoringEffect;

let red = 0, stillHit = [];
ATTACK.forEach((s, i) => {
  const before = !!(withLegs(s) && withLegs(s).hit);
  const after = !!(noLegs(s) && noLegs(s).hit);
  if (before) {
    assert.ok(!after, `#${i + 1} 删腿后仍 hit——承重不来自 r305 新腿: ${s}`);
    red++;
  } else {
    stillHit.push(i + 1);
  }
});

// 恢复校验
const restored = fs.readFileSync(SRC, 'utf8');
assert.strictEqual(restored, orig, '注入后源文件未正确恢复！');

console.log(`r305 负例注入: ${red}/${ATTACK.length} 攻击在删腿后翻 miss（承重来自 r305 双腿族）`);
if (stillHit.length) console.log(`  注: #${stillHit.join(', #')} 在注入前即未 hit（被旧族豁免/良性形），不计入`);
assert.ok(red >= 7, `翻 miss 数 ${red} < 7——新腿承重证据不足`);
console.log('负例注入通过');
