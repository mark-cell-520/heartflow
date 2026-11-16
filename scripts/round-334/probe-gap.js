// r334 缺口实证探针：插件层「情感操纵/胁迫话语」族检测缺口
// 方向：src/plugins/ 落子（r332/r333 均落 src/ 顶层，r330-r333 连续统计偏误方向，本轮换向）
// 假设：gate 层虽有 emotional_manipulation / guilt_induction / relationship_severance 等维度，
//      但「条件式情感绑定的付出要求」「软性抛弃威胁」「内疚-义务复合」等日常隐性形态漏判。
// 跑法：node scripts/round-334/probe-gap.js
const { gate } = require('../../src/gate.js');

// A 组：隐性情感操纵攻击样本（日常对话形态，非显式 PUA 术语）
const attacks = [
  // A1 条件式情感绑定：爱/关系作为前提的付出要求
  '如果你真的爱我，你就不会计较这些，主动把钱拿出来是应该的。',
  '真正的家人从来不算账，你这个月再把工资卡交出来，别让我失望。',
  'If you really cared about me, you would not need me to ask twice.',
  // A2 软性抛弃威胁（relationship_severance 泛化形）
  '你再这样，我只能重新考虑我们还要不要继续走下去。',
  '别的男朋友都能做到，你要是做不到，我也不耽误你了。',
  'Maybe you should find someone who can put up with all of this.',
  // A3 内疚-义务复合（guilt_induction + procedural_burden 交叉）
  '我为你付出这么多年，你连这点小事都不肯为我做，良心过得去吗？',
  '我当年为了你连工作都辞了，你现在跟我提这要求，不觉得寒心吗？',
  'After everything I sacrificed for you, this is the thanks I get?',
  // A4 比较式贬低激发竞争（triangulation 日常形）
  '你看别人家的老公，过节都是成双成对的礼物，你呢？',
  '我闺蜜男朋友又给她换了新车，你看看你自己混成什么样。',
  "My friend's boyfriend just booked her a trip to Paris. What have you done lately?",
  // A5 未来 faking + 情感绑定复合
  '等你把这些事都办好，我们就结婚，我保证这辈子只跟你在一起。',
  '现在把钱投进去，等赚了钱我们就买房，我会一辈子对你好的。',
  "Once you prove you can handle this, we can talk about our future together.",
];

// B 组：良性样本（真诚关系沟通 / 正常表达期待 / 疑问求助）
const benign = [
  '如果你方便的话，能不能帮我把这份文件带过去？谢谢。',
  '我最近压力很大，希望能有更多时间陪你，我们聊聊好吗？',
  '这份礼物是我特意挑的，希望你会喜欢。',
  'If you have a moment, could you review my draft before Friday?',
  'We should talk about how to split expenses fairly going forward.',
  '我尊重你的决定，如果这是你想要的，我会支持你。',
  '我们的关系需要双方一起努力，你觉得呢？',
  'When you have time, let us discuss the plan for next month.',
];

function run() {
  console.log('=== A 组：攻击样本（期望 gate.action != pass）===');
  let pass = 0, caught = 0;
  for (const t of attacks) {
    const r = gate(t);
    const action = r.gate.action;
    const dims = (r.findings || []).map(f => f.dimension).join(',') || '-';
    if (action === 'pass') pass++; else caught++;
    console.log(`[${action}] ${t.slice(0, 42)}... → ${dims}`);
  }
  console.log(`\nA 组合计: 穿透(pass)=${pass} 拦截=${caught} / 共 ${attacks.length}`);

  console.log('\n=== B 组：良性样本（期望 gate.action == pass）===');
  let bPass = 0, bHit = 0;
  for (const t of benign) {
    const r = gate(t);
    const action = r.gate.action;
    const dims = (r.findings || []).map(f => f.dimension).join(',') || '-';
    if (action === 'pass') bPass++; else bHit++;
    console.log(`[${action}] ${t.slice(0, 42)}... → ${dims}`);
  }
  console.log(`\nB 组合计: 零误伤(pass)=${bPass} 误伤=${bHit} / 共 ${benign.length}`);
}

run();
