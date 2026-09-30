// 第 283 轮：诊断 ② the interns 为何漏 + ⑪ everyone 为何漏（直接测正则）
'use strict';
const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname, '..', '..', 'src', 'index.js'), 'utf8');
// 抓 HASTY_GENERALIZATION_PATTERNS 数组段
const m = src.match(/HASTY_GENERALIZATION_PATTERNS\s*=\s*\{/);
console.log('patterns block found at', m ? m.index : 'NOT FOUND');

// 直接构造与 282 D 判据同形正则测试
const GRP = 'users?|customers?|developers?|managers?|teams?|analysts?|attendees?|operators?|volunteers?|buyers?|sellers?|subscribers?|visitors?|guests?|applicants?|respondents?|colleagues?|neighbors?|passengers?|journalists?|citizens?|taxpayers?|investors?|recruits?|teammates?|newcomers?|outsiders?|designers?|testers?|writers?|editors?|authors?|consumers?|engineers?|employees?|workers?|students?|members?|people|reviewers?|maintainers?|admins?|clients?|patients?|drivers?|players?|voters?|readers?|guys?|followers?|kids?|children|men|women|folks|protesters?|cops?|refugees?|soldiers|police|teachers?|nurses?|doctors?|riders?|staff|trainees?|cadets?|believers?|activists?|extremists?|moderates?|liberals?|conservatives?|republicans?|democrats?|herders?|humans?|persons?|fanatics?|people|ones';
const DET = 'the|these|those|my|your|his|her|their|our|its|each|every|all|both|single';
const ATTR = 'fools?|idiots?|liars?|losers?|thieves|thief|cowards?|parasites?|vermin|cattle|sheep|sheeple|clowns?|brutes?|criminals?|crooks|con\\s+artists?|savages?|cockroaches|stray\\s+dogs?|wild\\s+animals|rats|roaches|worthless|inferior|hopeless|pathetic|nobody|chaff';

// 282 D 判据原文重建
const reD = new RegExp('\\ball\\s+of\\s+(?:(?:' + DET + ')\\s+(?:own\\s+)?(?:' + GRP + ')\\b|them\\b|us\\b|you\\b)(?:\\s+(?:here|involved|affected|waiting|present|left|remaining))?\\s+are\\s+(?!not\\b|n\'t\\b)(?:a\\s+|an\\s+)?(?:' + ATTR + ')\\b(?=\\s*(?:[.,;:!?]|$))', 'i');
console.log('282-D regex test "All of the interns are fools." =>', reD.test('All of the interns are fools.'));

// 检查实际源码里的 D 判据（从行 4942 抓）
const lines = src.split('\n');
const line4942 = lines[4941];
console.log('\nline 4942 contains interns?', /interns\?/.test(line4942));
console.log('line 4942 contains DET group?', /(?:the\|these\|those\|my\|your\|his\|her\|their\|our\|its\|each\|every\|all\|both\|single)/.test(line4942));

// 直接 eval 该行的正则
const reArr = eval('[' + line4942.trim().replace(/,$/, '') + ']');
console.log('重构正则数:', reArr.length, 'type:', reArr[0] && reArr[0].source.slice(0, 40));
console.log('重构正则 test "All of the interns are fools." =>', reArr[0].test('All of the interns are fools.'));
console.log('重构正则 test "All of the doctors are fools." =>', reArr[0].test('All of the doctors are fools.'));

// 281 判据（行 4920）测 everyone
const re281 = eval('[' + lines[4919].trim().replace(/,$/, '') + ']');
console.log('\n281 regex test "Everyone is a fool." =>', re281[0].test('Everyone is a fool.'));
console.log('281 source head:', re281[0].source.slice(0, 120));

// 282 C 判据（行 4941）测 Each single one of users
const reC = eval('[' + lines[4940].trim().replace(/,$/, '') + ']');
console.log('\n282-C test "Each single one of users is a fool." =>', reC[0].test('Each single one of users is a fool.'));
console.log('282-C source head:', reC[0].source.slice(0, 200));
