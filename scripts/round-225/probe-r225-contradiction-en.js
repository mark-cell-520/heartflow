// r225 探针：英文侧矛盾检测现状量化（checkContradiction + output-gate findSelfContradiction）
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const idx = require(path.join(ROOT, 'src', 'index.js'));

// 英文矛盾样本族（命名即形状，本体隔离于本文件）
const FAMILIES = {
  yinyang: [ // 前后对立的评价/属性对
    'First, this system is very fast. But it is also very slow in practice.',
    'The API is extremely simple to use, yet at the same time it is quite complicated.',
    'Our product is affordable, though the pricing is expensive.',
    'The result is completely reliable, but it is also totally unreliable.',
    'This approach is safe and it is dangerous at the same time.',
  ],
  concession: [ // 让步结构 + 转折（对 but/however 的显式呼应）
    'Although the design looks clean, it is however deeply flawed inside.',
    'While the code is short, it nevertheless takes hours to debug.',
    'Even though tests pass, the build still fails randomly.',
    'Despite the documentation, nobody can understand the setup.',
    'The plan seems solid; however, it will never actually work.',
  ],
  negated_self: [ // 自我否定/不可能并存
    'This feature does not exist and it has always existed.',
    'We never ship on Friday and we ship every Friday.',
    'Nothing here is optional, but everything is optional.',
    'The cache is always enabled while caching is always disabled.',
    'It is impossible to configure and there are no configuration options.',
  ],
  temporal_flip: [ // 时态/承诺翻转
    'We will launch next month. We already postponed it twice this year.',
    'It was cancelled last week. It is still the top priority now.',
    'This was a temporary change. It became permanent long ago.',
  ],
  stance_flip: [ // 立场翻转
    'I fully support this proposal. I have always opposed it strongly.',
    'This is our best idea ever, and also the worst idea we have had.',
    'Everyone agrees with the plan. Nobody supports it at all.',
    'It works perfectly. Nothing about it works.',
  ],
};

console.log('checkContradiction 存在: ' + (typeof idx.checkContradiction));

let total = 0, hits = 0;
for (const [fam, arr] of Object.entries(FAMILIES)) {
  let fh = 0;
  for (const t of arr) {
    total++;
    let found = false;
    if (typeof idx.checkContradiction === 'function') {
      try {
        const r = idx.checkContradiction(t);
        const c = r && (r.contradictions || r.count || r.matches || r.signals || r.findings);
        if (Array.isArray(c) && c.length > 0) found = true;
        else if (typeof c === 'number' && c > 0) found = true;
        else if (r && r.score > 0) found = true;
      } catch (_) {}
    }
    if (found) { fh++; hits++; }
  }
  console.log(`${fh > 0 ? 'OK ' : 'GAP'} ${fam.padEnd(14)} ${fh}/${arr.length}`);
}
console.log(`\n英文矛盾族命中 ${hits}/${total}`);

// 中性对照：真实的非矛盾英文（科学谨慎表述 / 并列陈述）
const NEUTRAL = [
  'The system is fast in the common case, and slower under heavy load.',
  'It is simple to learn but powerful once configured.',
  'The API is stable, though occasionally the upstream service degrades.',
  'This works on Linux and Windows alike.',
  'While parsing is linear, evaluation may cost more memory.',
  'The result is deterministic and reproducible across runs.',
  'We support both caching and no-cache modes explicitly.',
  'Some options are optional; the required ones are validated at startup.',
];
let fp = 0;
for (const t of NEUTRAL) {
  let found = false;
  if (typeof idx.checkContradiction === 'function') {
    try {
      const r = idx.checkContradiction(t);
      const c = r && (r.contradictions || r.count || r.matches || r.signals || r.findings);
      if (Array.isArray(c) && c.length > 0) found = true;
      else if (typeof c === 'number' && c > 0) found = true;
      else if (r && r.score > 0) found = true;
    } catch (_) {}
  }
  if (found) { fp++; console.log('中性误伤 -> ' + JSON.stringify(t).slice(0, 60)); }
}
console.log(`中性误伤 ${fp}/${NEUTRAL.length}`);
