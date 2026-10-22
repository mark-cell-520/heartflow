/**
 * 第 225 轮：英文反义评价对并置的矛盾检测覆盖
 *
 * ## 缺口形状
 *
 * 轮初实测（scripts/round-225/probe-r225-contra-*.js）：英文矛盾族 22 条样本
 * 命中 0/22。现有 18 条 CONTRADICTION_PAIRS 的 positive 全部要求
 *   ① 绝对化词（never/always/definitely）+ but/however 转折，或
 *   ② 立场动词（agree/support/endorse）+ but + 怀疑/否定
 * 而 LLM 英文输出最高频的自相矛盾是**同句反义评价对并置**：
 * 「safe ... dangerous」「reliable ... unreliable」「fast ... slow」——
 * 无绝对化词、用 and / at the same time 连接，全部从既有 pair 的缝隙漏过。
 *
 * ## 判据（刻意保守，三重收窄）
 *
 * ① 只收评价/能力对立对（EN_CONTRADICTION_ANTONYMS，12 组）
 * ② 必须由连接词（and/but/yet/while…）把两侧串起来
 * ③ 三重豁免：设计性并置 / 已知取舍 / 分条件切换
 *
 * ## 与既有 pair 的分界
 *
 * 前 18 条 pair 形态固定（正则），第 19 条是数组形态（词对 + 连接词确认），
 * 两者互不侵占：第 19 条不要求绝对化词，前 18 条不要求反义词对。
 */

const test = require('node:test');
const assert = require('node:assert');
const { checkContradiction } = require('../src/index.js');

let pass = 0, fail = 0;
function check(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('  FAIL: ' + label); }
}

// ─── A. 正向族：反义评价对并置（必须判矛盾）────────────
const POSITIVE_ANTONYM = [
  ['safe/dangerous',      'This approach is safe and it is dangerous at the same time.'],
  ['reliable/unreliable', 'The result is completely reliable, but it is totally unreliable.'],
  ['simple/complicated',  'The API is simple to use, yet it is quite complicated to configure.'],
  ['works/fails',         'The build works perfectly and the build fails every night.'],
  ['fast/slow',           'This system is very fast. But it is also very slow in practice.'],
  ['always/never',        'The cache is always enabled while caching is always disabled.'],
  ['enabled/disabled',    'The feature is enabled and it is disabled at the same time.'],
  ['possible/impossible', 'It is possible to configure and it is impossible to configure.'],
  ['correct/incorrect',   'This is correct and incorrect depending on nothing.'],
  ['stable/unstable',     'The service is stable but unstable in every region.'],
  ['cheap/expensive',     'It is cheap to run yet expensive to run.'],
  ['open/closed',         'The port is open and it is closed for everyone.'],
];

// ─── B. 反向族：比较级 / 最高级不触发（\bslow\b 不吃 slower）──
const NEGATIVE_GRADE = [
  'The system is fast in the common case, and slower under heavy load.',
  'It is simple to learn but powerful once configured.',
  'This is the fastest implementation we have and the slowest to debug.',
  'Caching is disabled by default and enabled per request.',
  'The window is open for reading and closed after writing.',
];

// ─── C. 反向族：分条件切换（X 条件下 A，Y 条件下 B）──
const NEGATIVE_CONDITION = [
  'It never crashes under normal load, but it may under memory pressure.',
  'This always works offline, though it syncs when online.',
  'It cannot be disabled in safe mode, but it can in normal mode.',
  'The file is open for reading and closed automatically afterwards.',
  'It is correct in the common case, but incorrect under edge conditions.',
];

// ─── D. 反向族：已知取舍 / 设计性并置 ────────────────
const NEGATIVE_TRADEOFF = [
  'The design is simple but complicated by design, which is a known trade-off.',
  'This is a workaround: safe in theory and dangerous in practice.',
  'It is intentional behaviour, both fast and slow routes are supported.',
];

// ─── E. 反向族：无连接词并置（两个词都在，但没有 and/but/yet）──
const NEGATIVE_NO_LINK = [
  'The system is fast. The competitor is slow.',
  'Safe mode is enabled. Dangerous mode is disabled.',
  'Reliable services exist. Unreliable services are removed.',
];

for (const [label, text] of POSITIVE_ANTONYM) {
  const r = checkContradiction(text);
  check(r.count > 0, `正向[${label}] count=${r.count}`);
}

for (const text of NEGATIVE_GRADE) {
  const r = checkContradiction(text);
  // 比较级样本不因第 19 条命中（count 仍可能 >0，但 pair 不得是反义对标注）
  const antonymHit = (r.contradictions || []).some(c => String(c.pair).includes('/'));
  check(!antonymHit, `反向[比较级] 误触发第19条: ${text.slice(0, 44)}`);
}

for (const text of NEGATIVE_CONDITION) {
  const r = checkContradiction(text);
  const antonymHit = (r.contradictions || []).some(c => String(c.pair).includes('/'));
  check(!antonymHit, `反向[分条件] 误触发第19条: ${text.slice(0, 44)}`);
}

for (const text of NEGATIVE_TRADEOFF) {
  const r = checkContradiction(text);
  const antonymHit = (r.contradictions || []).some(c => String(c.pair).includes('/'));
  check(!antonymHit, `反向[已知取舍] 误触发第19条: ${text.slice(0, 44)}`);
}

for (const text of NEGATIVE_NO_LINK) {
  const r = checkContradiction(text);
  const antonymHit = (r.contradictions || []).some(c => String(c.pair).includes('/'));
  check(!antonymHit, `反向[无连接词] 误触发第19条: ${text.slice(0, 44)}`);
}

// ─── F. 前 18 条 pair 不受影响（回归）────────────────
const LEGACY_STILL_WORKS = [
  ['should...but shouldn\'t', 'You should do it, but you shouldn\'t really.'],
  ['never...but can',        'It never works, but it can sometimes.'],
  ['agree...but doubt',      'I agree with the plan, but I have serious doubts about it.'],
];
for (const [label, text] of LEGACY_STILL_WORKS) {
  const r = checkContradiction(text);
  check(r.count > 0, `遗留 pair 回归[${label}] count=${r.count}`);
}

// ─── G. 样本池非空自检（防"清空样本池"变异）──────────
check(POSITIVE_ANTONYM.length === 12, `正向样本池应为 12 条，实际 ${POSITIVE_ANTONYM.length}`);
check(NEGATIVE_GRADE.length === 5, `比较级样本池应为 5 条，实际 ${NEGATIVE_GRADE.length}`);
check(NEGATIVE_CONDITION.length === 5, `分条件样本池应为 5 条，实际 ${NEGATIVE_CONDITION.length}`);
check(LEGACY_STILL_WORKS.length === 3, `遗留回归池应为 3 条，实际 ${LEGACY_STILL_WORKS.length}`);

// ─── H. 空/非字符串输入不崩 ────────────────────────
for (const bad of [null, undefined, '', 123, {}]) {
  let threw = false;
  try { checkContradiction(bad); } catch (_) { threw = true; }
  check(!threw, `异常输入 ${JSON.stringify(bad)} 不得抛错`);
}

console.log(`测试结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (fail > 0) process.exit(1);
