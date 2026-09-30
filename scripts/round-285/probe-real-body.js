// 探针：probe-seg 显示 bare_words 连 pos_full 都不命中，说明我的简写正则
// 与真实判据有偏差（真实判据群体表/词表更长）。改用**真实判据行**做变异，
// 逐一测试每个候选结构的必要性。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const IDX = 4919;
const IDXP = path.join(ROOT, 'src', 'index.js');
const line = fs.readFileSync(IDXP, 'utf8').split('\n')[IDX];
const m = line.match(/\/((?:[^\/\\]|\\.)+)\/([gimsuy]*)/);
const body = m[1];

const NEG = [
  'Every user is not responsible for downtime.',
  "Every user isn't a fool.",
  'Each user is not a criminal.',
];
const POS = [
  'Every user is a fool.',
  'Every single user is a liar.',
  'Each customer is an idiot.',
];
// 构造一个删了前瞻就**应该**命中的句子：表语在词表里、且 not 紧跟 is
const NEAR = [
  'Every user is not a fool.',
  'Every user is not a liar.',
  'Every user is not an idiot.',
];

function compile(b) { return new RegExp(b, 'i'); }
function trial(name, transform) {
  let re;
  try { re = compile(transform(body)); } catch (e) { console.log(name + ' ERR ' + e.message.slice(0, 60)); return; }
  const neg = NEG.map(s => re.test(s));
  const pos = POS.map(s => re.test(s));
  const near = NEAR.map(s => re.test(s));
  console.log(name.padEnd(12), 'neg=' + JSON.stringify(neg), 'near=' + JSON.stringify(near), 'pos=' + JSON.stringify(pos));
}

trial('baseline', s => s);
trial('drop_neg', s => s.replace("(?!not\\b|n't\\b)", ''));
trial('drop_a', s => s.replace("(?:a\\s+|an\\s+)?", ''));
