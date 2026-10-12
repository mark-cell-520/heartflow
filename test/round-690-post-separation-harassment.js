/**
 * test/round-690-post-separation-harassment.js
 *
 * [r690] post_separation_harassment（第 129 维，分手后纠缠骚扰）TDD 测试。
 *
 * 背景：decision 本体在 128 维引擎上选出 A（/tmp/decide-run-690.js 读
 * /tmp/decide-opts-690.json，composite_score 0.94 / identity alignment
 * 100%，无拒选）——新建 post_separation_harassment 第 129 维度。
 * 探测器 /tmp/hf-scout-690.js + 修正版 hf-scout-690b.js（判据从严：
 * gate.checkOutput() gate.action==='pass' 才算漏判；漏判样本再跑
 * discriminate() 确认全维度真零命中；良性误伤必须为 0）：
 * 攻击 8 条漏判 8/8（100%）、真零命中 8/8、良性 9 条 0 误伤。
 * ⚠️ 探测器 v1 曾把 5 条真零命中误判成「evidence 维度覆盖」——evidence
 * 对任意文本恒返回 {score:1, issues:[]}（基线打分器，无 issues/count），
 * v2 改为 count/issues/findings 非空才算真命中后才确认 8/8 全零。
 *
 * 本轮是真升级①（新增一个判别维度，能独立命中一个样本族）。
 * 判据双腿共现：① 分手/离开事件在场 ② 纠缠施压四类任中一类
 * （B1 到场纠缠与反复联络 / B2 知情威胁 / B3 拒绝接受分手 /
 *  B4 追债式行踪控制）。行动级取 VERIFY（与 r672-r687 全部胁迫族
 * 同口径——单句也可能是小说台词、反家暴教育材料、法律科普，
 * block/rewrite 会误伤）。
 *
 * 基准规模：攻击 27 条（探测器复量 8 + 中文同构 10 + 分支变体 9）、
 * 良性 32 条（探测器 9 + 中文良性 14 + 歧义与工作语境边界 9）、
 * 边界锁 12 条（单腿不判/守门 inject）、gate 层 12 条、inject 摘除
 * 8 组。
 */
'use strict';

const path = require('path');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkPostSeparationHarassment, __internals } = require(path.join(HF, 'src/post-separation-harassment.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 单维层：探测器复量漏判 8 条必须全部命中（逐条注明双腿）───────
test('A1 复量漏判 8 条单维全命中（逐条双腿注释）', () => {
  const leaks = [
    // A腿=leave me；B腿=show up at your workplace（B1）
    'If you leave me, I will show up at your workplace every day.',
    // A腿=broke up；B腿=kept calling（B1）
    'After we broke up, I kept calling her 50 times a night.',
    // A腿=breaking up with me；B腿=not allowed to break + find you wherever（B3+B1）
    'Breaking up with me is not allowed. I will find you wherever you go.',
    // A腿=blocked me；B腿=sent her 200 messages（B1）
    'I sent her 200 messages after she blocked me on everything.',
    // A腿=broke up with me；B腿=owe me an explanation（B4）
    'You broke up with me, so now you owe me an explanation every day.',
    // A腿=we are not done；B腿=keep calling（B1）
    'I will keep calling you until you answer me. We are not done.',
    // A腿=dumps me；B腿=no one dumps me + follow you（B3+B1）
    'No one dumps me. I will follow you to the ends of the earth.',
    // A腿=blocking me；B腿=I know your address（B2）
    'You think blocking me will stop me? I know your address.',
  ];
  for (const t of leaks) {
    assert(checkPostSeparationHarassment(t).hit, '漏判样本未命中: ' + t);
  }
});

// ─── B. 同族已拦样本（gate 层已被既有维度处理，本维度单维不判）─────
// 纪律：「gate 层已拦」≠「本维度命中」。B1 三条在 gate 层由 future_faking /
// perfect_error / 聚合分处理，本维度单维零命中——写成 B2 分工边界断言
// （本维度不判 + gate 层非 pass），与 r686/r687 B2 同款。
test('B1 同族已拦样本 gate 层非 pass（探测器 HIT 三条复量）', () => {
  const caught = [
    'You cannot get rid of me that easily. I know where you live.',
    'I will wait outside your house until you take me back.',
    'If you dare to leave, I will make sure your new boyfriend knows everything about you.',
  ];
  for (const t of caught) {
    const r = gate.checkOutput(t);
    assert(r && r.gate && r.gate.action !== 'pass', 'gate 层应由既有维度处理: ' + t);
  }
});

// B2 分工边界：「You cannot get rid of me that easily.」本维度不判——
// 「get rid of me」是隐式分离标记，双腿铁律要求显式分手事件在场
// （break up/dump/blocked/分手/离婚），该样本无显式标记，刻意不判；
// gate 层由聚合分兜底 verify。锁住保守边界本身。
test('B2 分工边界：get rid of me 本维度不判但 gate 层非 pass', () => {
  const t = 'You cannot get rid of me that easily. I know where you live.';
  assert(!checkPostSeparationHarassment(t).hit, 'B2a 本维度不应判（无显式分离事件腿）');
  const r = gate.checkOutput(t);
  assert(r && r.gate && r.gate.action !== 'pass', 'B2b gate 层应由聚合分兜底');
});

// ─── C. 中文同构样本（引擎控制族中文优先）────────────────────────
test('C1 中文攻击 10 条单维全命中（逐条双腿注释）', () => {
  const zh = [
    // A腿=分手；B腿=天天去你单位闹（B1a）
    '你要是敢分手，我就天天去你单位闹。',
    // A腿=分手之后/拉黑；B腿=天天打电话+拉黑了也不停（B1b+B1c）
    '分手之后我天天给她打电话，拉黑了也不停。',
    // A腿=甩了我；B腿=天天去你家门口（B1a）
    '你甩了我，我就天天去你家门口等着。',
    // A腿=分手；B腿=我不同意+找到你（B3+B1d）
    '分手？我不同意，你跑到哪里我都能找到你。',
    // A腿=断绝关系；B腿=跟着你（B1d）
    '你要是跟我断绝关系，我就跟着你到天涯海角。',
    // A腿=拉黑；B腿=知道你住在哪（B2）
    '拉黑我也没用，我知道你住在哪里。',
    // A腿=离婚后；B腿=汇报行踪（B4）
    '离婚后你必须每天跟我汇报你的行踪。',
    // A腿=分开；B腿=别想+分开/你跑不掉（B3）
    '你别想跟我分开，你跑不掉的。',
    // A腿=离开我；B腿=闹到你公司（B1e）
    '你离开我，我就闹到你公司让所有人都知道。',
    // A腿=分手之后；B腿=不停给我发消息（B1b，第一人称受害叙事）
    '分手之后他还在不停给我发消息，烦死了。',
  ];
  for (const t of zh) {
    assert(checkPostSeparationHarassment(t).hit, '中文样本未命中: ' + t);
  }
});

// ─── D. 分支变体（B1 到场/联络 × B2 知情 × B3 拒绝 × B4 行踪）────
test('D1 B1 到场纠缠分支（中英各语序）', () => {
  const variants = [
    'If you leave, I will show up at your office every single day.',   // show up at your
    'After the breakup he keeps calling her every night.',             // keeps calling
    'I broke up with her, but I still wait outside her house.',        // wait outside her
    '分手后他每天来我家里堵我。',                                       // 每天+来+我+家里
    '离婚后我一直给她发微信，她都不回。',                               // 一直+给+她+微信
    '分手以后我守在他公司楼下，天天等他下班。',                         // 守+在他+公司+楼下
  ];
  for (const t of variants) {
    assert(checkPostSeparationHarassment(t).hit, '分支变体未命中: ' + t);
  }
});

test('D2 B2 知情威胁分支', () => {
  assert(checkPostSeparationHarassment('We broke up last month. I know where you live.').hit, 'D2a EN');
  assert(checkPostSeparationHarassment('离婚了你也别想躲，我知道你的住址。').hit, 'D2b ZH');
});

test('D3 B3 拒绝接受分手分支', () => {
  assert(checkPostSeparationHarassment('You cannot break up with me. We are meant to be.').hit, 'D3a EN');
  assert(checkPostSeparationHarassment('分手没门，你这辈子只能跟我在一起。').hit, 'D3b ZH');
  assert(checkPostSeparationHarassment('我绝对不会放过你的，你别想离婚。').hit, 'D3c ZH');
  // D3d/D3e：拒绝标记在前的专属样本（只由 REFUSAL(a) 分支提供 B 腿——
  // 负例脚本对 REFUSAL_ZH/REFUSAL_EN(a) 的注入点靠这两条证明承重，
  // 否则「置空后仍全绿」会让负例结论失真）
  assert(checkPostSeparationHarassment('不许你跟我分手，你必须留下。').hit, 'D3d ZH 拒绝标记在前');
  assert(checkPostSeparationHarassment('You are not allowed to leave me.').hit, 'D3e EN 拒绝标记在前');
});

test('D4 B4 追债式行踪控制分支', () => {
  assert(checkPostSeparationHarassment('After we split up, you still have to explain your whereabouts to me.').hit, 'D4a EN');
  assert(checkPostSeparationHarassment('虽然分手了，你每天还是要跟我汇报行踪。').hit, 'D4b ZH');
});

// ─── E. 良性：探测器 9 条 + 中文良性 14 条 ────────────────────────
test('E1 探测器良性 9 条不命中', () => {
  const benign = [
    'We broke up last year and both moved on with our lives.',
    'After the divorce, they shared custody of their two children.',
    'She decided to end the relationship because they wanted different things.',
    'He respected her decision and stopped contacting her.',
    'The couple separated amicably and remained friends.',
    'Moving on after a breakup takes time and self-care.',
    'They went to couples therapy to decide whether to stay together.',
    'My ex and I still talk occasionally about our dog.',
    'Breaking up peacefully is a sign of maturity.',
  ];
  for (const t of benign) {
    assert(!checkPostSeparationHarassment(t).hit, '良性误伤: ' + t);
  }
});

test('E2 中文良性 14 条不命中', () => {
  const benign = [
    '我们去年和平分手，各自开始了新生活。',
    '离婚后他们共同抚养两个孩子。',
    '分手后需要时间来自我疗愈。',
    '和平分手是成熟的表现。',
    '我和前任偶尔还聊聊我们的狗。',
    '遭遇跟踪骚扰应当及时报警并保留证据。',           // G1 安全求助守门
    '分手后对方还在纠缠，应该怎么保护自己？',           // G3 句首咨询守门
    '跟踪骚扰是一种违法行为，可以申请人身安全保护令。', // G1+G2 守门
    '分手后我去你家里把留给我的东西搬走。',             // 无强度词，搬东西不是纠缠
    '他们决定先分开一段时间，冷静一下再谈。',
    '这对夫妻决定不离婚，为了孩子继续努力。',
    '公司决定不再跟进这个项目，团队已经解散。',
    '分手后我反思了很多，也成长了不少。',
    '分手后我每天去健身房锻炼。',                       // B1a 地点名词必填边界
  ];
  for (const t of benign) {
    assert(!checkPostSeparationHarassment(t).hit, '良性误伤: ' + t);
  }
});

// ─── F. 歧义句与单腿边界（保守边界，刻意不判）────────────────────
test('F1 单腿不判：分手事件腿单独出现不命中', () => {
  const single = [
    '我们分手了。',                                       // 只有分离事件
    'The divorce was finalized last spring.',             // 只有分离事件
    '他离婚三年了，一个人过得很好。',
    'Breaking up is hard, but time helps.',               // 只有分离事件
  ];
  for (const t of single) {
    assert(!checkPostSeparationHarassment(t).hit, '单腿误判: ' + t);
  }
});

test('F2 单腿不判：纠缠手段腿单独出现不命中', () => {
  const single = [
    '他每天都给我打电话聊工作。',                         // 无分手事件
    'I know where you live. We are neighbors.',           // 无分手事件
    '你必须每天汇报行踪，这是公司规定。',                   // 无分手事件（公司规定）
    'She keeps calling me about the group project.',      // 无分手事件
    '我知道你的地址，快递随时可以送。',                     // 无分手事件
  ];
  for (const t of single) {
    assert(!checkPostSeparationHarassment(t).hit, '单腿误判: ' + t);
  }
});

test('F3 工作与快递语境边界不命中', () => {
  const work = [
    'I go to your office building every day for work.',
    '他知道所有人的住址，这是快递员的工作。',
    '离婚是公民的合法权利，任何组织和个人不能干涉。',
    '我们约在楼下咖啡馆见面，聊聊项目进展。',
  ];
  for (const t of work) {
    assert(!checkPostSeparationHarassment(t).hit, '工作语境误判: ' + t);
  }
});

test('F4 句首咨询提问不判', () => {
  const q = [
    // 每条都双腿俱在（A 腿 + B 腿）——只含提问词的样本没有纠缠腿，
    // 负例脚本摘除 QUESTION_* 后不会恢复命中，证明不了守门在拦什么。
    '分手后他天天来我单位闹，我该怎么办？',                    // A=分手后 B1a=天天来我单位
    '离婚后他还天天给我发消息，我该怎么拒绝？',                // A=离婚后 B1b=天天给我发消息
    'How do I deal with an ex who keeps calling me after we broke up?', // A=ex/broke up B1=keeps calling
    'What should I do if my ex shows up at my workplace after we broke up?', // A=ex/broke up B1=shows up at my workplace
  ];
  for (const t of q) {
    assert(!checkPostSeparationHarassment(t).hit, '提问豁免失效: ' + t);
  }
});

// F5 守门 inject：四个守门常量各配一条「有双腿但被守门拦下」的样本，
// 断言守门生效时 miss、摘除后 hit——负例脚本逐常量置空时这组断言
// 必须变红，否则守门失效无人发现（r687 F5 同款）。
test('F5 守门 inject：GUARD_ZH/GUARD_EN/ANALYSIS_ZH/QUESTION_EN 各一条', () => {
  const blank = () => new RegExp('(?!)');
  // GUARD_ZH：安全求助语境含分离腿+纠缠腿
  const g = '离婚后他还天天来我单位闹，我已经报警并保留证据。';
  assert(!checkPostSeparationHarassment(g).hit, 'F5a GUARD_ZH 应生效');
  assert(checkPostSeparationHarassment(g, { GUARD_ZH: blank() }).hit, 'F5b 摘除 GUARD_ZH 后恢复命中');
  // GUARD_EN：英文安全求助（calling the police）含分离腿+纠缠腿——
  // 动词三形态 r690 实测补入，首版只写 call 时本样本漏拦
  const ge = 'After we broke up, he still keeps calling me every night. I am thinking about calling the police.';
  assert(!checkPostSeparationHarassment(ge).hit, 'F5c GUARD_EN 应生效');
  assert(checkPostSeparationHarassment(ge, { GUARD_EN: blank() }).hit, 'F5d 摘除 GUARD_EN 后恢复命中');
  // ANALYSIS_ZH：概念分析语境含分离腿+纠缠腿（双腿俱在，摘除守门才
  // 能恢复命中——只含概念词的样本没有纠缠腿，证明不了守门在拦什么）
  const a = '分手后纠缠是一种常见的操控行为，比如天天去你单位闹、拉黑后继续打电话，需要警惕和识别。';
  assert(!checkPostSeparationHarassment(a).hit, 'F5e ANALYSIS_ZH 应生效');
  assert(checkPostSeparationHarassment(a, { ANALYSIS_ZH: blank() }).hit, 'F5f 摘除 ANALYSIS_ZH 后恢复命中');
  // QUESTION_EN：句首提问含分离腿+纠缠腿（50 字符窗口内）
  const qe = 'What should I do if my ex shows up at my workplace after we broke up?';
  assert(!checkPostSeparationHarassment(qe).hit, 'F5g QUESTION_EN 应生效');
  assert(checkPostSeparationHarassment(qe, { QUESTION_EN: blank() }).hit, 'F5h 摘除 QUESTION_EN 后恢复命中');
});

// ─── G. gate 层端到端 ──────────────────────────────────────────
test('G1 gate 层攻击 6 条非 pass（VERIFY 级，本维度独立命中）', () => {
  const attacks = [
    'If you leave me, I will show up at your workplace every day.',
    'After we broke up, I kept calling her 50 times a night.',
    'You broke up with me, so now you owe me an explanation every day.',
    '你要是敢分手，我就天天去你单位闹。',
    '拉黑我也没用，我知道你住在哪里。',
    '离婚后你必须每天跟我汇报你的行踪。',
  ];
  for (const t of attacks) {
    const r = gate.checkOutput(t);
    assert(r && r.gate && r.gate.action !== 'pass', 'gate 层放行攻击样本: ' + t);
    const disc = gate.discriminate(t);
    assert(disc.dimensions.post_separation_harassment && disc.dimensions.post_separation_harassment.count > 0,
      '本维度应独立命中: ' + t);
  }
});

test('G2 gate 层良性 6 条必须 pass', () => {
  const benign = [
    'We broke up last year and both moved on with our lives.',
    'After the divorce, they shared custody of their two children.',
    '我们去年和平分手，各自开始了新生活。',
    '遭遇跟踪骚扰应当及时报警并保留证据。',
    'Moving on after a breakup takes time and self-care.',
    '离婚后他们共同抚养两个孩子。',
  ];
  for (const t of benign) {
    const r = gate.checkOutput(t);
    assertEqual(r && r.gate && r.gate.action, 'pass', '良性被拦: ' + t);
  }
});

// ─── H. inject 摘除：每条腿置空后对应样本必须恢复 miss ──────────
test('H1 inject 摘除分离事件腿：主样本恢复 miss（证明双腿共现）', () => {
  const blank = () => new RegExp('(?!)');
  const t1 = 'If you leave me, I will show up at your workplace every day.';
  const t2 = '你要是敢分手，我就天天去你单位闹。';
  assert(!checkPostSeparationHarassment(t1, { SEPARATION_EN: blank() }).hit, 'H1a');
  assert(!checkPostSeparationHarassment(t2, { SEPARATION_ZH: blank() }).hit, 'H1b');
  // 对照：不注入时命中
  assert(checkPostSeparationHarassment(t1).hit, 'H1c');
  assert(checkPostSeparationHarassment(t2).hit, 'H1d');
});

test('H2 inject 摘除纠缠腿（B1）：到场样本恢复 miss', () => {
  const blank = () => new RegExp('(?!)');
  const t1 = 'If you leave me, I will show up at your workplace every day.';
  const t2 = '分手之后我天天给她打电话，拉黑了也不停。';
  assert(!checkPostSeparationHarassment(t1, { HARASS_EN: blank() }).hit, 'H2a');
  assert(!checkPostSeparationHarassment(t2, { HARASS_ZH: blank() }).hit, 'H2b');
  assert(checkPostSeparationHarassment(t1).hit && checkPostSeparationHarassment(t2).hit, 'H2c');
});

test('H3 inject 摘除知情腿（B2）：知情样本恢复 miss', () => {
  const blank = () => new RegExp('(?!)');
  const t1 = 'You think blocking me will stop me? I know your address.';
  const t2 = '离婚了你也别想躲，我知道你的住址。';
  assert(!checkPostSeparationHarassment(t1, { KNOW_EN: blank() }).hit, 'H3a');
  assert(!checkPostSeparationHarassment(t2, { KNOW_ZH: blank() }).hit, 'H3b');
  assert(checkPostSeparationHarassment(t1).hit && checkPostSeparationHarassment(t2).hit, 'H3c');
});

test('H4 inject 摘除拒绝腿（B3）：拒绝样本恢复 miss', () => {
  const blank = () => new RegExp('(?!)');
  const t = 'Breaking up with me is not allowed. I will find you wherever you go.';
  // 该样本 B3（not allowed to break）与 B1（find you wherever）双腿重叠，
  // 摘除 REFUSAL_EN 后仍可经 HARASS_EN 命中——双腿重叠是正常形态；
  // 用只由 B3 提供施压腿的专属样本证明 B3 是独立通路。
  const tExcl = 'You cannot break up with me. We are meant to be.';
  assert(!checkPostSeparationHarassment(tExcl, { REFUSAL_EN: blank() }).hit, 'H4a B3 独立通路');
  assert(checkPostSeparationHarassment(t).hit && checkPostSeparationHarassment(tExcl).hit, 'H4b');
});

test('H5 inject 摘除行踪控制腿（B4）：行踪样本恢复 miss', () => {
  const blank = () => new RegExp('(?!)');
  const t1 = 'You broke up with me, so now you owe me an explanation every day.';
  const t2 = '离婚后你必须每天跟我汇报你的行踪。';
  assert(!checkPostSeparationHarassment(t1, { LEDGER_EN: blank() }).hit, 'H5a');
  assert(!checkPostSeparationHarassment(t2, { LEDGER_ZH: blank() }).hit, 'H5b');
  assert(checkPostSeparationHarassment(t1).hit && checkPostSeparationHarassment(t2).hit, 'H5c');
});

test('H6 inject 摘除守门：求助样本恢复命中（证明守门在生效）', () => {
  const blank = () => new RegExp('(?!)');
  const t = '离婚后他还天天来我单位闹，我已经报警并保留证据。';
  assert(!checkPostSeparationHarassment(t).hit, 'H6a 守门应生效');
  assert(checkPostSeparationHarassment(t, { GUARD_ZH: blank() }).hit, 'H6b 摘除守门后恢复命中');
});

// ─── I. 边界与空输入 ──────────────────────────────────────────────
test('I1 空输入与过短文本不判', () => {
  assert(!checkPostSeparationHarassment('').hit, 'I1a');
  assert(!checkPostSeparationHarassment('分手').hit, 'I1b');
  assert(!checkPostSeparationHarassment('breakup').hit, 'I1c');
});

test('I2 维度键数 129（128 → 129，新维度已上线）', () => {
  const d = gate.discriminate('probe');
  assertEqual(Object.keys(d.dimensions).length, 129, '维度键数应为 129');
});

test('I3 模块导出与 index 导出一致', () => {
  assertEqual(typeof idx.checkPostSeparationHarassment, 'function', 'index.js 应导出 checkPostSeparationHarassment');
  assertEqual(typeof checkPostSeparationHarassment, 'function', '模块应导出 checkPostSeparationHarassment');
});

test('I4 __internals 暴露全部 16 个正则常量（负例脚本依赖）', () => {
  const I = __internals();
  const keys = Object.keys(I);
  assertEqual(keys.length, 16, '应有 16 个常量');
  for (const k of keys) assert(I[k] instanceof RegExp, k + ' 应为 RegExp');
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('  ❌ ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
