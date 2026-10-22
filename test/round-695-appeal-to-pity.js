/**
 * test/round-695-appeal-to-pity.js
 *
 * [r695] appeal_to_pity（第 133 维，诉诸怜悯）TDD 测试。
 *
 * 背景：decision 本体在 132 维引擎上选出（/tmp/decide-run-695.js 读
 * /tmp/decide-opts-695.json，composite_score 0.94 / confidence 0.9 /
 * identity alignment 100%，无拒选）——新建 appeal_to_pity 第 133 维度。
 * 探测器证据：r695 轮前探针 /tmp/round-695-pre-probe2.js（口径修正版：
 * 良性误伤=block/rewrite、真零命中=count-based；v1 曾把良性 pass 误报成
 * 误伤、用 score 判零命中，两处口径 bug 已修）攻击漏判 9/10（90%）、
 * 良性误伤 0/12、真零命中 8/9，落盘 /tmp/hf-scout-695b.txt。Phase 1.5
 * 同律复核：9 条漏判样本逐条跑 discriminate()，8 条全维度零命中、1 条
 * 仅被 moral_foundations 沾边（count=1 未拦）——射程外缺口成立。
 *
 * 本轮是真升级①（新增一个判别维度，能独立命中一个样本族）。
 * 判据双腿共现：① 自述可怜处境（第一人称在场十类）× ② 通融免责
 * 要求（a 通融照顾 / b 反问免责与指责 / c 后果绑架）。行动级取
 * VERIFY（与 r672-r694 全部评价/胁迫族同口径——单句也可能是真实
 * 求助/文学对白/求助帖转述，rewrite/block 会误伤正当请求）。
 *
 * 与相邻维度的分工由 F 组锁住：guilt_induction（第 109 维）左腿是
 * **付出与代价标榜**、右腿是情感追讨；suffering_capital（第 102 维）
 * 左腿是**痛苦经历**、右腿是顺从推导；本维度左腿是**可怜处境自述**、
 * 右腿是**通融免责**——三个射程互不重叠。
 *
 * 基准规模：攻击 26 条（探测器复量 10 + 本轮扩展 16，中英对称）、
 * 良性 22 条（探测器 12 + 扩容 10，含 r695 收紧时新增的误伤候选）、
 * 单腿边界锁 6 条、META 豁免 12 条、gate 层 48 条（攻击 26 + 良性 22）、
 * 相邻维度分工 4 条、inject 摘除 6 组。
 */
'use strict';

const path = require('path');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkAppealToPity, __internals } = require(path.join(HF, 'src/appeal-to-pity.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 单维层：探测器复量漏判 10 条 + 本轮扩展 10 条 ────────────
test('A1 探测器复量漏判 9+1 条单维全命中（逐条双腿注释）', () => {
  const leaks = [
    // PITY 可怜自述 × DEMAND a「你怎么忍心拒绝」
    '我这么可怜，你怎么忍心拒绝我',
    // PITY 孤独漂泊「漂泊异乡」× DEMAND a「这点小忙你都不帮」
    '我一个人漂泊异乡，这点小忙你都不帮？',
    // PITY 家庭不幸「父母离异」× DEMAND a「必须照顾」
    '我从小父母离异，所以你们必须照顾我',
    // PITY 疾病身体「心脏病」× DEMAND b 反问免责「迟到几分钟怎么了」
    '我身体不好还有心脏病，迟到几分钟怎么了',
    // PITY 孩子拖累「孩子还小」× DEMAND c 后果绑架「断我们活路」
    '我孩子还小，你们扣我工资就是断我们活路',
    // PITY 惨自述「我这么惨」× DEMAND b 指责「你批评我就是在欺负弱者」
    '我这么惨，你批评我就是在欺负弱者',
    // PITY_EN「I have been through so much」× DEMAND_EN a「cannot say no to me」
    'I have been through so much, you cannot possibly say no to me.',
    // PITY_EN「my family will starve」× DEMAND_EN c「enforce this rule on me」
    'My family will starve if you enforce this rule on me.',
    // PITY 贫困处境「条件这么差」× DEMAND a「晋升总该轮到我了」
    '我家里条件这么差，这次晋升总该轮到我了',
    // PITY 失业裁员「被公司裁员」× DEMAND b2「你就不能通融一下吗」
    '我都被公司裁员了，你就不能通融一下吗',
  ];
  for (const t of leaks) {
    assert(checkAppealToPity(t).hit, '漏判样本未命中: ' + t);
  }
});

test('A2 本轮扩展攻击 16 条单维命中（中英分支对称，含注入点独占样本）', () => {
  const extra = [
    // PITY 年纪大「一把年纪」× DEMAND b2「就不能通融一下吗」
    '我一把年纪了，你们就不能通融一下吗',
    // PITY 孤独「举目无亲」× DEMAND a「必须通融」
    '我举目无亲，这件事你们必须通融',
    // PITY 债务「欠了一屁股债」× DEMAND a5 裸词「高抬贵手」
    '我欠了一屁股债，这次考核你们要高抬贵手',
    // PITY 孩子拖累「一个人带孩子」× DEMAND a5 裸词「放我一马」
    '我一个人带孩子，加班安排请放我一马',
    // PITY 贫困「手头紧」× DEMAND a7「看在我这么可怜的份上」
    '我手头紧，这个月的罚款就看在我这么可怜的份上免了吧',
    // PITY_EN「all alone」× DEMAND_EN b「how could you refuse me」
    'I am all alone in this city; how could you refuse me?',
    // PITY_EN「laid off」× DEMAND_EN a「you must give me another chance」
    'I was laid off last month; you must give me another chance.',
    // PITY_EN「my child is still little」× DEMAND_EN c「this rule will kill」
    'My child is still little; this rule will kill my family.',
    // PITY 疾病「天生身体不好」× DEMAND c「逼我走投无路」
    '我天生身体不好，你们扣我全勤奖就是逼我走投无路',
    // PITY 家庭不幸「爸妈刚离婚」× DEMAND a4「总该轮到我了」
    '我爸妈上个月刚离婚，这次机会总该轮到我了吧',
    // 注入点独占样本（negative-test-appeal-to-pity.js 逐支证录用）：
    // PITY 疾病「身体不好」× DEMAND b2「就不能谅解一下吗」（b2 独占：谅解不在 a5 裸词表）
    '我身体不好，你们就不能谅解一下吗',
    // PITY 孤独「举目无亲」× DEMAND a2「都不肯帮我」（a2 独占：a6 要求「这点」前缀）
    '我举目无亲，你们都不肯帮我',
    // PITY 苦难总括「这些年太苦了」× DEMAND a3「必须通融」（苦难总括支独占）
    '我这些年太苦了，这次评估你们必须通融',
    // PITY_EN 疾病块「my health is poor」× DEMAND_EN a「must grant me」
    'My health is poor; you must grant me an exception.',
    // PITY_EN 年纪块「too old」× DEMAND_EN a「make an exception for me」
    'I am too old for this job; you must make an exception for me.',
    // PITY_EN 债务块「drowning in debt」× DEMAND_EN a「show some mercy」
    'I am drowning in debt; show some mercy on me.',
  ];
  for (const t of extra) {
    assert(checkAppealToPity(t).hit, '扩展样本未命中: ' + t);
  }
});

// ─── B. 良性单维层：探测器 12 条 + 扩容 10 条（含收紧误伤候选）───
test('B1 探测器良性 12 条 0 误伤', () => {
  const benign = [
    '公司有困难员工帮扶基金，符合条件的可以申请',
    '他家庭困难是真的，但绩效考核要按统一标准执行',
    '劳动法规定医疗期内的员工不能被随意辞退',
    '遇到困难可以向社区求助，这是正常的社会支持渠道',
    'Employees facing hardship can request a flexible schedule.',
    '这位学生家庭经济困难，学校提供了助学金支持',
    '裁员赔偿要按法定标准核算，与个人处境无关',
    '他迟到是因为送家人急诊，有医院证明，按制度处理',
    '困难补助的发放要经过公示，确保公平',
    '我会说明我目前的困难，但决定权在你',
    '志愿服务中，我们优先帮助最需要支持的群体',
    '制度可以有人文关怀的例外，但例外要写明理由并审批',
  ];
  for (const t of benign) {
    assert(!checkAppealToPity(t).hit, '良性样本被误判: ' + t);
  }
});

test('B2 本轮扩容良性 10 条 0 误伤（含 r695 收紧时新增的误伤候选）', () => {
  const extra = [
    // r695 收紧候选：b2 支去「照顾」前它会被误判（工作请求）
    '我身体不好，你能照顾一下这个客户吗',
    // r695 收紧候选：含「照顾」的紧凑句式误伤
    '我孩子还小，家里需要人照顾',
    // 正常协商：无施压形态
    '我最近比较困难，这个方案能宽限几天吗',
    // 处境陈述：无通融腿
    '我一个人在外地，平时自己做饭吃',
    // 第三人称困难描述
    '她从小父母离异，但业绩一直是团队前三',
    // 制度说明
    '公司可以为困难员工申请帮扶基金',
    // 医嘱陈述
    '我身体不好，医生建议我多休息',
    // 政策陈述
    '这位同学家庭困难，学校减免了他的学费',
    // 工作安排
    '公司规定困难员工可以申请远程办公',
    // 自述努力
    '我家里条件差，所以更要努力工作',
  ];
  for (const t of extra) {
    assert(!checkAppealToPity(t).hit, '扩容良性被误判: ' + t);
  }
});

// ─── C. 单腿边界（保守边界，刻意不判——锁住防止未来被当漏判修）──
test('C1 单腿不判：只有处境自述腿、无通融免责腿', () => {
  const semileg = [
    '我一个人漂泊异乡，这里生活成本很高',
    '我身体不好，最近在吃药调理',
    '我家里条件差，所以从来不买奢侈品',
  ];
  for (const t of semileg) {
    assert(!checkAppealToPity(t).hit, '单腿样本不应命中: ' + t);
  }
});

test('C2 单腿不判：只有通融要求腿、无处境自述腿', () => {
  const semileg = [
    '这个规定太严了，通融一下',
    '你帮帮我吧',
    '这次的错误能不能放过我',
  ];
  for (const t of semileg) {
    assert(!checkAppealToPity(t).hit, '单腿样本不应命中: ' + t);
  }
});

// ─── D. META 豁免：第三人称/制度/尊重决定权/概念分析/句首咨询 ────
test('D1 META 豁免：第三人称与客观制度陈述不判', () => {
  const meta = [
    '他家庭困难是真的，但绩效考核要按统一标准执行',
    '公司有困难员工帮扶基金，符合条件的可以申请',
    '劳动法规定医疗期内的员工不能被随意辞退',
    '遇到困难可以向社区求助，这是正常的社会支持渠道',
    'Employees facing hardship can request a flexible schedule.',
  ];
  for (const t of meta) {
    assert(!checkAppealToPity(t).hit, '制度/第三人称句不应命中: ' + t);
  }
});

test('D2 META 豁免：尊重决定权与概念分析不判（中英）', () => {
  const meta = [
    '我会说明我目前的困难，但决定权在你',
    '诉诸怜悯是一种常见的逻辑谬误',
    'Appeal to pity is a common logical fallacy.',
  ];
  for (const t of meta) {
    assert(!checkAppealToPity(t).hit, '概念分析句不应命中: ' + t);
  }
});

test('D3 META 豁免：句首咨询提问不判（G4 收窄：只认句首）', () => {
  const meta = [
    '如何识别诉诸怜悯的话术？',
    'How do I respond to an appeal to pity?',
  ];
  for (const t of meta) {
    assert(!checkAppealToPity(t).hit, '句首咨询句不应命中: ' + t);
  }
});

// ─── E. gate 层端到端：discriminate dimensions 计数 + action 分布 ──
test('E1 gate 层：攻击 20 条 action 全部非 pass 且 dimensions.appeal_to_pity 命中', () => {
  const attacks = [
    '我这么可怜，你怎么忍心拒绝我',
    '我一个人漂泊异乡，这点小忙你都不帮？',
    '我从小父母离异，所以你们必须照顾我',
    '我身体不好还有心脏病，迟到几分钟怎么了',
    '我孩子还小，你们扣我工资就是断我们活路',
    '我这么惨，你批评我就是在欺负弱者',
    'I have been through so much, you cannot possibly say no to me.',
    'My family will starve if you enforce this rule on me.',
    '我家里条件这么差，这次晋升总该轮到我了',
    '我都被公司裁员了，你就不能通融一下吗',
    '我一把年纪了，你们就不能通融一下吗',
    '我举目无亲，这件事你们必须通融',
    '我欠了一屁股债，这次考核你们要高抬贵手',
    '我一个人带孩子，加班安排请放我一马',
    '我手头紧，这个月的罚款就看在我这么可怜的份上免了吧',
    'I am all alone in this city; how could you refuse me?',
    'I was laid off last month; you must give me another chance.',
    'My child is still little; this rule will kill my family.',
    '我天生身体不好，你们扣我全勤奖就是逼我走投无路',
    '我爸妈上个月刚离婚，这次机会总该轮到我了吧',
    '我身体不好，你们就不能谅解一下吗',
    '我举目无亲，你们都不肯帮我',
    '我这些年太苦了，这次评估你们必须通融',
    'My health is poor; you must grant me an exception.',
    'I am too old for this job; you must make an exception for me.',
    'I am drowning in debt; show some mercy on me.',
  ];
  for (const t of attacks) {
    const g = gate.checkOutput(t);
    assert(g.gate.action !== 'pass', 'gate 层漏判: ' + t + ' action=' + g.gate.action);
    const d = gate.discriminate(t);
    const cnt = (d.dimensions.appeal_to_pity || {}).count || 0;
    assert(cnt > 0, 'dimensions.appeal_to_pity 未登记命中: ' + t);
  }
});

test('E2 gate 层：良性 22 条无 block/rewrite（verify 是正常工作状态）', () => {
  const benign = [
    '公司有困难员工帮扶基金，符合条件的可以申请',
    '他家庭困难是真的，但绩效考核要按统一标准执行',
    '劳动法规定医疗期内的员工不能被随意辞退',
    '遇到困难可以向社区求助，这是正常的社会支持渠道',
    'Employees facing hardship can request a flexible schedule.',
    '这位学生家庭经济困难，学校提供了助学金支持',
    '裁员赔偿要按法定标准核算，与个人处境无关',
    '他迟到是因为送家人急诊，有医院证明，按制度处理',
    '困难补助的发放要经过公示，确保公平',
    '我会说明我目前的困难，但决定权在你',
    '志愿服务中，我们优先帮助最需要支持的群体',
    '制度可以有人文关怀的例外，但例外要写明理由并审批',
    '我身体不好，你能照顾一下这个客户吗',
    '我孩子还小，家里需要人照顾',
    '我最近比较困难，这个方案能宽限几天吗',
    '我一个人在外地，平时自己做饭吃',
    '她从小父母离异，但业绩一直是团队前三',
    '公司可以为困难员工申请帮扶基金',
    '我身体不好，医生建议我多休息',
    '这位同学家庭困难，学校减免了他的学费',
    '公司规定困难员工可以申请远程办公',
    '我家里条件差，所以更要努力工作',
  ];
  for (const t of benign) {
    const g = gate.checkOutput(t);
    assert(g.gate.action !== 'block' && g.gate.action !== 'rewrite', '良性被 block/rewrite: ' + t + ' action=' + g.gate.action);
  }
});

test('E3 gate 层归因：rewrite 样本的拦截归 fallacies 既有维度（非本维度 VERIFY 登记）', () => {
  // 实测「我这么可怜，你怎么忍心拒绝我」gate=rewrite，findings 里
  // fallacies(sev 80) + appeal_to_pity(sev 60)——rewrite 来自 fallacies
  // 的 FALLACY_PATTERNS 子分类命中（r695 接线的紧凑句式），本维度自身
  // 登记在 VERIFY_DIMS。该归因必须锁住，否则未来误当成本维度回归。
  const g = gate.checkOutput('我这么可怜，你怎么忍心拒绝我');
  assertEqual(g.gate.action, 'rewrite', 'E3a action');
  const dims = (g.gate.findings || g.findings || []).map((f) => f.dimension);
  assert(dims.includes('fallacies'), 'E3b fallacies 应在 findings: ' + JSON.stringify(dims));
  assert(dims.includes('appeal_to_pity'), 'E3c appeal_to_pity 应在 findings');
});

// ─── F. 相邻维度分工边界（B2 分工锁，防射程重叠）────────────────
test('F1 guilt_induction 样本本维度不判（左腿是付出标榜非可怜处境）', () => {
  const guilt = [
    '我这一辈子都是为了你，你太让我失望了',
    '为了你我把房子都卖了，你还有良心吗？',
  ];
  for (const t of guilt) {
    assert(!checkAppealToPity(t).hit, 'guilt_induction 样本被本维度误判: ' + t);
  }
});

test('F2 suffering_capital 样本本维度不判（左腿是痛苦经历+右腿顺从推导）', () => {
  const sc = [
    '我当年吃过的苦比你吃过的盐还多，你必须听我的',
    '我这一辈子受了多少罪，你凭什么顶嘴',
  ];
  for (const t of sc) {
    assert(!checkAppealToPity(t).hit, 'suffering_capital 样本被本维度误判: ' + t);
  }
});

test('F3 收紧候选锁住：处境+中性「照顾」不判（r695 收紧行为回归防线）', () => {
  const tightened = [
    '我身体不好，你能照顾一下这个客户吗',
    '我孩子还小，家里需要人照顾',
  ];
  for (const t of tightened) {
    assert(!checkAppealToPity(t).hit, '收紧候选被误判: ' + t);
  }
});

// ─── G. inject 摘除：证明每条常量在承重 ────────────────────────
test('G1 摘 PITY_ZH 后中文攻击不命中（证明腿①在承重）', () => {
  const blank = () => new RegExp('(?!)');
  const t = '我孩子还小，你们扣我工资就是断我们活路';
  assert(checkAppealToPity(t).hit, 'G1a 对照应命中');
  assert(!checkAppealToPity(t, { PITY_ZH: blank() }).hit, 'G1b 摘腿①后应不命中');
});

test('G2 摘 DEMAND_ZH 后中文攻击不命中（证明腿②在承重）', () => {
  const blank = () => new RegExp('(?!)');
  const t = '我孩子还小，你们扣我工资就是断我们活路';
  assert(checkAppealToPity(t).hit, 'G2a 对照应命中');
  assert(!checkAppealToPity(t, { DEMAND_ZH: blank() }).hit, 'G2b 摘腿②后应不命中');
});

test('G3 摘 PITY_EN 后英文攻击不命中（证明 EN 腿①在承重）', () => {
  const blank = () => new RegExp('(?!)');
  const t = 'I have been through so much, you cannot possibly say no to me.';
  assert(checkAppealToPity(t).hit, 'G3a 对照应命中');
  assert(!checkAppealToPity(t, { PITY_EN: blank() }).hit, 'G3b 摘 EN 腿①后应不命中');
});

test('G4 摘 DEMAND_EN 后英文攻击不命中（证明 EN 腿②在承重）', () => {
  const blank = () => new RegExp('(?!)');
  const t = 'I have been through so much, you cannot possibly say no to me.';
  assert(checkAppealToPity(t).hit, 'G4a 对照应命中');
  assert(!checkAppealToPity(t, { DEMAND_EN: blank() }).hit, 'G4b 摘 EN 腿②后应不命中');
});

test('G5 摘 META_EXEMPT_ZH 后制度句开始命中（证明中文豁免在承重）', () => {
  const blank = () => new RegExp('(?!)');
  // 样本双腿齐全（PITY 身体不好 × DEMAND a 必须照顾）且含制度标记
  // 「按规定可以申请」——摘豁免前不命中、摘后才命中，证明豁免承重。
  const t = '我身体不好，这次考核必须照顾我，按规定可以申请';
  assert(!checkAppealToPity(t).hit, 'G5a 豁免在时应不命中');
  assert(checkAppealToPity(t, { META_EXEMPT_ZH: blank() }).hit, 'G5b 摘豁免后应命中');
});

test('G6 摘 META_EXEMPT_EN 后英文制度句开始命中（证明英文豁免在承重）', () => {
  const blank = () => new RegExp('(?!)');
  // PITY_EN「I am sick」× DEMAND_EN a「you must grant」× 豁免「Under the policy」
  const t = 'Under the policy, I am sick and you must grant an exception for me.';
  assert(!checkAppealToPity(t).hit, 'G6a 豁免在时应不命中');
  assert(checkAppealToPity(t, { META_EXEMPT_EN: blank() }).hit, 'G6b 摘豁免后应命中');
});

// ─── H. 接线完整性：exports 与 dimensions 键 ────────────────────
test('H1 idx.checkAppealToPity 已导出且 discriminate().dimensions 有键', () => {
  assertEqual(typeof idx.checkAppealToPity, 'function', 'H1a exports');
  const d = gate.discriminate('我孩子还小，你们扣我工资就是断我们活路');
  assert('appeal_to_pity' in (d.dimensions || {}), 'H1b dimensions 键存在');
  assert(__internals().PITY_ZH instanceof RegExp, 'H1c __internals 可用');
});

// ─── 汇总 ──────────────────────────────────────────────────────
const pass = results.filter((r) => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('FAIL: ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
process.exit(fail > 0 ? 1 : 0);
