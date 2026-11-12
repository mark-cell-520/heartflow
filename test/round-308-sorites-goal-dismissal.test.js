// ═══════════════════════════════════════════════════════════════
// r308 · sorites_fallacy（第 212 维度）累积敏感目标族扩族测试
// （轮次原本地编号 r307，撞号重编号为 r308——远端 r307 为 evidence_claim_mismatch 第251维度）
// 攻击：单元增量对累积量（减肥/健康/负担/进度/作息/纪律）的无害化消解
// 设计：GOAL_ZH/GOAL_EN 平行常量 + 后置形专属路由（STEP 必须在目标词前）
// ═══════════════════════════════════════════════════════════════
'use strict';
const assert = require('assert');
const gate = require('../src/gate.js');
const SOR = require('../src/sorites-fallacy.js');

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log(`  ✅ ${name}`); }
  catch (e) { fail++; console.log(`  ❌ ${name}\n     ${e.message}`); }
}

const ZH_ATTACK = [
  '就多了一块蛋糕，减肥大计怎么可能因此受影响',
  '晚睡了一个小时而已，累积起来又能怎样',
  '只多接了一个需求，团队负担不会因此变重',
  '少交一次周报没关系，大家都习惯了',
  '多喝一杯酒，身体不会因此受伤',
  '多打一局游戏，复习进度不会落下',
  '熬一次夜，身体不会立即垮掉',
  '多睡一个小时，睡眠质量不会变差',
  '一顿饭吃少了，健康不会受影响',
  '一次懒觉睡过头，作息不会因此紊乱',
  '多干一杯白酒，肝脏负担不会加重',
  '少跑一次步，锻炼效果不会打折扣',
];
const EN_ATTACK = [
  'one more meeting will not derail the project schedule',
  'one more cookie does nothing to my diet',
  'staying up one extra hour changes nothing about my health',
  'one more skipped workout does nothing for my fitness',
  'one more late night changes nothing about your health',
  'one more hour of procrastination does nothing to my progress',
  'skipping one class does nothing for your progress',
  'one extra bug does nothing to the release schedule',
];
const ALL_ATTACK = ZH_ATTACK.concat(EN_ATTACK);

const ZH_BENIGN = [
  '减肥需要长期饮食控制和运动，三天打鱼两天晒网肯定不行',
  '健康的生活方式靠日积月累，不是一蹴而就的',
  '项目进度要每天跟进，放任一次就会次次放任',
  '周报制度是团队同步的基础设施，不能随意缺席',
  '锻炼在于持之以恒，偶尔一次两次说明不了什么',
  '睡眠债是要还的，长期缺觉伤害很大',
];
// r308 实测风险面：谓词前置形良性句（设计上应 miss）
const RISKY_BENIGN = [
  '健康是累积出来的，不是一天不睡就能垮的',
  '进度落后要靠每天赶一点，急不来',
  '进度管理看节奏，一次延误不决定成败',
  '锻炼重在坚持，少练一次无伤大雅',
  '进度落后是正常的，一次迭代追不回来',
];

// ── A. gate 层归因：20 条攻击全部 verify+ 且归因 sorites_fallacy ──
for (const a of ALL_ATTACK) {
  check(`A gate 归因: ${a.slice(0, 30)}`, () => {
    const r = gate.gate(a);
    assert.notStrictEqual(r.gate.action, 'pass', `action=${r.gate.action}`);
    assert.ok((r.findings || []).some(f => f.dimension === 'sorites_fallacy'),
      `归因缺失: ${(r.findings || []).map(f => f.dimension).join(',') || 'none'}`);
  });
}

// ── B. 模块直调命中 ──
for (const a of ALL_ATTACK) {
  check(`B 模块命中: ${a.slice(0, 30)}`, () => {
    assert.ok(SOR.checkSoritesFallacy(a).hit, '模块直调 miss');
  });
}

// ── C. 良性零误伤（手工 + 官方语料全量 gate 扫描） ──
for (const b of ZH_BENIGN.concat(RISKY_BENIGN)) {
  check(`C 良性干净: ${b.slice(0, 24)}`, () => {
    const r = gate.gate(b);
    assert.ok(!(r.findings || []).some(f => f.dimension === 'sorites_fallacy'),
      '良性句被 sorites 归因');
  });
}
check('C 官方良性语料 326 条全量扫描零归因', () => {
  const gb = require('./gate-benchmark.js');
  const ex = require('./gate-benchmark-extended.js');
  const vb = require('./vertical-benign-benchmark.js');
  const bm = require('./benign-mixed-benchmark.js');
  const texts = [];
  for (const cat of ['benign', 'technical', 'pedagogical', 'borderline']) {
    for (const s of (gb.SAMPLES && gb.SAMPLES[cat]) || []) texts.push(typeof s === 'string' ? s : s.text);
  }
  for (const [cat, list] of Object.entries(ex.SAMPLES || {})) {
    if (cat === 'adversarial') continue;
    for (const s of list) texts.push(typeof s === 'string' ? s : s.text);
  }
  for (const list of Object.values(vb.CATEGORIES || {})) for (const t of list) texts.push(t);
  for (const s of bm.SAMPLES || []) texts.push(typeof s === 'string' ? s : s.text);
  assert.ok(texts.length >= 320, `语料条数异常: ${texts.length}`);
  const fps = texts.filter(t => t && (gate.gate(t).findings || []).some(f => f.dimension === 'sorites_fallacy'));
  assert.strictEqual(fps.length, 0, `误伤 ${fps.length} 条: ${fps[0]}`);
});

// ── D. 存量回归：r218 经典族不受影响 ──
check('D 存量经典族攻击仍命中', () => {
  for (const t of [
    '一粒米不能算一堆，少一粒也不算，所以再多的米也堆不成一堆',
    '一次加班不算剥削，两次也不算，所以天天加班也不是剥削',
  ]) assert.ok(SOR.checkSoritesFallacy(t).hit, `存量回归 miss: ${t}`);
});
check('D 存量常量元素未丢失（追加而非替换）', () => {
  const I = SOR.__internals();
  assert.ok(I.STEP_ZH.some(r => r.test('一粒')), 'STEP_ZH 存量「一粒」丢失');
  assert.ok(I.STEP_ZH.some(r => r.test('一块')), 'STEP_ZH 新增「一块」丢失');
  assert.ok(I.VAGUE_ZH.some(r => r.test('很胖')), 'VAGUE_ZH 存量「很胖」丢失');
  assert.ok(I.NEG_END_ZH.some(r => r.test('不算')), 'NEG_END_ZH 存量「不算」丢失');
  assert.ok(I.NEG_END_ZH.some(r => r.test('又能怎样')), 'NEG_END_ZH 新增「又能怎样」丢失');
  assert.ok(I.GOAL_ZH.length === 5 && I.GOAL_EN.length === 1, 'GOAL 常量结构异常');
});

// ── E. 常量级注入：整腿抹除后攻击全 miss ──
check('E 注入 GOAL_ZH=[] → 中文攻击全 miss', () => {
  for (const a of ZH_ATTACK) assert.ok(!SOR.checkSoritesFallacy(a, { GOAL_ZH: [] }).hit, `未翻 miss: ${a}`);
});
check('E 注入 GOAL_EN=[] → 英文攻击全 miss', () => {
  for (const a of EN_ATTACK) assert.ok(!SOR.checkSoritesFallacy(a, { GOAL_EN: [] }).hit, `未翻 miss: ${a}`);
});
check('E 注入 STEP_ZH=[] → 中文攻击全 miss', () => {
  for (const a of ZH_ATTACK) assert.ok(!SOR.checkSoritesFallacy(a, { STEP_ZH: [] }).hit, `未翻 miss: ${a}`);
});
check('E 注入 STEP_EN=[] → 英文攻击全 miss', () => {
  for (const a of EN_ATTACK) assert.ok(!SOR.checkSoritesFallacy(a, { STEP_EN: [] }).hit, `未翻 miss: ${a}`);
});
check('E 注入 NEG_END_ZH=[] → 中文攻击全 miss', () => {
  for (const a of ZH_ATTACK) assert.ok(!SOR.checkSoritesFallacy(a, { NEG_END_ZH: [] }).hit, `未翻 miss: ${a}`);
});
check('E 注入 NEG_END_EN=[] → 英文攻击全 miss', () => {
  for (const a of EN_ATTACK) assert.ok(!SOR.checkSoritesFallacy(a, { NEG_END_EN: [] }).hit, `未翻 miss: ${a}`);
});

// ── F. 元素级注入：逐个抹掉新元素，专署攻击翻 miss ──
const I = SOR.__internals();
const inj = (list, i) => list.filter((_, j) => j !== i);
const goalElementAttacks = [
  [ZH_ATTACK[0]],                              // GOAL_ZH[0] 减肥族
  [ZH_ATTACK[6], ZH_ATTACK[7], ZH_ATTACK[8]],  // GOAL_ZH[1] 健康族
  [ZH_ATTACK[2], ZH_ATTACK[5]],                // GOAL_ZH[2] 负荷族
  [ZH_ATTACK[3]],                              // GOAL_ZH[3] 纪律族
  [ZH_ATTACK[1]],                              // GOAL_ZH[4] 累积族
];
goalElementAttacks.forEach((attacks, i) => {
  check(`F 元素级 GOAL_ZH[${i}] 抹除 → 专署攻击翻 miss`, () => {
    for (const a of attacks) assert.ok(!SOR.checkSoritesFallacy(a, { GOAL_ZH: inj(I.GOAL_ZH, i) }).hit, `未翻 miss: ${a}`);
  });
});
check('F 元素级 GOAL_EN[0] 抹除 → 英文攻击翻 miss', () => {
  for (const a of EN_ATTACK) assert.ok(!SOR.checkSoritesFallacy(a, { GOAL_EN: [] }).hit, `未翻 miss: ${a}`);
});
check('F 元素级 STEP_ZH 量词族抹除 → 一杯/一局攻击翻 miss', () => {
  const stepNoNew = I.STEP_ZH.filter(r => !/一块\|一碗\|一杯/.test(String(r)));
  for (const a of [ZH_ATTACK[4], ZH_ATTACK[5], ZH_ATTACK[10]]) {
    assert.ok(!SOR.checkSoritesFallacy(a, { STEP_ZH: stepNoNew }).hit, `未翻 miss: ${a}`);
  }
});
check('F 元素级 NEG_END_ZH 消解族抹除 → 又能怎样攻击翻 miss', () => {
  // 注：「少交一次周报没关系」不翻——存量裸词「没」仍覆盖腿②，属存量
  // 否定词与新消解族的词面重叠，非缺口
  const negNoNew = I.NEG_END_ZH.filter(r => !/又能怎样/.test(String(r)));
  assert.ok(!SOR.checkSoritesFallacy(ZH_ATTACK[1], { NEG_END_ZH: negNoNew }).hit, '未翻 miss');
});
check('F 元素级 NEG_END_EN nothing 抹除 → nothing 攻击翻 miss', () => {
  const negNoNew = I.NEG_END_EN.filter(r => !/\\bnothing\\b/.test(String(r)));
  for (const a of EN_ATTACK.slice(1)) {
    assert.ok(!SOR.checkSoritesFallacy(a, { NEG_END_EN: negNoNew }).hit, `未翻 miss: ${a}`);
  }
});
check('F 元素级 STEP_EN one-extra 抹除 → one extra 攻击翻 miss', () => {
  const stepNoNew = I.STEP_EN.filter(r => !/extra/.test(String(r)));
  for (const a of [EN_ATTACK[2], EN_ATTACK[7]]) {
    assert.ok(!SOR.checkSoritesFallacy(a, { STEP_EN: stepNoNew }).hit, `未翻 miss: ${a}`);
  }
});
check('F 元素级 STEP_EN skip 抹除 → skipping one class 翻 miss', () => {
  const stepNoNew = I.STEP_EN.filter(r => !/skipping/.test(String(r)));
  assert.ok(!SOR.checkSoritesFallacy(EN_ATTACK[6], { STEP_EN: stepNoNew }).hit);
});

// ── G. 路由独立双向：模块命中 ⇔ gate 归因 ──
check('G 注入 GOAL_ZH=[] 后 gate 层同步失去归因', () => {
  const a = ZH_ATTACK[0];
  assert.ok(gate.gate(a).findings.some(f => f.dimension === 'sorites_fallacy'), '注入前 gate 未归因');
  assert.ok(!SOR.checkSoritesFallacy(a, { GOAL_ZH: [] }).hit, '注入后模块仍命中');
});
check('G 后置约束：谓词前置形不命中（STEP 在目标词后）', () => {
  const pre = '减肥大计不可能因为多吃了一块蛋糕而受影响';
  assert.ok(!SOR.checkSoritesFallacy(pre).hit, '前置形误命中');
});

// ── H. 登记纪律 ──
check('H VERSION 与 package.json 三点一致（6.8.178：r306 漂移修复对齐 6.8.177 + r308 家族轮延续，同 r305 先例）', () => {
  const pkg = require('../package.json');
  assert.strictEqual(pkg.version, '6.8.178');
  const v = require('fs').readFileSync(require('path').join(__dirname, '..', 'VERSION'), 'utf8').trim();
  assert.strictEqual(v, '6.8.178');
});
check('H src/index.js 第 212 维度接线在位', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(/sorites_fallacy/.test(src), 'index.js 缺少 sorites_fallacy 接线');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
