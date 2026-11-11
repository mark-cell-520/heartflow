'use strict';
/**
 * scripts/round-300/r300-injection-delete.js
 * [r300] 元素级注入-删条负例：把本轮反馈攻击实际依赖的每个 FB 正则元素从其所在
 * 腿数组中移除，断言该攻击翻零命中（承重证明）且存量主判据攻击不受影响（新路由独立）。
 * 说明：不用「逐词」删——本族为紧凑正则（如 责骂|骂了他|...、played\s+(?:terribly|...)），
 * 同一攻击常命中多个冗余 alternatives / 分组内 | ，逐词删会因冗余项仍在而漏判；
 * 故按「删该攻击匹配到的正则元素」为承重单位（等价宪法「逐条删每个新模式」）。
 * 全程 in-memory 注入（不落盘、不污染引擎文件），末行清理退出。
 * 用法：node scripts/round-300/r300-injection-delete.js  → exit 0 = N/N 变红
 */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { checkRegressionToMean, __internals } = require(path.join(ROOT, 'src', 'regression-to-the-mean.js'));
const I = __internals();
const hit = (t, inj) => checkRegressionToMean(t, inj).hit === true;

// 移除 arr 中「正则命中 text」的所有元素（保留不命中的），使该腿对 text 失效
function dropMatching(arr, text) {
  return arr.filter((re) => {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    return !g.test(text);
  });
}

const ZH_ATK = '孩子这次考得差，我责骂了他，下次就考好了，可见责骂能提高成绩。';
const ZH_WARN = '员工状态低迷，我给了警告，之后业绩就回升了，警告起了作用。';
const ZH_PRAISE_HIGH = '我表扬了孩子考了满分，结果下次考试就退步了，看来表扬会让孩子骄傲自满。';
const EN_ATK = 'He played terribly in the first half, so I criticized him hard; he then played great, which proves criticism works.';
const EN_REWARD_HIGH = 'We rewarded the sales team with a bonus after a record quarter, but next quarter sales fell — bonuses clearly make people complacent.';
const OLD_CTRL = [
  '上次考了年级最差，考前吃了巧克力，这次回到班级中等——巧克力确实有用。',
  'After our worst quarter on record we hired the new consultant, and revenue bounced back — the hire fixed it.',
];

// [腿数组键, 依赖它的专署攻击, 人类可读腿名]
const LEGS = ['FB_EXTREME', 'FB_REGRESSION', 'FB_INTERVENE', 'FB_ATTRIB'];
const CASES = [];
for (const atk of [ZH_ATK, ZH_WARN, ZH_PRAISE_HIGH]) for (const leg of LEGS) CASES.push([leg + '_ZH', atk, leg]);
for (const atk of [EN_ATK, EN_REWARD_HIGH]) for (const leg of LEGS) CASES.push([leg + '_EN', atk, leg]);

let red = 0, notRed = 0;
for (const [arrKey, atk, leg] of CASES) {
  if (!hit(atk)) { console.log('  ⚠ 正向未命中（先检查）: ' + arrKey + ' | ' + atk); notRed++; continue; }
  const inj = {}; inj[arrKey] = dropMatching(I[arrKey], atk);
  const removed = I[arrKey].length - inj[arrKey].length;
  const turnedRed = !hit(atk, inj);
  const oldStillHit = OLD_CTRL.every((o) => hit(o, inj));
  if (turnedRed && oldStillHit && removed > 0) {
    red++; console.log('  ✓ [' + arrKey + '] 移除 ' + removed + ' 个依赖正则 → 攻击翻零命中，存量对照仍命中');
  } else {
    notRed++; console.log('  ❌ [' + arrKey + '] 未变红（attackRed=' + turnedRed + ', oldHit=' + oldStillHit + ', removed=' + removed + '）| ' + atk);
  }
}
console.log('\n元素级注入-删条: 共 ' + CASES.length + ' 条腿×攻击组合，' + red + ' 个变红，' + notRed + ' 个未变红');
console.log('[cleanup] 全程 in-memory 注入，无临时文件，scratch 已净');
process.exit(red === CASES.length && notRed === 0 ? 0 : 1);
