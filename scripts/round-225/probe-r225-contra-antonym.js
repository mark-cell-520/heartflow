// r225 探针 4：英文矛盾族边修边量化 —— 先量化「现有 pair 误伤」再定判据
// 目标：找出可安全新增的英文矛盾判据形状，且不新增误伤
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const idx = require(path.join(ROOT, 'src', 'index.js'));

// A. 候选正向族（拟新增判据的形状）
const CAND = {
  'antonym-pair': [
    'This approach is safe and it is dangerous at the same time.',
    'The result is completely reliable, but it is totally unreliable.',
    'It is cheap to run and costly to run simultaneously.',
    'This system is very fast. But it is also very slow in practice.',
  ],
  'stance-flip': [
    'I fully support this proposal. I have always opposed it strongly.',
    'We will launch next month. We already postponed it twice this year.',
    'Everyone agrees with the plan. Nobody supports it at all.',
    'This is our best idea ever, and also the worst idea we have had.',
  ],
  'existence-flip': [
    'This feature does not exist and it has always existed.',
    'Nothing here is optional, but everything is optional.',
  ],
  'same-subject-neg': [
    'The build works perfectly and the build fails every night.',
    'It is deterministic in theory; it is random in practice.',
  ],
};

console.log('=== 候选正向族（现有 checkContradiction）===');
let total = 0, hits = 0;
for (const [g, arr] of Object.entries(CAND)) {
  let gh = 0;
  for (const t of arr) {
    total++;
    const r = idx.checkContradiction(t);
    if (r.count > 0) { gh++; hits++; }
  }
  console.log(`${gh > 0 ? 'OK ' : 'GAP'} ${g.padEnd(18)} ${gh}/${arr.length}`);
}
console.log(`候选族命中 ${hits}/${total}`);

// B. 拟新增判据的手工验证：ANTONYM 对 + BUT/AND 连接
const ANTONYM_GROUPS = [
  ['fast', 'slow'], ['safe', 'dangerous'], ['cheap', 'expensive'], ['reliable', 'unreliable'],
  ['simple', 'complicated'], ['easy', 'difficult'], ['always', 'never'], ['possible', 'impossible'],
  ['works', 'fails'], ['enabled', 'disabled'], ['correct', 'incorrect'], ['stable', 'unstable'],
];
// 组合前置词性形状：形容词 + but/and + 反义词（同句或跨句）
function tryAntonym(text) {
  const low = ' ' + text.toLowerCase() + ' ';
  for (const [a, b] of ANTONYM_GROUPS) {
    const ra = new RegExp('\\b' + a + '\\b'), rb = new RegExp('\\b' + b + '\\b');
    if (ra.test(low) && rb.test(low)) return a + '/' + b;
  }
  return null;
}

const ANTONYM_SAMPLES = [
  'This approach is safe and it is dangerous at the same time.',
  'The result is completely reliable, but it is totally unreliable.',
  'It is cheap to run and costly to run simultaneously.',
  'This system is very fast. But it is also very slow in practice.',
  'The API is simple to use, yet it is quite complicated to configure.',
  'Our product is affordable, though the pricing is expensive.',
  'The build works perfectly and the build fails every night.',
];
console.log('\n=== ANTONYM 手工判据（拟新增）===');
let ah = 0;
for (const t of ANTONYM_SAMPLES) {
  const m = tryAntonym(t);
  if (m) ah++;
  console.log(`${m ? 'HIT' : 'miss'} ${(m || '-').padEnd(18)} ${t.slice(0, 60)}`);
}
console.log(`ANTONYM 命中 ${ah}/${ANTONYM_SAMPLES.length}`);

// C. 中性池：ANTONYM 判据会不会误伤
const NEUTRAL = [
  'The system is fast in the common case, and slower under heavy load.',
  'It is simple to learn but powerful once configured.',
  'The API is stable, though occasionally the upstream service degrades.',
  'This works on Linux and Windows alike.',
  'While parsing is linear, evaluation may cost more memory.',
  'The result is deterministic and reproducible across runs.',
  'We support both caching and no-cache modes explicitly.',
  'Some options are optional; the required ones are validated at startup.',
  'It never crashes under normal load, but it may under memory pressure.',
  'This always works offline, though it syncs when online.',
  'The feature is always enabled for admins, but optional for others.',
  'It cannot be disabled in safe mode, but it can in normal mode.',
  'Caching is disabled by default and enabled per request.',
  'Simple to install, complicated only when customizing.',
];
console.log('\n=== ANTONYM 误伤检查 ===');
let afp = 0;
for (const t of NEUTRAL) {
  const m = tryAntonym(t);
  if (m) { afp++; console.log(`误伤 ${m}: ${t.slice(0, 60)}`); }
}
console.log(`ANTONYM 误伤 ${afp}/${NEUTRAL.length}`);
