'use strict';
/**
 * r332 负例注入：验证三条补腿各自承重（剔除该腿后对应攻击样本必须翻红）。
 * 协议：detectIllusionOfControl(text, inject) 的 inject 是**对象键替换**
 * （findSignatures 内 R.B_ZH || B_ZH 等），不是数组下标删除。做法：取该组
 * 常量副本、剔除目标正则（按源码唯一注释锚定），传 inject 覆盖。
 * 用法：node scripts/round-332/probe-negative-injection.js
 */
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const mod = require(path.join(ROOT, 'src/illusion-of-control.js'));
const internals = mod.__internals();

const CASES = [
  {
    name: '②-e2 拉丁幸运物（中英混排句）',
    sample: '去 lottery 抽奖前他总要先 lucky charm 摸一遍，这样中奖 rate 会更高',
    key: 'B_ZH',
    anchor: 'lucky\\s+charm',
  },
  {
    name: '③-g2 副词插入（really improve）',
    sample: 'Only after I choose the numbers myself does my luck really improve in the weekly draw',
    key: 'C_EN',
    anchor: 'really|actually|somehow',
  },
  {
    name: '③-g3 of 插入（odds of hitting）',
    sample: 'If I chant the winning number three times under my breath, the odds of hitting it will go up',
    key: 'C_EN',
    anchor: 'of\\s+(?:\\w+\\s+){0,3}',
  },
];

console.log('=== r332 负例注入（剔除该腿后该样本必须从命中消失）===');
let pass = 0, total = 0;
for (const c of CASES) {
  total++;
  const before = mod.detectIllusionOfControl(c.sample);
  const orig = internals[c.key];
  // 注意：anchor 是**字符串字面量**（与源码 source 同形），用 indexOf 而非
  // new RegExp——anchor 里的 \\s 在 RegExp 构造下会二次转义成字面反斜杠。
  const kept = orig.filter(re => !re.source.includes(c.anchor));
  const removed = orig.length - kept.length;
  const after = mod.detectIllusionOfControl(c.sample, { [c.key]: kept });
  const ok = before.hit === true && after.hit === false && removed > 0;
  if (ok) pass++;
  console.log(`${ok ? '✓' : '✗'} ${c.name}: 删前 hit=${before.hit} → 剔除 ${removed} 条正则后 hit=${after.hit}`);
}
console.log(`\n负例注入: ${pass}/${total} 翻转`);
process.exit(pass === total ? 0 : 1);
