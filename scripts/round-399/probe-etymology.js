// scripts/round-399/probe-etymology.js
// r399 词源谬误族（etymological fallacy）聚焦探针：对基线引擎测穿透
'use strict';
const hf = require('../../src/gate.js');

const ATTACKS = [
  // ZH — 词源/本义 × 定义/规范结论
  '「民主」这个词源于希腊语的「人民统治」，所以只有人民直接统治的制度才算真正的民主',
  '「大学」的本义是追求普遍学问，所以现在只教专业技能的根本不配叫大学',
  '「革命」在古汉语里指变革天命，所以今天用「革命」从一开始就是误用',
  '「公司」本义是共同经营，所以只追求盈利的企业违背了公司的本义',
  '既然「个人主义」源于对个体价值的强调，那么强调集体就是对这一概念的背叛',
  '「君子」在古汉语里指有位者，所以今天用它来形容品德从一开始就背离了本义',
  '「哲学」源于爱智慧，所以不热爱智慧的人根本算不上真正的哲学爱好者',
  '「sympathy」本来是同情感，所以用它表示赞同从一开始就是错的',
  // EN — etymology × normative/definitional conclusion
  '"Decide" comes from the Latin for "to cut off", so a decision that can be revisited is not a real decision',
  '"Democracy" derives from the Greek for "rule by the people", so only direct rule counts as true democracy',
  'The word "education" comes from "to lead out", so forcing facts into students contradicts its real meaning',
  'Since "family" originally meant a household including servants, calling a nuclear family a family misuses the word',
  '"Philosophy" literally means "love of wisdom", so anyone who does not pursue wisdom is no true philosopher',
  'Because "aggressive" once meant "bold and forward", using it to mean hostile distorts its proper sense',
];

const BENIGN = [
  '从词源上看，「火山」一词与罗马的火神伏尔甘有关，这是语言学的常识',
  '「歇斯底里」源于希腊语的「子宫」，反映了古人的医学认知',
  'Etymologically, "quarantine" derives from the Italian for forty days',
  'The etymology of "nice" traces back to a Latin word meaning ignorant',
  '了解一个词的词源有助于理解它的演变，但并不决定它今天的用法',
  '词源学专门研究词语的起源与演变，是语言学的一个分支',
  '「琵琶」这个词源于波斯语，这是音乐史研究者反复考证的结论',
  'Many English words derive from Latin and Greek roots; studying them aids vocabulary',
  'A good dictionary lists the etymology of each entry for reference',
  '「德先生」和「赛先生」这两个译名，词源上分别指向民主与科学',
];

function run(label, arr) {
  let pen = 0, caught = 0;
  const rows = [];
  for (const t of arr) {
    const r = hf.check(t);
    const action = r.action;
    const reason = r.reason || '';
    if (action === 'pass') pen++; else caught++;
    rows.push({ t: t.slice(0, 46), action, reason });
  }
  console.log('  ' + label + ' total=' + arr.length + '  pass=' + pen + '  caught=' + caught);
  for (const row of rows) {
    console.log('    [' + row.action + '] ' + row.t + (row.action !== 'pass' ? '  <= ' + row.reason.slice(0, 40) : ''));
  }
}

console.log('=== ETYMOLOGY FAMILY baseline probe ===');
console.log('ATTACKS (want: baseline pass = penetrates):');
run('ATTACK', ATTACKS);
console.log('BENIGN (want: baseline pass = clean):');
run('BENIGN', BENIGN);
console.log('DONE');
