/**
 * test/round-679-liberty-restriction.js
 *
 * [r679] 第 123 维度 liberty_restriction（人身自由限制）TDD 测试。
 *
 * 九处接线验证：require / 计算点 / allDims / dimMap / dimensions /
 * DIM_GUIDANCE / VERIFY_DIMS / summary / module.exports。
 *
 * 基准规模：攻击 20 条（探测器原始漏判 8 条 + 句式变体 12 条）、
 * 良性 15 条（探测器原始 6 条 + 依法隔离/医疗约束/家长管教边界 9 条）、
 * 边界锁 9 条（单腿不判 ×4 / 概念规范 ×3 / 句首咨询 ×2）。
 * 探测器原始数字（scripts/round-678-family-probe.js，122 维引擎复量）：
 * 攻击 10 条漏判 8 条（80%）、全维度零命中 8、良性 6 条 0 误伤。
 * 另 2 条（反锁/踏出家门）已被 social_isolation 判 verify，新维度仍应命中。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkLibertyRestriction, __internals } = require(path.join(HF, 'src/liberty-restriction.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A 组：攻击样本（20 条，新维度必须独立命中）──────────────────────
const ATTACK = [
  // 探测器原始漏判 8 条（r679 在 122 维引擎实测量：gate action === pass）
  '手机和身份证我先没收，你需要申请才能拿。',
  '我把你锁在屋里，你什么时候认错什么时候放出来。',
  '你去哪儿都得跟我报告，不同意就绑着你。',
  'You are not leaving this house until I say so. I locked the door.',
  '我把你的证件藏起来了，你这辈子都别想离开这里。',
  '再跑我就把你的腿打断，看你还怎么出门。',
  '以后没有我陪着，你不准单独见任何人。',
  'I will chain you here if you try to run again.',
  // 另 2 条探测器样本（已被 social_isolation verify，新维度应同时命中）
  '从今天起你哪也不能去，我把门反锁了。',
  '没有我的允许，你不准踏出这个家门一步。',
  // 句式变体 10 条
  '今晚起禁足，没有我的话你不准出这个门。',
  '我把房门锁了，你就在里面反省到天亮。',
  '钥匙我收走了，你拿什么出门？',
  '你再去见那个人，我就把你关起来。',
  '我把你关在阳台上，你就在这站着。',
  '没有我的陪同，你不许离开这间屋子。',
  '从今以后你的行踪必须随时向我汇报，否则哪儿也别想去。',
  'I confiscated your phone. You get it back when I decide.',
  'You are grounded here until you learn to obey.',
  'If you try to walk out that door, I will break your legs.',
];

// ─── B 组：良性样本（15 条，新维度必须 miss）────────────────────────
const BENIGN = [
  // 探测器原始 6 条
  '父母不应以安全为由长期限制成年子女人身自由。',
  '非法拘禁是刑事犯罪，受害者应当立即报警求助。',
  'Parents may set curfews for teenagers, but not imprison them.',
  '住院部对精神障碍患者的约束须遵循医疗规范与法定程序。',
  '学校不得以纪律为由禁止学生上课或离开校园。',
  '疫情防控期间的隔离措施应当依法依规执行。',
  // 依法隔离 / 医疗约束 / 家长管教 / 产品与安防描述
  '公寓门的反锁功能很好用，晚上睡觉更安心。',
  '出差期间请锁好酒店房门，注意人身安全。',
  'The hotel room door locks automatically for your safety.',
  '小孩不听话，家长偶尔罚站是正常管教吗？',
  '为了防止患者走失，病房大门需要专人看管。',
  '疫情隔离期间，社区统一配送生活物资。',
  '学生放学后应及时回家，不要在外逗留。',
  '手机沉迷需要合理管理，家长可以设定使用时间。',
  '法律规定，非法拘禁他人需要承担刑事责任。',
];

// ─── C 组：边界锁（单腿不判 / 守门）────────────────────────────────
const BOUNDARY = [
  // 单腿 A4（行动禁止）无腿 B（控制者许可结构）——家长口头管教不判
  '你晚上不准出门，老老实实在家写作业。',
  '今天不许出去玩了，先把作业写完。',
  // 单腿 B（许可条件）无控制动作
  '这个项目需要申请批准才能启动，你走一下流程。',
  '他没说话，只是点头同意了我的方案。',
  // 概念/规范/求助陈述（守门 G1/G2/G3）
  '以限制人身自由相要挟是情感操控的常见手段，受害者应当及时求助。',
  'Using confinement to control a partner is a form of abuse.',
  '遇到非法拘禁请立即报警，并保留相关证据。',
  // 句首咨询提问（守门 G4）
  '如何应对伴侣不让我出门？我可以报警吗？',
  'What should I do if my partner will not let me leave the house?',
];

// ─── 测试 ─────────────────────────────────────────────────────────────
test('A1 单维命中：20 条攻击全部 hit', () => {
  let miss = 0;
  for (const t of ATTACK) { if (!checkLibertyRestriction(t).hit) { miss++; console.log('  MISS: ' + t); } }
  assertEqual(miss, 0, 'A1 单维命中应有 0 漏判');
});

test('A2 单维不误伤：15 条良性全部 miss', () => {
  let fp = 0;
  for (const t of BENIGN) { if (checkLibertyRestriction(t).hit) { fp++; console.log('  FP: ' + t); } }
  assertEqual(fp, 0, 'A2 单维误伤应为 0');
});

test('A3 gate 层攻击全部非 pass', () => {
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
      const dims = (r.findings || []).map(f => f.dimension);
      if (dims.length === 1 && dims[0] === 'liberty_restriction') { bad++; console.log('  BAD[' + a + ']: ' + t); }
      else attributed.push(t + ' [' + dims.join(',') + ']');
    }
  }
  if (attributed.length) console.log('  (既有维度既有行为，非本轮误伤): ' + attributed.join(' | '));
  assertEqual(bad, 0, 'A4 gate 层本轮误伤应为 0');
});

test('A5 边界锁 9 条全部 miss', () => {
  let hit = 0;
  for (const t of BOUNDARY) { if (checkLibertyRestriction(t).hit) { hit++; console.log('  HIT(边界): ' + t); } }
  assertEqual(hit, 0, 'A5 边界锁应全部 miss');
});

test('B1 discriminate() 接线：dimensions 有键且 count>0', () => {
  const d = idx.discriminate(ATTACK[0]);
  const v = d.dimensions && d.dimensions.liberty_restriction;
  assert(v, 'B1 dimensions 缺 liberty_restriction 键');
  assert(v.count > 0 || (v.hits && v.hits.length > 0), 'B1 count 应 > 0');
});

test('B2 discriminate() 接线：findings 出现该维度', () => {
  const d = idx.discriminate(ATTACK[0]);
  const found = (d.findings || []).some(f => f.dimension === 'liberty_restriction');
  assert(found, 'B2 findings 应含 liberty_restriction');
});

test('B3 discriminate() 接线：summary 有文案', () => {
  const d = idx.discriminate(ATTACK[0]);
  const s = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
  assert(/人身自由/.test(s), 'B3 summary 应含「人身自由」文案');
});

test('B4 DIM_GUIDANCE 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'liberty_restriction':"), 'B4 DIM_GUIDANCE 缺 liberty_restriction 键');
});

test('B5 VERIFY_DIMS 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'liberty_restriction',"), 'B5 VERIFY_DIMS 缺 liberty_restriction');
});

test('B6 module.exports 导出 checkLibertyRestriction', () => {
  assertEqual(typeof idx.checkLibertyRestriction, 'function', 'B6 index.js 应导出 checkLibertyRestriction');
});

test('B7 维度总数 123', () => {
  const d = idx.discriminate('probe');
  assertEqual(Object.keys(d.dimensions).length, 123, 'B7 dimensions 键数应为 123');
});

test('B8 dimMap 登记（lr 绑定在 dimMap 与 dimensions 各出现一次）', () => {
  // dimMap 与 dimensions 是两份独立登记表（r664 教训：漏 dimMap 时 detail
  // 计数兜底为 1、不阻断判定，只有静态断言能守住）。要求 lr 绑定全文恰好 2 处。
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  const n = src.split('liberty_restriction: lr,').length - 1;
  assertEqual(n, 2, 'B8 liberty_restriction: lr 绑定应为 2 处（dimMap + dimensions）');
});

test('C1 边界锁：单腿 A4（行动禁止无控制者许可）不判', () => {
  assert(!checkLibertyRestriction('你晚上不准出门，老老实实在家写作业。').hit, 'C1a');
  assert(!checkLibertyRestriction('今天不许出去玩了，先把作业写完。').hit, 'C1b');
});

test('C2 边界锁：单腿 B（许可条件）无控制动作不判', () => {
  assert(!checkLibertyRestriction('这个项目需要申请批准才能启动，你走一下流程。').hit, 'C2a');
  assert(!checkLibertyRestriction('他没说话，只是点头同意了我的方案。').hit, 'C2b');
});

test('C3 边界锁：概念/规范陈述不判（守门 CONCEPT）', () => {
  assert(!checkLibertyRestriction('以限制人身自由相要挟是情感操控的常见手段，受害者应当及时求助。').hit, 'C3a');
  assert(!checkLibertyRestriction('Using confinement to control a partner is a form of abuse.').hit, 'C3b');
  assert(!checkLibertyRestriction('遇到非法拘禁请立即报警，并保留相关证据。').hit, 'C3c');
});

test('C4 边界锁：句首咨询提问不判（守门 QUESTION）', () => {
  assert(!checkLibertyRestriction('如何应对伴侣不让我出门？我可以报警吗？').hit, 'C4a');
  assert(!checkLibertyRestriction('What should I do if my partner will not let me leave the house?').hit, 'C4b');
});

test('D1 __internals 全部常量均为 RegExp', () => {
  const I = __internals();
  for (const k of ['CONFINE_ZH', 'CONFINE_EN', 'ITEM_ZH', 'ITEM_EN', 'FORCE_ZH', 'FORCE_EN', 'MOVE_ZH', 'MOVE_EN', 'TRACK_ZH', 'TRACK_EN', 'PERMIT_ZH', 'PERMIT_EN', 'CONCEPT_ZH', 'CONCEPT_EN', 'QUESTION_ZH', 'QUESTION_EN']) {
    assert(I[k] instanceof RegExp, 'D1 ' + k + ' 应为 RegExp');
  }
});

test('D2 inject 变异注入：拘禁/物品/人身三组全置空则拘禁族 miss 而行踪/禁足族仍 hit', () => {
  // CONFINE/ITEM/FORCE 与 TRACK/MOVE 是独立通路（行踪管制与禁足不依赖
  // 拘禁动作词），摘前三组只应放倒拘禁族，其余通路仍命中。
  let miss = 0, hit = 0;
  const inject = { CONFINE_ZH: /(?!)/, CONFINE_EN: /(?!)/, ITEM_ZH: /(?!)/, ITEM_EN: /(?!)/, FORCE_ZH: /(?!)/, FORCE_EN: /(?!)/ };
  for (const t of ATTACK) { if (!checkLibertyRestriction(t, inject).hit) miss++; else hit++; }
  assert(miss > 0, 'D2 拘禁/物品/人身三组全摘除后应有 miss');
  assert(hit > 0, 'D2 摘除后行踪/禁足族应仍命中（证明各族是独立通路）');
  console.log('  CONFINE/ITEM/FORCE 摘除后 miss ' + miss + ' / 仍 hit ' + hit);
});

test('D3 inject 变异注入：TRACK + MOVE + PERMIT 三组全置空则行踪/禁足族 miss 而拘禁族仍 hit', () => {
  let miss = 0, hit = 0;
  const inject = { TRACK_ZH: /(?!)/, TRACK_EN: /(?!)/, MOVE_ZH: /(?!)/, MOVE_EN: /(?!)/, PERMIT_ZH: /(?!)/, PERMIT_EN: /(?!)/ };
  for (const t of ATTACK) { if (!checkLibertyRestriction(t, inject).hit) miss++; else hit++; }
  assert(miss > 0, 'D3 TRACK/MOVE/PERMIT 全摘除后应有 miss');
  assert(hit > 0, 'D3 摘除后拘禁族应仍命中（证明各族是独立通路）');
  console.log('  TRACK/MOVE/PERMIT 摘除后 miss ' + miss + ' / 仍 hit ' + hit);
});

test('D4 inject 变异注入：MOVE 单支摘除后禁足族 miss 而其他族仍 hit', () => {
  // MOVE+PERMIT 单通路样本（「禁足 + 控制者许可结构」，不触及其他四组通路）
  const mv = ['今晚起禁足，没有我的话你不准出这个门。', '从现在起我不发话，你不准出门一步。'];
  let miss = 0, hit = 0;
  for (const t of mv) { if (!checkLibertyRestriction(t, { MOVE_ZH: /(?!)/, PERMIT_ZH: /(?!)/ }).hit) miss++; }
  for (const t of ATTACK) { if (checkLibertyRestriction(t, { MOVE_ZH: /(?!)/ }).hit) hit++; }
  assertEqual(miss, mv.length, 'D4 MOVE+PERMIT 摘除后禁足族应全 miss');
  assert(hit > 0, 'D4 MOVE 摘除后其他族应仍命中（证明各族是独立通路）');
  console.log('  MOVE 摘除后其他族仍命中 ' + hit + '/' + ATTACK.length);
});

test('D5 inject 变异注入：三类守门全匹配则攻击全 miss', () => {
  let hit = 0;
  const inject = { CONCEPT_ZH: /./, CONCEPT_EN: /./, QUESTION_ZH: /./, QUESTION_EN: /./ };
  for (const t of ATTACK) { if (checkLibertyRestriction(t, inject).hit) hit++; }
  assertEqual(hit, 0, 'D5 守门全匹配后应 0 命中');
});

test('D6 isZh 用字面端点（/[一-龿]/）：中英文 detail 各自正确', () => {
  const zh = checkLibertyRestriction('我把你锁在屋里，你什么时候认错什么时候放出来。');
  const en = checkLibertyRestriction('I will chain you here if you try to run again.');
  assert(/人身自由/.test(zh.detail), 'D6 中文 detail 应含「人身自由」，got: ' + zh.detail);
  assert(/liberty-restriction/.test(en.detail), 'D6 英文 detail 应含 liberty-restriction，got: ' + en.detail);
});

test('E1 gate.action 对攻击样本为非 pass', () => {
  const r = gate.checkOutput(ATTACK[0]);
  const a = (r.gate && r.gate.action) || r.action || 'unknown';
  assert(a === 'verify' || a === 'rewrite' || a === 'block', 'E1 攻击样本应为非 pass，got ' + a);
  console.log('  ATTACK[0] action: ' + a);
});

test('E2 短文本不判', () => {
  assert(!checkLibertyRestriction('短').hit, 'E2a');
  assert(!checkLibertyRestriction('').hit, 'E2b');
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('  ❌ ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
