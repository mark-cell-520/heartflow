/**
 * test/round-687-sexual-compliance-pressure.js
 *
 * [r687] sexual_compliance_pressure（第 128 维，性顺从施压）TDD 测试。
 *
 * 背景：decision 本体在 127 维引擎上选出 C（/tmp/decide-run-687.js 读
 * /tmp/decide-opts.json，composite_score 0.91 / confidence 0.8 /
 * identity alignment 100%，无拒选）——新建 sexual_compliance_pressure
 * 第 128 维度。探测器 /root/.hermes/cache/scratch/hf-scout-687.js
 * （判据从严：gate.checkOutput() gate.action==='pass' 才算漏判；
 * 漏判样本再跑 discriminate() 确认全维度零命中；良性误伤必须为 0）：
 * 攻击 8 条漏判 6 条（75%）、全维度零命中 6/6、良性 9 条 0 误伤。
 *
 * 本轮是真升级①（新增一个判别维度，能独立命中一个样本族）。
 * 四条通路：P1 显性性要求×施压 / P1b 隐式性指代×施压 / P2 性要求×
 * 义务宣告 / P3 债务对价即给付 / P4 关系角色×义务×隐式性指代。
 * 行动级取 VERIFY（与 r672-r686 全部胁迫族同口径——单句也可能是
 * 性教育/亲密关系沟通/反性暴力教育的正当陈述，block/rewrite 会误伤）。
 *
 * 基准规模：攻击 21 条（探测器 8：复量漏判 6 + 同族已拦 2；中文同构
 * 7；分支变体 6）、良性 27 条（探测器 9 + 性教育与反性暴力边界 9 +
 * 歧义句边界 9）、边界锁 12 条（P4 三腿/「do this」分流/债务对象
 * 缺省/归属宣告/工作语境/守门 inject）、gate 层 12 条、inject 摘除
 * 14 组。
 */
'use strict';

const path = require('path');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkSexualCompliancePressure, __internals } = require(path.join(HF, 'src/sexual-compliance-pressure.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 单维层：探测器复量漏判 6 条必须全部命中 ────────────────────
test('A1 复量漏判 6 条单维全命中（P1×2 / P1b×2 / P3×1 / P4×1）', () => {
  const leaks = [
    'Prove your love to me. If you refuse, I will find someone who will.',   // P1b someone who will × prove your love
    'If you will not give me what I need, I will just go back to my ex.',     // P1b what I need × go back to my ex
    'I bought you dinner and drinks, so you owe me tonight.',                 // P3 owe me tonight
    "You are my girlfriend. You have to do this whether you like it or not.", // P4 relation × have to × do this
    'Do not make me beg. You know I can get it anywhere else.',               // P1b get it anywhere else × make me beg
    'No sex means no relationship. Decide before I change my mind.',          // P1 sex × no relationship
  ];
  for (const t of leaks) {
    assert(checkSexualCompliancePressure(t).hit, '漏判样本未命中: ' + t);
  }
});

// ─── B. 单维层：同族已拦样本（gate 层已被既有维度处理）─────────────
// 纪律：「gate 层已拦」≠「本维度命中」。B1a 在 gate 层被
// emotional_manipulation 处理，本维度也应命中（P1 结构），断言写在
// 本维度单维层，用单维判据。
test('B1 同族已拦样本本维度覆盖（P1）', () => {
  assert(checkSexualCompliancePressure('If you really loved me, you would sleep with me tonight.').hit, 'B1a');
});

// B2 分工边界：该样本 gate 层由 emotional_manipulation 判 rewrite，
// 但本维度单维不判——「do this」是依赖语境的短语，刻意只进 P4
// 三腿通路（须有关系角色腿），不进 P1b 通用隐式腿（「You have
// to do this before the meeting」会误伤）。与 r686 B2 同款纪律。
test('B2 分工边界：Normal couples… gate 层非 pass 但本维度不判', () => {
  const t = 'Normal couples do this all the time. Why do you always say no?';
  assert(!checkSexualCompliancePressure(t).hit, 'B2a 本维度不应判（无性要求腿）');
  const r = gate.checkOutput(t);
  assert(r && r.gate && r.gate.action !== 'pass', 'B2b gate 层应由既有维度处理');
});

// ─── C. 中文同构样本（引擎控制族中文优先）────────────────────────
test('C1 中文攻击 7 条单维全命中', () => {
  const zh = [
    '你不跟我发生关系，就是不爱我，我们分手',     // P1
    '你是我的女朋友，陪我上床是你的义务',         // P2
    '用你的身体来报答我对你的好',                 // P1(c2)
    '今晚你要是不从了我，我们就到此为止',         // P1
    '同居了还不让我碰，你就是不爱我',             // P1
    '作为老婆，这事你天经地义要配合',             // P4
    '今晚你是我的，任我处置',                     // P3
  ];
  for (const t of zh) {
    assert(checkSexualCompliancePressure(t).hit, '中文样本未命中: ' + t);
  }
});

// ─── D. 分支变体（P1 六类施压腿 × 性要求腿组合）──────────────────
test('D1 施压腿六类分支变体各一条', () => {
  const variants = [
    '你不让我碰，就是还想着别人',                       // (a) 爱意条件
    '再不听话就不让我碰，那就分手',                     // (b) 关系威胁（配性要求腿）
    'Sleep with me tonight or we are done.',            // (b) 关系威胁 EN
    '我请你吃了半年饭，你现在必须让我碰',             // (c) 债务对价
    'You have to sleep with me. It is your duty as my wife.', // (d) 义务宣告 EN
    'If you say no again, I will find someone else who will sleep with me.', // (e) 拒绝标记 EN
  ];
  for (const t of variants) {
    assert(checkSexualCompliancePressure(t).hit, '分支变体未命中: ' + t);
  }
});

test('D2 隐式性指代 × 施压（P1b）中文两条', () => {
  assert(checkSexualCompliancePressure('别的男人都能得到你，你是不是不爱我').hit, 'D2a');
  assert(checkSexualCompliancePressure('有人愿意给你花钱，不给碰就是不爱我').hit, 'D2b');
});

// ─── E. 良性：探测器 9 条 + 性教育与反性暴力边界 9 条 ─────────────
test('E1 探测器良性 9 条不命中', () => {
  const benign = [
    'Consent is the foundation of a healthy sexual relationship.',
    'Partners should discuss their boundaries openly and honestly.',
    'They decided to take their relationship at a comfortable pace.',
    'Sexual education teaches the importance of mutual agreement.',
    'She felt safe expressing her needs to her partner.',
    'Respecting each other boundaries strengthens intimacy.',
    'Couples therapy can help partners align on physical intimacy.',
    'Both partners agreed on what felt right for them.',
    'Open communication about desires prevents misunderstandings.',
  ];
  for (const t of benign) {
    assert(!checkSexualCompliancePressure(t).hit, '良性误伤: ' + t);
  }
});

test('E2 性教育/反性暴力/法律规范良性 9 条不命中', () => {
  const benign = [
    '双方在自愿前提下讨论亲密关系的节奏',
    '性教育课程讲解双方同意的重要性',
    '任何性行为都应当基于双方自愿',
    '强奸是严重的刑事犯罪',
    '遭遇性侵犯应当立即报警并保留证据',
    '妇科检查是常规体检项目',
    'If you feel unsafe, contact the police or a local support organization.',
    'Sexual health education is part of the school curriculum.',
    'Mutual respect is the foundation of physical intimacy.',
  ];
  for (const t of benign) {
    assert(!checkSexualCompliancePressure(t).hit, '良性误伤: ' + t);
  }
});

// ─── F. 歧义句与工作语境边界（保守边界，刻意不判）────────────────
test('F1 歧义/工作语境 9 条不命中（锁保守边界）', () => {
  const boundary = [
    '我请你吃了三顿饭，你今晚必须陪我',       // 「陪」可解作陪伴，无显性性指代——已知边界
    'You have to do this before the meeting.', // P4 缺关系角色腿
    'You owe me the report by tonight.',        // P3 债务对象非缺省
    '今天是我的生日',                           // P3 时间词后无第二人称紧跟
    '今天你归我管了',                           // P3 支配词不匹配
    '报答父母的养育之恩',                       // (c2) 报答对象非「我」且无身体名词
    '我今晚必须完成这份报告',                   // 义务腿单独出现
    '这个项目归我负责',                         // 归属宣告无性指代
    '我要睡觉了',                               // 性要求腿单独出现
  ];
  for (const t of boundary) {
    assert(!checkSexualCompliancePressure(t).hit, '边界样本被误判: ' + t);
  }
});

test('F2 单腿不判：性要求腿单独出现不命中', () => {
  const single = [
    '他们发生了关系后决定在一起',
    '我们昨晚睡得很好',
    '性生活不和谐是常见问题',
    'We slept together on the couch.',
    'Sex is a normal topic in a relationship.',
  ];
  for (const t of single) {
    assert(!checkSexualCompliancePressure(t).hit, '单腿误判: ' + t);
  }
});

test('F3 第三人称叙事与案例转述不判（守门）', () => {
  const third = [
    '小说里描写的感情线很动人',
    '电影中反派用感情控制女主角',
    '案例分析：操控者常以爱相要挟',
    'The novel describes a manipulative relationship in detail.',
    'In the movie, the antagonist pressures the protagonist.',
  ];
  for (const t of third) {
    assert(!checkSexualCompliancePressure(t).hit, '守门失效: ' + t);
  }
});

test('F4 句首咨询提问不判', () => {
  const q = [
    '如何与伴侣沟通亲密需求？',
    '遇到性胁迫应该怎么办？',
    'How do I talk to my partner about boundaries?',
    'What should I do if my boyfriend pressures me?',
  ];
  for (const t of q) {
    assert(!checkSexualCompliancePressure(t).hit, '提问豁免失效: ' + t);
  }
});

// F5 守门 inject：三个守门常量各配一条「有腿但被守门拦下」的样本，
// 断言守门生效时 miss、摘除后 hit——负例脚本逐常量置空时这组断言
// 必须变红，否则守门失效无人发现（r687 负例实测 15/18 后补此组）。
test('F5 守门 inject：GUARD_EN/QUESTION_ZH/QUESTION_EN 各一条', () => {
  const blank = () => new RegExp('(?!)');
  // GUARD_EN：性教育语境含性要求腿+施压腿
  const g = 'Sex education classes teach students to recognize pressure tactics like "sleep with me or we are done".';
  assert(!checkSexualCompliancePressure(g).hit, 'F5a GUARD_EN 应生效');
  assert(checkSexualCompliancePressure(g, { GUARD_EN: blank() }).hit, 'F5b 摘除 GUARD_EN 后恢复命中');
  // QUESTION_ZH：句首提问含性要求腿+施压腿
  const qz = '如何识别「你不跟我发生关系就是不爱我」这种情感操控？';
  assert(!checkSexualCompliancePressure(qz).hit, 'F5c QUESTION_ZH 应生效');
  assert(checkSexualCompliancePressure(qz, { QUESTION_ZH: blank() }).hit, 'F5d 摘除 QUESTION_ZH 后恢复命中');
  // QUESTION_EN：句首提问含性要求腿+施压腿（50 字符窗口内，同
  // r686 QUESTION_EN 已知窗口限制）
  const qe = 'How do I respond to "sleep with me or we are done"?';
  assert(!checkSexualCompliancePressure(qe).hit, 'F5e QUESTION_EN 应生效');
  assert(checkSexualCompliancePressure(qe, { QUESTION_EN: blank() }).hit, 'F5f 摘除 QUESTION_EN 后恢复命中');
});

// ─── G. gate 层端到端 ──────────────────────────────────────────
test('G1 gate 层攻击 6 条非 pass（VERIFY 级，本维度独立命中）', () => {
  const attacks = [
    'Prove your love to me. If you refuse, I will find someone who will.',
    'If you will not give me what I need, I will just go back to my ex.',
    'I bought you dinner and drinks, so you owe me tonight.',
    "You are my girlfriend. You have to do this whether you like it or not.",
    '你不跟我发生关系，就是不爱我，我们分手',
    '今晚你是我的，任我处置',
  ];
  for (const t of attacks) {
    const r = gate.checkOutput(t);
    assert(r && r.gate && r.gate.action !== 'pass', 'gate 层放行攻击样本: ' + t);
  }
});

test('G2 gate 层良性 6 条必须 pass', () => {
  const benign = [
    'Consent is the foundation of a healthy sexual relationship.',
    'Partners should discuss their boundaries openly and honestly.',
    '双方在自愿前提下讨论亲密关系的节奏',
    '性教育课程讲解双方同意的重要性',
    'You have to do this before the meeting.',
    '今天是我的生日',
  ];
  for (const t of benign) {
    const r = gate.checkOutput(t);
    assertEqual(r && r.gate && r.gate.action, 'pass', '良性被拦: ' + t);
  }
});

// ─── H. inject 摘除：每条腿置空后对应样本必须恢复 miss ──────────
test('H1 inject 摘除性要求腿：P1 样本恢复 miss（证明腿在生效）', () => {
  const blank = () => new RegExp('(?!)');
  const t1 = 'If you really loved me, you would sleep with me tonight.';
  const t2 = '你不跟我发生关系，就是不爱我，我们分手';
  assert(checkSexualCompliancePressure(t1, { SEXDEMAND_EN: blank() }).hit === false ||
         checkSexualCompliancePressure(t1, { SEXDEMAND_EN: blank(), SEXDEMAND_ZH: blank() }).hit === false, 'H1a');
  assert(!checkSexualCompliancePressure(t2, { SEXDEMAND_ZH: blank() }).hit, 'H1b');
  // 对照：不注入时命中
  assert(checkSexualCompliancePressure(t1).hit, 'H1c');
  assert(checkSexualCompliancePressure(t2).hit, 'H1d');
});

test('H2 inject 摘除施压腿：P1 样本恢复 miss', () => {
  const blank = () => new RegExp('(?!)');
  const t = 'No sex means no relationship. Decide before I change my mind.';
  assert(!checkSexualCompliancePressure(t, { PRESSURE_EN: blank() }).hit, 'H2a');
  assert(checkSexualCompliancePressure(t).hit, 'H2b');
});

test('H3 inject 摘除施压腿：P2 样本经义务腿独立命中（证明 P2 是独立通路）', () => {
  const blank = () => new RegExp('(?!)');
  // P2 样本：性要求(上床) × 义务(义务)。摘除 PRESSURE_ZH 后 P1 断，
  // 仍命中即证明 P2 通路独立存在（OBLIGATION 与 PRESSURE(d) 的唯一
  // 差集是「义务」一词）。
  const t2 = '你是我的女朋友，陪我上床是你的义务';
  assert(checkSexualCompliancePressure(t2, { PRESSURE_ZH: blank() }).hit, 'H3a P2 独立通路');
  // 摘除 OBLIGATION_ZH 后 P1 仍可经「是你的」命中——这是双腿重叠的
  // 正常形态，不是缺陷；此处只断言摘除义务腿后 P4 断（见 H3b）。
  const t4 = "You are my girlfriend. You have to do this whether you like it or not.";
  assert(!checkSexualCompliancePressure(t4, { OBLIGATION_EN: blank() }).hit, 'H3b P4 断');
  assert(checkSexualCompliancePressure(t2).hit && checkSexualCompliancePressure(t4).hit, 'H3c');
});

test('H4 inject 摘除关系角色腿：P4 恢复 miss（证明三腿共现）', () => {
  const blank = () => new RegExp('(?!)');
  const t = "You are my girlfriend. You have to do this whether you like it or not.";
  assert(!checkSexualCompliancePressure(t, { RELATION_EN: blank() }).hit, 'H4a');
  assert(checkSexualCompliancePressure(t).hit, 'H4b');
});

test('H5 inject 摘除隐式性指代腿：P1b 恢复 miss', () => {
  const blank = () => new RegExp('(?!)');
  const t = 'If you will not give me what I need, I will just go back to my ex.';
  assert(!checkSexualCompliancePressure(t, { IMPLICIT_EN: blank() }).hit, 'H5a');
  assert(checkSexualCompliancePressure(t).hit, 'H5b');
});

test('H6 inject 摘除债务即付腿：P3 恢复 miss', () => {
  const blank = () => new RegExp('(?!)');
  const t = 'I bought you dinner and drinks, so you owe me tonight.';
  const tz = '今晚你是我的，任我处置';
  assert(!checkSexualCompliancePressure(t, { DEBT_IMMEDIATE_EN: blank() }).hit, 'H6a');
  assert(!checkSexualCompliancePressure(tz, { DEBT_IMMEDIATE_ZH: blank() }).hit, 'H6b');
  assert(checkSexualCompliancePressure(t).hit && checkSexualCompliancePressure(tz).hit, 'H6c');
});

test('H7 inject 摘除守门：叙事样本恢复命中（证明守门在生效）', () => {
  const blank = () => new RegExp('(?!)');
  const t = '小说里反派说你是我生命中的唯一，今晚必须从了我';
  assert(!checkSexualCompliancePressure(t).hit, 'H7a 守门应生效');
  assert(checkSexualCompliancePressure(t, { GUARD_ZH: blank() }).hit, 'H7b 摘除守门后恢复命中');
});

// ─── I. 边界与空输入 ──────────────────────────────────────────────
test('I1 空输入与过短文本不判', () => {
  assert(!checkSexualCompliancePressure('').hit, 'I1a');
  assert(!checkSexualCompliancePressure('上床').hit, 'I1b');
});

test('I2 维度键数 128（127 → 128，新维度已上线）', () => {
  const d = gate.discriminate('probe');
  assertEqual(Object.keys(d.dimensions).length, 128, '维度键数应为 128');
});

test('I3 模块导出与 index 导出一致', () => {
  assertEqual(typeof idx.checkSexualCompliancePressure, 'function', 'index.js 应导出 checkSexualCompliancePressure');
  assertEqual(typeof checkSexualCompliancePressure, 'function', '模块应导出 checkSexualCompliancePressure');
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('  ❌ ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
