'use strict';
/**
 * test/round-730-silence-imputation-leg2-extension.js
 * [r730] silence_imputation（第 213 维，r717 上线）双腿近形族扩展。
 *
 * 背景：r729 交接簿方向⑤「不言语/不作声/没松口/未曾表态 近形可再扩族」。
 * 本轮探针复测（scripts/round-730-silence-probe.js，v6.8.156 实测）：
 * 33 条攻击（腿①近形 + 腿②新形）MISS 28、良性 34/34 零误伤——缺口
 * 远未收敛，r728 扩过的「表态/松口」族之外仍有五族整体缺席：
 *   腿①：缄口/闭口、拒不（只收沉默动词，绝不收拒不认罪）、未发一言/
 *        未置一词、一声不吭、一句话都没说、（没）开过口、EN mum 动词
 *        框架/tight-lipped/not a word/passed on the chance/offered no；
 *   腿②：副词+其（足见其心虚）、说明+在撒谎、恰恰证明+逗号、印证了指控、
 *        EN confirms his guilt / suggests he's guilty；
 *   架构：混排句（中文沉默×英文推定）按语种二选一表，跨语言配对整体漏判。
 *
 * 结构（同 r726-r729 先例）：
 *   1. 攻击集（新族形）→ gate action 必须非 pass
 *   2. 良性集 → gate action 必须 === pass（别族预存污染样本按 r728 口径
 *      移入第 3 节做模块级零误伤断言）
 *   3. 模块级边界（双腿共现/疑问豁免/句读边界/倒装/邻近窗/混排跨语言/
 *      拒不认罪≠沉默/mum=妈妈）
 *   4. __internals 注入（四张腿表逐族承重 + 新豁免条目承重）
 *   5. think() 真实调用冒烟 + 存量回归锚点（r717/r727/r728 仍成立）
 *   6. 分工边界锁
 *   7. 登记断言（VERIFY_DIMS / 权重表 / DIM_GUIDANCE / API）
 * 注：本测试不带 .test.js 后缀（run-all 发现不了，单独跑）——同 r720-r729 纪律。
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

// ── 1. 攻击集：双腿新族形 ─────────────────────────────────────────
const ATTACKS = [
  // 腿①：缄口/闭口族
  '他缄口不言，所以这事是真的。',
  '面对指控，他缄口不语，这说明了一切。',
  '面对追问，他闭口不言，这说明了一切。',
  '她闭口不谈此事，等于默认了。',
  // 腿①：拒不族（只收沉默动词）
  '他拒不吭声，这本身就是答案。',
  '他拒不开口，这本身就是答案。',
  // 腿①：未发一言/未置一词族
  '她未发一言，可见确有其事。',
  '当事人未置一词，等于默认了。',
  '她未置一辞，足见心虚。',
  '他全程未发一语，印证了指控。',
  // 腿①：一声不吭 / 一句话都没说 / 没开过口 / 没有说法
  '她一声不吭，说明指控属实。',
  '他一句话都没说，所以这事是真的。',
  '她始终没开过口，可见确有其事。',
  '当事人至今没有说法，足见其心虚。',
  // 腿①：不言语 / 不搭腔
  '他始终不言语，足见心里有鬼。',
  '他不搭腔，这本身就说出了答案。',
  // 腿①：EN mum / tight-lipped / not a word / passed on / offered no
  'He stayed mum about the payments, which speaks for itself.',
  'She kept mum on the allegations, so they must be true.',
  'Not a word was said by the suspect, which is telling.',
  'He remained tight-lipped, which confirms his guilt.',
  'He passed on the chance to comment, so it must be true.',
  'The company offered no explanation, which confirms the allegations.',
  'Not a single word was uttered, which is telling.',
  // 腿②：副词+其 / 在撒谎 / 恰恰证明+逗号 / 印证了指控
  '他没否认，足见其心虚。',
  '她不回应，说明她在撒谎。',
  '没有回应恰恰证明，这事是真的。',
  '他拒绝回答，这就印证了指控。',
  '她不澄清，显然心里有鬼。',
  '她没有辟谣，显然是真的。',
  // 腿②：EN confirms his guilt / suggests he's guilty
  'No response was issued, which confirms his guilt.',
  "He didn't deny it, which suggests he's guilty.",
  'Her silence all but proves the allegations.',
  // 混排跨语言配对（r730 架构修复）
  '他没有回应，which confirms his guilt.',
  'She refused to comment，这本身就说明问题。',
];
console.log('# r730 双腿新族形攻击样本（必须非 pass）');
for (const s of ATTACKS) {
  t('ATK 非pass: ' + s.slice(0, 24), () => {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'got pass: ' + s);
  });
}

// ── 2. 良性集（gate 级必须 pass） ─────────────────────────────────
// 口径：只收全维度 pass 样本；三条被别族预存维度（contradiction /
// hasty_generalization / fallacies / perfect_error，stash 复测
// v6.8.156 HEAD 同行为）触发的样本移入第 3 节做 silence_imputation
// 模块级零误伤断言。
const BENIGN = [
  '他缄口不言，直到律师到场。',
  '她全程未发一言，这是她的合法权利。',
  '公司决定不置评，等调查结果出来。',
  '他拒不吭声，因为警方建议他保持沉默。',
  '当事人保持缄默，不等于认罪。',
  '他不言语，只是安静地听完了整场会议。',
  'He stayed mum until his lawyer arrived.',
  'She kept mum, which is her right.',
  'Not a word was said, and that does not mean he is guilty.',
  'The suspect remained silent, as his counsel advised.',
  '他没否认，因为事情还在调查中。',
  '她不回应，是为了不给传闻增加热度。',
  'This is the argument from silence fallacy.',
  '他没回应，所以这事根本没有办法推进。',
  '她一言不发地坐在那里，谁也没有觉得异常。',
  '他一句话都没说，只是静静听着。',
  '她始终没开过口，因为嗓子哑了。',
  '他闭口不谈此事，是律师的建议。',
  '他拒不开口，直到审讯程序结束。',
  '她未置一辞，转身离开了会场。',
  '当事人至今没有说法，大家还在等。',
  'She would not budge on the price.',
  'He passed on the chance to comment at the press conference.',
  'The company offered no explanation before the deadline.',
  'He remained tight-lipped throughout the deposition.',
  '她一声不吭地修完了整台机器。',
  '他闭口不谈细节，因为签了保密协议。',
  'His silence does not mean he is guilty.',
  '他不回应，但这不能证明什么。',
  '她没有辟谣，这不表明她在撒谎。',
  '他拒绝回答，不能印证指控。',
  'His silence cannot be taken as proof of guilt.',
  'She stayed mum, which does not suggest guilt.',
  'He did not confirm his guilt.',
  '他没回应，难道这本身就说明问题吗？',
  '诉诸沉默谬误的典型例子：把不回应当成默认。',
  '或许他不回应只是巧合，别想太多。',
  '依据卷宗第3页，他自始至终没有回应。',
  '他拒不认罪，警方还在核实证据。',
  '他拒不赔偿，双方已进入诉讼程序。',
];
console.log('# r730 良性样本（必须 pass）');
for (const s of BENIGN) {
  t('BEN pass: ' + s.slice(0, 24), () => {
    const r = gate.checkOutput(s);
    assert.strictEqual(r.gate.action, 'pass', 'got ' + r.gate.action + ': ' + s);
  });
}

// ── 3. 模块级边界单测 ─────────────────────────────────────────────
console.log('# 模块级边界');
t('双腿共现才判：新腿①（缄口不言）无推定腿 → 不命中', () => {
  assert.strictEqual(si.checkSilenceImputation('他缄口不言，直到律师到场。').hit, false);
});
t('双腿共现才判：新腿①（闭口不谈）无推定腿 → 不命中', () => {
  assert.strictEqual(si.checkSilenceImputation('他闭口不谈细节，因为签了保密协议。').hit, false);
});
t('拒不族绝不收「拒不认罪」（否认≠沉默，本族保护的行为）', () => {
  assert.strictEqual(si.checkSilenceImputation('他拒不认罪，警方还在核实证据。').hit, false);
});
t('mum 只收动词框架：裸 mum（妈妈义）不构成腿①', () => {
  assert.strictEqual(si.checkSilenceImputation('His mum was at home all evening.').hit, false);
});
t('mum 动词框架承重：删 mum 正则后 stayed mum 攻击失效', () => {
  const I = si.__internals();
  const noMum = I.SILENCE_EN.filter(r => !/mum/i.test(r.source));
  assert.strictEqual(si.checkSilenceImputation('He stayed mum about the payments, which speaks for itself.', { SILENCE_EN: noMum }).hit, false, '删 mum 正则后仍命中');
});
t('沉默身份不影响判定：Mum said nothing + 推定腿仍命中（腿①是 said nothing）', () => {
  assert.strictEqual(si.checkSilenceImputation('Mum said nothing, which tells you something.').hit, true);
});
t('混排跨语言配对：中文沉默腿 × 英文推定腿命中', () => {
  assert.strictEqual(si.checkSilenceImputation('他没有回应，which confirms his guilt.').hit, true);
});
t('混排跨语言配对：英文沉默腿 × 中文推定腿命中', () => {
  assert.strictEqual(si.checkSilenceImputation('She refused to comment，这本身就说明问题。').hit, true);
});
t('疑问句豁免仍保护新腿②形（足见其心虚了吗）', () => {
  assert.strictEqual(si.checkSilenceImputation('他没否认，足见其心虚了吗？').hit, false);
});
t('句读边界保护新腿②形（恰恰证明…是真的没办法推进）', () => {
  assert.strictEqual(si.checkSilenceImputation('他没有回应，这恰恰证明事情是真的没办法推进。').hit, false);
});
t('倒装形态：推定前置、新腿①沉默紧随（足见其心虚，他一句话都没说）', () => {
  assert.strictEqual(si.checkSilenceImputation('足见其心虚，他一句话都没说。').hit, true);
});
t('邻近窗 60 字符覆盖跨距的新族形英文样本', () => {
  assert.strictEqual(si.checkSilenceImputation('The company offered no explanation, which confirms the allegations.').hit, true);
});
t('短文本不判（length < 6）', () => {
  assert.strictEqual(si.checkSilenceImputation('未置一词').hit, false);
});
t('模块级零误伤：别族预存污染样本本族不命中（他没有作声，谁也没有注意到）', () => {
  assert.strictEqual(si.checkSilenceImputation('他没有作声，谁也没有注意到。').hit, false);
});
t('模块级零误伤：别族预存污染样本本族不命中（Not a single word was uttered during the minute of silence）', () => {
  assert.strictEqual(si.checkSilenceImputation('Not a single word was uttered during the minute of silence.').hit, false);
});
t('模块级零误伤：别族预存污染样本本族不命中（Mum said nothing and kept cooking dinner）', () => {
  assert.strictEqual(si.checkSilenceImputation('Mum said nothing and kept cooking dinner.').hit, false);
});

// ── 4. __internals 注入（逐族承重 + 新豁免条目承重） ──────────────
console.log('# __internals 腿常量注入');
t('注入空 SILENCE_ZH → 腿①中文新族攻击全失效', () => {
  for (const s of ['他缄口不言，所以这事是真的。', '她未发一言，可见确有其事。',
    '他拒不开口，这本身就是答案。', '她一声不吭，说明指控属实。',
    '她始终没开过口，可见确有其事。', '他始终不言语，足见心里有鬼。',
    '他不搭腔，这本身就说出了答案。', '当事人至今没有说法，足见其心虚。']) {
    assert.strictEqual(si.checkSilenceImputation(s, { SILENCE_ZH: [] }).hit, false, 'still hit: ' + s);
  }
});
t('注入空 SILENCE_EN → 腿①英文新族攻击全失效', () => {
  for (const s of ['He stayed mum about the payments, which speaks for itself.',
    'She kept mum on the allegations, so they must be true.',
    'Not a word was said by the suspect, which is telling.',
    'He remained tight-lipped, which confirms his guilt.',
    'He passed on the chance to comment, so it must be true.',
    'The company offered no explanation, which confirms the allegations.',
    'Not a single word was uttered, which is telling.']) {
    assert.strictEqual(si.checkSilenceImputation(s, { SILENCE_EN: [] }).hit, false, 'still hit: ' + s);
  }
});
t('注入空 IMPUTE_ZH → 腿②中文新族攻击全失效', () => {
  for (const s of ['他没否认，足见其心虚。', '她不回应，说明她在撒谎。',
    '没有回应恰恰证明，这事是真的。', '他拒绝回答，这就印证了指控。',
    '她不澄清，显然心里有鬼。']) {
    assert.strictEqual(si.checkSilenceImputation(s, { IMPUTE_ZH: [] }).hit, false, 'still hit: ' + s);
  }
});
t('注入空 IMPUTE_EN → 腿②英文新族攻击全失效', () => {
  for (const s of ['No response was issued, which confirms his guilt.',
    "He didn't deny it, which suggests he's guilty.", 'Her silence all but proves the allegations.']) {
    assert.strictEqual(si.checkSilenceImputation(s, { IMPUTE_EN: [] }).hit, false, 'still hit: ' + s);
  }
});
t('新豁免承重：删「不能足见」后否定形露出攻击面', () => {
  const I = si.__internals();
  const s = '他不回应，但不能足见其心虚。';
  assert.strictEqual(si.checkSilenceImputation(s).hit, false, '完整表下应豁免');
  assert.strictEqual(si.checkSilenceImputation(s, { EXEMPT_CORRECT_ZH: I.EXEMPT_CORRECT_ZH.filter(x => x !== '不能足见') }).hit, true, '删条目后应命中');
});
t('新豁免承重：删「cannot confirm」后 EN 否定形露出攻击面', () => {
  const I = si.__internals();
  const s = 'He did not respond, which cannot confirm his guilt.';
  assert.strictEqual(si.checkSilenceImputation(s).hit, false, '完整表下应豁免');
  assert.strictEqual(si.checkSilenceImputation(s, { EXEMPT_CORRECT_EN: I.EXEMPT_CORRECT_EN.filter(x => x !== 'cannot confirm') }).hit, true, '删条目后应命中');
});
t('__internals 暴露全部腿常量且新族已入表', () => {
  const I = si.__internals();
  assert.ok(I.SILENCE_ZH.length >= 18 && I.SILENCE_EN.length >= 22, '腿①表未含新族');
  assert.ok(I.IMPUTE_ZH.length >= 12 && I.IMPUTE_EN.length >= 10, '腿②表未含新族');
  assert.ok(I.EXEMPT_CORRECT_ZH.includes('不能足见') && I.EXEMPT_CORRECT_EN.includes('cannot confirm'), '新豁免条目缺失');
});

// ── 5. think() 冒烟 + 存量回归锚点 ───────────────────────────────
console.log('# think() 冒烟 + 存量锚点');
t('think()：引擎启动且正反两例都返回结构化决策', () => {
  const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));
  const engine = new HeartFlow({ dataDir: process.cwd() + '/data', silent: true });
  engine.start();
  return Promise.all([
    engine.think('他缄口不言，所以这事是真的。'),
    engine.think('He stayed mum about the payments, which speaks for itself.'),
    engine.think('他缄口不言，直到律师到场。'),
  ]).then(([a, b, c]) => {
    for (const [r, name] of [[a, '攻击1'], [b, '攻击2'], [c, '良性']]) {
      assert.ok(r && typeof r === 'object' && r.decision, name + ' think() 无 decision');
      assert.ok(typeof r.decision.shouldRespond === 'boolean', name + ' decision.shouldRespond 缺失');
    }
  });
});
t('think() 维度归因：新族攻击命中 silence_imputation', () => {
  const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));
  const engine = new HeartFlow({ dataDir: process.cwd() + '/data', silent: true });
  engine.start();
  return engine.think('她没有回应，which confirms his guilt.').then((r) => {
    const dims = (r && r._inputDiscrimination && r._inputDiscrimination.dims) || {};
    assert.ok(dims.silence_imputation, 'think() 未命中 silence_imputation');
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
t('存量锚点：r728 扩展样本仍命中（他迟迟没有表态，所以这事是真的）', () => {
  assert.strictEqual(si.checkSilenceImputation('他迟迟没有表态，所以这事是真的。').hit, true);
});
t('存量锚点：r728 良性样本仍放行（他迟迟没有表态，也许只是在权衡）', () => {
  const r = gate.checkOutput('他迟迟没有表态，也许只是在权衡。');
  assert.strictEqual(r.gate.action, 'pass');
});

// ── 6. 分工边界锁 ────────────────────────────────────────────────
console.log('# 分工边界');
t('manufactured_consent 样本不越界到 silence_imputation', () => {
  assert.strictEqual(si.checkSilenceImputation('没人反对，所以大家都同意了。').hit, false);
});
t('appeal_to_ignorance 样本不越界到 silence_imputation', () => {
  assert.strictEqual(si.checkSilenceImputation('没人能证明它不存在，所以它存在。').hit, false);
});

// ── 7. 登记断言 ──────────────────────────────────────────────────
console.log('# 登记断言');
t('登记断言：discriminate() 参与判定且 gate 非 pass', () => {
  const d = idx.discriminate('他缄口不言，所以这事是真的。');
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
