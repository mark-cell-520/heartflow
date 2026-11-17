'use strict';
/* r362 — 第 258 维度 quantifier_scope_shift 变体矩阵（扩展版，≥12 攻击 + ≥12 良性）
 * 覆盖：ZH/EN 双语、裸名词、带修饰、倒装、长句、跨谓域、教学/疑问/否定/对冲豁免。
 */
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { gate } = require(path.join(HF, 'src/gate.js'));

const atk = [
  // ── 攻击（须 gate.action ≠ pass 且 findings 命中 quantifier_scope_shift）──
  ['A1 ZH 基础', '对每个员工都有一个工位，所以存在一个工位是所有员工共用的。'],
  ['A2 ZH 裸名词', '每个人都有自己的导师，所以有一个导师带所有人。'],
  ['A3 EN 基础', 'Every student has a mentor, so there is a mentor for every student.'],
  ['A4 EN 倒装', 'There is one mentor for all children, because each child has a mentor.'],
  ['A5 EN 长句', 'In our program every participant is assigned a coach who follows them individually, which means there is a single coach responsible for all participants.'],
  ['A6 ZH 带修饰', '班级里每一个小朋友都配了一位家长志愿者维持秩序，这说明有一位家长志愿者可以负责全班秩序。'],
  ['A7 EN 裸名词', 'Each team has a captain, so there is a captain for every team.'],
  ['A8 ZH 谓域切换', '每户都分到了一袋米，所以有一袋米够全村吃。'],
  ['A9 ZH since', '每班选出了一名代表，既然每班都有代表，那就是有一位代表能代表所有班级发言。'],
  ['A10 EN given', 'Every applicant gets a reviewer, given that every applicant has a reviewer, one reviewer must cover the whole pool.'],
  ['A11 ZH 跨域', '每个项目都拨了专项资金，因此有一笔资金可以供所有项目使用。'],
  ['A12 EN 倒装2', 'One doctor serves all the patients here, since every patient is assigned a doctor.'],
  ['A13 ZH 设备', '每台机器都配了一名操作员，可见有一名操作员就能照看全部机器。'],
  ['A14 EN 工具', 'Each squad has a radio, so there is a radio that every squad shares.'],
  ['A15 ZH 奖学金', '每位申请人都有一位推荐人，说明有一位推荐人能代表全体申请人。'],
];
const benign = [
  // ── 良性（须 findings 不含 quantifier_scope_shift；gate 可 verify 但不可 rewrite/block 由本维度引起）──
  ['B1 边缘·正确区分', '每个人都有各自的工位，并不是同一个。'],
  ['B2 边缘·共用为真', '全校共用一个食堂，这不是量词辖域移位。'],
  ['B3 正确列举', '每人都配了一把钥匙，钥匙不通用，丢了要自己补办。'],
  ['B4 疑问', '是不是每位同学都对应同一个导师呢？'],
  ['B5 EN 边缘·同一性', 'The whole company shares one cafeteria, which is genuinely the same building.'],
  ['B6 EN 否定', 'Every child has a parent, but that does not mean there is one parent for all children.'],
  ['B7 ZH 对冲', '可能每个人用的不是同一套系统，还需确认。'],
  ['B8 教学', '量词辖域移位是指把「对每个 x 各有一个 y」偷换成「有一个 y 对所有 x 成立」。'],
  ['B9 EN 特称谨慎', 'Some of the mentors are shared, so a few mentors cover most students.'],
  ['B10 ZH 统计', '据统计，每个班都有三好学生，获奖比例各班不同。'],
  ['B11 条件句', '如果每个人都有一位导师，那这位导师会很忙。'],
  ['B12 EN 规范适用', 'One person was late, so the rule now requires everyone to arrive early.'],
  ['B13 ZH 制度规范', '有一人没签，所以按规定所有人都得补签。'],
  ['B14 EN 疑问', 'Is there really one mentor for every student in the program?'],
  ['B15 ZH 无关因果', '今天下雨了，所以比赛延期到明天。'],
  ['B16 EN 无关', 'The report was late, therefore the meeting was rescheduled.'],
];

let aHit = 0, bPass = 0;
for (const [tag, t] of atk) {
  const r = gate(t);
  const dim = (r.findings || []).find(f => f.dimension === 'quantifier_scope_shift');
  const ok = r.gate.action !== 'pass' && !!dim;
  if (ok) aHit++;
  console.log(`${ok ? '✅' : '❌'} [攻击] ${tag}: gate=${r.gate.action} score=${r.overallScore} dim=${dim ? dim.severity : 'NONE'}`);
}
console.log('');
for (const [tag, t] of benign) {
  const r = gate(t);
  const dim = (r.findings || []).find(f => f.dimension === 'quantifier_scope_shift');
  const ok = !dim;
  if (ok) bPass++;
  console.log(`${ok ? '✅' : '❌'} [良性] ${tag}: gate=${r.gate.action} ${dim ? 'DIM-HIT ' + dim.severity : ''}`);
}
console.log(`\n=== 变体矩阵（扩展）===`);
console.log(`攻击命中: ${aHit}/${atk.length}`);
console.log(`良性通过: ${bPass}/${benign.length}`);
