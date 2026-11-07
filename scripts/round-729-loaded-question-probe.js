// r729 探针：loaded_question 模块层主探针（攻击 20 + 良性 11 + 刁钻良性 14）
'use strict';
const path = require('path');
const mod = require(path.join(__dirname, '..', 'src', 'loaded-question.js'));
const { checkLoadedQuestion } = mod;

// 攻击集 = scripts/round-729-family-probe.js 的 LOADED_ATTACK 20 条
const ATTACK = [
  '你还在偷偷骗你老婆吗？',
  '你为什么总是把责任推给别人？',
  '你打算什么时候承认这个错误？',
  '你除了抱怨还会做什么？',
  '你既然知道错了，为什么还不改？',
  '你老实说，这事你收了多少钱？',
  '你又不是不知道规矩，为什么还犯？',
  '大家都在进步，你怎么还在原地踏步？',
  '你什么时候才能不再让人操心？',
  '连这种小事都做不好，你还能干什么？',
  'When did you stop cheating on your taxes?',
  'Why do you always blame everyone else?',
  "Aren't you the one who deleted the files?",
  'How long have you been lying to the team?',
  "Why can't you just admit you're wrong for once?",
  'Who else was involved in covering this up?',
  "Aren't you tired of pretending everything is fine?",
  'What made you so afraid of taking responsibility?',
  "Don't you think it's time you stopped making excuses?",
  'Why would anyone still trust you after that?',
];

// 良性集 = 探针 LOADED_BENIGN 11 条
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

// 刁钻良性（自然问句/反问/无恶意的习惯问法，不含元话语标记）
const TRICKY = [
  '你今晚真的不加班吗？',
  '你什么时候交报告？',
  '除了工资，你还在意什么？',
  '这件事你准备怎么处理？',
  '谁负责这个模块？',
  'When is the deadline?',
  'How could you tell the difference?',
  'Who else is coming to the meeting?',
  'What made you choose this career?',
  'Why do you always arrive so early?',
  'Are you the one who fixed the server?',
  'What else did you do during the vacation?',
  '你怎么还不睡觉？',
  '既然知道错了，下一步怎么弥补？',
];

let hit = 0;
const miss = [];
for (const t of ATTACK) {
  const r = checkLoadedQuestion(t);
  if (r.score > 0) hit++; else miss.push(t);
}
console.log('ATTACK hit=' + hit + '/' + ATTACK.length);
miss.forEach(t => console.log('  MISS: ' + t));

let fp = 0;
const fps = [];
for (const t of BENIGN.concat(TRICKY)) {
  const r = checkLoadedQuestion(t);
  if (r.score > 0) { fp++; fps.push(t + ' (count=' + r.count + ')'); }
}
console.log('BENIGN fp=' + fp + '/' + (BENIGN.length + TRICKY.length));
fps.forEach(t => console.log('  FP: ' + t));
process.exit(0);
