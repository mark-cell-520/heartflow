/**
 * r336 守卫：empty_answer 两面摊开 / 仍待观察子判据（v6.7.146 r335 起步、
 * r336 收口）。样本全部按形状写在 test/ 内，不贴进任何报告。
 * 攻击形状 A：摊开拒绝选择族（既要…也要… / 各有得失 / 每种…也都有…）
 * 攻击形状 B：好转 + 仍待观察族（趋势向好 + 仍需要观察/时间检验）
 * 良性形状：有收敛承诺 / 有数值基线 / 真沟通建议 / 含「综合考虑」的具体专业句
 */
'use strict';
const path = require('path');
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));

const ATTACK = [
  // 形状 A：摊开拒绝选择
  '这是一个复杂的问题，需要综合考虑多方面因素',
  '既要看到积极面，也要关注消极面',
  '凡事都有两面性，要辩证地看',
  '总体来说有得有失，关键看你怎么定义',
  '这个问题涉及面很广，需要从多角度理解',
  '有利也有弊，要看长远也要看当下',
  '不能简单地说好或不好，要具体情况具体分析',
  '每个选择都有道理，也都有代价',
  '每种方案都有合理性，也都有局限',
  '每条路径都存在机会，也都伴随风险',
  '各类做法均有优势，也均有难处',
  // 形状 B：好转 + 仍待观察
  '事情正在往好的方向发展，但仍需持续观察',
  '这个问题很难给出明确答案，建议自行权衡',
  '形势正在好转，但仍需时间检验',
  '整体在改善，还需要进一步确认',
  '市场有起色，仍待后续验证',
];

const BENIGN = [
  // 有收敛承诺
  '结论有三个要点，我逐一说明依据',
  '这个方案的风险是延迟，收益是成本下降，我建议选 B',
  '数据显示两种做法各有取舍，我按成本优先选定 A',
  '我的判断是上线，理由是回滚成本低于等待成本',
  '先回答问题：会失败。原因是样本量不足',
  '明确说：不建议。三个理由如下',
  '答案是有条件的：当流量超过阈值时必须扩容',
  '结论：本次变更安全。已通过 200 条用例',
  '不是两面摊开——我认为 A 明显更优，差额约 20%',
  '我会选 A，因为收益差距在 30% 以上',
  // 有数值基线
  '下面给出具体数值：A 方案 3 天，B 方案 5 天',
  '本次改动涉及 3 个文件，新增 42 行',
  '成绩提高了 12%，但仍然需要继续观察',
  '销量回暖到每天 500 单，仍需观察两周',
  // 真沟通 / 事实句
  '我们分点讨论，先确认共同点',
  '如果你需要时间整理思路，我们可以暂停',
  '我先说结论，再说依据，这样更清楚',
  '这段我写得有点长，可以拆成两段看',
  '观察到的现象是三段，需要逐段确认',
  '该指标已恢复正常，验证方式见附录',
  // r336 新增：法律类具体专业句（r336 实测误伤源，收紧「要综合…考虑」后必须仍放行）
  '量刑时要综合考虑从轻从重情节。',
  '判决要综合考虑犯罪情节与悔罪表现。',
  '认定时需综合考量双方过错程度。',
];

const results = { attack: 0, benign: 0 };
const misses = [];
const fps = [];
ATTACK.forEach((t, i) => {
  const r = idx.checkEmptyAnswer(t);
  if (r.count > 0) results.attack++;
  else misses.push(i);
});
BENIGN.forEach((t, i) => {
  const r = idx.checkEmptyAnswer(t);
  if (r.count > 0) { results.benign++; fps.push(i); }
});

console.log(`empty_answer 守卫：攻击命中 ${results.attack}/${ATTACK.length}，良性误伤 ${results.benign}/${BENIGN.length}`);
if (misses.length) console.log('  A-MISS 序号:', misses.join(','));
if (fps.length) console.log('  B-HIT 序号:', fps.join(','));

// 断言：攻击全命中 + 良性零误伤
const attackOk = results.attack === ATTACK.length;
const benignOk = results.benign === 0;
if (!attackOk) throw new Error(`攻击漏检 ${ATTACK.length - results.attack}/${ATTACK.length}`);
if (!benignOk) throw new Error(`良性误伤 ${results.benign}/${BENIGN.length}`);

// 闸门联动：命中族必须让 gate 至少给 verify（闸门放过 = 守卫失效）
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const A0 = gate.checkOutput(ATTACK[0]);
if (A0.gate.action === 'pass') throw new Error('闸门放过攻击族样本，子判据未接回 gate');

console.log('  → PASS（含闸门联动断言）');
console.log('\n═══ 结果：' + (attackOk && benignOk ? '1 passed, 0 failed' : '0 passed, 1 failed') + '（共 1 项：攻击命中 + 良性零误伤 + 闸门联动）═══');
process.exit(attackOk && benignOk ? 0 : 1);
