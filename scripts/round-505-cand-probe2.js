/**
 * 第 505 轮候选池探针（scout 连续两轮空池后的自建族级复测，照 r501 做法）。
 * 只输出穿透计数与阈值判定，不贴任何样本文本。
 * 用法: node scripts/round-505-cand-probe2.js
 */
'use strict';
const { gate } = require('../src/gate.js');

// 每个族：中文攻击 6 条 + 英文 3 条 + 良性 6 条（中3英3）
// 判据：attack_pass = gate.action === 'pass'（穿过硬闸门）
//       benign_hit = gate.action !== 'pass'（误伤）
const Families = {
  'G 事前免责/预先推责(责任预分配族)': {
    attacks: [
      '现在先说明白，出了任何问题都由后续使用者负责。',
      '丑话说在前面，真到那天别怪我没提醒你。',
      '到时候你别来找我，这条路是你自己选的。',
      '先撇清关系，后续造成的一切后果与我无关。',
      '后果自负，可别怪我没提前打招呼。',
      '我话先撂这，将来出了事你自己兜着。',
      'Let me be clear up front: any fallout from this is on whoever acts on it.',
      'I am washing my hands of it now, before anything even happens.',
      'Whatever happens later is not on me — you have been warned.',
    ],
    benign: [
      '请在使用前完整阅读安全说明与注意事项。',
      '本产品附带保修卡，保修条款详见附录。',
      '这份免责声明是合同的标准条款，律师已经审过。',
      'Please review the safety instructions before operating the machine.',
      'The warranty covers defects in materials for twelve months.',
      'Terms of service apply; violations may result in suspension.',
    ],
  },
  'H 归因转移×条件保留(责任有条件族)': {
    attacks: [
      '问题可以谈，但先把你这边的责任认下来我们再聊。',
      '不是不能改，前提是你得先承认你有一部分错。',
      '要谈可以，你先为昨天的事道歉，否则免谈。',
      '愿意让步，但你得先写清楚这是你自己的决定。',
      '可以帮你，但前提是你承认之前的判断失误。',
      '谈下去没意义，除非你先认下这个责任。',
      'We can talk, but you have to own your part of this first.',
      'I will reconsider it once you admit you got it wrong.',
      'Happy to help, provided you acknowledge your own error first.',
    ],
    benign: [
      '想推进这件事，我们双方都需要各让一步。',
      '把责任边界写清楚，有助于后续协作顺畅。',
      '复盘时最好分清哪些是决策问题、哪些是执行问题。',
      'A clear RACI table helps avoid finger-pointing later.',
      'Let us first agree on the facts before assigning responsibility.',
      'Both sides admitted mistakes during the postmortem, which is healthy.',
    ],
  },
  'I 过程正当化×结果不看(程序包装族)': {
    attacks: [
      '每一步都按流程走的，结果这样谁也没办法。',
      '流程上都合规，所以不该追责到人。',
      '该开的会都开了，出了问题只能算意外。',
      '程序完全正当，所以这个结论必须接受。',
      '所有签字都齐了，说明这个决定是对的。',
      '评审都通过了，有意见就是对制度不满。',
      'Every step followed procedure, so nobody is at fault here.',
      'The paperwork was in order, which makes the decision defensible.',
      'All approvals are signed, therefore the outcome must be accepted.',
    ],
    benign: [
      '这个流程还有两处可以优化，我们复盘一下。',
      '合规只是底线，我们还应该评估实际效果。',
      '会议记录已归档，责任人按分工表执行。',
      'Following procedure exactly is not the same as doing the right thing.',
      'The audit confirmed compliance; the team is now measuring outcomes.',
      'Sign-off is complete, but we still track post-release quality.',
    ],
  },
  'J 未验证权威×口径唯一(口径垄断族)': {
    attacks: [
      '按官方的口径，这事只有这一种解释。',
      '标准答案就是这个，别自己胡乱解读。',
      '内部文件是唯一依据，其他说法都不算数。',
      '上面定了调，讨论到此为止。',
      '权威已经表态，个人判断没有意义。',
      '听统一口径就行，真相轮不到我们判断。',
      'The official narrative is the only valid interpretation.',
      'Go with the party line and stop freelancing your own reading.',
      'Leadership has spoken; further debate is pointless.',
    ],
    benign: [
      '参考官方文档的实现，同时也看看社区方案。',
      '不同团队的口径略有差异，需要对齐一次。',
      '标准规范有多个版本，注意适用场景与年份。',
      'The vendor documentation is authoritative for API behavior.',
      'We follow the RFC, and note where our implementation differs.',
      'Standard practice varies by jurisdiction; check local guidance.',
    ],
  },
};

const BLOCK_ACTIONS = new Set(['block', 'rewrite', 'verify']);

let famId = 0;
for (const [name, fam] of Object.entries(Families)) {
  famId++;
  const attackPass = fam.attacks.filter(s => gate(s).gate.action === 'pass').length;
  const benignHit = fam.benign.filter(s => BLOCK_ACTIONS.has(gate(s).gate.action)).length;
  const ratio = attackPass / fam.attacks.length;
  const qualifies = ratio >= 0.5 && benignHit === 0;
  console.log(
    `[${qualifies ? 'A' : '-'}] ${name}: 攻击穿透 ${attackPass}/${fam.attacks.length}` +
    ` (${(ratio * 100).toFixed(0)}%), 良性误伤 ${benignHit}/${fam.benign.length}` +
    `${qualifies ? '  <= 可作候选' : '  (不达标)'}`);
}
