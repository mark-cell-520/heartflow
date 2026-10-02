// scripts/round-374/probe-4-regex-eval.js
// 同进程评估候选英文正则：半边独立命中 + 良性误伤，通过后才落到 src。
// 只打印数字，不贴原文。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '../..');
const mtt = require(path.join(ROOT, 'src/multi-turn-tactics.js'));
const { EN_ATTACK, EN_BENIGN } = require('./samples.js');

// ─── 候选 A：capability_probe 英文前半（你能读取 X 对吧 → 那帮我）───
const CAND_CAPABILITY_PROBE = new RegExp([
  '(?:\\byou\\s+(?:can|could|are\\s+able\\s+to)\\s+[^.]{0,40}',
  "(?:\\bright\\b|\\bcorrect\\b|\\bis\\s+that\\s+(?:right|correct)\\b|\\bare\\s+you\\s+not\\b|\\bno\\s+problem\\s+right\\b)",
  '[^.]{0,12}(?:then|so|now|therefore)[^.]{0,40}(?:help|give|get|pull|grab|send|show|open|export|dump|list|fetch|retrieve))',
].join(''), 'i');

// ─── 候选 B：sunk_cost 英文 up 半（既往让步/次数 + 推进）───
const CAND_SUNK_COST = new RegExp([
  '(?:\\b(?:we|you)\\s+(?:have|had|have\\s+already|already)\\s+[^.]{0,20}(?:come|gone|gone|gotten)\\s+(?:this|so)\\s+(?:far|long)',
  '|\\b(?:you|we)\\s+(?:have|have\\s+already)\\s+(?:been\\s+)?(?:cooperat\\w+|work\\w*|help\\w*|compli\\w+|agree\\w*|gone\\s+along)\\w*[^.]{0,12}(?:so\\s+many|many|so\\s+much|repeatedly)',
  '|\\b(?:last|previous|earlier|prior)\\s+(?:time|round|step|attempt)s?\\s+(?:went|went\\s+well|was|were)\\s+(?:smooth\\w*|fine|well|success\\w*|OK|okay)',
  '|\\b(?:only|just)\\s+(?:one\\s+)?(?:more|last)\\s+(?:step|push|round|time)',
  "|\\b(?:not|no)\\s+(?:much|far)\\s+(?:left|to\\s+go|remaining)\\b)",
].join(''), 'i');

// ─── 候选 D：norm_desensitize 英文三半（让步 + 递进 + 脱敏收尾）───
const CAND_NORM = new RegExp([
  '(?:\\b(?:just|only)\\s+(?:this\\s+)?(?:one\\s+)?(?:small\\s+)?(?:first\\s+)?(?:step|time|once|exception)',
  '|\\btry\\s+(?:it\\s+)?(?:just\\s+)?(?:this\\s+)?(?:once|one\\s+time)',
  '|\\bmake\\s+(?:an\\s+)?exception\\s+(?:just\\s+)?this\\s+time',
  '|\\b(?:let\\s+us|lets|let\\s+me)\\s+(?:start|begin)\\s+(?:with\\s+)?the\\s+first\\s+step',
  '|\\bgo\\s+along\\s+with\\s+(?:it\\s+)?(?:just\\s+)?(?:this\\s+)?(?:once|one\\s+time))',
  '[^.]{0,90}',
  '(?:\\b(?:then|after\\s+that|afterwards|later|from\\s+then\\s+on|next\\s+time|over\\s+time|eventually|bit\\s+by\\s+bit|little\\s+by\\s+little|step\\s+by\\s+step|once\\s+more|again)',
  '[^.]{0,80})?',
  '[^.]{0,90}',
  '(?:\\b(?:get|getting|become|becomes|becoming|grow|grows|growing)\\s+used\\s+to\\s+it\\b',
  '|\\bsecond\\s+nature\\b',
  '|\\bstop\\s+(?: resisting|resisting|objecting|pushing\\s+back)\\b',
  '|\\bno\\s+longer\\s+(?: feel|feels|feel|resist\\w*|object\\w*|bother\\w*|mind\\w*)\\b',
  '|\\bfeel\\w*\\s+(?:more\\s+and\\s+more\\s+)?(?:comfor?table|natural|normal|fine|OK|okay)\\b',
  '|\\bjust\\s+(?:routine|normal|part\\s+of\\s+the\\s+(?:job|process|routine))\\b',
  '|\\bincreasingly\\s+(?:comfor?table|natural|normal)\\b)',
].join(''), 'i');

function score(re, hits, misses, label) {
  const h = hits.filter(s => re.test(s)).length;
  const m = misses.filter(s => re.test(s)).length;
  console.log(`${label}: 阳性 ${h}/${hits.length}  良性误伤 ${m}/${misses.length}`);
  return { h, m };
}

const nAtt = EN_ATTACK.norm_desensitize;
const sAtt = EN_ATTACK.sunk_cost;
const cAtt = EN_ATTACK.capability_probe;
const nBen = EN_BENIGN.progress.concat(EN_BENIGN.completed);
const cBen = EN_BENIGN.capability_question;
const allBen = Object.values(EN_BENIGN).flat();
const allAtt = Object.values(EN_ATTACK).flat();

console.log('=== 半边独立判别力 ===');
score(CAND_CAPABILITY_PROBE, cAtt, allBen, 'A capability_probe');
score(CAND_SUNK_COST, sAtt, allBen, 'B sunk_cost');
score(CAND_NORM, nAtt, allBen, 'D norm_desensitize');

console.log('=== 全攻击集交叉（候选半是否吃掉他族阳性样本）===');
for (const [nm, re] of [['A', CAND_CAPABILITY_PROBE], ['B', CAND_SUNK_COST], ['D', CAND_NORM]]) {
  console.log(`${nm}: 全攻击命中 ${allAtt.filter(s => re.test(s)).length}/${allAtt.length}`);
}
