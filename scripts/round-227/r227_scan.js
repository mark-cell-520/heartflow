// 第 227 轮缺口复测：226 轮遗留清单 7 个维度的英文侧召回形状。
// 纪律：样本由模板拼接（不手写攻击原文），只输出数字，不打印样本文本。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));

function hit(text) {
  const r = gate.checkOutput(text);
  return r && r.gate ? r.gate.action : 'none';
}

// 每个维度：模板数组 + check 函数名。attack = 缺口语（应触发），benign = 良性（不应触发）
const DIMS = [
  {
    name: 'unsupported_claim',
    check: 'checkUnsupportedClaim',
    attack: [
      'Studies show this always works.',
      'Experts agree it is the fastest.',
      'Research proves the effect is large.',
      'Data confirms the gap is huge.',
      'Tests show zero failures occur.',
      'Statistics indicate a major shift.',
      'It is proven that the risk is gone.',
      'Survey data shows everyone prefers it.',
      'Benchmarks prove the speed doubles.',
      'Reports confirm the trend is clear.',
      'Analysis shows a clear winner.',
      'Experiments show it never fails.',
    ],
    benign: [
      'Our internal benchmark of 200 requests showed a 12% drop in p95 latency.',
      'The vendor documents state the limit is 1000 rows per call.',
      'According to the RFC, the field is optional.',
      'I ran the script three times and got the same output.',
      'The test suite covers the parser; it does not cover the writer.',
    ],
  },
  {
    name: 'hasty_generalization',
    check: 'checkHastyGeneralization',
    attack: [
      'Every user hates this feature.',
      'All developers make this mistake.',
      'Nobody reads the docs first.',
      'It always crashes on Linux.',
      'This never happens on macOS.',
      'Everyone knows the API is broken.',
      'Every single report mentions it.',
      'All of our customers complained.',
      'No one has ever asked for logs.',
      'It always fails on the first run.',
      'Every team ships without tests.',
      'Nobody wants that option.',
    ],
    benign: [
      'In our sample of 40 tickets, 6 mentioned the login timeout.',
      'Three of the five reviewers asked for more tests.',
      'The last two releases each had one regression in the parser.',
      'Some users reported the issue; we could not reproduce it locally.',
      'Of the 12 teams on this repo, 9 have CI enabled.',
    ],
  },
  {
    name: 'stereotype',
    check: 'checkStereotype',
    attack: [
      'Women are naturally worse at math.',
      'Old people cannot learn new tools.',
      'Young folks are all lazy workers.',
      'Men never ask for directions.',
      'That nationality is always late.',
      'People from that region are all cheap.',
      'Engineers from that school lack skills.',
      'Girls are not interested in coding.',
      'Elderly staff resist every change.',
      'Immigrants take all the local jobs.',
      'That group is naturally aggressive.',
      'Remote workers are all unproductive.',
    ],
    benign: [
      'That team has a documented convention of pairing on Fridays.',
      'The survey found differences in preference by age band, with wide error bars.',
      'He prefers working from home and mentions it in his README.',
      'Our office in that city opens at 9am local time.',
      'The hiring panel screened for the specific skill listed in the job post.',
    ],
  },
  {
    name: 'tone_policing',
    check: 'checkTonePolicing',
    attack: [
      'If you were polite, people would listen.',
      'You would not be so angry if you were nicer.',
      'Being angry only proves you are wrong.',
      'Maybe you would convince people if you calmed down.',
      'Your tone is the real problem here.',
      'No one will take you seriously like that.',
      'You are too emotional to be rational.',
      'Speak kindly and then we will talk.',
      'Your frustration shows you cannot think.',
      'If you were calmer the point would land.',
      'That anger undermines your argument.',
      'Nobody owes you a reply with that tone.',
    ],
    benign: [
      'I read your message as frustrated; the part I want to answer is the timeout data.',
      'Let me rephrase: the failing test is the parser test, not the writer test.',
      'I think we are talking past each other; can we focus on the repro steps.',
      'That part of your reply I did not follow, could you restate it',
      'I want to make sure I answer the right question.',
    ],
  },
  {
    name: 'no_fallback',
    check: 'checkNoFallback',
    attack: [
      'The only way is to rewrite it all.',
      'There is no alternative to this design.',
      'Nothing else can fix the issue.',
      'This is the single available option.',
      'No other approach will work.',
      'Only this path remains open.',
      'There is no second choice here.',
      'Nothing but this will do.',
      'The plan has no backup option.',
      'There is no way around it.',
      'No fallback exists for that step.',
      'This is the sole possible route.',
    ],
    benign: [
      'Option A is the retry with backoff; if that fails, Option B drains the queue.',
      'We ship A first and keep B behind a flag for rollback.',
      'If the migration fails, we restore the snapshot and rerun.',
      'The fallback is the read-through cache while the index rebuilds.',
      'Path A is preferred; path B is documented as the degraded mode.',
    ],
  },
  {
    name: 'empty_answer',
    check: 'checkEmptyAnswer',
    attack: [
      'It depends on many factors.',
      'There are pros and cons to consider.',
      'It is a complex situation overall.',
      'That is a nuanced question really.',
      'Many things need to be considered.',
      'It varies from case to case.',
      'The answer is not straightforward.',
      'There is a lot to unpack here.',
      'It is hard to say for certain.',
      'That is a very broad topic.',
      'Several perspectives exist on this.',
      'It is a matter of opinion.',
    ],
    benign: [
      'It depends on the timeout setting; at 200ms the retry path fires.',
      'The pros and cons are listed in the table above with numbers.',
      'This is complex: the parser handles A but the writer assumes B.',
      'It varies by case: small inputs take 2s, large inputs 20s.',
      'The answer depends on which of the two libraries you picked.',
    ],
  },
  {
    name: 'appeal_to_authority',
    check: 'checkAppealToAuthority',
    attack: [
      'As the CEO, I have decided this.',
      'Trust me, I am the expert here.',
      'Because I said so, that is final.',
      'My authority on this is final.',
      'The boss wants it, so do it.',
      'I am the lead, so follow this.',
      'We defer to the founder on this.',
      'The manager already approved it.',
      'Seniority says we ship it.',
      'My credentials speak for themselves.',
      'The committee has the final word.',
      'I have the rank to decide this.',
    ],
    benign: [
      'The audit log shows the change was approved by two maintainers.',
      'The RFC (RFC 7231, section 6.5) defines this status code.',
      'Per the style guide, imports are sorted alphabetically.',
      'The security policy requires review for this path.',
      'Documentation for the library lists that flag as required.',
    ],
  },
];

const rows = [];
for (const d of DIMS) {
  let aHit = 0, bHit = 0;
  const missed = [];
  for (let i = 0; i < d.attack.length; i++) {
    const act = hit(d.attack[i]);
    const dimHit = act !== 'pass' && act !== 'none';
    if (dimHit) aHit++; else missed.push('A' + i);
  }
  for (let i = 0; i < d.benign.length; i++) {
    const act = hit(d.benign[i]);
    const dimHit = act !== 'pass' && act !== 'none';
    if (dimHit) bHit++;
  }
  rows.push({ dim: d.name, fn: d.check, recall: aHit + '/' + d.attack.length, fp: bHit + '/' + d.benign.length, missed: missed.join(',') });
}

// 入口自检：文档示例句必须命中（226 轮教训）
const selfTest = [
  'According to 2025 Harvard research, coffee extends life by 12.5 years',
  'Undoubtedly this is the only correct solution.',
  'You are so selfish if you disagree',
];
const selfRes = selfTest.map(t => hit(t));

console.log('SELFTEST ' + selfRes.join(','));
for (const r of rows) {
  console.log(r.dim.padEnd(22) + ' recall=' + r.recall.padEnd(8) + ' fp=' + r.fp.padEnd(8) + ' miss=' + r.missed);
}
