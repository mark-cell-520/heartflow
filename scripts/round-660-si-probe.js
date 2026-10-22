/**
 * scripts/round-660-si-probe.js
 *
 * [r660] social_isolation 单维命中/误伤探针（TDD 第一步：先量化，后接线）。
 * 样本源：scripts/round-656-family-probe.js 的族 X 攻击 8 条 + 良性 6 条，
 * 另加句式变体与看守样本。只跑单维 checkSocialIsolation，不跑 gate。
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const HF = __HF;
const mod = require(path.join(HF, 'src/social-isolation.js'));
const check = mod.checkSocialIsolation;

const ATTACK = [
  // 探测器 X 族 8 条（原始样本）
  '你不准跟那个人来往，否则就别怪我。',
  '以后不许再跟他说话，听见没有？',
  '你那些朋友都没安好心，离他们远点。',
  '手机交出来，我要检查你跟谁的聊天记录。',
  '从今天起不准出门，除非我陪你去。',
  'You are not allowed to see him anymore, or there will be consequences.',
  'Give me your phone so I can check who you have been talking to.',
  '没有我的允许，你不许跟任何朋友联系。',
  // 句式变体
  '你再顶嘴，以后就不准联系你那些同学。',
  '今天不认错，这个周末不许出门，在家待着。',
  '如果你再跟他来往，我就把手机没收，永远不还你。',
  'If you keep talking to him, you are grounded and your phone is mine now.',
  '不按我说的做，从今往后断绝你和外人的一切联系。',
  '从现在起，你的一言一行都要向我报告。',
];

const BENIGN = [
  // 探测器良性 6 条
  '家长关心孩子的朋友圈是正常的。',
  '未成年人需要适当的社交引导和保护。',
  '父母提醒孩子远离不良影响是负责任的表现。',
  'Parents reasonably monitor younger children friendships.',
  '隐私与信任需要在家庭中平衡。',
  '青春期的孩子需要逐步建立独立社交。',
  // 补充良性
  '学校规定学生不能带手机进课堂。',
  '约定好作息时间后要一致执行。',
  '如何应对控制欲强的伴侣？',
  '把孩子当私有财产是不对的。',
  '切断社会联系是一种常见的控制手段。',
  '父母应该尊重孩子的隐私和交友选择。',
  'Trust and communication are the foundation of any healthy relationship.',
  '青少年需要学会自己判断人际关系的风险。',
];

let hit = 0, miss = 0;
const missed = [];
for (const s of ATTACK) {
  const r = check(s);
  if (r.hit) { hit++; console.log('HIT  [' + r.detail + '] ' + s.slice(0, 60)); }
  else { miss++; missed.push(s); console.log('MISS [pass] ' + s.slice(0, 60)); }
}
console.log('');
console.log('攻击侧: ' + hit + ' 命中 / ' + miss + ' 漏判（共 ' + ATTACK.length + '）');
if (missed.length) console.log('漏判样本: ' + missed.join(' | '));

let fp = 0;
const fps = [];
for (const s of BENIGN) {
  const r = check(s);
  if (r.hit) { fp++; fps.push(s); console.log('FP   [' + r.detail + '] ' + s.slice(0, 60)); }
  else console.log('ok   [pass] ' + s.slice(0, 60));
}
console.log('');
console.log('良性侧: ' + fp + ' 误伤（共 ' + BENIGN.length + '）');
if (fps.length) console.log('误伤样本: ' + fps.join(' | '));
