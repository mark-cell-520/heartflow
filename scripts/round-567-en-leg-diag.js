/**
 * scripts/round-567-en-leg-diag.js
 * 诊断 PERMIT_EN 的 at-least 支为何不命中（只输出布尔，不打印样本）。
 */
'use strict';

const T = 'At least I did not do worse than they did.';
const T2 = 'At least I did not do worse.';
const T3 = 'at least i did not do worse than they did';

const WHOLE = new RegExp([
  '\\bat\\s+least\\s+(?:i|we)\\s+(?:did\\s+not|have\\s+not)\\s+(?:do|behave\\s+)?(?:any\\s+)?(?:worse|as\\s+bad|so\\s+bad|worse\\s+than)\\b',
].join('|'), 'i');

const SEGS = [
  ['at least', /\bat\s+least/i],
  ['(?:i|we)', /\bat\s+least\s+(?:i|we)/i],
  ['did not', /\bat\s+least\s+(?:i|we)\s+(?:did\s+not|have\s+not)/i],
  ['do opt', /\bat\s+least\s+(?:i|we)\s+(?:did\s+not|have\s+not)\s+(?:do|behave\s+)?/i],
  ['any opt', /\bat\s+least\s+(?:i|we)\s+(?:did\s+not|have\s+not)\s+(?:do|behave\s+)?(?:any\s+)?/i],
  ['worse alt', /\bat\s+least\s+(?:i|we)\s+(?:did\s+not|have\s+not)\s+(?:do|behave\s+)?(?:any\s+)?(?:worse|as\s+bad|so\s+bad|worse\s+than)/i],
  ['final \\b', /(?:worse|as\s+bad|so\s+bad|worse\s+than)\b/i],
];

for (const [name, re] of SEGS) {
  console.log(`${name}: T=${re.test(T)} T2=${re.test(T2)} T3=${re.test(T3)}`);
}
console.log(`WHOLE: T=${WHOLE.test(T)} T2=${WHOLE.test(T2)} T3=${WHOLE.test(T3)}`);
console.log(`WHOLE.source=${WHOLE.source}`);

// 换一种写法：把 worse\s+than 提前到 worse 之前，规避 \b 后的分支
const ALT = new RegExp([
  '\\bat\\s+least\\s+(?:i|we)\\s+(?:did\\s+not|have\\s+not)\\s+(?:done|do|behave\\b)?\\s*(?:anything\\s+)?(?:worse|worse\\s+than|as\\s+bad|so\\s+bad)\\b',
].join('|'), 'i');
console.log(`ALT: T=${ALT.test(T)} T2=${ALT.test(T2)} T3=${ALT.test(T3)}`);

// 极简版：只到 worse（不跟 than）
const SIMPLE = new RegExp(['\\bat\\s+least\\s+(?:i|we)\\s+(?:did\\s+not|have\\s+not)\\s+(?:do\\s+|done\\s+|behave\\s+)?worse'], 'i');
console.log(`SIMPLE(no \\b): T=${SIMPLE.test(T)} T2=${SIMPLE.test(T2)}`);

// 检查是不是结尾句点：去掉句点
const T4 = 'At least I did not do worse than they did';
console.log(`WHOLE(no period): ${WHOLE.test(T4)}`);
console.log(`SIMPLE(no period): ${SIMPLE.test(T4)}`);

// 逐字符验证 \b 位置
const m = T.match(/(?:worse|as\s+bad|so\s+bad|worse\s+than)\b/i);
console.log(`worse match idx=${m ? m.index : 'null'} len=${m ? m[0].length : 0}`);
