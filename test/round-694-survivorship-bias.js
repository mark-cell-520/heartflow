/**
 * test/round-694-survivorship-bias.js
 *
 * [r694] survivorship_bias（第 132 维，生存者偏差）TDD 测试。
 *
 * 背景：decision 本体在 131 维引擎上选出（/tmp/decide-run.js 读
 * /tmp/decide-opts.json，composite_score 0.94 / confidence 0.9 /
 * identity alignment 100%，无拒选）——新建 survivorship_bias 第
 * 132 维度。探测器证据来自 r693 落盘的 /tmp/hf-scout-693.txt
 * （判据从严：gate.checkOutput() gate.action==='pass' 才算漏判；
 * 漏判样本再跑 discriminate() 确认全维度真零命中；良性误伤必须
 * 为 0）：攻击 10 条漏判 9/10（90%）、真零命中 8/9、误伤 0/10。
 * r694 轮前探针 /tmp/round-694-pre-probe.js 扩展攻击集 8 条中
 * 7 条漏判、误伤 0/8——缺口成立。
 *
 * 本轮是真升级①（新增一个判别维度，能独立命中一个样本族）。
 * 判据两组双腿共现：① 可见成功个案（成功结果名词）× 推及结论
 * （推及听者/领域评价/EN 对应）② 非常规路径 × 成功结果（无显式
 * 推及句的经典幸存者叙事形）。行动级取 VERIFY（与 r672-r693 全部
 * 评价/胁迫族同口径——单句也可能是小说对白/逻辑课反面教材/
 * 人物报道转述，block/rewrite 会误伤）。
 *
 * 与 anecdote_as_proof（第 84 维）的分工由 B 组锁住：那边管
 * **熟人语料 × 全称效果断言**（我朋友/我身边/大家都说 + 普遍
 * 适用/行业标准），本维度个案不限熟人——名人、陌生人、具体
 * 人物皆可，落点是推及听者行动或领域评价而非「证明有效」。
 * 实测本族 9 条漏判样本 0 条命中 anecdote_as_proof。
 *
 * 基准规模：攻击 19 条（探测器复量 9 + 本轮扩展 8 + 分支补充 2）、
 * 良性 22 条（探测器 10 + 按 r693 交接簿要求扩容 12，r693 要求
 * 良性集扩到 16+ 条）、单腿边界锁 7 条、gate 层 24 条、inject
 * 摘除 6 组。
 */
'use strict';

const path = require('path');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkSurvivorshipBias, __internals } = require(path.join(HF, 'src/survivorship-bias.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 单维层：探测器复量漏判 9 条 + 本轮扩展 8 条 + 补充 2 条 ────
test('A1 探测器复量漏判 9 条单维全命中（逐条双腿注释）', () => {
  const leaks = [
    // 腿①财富「成了世界首富」× 腿②a 推及听者「所以你也该退学」
    '比尔·盖茨辍学创业成了世界首富，所以你也该退学',
    // 腿①财富「财富自由」× 腿②b 领域评价「正是创业的好时候」
    '他 25 岁创业就财富自由了，现在正是创业的好时候',
    // 腿①健康「痊愈」× 腿②a 推及听者「你肯定也没问题」
    '我朋友用这个方法三个月就痊愈了，你肯定也没问题',
    // 腿①财富「成了富豪」× 腿②b 领域评价「读书没用」
    '李嘉诚没上过大学也成了富豪，读书没用',
    // 腿①财富「赚一百万」× 腿②b 领域评价「真轻松」
    '那个主播一场直播赚一百万，做主播真轻松',
    // 补充双腿：PATH「退学打游戏」× SURVIVOR「年薪百万」（无显式推及句）
    '隔壁老王的儿子退学打游戏现在年薪百万',
    // 腿①中奖「中了大奖」× 腿②b 领域评价「能发财」
    '有人买彩票中了大奖，所以买彩票能发财',
    // 补充双腿：PATH「没上过北影」× SURVIVOR「拿了影后」
    '这个演员没上过北影不也拿了影后',
    // 腿①EN「dropped out and built」× 腿②EN「college is unnecessary」
    'Steve Jobs dropped out and built Apple, so college is unnecessary.',
  ];
  for (const t of leaks) {
    assert(checkSurvivorshipBias(t).hit, '漏判样本未命中: ' + t);
  }
});

test('A2 本轮扩展攻击 8 条 + 补充 2 条单维命中', () => {
  const extra = [
    // 腿①资产「买了房」× 腿②a「人人都能」
    '他靠直播买了房，所以直播行业人人都能买房',
    // 腿①财富「财务自由」× 腿②b「可靠出路」
    '有人炒股实现财务自由，说明炒股是可靠出路',
    // 腿①奖项「考上清华」× 腿②a「照这个方法你家孩子也能」
    '邻居家孩子考上清华，照这个方法你家孩子也能',
    // 腿①健康「活到九十」× 腿②b「不影响健康」
    '老王抽烟喝酒活到九十，所以烟酒不影响健康',
    // 腿①财富「月入十万」× 腿②b「都能赚」
    '这家小店月入十万，开这样的店都能赚',
    // 腿①EN「won the lottery and retired」× 腿②EN「is a solid plan」
    'She won the lottery and retired; playing the lottery is a solid plan.',
    // 腿①EN「never went to college and owns three houses」× 腿②EN「school is pointless」
    'My uncle never went to college and owns three houses; school is pointless.',
    // 补充双腿：PATH「退学」× SURVIVOR「成名」
    '那位作家退学后成名，所以退学是成为作家的捷径',
    // 补充双腿：PATH「辍学摆地摊」× SURVIVOR「身家过亿」
    '他辍学摆地摊，如今身家过亿',
    // 腿①集体成功「都赚了」× 腿②a「你入场肯定也行」
    '我认识的几个人做这个都赚了，你入场肯定也行',
  ];
  for (const t of extra) {
    assert(checkSurvivorshipBias(t).hit, '扩展攻击样本未命中: ' + t);
  }
});

// ─── B. 分工边界（r694 实测，每一侧先跑过再写断言）────────────────
test('B1 anecdote_as_proof 语域样本本维度单维不命中', () => {
  // 实测（/tmp/round-694-boundary.js）：熟人语料 × 效果断言族，
  // 本维度 5 条全部 sb.hit=false——那边归第 84 维管。
  const anecdote = [
    '我朋友用这个产品三个月，效果特别好，强烈推荐给大家',
    '我身边好几个人都用这个方法，反馈都不错',
    '我认识的用户都说这个工具好用',
    '我同事用这套流程从来没出过问题，所以是安全的',
    'Everyone I know uses this app and it works great.',
  ];
  for (const t of anecdote) {
    assert(!checkSurvivorshipBias(t).hit, 'anecdote 语域不应被本维度命中: ' + t);
  }
});

test('B2 分工边界：hasty_generalization / statistical_misleading 语域不命中', () => {
  // 实测：无依据概推族与比例基数族，本维度 3 条全部 sb.hit=false。
  const others = [
    '我见过几个程序员都秃头，所以程序员都秃头',
    '连续三个新人都离职了，现在的新人真不能吃苦',
    '从 2 个人涨到 8 个人，提升 300%',
  ];
  for (const t of others) {
    assert(!checkSurvivorshipBias(t).hit, '近亲维度语域不应被本维度命中: ' + t);
  }
});

// ─── C. 分支变体（每条支中英各一条）────────────────────────────
test('C1 腿①财富成功支（中英）', () => {
  assert(checkSurvivorshipBias('他成了世界首富，所以你也该学他').hit, 'C1a zh 财富');
  assert(checkSurvivorshipBias('He became a millionaire, so you can too.').hit, 'C1b en 财富');
});

test('C2 腿①奖项成功支（中英）', () => {
  assert(checkSurvivorshipBias('她拿了奥斯卡影后，所以这行真好混').hit, 'C2a zh 奖项');
  assert(checkSurvivorshipBias('She won the lottery, so anyone can do it.').hit, 'C2b en 奖项');
});

test('C3 腿①健康生存支（中英）', () => {
  assert(checkSurvivorshipBias('他抽烟一辈子活到一百岁，所以抽烟不影响健康').hit, 'C3a zh 健康');
  assert(checkSurvivorshipBias('He was cured by this remedy, so it must work for you.').hit, 'C3b en 健康');
});

test('C4 腿②推及听者支（中英）', () => {
  assert(checkSurvivorshipBias('有人中了大奖，你肯定也能中').hit, 'C4a zh 推及');
  assert(checkSurvivorshipBias('He made millions, so you should do the same.').hit, 'C4b en 推及');
});

test('C5 补充双腿 PATH × SURVIVOR 支（中英）', () => {
  assert(checkSurvivorshipBias('他初中毕业就出去闯，如今年薪百万').hit, 'C5a zh 路径');
  assert(checkSurvivorshipBias('She skipped college and now runs three companies.').hit, 'C5b en 路径');
});

// ─── D. 良性：探测器 10 + 扩容 12（r693 交接簿要求 16+）──────────
test('D1 探测器良性 10 条不命中', () => {
  const benign = [
    '盖茨辍学的是哈佛，且已有多年编程经验，个案不具代表性',
    '创业成功率统计显示多数初创企业活不过五年',
    '个例不能代表总体，要看大样本的统计数据',
    '这位患者的疗效需要对照试验数据支持',
    '中彩票是极低概率事件，期望收益为负',
    'Survivorship bias is a common pitfall in analyzing success.',
    '直播行业的头部收入很高，但中位数收入很低',
    '演员的成功与科班训练没有必然联系，也不构成反证',
    '评估一个行业要看出头和基数的比例',
    '退学创业要评估自身条件和风险承受能力',
  ];
  for (const t of benign) {
    assert(!checkSurvivorshipBias(t).hit, '良性样本被误判: ' + t);
  }
});

test('D2 扩容良性 12 条不命中（按 r693 交接簿 16+ 要求扩容）', () => {
  const benign = [
    // 个案归因陈述（有成功结果、无推及腿）
    '他考上了清华，这是他个人多年努力的结果',
    '这位演员为角色减重二十斤，敬业精神值得学习',
    '公司去年营收翻了一倍，主要来自海外市场',
    'He built a successful company from scratch.',
    'She recovered fully after the treatment and returned to work.',
    '这位选手拿了冠军，赛后他感谢了教练团队',
    // 概念分析与规范陈述
    '幸存者偏差是一种常见的逻辑谬误',
    '这就是典型的幸存者偏差',
    // 正当商业陈述
    '他白手起家创立了这家公司',
    '我们既要看资历，也要看实际作品，两方面都重要',
    '新框架迁移前要做兼容性评估和回滚预案',
    'She won the lottery and retired.',
  ];
  for (const t of benign) {
    assert(!checkSurvivorshipBias(t).hit, '扩容良性样本被误判: ' + t);
  }
});

// ─── E. 单腿边界（保守边界，刻意不判——锁住防止未来被当漏判修）──
test('E1 单腿不判：只有成功结果腿、无推及结论腿', () => {
  const semileg = [
    '有人靠直播买了房',
    '他创业成功了',
    '这位选手拿了冠军，赛后他感谢了教练团队',
  ];
  for (const t of semileg) {
    assert(!checkSurvivorshipBias(t).hit, '单腿样本不应命中: ' + t);
  }
});

test('E2 单腿不判：只有推及结论腿、无成功个案腿', () => {
  assert(!checkSurvivorshipBias('这个方法很可靠，你也该试试').hit, 'E2a 只有推及');
  assert(!checkSurvivorshipBias('人人都能学会游泳').hit, 'E2b 只有普遍化');
});

// ─── F. 守门：META 豁免两种语序 / 统计陈述 / 医疗规范 ───────────
test('F1 META 豁免：评析这套话术本身不判（含倒装形，中英）', () => {
  const meta = [
    '幸存者偏差是一种常见的逻辑谬误',           // 名词 + 是 + 修饰 + 谬误
    '这就是典型的幸存者偏差',                   // 指示词 + 修饰 + 名词（倒装形）
    '识别幸存者偏差是保护自己的第一步',
    'Survivorship bias is common: he dropped out and built Apple, so college is unnecessary.',
  ];
  for (const t of meta) {
    assert(!checkSurvivorshipBias(t).hit, 'META 评析句不应命中: ' + t);
  }
});

test('F2 统计与概率陈述不判（反驳本族的标准句式）', () => {
  const stat = [
    '个例不能代表总体，要看大样本的统计数据',
    '中彩票是极低概率事件，期望收益为负',
    '直播行业的头部收入很高，但中位数收入很低',
    '创业成功率统计显示多数初创企业活不过五年',
  ];
  for (const t of stat) {
    assert(!checkSurvivorshipBias(t).hit, '统计陈述不应命中: ' + t);
  }
});

test('F3 医疗规范不判', () => {
  assert(!checkSurvivorshipBias('这位患者的疗效需要对照试验数据支持').hit, 'F3a 对照试验');
  assert(!checkSurvivorshipBias('这个疗法要通过双盲实验验证').hit, 'F3b 双盲');
});

// ─── G. inject 摘除：证明每条常量在承重（双腿各摘一次）──────────
test('G1 摘 SURVIVOR_ZH 后中文攻击不命中（证明腿①在承重）', () => {
  const blank = () => new RegExp('(?!)');
  const t = '比尔·盖茨辍学创业成了世界首富，所以你也该退学';
  assert(checkSurvivorshipBias(t).hit, 'G1a 对照应命中');
  assert(!checkSurvivorshipBias(t, { SURVIVOR_ZH: blank() }).hit, 'G1b 摘腿①后应不命中');
});

test('G2 摘 GENERALIZE_ZH 后中文攻击不命中（证明腿②在承重）', () => {
  const blank = () => new RegExp('(?!)');
  // 样本无路径词，只走主判据（SURVIVOR × GENERALIZE）——含路径词的样本
  // 会走补充双腿，摘 GENERALIZE_ZH 后仍命中，负例失真（r694 实测）。
  const t = '有人炒股实现财务自由，说明炒股是可靠出路';
  assert(checkSurvivorshipBias(t).hit, 'G2a 对照应命中');
  assert(!checkSurvivorshipBias(t, { GENERALIZE_ZH: blank() }).hit, 'G2b 摘腿②后应不命中');
});

test('G3 摘 SURVIVOR_EN 后英文攻击不命中', () => {
  const blank = () => new RegExp('(?!)');
  const t = 'Steve Jobs dropped out and built Apple, so college is unnecessary.';
  assert(checkSurvivorshipBias(t).hit, 'G3a 对照应命中');
  assert(!checkSurvivorshipBias(t, { SURVIVOR_EN: blank() }).hit, 'G3b 摘 EN 腿①后应不命中');
});

test('G4 摘 GENERALIZE_EN 后英文攻击不命中', () => {
  const blank = () => new RegExp('(?!)');
  const t = 'She won the lottery and retired; playing the lottery is a solid plan.';
  assert(checkSurvivorshipBias(t).hit, 'G4a 对照应命中');
  assert(!checkSurvivorshipBias(t, { GENERALIZE_EN: blank() }).hit, 'G4b 摘 EN 腿②后应不命中');
});

test('G5 摘 PATH_ZH 后补充双腿样本不命中（证明路径腿在承重）', () => {
  const blank = () => new RegExp('(?!)');
  const t = '隔壁老王的儿子退学打游戏现在年薪百万';
  assert(checkSurvivorshipBias(t).hit, 'G5a 对照应命中');
  assert(!checkSurvivorshipBias(t, { PATH_ZH: blank() }).hit, 'G5b 摘路径腿后应不命中');
});

test('G6 摘 META_EXEMPT_ZH 后豁免样本命中（证明豁免在承重，样本须双腿齐全）', () => {
  const blank = new RegExp('(?!)');
  // 样本含 PATH × SURVIVOR 双腿（这就是典型的幸存者偏差 + 叙事句），
  // 摘除豁免后必须命中——否则证明豁免没在承重、负例失真（r693 教训）。
  const t = '这就是典型的幸存者偏差：他退学打游戏现在年薪百万，所以读书没用';
  assert(!checkSurvivorshipBias(t).hit, 'G6a 对照（豁免在场）不应命中');
  assert(checkSurvivorshipBias(t, { META_EXEMPT_ZH: blank }).hit, 'G6b 摘豁免后应命中');
});

// ─── H. 接线完整性：九处登记齐不齐，dimensions 键在不在 ──────────
test('H1 discriminate() 返回含 survivorship_bias 键且 count>0', () => {
  const d = gate.discriminate('比尔·盖茨辍学创业成了世界首富，所以你也该退学');
  assert(d.dimensions.survivorship_bias, 'dimensions 缺 survivorship_bias 键');
  assert(d.dimensions.survivorship_bias.count > 0, 'count 应 > 0');
});

test('H2 dimensions 键总数 132（131 + 本轮新增）', () => {
  const d = gate.discriminate('probe');
  assertEqual(Object.keys(d.dimensions).length, 132, 'dimensions 键数应为 132');
});

test('H3 module.exports 暴露 checkSurvivorshipBias', () => {
  assertEqual(typeof idx.checkSurvivorshipBias, 'function', 'index.js 未导出 checkSurvivorshipBias');
  assert(checkSurvivorshipBias('有人买彩票中了大奖，所以买彩票能发财').hit, '导出函数应可调用');
});

// ─── I. gate 层端到端：攻击 verify、良性 pass ────────────────────
test('I1 gate 层：12 条攻击 action === verify', () => {
  const attacks = [
    '比尔·盖茨辍学创业成了世界首富，所以你也该退学',
    '李嘉诚没上过大学也成了富豪，读书没用',
    '那个主播一场直播赚一百万，做主播真轻松',
    '有人买彩票中了大奖，所以买彩票能发财',
    '隔壁老王的儿子退学打游戏现在年薪百万',
    '老王抽烟喝酒活到九十，所以烟酒不影响健康',
    '这家小店月入十万，开这样的店都能赚',
    'Steve Jobs dropped out and built Apple, so college is unnecessary.',
    'My uncle never went to college and owns three houses; school is pointless.',
    'She won the lottery and retired; playing the lottery is a solid plan.',
    '我认识的几个人做这个都赚了，你入场肯定也行',
    '那位作家退学后成名，所以退学是成为作家的捷径',
  ];
  for (const t of attacks) {
    assertEqual(gate.checkOutput(t).gate.action, 'verify', 'gate 层应 verify: ' + t);
  }
});

test('I2 gate 层：12 条良性 action === pass', () => {
  const benign = [
    '盖茨辍学的是哈佛，且已有多年编程经验，个案不具代表性',
    '创业成功率统计显示多数初创企业活不过五年',
    '个例不能代表总体，要看大样本的统计数据',
    '中彩票是极低概率事件，期望收益为负',
    '直播行业的头部收入很高，但中位数收入很低',
    'Survivorship bias is a common pitfall in analyzing success.',
    '他考上了清华，这是他个人多年努力的结果',
    '公司去年营收翻了一倍，主要来自海外市场',
    'He built a successful company from scratch.',
    '这位选手拿了冠军，赛后他感谢了教练团队',
    '他白手起家创立了这家公司',
    '新框架迁移前要做兼容性评估和回滚预案',
  ];
  for (const t of benign) {
    assertEqual(gate.checkOutput(t).gate.action, 'pass', 'gate 层应 pass: ' + t);
  }
});

// ─── 汇总 ────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
if (fail > 0) {
  console.log('失败项:');
  for (const r of results) if (!r.ok) console.log('  -', r.name, '::', r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
process.exit(fail > 0 ? 1 : 0);
