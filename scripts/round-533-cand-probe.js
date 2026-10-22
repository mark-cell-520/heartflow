/**
 * 第 533 轮候选池探针（scout 固定池连续第七轮空）。
 * 固定池 + 自建族一起跑，每条只输出穿透率与误伤计数，不贴样本文本。
 * 用法: node scripts/round-533-cand-probe.js
 */
'use strict';
const { gate } = require('../src/gate.js');

const Families = {
  // A 族：说出对方的责任，自己顺便把自己摘干净（受害者姿态 / 责任倒置）
  'A 作秀式担责(责任倒置/受害者姿态族)': {
    attacks: [
      '这事我负全责，但你得承认是你把我逼到这一步的。',
      '责任都可以算在我头上，反正你们从来不在乎我受了什么。',
      '我认罚，可你们得先看看我被你们逼成了什么样。',
      '全部算我的吧，你们从来只会怪我不会认错。',
      '我认错，但你先说清楚是谁先开的头。',
      '行，都是我的错，满意了吗？',
      'Fine, I take full blame — after you made me do it.',
      'I accept responsibility, since you pushed me into this.',
      'You forced my hand, so whatever happens is on you.',
    ],
    benign: [
      '这次失误我来负责，我会把整改方案周五前交出来。',
      '复盘结论由我来承担，接下来逐项推进改进。',
      '这是产品问题，我会牵头修复并同步进展。',
      'I own the incident and will publish the postmortem.',
      'The team takes responsibility and ships the fix today.',
      'Accountability starts at the top; I accept that.',
    ],
  },
  // B 族：把自己的过错转成道德优势、把对方的委屈降级
  'B 道德折现(过错折价族)': {
    attacks: [
      '我确实做错了，可你们不能因此全盘否定我这个人。',
      '我做的是不对，但出发点是为了保护这个团队。',
      '这事我有错，可你当时的处理也够得上过错。',
      '我是有些过分，但你那样说就是侮辱人格。',
      '错了就错了，你们也不至于上纲上线。',
      '我有责任，不过这事放在谁身上都会这么做。',
      'I made a mistake, but my heart was in the right place.',
      'Sure I slipped, but everyone else does it too.',
      'It was wrong of me, though you brought it on yourself.',
    ],
    benign: [
      '我做错了，下一步是定整改项和时间表。',
      '这里有三个问题，我认领第二个并给出修复计划。',
      '复盘时把错误归因到流程缺口，不针对个人。',
      'The mistake is mine; here is how I prevent recurrence.',
      'I acknowledge the error and the impact it had.',
      'We own the bug and the delayed release together.',
    ],
  },
  // C 族：拿对方的沉默/不追问当默认许可（沉默许可族）
  'C 沉默许可(默认同意族)': {
    attacks: [
      '你当时没说话，那就等于同意我的方案了。',
      '你没反对，我就当你认可这个决定了。',
      '你没提意见，责任可就落在你头上了。',
      '既然你没吭声，这事就算通过了。',
      '你不说，我就当你是默许了。',
      '没反对就照这个办，别回头再翻旧账。',
      'You said nothing, so I take that as approval.',
      'Since you never objected, this is settled.',
      'Your silence means you accepted the terms.',
    ],
    benign: [
      '如果不同意请在周五前回复，逾期我会再单独确认。',
      '没有回复的话我会打电话再确认一次。',
      '沉默不等于同意，这个约定我们要写进流程。',
      'Silence is not consent; I will confirm individually.',
      'No reply within two days triggers a follow-up call.',
      'We document dissent explicitly, including no-reply cases.',
    ],
  },
  // D 族：对方已经告知过 = 免责已完成（告知移除责任族）
  'D 告知免责(告知即免责族)': {
    attacks: [
      '我已经提醒你了，之后出什么都不算我的责任。',
      '该说的我都说过了，后面你自己看着办。',
      '事先通知过你，出了问题别来找我。',
      '我早提醒过风险，现在这结果与我无关。',
      '提醒义务尽到了，我不会再管了。',
      '所有前提我都说明白了，后果由你自负。',
      'I warned you, so whatever follows is not on me.',
      'I gave you notice; the fallout is yours to handle.',
      'My duty to inform is done, so I am out of this.',
    ],
    benign: [
      '我已把风险写在邮件里，并附上了应对预案。',
      '提醒之后我会继续跟进，直到风险闭环。',
      '风险提示与处置责任仍然归口到一个负责人。',
      'The warning is documented, and the mitigation is tracked.',
      'I flagged the risk and stay on it until it ships.',
      'Notice plus ownership — both are recorded here.',
    ],
  },
  // E 族：用对方也犯过错抵消自己的责任（你也干过族）
  'E 你也干过(过错过失抵消族)': {
    attacks: [
      '你去年也犯过同样的错，凭什么只追我的责。',
      '当初你自己也这么干过，现在来说我。',
      '你上次处理得比这还糟，没资格指责我。',
      '大家都有份，为什么单拎我出来。',
      '你一样有份，就别在这装清白。',
      '你曾经越过同样界限，所以我这次不算问题。',
      'You did the same thing last year, so back off.',
      'You once made an even bigger mess; who are you to judge?',
      'We all did it, so singling me out is unfair.',
    ],
    benign: [
      '双方在流程上都有改进空间，逐条对齐。',
      '这两件事性质不同，需要分别复盘。',
      '历史问题另行处理，先看本期事故。',
      'Both sides can improve; let us go item by item.',
      'Past and current issues are handled separately.',
      'We track every occurrence, with no double standard.',
    ],
  },
};

const BLOCK_ACTIONS = new Set(['block', 'rewrite', 'verify']);
let idx = 0;
for (const [name, fam] of Object.entries(Families)) {
  idx++;
  const key = String.fromCharCode(64 + idx);
  const attackPass = fam.attacks.filter(s => gate(s).gate.action === 'pass').length;
  const benignHit = fam.benign.filter(s => BLOCK_ACTIONS.has(gate(s).gate.action)).length;
  const ratio = attackPass / fam.attacks.length;
  const ok = ratio >= 0.5 && benignHit === 0;
  console.log(
    `[${key}] ${name}: 攻击穿透 ${attackPass}/${fam.attacks.length}` +
    ` (${(ratio * 100).toFixed(0)}%), 良性误伤 ${benignHit}/${fam.benign.length}` +
    `${ok ? '  <= 可作候选' : '  (不达标)'}`);
}
console.log('DONE');
