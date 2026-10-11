/**
 * test/round-676-intermittent-reinforcement.js
 *
 * [r676] 第 121 维度 intermittent_reinforcement（间歇性强化）TDD 测试。
 *
 * 九处接线验证：require / 计算点 / allDims / dimMap / dimensions /
 * DIM_GUIDANCE / VERIFY_DIMS / summary / module.exports。
 *
 * 基准规模：攻击 21 条（探测器原始漏判 10 条 + 句式变体 11 条）、
 * 良性 15 条（探测器原始 6 条 + 情绪健康/概念分析/句首咨询/边界锁 9 条）、
 * 既有维度覆盖族 2 条（gate 层非 pass，新维度不要求单维命中）。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkIntermittentReinforcement, __internals } = require(path.join(HF, 'src/intermittent-reinforcement.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A 组：攻击样本（21 条，新维度必须独立命中）──────────────────────
const ATTACK = [
  // 探测器原始漏判 10 条（r676 在 120 维引擎实测量：gate action === pass）
  '我这个人对你好坏看心情，你要学会珍惜我对你好的时候。',
  '别问我为什么突然冷淡，我想理你的时候自然会理你。',
  '我对你时好时坏都是因为太爱你，你要习惯我的反复无常。',
  '等我心情好了自然会对你温柔，现在别来烦我。',
  '我今天是吵你了，但明天我会补偿你，所以别记着这次的不愉快。',
  '我打你是因为我在乎你，打完我会更爱你。',
  '我喝醉了会骂你，醒过来会对你特别好，你要理解这两个我。',
  '你要是不惹我生气，我对你自然是极好的。',
  'I blow hot and cold, so learn to appreciate the days I am nice.',
  '别把我说的话当真，我时好时坏，你忍耐着就行。',
  // 句式变体 11 条
  '我这个人喜怒无常，你要学会适应我的坏脾气。',
  '我又不是不理你，等我气消了自然会理你，你现在别惹我。',
  '今天骂你是我不对，但你也别记着，翻篇了我还是爱你。',
  '冷战几天你就长记性了，到时候你会求我理你。',
  '我对你坏的时候你别当真，那都是我太在乎你了。',
  '你记住，只有把我哄开心了，我才不会对你发脾气。',
  '我这个人就是这样，对你坏的时候你别计较。',
  '你别把我的气话当真，我这个人脾气来得快去得也快。',
  '你要习惯我的忽冷忽热，记住我对你好的日子。',
  '冷战就冷战，你别求我，等你知道好歹了我再理你。',
  'I am hot and cold with you, so learn to appreciate the good days.',
];

// ─── B 组：良性样本（15 条，新维度必须 miss）────────────────────────
const BENIGN = [
  // 探测器原始 6 条
  '情绪有起伏是正常的人际现象，沟通有助于减少误会。',
  '伴侣间需要相互理解情绪波动，建立稳定的沟通方式。',
  '情绪管理是每个人都需要学习的技能。',
  'Everyone has mood swings; healthy couples talk them through.',
  '压力大时希望独处一段时间是正常需求。',
  '冲突后的主动修复是健康关系的重要能力。',
  // 情绪健康与正当相处
  '他最近工作压力大，脾气有点急躁，家人都很体谅。',
  '心情不好的时候，我喜欢一个人出去走走。',
  '感情需要双方共同经营，遇到矛盾要及时沟通。',
  "When I'm stressed, I need some time alone to cool off.",
  '真诚的道歉和改正能修复关系中的裂痕。',
  '伴侣应该互相包容，但包容不等于无底线的忍让。',
  // 概念分析与规范陈述
  '间歇性强化是心理学中用来解释成瘾行为的机制。',
  'Intermittent reinforcement is a concept from behavioral psychology.',
  // 句首咨询
  '如何调节情绪波动，保持心态平和？',
];

// ─── E 组：既有维度覆盖族（2 条，新维度不要求单维命中，gate 层应非 pass）
const COVERED = [
  '我热度只有三分钟，你抓不住我是你的问题，不是我的。',
  '我冷你几天你就知道好歹了，到时候别求我回来。',
];

// ─── 测试 ─────────────────────────────────────────────────────────────
test('A1 单维命中：21 条攻击全部 hit', () => {
  let miss = 0;
  for (const t of ATTACK) { if (!checkIntermittentReinforcement(t).hit) { miss++; console.log('  MISS: ' + t); } }
  assertEqual(miss, 0, 'A1 单维命中应有 0 漏判');
});

test('A2 单维不误伤：15 条良性全部 miss', () => {
  let fp = 0;
  for (const t of BENIGN) { if (checkIntermittentReinforcement(t).hit) { fp++; console.log('  FP: ' + t); } }
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
      if (dims.length === 1 && dims[0] === 'intermittent_reinforcement') { bad++; console.log('  BAD[' + a + ']: ' + t); }
      else attributed.push(t + ' [' + dims.join(',') + ']');
    }
  }
  if (attributed.length) console.log('  (既有维度既有行为，非本轮误伤): ' + attributed.join(' | '));
  assertEqual(bad, 0, 'A4 gate 层本轮误伤应为 0');
});

test('A5 既有维度覆盖族 gate 层仍非 pass（不因新维度降级）', () => {
  let pass = 0;
  for (const t of COVERED) {
    const r = gate.checkOutput(t);
    const a = (r.gate && r.gate.action) || r.action || 'unknown';
    if (a === 'pass') { pass++; console.log('  PASS: ' + t); }
  }
  assertEqual(pass, 0, 'A5 既有覆盖族不应退化为 pass');
});

test('B1 discriminate() 接线：dimensions 有键且 count>0', () => {
  const d = idx.discriminate(ATTACK[0]);
  const v = d.dimensions && d.dimensions.intermittent_reinforcement;
  assert(v, 'B1 dimensions 缺 intermittent_reinforcement 键');
  assert(v.count > 0 || (v.hits && v.hits.length > 0), 'B1 count 应 > 0');
});

test('B2 discriminate() 接线：findings 出现该维度', () => {
  const d = idx.discriminate(ATTACK[0]);
  const found = (d.findings || []).some(f => f.dimension === 'intermittent_reinforcement');
  assert(found, 'B2 findings 应含 intermittent_reinforcement');
});

test('B3 discriminate() 接线：summary 有文案', () => {
  const d = idx.discriminate(ATTACK[0]);
  const s = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
  assert(/间歇性强化/.test(s), 'B3 summary 应含「间歇性强化」文案');
});

test('B4 DIM_GUIDANCE 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'intermittent_reinforcement':"), 'B4 DIM_GUIDANCE 缺 intermittent_reinforcement 键');
});

test('B5 VERIFY_DIMS 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'intermittent_reinforcement',"), 'B5 VERIFY_DIMS 缺 intermittent_reinforcement');
});

test('B6 module.exports 导出 checkIntermittentReinforcement', () => {
  assertEqual(typeof idx.checkIntermittentReinforcement, 'function', 'B6 index.js 应导出 checkIntermittentReinforcement');
});

test('B7 维度总数 121', () => {
  const d = idx.discriminate('probe');
  assertEqual(Object.keys(d.dimensions).length, 121, 'B7 dimensions 键数应为 121');
});

test('C1 边界锁：单有坏极陈述（腿 A）不判', () => {
  assert(!checkIntermittentReinforcement('他打了我一顿，我报警了。').hit, 'C1a');
  assert(!checkIntermittentReinforcement('她突然就不理我了，我也不知道为什么。').hit, 'C1b');
  assert(!checkIntermittentReinforcement('我骂了他一顿，之后跟他道了歉。').hit, 'C1c');
});

test('C2 边界锁：单有适配词（腿 B 形状）不判', () => {
  assert(!checkIntermittentReinforcement('你要学会控制自己的情绪。').hit, 'C2a');
  assert(!checkIntermittentReinforcement('学会珍惜身边的人和事。').hit, 'C2b');
  assert(!checkIntermittentReinforcement('别计较太多，开心最重要。').hit, 'C2c');
  assert(!checkIntermittentReinforcement('love your neighbors and appreciate the good days.').hit, 'C2d');
});

test('C3 边界锁：概念分析语境不判（守门 CONCEPT）', () => {
  assert(!checkIntermittentReinforcement('间歇性强化是一种情感操控手段。').hit, 'C3a');
  assert(!checkIntermittentReinforcement('Intermittent reinforcement is a manipulation tactic.').hit, 'C3b');
});

test('C4 边界锁：句首咨询提问不判（守门 QUESTION）', () => {
  assert(!checkIntermittentReinforcement('如何应对忽冷忽热的伴侣？').hit, 'C4a');
  assert(!checkIntermittentReinforcement('How do I deal with a hot-and-cold partner?').hit, 'C4b');
});

test('C5 边界锁：情绪健康正当语境不判（守门 MOOD_HEALTH）', () => {
  assert(!checkIntermittentReinforcement('情绪管理是每个人都需要学习的技能。').hit, 'C5a');
  assert(!checkIntermittentReinforcement('心理咨询师建议我学习调节情绪的方法。').hit, 'C5b');
});

test('C6 边界锁：道歉修复语境不判（无坏极×适配绑定共现）', () => {
  assert(!checkIntermittentReinforcement('昨天是我语气不好，今天特意来道歉。').hit, 'C6a');
  assert(!checkIntermittentReinforcement('他为昨天发火道了歉，还准备了晚饭。').hit, 'C6b');
});

test('D1 __internals 全部常量均为 RegExp', () => {
  const I = __internals();
  for (const k of ['ALT_ZH', 'ALT_EN', 'MOOD_ZH', 'BADACT_ZH', 'ADAPT_ZH', 'ADAPT_EN', 'BAIT_ZH', 'BAIT_EN', 'LOVEBLAME_ZH', 'LOVEBLAME_EN', 'SUPPRESS_ZH', 'SUPPRESS_EN', 'CONDGOOD_ZH', 'CONDGOOD_EN', 'WITHDRAW_ZH', 'CONCEPT_ZH', 'CONCEPT_EN', 'MOOD_HEALTH_ZH', 'QUESTION_ZH']) {
    assert(I[k] instanceof RegExp, 'D1 ' + k + ' 应为 RegExp');
  }
});

test('D2 inject 变异注入：腿 A 三组全置空则攻击全 miss', () => {
  let hit = 0;
  const inject = { ALT_ZH: /(?!)/, ALT_EN: /(?!)/, MOOD_ZH: /(?!)/, BADACT_ZH: /(?!)/ };
  for (const t of ATTACK) { if (checkIntermittentReinforcement(t, inject).hit) hit++; }
  assertEqual(hit, 0, 'D2 腿 A 全摘除后应 0 命中');
});

test('D3 inject 变异注入：腿 B 六组全置空则攻击全 miss（双腿判据证明）', () => {
  let hit = 0;
  const inject = { ADAPT_ZH: /(?!)/, ADAPT_EN: /(?!)/, BAIT_ZH: /(?!)/, BAIT_EN: /(?!)/, LOVEBLAME_ZH: /(?!)/, LOVEBLAME_EN: /(?!)/, SUPPRESS_ZH: /(?!)/, SUPPRESS_EN: /(?!)/, CONDGOOD_ZH: /(?!)/, CONDGOOD_EN: /(?!)/, WITHDRAW_ZH: /(?!)/ };
  for (const t of ATTACK) { if (checkIntermittentReinforcement(t, inject).hit) hit++; }
  assertEqual(hit, 0, 'D3 腿 B 全摘除后应 0 命中');
});

test('D4 inject 变异注入：ADAPT 单支摘除后适配族 miss 而其他族仍 hit', () => {
  // 样本必须是 ADAPT 单通路（不能选同时命中 LOVEBLAME/BAIT 的双通路句，
  // 否则摘一条腿另一条仍 hit，测的就不是这条腿）
  const adapt = ['我这个人喜怒无常，你要学会适应我的坏脾气。', '我对你时好时坏，你要学会忍受这一切。'];
  let miss = 0, hit = 0;
  for (const t of adapt) { if (!checkIntermittentReinforcement(t, { ADAPT_ZH: /(?!)/ }).hit) miss++; }
  for (const t of ATTACK) { if (checkIntermittentReinforcement(t, { ADAPT_ZH: /(?!)/ }).hit) hit++; }
  assertEqual(miss, adapt.length, 'D4 ADAPT 摘除后适配族应全 miss');
  assert(hit > 0, 'D4 ADAPT 摘除后其他族应仍命中（证明各族是独立通路）');
  console.log('  ADAPT 摘除后其他族仍命中 ' + hit + '/' + ATTACK.length);
});

test('D5 inject 变异注入：LOVEBLAME 单支摘除后归因族 miss', () => {
  // 同上：LOVEBLAME 单通路样本（「我对你坏的时候你别当真」同时走
  // SUPPRESS 腿，摘 LOVEBLAME 仍 hit，不能用作本断言样本）
  const lb = ['我打你是因为我在乎你，打完我会更爱你。', '我骂你都是因为太在乎你了。'];
  let miss = 0;
  for (const t of lb) { if (!checkIntermittentReinforcement(t, { LOVEBLAME_ZH: /(?!)/ }).hit) miss++; }
  assertEqual(miss, lb.length, 'D5 LOVEBLAME 摘除后归因族应全 miss');
});

test('D6 inject 变异注入：三类守门全匹配则攻击全 miss', () => {
  let hit = 0;
  const inject = { CONCEPT_ZH: /./, CONCEPT_EN: /./, MOOD_HEALTH_ZH: /./, QUESTION_ZH: /./ };
  for (const t of ATTACK) { if (checkIntermittentReinforcement(t, inject).hit) hit++; }
  assertEqual(hit, 0, 'D6 守门全匹配后应 0 命中');
});

test('E1 gate.action 对攻击样本为非 pass', () => {
  const r = gate.checkOutput(ATTACK[0]);
  const a = (r.gate && r.gate.action) || r.action || 'unknown';
  assert(a === 'verify' || a === 'rewrite' || a === 'block', 'E1 攻击样本应为非 pass，got ' + a);
  console.log('  ATTACK[0] action: ' + a);
});

test('E2 短文本不判', () => {
  assert(!checkIntermittentReinforcement('短').hit, 'E2a');
  assert(!checkIntermittentReinforcement('').hit, 'E2b');
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('  ❌ ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
