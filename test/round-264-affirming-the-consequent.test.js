'use strict';
/**
 * test/round-264-affirming-the-consequent.test.js
 * [r264] affirming_the_consequent（第 155 维度）全新推断词家族扩展
 * （真升级②，live 生效，维度计数 229 不变，src/index.js 零改动）。
 *
 * r264 池化探针实测（coordination/agent4/probes/r264-probe-pool.js，
 * v6.8.153）：本维 11 条新措辞攻击 10 条完全穿透（gate.action=pass 且
 * 零维度承重，全池十家族最高），补丁后 11/11 模块命中、11/11 gate 层
 * 本维承重、0 条全放行、良性 0 误伤；四门禁零漂移。
 *
 * 新增腿②推断词族：
 *   INFER_ZH += 足见 / 据此可得 / 毫无疑问 / 反映出 / 透露出
 *   INFER_EN += indicates / suggests / points to / shows that /
 *               implies that / demonstrates / reflects
 * 附带修复 EN 裸规则句回指失配：A='Founders read' 对结论
 *   'she is a founder' 单复数不一致整句漏判——_matchIn EN 分支加
 *   单复数宽容回指（k 以 s 结尾且非 ss、去 s 后在事实词集中）。
 * HEDGE 同步补 only one signal / only one possible（新推断词上线后
 *   承重的对冲形，防「which suggests honesty is only one possible
 *   reading」类误伤）。
 *
 * 覆盖：新攻击矩阵 + 新良性零误伤 + gate 层接线 + 逐新模式注入-删条
 * 承重（行内精确删词重编译 + 旧分支不受影响对照）+ 单复数回注注入 +
 * HEDGE 扩展承重 + 存量回归 + 登记断言 + 收尾自检。
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const Module = require('module');
const ROOT = path.join(__dirname, '..');
const modPath = path.join(ROOT, 'src', 'affirming-the-consequent.js');
const atcMod = require(modPath);
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));
const check = atcMod.checkAffirmingTheConsequent;
const hit = (t) => check(t).count > 0;

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}
const ok = (cond, msg) => assert.ok(cond, msg);

// ─── 注入装载器：行内精确删词后重编译（不动模块常量本身）────────────
function compileSrc(src) {
  const m = new Module(modPath, null);
  m.filename = modPath;
  m.paths = Module._nodeModulePaths(path.dirname(modPath));
  m._compile(src, modPath);
  return m.exports;
}
function loadWithWordRemoved(arrName, word) {
  const lines = fs.readFileSync(modPath, 'utf8').split('\n');
  const li = lines.findIndex(l => l.startsWith('const ' + arrName + ' = ['));
  ok(li >= 0, '未找到常量行: ' + arrName);
  const before = lines[li].length;
  lines[li] = lines[li].split(', \'' + word + '\'').join('').split('\'' + word + '\', ').join('');
  ok(lines[li].length < before, '删词未生效: ' + arrName + ' / ' + word);
  return compileSrc(lines.join('\n'));
}
function loadWithFallbackRemoved() {
  const lines = fs.readFileSync(modPath, 'utf8').split('\n');
  const fi = lines.findIndex(l => l.includes('k.length > 3 && /s$/.test(k)'));
  ok(fi >= 0, '未找到单复数宽容回指分支');
  ok(/for \(const k of kws\) \{/.test(lines[fi - 1]), '回指分支上下文不符');
  assert.strictEqual(lines[fi + 1].trim(), '}', '回指分支闭合不符');
  lines.splice(fi - 1, 3); // 删 for 头 / if 行 / 闭合花括号
  return compileSrc(lines.join('\n'));
}
function loadWithHedgeWordRemoved(word) {
  const lines = fs.readFileSync(modPath, 'utf8').split('\n');
  const hi = lines.findIndex(l => l.startsWith('const HEDGE = ['));
  ok(hi >= 0, '未找到 HEDGE 行');
  const before = lines[hi].length;
  lines[hi] = lines[hi].split(', \'' + word + '\'').join('').split('\'' + word + '\', ').join('');
  ok(lines[hi].length < before, 'HEDGE 删词未生效: ' + word);
  return compileSrc(lines.join('\n'));
}

// ─── 1. 新攻击矩阵（新推断词族，中英双语）──────────────────────────
const NEW_ATTACKS = [
  // ZH 新推断词
  '努力的人都会早起；他天天早起，足见他很努力。',
  '好的代码都有测试；这个模块有测试，据此可得代码质量高。',
  '靠谱的厂商都敢公开供应链；这家敢公开，毫无疑问它靠谱。',
  '精英都住这个区；他住这个区，反映出他是精英。',
  '真诚的人都会直面错误；他直面了错误，透露出他是真诚的人。',
  // EN 新推断词
  'Good code has tests. This module has tests, which indicates the code is good.',
  'Honest people admit mistakes. He admitted his, which suggests he is honest.',
  'Top performers read a lot. She reads a lot, which points to her being a top performer.',
  'Real leaders delegate. He delegated the whole project, which shows that he is a real leader.',
  'Serious founders code. She coded the prototype herself, which implies that she is a serious founder.',
  'Great teams ship weekly. This team ships weekly, which demonstrates that it is a great team.',
  'Good writing is short. This doc is short, which reflects good writing.',
  // EN 单复数回指（裸规则句 A 复数形 × 结论单数形）
  'Founders read a lot. She reads a lot, so it follows that she is a founder.',
  'Champions train daily. He trains daily, therefore he is a champion.',
];
NEW_ATTACKS.forEach((s, i) => t('攻击-' + (i + 1), () => assert.strictEqual(hit(s), true, '未命中: ' + s)));

// ─── 2. 新良性样本（对冲 / 充分性否定 / 单腿）──────────────────────
const NEW_BENIGN = [
  '努力的人都会早起；他天天早起，不过早起未必说明努力。',
  '好的代码都有测试；这个模块有测试，但测试只是必要条件，不能反推质量。',
  '靠谱的厂商都敢公开供应链；这家敢公开，但公开未必说明它靠谱。',
  'Good code has tests. This module has tests, which indicates nothing about quality on its own.',
  'Honest people admit mistakes. He admitted his, which suggests honesty is only one possible reading.',
  'Champions train daily. He trains daily, therefore he might be a champion.',
  'Honest people admit mistakes. He admitted his, which suggests he is honest, though this is only one signal.',
];
NEW_BENIGN.forEach((s, i) => t('良性-' + (i + 1), () => assert.strictEqual(hit(s), false, '误伤: ' + s)));

// ─── 3. gate 层接线：新攻击非 pass 且 findings 含本维 ──────────────
NEW_ATTACKS.forEach((s, i) => t('gate攻击-' + (i + 1), () => {
  const r = gate(s);
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 非 pass: ' + s);
  const f = (r.findings || []).find(x => x.dimension === 'affirming_the_consequent');
  ok(f, 'findings 应含 affirming_the_consequent: ' + s);
}));

// ─── 4. gate 层新良性不被本维命中 ─────────────────────────────────
NEW_BENIGN.forEach((s, i) => t('gate良性-' + (i + 1), () => {
  const r = gate(s);
  const f = (r.findings || []).find(x => x.dimension === 'affirming_the_consequent');
  ok(!f, '新良性不应触发本维: ' + s);
}));

// ─── 5. 逐新模式注入-删条承重 + 旧分支不受影响 ─────────────────────
const INJECTIONS = [
  { arr: 'INFER_ZH', word: '足见', atk: '努力的人都会早起；他天天早起，足见他很努力。' },
  { arr: 'INFER_ZH', word: '据此可得', atk: '好的代码都有测试；这个模块有测试，据此可得代码质量高。' },
  { arr: 'INFER_ZH', word: '毫无疑问', atk: '靠谱的厂商都敢公开供应链；这家敢公开，毫无疑问它靠谱。' },
  { arr: 'INFER_ZH', word: '反映出', atk: '精英都住这个区；他住这个区，反映出他是精英。' },
  { arr: 'INFER_ZH', word: '透露出', atk: '真诚的人都会直面错误；他直面了错误，透露出他是真诚的人。' },
  { arr: 'INFER_EN', word: 'indicates', atk: 'Good code has tests. This module has tests, which indicates the code is good.' },
  { arr: 'INFER_EN', word: 'suggests', atk: 'Honest people admit mistakes. He admitted his, which suggests he is honest.' },
  { arr: 'INFER_EN', word: 'points to', atk: 'Top performers read a lot. She reads a lot, which points to her being a top performer.' },
  { arr: 'INFER_EN', word: 'shows that', atk: 'Real leaders delegate. He delegated the whole project, which shows that he is a real leader.' },
  { arr: 'INFER_EN', word: 'implies that', atk: 'Serious founders code. She coded the prototype herself, which implies that she is a serious founder.' },
  { arr: 'INFER_EN', word: 'demonstrates', atk: 'Great teams ship weekly. This team ships weekly, which demonstrates that it is a great team.' },
  { arr: 'INFER_EN', word: 'reflects', atk: 'Good writing is short. This doc is short, which reflects good writing.' },
];
const OLD_CTRL = '努力的人都会早起；他天天早起，所以他很努力。';
INJECTIONS.forEach((c) => t('注入-' + c.word, () => {
  assert.strictEqual(hit(c.atk), true, '正向命中: ' + c.word);
  const m2 = loadWithWordRemoved(c.arr, c.word);
  assert.strictEqual(m2.checkAffirmingTheConsequent(c.atk).count > 0, false,
    '删 [' + c.word + '] 后攻击须转 miss（承重证明）');
  assert.strictEqual(m2.checkAffirmingTheConsequent(OLD_CTRL).count > 0, true,
    '删 [' + c.word + '] 后旧攻击仍命中（旧分支不受影响）');
}));

// ─── 6. 单复数宽容回指注入：删回指分支后两攻击须转 miss ────────────
const PLURAL = [
  'Founders read a lot. She reads a lot, so it follows that she is a founder.',
  'Champions train daily. He trains daily, therefore he is a champion.',
];
PLURAL.forEach((s, i) => t('单复数正向-' + (i + 1), () => assert.strictEqual(hit(s), true, '未命中: ' + s)));
t('单复数注入', () => {
  const m2 = loadWithFallbackRemoved();
  PLURAL.forEach((s) => assert.strictEqual(m2.checkAffirmingTheConsequent(s).count > 0, false,
    '删单复数回指分支后须转 miss（承重证明）: ' + s));
  assert.strictEqual(m2.checkAffirmingTheConsequent('Good code has tests. This module has tests, so the code is good.').count > 0, true,
    '删回指分支后非复数形 EN 攻击仍命中');
});

// ─── 7. HEDGE 扩展承重：删新对冲词后误伤须复现 ─────────────────────
t('HEDGE 注入-only one possible', () => {
  const m2 = loadWithHedgeWordRemoved('only one possible');
  assert.strictEqual(m2.checkAffirmingTheConsequent('Honest people admit mistakes. He admitted his, which suggests honesty is only one possible reading.').count > 0, true,
    '删 HEDGE only one possible 后对冲句须转命中（HEDGE 承重）');
});
t('HEDGE 注入-only one signal', () => {
  const m2 = loadWithHedgeWordRemoved('only one signal');
  assert.strictEqual(m2.checkAffirmingTheConsequent('Honest people admit mistakes. He admitted his, which suggests he is honest, though this is only one signal.').count > 0, true,
    '删 HEDGE only one signal 后对冲句须转命中（HEDGE 承重）');
});

// ─── 8. 存量回归：r725 家族攻击仍判、良性仍放行 ────────────────────
t('存量回归-攻击', () => {
  const old = [
    '如果是他干的，他会留下痕迹；现场有痕迹，所以是他干的',
    '努力的人都会早起；他天天早起，所以他很努力',
    'If he were guilty, he would act nervous. He looks nervous, so he is guilty.',
    'Good code has tests. This module has tests, so the code is good.',
  ];
  for (const s of old) assert.strictEqual(hit(s), true, '存量攻击回归翻转: ' + s);
});
t('存量回归-良性', () => {
  const oldBenign = [
    '如果是他干的，他会留下痕迹；现场没有痕迹，说明可能不是他干的',
    '如果明天下雨，运动会就取消；明天下雨了，所以运动会取消',
    'If it rains, the game is off. It is raining, so the game is off.',
  ];
  for (const s of oldBenign) assert.strictEqual(hit(s), false, '存量良性回归翻转: ' + s);
});

// ─── 9. 登记断言 ─────────────────────────────────────────────────
t('登记-dimensions/VERIFY_DIMS/导出/__internals', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  ok(keys.includes('affirming_the_consequent'), 'dimensions 键缺失');
  ok(keys.length >= 229, '维度键总数应 ≥229: got ' + keys.length);
  const src = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  ok(/VERIFY_DIMS[\s\S]{0,5000}?affirming_the_consequent/.test(src), 'VERIFY_DIMS 未含本维');
  assert.strictEqual(typeof idx.checkAffirmingTheConsequent, 'function', 'index.js 未导出 checkAffirmingTheConsequent');
  const need = ['COND_IF', 'COND_UNIVERSAL', 'COND_HUI', 'INFER_ZH', 'INFER_EN',
    'NEG_ZH', 'NEG_EN', 'HEDGE', 'META_CONCEPT', 'TEACH', 'EVIDENCE'];
  for (const k of need) ok(atcMod.__internals && atcMod.__internals[k], '__internals 缺 ' + k);
  ok(atcMod.__internals.INFER_ZH.includes('足见'), 'INFER_ZH 缺 足见');
  ok(atcMod.__internals.INFER_EN.includes('indicates'), 'INFER_EN 缺 indicates');
  ok(atcMod.__internals.HEDGE.includes('only one signal'), 'HEDGE 缺 only one signal');
});

// ─── 10. 收尾自检（注入未污染模块常量）────────────────────────────
t('收尾-模块常量未污染', () => {
  assert.strictEqual(hit(OLD_CTRL), true, '收尾自检：旧攻击仍命中');
  assert.strictEqual(hit('Good code has tests. This module has tests, which indicates the code is good.'), true, '收尾自检：新攻击仍命中');
  assert.strictEqual(hit('Champions train daily, therefore he might be a champion.'), false, '收尾自检：对冲良性仍放行');
});

console.log('✓ 新攻击矩阵 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 全部命中（新推断词族 + EN 单复数回指）');
console.log('✓ 新良性样本 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 零误伤（对冲/充分性否定/HEDGE 新词承重）');
console.log('✓ gate 层接线 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 新攻击非 pass 且 findings 含本维');
console.log('✓ gate 层新良性 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 无本维误伤');
console.log('✓ 逐新模式注入 ' + INJECTIONS.length + ' 个：' + INJECTIONS.length + ' 个变红，0 个未变红（行内精确删词重编译 + 旧分支对照）');
console.log('✓ 单复数宽容回指注入 2 个：2 个变红，0 个未变红（非复数形对照不受影响）');
console.log('✓ HEDGE 扩展承重：only one possible / only one signal 删后对冲句转命中');
console.log('✓ 存量回归：r725 家族 4/4 攻击仍命中、3/3 良性仍放行');
console.log('✓ 登记断言：dimensions 键 ≥229 含本维、VERIFY_DIMS/index 导出/__internals 齐全');
console.log('✓ 收尾自检：模块常量未被注入污染');

console.log('\n全部断言通过（affirming_the_consequent 第 155 维度 · r264 新推断词族扩展）');
console.log('测试结果: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个');
if (fails.length) {
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
}
