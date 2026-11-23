// r465/r466 第 290 维 source_derogation（信息源贬低族）单测
// 攻击样本 + 良性样本都来自词族外自然语料（非模块内部词表自证）。
const assert = require('assert');
const { detectSourceDerogation } = require('../src/source-derogation.js');

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.log('FAIL:', msg); } }

// ─── 攻击：模块层应命中 ───────────────────────────────────────
const attacks = [
  // 敌意归因 HA：中性行为观测 × 恶意结论
  ['他迟迟没有回复，分明是心里有鬼。', 'HA-1 没有回复形'],
  ['她一直回避这个问题，显然是心里有鬼。', 'HA-3 回避形'],
  ['他支支吾吾答不上来，说明确实做了亏心事。', 'HA-4 言语迟疑形'],
  ['对方越是解释，越说明心里有鬼。', 'HA-5 越…越…自证陷阱'],
  ['他反对这个方案，说明他心里有鬼，肯定没安好心。', 'HA-2 反对方案形'],
  ['他没采纳我的建议，分明是心存不满。', 'HA-6 不采纳形'],
  ['大家沉默不语，说明都心里有鬼。', 'HA-7 沉默形'],
  // 反应性贬低 RD：源标记 × 无条件否定
  ['他们提出的方案，一概不能接受。', 'RD-1 一概不能接受形'],
  ['那家媒体的报道，根本不用看就知道是假的。', 'RD-2 媒体源标记形'],
  ['对手说的话，向来要反过来听。', 'RD-3 反过来听形'],
  ['他们那群人的提议，想都不用想，肯定有问题。', 'RD-4 那群人形'],
  ['他们那群人的话，不能信。', 'RD-7 不能信形'],
  ['对方的主张一定有问题。', 'RD-8 一定有问题形'],
  // 虚幻真效应 IT：重复次数 × 真值断言
  ['这个说法从小听到大，自然就是对的。', 'IT-1 从小听到大形'],
];
for (const [t, label] of attacks) {
  const r = detectSourceDerogation(t);
  ok(r.hit === true, `攻击未命中: ${label} :: ${t}`);
  ok(typeof r.family === 'string' && r.family.length > 0, `攻击无 family: ${label}`);
}

// ─── 良性：模块层应零误报（含豁免形） ─────────────────────────
const benign = [
  '他迟迟没有回复，可能是没看到消息。',
  '他反对这个方案，理由是预算超支，我认为可以再讨论。',
  '他们提出的方案有数据支持，我们需要评估后再决定。',
  '即使我不同意他的立场，也不代表他的每个观点都错。',
  '重复的次数与事实的真假没有必然关系。',
  '不能因为他反对就认为他的方案不好。',
  '双方都陈述了各自的理由，请委员会依据材料裁决。',
  '这篇论文的结论需要看原文和样本量才能判断。',
  '那家媒体的报道引用了两份原始文件，可信度较高。',
  '对手在听证会上提交了新证据，我们应该评估。',
  '他们的提议虽然激进，但逻辑上自洽。',
  '警方记录显示他三次传唤均到案配合。',
  '被告保持沉默是宪法权利，不能据此推断有罪。',
  '她当时有些紧张，但回答内容与物证一致。',
  '这份提案的财务模型需要第三方审计。',
  '双方都声称拥有版权，法院会依据登记材料裁决。',
  '那名记者后来更正了报道中的两个数据错误。',
  '他们对方案提出了三点技术质疑，均附有计算过程。',
  '回避问题可能是性格内向，不等于心里有鬼。',
  '媒体公信力建立在可核查的事实与更正机制上。',
  '我们请对方陈述了反对理由，逐条记录在案。',
  '张医生的诊断依据是影像和化验，不是患者身份。',
  '评估一项政策要看效果数据，不能看提谁的。',
  '她回答时语速较慢，但内容经交叉验证全部属实。',
  '反方观点同样值得倾听，这是学术规范。',
  '一审判决后被告上诉，二审维持原判。',
  '小组成员都同意先做小规模试点再推广。',
  '他承认了错误并提出了补救措施。',
  '这篇文章的数据来源标注在脚注里，可以复查。',
  '越是解释，越说明他说的是实话吗？不，要看证据。',
];
for (const t of benign) {
  const r = detectSourceDerogation(t);
  ok(r.hit === false, `良性误报: ${t} :: ${JSON.stringify(r).slice(0, 160)}`);
}

// ─── gate 层：攻击非 pass、良性不被 source_derogation 命中 ────
const gate = require('../src/gate.js');
const gateAttacks = attacks.map(([t]) => t);
for (const t of gateAttacks) {
  const g = gate.check(t);
  const dims = (g.findings || []).map(f => f.dimension);
  ok(g.action !== 'pass', `gate 未拦: ${t} :: action=${g.action}`);
}
for (const t of benign.slice(0, 12)) {
  const g = gate.check(t);
  const dims = (g.findings || []).map(f => f.dimension);
  ok(!dims.includes('source_derogation'), `gate 层 source_derogation 误伤: ${t} :: [${dims.join(',')}]`);
}

console.log(`\nround-465/466 source_derogation 单测：pass ${pass} / fail ${fail}`);
if (fail > 0) process.exit(1);
