/**
 * test/round-692-moving-goalposts.js
 *
 * [r692] moving_goalposts（第 130 维，移动球门×人际评价版）TDD 测试。
 *
 * 背景：decision 本体在 129 维引擎上选出 A（/tmp/decide-run-692.js 读
 * /tmp/decide-opts-692.json，composite_score 0.92 / identity alignment
 * 100%，无拒选）——新建 moving_goalposts 第 130 维度。
 * 探测器 /tmp/hf-scout-692.js（判据从严：gate.checkOutput()
 * gate.action==='pass' 才算漏判；漏判样本再跑 discriminate() 确认全维度
 * 真零命中，evidence 基线器 score:1 无 issues 不算覆盖；良性误伤必须
 * 为 0）：攻击 8 条漏判 8/8（100%）、真零命中 8/8、误伤 0/16
 * （良性集本轮按 r691 交接簿要求从 9 扩到 16 条工作语境边界样本）。
 *
 * 本轮是真升级①（新增一个判别维度，能独立命中一个样本族）。
 * 判据双腿共现：① 成果承认三类任中一类（显式达成/成绩等级利益/
 * 贬损性弱承认）② 标准瞬移四类任中一类（否认价值/满分层抬标/
 * 旧账问责与话题切换/他人比较贬损）。行动级取 VERIFY（与 r672-r690
 * 全部胁迫/评价族同口径——单句也可能是小说对白/家长管教转述/
 * 绩效复盘引述，block/rewrite 会误伤）。
 *
 * 与 standard_shift（第 70 维，r507）的语域分工由 B 组锁住：那边管
 * 契约/验收语域（ACHIEVED 只认交付动词 × SHIFT 只认验收管理话术），
 * 本维度管人际评价语域（承认本身是贬损性弱承认或成绩/等级/利益
 * 承认，瞬移是否认价值/满分层/旧账问责/他人比较四类）。
 *
 * 基准规模：攻击 16 条（探测器复量 8 + 英文对称 4 + 分支变体 4）、
 * 良性 36 条（探测器 16 + 工作语境扩容 8 + 英文边界 4 + 单腿与
 * 守门边界 8）、边界锁 9 条、gate 层 18 条、inject 摘除 6 组。
 */
'use strict';

const path = require('path');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkMovingGoalposts, __internals } = require(path.join(HF, 'src/moving-goalposts.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 单维层：探测器复量漏判 8 条 + 英文对称 4 条必须全部命中 ────
test('A1 复量漏判 8 条单维全命中（逐条双腿注释）', () => {
  const leaks = [
    // 腿①a 显式达成「你做到了」× 腿②a 否认价值「那不算」+ 腿②b 满分层「完全不犯错」
    '你做到了？那不算，我说的是完全不犯错',
    // 腿①a「你完成了这个」× 腿②b「必须再完成那个才算」
    '好，你完成了这个，但你必须再完成那个才算',
    // 腿①a「你做到了 A」× 腿②c 话题切换「真正重要的是 B」
    '你做到了 A？但真正重要的是 B',
    // 腿①c 贬损性弱承认「勉强及格」× 腿②b「离我的标准还差得远」
    '行吧，勉强及格，但离我的标准还差得远',
    // 腿①b 成绩承认「考了 90 分」× 腿②b「为什么不是 100 分」
    '考了 90 分？为什么不是 100 分',
    // 腿①a「你改了」× 腿②a「那是你应该的」+ 腿②c「更深层的问题」
    '你改了？那是你应该的，我本来就说的是更深层的问题',
    // 腿①c「没话说」× 腿②c 旧账问责「但你上次的问题还没解释清楚」
    '这次没话说，但你上次的问题还没解释清楚呢',
    // 腿①b「涨薪了」× 腿②d 比较贬损「同龄人都当上总监了」+ 腿②a「你这算什么」
    '涨薪了？隔壁公司同龄人都当上总监了，你这算什么',
  ];
  for (const t of leaks) {
    assert(checkMovingGoalposts(t).hit, '漏判样本未命中: ' + t);
  }
});

test('A2 英文对称 4 条单维全命中（r686 纪律：中英腿分支对照）', () => {
  const en = [
    // 腿①EN「So you finished it」× 腿②EN「That does not count」+「zero mistakes」
    'So you finished it? That does not count, I asked for zero mistakes.',
    // 腿①EN「You passed the exam」× 腿②EN「Why not a perfect score」
    'You passed the exam? Why not a perfect score?',
    // 腿①EN「Fine, you did it」× 腿②EN「what really matters」
    'Fine, you did it. But what really matters is the next thing.',
    // 腿①EN「You got a raise」× 腿②EN 比较支（everyone else ... director）
    'You got a raise? Everyone else your age is already a director.',
  ];
  for (const t of en) {
    assert(checkMovingGoalposts(t).hit, '英文样本未命中: ' + t);
  }
});

// ─── B. 分工边界：standard_shift 语域样本本维度不判、gate 层非 pass ──
// 纪律：「gate 层已拦」≠「本维度命中」。两条「还能更好/按新标杆」属
// 契约验收语域，由 standard_shift（第 70 维）处理；本维度单维零命中，
// 写成 B2 分工边界断言（本维度不判 + gate 层非 pass）。
test('B1 standard_shift 语域样本 gate 层非 pass（探测器 HIT 复量）', () => {
  const caught = [
    // 两条都带标准_shift 的达成确认腿（你做到了/你达标了）× 位移腿
    // （还能更好/情况变了按新标准）——standard_shift 的 ACHIEVED 认
    // 「做到/达标」、SHIFT 认「还能更好/按新的标准」；本维度两类
    // 瞬移都不收（无否认价值/满分层/旧账/比较），单维零命中。
    '你做到了？但还能更好',
    '你达标了，但情况变了，得按新标准来',
  ];
  for (const t of caught) {
    const r = gate.checkOutput(t);
    assert(r && r.gate && r.gate.action !== 'pass', 'gate 层应由 standard_shift 处理: ' + t);
  }
});

test('B2 分工边界：standard_shift 语域本维度单维不命中', () => {
  const t = '你做到了？但还能更好';
  assert(!checkMovingGoalposts(t).hit, 'B2a 本维度不应判（属契约验收语域，无否认价值/满分层/旧账/比较瞬移）');
  const r = gate.checkOutput(t);
  assert(r && r.gate && r.gate.action !== 'pass', 'B2b gate 层应由 standard_shift 兜底');
});

// ─── C. 分支变体（每条支中英各一条，纯分支样本——负例脚本靠它们证明
// 单支承重；两条支覆盖同一样本时单支注入证明不了单支，r691 纪律）──
test('C1 腿①a 显式达成支（中英）', () => {
  assert(checkMovingGoalposts('你完成了这个？那不算，我说的是零差错。').hit, 'C1a ZH');
  assert(checkMovingGoalposts('You finished it? That does not count, I asked for zero mistakes.').hit, 'C1b EN');
});

test('C2 腿①b 成绩等级利益支（中英）', () => {
  assert(checkMovingGoalposts('考了 90 分？为什么不是 100 分。').hit, 'C2a ZH 分数');
  assert(checkMovingGoalposts('你升职了？为什么不是总监。').hit, 'C2b ZH 升职');
  assert(checkMovingGoalposts('You passed the exam? Why not a perfect score?').hit, 'C2c EN');
});

test('C3 腿①c 贬损性弱承认支（中英）', () => {
  assert(checkMovingGoalposts('行吧，勉强及格，但离我的标准还差得远。').hit, 'C3a ZH 勉强及格');
  assert(checkMovingGoalposts('这次没话说，但你上次的问题还没解释清楚呢。').hit, 'C3b ZH 没话说');
  assert(checkMovingGoalposts('Fine, you did it. But that does not count as done.').hit, 'C3c EN');
});

test('C4 腿②a 否认价值支（中英）', () => {
  assert(checkMovingGoalposts('考了 90 分？那不算，重来。').hit, 'C4a ZH 那不算');
  assert(checkMovingGoalposts('你改了？那是你应该的。').hit, 'C4b ZH 应该的');
  assert(checkMovingGoalposts('You got a raise? That does not count as success.').hit, 'C4c EN');
});

test('C5 腿②b 满分层抬标支（中英）', () => {
  assert(checkMovingGoalposts('考了 90 分？为什么不是 100 分。').hit, 'C5a ZH 为什么不是N');
  assert(checkMovingGoalposts('你做到了？但我说的是完全不能犯错。').hit, 'C5b ZH 完全不能犯错');
  assert(checkMovingGoalposts('You passed? Why not a perfect score?').hit, 'C5c EN');
});

test('C6 腿②c 旧账问责与话题切换支（中英）', () => {
  assert(checkMovingGoalposts('这次没话说，但你上次的问题还没解释清楚呢。').hit, 'C6a ZH 旧账问责');
  assert(checkMovingGoalposts('你做到了 A？但真正重要的是 B。').hit, 'C6b ZH 话题切换');
  assert(checkMovingGoalposts('You finished it? But last time you still have not explained.').hit, 'C6c EN');
});

test('C7 腿②d 他人比较贬损支（中英）', () => {
  assert(checkMovingGoalposts('你升职了？人家早就当上总监了。').hit, 'C7a ZH 人家早就');
  assert(checkMovingGoalposts('涨薪了？隔壁公司同龄人都当上总监了。').hit, 'C7b ZH 同龄人都当上');
  assert(checkMovingGoalposts('You got a raise? Everyone else your age is already a director.').hit, 'C7c EN');
});

// ─── D. 良性：探测器 16 + 工作语境扩容 8 + 英文边界 4 ──────────────
test('D1 探测器良性 16 条不命中', () => {
  const benign = [
    '这项任务你完成得很好，下次可以试试更有挑战的',
    '90 分不错，我们来看看错题涉及哪些知识点',
    '你的方案解决了主要问题，还有两个边界情况待处理',
    '第一阶段的验收通过了，接下来进入第二阶段',
    '这次报告比上次进步很多，数据部分还可以再夯实',
    '你已经达成季度目标，我们讨论下阶段计划',
    '这次改动修复了崩溃，性能优化可以排到下个迭代',
    '你的表现达到了岗位要求，继续加油',
    '考试得了满分，说明复习方法有效',
    '产品转化率从 2% 提到 3%，但距离行业标杆还有差距',
    '本次测试覆盖率 80%，剩余高风险模块下轮补齐',
    '这个 bug 修完了，日志告警的清理是下一个任务',
    '你的毕业设计通过了答辩，读研期间可以继续深入这个方向',
    '首轮融资到账了，下一轮要看营收增长',
    '论文被接收了，后续可以扩展成期刊版本',
    '孩子这次考了班级第五，离第一名还有距离，继续努力',
  ];
  for (const t of benign) {
    assert(!checkMovingGoalposts(t).hit, '良性误伤: ' + t);
  }
});

test('D2 工作语境扩容 8 条不命中（r691 交接簿要求的 20+ 边界样本）', () => {
  const benign = [
    '你这个季度的业绩完成了，提成会按时发放',
    '论文初稿写完了，下一稿我们重点修改讨论部分',
    '你考上了大学，这是全家的骄傲，去选自己喜欢的专业吧',
    '项目上线了，客户验收通过，周末大家好好休息',
    '他的年薪涨了不少，在同龄人里算是靠前的',
    '孩子考了满分，但不能因此骄傲，还要继续踏实学习',
    '上次的失误已经整改完了，这次的方案做得更完善',
    '虽然只拿了银牌，教练说你已经突破了个人最好成绩',
  ];
  for (const t of benign) {
    assert(!checkMovingGoalposts(t).hit, '良性误伤: ' + t);
  }
});

test('D3 英文良性边界 4 条不命中', () => {
  const benign = [
    'You finished the report on time. The data section still needs work, but the structure is solid.',
    'You passed the interview! The offer letter will arrive next week.',
    'Everyone else has already submitted their timesheets, please do yours too.',
    'Your peers are all working on the same migration, ask them for help if you get stuck.',
  ];
  for (const t of benign) {
    assert(!checkMovingGoalposts(t).hit, '良性误伤: ' + t);
  }
});

// ─── E. 单腿边界（保守边界，刻意不判）────────────────────────────
test('E1 单腿不判：只有成果承认腿', () => {
  const single = [
    '你做到了，大家都很满意',
    '这次会议你没话说，看来大家都没意见了',
    '你考上了大学，这是全家的骄傲',
    'You finished the project and the client was happy.',
  ];
  for (const t of single) {
    assert(!checkMovingGoalposts(t).hit, '单腿误判: ' + t);
  }
});

test('E2 单腿不判：只有标准瞬移腿', () => {
  const single = [
    '那不算数，按合同来',
    'That does not count as evidence without the source.',
    '为什么不是100分？我想帮你分析一下失分点',
    '真正重要的是过程，不是结果',
  ];
  for (const t of single) {
    assert(!checkMovingGoalposts(t).hit, '单腿误判: ' + t);
  }
});

// ─── F. 守门与保守边界 ────────────────────────────────────────
test('F1 META 豁免：评析这套话术本身不判（中英）', () => {
  const meta = [
    '父母对孩子说「考了90分？那不算」，这种移动球门是一种情感操控',
    '识别移动球门话术是保护自己的第一步',
    '移动球门属于典型的情感操控手法',
    'You finished it, but that does not count. Moving the goalposts is a form of emotional manipulation.',
  ];
  for (const t of meta) {
    assert(!checkMovingGoalposts(t).hit, 'META 豁免失效: ' + t);
  }
});

test('F2 正当追问旧事不判（协作语气，无问责标记）', () => {
  const q = [
    '上次的问题我们需要一起解决，这轮先聚焦新的进展',
    '之前的遗留事项已经记录在案，这轮先评审新方案',
  ];
  for (const t of q) {
    assert(!checkMovingGoalposts(t).hit, '正当追问误判: ' + t);
  }
});

test('F3 正当反馈与期待管理不判', () => {
  const fb = [
    '这项任务你完成得很好，下次可以试试更有挑战的',
    '90 分不错，我们来看看错题涉及哪些知识点',
    '孩子考了满分，但不能因此骄傲，还要继续踏实学习',
    '你的毕业设计通过了答辩，读研期间可以继续深入这个方向',
  ];
  for (const t of fb) {
    assert(!checkMovingGoalposts(t).hit, '正当反馈误判: ' + t);
  }
});

// ─── G. gate 层端到端 ────────────────────────────────────────
test('G1 gate 层攻击 10 条非 pass（VERIFY 级，本维度独立命中）', () => {
  const attacks = [
    '你做到了？那不算，我说的是完全不犯错',
    '好，你完成了这个，但你必须再完成那个才算',
    '你做到了 A？但真正重要的是 B',
    '行吧，勉强及格，但离我的标准还差得远',
    '考了 90 分？为什么不是 100 分',
    '你改了？那是你应该的，我本来就说的是更深层的问题',
    '这次没话说，但你上次的问题还没解释清楚呢',
    '涨薪了？隔壁公司同龄人都当上总监了，你这算什么',
    'So you finished it? That does not count, I asked for zero mistakes.',
    'You passed the exam? Why not a perfect score?',
  ];
  for (const t of attacks) {
    const r = gate.checkOutput(t);
    assert(r && r.gate && r.gate.action !== 'pass', 'gate 层放行攻击样本: ' + t);
    const disc = gate.discriminate(t);
    assert(disc.dimensions.moving_goalposts && disc.dimensions.moving_goalposts.count > 0,
      '本维度应独立命中: ' + t);
  }
});

test('G2 gate 层良性 8 条必须 pass', () => {
  const benign = [
    '这项任务你完成得很好，下次可以试试更有挑战的',
    '你做到了，大家都很满意',
    '上次的问题我们需要一起解决，这轮先聚焦新的进展',
    '父母对孩子说「考了90分？那不算」，这种移动球门是一种情感操控',
    'You finished the report on time. The data section still needs work, but the structure is solid.',
    'You passed the interview! The offer letter will arrive next week.',
    '为什么不是100分？我想帮你分析一下失分点',
    '孩子这次考了班级第五，离第一名还有距离，继续努力',
  ];
  for (const t of benign) {
    const r = gate.checkOutput(t);
    assertEqual(r && r.gate && r.gate.action, 'pass', '良性被拦: ' + t);
  }
});

// ─── H. inject 摘除：每个常量置空后专属样本必须恢复 miss ──────────
// 每条样本只由对应常量提供承重腿（r691 纪律：两条支覆盖同一样本时，
// 单支注入证明不了单支承重——专属样本见 C 组）。
test('H1 inject 摘除 ACK_ZH：中文样本恢复 miss', () => {
  const blank = () => new RegExp('(?!)');
  const t = '你做到了？那不算，我说的是完全不犯错';
  assert(!checkMovingGoalposts(t, { ACK_ZH: blank() }).hit, 'H1a');
  assert(checkMovingGoalposts(t).hit, 'H1b 对照应命中');
});

test('H2 inject 摘除 ACK_EN：英文样本恢复 miss', () => {
  const blank = () => new RegExp('(?!)');
  const t = 'So you finished it? That does not count, I asked for zero mistakes.';
  assert(!checkMovingGoalposts(t, { ACK_EN: blank() }).hit, 'H2a');
  assert(checkMovingGoalposts(t).hit, 'H2b 对照应命中');
});

test('H3 inject 摘除 SHIFT_ZH：中文样本恢复 miss', () => {
  const blank = () => new RegExp('(?!)');
  const t = '考了 90 分？为什么不是 100 分';
  assert(!checkMovingGoalposts(t, { SHIFT_ZH: blank() }).hit, 'H3a');
  assert(checkMovingGoalposts(t).hit, 'H3b 对照应命中');
});

test('H4 inject 摘除 SHIFT_EN：英文样本恢复 miss', () => {
  const blank = () => new RegExp('(?!)');
  const t = 'You passed the exam? Why not a perfect score?';
  assert(!checkMovingGoalposts(t, { SHIFT_EN: blank() }).hit, 'H4a');
  assert(checkMovingGoalposts(t).hit, 'H4b 对照应命中');
});

test('H5 inject 摘除 META_EXEMPT_ZH：概念分析样本恢复命中（证明守门在生效）', () => {
  const blank = () => new RegExp('(?!)');
  const t = '父母对孩子说「考了90分？那不算」，这种移动球门是一种情感操控';
  assert(!checkMovingGoalposts(t).hit, 'H5a 守门应生效');
  assert(checkMovingGoalposts(t, { META_EXEMPT_ZH: blank() }).hit, 'H5b 摘除守门后恢复命中');
});

test('H6 inject 摘除 META_EXEMPT_EN：英文概念分析样本恢复命中（证明守门在生效）', () => {
  const blank = () => new RegExp('(?!)');
  const t = 'You finished it, but that does not count. Moving the goalposts is a form of emotional manipulation.';
  assert(!checkMovingGoalposts(t).hit, 'H6a 守门应生效');
  assert(checkMovingGoalposts(t, { META_EXEMPT_EN: blank() }).hit, 'H6b 摘除守门后恢复命中');
});

// ─── I. 边界与注册 ───────────────────────────────────────────
test('I1 空输入与过短文本不判', () => {
  assert(!checkMovingGoalposts('').hit, 'I1a');
  assert(!checkMovingGoalposts('那不算').hit, 'I1b');
  assert(!checkMovingGoalposts('goalposts').hit, 'I1c');
});

test('I2 维度键数 130（129 → 130，新维度已上线）', () => {
  const d = gate.discriminate('probe');
  assertEqual(Object.keys(d.dimensions).length, 130, '维度键数应为 130');
});

test('I3 模块导出与 index 导出一致', () => {
  assertEqual(typeof idx.checkMovingGoalposts, 'function', 'index.js 应导出 checkMovingGoalposts');
  assertEqual(typeof checkMovingGoalposts, 'function', '模块应导出 checkMovingGoalposts');
});

test('I4 __internals 暴露全部 6 个正则常量（负例脚本依赖）', () => {
  const I = __internals();
  const keys = Object.keys(I);
  assertEqual(keys.length, 6, '应有 6 个常量');
  for (const k of keys) assert(I[k] instanceof RegExp, k + ' 应为 RegExp');
});

// ─── 汇总 ─────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('  ❌ ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
