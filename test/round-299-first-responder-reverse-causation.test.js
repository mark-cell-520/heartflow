'use strict';
/**
 * test/round-299-first-responder-reverse-causation.test.js
 * [r299] reverse_causation 第 172 维度「应急响应调度框」新措辞家族（真升级②）。
 *
 * 缺口实证（scripts/round-299/probe-rc-r299.js，v6.8.174 gate() 动手前）：
 *   第一响应者被按危机强度调度，却被当成制造/加剧危机的原因——「Firefighters
 *   are present at every big fire, so sending more firefighters makes fires
 *   bigger.」类 10 条攻击中 7 条 gate.action=pass 且 rc/cc 零命中（真零命中）；
 *   7 条良性对照全部 pass。根因：RESP_EN/RESP_ZH 未收第一响应者名词，且危机
 *   名词（大火/事故/风暴）不在 RESULT 表、中文常用 越X越Y 无显式因果动词，
 *   既有「行为+群体+差异」框整体套不上。
 *
 * 落地（全部在既有已接线模块 src/reverse-causation.js 内，src/index.js 零改动）：
 *   新增 RESPONDER_ZH/EN + CRISIS_ZH/EN，新增主判据 B responderDispatch——
 *   响应者名词 × 危机名词 × 因果连接（显式因果动词且方向为「响应者→动词→危机」
 *   + 否定守卫，或中文 越X越Y / 英文 the more…the more），复用 CAUSE 表，
 *   既有主判据 A 路径逐字保留。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const rcMod = require(path.join(ROOT, 'src', 'reverse-causation.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fails.push(name + ' :: ' + e.message); }
}
const rcHit = (s, inj) => rcMod.checkReverseCausation(s, inj).score > 0;
const gateAction = (s) => { const r = gate.check(s); return r.action || (r.gate && r.gate.action); };

// ── 1. 攻击集（第一响应者反向因果，应 rc.hit 且 gate != pass）──────────
const ATTACK = [
  'Firefighters are present at every big fire, so sending more firefighters makes fires bigger.',
  'Paramedics respond to every cardiac arrest, so dispatching more paramedics causes more cardiac arrests.',
  'Tow trucks show up at every highway crash, so more tow trucks cause more crashes.',
  'Ambulances crowd every overdose scene, so more ambulances drive up overdose counts.',
  'Coast guard rescues track every storm, so more rescues cause more storms.',
  'Lifeguards are stationed at every drowning, so hiring more lifeguards increases drownings.',
  '每个大火现场都有消防员，所以多派消防员会让火势更大。',
  '每次心梗发作都有救护车到场，所以多派救护车会导致更多心梗。',
  '每次高速事故都有拖车赶来，所以拖车越多事故越多。',
  '每次溺亡都有救生员在附近，所以救生员增多导致溺亡增多。',
  '台风过后抢险队总是进驻，所以多派抢险队会招来更多台风。',
];
for (const s of ATTACK) {
  t('攻击-rc命中: ' + s.slice(0, 26), () => {
    assert.ok(rcHit(s), 'rc 未命中: ' + s);
  });
  t('攻击-gate非pass: ' + s.slice(0, 26), () => {
    assert.notStrictEqual(gateAction(s), 'pass', 'gate 仍 pass: ' + s);
  });
}

// ── 2. 良性集（应 gate=pass 且 rc 不命中）────────────────────────────
const BENIGN = [
  'Firefighters are present at every big fire; that is their job, not a cause of fires.',
  'We sent more firefighters and contained the fire faster, so damages were much lower.',
  'More paramedics on shift shortened response times and improved cardiac arrest survival.',
  'Because cardiac arrests rose, the city hired more paramedics to keep up with demand.',
  'Dispatching more tow trucks cleared the highway and reduced secondary crashes.',
  'The fire was caused by arson, and firefighters arrived to put it out.',
  'Firefighters do not cause fires; they respond to them.',
  'Randomized trial: staffing more paramedics did not change cardiac arrest outcomes.',
  '消防员赶到现场扑灭大火，保护了居民安全。',
  '因为心梗增多，市里才增派了救护车来应对。',
  '多派拖车清障后，高速二次事故明显减少了。',
];
for (const s of BENIGN) {
  t('良性-rc不命中: ' + s.slice(0, 26), () => {
    assert.ok(!rcHit(s), 'rc 误命中: ' + s);
  });
}

// ── 3. 方向/否定守卫专项（最易误伤的两类良性）────────────────────────
t('守卫-响应者非因果动词主语（fire was caused by arson）', () => {
  assert.ok(!rcHit('The blaze was caused by arson, and the fire crew arrived to put it out.'));
});
t('守卫-显式否定（firefighters do not cause fires）', () => {
  assert.ok(!rcHit('Firefighters do not cause fires; they respond to them.'));
});
t('守卫-否定名词形（not a cause of fires）', () => {
  assert.ok(!rcHit('Firefighters are present at every big fire; that is their job, not a cause of fires.'));
});
t('守卫-正向正确方向（more paramedics improved survival）', () => {
  assert.ok(!rcHit('More paramedics improved cardiac arrest survival across the city.'));
});

// ── 4. 既有 reverse_causation 家族零回归（主判据 A 路径）──────────────
t('回归-A族-住院患者死亡率', () => {
  assert.ok(rcHit('住院患者的死亡率明显更高，所以住院本身增加了死亡风险。'));
});
t('回归-A族-Patients hospitalized', () => {
  assert.ok(rcHit('Patients who were hospitalized had much higher mortality, so hospitalization itself increases the risk of death.'));
});
t('回归-A族良性-随机对照不判', () => {
  assert.ok(!rcHit('随机对照试验表明，住院治疗显著降低了死亡率。'));
});

// ── 5. 登记断言（新常量导出、维度键不变、VERIFY 档）──────────────────
t('登记-RESPONDER/CRISIS 四常量导出且非空', () => {
  const I = rcMod.__internals();
  for (const k of ['RESPONDER_ZH', 'RESPONDER_EN', 'CRISIS_ZH', 'CRISIS_EN']) {
    assert.ok(Array.isArray(I[k]) && I[k].length > 0, k + ' 未导出或为空');
  }
});
t('登记-reverse_causation 维度键仍在（不新增维度键）', () => {
  const keys = Object.keys(gate.discriminate('probe').dimensions);
  assert.ok(keys.includes('reverse_causation'), 'reverse_causation 键缺失');
});

// ── 6. 负例注入（in-memory 置空新族常量 → 攻击翻为零命中）────────────
const enA = 'Firefighters are present at every big fire, so sending more firefighters makes fires bigger.';
const zhA = '每次高速事故都有拖车赶来，所以拖车越多事故越多。';
t('注入-置空 RESPONDER_EN → EN 攻击翻转', () => {
  assert.ok(rcHit(enA) && !rcHit(enA, { RESPONDER_EN: [] }), 'RESPONDER_EN 注入未翻转');
});
t('注入-置空 CRISIS_EN → EN 攻击翻转', () => {
  assert.ok(rcHit(enA) && !rcHit(enA, { CRISIS_EN: [] }), 'CRISIS_EN 注入未翻转');
});
t('注入-置空 RESPONDER_ZH → ZH 攻击翻转', () => {
  assert.ok(rcHit(zhA) && !rcHit(zhA, { RESPONDER_ZH: [] }), 'RESPONDER_ZH 注入未翻转');
});
t('注入-置空 CRISIS_ZH → ZH 攻击翻转', () => {
  assert.ok(rcHit(zhA) && !rcHit(zhA, { CRISIS_ZH: [] }), 'CRISIS_ZH 注入未翻转');
});

console.log('== r299 应急响应调度框（reverse_causation 真升级②）轮测试 ==');
if (fails.length) {
  console.log('结果: ' + pass + ' 通过, ' + fails.length + ' 失败');
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
} else {
  console.log('结果: ' + pass + ' 通过, 0 失败');
}
