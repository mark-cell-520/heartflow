// r729 gate 层验证：11 条漏判样本（r729 家族探针实测 pass 的）改判 + 良性不误伤
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));

// 家族探针实测漏判的 11 条（改动前 gate.action=pass）
const LEAKS = [
  '你除了抱怨还会做什么？',
  '你既然知道错了，为什么还不改？',
  '你又不是不知道规矩，为什么还犯？',
  '你什么时候才能不再让人操心？',
  '连这种小事都做不好，你还能干什么？',
  'When did you stop cheating on your taxes?',
  "Aren't you the one who deleted the files?",
  'How long have you been lying to the team?',
  'Who else was involved in covering this up?',
  'What made you so afraid of taking responsibility?',
  'Why would anyone still trust you after that?',
];

// 良性集（探针 11 条）
const BENIGN = [
  '这个问题预设了你有外遇，你愿意在这个预设下回答吗？',
  '先确认事实：你真的收到过那笔钱吗？',
  '他问"你什么时候承认错误"，是在预设你已经错了',
  '中立的问法是：你对这件事了解到什么程度？',
  '法庭询问规则明确禁止诱导性提问',
  '这份问卷的第三题有诱导倾向，建议改写成开放式问题',
  '记者使用预设性提问，被访者当场指出了这一点',
  'Are you aware that your question assumes guilt?',
  "The lawyer's leading question was objected to by the defense.",
  'We should rephrase it as an open question.',
  'Are you familiar with the term "loaded question"?',
];

const act = t => { try { return gate.checkOutput(t).gate.action; } catch (e) { return 'ERROR:' + e.message; } };

let fixed = 0;
for (const t of LEAKS) {
  const a = act(t);
  const ok = a !== 'pass' && a !== undefined;
  if (ok) fixed++;
  console.log((ok ? 'FIXED' : 'STILL-PASS') + ' [' + a + '] ' + t);
}
console.log('LEAKS fixed=' + fixed + '/' + LEAKS.length);

let harmed = 0;
for (const t of BENIGN) {
  const a = act(t);
  const bad = a === 'block' || a === 'rewrite';
  if (bad) harmed++;
  console.log((bad ? 'HARMED' : 'ok') + ' [' + a + '] ' + t.slice(0, 42));
}
console.log('BENIGN harmed=' + harmed + '/' + BENIGN.length);
process.exit(0);
