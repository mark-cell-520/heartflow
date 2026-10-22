'use strict';
// [r564] 二分诊断：确认 LEDGER_EN/CLAIM_EN 是「分支单跑可命中、组合跑不命中」，
// 还是「分支本身在源文件里就是坏的」。只打印模式与结果，不打印样本原文。
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const m = require(path.join(ROOT, 'src', 'favor-ledger.js'));
const I = m.__internals();

const raw = fs.readFileSync(path.join(__dirname, 'round-563-favor-probe.js'), 'utf8');
const seg = raw.split('const ATK = [')[1].split('];')[0];
const all = seg.split('\n').map(l => l.trim())
  .filter(l => l.startsWith("'") && l.endsWith(','))
  .map(l => l.slice(1, -2).replace(/\\'/g, "'"));
const EN = all.filter(s => !/[\u4e00-\u9fff]/.test(s));

console.log('— 源字符 HEX 检查（前 90 字符）—');
console.log(JSON.stringify(I.LEDGER_EN.source.slice(0, 90)));
console.log('反斜杠计数 LEDGER_EN:', (I.LEDGER_EN.source.match(/\\/g) || []).length);

const BRANCHES = [
  ['without', '\\bwithout\\s+(?:me|us)\\s+you\\s+(?:would\\s+be|are)\\s+(?:nothing|nowhere|worthless)\\b'],
  ['did for you', '\\b(?:i|we)\\s+(?:have\\s+)?(?:done|did)\\s+for\\s+you\\b'],
  ['covered', '\\b(?:i|we)\\s+(?:covered|stood\\s+up|fought|pulled\\s+strings|put\\s+in\\s+a\\s+word|vouched|went\\s+out\\s+on\\s+a\\s+limb)\\s+for\\s+you\\b'],
  ['gave chance', '\\b(?:i|we)\\s+(?:gave|offered|handed)\\s+you\\s+(?:your|this|the)\\s+(?:chance|opportunity|break|job|position|promotion|career)\\b'],
  ['bailed out', '\\bi\\s+(?:bailed|got|pulled)\\s+you\\s+(?:out|through)\\s+(?:of\\s+)?(?:that|it|trouble)\\b'],
  ['you would be', "\\byou\\s+(?:would\\s+be|wouldn't\\s+have\\s+been|would\\s+not\\s+have\\s+been)\\s+(?:nothing|nowhere)\\s+(?:without\\s+(?:me|us))\\b"],
  ['cannot refuse', "\\byou\\s+(?:cannot|can't|must|have\\s+to|should)\\s+(?:refuse|say\\s+no|decline|deny)\\s+(?:me|us|this)?\\b"],
  ['owe me', "\\byou\\s+(?:owe|owe\\s+me|owe\\s+us)\\s+(?:me|us|this|this\\s+one)\\b"],
  ['do as i say', '\\b(?:so\\s+)?(?:do|do\\s+as\\s+i\\s+say|listen\\s+to\\s+me|take\\s+my\\s+word)\\b'],
  ['small ask', "\\bthis\\s+is\\s+(?:a\\s+)?(?:small|tiny|little|trivial|simple)\\s+(?:ask|favor|thing|request)\\s+(?:you\\s+)?(?:cannot|can't|won't)"],
  ['considering', '\\bconsider(?:ing)?\\s+(?:what|everything)\\s+(?:i|we)\\s+(?:did|have\\s+done)\\b'],
  ['least you can do', '\\bso\\s+the\\s+least\\s+you\\s+can\\s+do\\b'],
];

for (const s of EN) {
  const hits = [];
  for (const [n, p] of BRANCHES) {
    if (new RegExp(p, 'i').test(s)) hits.push(n);
  }
  console.log(`单支=[${hits.join(',') || '-'}] 组合A1=${I.LEDGER_EN.test(s)} A2=${I.CLAIM_EN.test(s)} 全模块=${m.checkFavorLedger(s).hit}`);
}

// 拆开组合：把每支单独 new RegExp 后与组合对同一字符串比对
console.log('\n— 逐支 vs 组合（用组合自身 source 切不出，改为：手工支全 miss 时可确认组合坏）—');
const needle = 'helped you a lot back then';
console.log('组合 LEDGER_EN 是否含 "helped\\\\s" 字样:', I.LEDGER_EN.source.includes('helped'));
console.log('组合 LEDGER_EN 是否含 "so\\\\s+much" 字样:', I.LEDGER_EN.source.includes('so'));
console.log('组合源前 300 字符:', I.LEDGER_EN.source.slice(0, 300));
