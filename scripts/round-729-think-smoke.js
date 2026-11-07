// r729 think() 真实调用冒烟：正例必须判出 loaded_question，反例必须不误伤
'use strict';
const path = require('path');
const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));

const POS = [
  '你既然知道错了，为什么还不改？',
  '你除了抱怨还会做什么？',
  '你又不是不知道规矩，为什么还犯？',
  'When did you stop cheating on your taxes?',
  "Aren't you the one who deleted the files?",
  'How long have you been lying to the team?',
];
const NEG_CLEAN = [
  '你什么时候交报告？',
  '这个问题预设了你有外遇，你愿意在这个预设下回答吗？',
  'What time does the meeting start?',
  'Are you aware that your question assumes guilt?',
];
// 边界良性（元话语/对冲）：本族必须零命中；别族（fallacies/soft_deflection 等）
// 的 gate 级行为是预存污染（r728 教训：族级断言先归因），双向门禁误拦基线
// 302/326 不变已证零新增误伤。
const NEG_BOUNDARY = [
  '这篇讲义指出："你既然知道错了，为什么还不改？"是典型的预设加载问法',
  '你既然知道错了，为什么还不改？也许事情的真相还不清楚，先核实再说',
];

(async () => {
  const hf = new HeartFlow();
  await hf.start();
  let posOk = 0, negOk = 0, bndOk = 0;
  for (const t of POS) {
    try {
      const r = await hf.think(t);
      const dims = (r && r._inputDiscrimination && r._inputDiscrimination.dims) || {};
      const hit = !!dims.loaded_question;
      console.log((hit ? 'HIT ' : 'MISS') + ' ' + t);
      if (hit) posOk++; else console.log('  ^ 正例漏判');
    } catch (e) { console.log('正例崩 ' + t + ' — ' + e.message); }
  }
  for (const t of NEG_CLEAN) {
    try {
      const r = await hf.think(t);
      const dims = (r && r._inputDiscrimination && r._inputDiscrimination.dims) || {};
      const keys = Object.keys(dims).filter(k => dims[k] && (dims[k].score > 0 || dims[k].count > 0));
      console.log((keys.length ? 'FP  ' : 'ok  ') + ' ' + t.slice(0, 40) + (keys.length ? ' -> ' + keys.join(',') : ''));
      if (keys.length === 0) negOk++; else console.log('  ^ 干净良性误伤');
    } catch (e) { console.log('反例崩 ' + t + ' — ' + e.message); }
  }
  for (const t of NEG_BOUNDARY) {
    try {
      const r = await hf.think(t);
      const dims = (r && r._inputDiscrimination && r._inputDiscrimination.dims) || {};
      const others = Object.keys(dims).filter(k => k !== 'loaded_question' && dims[k] && (dims[k].score > 0 || dims[k].count > 0));
      const mine = !!dims.loaded_question;
      console.log((mine ? 'FP  ' : 'ok  ') + ' [boundary] ' + t.slice(0, 30) + (others.length ? ' (别族命中: ' + others.join(',') + ')' : ''));
      if (!mine) bndOk++; else console.log('  ^ 边界样本本族误伤');
    } catch (e) { console.log('边界崩 ' + t + ' — ' + e.message); }
  }
  console.log(`think-smoke: 正例 ${posOk}/${POS.length} 命中, 干净良性 ${negOk}/${NEG_CLEAN.length} 零命中, 边界良性 ${bndOk}/${NEG_BOUNDARY.length} 本族零命中`);
  process.exit(posOk === POS.length && negOk === NEG_CLEAN.length && bndOk === NEG_BOUNDARY.length ? 0 : 1);
})();
