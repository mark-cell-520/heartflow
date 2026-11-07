// scripts/negative-test-silence-imputation-r728.js
// r728 负例脚本：silence_imputation 腿①沉默动作族补全（表态/松口/给说法）。
// 机制（同 r717/r727 先例）：把 __internals 腿常量注入 checkSilenceImputation，
// 每条注入点必须满足：
//   ① 默认表下判据命中（攻击样本双腿齐全，不是空壳样本）；
//   ② 注入后判据失效（证明该腿/该豁免条目真实承重，不是装饰）。
// 另配良性对照（默认表下必须零误伤）与 gate 层断言。
const path = require('path');
const si = require(path.join(__dirname, '..', 'src', 'silence-imputation.js'));
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log('  ok ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
const assert = require('assert');

// ── 攻击样本（每条双腿齐全：腿①沉默动作 × 腿②推定结论） ────────────
const ATK_ZH_BIAOTAI = '他迟迟没有表态，所以这事是真的。';       // 表态族
const ATK_ZH_SONGKOU = '他始终不松口，可见确有其事。';           // 松口族
const ATK_ZH_SHUOFA = '他不给说法，这本身就说明问题。';          // 给说法族（r728 豁免收窄后命中）
const ATK_ZH_JUJUE = '公司拒绝表态，无异于坐实指控。';           // 拒绝族
const ATK_ZH_HUIBI = '他回避问题，所以传闻属实。';               // 回避族
const ATK_ZH_BUDAHUA = '他不搭话，这本身就是答案。';             // 不搭话族
const ATK_EN = [
  'He refused to take a position, which speaks for itself.',
  "She wouldn't budge on the allegations, so they must be true.",
  'No explanation was offered, which tells you something.',
];

console.log('# 注入点承重证明（默认命中 → 注入失效）');

t('注入点1 SILENCE_ZH=[] → 表态族失效', () => {
  assert.strictEqual(si.checkSilenceImputation(ATK_ZH_BIAOTAI).hit, true, '默认表未命中');
  assert.strictEqual(si.checkSilenceImputation(ATK_ZH_BIAOTAI, { SILENCE_ZH: [] }).hit, false, '注入后仍命中');
});
t('注入点2 SILENCE_ZH=[] → 松口族失效', () => {
  assert.strictEqual(si.checkSilenceImputation(ATK_ZH_SONGKOU).hit, true, '默认表未命中');
  assert.strictEqual(si.checkSilenceImputation(ATK_ZH_SONGKOU, { SILENCE_ZH: [] }).hit, false, '注入后仍命中');
});
t('注入点3 SILENCE_ZH=[] → 给说法族失效', () => {
  assert.strictEqual(si.checkSilenceImputation(ATK_ZH_SHUOFA).hit, true, '默认表未命中');
  assert.strictEqual(si.checkSilenceImputation(ATK_ZH_SHUOFA, { SILENCE_ZH: [] }).hit, false, '注入后仍命中');
});
t('注入点4 SILENCE_ZH=[] → 拒绝表态族失效', () => {
  assert.strictEqual(si.checkSilenceImputation(ATK_ZH_JUJUE).hit, true, '默认表未命中');
  assert.strictEqual(si.checkSilenceImputation(ATK_ZH_JUJUE, { SILENCE_ZH: [] }).hit, false, '注入后仍命中');
});
t('注入点5 SILENCE_ZH=[] → 回避问题族失效', () => {
  assert.strictEqual(si.checkSilenceImputation(ATK_ZH_HUIBI).hit, true, '默认表未命中');
  assert.strictEqual(si.checkSilenceImputation(ATK_ZH_HUIBI, { SILENCE_ZH: [] }).hit, false, '注入后仍命中');
});
t('注入点6 SILENCE_ZH=[] → 不搭话族失效', () => {
  assert.strictEqual(si.checkSilenceImputation(ATK_ZH_BUDAHUA).hit, true, '默认表未命中');
  assert.strictEqual(si.checkSilenceImputation(ATK_ZH_BUDAHUA, { SILENCE_ZH: [] }).hit, false, '注入后仍命中');
});
t('注入点7 SILENCE_EN=[] → EN 对位族失效', () => {
  for (const s of ATK_EN) {
    assert.strictEqual(si.checkSilenceImputation(s).hit, true, '默认表未命中: ' + s);
    assert.strictEqual(si.checkSilenceImputation(s, { SILENCE_EN: [] }).hit, false, '注入后仍命中: ' + s);
  }
});
t('注入点8 IMPUTE_ZH=[] → 推定腿失效（中文攻击全灭）', () => {
  for (const s of [ATK_ZH_BIAOTAI, ATK_ZH_SONGKOU, ATK_ZH_SHUOFA, ATK_ZH_JUJUE, ATK_ZH_HUIBI, ATK_ZH_BUDAHUA]) {
    assert.strictEqual(si.checkSilenceImputation(s, { IMPUTE_ZH: [] }).hit, false, '注入后仍命中: ' + s);
  }
});
t('注入点9 IMPUTE_EN=[] → EN 推定腿失效', () => {
  for (const s of ATK_EN) {
    assert.strictEqual(si.checkSilenceImputation(s, { IMPUTE_EN: [] }).hit, false, '注入后仍命中: ' + s);
  }
});
t('注入点10 EXEMPT_CORRECT_ZH 删 不给-条目 → 「不给热度」策略句露出攻击形（r728 收窄承重）', () => {
  const s = '她不表态，所以传闻属实，这只是不给热度的策略。';
  const I = si.__internals();
  const narrowed = I.EXEMPT_CORRECT_ZH.filter(x => !x.startsWith('不给'));
  assert.strictEqual(si.checkSilenceImputation(s).hit, false, '完整表下应豁免');
  assert.strictEqual(si.checkSilenceImputation(s, { EXEMPT_CORRECT_ZH: narrowed }).hit, true, '删条目后应命中');
});
t('注入点11 EXEMPT_META_ZH=[] → 概念转述句露出攻击形', () => {
  const s = '教科书里讲过：他不回应，这本身就说明问题，这就是诉诸沉默谬误。';
  assert.strictEqual(si.checkSilenceImputation(s).hit, false, '完整表下应豁免');
  assert.strictEqual(si.checkSilenceImputation(s, { EXEMPT_META_ZH: [] }).hit, true, '删条目后应命中');
});
t('注入点12 EXEMPT_CORRECT_EN=[] → EN 正确响应形露出攻击形', () => {
  // 样本须满足 60 字符邻近窗（腿② impIdx - 腿① silIdx <= 60）
  const s = 'Refusing to state a position is standard practice; it speaks for itself.';
  assert.strictEqual(si.checkSilenceImputation(s).hit, false, '完整表下应豁免');
  assert.strictEqual(si.checkSilenceImputation(s, { EXEMPT_CORRECT_EN: [] }).hit, true, '删条目后应命中');
});

console.log('# 良性对照（默认表下必须零误伤）');
const BENIGN = [
  '他迟迟没有表态，也许只是在权衡。',
  '她不表态，说明谈判陷入僵局。',
  '双方仍在回避敏感话题，谈判还在继续。',
  '他不接茬，只是当时没听见。',
  '他不松口，证明不了什么。',
  '在调查结束前不表态是标准做法。',
  '当事人有权不松口，这是律师建议。',
  '法院尚未判决，任何一方都有权不对外发声。',
  '她对流言选择不回应，是不给传闻增加热度。',
  '他不表态就是默认了吗？',
  '他之所以不表态，是因为这事真的没办法推进。',
  'He has not taken a position yet, perhaps still weighing the options.',
  'The team would not budge on the deadline, which frustrated the client.',
];
t('良性对照 13 条全部零误伤（silence_imputation 模块级）', () => {
  const fps = [];
  for (const s of BENIGN) {
    if (si.checkSilenceImputation(s).hit) fps.push(s);
  }
  assert.strictEqual(fps.length, 0, '误伤: ' + fps.join(' | '));
});

console.log('# gate 层断言');
t('gate 层：6 条中文新族形攻击全部非 pass', () => {
  for (const s of [ATK_ZH_BIAOTAI, ATK_ZH_SONGKOU, ATK_ZH_SHUOFA, ATK_ZH_JUJUE, ATK_ZH_HUIBI, ATK_ZH_BUDAHUA]) {
    assert.notStrictEqual(gate.checkOutput(s).gate.action, 'pass', 'got pass: ' + s);
  }
});
t('gate 层：EN 新族形攻击全部非 pass', () => {
  for (const s of ATK_EN) {
    assert.notStrictEqual(gate.checkOutput(s).gate.action, 'pass', 'got pass: ' + s);
  }
});
t('gate 层：良性对照中 9 条全维度 pass', () => {
  // 例外 4 条（HEAD v6.8.154 实测同行为，均与本族无关，已 git stash 对照）：
  //   「她不表态，说明谈判陷入僵局。」「在调查结束前不表态是标准做法。」
  //     → evidence/false_balance 判 verify；
  //   「他不表态就是默认了吗？」→ evidence/fallacies/manufactured_consent
  //     判 rewrite（疑问豁免在本族内生效，gate 级不过是别族的事）；
  //   「他之所以不表态，是因为这事真的没办法推进。」→ evidence/
  //     reasoning_coherence/false_balance 判 verify。
  const skip = ['她不表态', '在调查结束前', '他不表态就是', '他之所以不表态'];
  const gateBenign = BENIGN.filter(s => !skip.some(p => s.startsWith(p)));
  assert.strictEqual(gateBenign.length, 9, '预期 9 条，实际 ' + gateBenign.length);
  const bad = [];
  for (const s of gateBenign) {
    if (gate.checkOutput(s).gate.action !== 'pass') bad.push(s);
  }
  assert.strictEqual(bad.length, 0, '未 pass: ' + bad.join(' | '));
});

console.log('\n# 汇总: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
