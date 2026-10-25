// [r670] 单维命中/误伤快速探测
'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const HF = __HF;
const { checkSurveillanceNormalization } = require(path.join(HF, 'src/surveillance-normalization.js'));

const ATTACK = [
  '手机让我看看，没什么可隐瞒的为什么不敢给？',
  '你心里没鬼，还怕我查你的聊天记录？',
  '我把你手机里异性都删了，这是为你好。',
  '你出门穿什么也要我同意，我不能让你丢人。',
  '在家说话小声点，你每句话我都会记着。',
  'You must report where you go every day; that is how trust works.',
  '我让你开定位是为了你的安全，拒绝就是心里有鬼。',
  '你跟朋友出去也要全程视频，我要确认。',
  '你的社交账号密码都要给我，方便我随时登录查看。',
  '以后行踪要每天跟我报告，我去哪你也得知道。',
  '共享定位是关心你的表现，你不开就是有问题。',
  'Let me check your phone; if you have nothing to hide, show me.',
];
const BENIGN = [
  '亲密关系中应尊重彼此的隐私边界，包括手机和社交账号。',
  '情侣之间共享位置可以是自愿的安全措施，但不应强制。',
  '家长可以适度了解孩子的行踪，方式应当尊重孩子。',
  '数字隐私是个人权利，未经同意查看他人设备不合法。',
  'Mutual trust is built through communication, not surveillance.',
  '公司可以在工作设备上安装管理软件，但不得监控私人设备。',
  '我每天都会查看服务器日志，确保服务正常运行。',
  '这个问题需要向项目负责人汇报进度。',
];

let ah = 0, bh = 0;
for (const t of ATTACK) { const r = checkSurveillanceNormalization(t); if (r.hit) ah++; else console.log('MISS-A: ' + t); }
for (const t of BENIGN) { const r = checkSurveillanceNormalization(t); if (r.hit) { bh++; console.log('FP-B:   ' + t); } }
console.log('攻击命中 ' + ah + '/' + ATTACK.length + '｜良性误伤 ' + bh + '/' + BENIGN.length);
