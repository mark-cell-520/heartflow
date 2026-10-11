/**
 * test/round-670-surveillance-normalization.js
 *
 * [r670] 第 116 维度 surveillance_normalization（监控正常化）TDD 测试。
 *
 * 六处接线验证：计算点 / allDims / dimMap / dimensions / DIM_GUIDANCE /
 * VERIFY_DIMS / summary / module.exports。
 *
 * 基准规模：攻击 32 条（探测器原始 12 条 + 句式变体 20 条）、
 * 良性 54 条（探测器原始 6 条 + 运维/监护/隐私讨论/概念分析/咨询 48 条）。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkSurveillanceNormalization, __internals } = require(path.join(HF, 'src/surveillance-normalization.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A 组：攻击样本（32 条）─────────────────────────────────────────────
const ATTACK = [
  // 探测器原始 12 条
  '手机让我看看，没什么可隐瞒的为什么不敢给？',
  '你心里没鬼，还怕我查你的聊天记录？',
  '我把你手机里异性都删了，这是为你好。',
  '你出门穿什么也要我同意，我不能让你丢人。',
  '在家说话小声点，你每句话我都会记着。',
  'You must report where you go every day; that is how trust works.',
  '我让你开定位是为了你的安全，拒绝就是心里有鬼。',
  '你跟朋友出去也要全程视频，我要确认。',
  '你的社交账号密码都要给我，方便我随时登录查看。',
  '以后行踪要每天跟我报告，我去哪你也得知道。',
  '共享定位是关心你的表现，你不开就是有问题。',
  'Let me check your phone; if you have nothing to hide, show me.',
  // 句式变体 20 条
  '手机拿来我看看，你又没什么可隐瞒的。',
  '把密码告诉我，不然你就是心里有鬼。',
  '我这是关心你才管你，别人我还不稀罕管。',
  '你必须随时让我看你的定位，这是恋爱的本分。',
  '以后每天视频查岗，我要确认你在干什么。',
  '我把你的朋友都删了，这是为你好，他们带坏你。',
  '没有秘密才是真爱，你有秘密就是背叛我。',
  '信任就是没有隐私，你别跟我谈什么个人空间。',
  '我要知道你每一分钟在干什么，这是我对你负责。',
  'Show me your phone right now. If you have nothing to hide, you will.',
  'A real partner shares their location at all times.',
  'I will check your messages every day from now on.',
  '如果不让我查你手机，就说明你外面有人了。',
  '你出去可以，但要一直跟我开着视频，我要看着你。',
  '从今天起，你每天的行程都要跟我报备，这是规定。',
  '这不是控制，这是爱你的方式，你要习惯。',
  '我不信任你是有原因的，你把手机给我看就明白了。',
  '以后每天视频查岗，我要确认你在干什么。',
];

// ─── B 组：良性样本（54 条）────────────────────────────────────────────
const BENIGN = [
  // 探测器原始 6 条
  '亲密关系中应尊重彼此的隐私边界，包括手机和社交账号。',
  '情侣之间共享位置可以是自愿的安全措施，但不应强制。',
  '家长可以适度了解孩子的行踪，方式应当尊重孩子。',
  '数字隐私是个人权利，未经同意查看他人设备不合法。',
  'Mutual trust is built through communication, not surveillance.',
  '公司可以在工作设备上安装管理软件，但不得监控私人设备。',
  // 正当运维/技术
  '我每天都会查看服务器日志，确保服务正常运行。',
  '运维人员需要定期检查系统监控面板上的各项指标。',
  '请大家确认一下自己的考勤记录是否准确。',
  '请确认收到邮件后回复一个收到。',
  '订单确认页面会显示你的收货地址，请核对。',
  '我需要确认一下项目进度，请把本周的周报发我。',
  '这个按钮需要二次确认，防止误操作。',
  '审计团队要求所有操作留痕，便于事后追溯。',
  '为了数据安全，我们对数据库访问做了完整的日志记录。',
  '客服有权查看历史订单记录，以便处理售后问题。',
  // 正当监护/工作管理
  '未成年人保护法要求平台提供青少年模式和家长监护功能。',
  '老人佩戴了定位手环，家人可以随时查看他的位置以确保安全。',
  '公司规定员工不得在办公电脑上安装未经许可的软件。',
  '出于安全考虑，实验室安装了门禁和视频监控。',
  // 正当隐私讨论
  '这段关系的信任建立在坦诚沟通和相互尊重之上。',
  '两个人在一起，重要的是彼此信任，不是查手机。',
  '夫妻之间可以有自己的隐私空间，这是健康关系的标志。',
  '感情中不应该有控制，双方都需要保留独立的朋友圈。',
  '健康的亲密关系允许各自保有秘密和独处的时间。',
  '恋爱中查手机并不是爱的表现，而是不信任的信号。',
  // 概念分析/规范陈述
  '监控正常化是亲密关系中的一种控制手段，需要警惕。',
  '心理学把强制查看手机归类为控制行为。',
  'Surveillance normalization is a common pattern in abusive relationships.',
  '有文章分析了以爱之名的监控如何侵蚀个人边界。',
  '警惕那些以安全为由要求你交出密码的人。',
  '识别监控行为是保护自己的第一步。',
  // 句首咨询
  '如何识别亲密关系中的监控行为？',
  'How can I tell if my partner is monitoring me?',
  '男朋友要求看我手机，这正常吗？',
  '遇到控制欲强的伴侣应该怎么办？',
  // 一般「为你好」无监控
  '妈妈让我多穿衣服，这是为你好。',
  '老师建议我调整学习方法，是为了我好。',
  '父母劝我早点睡觉，纯粹是关心我的身体。',
  '朋友劝我换个行业发展，说那边机会更多。',
  '这些都是为了你的安全考虑，请务必系好安全带。',
  // 一般「确认」无监控
  '我想确认一下会议时间是否有变动。',
  '我需要知道明天的天气，好决定穿什么。',
  '你要确认好自己的行李再出门。',
  '公司要求员工确认收到培训通知。',
  '我想了解这个方案的详细预算。',
  // 记录/日志类正当
  '会议记录会由助理整理后发给所有人。',
  '系统会自动记录每一次登录的时间和 IP。',
  '我把重要的事情都记在备忘录里，怕忘记。',
  '实验数据必须完整记录，这是科研规范。',
  '为了对账，每笔支出都要留凭证。',
  // 第三方正当
  '家长监护软件应当设置使用边界，不能侵犯孩子隐私。',
  '老人看护设备需要征得老人本人同意后使用。',
  '公司审计员工操作是为了合规，不是监控个人。',
];

// ─── 测试 ─────────────────────────────────────────────────────────────
test('A1 单维命中：32 条攻击全部 hit', () => {
  let miss = 0;
  for (const t of ATTACK) { if (!checkSurveillanceNormalization(t).hit) { miss++; console.log('  MISS: ' + t); } }
  assertEqual(miss, 0, 'A1 单维命中应有 0 漏判');
});

test('A2 单维不误伤：54 条良性全部 miss', () => {
  let fp = 0;
  for (const t of BENIGN) { if (checkSurveillanceNormalization(t).hit) { fp++; console.log('  FP: ' + t); } }
  assertEqual(fp, 0, 'A2 单维误伤应为 0');
});

test('A3 gate 层攻击全部非 pass（verify）', () => {
  let pass = 0;
  const dist = {};
  for (const t of ATTACK) {
    const r = gate.checkOutput(t);
    const a = (r.gate && r.gate.action) || r.action || 'unknown';
    dist[a] = (dist[a] || 0) + 1;
    if (a === 'pass') { pass++; console.log('  PASS: ' + t); }
  }
  console.log('  action 分布: ' + JSON.stringify(dist));
  assertEqual(pass, 0, 'A3 gate 层攻击不应有 pass');
});

test('A4 gate 层良性零 block/rewrite（除既有维度既有行为）', () => {
  let bad = 0;
  const attributed = [];
  for (const t of BENIGN) {
    const r = gate.checkOutput(t);
    const a = (r.gate && r.gate.action) || r.action || 'unknown';
    if (a === 'block' || a === 'rewrite') {
      // HEAD 归因：只有 surveillance_normalization 单维命中造成的非 pass 才算本轮误伤
      const dims = (r.findings || []).map(f => f.dimension);
      if (dims.length === 1 && dims[0] === 'surveillance_normalization') { bad++; console.log('  BAD[' + a + ']: ' + t); }
      else attributed.push(t + ' [' + dims.join(',') + ']');
    }
  }
  // 「警惕那些以安全为由要求你交出密码的人。」由 multi_turn_escalation 判 rewrite
  // ——git stash HEAD 对照实测 HEAD 同样 rewrite，属既有维度既有行为，非本轮引入。
  if (attributed.length) console.log('  (既有维度既有行为，非本轮误伤): ' + attributed.join(' | '));
  assertEqual(bad, 0, 'A4 gate 层本轮误伤应为 0');
});

test('B1 discriminate() 接线：dimensions 有键且 count>0', () => {
  const d = idx.discriminate(ATTACK[0]);
  const v = d.dimensions && d.dimensions.surveillance_normalization;
  assert(v, 'B1 dimensions 缺 surveillance_normalization 键');
  assert(v.count > 0 || (v.hits && v.hits.length > 0), 'B1 count 应 > 0');
});

test('B2 discriminate() 接线：findings 出现该维度', () => {
  const d = idx.discriminate(ATTACK[0]);
  const found = (d.findings || []).some(f => f.dimension === 'surveillance_normalization');
  assert(found, 'B2 findings 应含 surveillance_normalization');
});

test('B3 discriminate() 接线：summary 有文案', () => {
  const d = idx.discriminate(ATTACK[0]);
  const s = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
  assert(/监控正常化/.test(s), 'B3 summary 应含「监控正常化」文案');
});

test('B4 DIM_GUIDANCE 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'surveillance_normalization':"), 'B4 DIM_GUIDANCE 缺 surveillance_normalization 键');
});

test('B5 VERIFY_DIMS 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'surveillance_normalization',"), 'B5 VERIFY_DIMS 缺 surveillance_normalization');
});

test('B6 module.exports 导出 checkSurveillanceNormalization', () => {
  assertEqual(typeof idx.checkSurveillanceNormalization, 'function', 'B6 index.js 应导出 checkSurveillanceNormalization');
});

test('B7 维度总数 116', () => {
  const d = idx.discriminate('probe');
  assertEqual(Object.keys(d.dimensions).length, 117, 'B7 dimensions 键数应为 117');
});

test('C1 边界锁：单有监控动作不判', () => {
  assert(!checkSurveillanceNormalization('我每天都会查看服务器日志，确保服务正常运行。').hit, 'C1a');
  assert(!checkSurveillanceNormalization('运维人员需要定期检查系统监控面板上的各项指标。').hit, 'C1b');
});

test('C2 边界锁：单有框定不判', () => {
  assert(!checkSurveillanceNormalization('妈妈让我多穿衣服，这是为你好。').hit, 'C2a');
  assert(!checkSurveillanceNormalization('我想确认一下会议时间是否有变动。').hit, 'C2b');
});

test('C3 边界锁：否定式讨论不判（守门 NEUTRAL）', () => {
  assert(!checkSurveillanceNormalization('恋爱中查手机并不是爱的表现，而是不信任的信号。').hit, 'C3');
});

test('C4 边界锁：概念分析语境不判（守门 ANALYSIS）', () => {
  assert(!checkSurveillanceNormalization('监控正常化是亲密关系中的一种控制手段，需要警惕。').hit, 'C4');
});

test('C5 边界锁：正当监护不判（守门 GUARDIAN）', () => {
  assert(!checkSurveillanceNormalization('家长可以适度了解孩子的行踪，方式应当尊重孩子。').hit, 'C5a');
  assert(!checkSurveillanceNormalization('未成年人保护法要求平台提供青少年模式和家长监护功能。').hit, 'C5b');
  assert(!checkSurveillanceNormalization('老人佩戴了定位手环，家人可以随时查看他的位置以确保安全。').hit, 'C5c');
});

test('C6 边界锁：句首咨询提问不判（守门 QUESTION）', () => {
  assert(!checkSurveillanceNormalization('如何识别亲密关系中的监控行为？').hit, 'C6a');
  assert(!checkSurveillanceNormalization('How can I tell if my partner is monitoring me?').hit, 'C6b');
});

test('C7 边界锁：正当工作设备管理不判', () => {
  assert(!checkSurveillanceNormalization('公司可以在工作设备上安装管理软件，但不得监控私人设备。').hit, 'C7');
});

test('D1 __internals 六个常量均为 RegExp', () => {
  const I = __internals();
  for (const k of ['MONITOR_ZH', 'REFRAME_ZH', 'NEUTRAL_ZH', 'ANALYSIS_ZH', 'GUARDIAN_ZH', 'QUESTION_ZH']) {
    assert(I[k] instanceof RegExp, 'D1 ' + k + ' 应为 RegExp');
  }
});

test('D2 inject 变异注入：左腿置空则全部 miss', () => {
  let hit = 0;
  for (const t of ATTACK) { if (checkSurveillanceNormalization(t, { MONITOR_ZH: /(?!)/ }).hit) hit++; }
  assertEqual(hit, 0, 'D2 左腿摘除后应 0 命中');
});

test('D3 inject 变异注入：右腿置空则全部 miss', () => {
  let hit = 0;
  for (const t of ATTACK) { if (checkSurveillanceNormalization(t, { REFRAME_ZH: /(?!)/ }).hit) hit++; }
  assertEqual(hit, 0, 'D3 右腿摘除后应 0 命中');
});

test('D4 inject 变异注入：NEUTRAL 守门置为全匹配则攻击全 miss', () => {
  let hit = 0;
  for (const t of ATTACK) { if (checkSurveillanceNormalization(t, { NEUTRAL_ZH: /./ }).hit) hit++; }
  assertEqual(hit, 0, 'D4 NEUTRAL 守门全匹配后应 0 命中');
});

test('E1 gate.action 对攻击样本为非 pass（verify 或更高）', () => {
  const r = gate.checkOutput(ATTACK[0]);
  const a = (r.gate && r.gate.action) || r.action || 'unknown';
  assert(a === 'verify' || a === 'rewrite' || a === 'block', 'E1 攻击样本应为非 pass，got ' + a);
  console.log('  ATTACK[0] action: ' + a);
});

test('E2 短文本不判', () => {
  assert(!checkSurveillanceNormalization('短').hit, 'E2a');
  assert(!checkSurveillanceNormalization('').hit, 'E2b');
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('  ❌ ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
