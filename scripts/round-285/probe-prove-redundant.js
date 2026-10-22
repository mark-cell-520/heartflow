// 探针：noTail 后 S 仍 false，说明 not 是被 is\s+ 之后的词表前结构拦的。
// 在 dropped 判据上把 `(?:a\s+|an\s+)?` 也去掉，看 not 是否被 `not` 三字母
// 吃掉某个词表项 —— 不可能。真正原因需直接看 `a\s+` 前的 not：
// dropped 后 `is\s+` 直接接 `(?:a\s+|an\s+)?`，而句子是 `is not a fool`，
// `not` 无法被 a/ 吃掉，于是整段 fail。
// 结论：前瞻 is\s+ 之后，**删掉前瞻反而让 not 卡死匹配**（前瞻是白名单式
// 拒绝：not 开头的后缀直接拒绝匹配，但删掉后 not 仍然不匹配任何分支）。
// 即前瞻的实际语义是「not 出现时禁止命中」，但因为 not 本来就不能被
// 后续分支吃掉，前瞻是**语义冗余但无害**的结构。
// 验证：把前瞻改成 `(?:not\s+)?`（显式允许跳过 not），看 NEG 是否开始命中——
// 若命中则证明前瞻确实是唯一防线。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const IDX = 4919;
const line = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8').split('\n')[IDX];
const m = line.match(/\/((?:[^\/\\]|\\.)+)\/([gimsuy]*)/);
const body = m[1];

const VARIANTS = {
  baseline: body,
  allow_skip: body.replace("(?!not\\b|n't\\b)", '(?:not\\s+|is\\s+not\\s+)?'),
  allow_not: body.replace("(?!not\\b|n't\\b)", '(?:not\\s+)?'),
};
const S = [
  'every user is not a fool.',
  'every user is a fool.',
  "every user isn't a fool.",
];
for (const [k, b] of Object.entries(VARIANTS)) {
  let out;
  try { const re = new RegExp(b, 'i'); out = S.map(s => re.test(s)); }
  catch (e) { out = 'ERR ' + e.message.slice(0, 50); }
  console.log(k.padEnd(10) + ' ' + JSON.stringify(out));
}
