'use strict';
/**
 * test/round-285-base-rate-cue-density.test.js
 * [r285] base_rate_neglect（第 169 维度）cue-density 轴共现观察族扩展
 * （真升级②，live 生效，维度计数 243 不变，src/index.js 零改动）。
 *
 * 来源（真实命中，非空返自建）：arXiv "Two base rates, two weights:
 * base-rate neglect has a second axis"（r285 海外扫描，原始文件
 * coordination/agent4/scout/arxiv-r285-baserate.xml）——把共现读成判断
 * 需要两次基础概率校正：结果先验（古典轴，既有腿）+ 线索自身频率
 * （cue-density 轴，本轮新增）。r285 池化探针实测：本族 8 条新措辞攻击
 * 4 条完全穿透（gate pass 且零维度承重），良性 4 条零误伤；补丁后模块层
 * 8/8 命中、gate 层 8/8 非 pass 且本维承重、良性 0 误伤。
 *
 * 新增腿① CUE 共现观察族（中英）：队列×比例共现（十个被骗的老人里九个
 * 都…）、计数共现（十个有九个）、全称共现（每个落马的官员都…）、共同点
 * 形（有个共同点：）；EN N out of ten victims / Every X who got fired /
 * Almost all the companies that collapsed / share a common trait。
 * 新增腿② CUE_CONF 新归属落点（中英）：盯上/找上/中招/出事/完蛋/倒下/
 * 被骗/违约/失业/栽了/凉了/悬了 × 模态词；EN (are) probably being
 * targeted / likely next / probably going to fail。
 * 新增豁免 EXEMPT_CUEDENSITY：线索自身普遍性语言（本身就很常见/绝大
 * 多数人；common/ubiquitous/most people）——计及 cue 密度的正确推理。
 *
 * 纪律：维度计数不变、src/index.js 零改动；探针口径 gate.action !== pass
 * 且 findings 承重该维度 = 命中；良性承重即误伤；负例注入-删条，删掉
 * 本轮每个新模式守卫必须转 miss（旧分支不受影响对照）。
 */
const assert = require('assert');
const { checkBaseRateNeglect, __internals } = require('../src/base-rate-neglect.js');
const { gate } = require('../src/gate.js');
const hit = (t) => checkBaseRateNeglect(t).hit === true;

// ─── 1. 新攻击矩阵（模块层，中英双语）────────────────────────────────
const NEW_ATTACKS = [
  // 队列×比例共现（ZH）
  '十个被骗的老人里九个都接过陌生来电，你也接过，所以你很可能已经被盯上了。',
  '出事的司机里九个都疲劳驾驶，你昨晚没睡够，你铁定会出事。',
  '十个破产的老板里九个都加过高杠杆，你也加过，你九成要栽了。',
  // 计数共现（ZH）
  '作弊被抓的学生十个有九个坐后排，你坐后排，你大概率也在作弊。',
  // 全称共现（ZH）
  '每个落马的官员都收过礼，你收过一次，你八成也危险了。',
  '每个被辞退的员工都跟领导顶过嘴，你也顶过，你很可能要被开除。',
  // 共同点形（ZH）
  '被骗的人有个共同点：轻信陌生人，你轻信过，所以你很可能就是下一个目标。',
  '倒下的公司有个共同点：现金流断裂，你的现金流也紧，你多半要完。',
  // EN N out of ten
  "Nine out of ten fraud victims answered a stranger's call, and you did too, so you are probably being targeted.",
  'Three out of four defaulters had missed a payment, and you missed one, so you are probably going to default.',
  // EN Every X who
  'Every executive who got fired had taken a big risk; you just took one, so you are likely next.',
  // EN Almost all the X that
  'Almost all the companies that collapsed had expanded too fast; you just expanded, so you are probably going to fail.',
  "Virtually all the traders who got conned had trusted a stranger, and you trusted one, so you are probably being scammed next.",
];
for (const t of NEW_ATTACKS) {
  assert.strictEqual(hit(t), true, '应命中新攻击句: ' + t);
}
console.log('✓ 新攻击矩阵 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 全部命中（cue-density 共现观察族）');

// ─── 2. 新良性样本（共现在场但无置信腿 / 计及 cue 密度 / 教学转述）─────
const NEW_BENIGN = [
  // 共现在场，结论是对冲/否定（无高置信归属）
  '十个被骗的老人里九个都接过陌生来电，但这不能反推到你身上，接陌生来电的人太多了。',
  '每个落马的官员都收过礼，可收礼的官员里没落马的才是大多数，说明不了问题。',
  '十个被骗的老人里九个都接过陌生来电，这只是相关，不能据此锁定个人。',
  "Nine out of ten fraud victims answered a stranger's call, but most people answer strangers, so it means nothing about you.",
  '十个破产的老板里九个都加过高杠杆，但高杠杆老板里绝大多数没破产，推不出你也危险。',
  '三个违约的客户里两个都逾期过，你也逾期过，但逾期本身很常见，不能据此判定。',
  '几乎每个倒下的公司都扩张过快，可快速扩张的公司绝大多数活得好好的。',
  'Four out of five fired managers had argued with the board, but arguing is common, so it does not mean you are next.',
  // 计及 cue 密度的正确推理（新豁免族）
  '十个落马的官员都收过礼，但收礼在官场本身就非常普遍，单个案例说明不了问题。',
  'Almost every company that failed had raised money, but raising money is extremely common among startups.',
  // 教学/破谬语境（既有豁免：教材/课堂 + 对冲）
  '教材里讲：每个被抓的窃贼都穿鞋，所以穿鞋就会偷东西吗？当然不是。',
];
for (const t of NEW_BENIGN) {
  assert.strictEqual(hit(t), false, '不应命中新良性句: ' + t);
}
console.log('✓ 新良性样本 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 零误伤（无置信腿/计及 cue 密度/教学转述）');

// ─── 3. gate 层接线：新攻击非 pass 且 findings 含本维 ────────────────
for (const t of [
  '十个被骗的老人里九个都接过陌生来电，你也接过，所以你很可能已经被盯上了。',
  '每个落马的官员都收过礼，你收过一次，你八成也危险了。',
  '作弊被抓的学生十个有九个坐后排，你坐后排，你大概率也在作弊。',
  '被骗的人有个共同点：轻信陌生人，你轻信过，所以你很可能就是下一个目标。',
  "Nine out of ten fraud victims answered a stranger's call, and you did too, so you are probably being targeted.",
  'Every executive who got fired had taken a big risk; you just took one, so you are likely next.',
  'Almost all the companies that collapsed had expanded too fast; you just expanded, so you are probably going to fail.',
]) {
  const r = gate(t);
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 非 pass: ' + t);
  const f = (r.findings || []).find(x => x.dimension === 'base_rate_neglect');
  assert.ok(f, 'findings 应含 base_rate_neglect: ' + t);
  assert.ok(f.severity >= 55, 'gate finding severity: ' + t);
}
console.log('✓ gate 层接线 7/7 新攻击非 pass 且 findings 含本维');

// ─── 4. gate 层新良性不被本维命中 ───────────────────────────────────
for (const t of [
  '十个被骗的老人里九个都接过陌生来电，但这不能反推到你身上，接陌生来电的人太多了。',
  '十个落马的官员都收过礼，但收礼在官场本身就非常普遍，单个案例说明不了问题。',
  "Nine out of ten fraud victims answered a stranger's call, but most people answer strangers, so it means nothing about you.",
  '教材里讲：每个被抓的窃贼都穿鞋，所以穿鞋就会偷东西吗？当然不是。',
]) {
  const r = gate(t);
  const f = (r.findings || []).find(x => x.dimension === 'base_rate_neglect');
  assert.ok(!f, '新良性不应触发本维: ' + t);
}
console.log('✓ gate 层新良性 4/4 无本维误伤');

// ─── 5. 逐新模式注入-删条承重 + 旧分支不受影响 ─────────────────────
// 每条新模式配一个仅依赖该模式的攻击句（另一条腿取既有或同轮新模式），
// 删该模式后攻击须转 miss（承重），且旧攻击在删后仍命中。
const INJECTIONS = [
  // 腿① CUE_ZH（比例共现/计数共现/全称共现/共同点）
  { arr: 'CUE_ZH', marker: '大都', atk: '十个被骗的老人里九个都接过陌生来电，你也接过，所以你很可能已经被盯上了。' },
  { arr: 'CUE_ZH', marker: '(?:有|当中)', atk: '作弊被抓的学生十个有九个坐后排，你坐后排，你大概率也在作弊。' },
  { arr: 'CUE_ZH', marker: '每个', atk: '每个落马的官员都收过礼，你收过一次，你八成也危险了。' },
  { arr: 'CUE_ZH', marker: '共同', atk: '被骗的人有个共同点：轻信陌生人，你轻信过，所以你很可能就是下一个目标。' },
  // 腿① CUE_EN
  { arr: 'CUE_EN', marker: 'nine|eight', atk: "Nine out of ten fraud victims answered a stranger's call, and you did too, so you are probably being targeted." },
  { arr: 'CUE_EN', marker: '\\bevery\\s', atk: 'Every executive who got fired had taken a big risk; you just took one, so you are likely next.' },
  { arr: 'CUE_EN', marker: 'nearly', atk: 'Almost all the companies that collapsed had expanded too fast; you just expanded, so you are probably going to fail.' },
  { arr: 'CUE_EN', marker: 'denominator', atk: 'Fraud victims share a common trait: they answer strangers, and you do too, so you are probably being scammed.' },
  // 腿② CUE_CONF_ZH（可能×新归属 / 概率名词×新归属 / 高确信×新归属）
  { arr: 'CUE_CONF_ZH', marker: '坑上', atk: '十个被骗的老人里九个都接过陌生来电，你也接过，所以你很可能已经被盯上了。' },
  { arr: 'CUE_CONF_ZH', marker: '够呛', atk: '十个破产的老板里九个都加过高杠杆，你也加过，你九成要栽了。' },
  { arr: 'CUE_CONF_ZH', marker: '铁定|肯定|一定|必然', atk: '出事的司机里九个都疲劳驾驶，你昨晚没睡够，你铁定会出事。' },
  // 腿② CUE_CONF_EN
  { arr: 'CUE_CONF_EN', marker: 'being\\s+', atk: "Nine out of ten fraud victims answered a stranger's call, and you did too, so you are probably being targeted." },
  { arr: 'CUE_CONF_EN', marker: 'line', atk: 'Every executive who got fired had taken a big risk; you just took one, and your name is probably next on the list.' },
];
const OLD_CTRL = '你检测呈阳性，所以你几乎肯定得了这个病。';
let injected = 0;
for (const c of INJECTIONS) {
  const full = __internals()[c.arr];
  const uniq = full.filter(re => re.source.includes(c.marker));
  assert.strictEqual(uniq.length, 1, 'marker 须唯一命中一条模式 [' + c.marker + '] 实中 ' + uniq.length);
  // 正向：完整表下该攻击命中
  assert.strictEqual(hit(c.atk), true, '正向命中: ' + c.marker);
  // 删条：注入去掉该模式的表 → 攻击转 miss（承重证明）
  const inj = {};
  inj[c.arr] = full.filter(re => !re.source.includes(c.marker));
  assert.strictEqual(checkBaseRateNeglect(c.atk, inj).hit, false, '删 [' + c.marker + '] 后攻击须转 miss');
  // 旧分支不受影响：删后旧攻击（用既有模式）仍命中
  assert.strictEqual(checkBaseRateNeglect(OLD_CTRL, inj).hit, true, '删 [' + c.marker + '] 后旧攻击仍命中（旧分支不受影响）');
  injected++;
}
console.log('✓ 逐新模式注入 ' + injected + ' 个：' + injected + ' 个变红，0 个未变红（marker 唯一性自检 + 旧分支不受影响对照）');

// ─── 6. 豁免扩展承重：删 cue 密度普遍性豁免后正确推理句转误伤 ─────────
// 破谬句同时含共现观察、高置信落点与「本身就很常见」；豁免在场时放行，
// 删掉后必须转命中——证明豁免模式本身承重。
const CUE_DENSITY_CASE = '接陌生来电本身就极为常见，所以十个被骗的老人里九个都接过陌生来电，你接过，你很可能已经被盯上了这个说法不成立。';
assert.strictEqual(hit(CUE_DENSITY_CASE), false, '计及 cue 密度的破谬句应被新豁免放行');
{
  const full = __internals().EXEMPT_CUEDENSITY_ZH;
  const uniq = full.filter(re => re.source.includes('常见'));
  assert.strictEqual(uniq.length, 1, 'marker 常见 须唯一命中一条豁免模式');
  const inj = { EXEMPT_CUEDENSITY_ZH: full.filter(re => !re.source.includes('常见')) };
  assert.strictEqual(checkBaseRateNeglect(CUE_DENSITY_CASE, inj).hit, true, '删普遍性豁免后破谬句须转命中（豁免承重）');
}
console.log('✓ 豁免扩展承重：cue 密度普遍性放行破谬句，删后转命中');

// 收尾：无全局状态变更；存量攻击仍命中、存量良性仍放行
assert.strictEqual(hit(OLD_CTRL), true, '收尾自检：存量攻击仍命中');
assert.strictEqual(hit('平台给你打了诈骗标签，你很可能就是骗子。'), true, '收尾自检：r263 族仍命中');
assert.strictEqual(hit('运营团队锁定目标客户，年底前完成转化。'), false, '收尾自检：营销中性锁定仍放行');
console.log('\n全部断言通过（base_rate_neglect 第 169 维度 · r285 cue-density 共现观察族扩展）');
console.log('测试结果: ' + (NEW_ATTACKS.length + NEW_BENIGN.length + 7 + 4 + INJECTIONS.length + 2 + 3) + ' 通过, 0 失败');
console.log('cleanup: none (pure in-memory checks)');
