/**
 * test/round-366-existential-fallacy.js
 * 第 259 维度 existential_fallacy（存在谬误）测试。
 * 结构同 r253 undistributed-middle 测试：
 *   1) 攻击样本全命中（中英双语 + 裸名词 + 修饰 + 倒装 + 长句）
 *   2) 良性样本全 pass（含边缘良性）
 *   3) 负例注入：逐条把常量置空，验证每条腿承重（不是空挂）
 *   4) gate 层实测：命中必须进 findings 且 gate.action 非 pass
 */
'use strict';

const assert = require('assert');
const path = require('path');
const HF = path.join(__dirname, '..');
const { checkExistentialFallacy } = require(path.join(HF, 'src/existential-fallacy.js'));
const gateMod = require(path.join(HF, 'src/gate.js'));
const gate = gateMod.gate;

// ─── 攻击样本：同族变体矩阵（中英双语/裸名词/修饰/倒装/长句）───────────
const ATTACKS = [
  // 全称→存在（中文）
  '所有喝过这款茶的人都改善了睡眠，所以存在喝茶助眠的人。',
  '凡是坚持这种方法的人都成功了，因此一定存在成功的人。',
  // 条件→存在（中文，探针实证 A7 形）
  '如果按下这个按钮就能获得奖励，那么一定存在获得过奖励的人。',
  '只要按流程操作就能达标，可见存在达标的人。',
  // 规范→存在（中文）
  '每个人都应该遵守交通规则，所以存在遵守交通规则的人。',
  // 定义→存在（中文，探针实证 A9 形）
  '凤凰被定义为百鸟之王，因此存在百鸟之王。',
  // 裸名词形（去后缀仍命中——161 轮教训）
  '所有产品都有质保，所以存在有质保的产品。',
  // 长句 + 修饰
  '这家公司宣称：所有购买过会员服务的用户都享受到了专属折扣，因此必然存在享受过专属折扣的用户。',
  // 英文标准形
  'All unicorns have horns, so there exists a unicorn with a horn.',
  // 英文条件前提→存在结论（if 前提不断言实例）
  'If a machine passes the test, then there must exist a machine that has passed.',
  // 英文定义前提→存在结论（definition 是元语言约定不断言实例）
  'A unicorn is defined as a horse with a horn, so there exists a horse with a horn.',
  // 英文倒装（结论在前、前提在后作理由）
  'There must be a perfect solution, because every problem we face can be solved in principle.',
];

// ─── 良性样本：含边缘良性（正确多因陈述/带存在承诺的合法推理等）───────
const BENIGNS = [
  '失眠是多因共同造成的，包括压力、饮食和作息。',                    // 多因并列
  '有些喝过这款茶的人反馈睡眠改善了，确实存在这样的人。',              // 带存在承诺的合法推理
  '对每个实数 x 都存在 y 使 x+y=0，这是实数集的性质。',               // 数学合法构造
  '从所有天鹅都是白的不能推出存在白色的天鹅。',                        // 否定转移（正确元陈述）
  '所有公民都享有法律规定的平等权利。',                               // 纯全称无存在结论
  'All citizens have the right to vote in a democracy.',             // 英文纯全称
  '调研显示存在一批睡眠改善的用户，占比约三成。',                      // 经验报告
  '存在谬误是经典三段论的形式谬误之一。',                              // 概念转述
  '如果明天下雨，运动会就可能取消。',                                 // 条件句无存在结论
  '产品质量可能存在波动，需要加强抽检。',                             // 对冲
];

// ─── 1+2) 攻击全命中 / 良性全 pass ─────────────────────────────────────
for (const t of ATTACKS) {
  const r = checkExistentialFallacy(t);
  assert.ok(r.hit, `攻击样本未命中: ${t}`);
  assert.ok(r.score >= 0.5, `命中分数过低: ${t} (${r.score})`);
}
for (const t of BENIGNS) {
  const r = checkExistentialFallacy(t);
  assert.ok(!r.hit, `良性样本误伤: ${t} -> ${r.detail}`);
}
console.log(`attacks ${ATTACKS.length}/${ATTACKS.length} hit, benigns ${BENIGNS.length}/${BENIGNS.length} clean`);

// ─── 3) 负例注入：逐条置空常量，验证每条腿承重 ────────────────────────
// 承重判据：把常量族置空后，重新 require 新副本，原本命中的攻击样本
// 必须至少一条变 MISS——证明该腿真的在承重，不是空挂。
const LEGS = [
  ['UNIV_ZH', [/^$UNIV_ZH$/]], ['UNIV_EN', [/^$UNIV_EN$/]],
  ['COND_ZH', [/^$COND_ZH$/]], ['COND_EN', [/^$COND_EN$/]],
  ['NORM_ZH', [/^$NORM_ZH$/]], ['NORM_EN', [/^$NORM_EN$/]],
  ['DEF_ZH', [/^$DEF_ZH$/]], ['DEF_EN', [/^$DEF_EN$/]],
  ['EXISTENCE_ZH', [/^$EXISTENCE_ZH$/]], ['EXISTENCE_EN', [/^$EXISTENCE_EN$/]],
  ['EXIST_CONCL_ZH', [/^$EXIST_CONCL_ZH$/]], ['EXIST_CONCL_EN', [/^$EXIST_CONCL_EN$/]],
];
const mod = require(path.join(HF, 'src/existential-fallacy.js'));
for (const [name, arr] of LEGS) {
  const real = mod[name];
  assert.ok(Array.isArray(real) && real.length > 0, `${name} 常量族为空`);
  let hit = 0;
  for (const t of ATTACKS) if (real.some(re => re.test(t))) hit++;
  assert.ok(hit > 0, `${name} 在任何攻击样本上都不匹配——空挂腿`);
}
console.log('leg-loading: all 12 constant families match ≥1 attack (no dead legs)');

// 负例注入（真置空后重新 require 新副本验证承重）：
// 把每条腿族替换为空数组后，新副本函数必须在部分攻击上 MISS。
function freshModuleWith(overrides) {
  delete require.cache[require.resolve(path.join(HF, 'src/existential-fallacy.js'))];
  const src = require('fs').readFileSync(path.join(HF, 'src/existential-fallacy.js'), 'utf8');
  let patched = src;
  for (const [name, emptyText] of Object.entries(overrides)) {
    // 把 const NAME = [ ... ]; 替换为 const NAME = [];
    const re = new RegExp(`const ${name} = \\[[\\s\\S]*?\\];`, 'm');
    assert.ok(re.test(patched), `注入锚点未找到: ${name}`);
    patched = patched.replace(re, `const ${name} = ${emptyText};`);
  }
  const tmp = path.join(HF, 'src/.tmp-ef-inject-test.js');
  require('fs').writeFileSync(tmp, patched);
  try {
    const m = require(tmp);
    return m;
  } finally {
    require('fs').unlinkSync(tmp);
  }
}

const INJECTIONS = [
  ['UNIV_ZH', '[]'], ['COND_ZH', '[]'], ['NORM_ZH', '[]'], ['DEF_ZH', '[]'],
  ['EXIST_CONCL_ZH', '[]'], ['EXISTENCE_ZH', '[]'],
  ['UNIV_EN', '[]'], ['COND_EN', '[]'], ['NORM_EN', '[]'], ['DEF_EN', '[]'],
  ['EXIST_CONCL_EN', '[]'],
];
for (const [name, empty] of INJECTIONS) {
  const m = freshModuleWith({ [name]: empty });
  let missed = 0;
  for (const t of ATTACKS) if (!m.checkExistentialFallacy(t).hit) missed++;
  assert.ok(missed > 0, `负例注入 ${name}=[] 后仍全命中——该腿不承重（空挂）`);
}
console.log(`negative-injection: ${INJECTIONS.length}/${INJECTIONS.length} legs load-bearing`);

// ─── 4) gate 层实测：命中进 findings 且 action 非 pass ─────────────────
let gateHits = 0;
for (const t of ATTACKS) {
  const r = gate(t);
  const f = (r.findings || []).find(x => x.dimension === 'existential_fallacy');
  if (f && r.gate.action !== 'pass') gateHits++;
}
assert.strictEqual(gateHits, ATTACKS.length, `gate 层仅 ${gateHits}/${ATTACKS.length} 进 findings 且非 pass`);
console.log(`gate-layer: ${gateHits}/${ATTACKS.length} attacks enter findings with non-pass action`);

console.log('ALL PASS — round-366-existential-fallacy');
