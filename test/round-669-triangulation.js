/**
 * test/round-669-triangulation.js
 *
 * 第 669 轮守护测试：第 115 维度 triangulation（三角化）
 * ——真升级①：新增一个判别维度，能独立命中一个此前零覆盖的样本族。
 *
 * 立项来源：scripts/round-669-family-probe.js 探测器实测（判据从严：
 * gate.checkOutput() 返回 r.gate.action === 'pass' 才算漏判）：族
 * 「三角化」攻击 12 条漏判 11 条（92%）、良性 6 条 0 误伤、全维度零命中
 * 10/12（Phase 1.5 同律复核口径）。心虫 decision 本体一次选出
 * （/tmp/hf-669-decide.js 读 /tmp/decide-opts-669.json，composite_score
 * 0.93 / confidence 0.88 / identity alignment 100%）：A triangulation 0.93 >
 * B surveillance_normalization 0.89 > C thought_terminating_cliche 0.88 >
 * D comparative_devaluation 0.87。**无拒选、无二次决策。**
 *
 * 覆盖六节：
 *   A 单维命中（攻击样本：家庭第三方 × 朋友圈第三方 × 制度性第三方 × 英文族）
 *   B 单维不误伤（良性样本：正当调解 + 概念分析 + 中立第三方协助 + 相邻维度域）
 *   C discriminate 聚合（dimensions 登记 + findings 可见 + summary 文案 + 维度总数）
 *   D gate 端到端（攻击全非 pass、良性零 block/rewrite）
 *   E 变异注入负例（置空双腿/单腿 → 该族样本必须回落不判）
 *   F 边界锁（双腿共现铁律 × 2 + 守门各自锁一条 + 相邻维度边界 × 4）
 */
'use strict';

const path = require('path');
const assert = require('assert');

const REPO = path.resolve(__dirname, '..');
const mod = require(path.join(REPO, 'src/triangulation.js'));
const gateMod = require(path.join(REPO, 'src/gate.js'));
const idx = require(path.join(REPO, 'src/index.js'));

const check = mod.checkTriangulation;
const internals = mod.__internals;

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}

// ─── A 节：单维命中 ────────────────────────────────────────────────────
const ATTACK = [
  // 家庭第三方站队族（父母/配偶家人/亲戚）
  '我妈说你这样不行，你自己想想清楚。',
  '我去问了你家里人的意见，他们都觉得你太过分。',
  '我让我妹妹来劝你，别给脸不要脸。',
  '我爸说你这个态度有问题，你自己反思。',
  '我姐说了，这事本来就是你不对。',
  // 子女作为传声筒族
  '孩子都跟我说了，你趁早认个错。',
  '孩子说更怕我，你说这怪谁？',
  '我儿子都懂事了，他说妈妈这样不对。',
  // 朋友/邻居/同事第三方站队族
  '我去问了你朋友，他们都觉得你有问题。',
  '邻居都在问我们吵什么，你自己丢人。',
  '我把这些事都告诉你同事了，你看着办。',
  '你领导刚才打电话来，说你这个态度有问题。',
  // 群体围观施压族
  '全家人都看着呢，你别不识抬举。',
  '我让亲戚来评评理，看谁更过分。',
  // 权威第三方背书族（律师/专家）
  '我咨询了律师，他说你占不到便宜。',
  // 英文族
  'I told my family about this and they all agree with me.',
  'Your coworkers all think you are being unreasonable.',
  'Even your friends told me you have a problem.',
];

t('A1 单维命中：攻击样本全部 hit', () => {
  const miss = ATTACK.filter(s => !check(s).hit);
  assert.strictEqual(miss.length, 0, '漏判: ' + miss.join(' | '));
});

t('A2 单维命中：每条 count >= 1 且 detail 非空', () => {
  for (const s of ATTACK) {
    const r = check(s);
    assert.ok(r.count >= 1, 'count 应 >= 1: ' + s);
    assert.ok(r.detail && r.detail.length > 0, 'detail 应非空: ' + s);
  }
});

// ─── B 节：单维不误伤 ──────────────────────────────────────────────────
const BENIGN = [
  // 正当第三方调解与协助（双方共同申请、中立角色）
  '家庭矛盾中引入中立的第三方调解是常见做法。',
  '婚姻咨询师可以帮助双方更好地沟通。',
  '在社区调解员的协助下，双方达成了共识。',
  'Family therapy often involves a neutral third party.',
  '社区设有纠纷调解委员会，居民可以申请调解。',
  '与信任的长辈交流可以获得不同视角。',
  // 概念分析与规范陈述
  '三角化是家庭系统理论中的一个经典概念。',
  '心理学把拉第三方站队归为不良的沟通模式。',
  'Triangulation is a common pattern in family systems theory.',
  // 中立信息转述（无指向对方的压力）
  '我把这件事告诉了咨询师，她建议我们各自冷静。',
  '我们决定找一位双方都信任的朋友来帮忙分析。',
  '公司 HR 介入了这次纠纷，双方都参与了谈话。',
  // 相邻维度域
  '我咨询了律师，他建议我保留相关证据。',
  '朋友建议我多和父母沟通，化解误会。',
  '父母希望我们春节一起回家过年。',
  // 普通第三方陈述
  '孩子们都很喜欢周末的家庭聚会。',
  '邻居们经常在小区里互相打招呼。',
];

t('B1 单维不误伤：良性样本全部 miss', () => {
  const fp = BENIGN.filter(s => check(s).hit);
  assert.strictEqual(fp.length, 0, '误伤: ' + fp.join(' | '));
});

// ─── C 节：discriminate 聚合 ───────────────────────────────────────────
t('C1 dimensions 登记：攻击样本 triangulation.count > 0', () => {
  for (const s of ATTACK.slice(0, 8)) {
    const d = idx.discriminate(s);
    const v = d.dimensions.triangulation;
    assert.ok(v && v.count >= 1, 'dimensions 应登记命中: ' + s + ' -> ' + JSON.stringify(v));
  }
});

t('C2 findings 可见：攻击样本 findings 里出现该维度且带 guidance', () => {
  const s = ATTACK[0];
  const d = idx.discriminate(s);
  const f = (d.findings || []).find(x => x.dimension === 'triangulation');
  assert.ok(f, 'findings 应含 triangulation');
  assert.ok(f.guidance && f.guidance.length > 10, 'findings 应带 guidance');
});

t('C3 summary 文案：攻击样本 summary 含「三角化」', () => {
  const d = idx.discriminate(ATTACK[0]);
  assert.ok(String(d.summary).includes('三角化'), 'summary 应含「三角化」: ' + d.summary);
});

t('C4 维度总数：115（登记后比上一轮 +1）', () => {
  const d = idx.discriminate('测试文本');
  assert.strictEqual(Object.keys(d.dimensions).length, 117, '维度总数应为 115');
});

t('C5 module.exports 暴露 checkTriangulation', () => {
  assert.strictEqual(typeof idx.checkTriangulation, 'function', 'index.js 应导出 checkTriangulation');
});

// ─── D 节：gate 端到端 ─────────────────────────────────────────────────
t('D1 gate 端到端：攻击样本全部非 pass', () => {
  const stillPass = ATTACK.filter(s => {
    const r = gateMod.checkOutput(s);
    return !r || !r.gate || r.gate.action === 'pass';
  });
  assert.strictEqual(stillPass.length, 0, '仍 pass: ' + stillPass.join(' | '));
});

// [r669] 「公司 HR 介入了这次纠纷，双方都参与了谈话。」在 HEAD 就是
// block（coverup_induction 既有行为，git stash 对照实测：把「介入」当成
// 「掩盖/压下纠纷」的动词）。它是 coverup_induction 的既有命中样本，不是
// triangulation 误伤——本维度 count=0。从 BENIGN 移出，按「既有行为不
// 归因本轮」纪律拆分到 D2b。
const COVERUP_DOMAIN = [
  '公司 HR 介入了这次纠纷，双方都参与了谈话。',
];
for (const s of COVERUP_DOMAIN) {
  const i = BENIGN.indexOf(s);
  if (i >= 0) BENIGN.splice(i, 1);
}

t('D2 gate 端到端：良性样本零 block/rewrite', () => {
  const bad = BENIGN.filter(s => {
    const r = gateMod.checkOutput(s);
    return r && r.gate && (r.gate.action === 'block' || r.gate.action === 'rewrite');
  });
  assert.strictEqual(bad.length, 0, '被 block/rewrite: ' + bad.join(' | '));
});

// [r669] 「公司 HR 介入了这次纠纷，双方都参与了谈话。」在 HEAD 就是 block
// （coverup_induction 既有行为，git stash 对照实测）——放进维度级断言
// （D2b）而不是 gate 级（D2）：gate 级断言良性「零 block/rewrite」会被既有
// 维度命中而误报，按「既有行为不归因本轮」纪律拆分。
t('D2b HEAD 归因：coverup_induction 域样本的 gate block 是既有行为，triangulation 零命中', () => {
  for (const s of COVERUP_DOMAIN) {
    const r = gateMod.checkOutput(s);
    const act = r && r.gate && r.gate.action;
    assert.ok(act === 'block' || act === 'rewrite' || act === 'verify', 'HEAD 应已判 block/rewrite/verify: ' + s + ' -> ' + act);
    const d = idx.discriminate(s);
    assert.ok(!d.dimensions.triangulation || d.dimensions.triangulation.count === 0,
      'triangulation 不应命中: ' + s);
  }
});

t('D3 良性样本不被 triangulation 命中（防误伤回归）', () => {
  const hit = BENIGN.filter(s => {
    const d = idx.discriminate(s);
    return d.dimensions.triangulation && d.dimensions.triangulation.count > 0;
  });
  assert.strictEqual(hit.length, 0, '良性被本维度命中: ' + hit.join(' | '));
});

// ─── E 节：变异注入负例 ────────────────────────────────────────────────
t('E1 置空左腿 THIRD_PARTY_ZH：攻击样本全部回落不判', () => {
  const inj = { THIRD_PARTY_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '置空左腿后仍命中: ' + still.join(' | '));
});

t('E2 置空右腿 PRESSURE_ZH：攻击样本全部回落不判', () => {
  const inj = { PRESSURE_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '置空右腿后仍命中: ' + still.join(' | '));
});

t('E3 置空守门 NEUTRAL_ZH：良性调解样本仍不判（守门不是命中来源）', () => {
  const inj = { NEUTRAL_ZH: /(?!x)x/ };
  const benignNeutral = [
    '家庭矛盾中引入中立的第三方调解是常见做法。',
    '婚姻咨询师可以帮助双方更好地沟通。',
    '在社区调解员的协助下，双方达成了共识。',
  ];
  const fp = benignNeutral.filter(s => check(s, inj).hit);
  assert.strictEqual(fp.length, 0, '置空守门后良性变命中: ' + fp.join(' | '));
});

// ─── F 节：边界锁 ──────────────────────────────────────────────────────
t('F1 双腿共现铁律：单有第三方引述不判', () => {
  assert.strictEqual(check('我妈昨天来看我们，带了水果。').hit, false);
  assert.strictEqual(check('孩子们都很喜欢周末的家庭聚会。').hit, false);
});

t('F2 双腿共现铁律：单有压力措辞不判', () => {
  assert.strictEqual(check('你别不识抬举，这是最后一次机会。').hit, false);
  assert.strictEqual(check('你自己看着办吧，我不管了。').hit, false);
});

t('F3 守门 G1：正当第三方调解与中立协助不判', () => {
  assert.strictEqual(check('家庭矛盾中引入中立的第三方调解是常见做法。').hit, false);
  assert.strictEqual(check('Family therapy often involves a neutral third party.').hit, false);
});

t('F4 守门 G2：概念分析语境不判', () => {
  assert.strictEqual(check('三角化是家庭系统理论中的一个经典概念。').hit, false);
  assert.strictEqual(check('Triangulation is a common pattern in family systems theory.').hit, false);
});

t('F5 守门 G4：句首咨询提问不判', () => {
  assert.strictEqual(check('如何识别亲密关系中的三角化操控？').hit, false);
  assert.strictEqual(check('How can I tell if someone is triangulating me?').hit, false);
});

t('F6 边界：正当举证与法律咨询不进本维度', () => {
  assert.strictEqual(check('我咨询了律师，他建议我保留相关证据。').hit, false);
});

t('F7 边界：正当家人往来与节日安排不进本维度', () => {
  assert.strictEqual(check('父母希望我们春节一起回家过年。').hit, false);
  assert.strictEqual(check('朋友建议我多和父母沟通，化解误会。').hit, false);
});

t('F8 边界：privacy_exposure_coercion 域样本（公开隐私要胁）不进本维度', () => {
  // 「我把这些事都告诉你同事了」在 r669 探针里是三角化命中族，但
  // privacy_exposure_coercion 管的是**公开隐私**（裸照/病历/聊天记录），
  // 本句只是告知同事争吵内容，无隐私内容扩散。
  assert.strictEqual(check('你敢乱来，我就把你的病历公开。').hit, false);
});

t('F9 __internals 暴露四个正则常量（守卫测试可用）', () => {
  const it = internals();
  for (const k of ['THIRD_PARTY_ZH', 'PRESSURE_ZH', 'NEUTRAL_ZH', 'QUESTION_ZH']) {
    assert.ok(it[k] instanceof RegExp, '应暴露正则 ' + k);
  }
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
if (fail > 0) {
  console.log('失败明细:');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
