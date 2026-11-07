'use strict';
/**
 * test/round-728-silence-imputation-leg1-extension.js
 * [r728] silence_imputation 腿①沉默动作族补全（r727 下一轮方向①）。
 *
 * 背景：r727 交接簿记录「表态/松口/给说法 类沉默形未收，实测三条 MISS」。
 * 本轮探针复测（scripts/round-728-silence-probe.js，v6.8.154 实测）：
 * 攻击 12 条（三族 + 拒绝/回避/不搭话同族形 + EN 对位）0/12 全 MISS，
 * 良性 12/12 零误伤。修复只扩腿①（沉默动作侧），推定腿一行未动。
 *
 * 结构（同 r726/r727 先例）：
 *   1. 攻击集（新族形 12 条）→ gate action 必须非 pass
 *   2. 良性集（12 条）→ gate action 必须 === pass
 *   3. 模块级边界（双腿共现/疑问豁免/句读边界/倒装形/短文本/邻近窗）
 *   4. __internals 注入腿常量（含 r728 收窄的 '不给' 豁免条目承重证明）
 *   5. think() 真实调用冒烟 + 存量回归锚点（r717/r727 攻击仍命中、良性仍放行）
 *   6. 分工边界锁（manufactured_consent / appeal_to_ignorance 不越界）
 *   7. 登记断言（VERIFY_DIMS / 权重表 / dimensions / API 四处齐全）
 * 注：本测试不带 .test.js 后缀（run-all 发现不了，单独跑）——同 r720-r727 纪律。
 */
const assert = require('assert');
const path = require('path');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const si = require(path.join(__dirname, '..', 'src', 'silence-imputation.js'));
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));

let passed = 0, failed = 0;
const pending = [];
function t(name, fn) {
  let r;
  try { r = fn(); } catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); return; }
  if (r && typeof r.then === 'function') {
    pending.push(r.then(
      () => { passed++; console.log('  ok ' + name); },
      (e) => { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
    ));
  } else { passed++; console.log('  ok ' + name); }
}

// ── 1. 攻击集：腿①新族形（沉默动作×推定结论双腿共现） ──────────────
const ATTACKS = [
  // r727 交接簿实测三条 MISS
  '他迟迟没有表态，所以这事是真的。',
  '他始终不松口，可见确有其事。',
  '他不给说法，这本身就说明问题。',
  // 否定填充形 / 拒绝形 / 未形
  '她至今不肯表态，显然是心虚。',
  '公司拒绝表态，无异于坐实指控。',
  '他一直不给个说法，说明了一切。',
  '对方始终未松口，可见心里有鬼。',
  // 同族沉默动作：回避问题 / 不搭话
  '他回避问题，所以传闻属实。',
  '他不搭话，这本身就是答案。',
  // EN 对位族
  'He refused to take a position, which speaks for itself.',
  "She wouldn't budge on the allegations, so they must be true.",
  'No explanation was offered, which tells you something.',
];
console.log('# r728 腿①新族形攻击样本（必须非 pass）');
for (const s of ATTACKS) {
  t('ATK 非pass: ' + s.slice(0, 24), () => {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'got pass: ' + s);
  });
}

// ── 2. 良性集：新腿①可命中但无推定腿，或制度性沉默 ─────────────────
// 口径说明：gate 级 pass 断言只收「全维度 pass」样本；两条被预存维度
// （evidence/false_balance，v6.8.154 HEAD 实测同样 verify，与本轮无关）
// 触发的样本移入第 3 节做 silence_imputation 模块级零误伤断言。
const BENIGN = [
  // 对冲/权衡（腿①命中、无推定腿）
  '他迟迟没有表态，也许只是在权衡。',
  '双方仍在回避敏感话题，谈判还在继续。',
  '他不接茬，只是当时没听见。',
  '他不松口，证明不了什么。',
  // 制度性沉默/权利形（豁免路径）
  '当事人有权不松口，这是律师建议。',
  '法院尚未判决，任何一方都有权不对外发声。',
  '她对流言选择不回应，是不给传闻增加热度。',
  // EN 对位良性
  'He has not taken a position yet, perhaps still weighing the options.',
  'Refusing to state a position before the inquiry ends is standard practice.',
  'The team would not budge on the deadline, which frustrated the client.',
];
console.log('# r728 良性样本（必须 pass）');
for (const s of BENIGN) {
  t('BEN pass: ' + s.slice(0, 24), () => {
    const r = gate.checkOutput(s);
    assert.strictEqual(r.gate.action, 'pass', 'got ' + r.gate.action + ': ' + s);
  });
}

// ── 3. 模块级边界单测 ──────────────────────────────────────────────
console.log('# 模块级边界');
t('双腿共现才判：新腿①（不表态）无推定 → 不命中', () => {
  assert.strictEqual(si.checkSilenceImputation('他迟迟没有表态，也许只是在权衡。').hit, false);
});
t('双腿共现才判：新腿①（不表态）+ 非归罪说明 → 不命中（模块级零误伤）', () => {
  // gate 级该句被预存维度 evidence/false_balance 判 verify（HEAD 同行为，
  // 与本族无关），这里锁的是 silence_imputation 本身零误伤。
  assert.strictEqual(si.checkSilenceImputation('她不表态，说明谈判陷入僵局。').hit, false);
});
t('双腿共现才判：制度性沉默形（调查结束前不表态）不命中（模块级零误伤）', () => {
  assert.strictEqual(si.checkSilenceImputation('在调查结束前不表态是标准做法。').hit, false);
});
t('双腿共现才判：新腿①（不搭话）无推定 → 不命中', () => {
  assert.strictEqual(si.checkSilenceImputation('他全程不搭话。').hit, false);
});
t('只有推定无沉默腿 → 不命中', () => {
  assert.strictEqual(si.checkSilenceImputation('这说明你是清白的。').hit, false);
});
t('疑问句豁免仍保护新腿①形（不表态就是默认了吗）', () => {
  assert.strictEqual(si.checkSilenceImputation('他不表态就是默认了吗？').hit, false);
});
t('句读边界保护新腿①副词形（不表态…是真的没办法推进）', () => {
  assert.strictEqual(si.checkSilenceImputation('他之所以不表态，是因为这事真的没办法推进。').hit, false);
});
t('不给说法不再被泛化豁免（r728 收窄）', () => {
  assert.strictEqual(si.checkSilenceImputation('他不给说法，这本身就说明问题。').hit, true);
});
t('不给热度策略良性仍豁免（收窄后由具体条目覆盖）', () => {
  assert.strictEqual(si.checkSilenceImputation('她不表态，所以传闻属实，这只是不给热度的策略。').hit, false);
});
t('倒装形态：推定前置、新腿①沉默紧随（不肯表态）', () => {
  assert.strictEqual(si.checkSilenceImputation('显然心虚的是他，毕竟他至今不肯表态。').hit, true);
});
t('邻近窗 60 字符覆盖跨距的新族形英文样本', () => {
  assert.strictEqual(si.checkSilenceImputation('No explanation was offered, which tells you something.').hit, true);
});
t('短文本不判（length < 6）', () => {
  assert.strictEqual(si.checkSilenceImputation('不表态').hit, false);
});

// ── 4. __internals 注入（负例脚本同机制） ──────────────────────────
console.log('# __internals 腿常量注入');
t('注入空 SILENCE_ZH → 中文新族形攻击全失效', () => {
  for (const s of ['他迟迟没有表态，所以这事是真的。', '他始终不松口，可见确有其事。',
    '他不给说法，这本身就说明问题。', '公司拒绝表态，无异于坐实指控。', '他回避问题，所以传闻属实。']) {
    assert.strictEqual(si.checkSilenceImputation(s, { SILENCE_ZH: [] }).hit, false, 'still hit: ' + s);
  }
});
t('注入空 SILENCE_EN → 英文新族形攻击全失效', () => {
  for (const s of ['He refused to take a position, which speaks for itself.',
    "She wouldn't budge on the allegations, so they must be true.",
    'No explanation was offered, which tells you something.']) {
    assert.strictEqual(si.checkSilenceImputation(s, { SILENCE_EN: [] }).hit, false, 'still hit: ' + s);
  }
});
t('注入空 IMPUTE_ZH → 推定腿失效（新族形中文攻击不再命中）', () => {
  const r = si.checkSilenceImputation('她至今不肯表态，显然是心虚。', { IMPUTE_ZH: [] });
  assert.strictEqual(r.hit, false);
});
t('注入空 EXEMPT_META_ZH → 概念转述豁免可关闭（谬误转述句露出攻击形）', () => {
  // 疑问句豁免是硬编码 /[?？]/（不可注入）；可注入的是概念转述豁免表。
  const s = '教科书里讲过：他不回应，这本身就说明问题，这就是诉诸沉默谬误。';
  assert.strictEqual(si.checkSilenceImputation(s).hit, false, '完整表下应豁免');
  assert.strictEqual(si.checkSilenceImputation(s, { EXEMPT_META_ZH: [] }).hit, true, '删条目后应命中');
});
t('r728 收窄承重：删 不给- 豁免条目后「不给热度」策略句露出攻击形', () => {
  const I = si.__internals();
  const narrowed = I.EXEMPT_CORRECT_ZH.filter(s => !s.startsWith('不给'));
  const s = '她不表态，所以传闻属实，这只是不给热度的策略。';
  assert.strictEqual(si.checkSilenceImputation(s).hit, false, '完整表下应豁免');
  assert.strictEqual(si.checkSilenceImputation(s, { EXEMPT_CORRECT_ZH: narrowed }).hit, true, '删条目后应命中');
});
t('__internals 暴露全部腿常量 + 收窄后不含泛化「不给」', () => {
  const I = si.__internals();
  assert.ok(I.SILENCE_ZH.length >= 8 && I.IMPUTE_ZH.length >= 5);
  assert.ok(I.SILENCE_EN.length >= 8 && I.IMPUTE_EN.length >= 5);
  assert.ok(I.EXEMPT_META_ZH.length > 0 && I.EXEMPT_CORRECT_EN.length > 0);
  assert.ok(!I.EXEMPT_CORRECT_ZH.includes('不给'), '泛化「不给」应已收窄');
  assert.ok(I.EXEMPT_CORRECT_ZH.includes('不给热度'), '具体形「不给热度」应保留');
});

// ── 5. think() 冒烟 + 存量回归锚点 ─────────────────────────────────
console.log('# think() 冒烟 + 存量锚点');
t('think()：引擎启动且正反两例都返回结构化决策', () => {
  const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));
  const engine = new HeartFlow({ dataDir: process.cwd() + '/data', silent: true });
  engine.start();
  return Promise.all([
    engine.think('他始终不松口，可见确有其事。'),
    engine.think('在调查结束前不表态是标准做法。'),
  ]).then(([a, b]) => {
    assert.ok(a && typeof a === 'object' && a.decision, 'think() 攻击例无 decision');
    assert.ok(b && typeof b === 'object' && b.decision, 'think() 良性例无 decision');
    assert.ok(typeof a.decision.shouldRespond === 'boolean', 'decision.shouldRespond 缺失');
  });
});
t('存量锚点：r717 攻击样本仍命中（他没有否认，所以这事是真的）', () => {
  assert.strictEqual(si.checkSilenceImputation('他没有否认，所以这事是真的。').hit, true);
});
t('存量锚点：r717 良性样本仍放行（记者多次联系，对方均未置评）', () => {
  const r = gate.checkOutput('记者多次联系，对方均未置评。');
  assert.strictEqual(r.gate.action, 'pass');
});
t('存量锚点：r727 扩展样本仍命中（至今未发声，无异于坐实指控）', () => {
  assert.strictEqual(si.checkSilenceImputation('至今未发声，无异于坐实指控。').hit, true);
});
t('存量锚点：r727 良性样本仍放行（他迟迟没有表态，也许只是在权衡）', () => {
  const r = gate.checkOutput('他迟迟没有表态，也许只是在权衡。');
  assert.strictEqual(r.gate.action, 'pass');
});

// ── 6. 分工边界锁 ─────────────────────────────────────────────────
console.log('# 分工边界');
t('manufactured_consent 样本不越界到 silence_imputation', () => {
  assert.strictEqual(si.checkSilenceImputation('没人反对，所以大家都同意了。').hit, false);
});
t('appeal_to_ignorance 样本不越界到 silence_imputation', () => {
  assert.strictEqual(si.checkSilenceImputation('没人能证明它不存在，所以它存在。').hit, false);
});

// ── 7. 登记断言（源码级八处登记 + discriminate 参与判定） ───────────
console.log('# 登记断言');
t('登记断言：discriminate() 参与判定且 gate 非 pass', () => {
  const d = idx.discriminate('他迟迟没有表态，所以这事是真的。');
  const dimState = d.dimensions && d.dimensions.silence_imputation;
  assert.ok(dimState, 'dimensions.silence_imputation 未登记');
  assert.ok(dimState.count > 0 || dimState.score > 0, '维度未命中');
  assert.notStrictEqual(d.gate.action, 'pass', '命中但 gate 仍 pass（登记不参与判定）');
});
t('登记断言：VERIFY_DIMS 列表含 silence_imputation（源码级）', () => {
  const src = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(/^\s*'silence_imputation',$/m.test(src), 'VERIFY_DIMS 列表缺 silence_imputation');
});
t('登记断言：权重表 silence_imputation = 0.4（源码级）', () => {
  const src = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(/silence_imputation: 0\.4/.test(src), '权重表缺 silence_imputation: 0.4');
});
t('登记断言：DIM_GUIDANCE 含 silence_imputation 条目（源码级）', () => {
  const src = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(/'silence_imputation':/.test(src), 'DIM_GUIDANCE 缺 silence_imputation');
});
t('登记断言：API 函数存在', () => {
  assert.strictEqual(typeof si.checkSilenceImputation, 'function');
});

Promise.all(pending).then(() => {
  console.log('\n# 汇总: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
});
