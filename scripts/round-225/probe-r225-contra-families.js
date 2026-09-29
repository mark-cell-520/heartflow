// r225 探针 3：英文矛盾缺口精确定位 —— 现有 6 条英文 pair 之外缺什么形状
// 样本族分「现有 pair 可覆盖」与「肯定覆盖不到」两组，量化缺口边界
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const idx = require(path.join(ROOT, 'src', 'index.js'));

const GROUPS = {
  // 组 1：现有 positive 词（never/always/absolute/completely）有出现，但结构不匹配
  'absolute+but-flip': [
    'This system is very fast. But it is also very slow in practice.',
    'The API is simple to use, yet it is quite complicated to configure.',
    'Our product is affordable, though the pricing is expensive.',
  ],
  // 组 2：同句 but 前后同主语不同谓语（无绝对词，pure semantic opposition）
  'same-subject-flip': [
    'The build works perfectly and the build fails every night.',
    'It is deterministic in theory; it is random in practice.',
    'We ship every week and we never ship anything.',
    'The cache is always enabled while caching is always disabled.',
  ],
  // 组 3：形容词对立对（fast/slow, safe/dangerous, cheap/expensive）
  'antonym-pair': [
    'This approach is safe and it is dangerous at the same time.',
    'The result is completely reliable, but it is totally unreliable.',
    'The system is fast and slow depending on nothing at all.',
    'It is cheap to run and costly to run simultaneously.',
  ],
  // 组 4：立场/承诺翻转（support→oppose，will launch→postponed）
  'stance-flip': [
    'I fully support this proposal. I have always opposed it strongly.',
    'We will launch next month. We already postponed it twice this year.',
    'Everyone agrees with the plan. Nobody supports it at all.',
    'This is our best idea ever, and also the worst idea we have had.',
  ],
  // 组 5：让步连接词族（already covered? 测 although/though/even though/despite/while）
  'concession-more': [
    'Although the design looks clean, it is however deeply flawed inside.',
    'While the code is short, it nevertheless takes hours to debug.',
    'Despite the documentation, nobody can understand the setup.',
    'Even though tests pass, the build still fails randomly.',
  ],
  // 组 6：否定存在与肯定存在并置
  'existence-flip': [
    'This feature does not exist and it has always existed.',
    'Nothing here is optional, but everything is optional.',
    'It is impossible to configure and there are no options.',
  ],
};

let total = 0, hits = 0;
for (const [g, arr] of Object.entries(GROUPS)) {
  let gh = 0;
  for (const t of arr) {
    total++;
    const r = idx.checkContradiction(t);
    if (r.count > 0) { gh++; hits++; }
  }
  console.log(`${gh > 0 ? 'OK ' : 'GAP'} ${g.padEnd(20)} ${gh}/${arr.length}`);
}
console.log(`\n精准缺口族命中 ${hits}/${total}`);

// 中性对照：不得误伤（谨慎科学表述 + 正常让步）
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
];
let fp = 0;
for (const t of NEUTRAL) {
  const r = idx.checkContradiction(t);
  if (r.count > 0) { fp++; console.log('误伤 -> ' + t.slice(0, 70)); }
}
console.log(`中性误伤 ${fp}/${NEUTRAL.length}`);
