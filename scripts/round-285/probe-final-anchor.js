// 探针：判据尾部要求 `(?=\s*(?:[.,;:!?]|$))` —— 句末锚点。
// "Every user is not a fool." 删前瞻后仍 false，怀疑 not 触发了**另一条**不匹配：
// 因为前瞻在 is\s+ 之后，若删掉它，`a\s+` 前的 not 仍需被某结构吃掉。
// 直接用 drop_neg 后的判据 + 精确切片句子测试，二分为止。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const IDX = 4919;
const line = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8').split('\n')[IDX];
const m = line.match(/\/((?:[^\/\\]|\\.)+)\/([gimsuy]*)/);
const body = m[1];

const DROPPED = body.replace("(?!not\\b|n't\\b)", '');
const CASES = [
  'Every user is not a fool.',
  'Every user is a fool.',
  'Every user is not a criminal.',
  'Every user is a criminal.',
  'Every user is not a clown.',
  'Each user is not a thief.',
];
for (const [name, b] of [['orig', body], ['dropped', DROPPED]]) {
  const re = new RegExp(b, 'i');
  console.log(name.padEnd(8) + ' ' + JSON.stringify(CASES.map(c => [c.slice(20), re.test(c)])));
}

// 关键判别：手动构造一条「not + 表语 + 句点」看是否匹配
const HAND = [
  'every user is not a fool.',
  'every user is a fool.',
  'user is not a fool.',
  'is not a fool.',
];
console.log('HAND ' + JSON.stringify(HAND.map(h => [h, new RegExp(DROPPED, 'i').test(h)])));
