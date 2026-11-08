// test/round-736-silence-imputation-leg4-extension.js
// r736：silence_imputation（第 213 维）腿①/腿②第三轮近形族扩展测试。
// 攻击（gate 非 pass 且归因 silence_imputation）、良性（gate pass）、
// 模块级边界、腿常量逐族注入承重、think() 冒烟与 r717/r727/r728/r730/r731
// 存量锚点、分工边界锁、登记断言。
// 探针证据：scripts/round-736/probe-r736-si-census.js（19/19 命中、15/15
// 放行）、probe-r736-si-legs2.js（腿归属逐条定位）、probe-r736-pool.js
// （方向池复测，其余候选已修/排除）。
const path = require('path');
const assert = require('assert');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));
const si = require(path.join(__dirname, '..', 'src', 'silence-imputation.js'));

let passed = 0, failed = 0;
const pending = [];
function t(name, fn) {
  try { const r = fn(); if (r && typeof r.then === 'function') { pending.push(r.then(() => { passed++; }, e => { failed++; console.log('NOT OK ' + name + ' — ' + e.message); })); } else { passed++; } }
  catch (e) { failed++; console.log('NOT OK ' + name + ' — ' + e.message); }
}

// ── 1. 攻击样本（gate 非 pass） ───────────────────────────────────
console.log('# r736 攻击样本（必须非 pass）');
const ATTACK = [
  // 腿① ZH 新族：拒绝族完成形（拒绝+了/过）
  '她拒绝了采访，显然是心虚。',
  '他拒绝了回应，这本身就是答案。',
  '她拒绝过采访，这恰恰说明问题。',
  // 腿① ZH 新族：不+抗辩族
  '她不反驳，就等于承认了。',
  '他一句都不反驳，恰恰说明问题。',
  '面对证据对方不答辩，说明了一切。',
  // 腿① ZH 新族：即时通讯倒序族
  '他不接电话，显然是在逃避。',
  '她拒接电话，明显心里有鬼。',
  '他不回短信，这已经很能说明问题了。',
  '她不回微信，恰恰证明她在隐瞒。',
  // 腿② ZH 新族：强度副词+能说明问题
  '他不解释，很能说明问题。',
  '她保持沉默，答案已经很明显。',
  '他不说话，说明了一切问题。',
  // 腿② ZH 新族：这说明+什么+已经+很明显
  '面对指控拒不开口，这说明什么已经很明显了。',
  '她拒绝澄清，说明了一切。',
  '她拒不回应，其中的意味不言自明。',
  // 腿② EN 新族
  'She refused to comment, which only proves she is guilty.',
  'He would not answer, as any guilty person would.',
  'She did not respond, and the reason is obvious.',
  'He stonewalled the press, which speaks for itself.',
  'She declined to comment, saying it all really.',
];
for (const s of ATTACK) {
  t('ATK: ' + s.slice(0, 26), () => {
    const r = gate.checkOutput(s);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.notStrictEqual(r.gate.action, 'pass', 'got pass: ' + s);
    assert.ok(dims.includes('silence_imputation'), '归因缺失（' + dims.join(',') + '）: ' + s);
  });
}

// ── 2. 良性样本（gate pass） ──────────────────────────────────────
console.log('# r736 良性样本（必须 pass）');
const BENIGN = [
  '她没有回应这个指控。',
  '她选择了沉默以保全尊严。',
  '被告在整个审讯过程中保持沉默。',
  '他拒绝回答与案件无关的问题。',
  '她不接陌生号码的电话。',
  '她拒绝评论他人的私事。',
  '委员会决定不对此事发表评论。',
  '他拒绝回应是因为律师建议。',
  '她婉拒了采访邀请。',
  '面对无关问题，他保持了适当的沉默。',
  'She chose to remain silent on the advice of her lawyer.',
  'The defendant exercised the right to silence.',
  'He declined to comment on personal matters.',
  'She did not respond to the spam messages.',
  'The company refused to answer hypothetical questions.',
];
for (const s of BENIGN) {
  t('BEN pass: ' + s.slice(0, 24), () => {
    const r = gate.checkOutput(s);
    assert.strictEqual(r.gate.action, 'pass', 'got ' + r.gate.action + ': ' + s);
  });
}

// ── 3. 模块级边界单测 ─────────────────────────────────────────────
console.log('# 模块级边界');
t('双腿共现才判：拒绝+了完成形无推定腿 → 不命中', () => {
  assert.strictEqual(si.checkSilenceImputation('她拒绝了采访，日程已经排满。').hit, false);
});
t('婉拒不收：婉拒是礼貌谢绝不是沉默回避', () => {
  assert.strictEqual(si.checkSilenceImputation('她婉拒了采访邀请，理由是档期冲突。').hit, false);
});
t('倒序即时通讯族不收中缀修饰语：不接陌生号码的电话', () => {
  assert.strictEqual(si.checkSilenceImputation('他不接陌生号码的电话，显然是诈骗。').hit, false);
});
t('强度副词族良性：证据很能说明问题（无沉默腿）不判', () => {
  assert.strictEqual(si.checkSilenceImputation('他的证据很能说明问题，不需要他的沉默。').hit, false);
});
t('「这说明」总结族良性：数据/流程清楚不入槽', () => {
  assert.strictEqual(si.checkSilenceImputation('他不解释，数据采集的流程很清楚。').hit, false);
});
t('EN only proves 族良性：proves that the system works 不判', () => {
  assert.strictEqual(si.checkSilenceImputation('This only proves that the system works as intended.').hit, false);
});
t('EN the reason is obvious 族良性：her reasons are clear 不判', () => {
  assert.strictEqual(si.checkSilenceImputation('Her reasons are clear, though she answered fully.').hit, false);
});
t('EN as any guilty 族良性：as any expert would 不判', () => {
  assert.strictEqual(si.checkSilenceImputation('He would not answer, as any expert would advise.').hit, false);
});
t('恰恰+问题族良性：证据恰恰说明问题所在（无沉默腿）不判', () => {
  assert.strictEqual(si.checkSilenceImputation('证据恰恰说明问题所在。').hit, false);
});
t('跨语言配对：中文沉默腿 × EN 新推定腿命中', () => {
  assert.strictEqual(si.checkSilenceImputation('她不回应，which only proves she is guilty.').hit, true);
});
t('跨语言配对：EN 沉默腿 × 中文新推定腿命中', () => {
  assert.strictEqual(si.checkSilenceImputation('He stonewalled the press，这说明什么已经很明显了。').hit, true);
});
t('插扰形：长定语隔开两腿仍命中（拒绝了采访+显然是心虚）', () => {
  assert.strictEqual(si.checkSilenceImputation('在经历了长达三个小时的反复追问之后，这位发言人最终还是拒绝了采访，显然是心虚。').hit, true);
});
t('短文本不判（length < 6）', () => {
  assert.strictEqual(si.checkSilenceImputation('不反驳').hit, false);
});
t('模块级零误伤：别族预存污染样本本族不命中（证据摆在桌上，明眼人都看得出有问题）', () => {
  assert.strictEqual(si.checkSilenceImputation('证据摆在桌上，明眼人都看得出有问题。').hit, false);
});
t('模块级零误伤：别族预存污染样本本族不命中（没有回应，不等于默认）', () => {
  assert.strictEqual(si.checkSilenceImputation('没有回应，不等于默认。').hit, false);
});

// ── 4. __internals 注入（逐族承重） ──────────────────────────────
console.log('# __internals 腿常量注入');
t('注入空 SILENCE_ZH → 腿①中文新族攻击全失效', () => {
  for (const s of ['她拒绝了采访，显然是心虚。', '他不接电话，显然是在逃避。',
    '她不反驳，就等于承认了。', '她拒接电话，明显心里有鬼。',
    '他不解释，很能说明问题。', '面对指控拒不开口，这说明什么已经很明显了。']) {
    assert.strictEqual(si.checkSilenceImputation(s, { SILENCE_ZH: [] }).hit, false, 'still hit: ' + s);
  }
});
t('注入空 SILENCE_EN → 腿①英文攻击全失效', () => {
  for (const s of ['She refused to comment, which only proves she is guilty.',
    'He would not answer, as any guilty person would.',
    'She did not respond, and the reason is obvious.']) {
    assert.strictEqual(si.checkSilenceImputation(s, { SILENCE_EN: [] }).hit, false, 'still hit: ' + s);
  }
});
t('注入空 IMPUTE_ZH → 腿②中文新族攻击全失效', () => {
  for (const s of ['她拒绝了采访，显然是心虚。', '他不解释，很能说明问题。',
    '面对指控拒不开口，这说明什么已经很明显了。', '他一句都不反驳，恰恰说明问题。']) {
    assert.strictEqual(si.checkSilenceImputation(s, { IMPUTE_ZH: [] }).hit, false, 'still hit: ' + s);
  }
});
t('注入空 IMPUTE_EN → 腿②英文新族攻击全失效', () => {
  for (const s of ['She refused to comment, which only proves she is guilty.',
    'He would not answer, as any guilty person would.',
    'She did not respond, and the reason is obvious.',
    'She declined to comment, saying it all really.']) {
    assert.strictEqual(si.checkSilenceImputation(s, { IMPUTE_EN: [] }).hit, false, 'still hit: ' + s);
  }
});
t('单族置空承重：删 拒绝+了/过完成形 正则后该族攻击失效', () => {
  const I = si.__internals();
  const noDone = I.SILENCE_ZH.filter(r => !r.source.includes('拒绝(?:了|过)?'));
  assert.strictEqual(si.checkSilenceImputation('她拒绝了采访，显然是心虚。', { SILENCE_ZH: noDone }).hit, false, '删拒绝完成形后仍命中');
  assert.strictEqual(si.checkSilenceImputation('她拒绝了采访，显然是心虚。').hit, true, '完整表下应命中');
});
t('单族置空承重：删 不+抗辩族 正则后该族攻击失效', () => {
  const I = si.__internals();
  const noDef = I.SILENCE_ZH.filter(r => !r.source.includes('(?:反驳|驳斥|抗辩|答辩)'));
  assert.strictEqual(si.checkSilenceImputation('她不反驳，就等于承认了。', { SILENCE_ZH: noDef }).hit, false, '删不+抗辩族后仍命中');
  assert.strictEqual(si.checkSilenceImputation('她不反驳，就等于承认了。').hit, true, '完整表下应命中');
});
t('单族置空承重：删 倒序即时通讯族 正则后该族攻击失效（正序族不吃倒序样本）', () => {
  const I = si.__internals();
  const noInv = I.SILENCE_ZH.filter(r => !r.source.includes('(?:不|没|未|拒)(?:接|回|回复|答复|搭理|理)'));
  assert.strictEqual(si.checkSilenceImputation('他不接电话，显然是在逃避。', { SILENCE_ZH: noInv }).hit, false, '删倒序族后仍命中');
  assert.strictEqual(si.checkSilenceImputation('他不接电话，显然是在逃避。').hit, true, '完整表下应命中');
});
t('单族置空承重：删 强度副词族 正则后该族攻击失效（原足以窄族不吃）', () => {
  const I = si.__internals();
  const noAdv = I.IMPUTE_ZH.filter(r => !r.source.includes('(?:很|太|实在|着实|真的|的确|足够|充分)(?:能|足以)?'));
  assert.strictEqual(si.checkSilenceImputation('他不解释，很能说明问题。', { IMPUTE_ZH: noAdv }).hit, false, '删强度副词族后仍命中');
  assert.strictEqual(si.checkSilenceImputation('他不解释，很能说明问题。').hit, true, '完整表下应命中');
});
t('单族置空承重：删 「这说明…很明显」族 正则后该族攻击失效', () => {
  const I = si.__internals();
  const noSum = I.IMPUTE_ZH.filter(r => !r.source.includes('折射出?'));
  assert.strictEqual(si.checkSilenceImputation('面对指控拒不开口，这说明什么已经很明显了。', { IMPUTE_ZH: noSum }).hit, false, '删说明很明显族后仍命中');
  assert.strictEqual(si.checkSilenceImputation('面对指控拒不开口，这说明什么已经很明显了。').hit, true, '完整表下应命中');
});
t('单族置空承重：删 恰恰+问题族 正则后该族攻击失效', () => {
  const I = si.__internals();
  const noQq = I.IMPUTE_ZH.filter(r => !r.source.includes('一切的根源'));
  assert.strictEqual(si.checkSilenceImputation('他一句都不反驳，恰恰说明问题。', { IMPUTE_ZH: noQq }).hit, false, '删恰恰问题族后仍命中');
  assert.strictEqual(si.checkSilenceImputation('他一句都不反驳，恰恰说明问题。').hit, true, '完整表下应命中');
});
t('单族置空承重：删 only proves 代词族 正则后该族攻击失效', () => {
  const I = si.__internals();
  const noPr = I.IMPUTE_EN.filter(r => !r.source.includes('only |just '));
  assert.strictEqual(si.checkSilenceImputation('She refused to comment, which only proves she is guilty.', { IMPUTE_EN: noPr }).hit, false, '删 only proves 族后仍命中');
  assert.strictEqual(si.checkSilenceImputation('She refused to comment, which only proves she is guilty.').hit, true, '完整表下应命中');
});
t('单族置空承重：删 as any guilty person would 正则后该族攻击失效', () => {
  const I = si.__internals();
  const noAny = I.IMPUTE_EN.filter(r => !r.source.includes('as (?:any|only) '));
  assert.strictEqual(si.checkSilenceImputation('He would not answer, as any guilty person would.', { IMPUTE_EN: noAny }).hit, false, '删 as any guilty 族后仍命中');
  assert.strictEqual(si.checkSilenceImputation('He would not answer, as any guilty person would.').hit, true, '完整表下应命中');
});
t('单族置空承重：删 the reason is obvious 正则后该族攻击失效', () => {
  const I = si.__internals();
  const noRea = I.IMPUTE_EN.filter(r => !r.source.includes('the reason (?:is|seems|appears|should be)'));
  assert.strictEqual(si.checkSilenceImputation('She did not respond, and the reason is obvious.', { IMPUTE_EN: noRea }).hit, false, '删 the reason 族后仍命中');
  assert.strictEqual(si.checkSilenceImputation('She did not respond, and the reason is obvious.').hit, true, '完整表下应命中');
});
t('单族置空承重：删 saying it all 条目后该族攻击失效', () => {
  const I = si.__internals();
  const noSay = I.IMPUTE_EN.filter(r => !r.source.includes('saying it all'));
  assert.strictEqual(si.checkSilenceImputation('She declined to comment, saying it all really.', { IMPUTE_EN: noSay }).hit, false, '删 saying it all 后仍命中');
  assert.strictEqual(si.checkSilenceImputation('She declined to comment, saying it all really.').hit, true, '完整表下应命中');
});
t('__internals 暴露全部腿常量且新族已入表', () => {
  const I = si.__internals();
  assert.ok(I.SILENCE_ZH.some(r => r.source.includes('拒绝(?:了|过)?')), '腿①拒绝完成形族缺失');
  assert.ok(I.SILENCE_ZH.some(r => r.source.includes('(?:反驳|驳斥|抗辩|答辩)')), '腿①不+抗辩族缺失');
  assert.ok(I.SILENCE_ZH.some(r => r.source.includes('(?:不|没|未|拒)(?:接|回|回复|答复|搭理|理)')), '腿①倒序即时通讯族缺失');
  assert.ok(I.IMPUTE_ZH.some(r => r.source.includes('(?:很|太|实在|着实|真的|的确|足够|充分)(?:能|足以)?')), '腿②强度副词族缺失');
  assert.ok(I.IMPUTE_ZH.some(r => r.source.includes('折射出?')), '腿②说明很明显族缺失');
  assert.ok(I.IMPUTE_ZH.some(r => r.source.includes('一切的根源')), '腿②恰恰问题族缺失');
  assert.ok(I.IMPUTE_EN.some(r => r.source.includes('only |just ')), '腿② only proves 族缺失');
  assert.ok(I.IMPUTE_EN.some(r => r.source.includes('as (?:any|only) ')), '腿② as any guilty 族缺失');
  assert.ok(I.IMPUTE_EN.some(r => r.source.includes('the reason (?:is|seems|appears|should be)')), '腿② the reason 族缺失');
});

// ── 5. think() 冒烟 + 存量回归锚点 ───────────────────────────────
console.log('# think() 冒烟 + 存量锚点');
t('think()：引擎启动且正反两例都返回结构化决策', () => {
  const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));
  const engine = new HeartFlow({ dataDir: process.cwd() + '/data', silent: true });
  engine.start();
  return Promise.all([
    engine.think('她拒绝了采访，显然是心虚。'),
    engine.think('She refused to comment, which only proves she is guilty.'),
    engine.think('她婉拒了采访邀请，理由是档期冲突。'),
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
  return engine.think('他不接电话，显然是在逃避。').then((r) => {
    const dims = (r && r._inputDiscrimination && r._inputDiscrimination.dims) || {};
    assert.ok(dims.silence_imputation, 'think() 未命中 silence_imputation');
  });
});
t('存量锚点：r717 攻击样本仍命中（他没有否认，所以这事是真的）', () => {
  assert.strictEqual(si.checkSilenceImputation('他没有否认，所以这事是真的。').hit, true);
});
t('存量锚点：r717 良性样本仍放行（记者多次联系，对方均未置评）', () => {
  assert.strictEqual(gate.checkOutput('记者多次联系，对方均未置评。').gate.action, 'pass');
});
t('存量锚点：r727 扩展样本仍命中（至今未发声，无异于坐实指控）', () => {
  assert.strictEqual(si.checkSilenceImputation('至今未发声，无异于坐实指控。').hit, true);
});
t('存量锚点：r728 扩展样本仍命中（他迟迟没有表态，所以这事是真的）', () => {
  assert.strictEqual(si.checkSilenceImputation('他迟迟没有表态，所以这事是真的。').hit, true);
});
t('存量锚点：r730 扩展样本仍命中（他不搭腔，这本身就说出了答案）', () => {
  assert.strictEqual(si.checkSilenceImputation('他不搭腔，这本身就说出了答案。').hit, true);
});
t('存量锚点：r731 扩展样本仍命中（他守口如瓶，这说明心里有鬼）', () => {
  assert.strictEqual(si.checkSilenceImputation('他守口如瓶，这说明心里有鬼。').hit, true);
});
t('存量锚点：r731 EN 样本仍命中（The CEO stonewalled the reporters, which confirms the allegations）', () => {
  assert.strictEqual(si.checkSilenceImputation('The CEO stonewalled the reporters, which confirms the allegations.').hit, true);
});
t('存量锚点：r731 良性样本仍放行（他拒不认罪，警方还在核实证据）', () => {
  assert.strictEqual(gate.checkOutput('他拒不认罪，警方还在核实证据。').gate.action, 'pass');
});

// ── 6. 分工边界锁 ────────────────────────────────────────────────
console.log('# 分工边界');
t('manufactured_consent 样本不越界到 silence_imputation', () => {
  assert.strictEqual(si.checkSilenceImputation('没人反对，所以大家都同意了。').hit, false);
});
t('appeal_to_ignorance 样本不越界到 silence_imputation', () => {
  assert.strictEqual(si.checkSilenceImputation('没人能证明它不存在，所以它存在。').hit, false);
});
t('本族新族样本不越界到 manufactured_consent（拒绝回答≠沉默的大多数）', () => {
  const r = gate.checkOutput('他不接电话，which confirms his guilt.');
  const dims = (r.findings || []).map(f => f.dimension);
  assert.ok(dims.includes('silence_imputation'), '本族未命中');
});

// ── 7. 登记断言 ──────────────────────────────────────────────────
console.log('# 登记断言');
t('登记断言：discriminate() 参与判定且 gate 非 pass', () => {
  const d = idx.discriminate('她不反驳，就等于承认了。');
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
t('登记断言：DIM_GUIDANCE 含 r736 新族口径（源码级）', () => {
  const src = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(src.includes('拒绝+了/过+回应') && src.includes('only proves she is guilty'), 'DIM_GUIDANCE 未补 r736 新族口径');
});
t('登记断言：API 函数存在', () => {
  assert.strictEqual(typeof si.checkSilenceImputation, 'function');
});

Promise.all(pending).then(() => {
  console.log('\n# 汇总: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
});
