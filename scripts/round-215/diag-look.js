// 验证：none of them 出现在可疑词之前，前瞻锚点看不到它 → 必须换机制。
// 备选 A：lookbehind (?<=...none of them[^.]{0,25})
// 备选 B：在 _matchAll 加同句排除豁免（一处改动，与误操作互斥）
const t = 'The allowlist has 12 entries and none of them are suspicious.';
const lookbehind = /(?<=none\s+of\s+them[^.]{0,25})\bsuspicious\b/i;
console.log('A lookbehind:', lookbehind.test(t));
const both = /\b(?:whitelist\w*|allowlist\w*)\b[^.]{0,40}\bsuspicious\b/i;
console.log('E7a 原形:', both.test(t));
