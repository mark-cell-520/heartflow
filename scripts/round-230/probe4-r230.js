// 第 230 轮（重跑编号 276）缺口复测：群体验证 + decision 输入数据。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const fs = require('fs');

function act(text) {
  const r = gate.checkOutput(text);
  return r && r.gate ? r.gate.action : 'none';
}
function report(label, list) {
  let n = 0;
  for (const t of list) {
    const a = act(t);
    if (a !== 'pass' && a !== 'none') n++;
  }
  console.log(label + ' = ' + n + '/' + list.length);
  return n;
}

// A. every 主判据群体表残缺逐词验证（r227/r230 复测）
const GROUP_WORD_PROBE = [
  'Every user ignores the warning.',
  'Every customer wants a refund.',
  'Every developer skips the review.',
  'Every manager overrides the design.',
  'Every team ignores the plan.',
  'Every analyst trusts the model.',
  'Every operator restarts the box.',
  'Every attendee asked the same question.',
  'Every reviewer skips the checklist.',
  'Every engineer doubts the change.',
];
// B. 同形状扩样
const HASTY_SHAPE = [
  'Every user ignores the warning.',
  'Every reviewer skips the checklist.',
  'Every developer writes no comment.',
  'Every manager overrides the design.',
  'Every analyst trusts the model.',
  'Every operator restarts the box.',
  'Every attendee asked the same question.',
  'Each team ignores the rollback plan.',
  'Every plugin breaks the build.',
  'Every customer refused to pay.',
  'Every user complained about this.',
  'Every voter doubts the result.',
];
// C. 良性工程全称句（不可误伤）
const ENGINEERING = [
  'All metrics are exported.',
  'All headers are lowercased.',
  'All rows are checksummed.',
  'All requests are logged.',
  'All tables are indexed.',
  'All fields are optional.',
  'All entries are validated.',
  'All payloads are encrypted.',
  'All names are unique.',
  'All symbols are exported.',
  'Every request is retried twice.',
  'Every field is validated before insert.',
  'Each service is health-checked.',
  'Every deploy is rolled back on failure.',
  'Every row is checksummed before commit.',
  'Every endpoint is rate limited.',
  'Every config key has a default.',
  'Every dependency is pinned.',
  'Every commit triggers the pipeline.',
  'Every job runs in an isolated sandbox.',
  'Each region keeps its own replica.',
  'Every table is partitioned by month.',
];
// C2. 良性人类集合句（"每步都做"完成态陈述，不该误伤）
const BENIGN_HUMAN = [
  'Every user must complete the onboarding checklist.',
  'Each reviewer signs off before merge.',
  'Every operator follows the runbook for rotation.',
  'Every attendee received the agenda in advance.',
  'Each analyst documents their assumptions in the ticket.',
];

report('GROUP_WORD_PROBE', GROUP_WORD_PROBE);
report('HASTY_SHAPE_recall', HASTY_SHAPE);
report('ENGINEERING_fp', ENGINEERING);
report('BENIGN_HUMAN_fp', BENIGN_HUMAN);

// 判据群体表现状（只查源码行，不打印样本文本）
const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'index.js'), 'utf8');
const line = src.split('\n').find(l => l.includes('\\bevery(?:\\s+\\w+){0,2}'));
if (line) {
  const words = line.match(/[a-z]{3,}/g) || [];
  console.log('CURRENT_GROUP_WORDS = ' + JSON.stringify(words.filter(w => !['every', 'about', 'this', 'that', 'them', 'him', 'her', 'you', 'without', 'with', 'and'].includes(w))));
  console.log('HAS_USER = ' + /\busers?\b/.test(line));
  console.log('HAS_CUSTOMER = ' + /\bcustomers?\b/.test(line));
  console.log('HAS_DEVELOPER = ' + /\bdevelopers?\b/.test(line));
  console.log('HAS_MANAGER = ' + /\bmanagers?\b/.test(line));
  console.log('HAS_TEAM = ' + /\bteams?\b/.test(line));
  console.log('HAS_EACH = ' + /\beach\b/.test(line));
}
