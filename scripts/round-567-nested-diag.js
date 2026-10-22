/**
 * scripts/round-567-nested-diag.js
 * 查 EN 支「worse alt」为何失败（只输出布尔/下标，不打印样本）。
 * 假设：NCC 分支里 `(?:do|behave\s+)?` 面对 "do worse" 时走了 `behave\s+` 失败 → 空 → `any` 空 → worse 需紧跟空白，但实际之间只有单空格，\s+ 应该够。真正嫌疑是 `\b` 前的 alternation 把 worse\s+than 提前吃掉了 than，导致 \b 在 than 后……
 * 用穷举定位。
 */
'use strict';

const T = 'At least I did not do worse than they did.';

const variants = [
  ['A 原版', '\\bat\\s+least\\s+(?:i|we)\\s+(?:did\\s+not|have\\s+not)\\s+(?:do|behave\\s+)?(?:any\\s+)?(?:worse|as\\s+bad|so\\s+bad|worse\\s+than)\\b'],
  ['B 删 worse\\s+than 分支', '\\bat\\s+least\\s+(?:i|we)\\s+(?:did\\s+not|have\\s+not)\\s+(?:do|behave\\s+)?(?:any\\s+)?(?:worse|as\\s+bad|so\\s+bad)\\b'],
  ['C 删 behave\\s+ 分支', '\\bat\\s+least\\s+(?:i|we)\\s+(?:did\\s+not|have\\s+not)\\s+(?:do)?(?:any\\s+)?(?:worse|as\\s+bad|so\\s+bad|worse\\s+than)\\b'],
  ['D 删 any 分支', '\\bat\\s+least\\s+(?:i|we)\\s+(?:did\\s+not|have\\s+not)\\s+(?:do|behave\\s+)?(?:worse|as\\s+bad|so\\s+bad|worse\\s+than)\\b'],
  ['E 删 as/so bad 分支', '\\bat\\s+least\\s+(?:i|we)\\s+(?:did\\s+not|have\\s+not)\\s+(?:do|behave\\s+)?(?:any\\s+)?(?:worse|worse\\s+than)\\b'],
  ['F worse\\s+than 提前', '\\bat\\s+least\\s+(?:i|we)\\s+(?:did\\s+not|have\\s+not)\\s+(?:do|behave\\s+)?(?:any\\s+)?(?:worse\\s+than|worse|as\\s+bad|so\\s+bad)\\b'],
  ['G have not 单支', '\\bat\\s+least\\s+(?:i|we)\\s+did\\s+not\\s+(?:do|behave\\s+)?(?:any\\s+)?(?:worse|as\\s+bad|so\\s+bad|worse\\s+than)\\b'],
  ['H 无 \\b 后缀', '\\bat\\s+least\\s+(?:i|we)\\s+(?:did\\s+not|have\\s+not)\\s+(?:do|behave\\s+)?(?:any\\s+)?(?:worse|as\\s+bad|so\\s+bad|worse\\s+than)'],
  ['I behave 领先', '\\bat\\s+least\\s+(?:i|we)\\s+(?:did\\s+not|have\\s+not)\\s+(?:behave\\s+|do\\s+)?(?:any\\s+)?(?:worse|as\\s+bad|so\\s+bad|worse\\s+than)\\b'],
  ['J do 后强制 \\s+', '\\bat\\s+least\\s+(?:i|we)\\s+(?:did\\s+not|have\\s+not)\\s+(?:do\\s+|behave\\s+)?(?:any\\s+)?(?:worse|as\\s+bad|so\\s+bad|worse\\s+than)\\b'],
  ['K any 后强制 \\s+', '\\bat\\s+least\\s+(?:i|we)\\s+(?:did\\s+not|have\\s+not)\\s+(?:do|behave\\s+)?(?:any\\s+)?(?:worse|worse\\s+than|as\\s+bad|so\\s+bad)\\b'],
];

for (const [name, src] of variants) {
  let ok = false, err = '';
  try { ok = new RegExp(src, 'i').test(T); } catch (e) { err = e.message; }
  console.log(`${name}: ${ok}${err ? ' ERR=' + err : ''}`);
}

// 反向验证：D 版（无 any）意味着 worse 前不能有 any。
const T5 = 'At least I did not do any worse.';
const A_ = /at\s+least\s+(?:i|we)\s+(?:did\s+not|have\s+not)\s+(?:do|behave\s+)?(?:any\s+)?(?:worse|as\s+bad|so\s+bad|worse\s+than)/i;
const D_ = /at\s+least\s+(?:i|we)\s+(?:did\s+not|have\s+not)\s+(?:do|behave\s+)?(?:worse|as\s+bad|so\s+bad|worse\s+than)/i;
console.log(`any-变体 T5: A=${A_.test(T5)} D=${D_.test(T5)}`);
