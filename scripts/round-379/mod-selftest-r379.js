'use strict';
// r379 模块自测：duration_neglect 两腿命中 + 豁免 + 裸名词 + 中英双语。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { detectDurationNeglect } = require(path.join(ROOT, 'src', 'duration-neglect.js'));

const ATTACK = [
  '手术疼了多久不重要，只要最后几分钟不疼，病人对整台手术的记忆就是好的。',
  '这次度假开头结尾很愉快，中间那两周难受完全不重要，总体体验算完美。',
  'Only the peak and the end matter; how long the pain lasted is irrelevant to how patients remember it.',
  '过程长短无所谓，结局好就算好经历，时长不影响人们对体验的评价。',
  '实验里被试忍受噪音的时长不影响满意度，只要结尾安静就行。',
  '这部电影前面两个小时再难看也无所谓，结尾精彩就是神作。',
  'Whether the discomfort lasted one minute or one hour makes no difference — only the ending counts.',
  '治疗过程的煎熬长短无关紧要，最后一天状态好就等于全程顺利。',
  '军训那十五天多苦都不算事，最后一天会操整齐，整个军训就是好的。',
  '住院期间难受多久都不要紧，出院那天不疼，这次住院就算成功。',
  '受的罪持续多长时间根本不算数，结局圆满就行。',
  'The duration of the pain makes no difference to how the treatment is judged.',
  '病痛折磨了多久不影响疗效评价，指标好转就算治好了。',
  '疗程多长不起作用，症状消失就是痊愈。',
  '排队等了几个小时不重要，最后买到就行。',
  'The length of the hospital stay makes no difference to patient satisfaction.',
];

const BENIGN = [
  '虽然峰终定律说记忆主要受峰值和终点影响，但疼痛持续时间本身仍有独立的影响，不能忽略。',
  '记忆评价有偏，但对长时程痛苦的评估仍应考虑总时长。',
  'Peak-end rule describes memory bias, yet duration of suffering remains independently relevant.',
  '结局当然重要，但过程持续了多久也是评价的一部分，不能只看两端。',
  '时长并非不重要，长时程的中度不适累积起来影响很大。',
  '持续时间不应被忽视，这是峰终定律实验的重要提醒。',
  'Duration is also a key factor in how patients evaluate the whole procedure.',
  '还有多久到？我赶时间。',
  '这个工程工期多长？客户想知道确切时间。',
  'how long does the flight take?',
  '他问我会议开了多久，我说两个小时。',
  '过程长短同样重要，评价一段体验不能只看结局。',
  'How long the treatment took matters as much as the final result.',
];

let aHit = 0, bDirty = 0;
ATTACK.forEach((t, i) => { const r = detectDurationNeglect(t); if (r.hit) aHit++; else console.log('  A' + i + ' MISS: ' + t.slice(0, 40)); });
BENIGN.forEach((t, i) => { const r = detectDurationNeglect(t); if (r.hit) { bDirty++; console.log('  B' + i + ' 脏: ' + t.slice(0, 50)); } });
console.log('攻击 ' + aHit + '/' + ATTACK.length + '  良性脏 ' + bDirty + '/' + BENIGN.length);

// 负例注入：逐常量删条，验证承重
console.log('--- 负例注入（删除单条腿后攻击命中数应下降）---');
const I = require(path.join(ROOT, 'src', 'duration-neglect.js')).__internals();
const before = ATTACK.filter(t => detectDurationNeglect(t).hit).length;
for (const k of Object.keys(I)) {
  const saved = I[k];
  if (saved instanceof RegExp) {
    const inj = {}; inj[k] = /(?!x)x/;
    const after = ATTACK.filter(t => detectDurationNeglect(t, inj).hit).length;
    console.log('  ' + k.padEnd(24) + ' ' + before + ' -> ' + after);
  } else if (Array.isArray(saved)) {
    // 数组型腿：逐条删一条
    for (let i = 0; i < saved.length; i++) {
      const arr = saved.slice(); arr.splice(i, 1);
      const inj = {}; inj[k] = arr;
      const after = ATTACK.filter(t => detectDurationNeglect(t, inj).hit).length;
      console.log('  ' + (k + '[' + i + ']').padEnd(32) + ' ' + before + ' -> ' + after);
    }
  }
}
