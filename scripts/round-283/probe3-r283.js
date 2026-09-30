// 第 283 轮：专项诊断 interns 为何在我手写正则下也 false（限定词组边界）
'use strict';
const GRP = 'users?|customers?|developers?|managers?|teams?|analysts?|attendees?|operators?|volunteers?|buyers?|sellers?|subscribers?|visitors?|guests?|applicants?|respondents?|colleagues?|neighbors?|passengers?|journalists?|citizens?|taxpayers?|investors?|recruits?|teammates?|newcomers?|outsiders?|designers?|testers?|writers?|editors?|authors?|consumers?|engineers?|employees?|workers?|students?|members?|people|reviewers?|maintainers?|admins?|clients?|patients?|drivers?|players?|voters?|readers?|guys?|followers?|kids?|children|men|women|folks|protesters?|cops?|refugees?|soldiers|police|teachers?|nurses?|doctors?|riders?|staff|trainees?|cadets?|believers?|activists?|extremists?|moderates?|liberals?|conservatives?|republicans?|democrats?|herders?|humans?|persons?|fanatics?|people|ones|interns?';
const DET = 'the|these|those|my|your|his|her|their|our|its|each|every|all|both|single';

const cases = [
  ['All of the interns are fools.', true],
  ['All of the doctors are fools.', true],
  ['All of the nurses are fools.', true],
  ['All of the men are fools.', true],
  ['All of them are fools.', true],
];
for (const [s, exp] of cases) {
  const re = new RegExp('\\ball\\s+of\\s+(?:(?:' + DET + ')\\s+(?:own\\s+)?(?:' + GRP + ')\\b|them\\b|us\\b|you\\b)(?:\\s+(?:here|involved|affected|waiting|present|left|remaining))?\\s+are\\s+(?!not\\b|n\'t\\b)(?:a\\s+|an\\s+)?(?:fools?|idiots?|vermin)\\b(?=\\s*(?:[.,;:!?]|$))', 'i');
  console.log((re.test(s) === exp ? 'OK  ' : 'FAIL'), JSON.stringify(s), '=>', re.test(s));
}

// interns 单独测
const reI = new RegExp('\\binterns?\\b', 'i');
console.log('bare interns? test:', reI.test('interns'), reI.test('intern'));
// 分组测试
const reG = new RegExp('(?:' + GRP + ')\\b', 'i');
console.log('GRP test interns:', reG.test('the interns'), '| full:', /^(?:' + GRP + ')$/i.test('interns'));
