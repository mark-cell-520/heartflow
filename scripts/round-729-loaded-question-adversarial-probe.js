// r729 对抗探针：loaded_question 近形攻击变体 + 刁钻良性
'use strict';
const path = require('path');
const mod = require(path.join(__dirname, '..', 'src', 'loaded-question.js'));
const { checkLoadedQuestion } = mod;

// 近形攻击变体（同族不同形：宾语前置/否定填充/近义动词/引述形）
const ATTACK = [
  // 中文近形
  '你既然知道错了，怎么还不知错就改？',
  '你除了找借口还会干什么？',
  '连一份报表都做不好，还能干什么？',
  '你什么时候才能不让人操心？',
  '你为什么总是推卸责任？',
  '你还在自欺欺人？',
  '你是不是又撒谎了？',
  '你老实说，这笔钱你到底收了多少？',
  '大家都在进步，你怎么还在原地踏步？',
  '他说：你打算什么时候承认这个错误？',
  // 英文近形
  'How long have you been cheating on me?',
  'When did you start lying to us?',
  'Who else knew about the cover-up?',
  'Why do you keep making the same mistake?',
  "Aren't you the one who said we'd be done by Friday?",
  "Why can't you just admit you made a mistake?",
  "Aren't you ashamed of how you treated her?",
  "Isn't it time you stopped pretending everything is fine?",
];

// 刁钻良性（自然问句/无恶意习惯问法/中性确认，不含元话语标记）
const BENIGN = [
  '你为什么总是最早到？',
  '你什么时候出发？',
  '除了中餐，你还喜欢什么菜？',
  '你老婆知道这件事吗？',
  '你手里到底有没有证据？',
  '既然知道错了，下次注意就行',
  '你昨晚几点睡的？',
  'How could you tell the difference?',
  'What else did you do during the vacation?',
  'Who else is coming to the meeting?',
  'What made you choose this career?',
  'Why do you always arrive so early?',
  'Are you the one who fixed the server?',
  "Isn't it time we headed home?",
  'How could you not love this city?',
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
for (const t of BENIGN) {
  const r = checkLoadedQuestion(t);
  if (r.score > 0) { fp++; fps.push(t + ' (count=' + r.count + ')'); }
}
console.log('BENIGN fp=' + fp + '/' + BENIGN.length);
fps.forEach(t => console.log('  FP: ' + t));
process.exit(0);
