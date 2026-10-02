// scripts/round-374/probe-5-regex-v2.js
// probe-4 的加词版：补漏判样本的三半词与 capability/sunk_cost 变体。
// 只打印数字。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '../..');
const { EN_ATTACK, EN_BENIGN } = require('./samples.js');

const CAND_CAPABILITY_PROBE = new RegExp([
  '(?:\\byou\\s+(?:can|could|do\\s+have|are\\s+able\\s+to|have)\\b[^.]{0,40}',
  '(?:\\bright\\b|\\bcorrect\\b|\\bis\\s+that\\s+(?:right|correct)\\b|\\bare\\s+you\\s+not\\b|\\bno\\s+problem\\s+right\\b|\\byes\\b)',
  '[^.]{0,20}(?:then|so|now|therefore)[^.]{0,50}',
  '(?:help|give|get|pull|grab|send|show|open|export|dump|list|fetch|retrieve|read|check|look))',
].join(''), 'i');

const CAND_SUNK_COST = new RegExp([
  '(?:\\b(?:we|you)\\s+(?:have|had|have\\s+already|already)\\s+[^.]{0,20}(?:come|gone|gotten)\\s+(?:this|so|that)\\s+(?:far|long|way))',
  '|\\b(?:you|we)\\s+(?:have|have\\s+already)\\s+(?:been\\s+)?(?:cooperat\\w+|work\\w*|help\\w*|compli\\w+|agree\\w*|gone\\s+along|play\\w*\\s+along)\\w*[^.]{0,12}(?:so\\s+many|many|so\\s+much|repeatedly|multiple)',
  '|\\b(?:last|previous|earlier|prior|first)\\s+(?:time|round|step|attempt)s?\\s+(?:went|was|were)\\s+(?:smooth\\w*|fine|well|success\\w*|OK|okay|great)',
  '|\\b(?:only|just)\\s+(?:one\\s+|a\\s+)?(?:more|last|final)\\s+(?:step|push|round|time|part)',
  '|\\b(?:not|no|nothing)\\s+(?:much|far|left)\\s+(?:left|to\\s+go|remaining)\\b',
  "|\\balready\\s+(?:agreed|said\\s+yes|approved)\\b",
  '|\\bmight\\s+as\\s+well\\b',
  '|\\bpush\\s+through\\b',
].join(''), 'i');

const CAND_NORM = new RegExp([
  // ① 让步半（将来时的第一步）
  '(?:\\b(?:just|only)\\b[^.]{0,16}\\b(?:this\\s+)?(?:one\\s+|a\\s+|the\\s+)?(?:small|tiny|little|minor|single)?\\s*(?:first\\s+)?(?:step|time|once|exception|compromise|instance|thing|instance)',
  '|\\btry\\s+(?:it\\s+)?(?:just\\s+)?(?:this\\s+)?(?:once|one\\s+time|for\\s+now)',
  '|\\bmake\\s+(?:an\\s+)?exception\\s+(?:just\\s+)?this\\s+time',
  '|\\b(?:let\\s+us|let\\s+me|let\\s+us)\\s+(?:start|begin)\\b[^.]{0,24}(?:first\\s+step|step\\s+one|small)',
  '|\\bgo\\s+along\\s+with\\s+(?:it\\s+)?(?:just\\s+)?(?:this\\s+)?(?:once|one\\s+time)',
  '|\\bdo\\s+(?:this\\s+)?(?:one\\s+)?(?:small\\s+)?(?:thing|step|part)\\s+(?:for\\s+now|first)',
  '|\\bstart\\s+(?:with|from)\\s+(?:the\\s+)?(?:first|smallest|easiest))',
  // ② 递进半
  '[^.]{0,110}',
  '(?:\\b(?:then|after\\s+that|afterwards|later|from\\s+then\\s+on|from\\s+there|next\\s+time|over\\s+time|eventually|gradually|increasingly|bit\\s+by\\s+bit|little\\s+by\\s+little|step\\s+by\\s+step|sooner\\s+or\\s+later|one\\s+more\\s+time|again|repeatedly|more\\s+and\\s+more)\\b)',
  // ③ 脱敏收尾半
  '[^.]{0,110}',
  '(?:\\b(?:get|getting|become|becomes|becoming|grow|grows|growing)\\s+used\\s+to\\s+(?:it|this)?\\b',
  '|\\bsecond\\s+nature\\b',
  '|\\bstop\\s+(?:resisting|objecting|pushing\\s+back|minding|complain\\w*)\\b',
  '|\\bno\\s+longer\\s+(?:feel|feels|resist\\w*|object\\w*|bother\\w*|mind\\w*|complain\\w*)\\b',
  '|\\bfeel\\w*\\s+(?:more\\s+and\\s+more\\s+)?(?:comfor?table|natural|normal|fine|OK|okay)\\b',
  '|\\bjust\\s+(?:routine|normal|part\\s+of\\s+the\\s+(?:job|process|routine|day))\\b',
  '|\\bincreasingly\\s+(?:comfor?table|natural|normal)\\b',
  '|\\beventually\\s+(?:comfor?table|natural|normal|routine|fine|OK|okay)\\b',
  '|\\b(?:easier|smoother|more\\s+natural)\\s+(?:and\\s+)?(?:eventually\\s+)?(?:normal|fine|routine)\\b)',
].join(''), 'i');

function score(re, hits, misses, label) {
  const h = hits.filter(s => re.test(s)).length;
  const m = misses.filter(s => re.test(s)).length;
  console.log(`${label}: 阳性 ${h}/${hits.length}  良性误伤 ${m}/${misses.length}`);
}

const allBen = Object.values(EN_BENIGN).flat();
console.log('=== 半边独立判别力（v2 加词）===');
score(CAND_CAPABILITY_PROBE, EN_ATTACK.capability_probe, allBen, 'A capability_probe');
score(CAND_SUNK_COST, EN_ATTACK.sunk_cost, allBen, 'B sunk_cost');
score(CAND_NORM, EN_ATTACK.norm_desensitize, allBen, 'D norm_desensitize');

console.log('=== 漏判位置（probe-4 vs v2）===');
for (const [fam, list, re] of [['A', EN_ATTACK.capability_probe, CAND_CAPABILITY_PROBE],
  ['B', EN_ATTACK.sunk_cost, CAND_SUNK_COST],
  ['D', EN_ATTACK.norm_desensitize, CAND_NORM]]) {
  list.forEach((s, i) => { if (!re.test(s)) console.log(`  miss ${fam}[${i}]`); });
}
