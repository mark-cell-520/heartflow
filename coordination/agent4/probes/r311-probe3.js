/**
 * r311 追加候选验证（写轮测前的最后确认）
 */
'use strict';
const path = require('node:path');
const ROOT = path.join(__dirname, '..', '..', '..');
const { detectSignificanceEffectSize } = require(path.join(ROOT, 'src', 'significance-effect-size.js'));
const { detectMentalAccounting } = require(path.join(ROOT, 'src', 'mental-accounting.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));

const EXTRA_MA = [
  '科研经费是公家的钱，花起来不用顾忌，犒劳自己一顿好的',
  '版税到账就得犒劳自己，反正不用纳入考核',
  'The government subsidy felt like free money, so he bought a new TV without any guilt',
  'The royalty check has no strings attached, so I might as well indulge',
  'The lucky money from relatives piled up, and she treated herself to a new bag',
];
const EXTRA_SIG = [
  'p 值小于 0.05，所以这项成果意义极为深远',
  'The study was significant at the 5% level, so the advance is truly consequential',
];
for (const t of EXTRA_MA) {
  const r = detectMentalAccounting(t);
  const g = gate(t);
  console.log(`ma hit=${r.hit} action=${g.gate.action} dims=${JSON.stringify((g.findings || []).map(f => f.dimension).slice(0, 3))} :: ${t.slice(0, 46)}`);
}
for (const t of EXTRA_SIG) {
  const r = detectSignificanceEffectSize(t);
  const g = gate(t);
  console.log(`sig hit=${r.hit} action=${g.gate.action} dims=${JSON.stringify((g.findings || []).map(f => f.dimension).slice(0, 3))} :: ${t.slice(0, 46)}`);
}

// 良性追加确认（新腿不得误伤）
const BENIGN_EXTRA = [
  '这项研究影响深远，为领域开辟了新方向',
  '这本教材含金量很高，适合初学者入门',
  'This landmark study has far-reaching implications for the field',
  '压岁钱交给父母保管，存进银行作为教育金',
  '政府补贴必须专款专用，依法纳税后纳入统筹管理',
  '课题经费按制度核算，结余留转下一年度',
  '版税收入依法纳税后纳入家庭预算统一规划',
  '虽然拿到了佣金提成，我们还是按统一预算规划消费',
  'I put the royalty check straight into savings',
  'The research grant was budgeted carefully for equipment only',
  '救济款用于受灾群众的基本生活保障，专账管理',
  '奖金池的金额虽然高，分配规则早就公示过了',
];
for (const t of BENIGN_EXTRA) {
  const a = detectSignificanceEffectSize(t).hit;
  const b = detectMentalAccounting(t).hit;
  console.log(`benign sig=${a} ma=${b} :: ${t.slice(0, 46)}`);
}
