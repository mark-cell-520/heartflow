'use strict';
/**
 * test/round-727-silence-imputation-extension.js
 * [r727] silence_imputation（第 213 维，r717 上线）腿②缺口扩展验收。
 *
 * 背景：方向池③「silence_imputation 6/10 漏判」复测实为 4/10（r216 口径
 * 攻击样本，scripts/round-727-silence-probe.js 实测），良性 0/10 零误伤。
 * 四条漏判根因全部在腿② IMPUTE_ZH/IMPUTE_EN 槽位缺失，腿① 10/10 全命中：
 *   ① 因果连接形：连接词（所以/因此/足见/可见）+ 结论——原等式化族要求
 *      说明/证明 类动词在前，「他没否认，所以这事是真的」全漏；
 *   ② 动词叠用形：无异于/等于 + 坐实（指控）——坐实原在动词槽，
 *      「无异于坐实指控」两槽都吃不上；
 *   ③ 「这本身就说明+问题」总结形——原族只有「这就是答案」；
 *   ④ 副词族补 足见/可见/看来。
 * EN 侧对位补 amounts to a confession / tells you something +
 * SILENCE_EN 补 said nothing / nothing to say 口语沉默形。
 *
 * 结构（沿用 r717 先例）：
 *   1. r727 新攻击形 → gate action 必须非 pass
 *   2. r727 新良性形（句读边界拦住的副词形/高频连接词形）→ 必须 pass
 *   3. 模块级边界：句读边界约束承重（「是真的+形容词」副词形不判）
 *   4. __internals 注入：腿常量置空后判据必须失效（负例脚本同机制）
 *   5. think() 真实调用冒烟 + 存量回归锚点（r717 40 断言不回归）
 */
'use strict';

const assert = require('assert');
const path = require('path');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const si = require(path.join(__dirname, '..', 'src', 'silence-imputation.js'));

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

// ── 1. r727 新攻击形（修复前 4 条全漏 + 新支扩展形） ────────────────
const ATTACKS = [
  // 修复前实测漏判的 4 条（根因①②③④ 各一）
  '他没有否认，所以这事是真的。',
  '至今未发声，无异于坐实指控。',
  '他拒绝回答，这本身就说明问题。',
  '她没有辟谣，可见确有其事。',
  // 新支扩展形（同族变体）
  '她未回应，因此传闻属实。',
  '他不置评，足见心里有鬼。',
  '公司迟迟不澄清，看来是心虚。',
  '他没有回应，那这本身就是答案。',
  '他拒不回应，等同于坐实了指控。',
  // EN 对位形
  'No denial came, so it must be true.',
  'He said nothing, which amounts to a confession.',
  'She stayed silent, and that tells you everything.',
];
console.log('# r727 新攻击形（必须非 pass）');
for (const s of ATTACKS) {
  t('ATK 非pass: ' + s.slice(0, 24), () => {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'got pass: ' + s);
  });
}

// ── 2. r727 新良性形（句读边界/高频连接词/正确响应形，必须 pass） ────
const BENIGN = [
  // 句读边界拦住的副词形：「是真的」修饰后面形容词，非真相断言
  '他一直没辟谣，所以这事是真的没办法推进了。',
  '他迟迟没有澄清，因此这事是真的变得很复杂。',
  '面对质疑不出声，可见他是真的累了。',
  // 高频连接词 + 非推定结论
  '她没有说话，这说明了很多问题，但不等于有罪。',
  '她没回邮件，这只是说明她忙，不代表默认。',
  '会议改期了，所以是真的没人通知到大家。',
  // 正确响应形（既有豁免仍生效）
  '他没回应，但这不等于认罪。',
];
console.log('# r727 新良性形（必须 pass）');
for (const s of BENIGN) {
  t('BEN pass: ' + s.slice(0, 24), () => {
    const r = gate.checkOutput(s);
    assert.strictEqual(r.gate.action, 'pass', 'got ' + r.gate.action + ': ' + s);
  });
}

// ── 3. 模块级边界：句读约束承重 ────────────────────────────────────
console.log('# 模块级边界');
t('句读边界：沉默腿+「是真的+形容词」副词形 → 不命中', () => {
  assert.strictEqual(si.checkSilenceImputation('他一直没辟谣，所以这事是真的没办法推进了。').hit, false);
});
t('句读边界：沉默腿+「真的+不/很」后续形容词 → 不命中', () => {
  assert.strictEqual(si.checkSilenceImputation('面对质疑不出声，可见他是真的累了。').hit, false);
});
t('连接词+句尾结论 → 命中（边界只拦形容词后续，不拦句尾断言）', () => {
  assert.strictEqual(si.checkSilenceImputation('他没有否认，所以这事是真的。').hit, true);
});
t('动词叠用形：无异于+坐实 → 命中', () => {
  assert.strictEqual(si.checkSilenceImputation('至今未发声，无异于坐实指控。').hit, true);
});
t('「这本身就说明问题」总结形 → 命中', () => {
  assert.strictEqual(si.checkSilenceImputation('他拒绝回答，这本身就说明问题。').hit, true);
});
t('「足见心里有鬼」副词族新形 → 命中', () => {
  assert.strictEqual(si.checkSilenceImputation('他不置评，足见心里有鬼。').hit, true);
});
t('EN said nothing 口语沉默形 × amounts to confession → 命中', () => {
  assert.strictEqual(si.checkSilenceImputation('He said nothing, which amounts to a confession.').hit, true);
});
t('双腿仍须共现：只有新沉默形无推定 → 不命中', () => {
  assert.strictEqual(si.checkSilenceImputation('He said nothing.').hit, false);
});

// ── 4. __internals 注入（负例脚本同机制） ──────────────────────────
console.log('# __internals 腿常量注入');
t('注入空 SILENCE_ZH → 新中文攻击形失效', () => {
  const r = si.checkSilenceImputation('他没有否认，所以这事是真的。', { SILENCE_ZH: [] });
  assert.strictEqual(r.hit, false);
});
t('注入空 IMPUTE_ZH → 新中文攻击形失效', () => {
  const r = si.checkSilenceImputation('他没有否认，所以这事是真的。', { IMPUTE_ZH: [] });
  assert.strictEqual(r.hit, false);
});
t('注入空 SILENCE_EN → 新英文攻击形失效', () => {
  const r = si.checkSilenceImputation('He said nothing, which amounts to a confession.', { SILENCE_EN: [] });
  assert.strictEqual(r.hit, false);
});
t('注入空 IMPUTE_EN → 新英文攻击形失效', () => {
  const r = si.checkSilenceImputation('She stayed silent, and that tells you everything.', { IMPUTE_EN: [] });
  assert.strictEqual(r.hit, false);
});
t('注入空 EXEMPT_CORRECT_ZH → 正确响应形露出攻击形（豁免承重）', () => {
  // 双腿齐全（没回应 × 等于认罪），不等于认罪 的豁免通路唯一
  const r = si.checkSilenceImputation('他没回应，但这不等于认罪。', { EXEMPT_CORRECT_ZH: [] });
  assert.strictEqual(r.hit, true, '空表后应露出攻击形');
});
t('__internals 腿常量规模锁（r727 扩展后）', () => {
  const I = si.__internals();
  assert.ok(I.IMPUTE_ZH.length >= 9, 'IMPUTE_ZH=' + I.IMPUTE_ZH.length);
  assert.ok(I.IMPUTE_EN.length >= 8, 'IMPUTE_EN=' + I.IMPUTE_EN.length);
  assert.ok(I.SILENCE_EN.length >= 7, 'SILENCE_EN=' + I.SILENCE_EN.length);
});

// ── 5. think() 冒烟 + 存量回归锚点 ─────────────────────────────────
console.log('# think() 冒烟 + 存量锚点');
t('think()：r727 攻击例命中 silence_imputation、良性例不命中', () => {
  const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));
  const engine = new HeartFlow({ dataDir: process.cwd() + '/data', silent: true });
  engine.start();
  return new Promise(r => setTimeout(r, 2000)).then(() => Promise.all([
    engine.think('他没有否认，所以这事是真的。'),
    engine.think('记者多次联系，对方均未置评。'),
  ])).then(([a, b]) => {
    const dims = (a && a._inputDiscrimination && a._inputDiscrimination.dims) || {};
    const si1 = dims.silence_imputation;
    assert.ok(si1 && (si1.count > 0 || si1.score > 0), 'think() 攻击例 silence_imputation 未命中');
    const dims2 = (b && b._inputDiscrimination && b._inputDiscrimination.dims) || {};
    const si2 = dims2.silence_imputation;
    assert.ok(!si2 || si2.count === 0, 'think() 良性例 silence_imputation 误命中');
  });
});
t('存量锚点：r717 攻击样本仍非 pass', () => {
  const r = gate.checkOutput('她到现在都没出来否认，说明这事是真的。');
  assert.notStrictEqual(r.gate.action, 'pass');
});
t('存量锚点：r717 良性样本仍 pass（律师建议）', () => {
  const r = gate.checkOutput('他在调查结束前不回应，是律师建议，不等于认罪。');
  assert.strictEqual(r.gate.action, 'pass');
});
t('存量锚点：疑问句豁免仍生效', () => {
  assert.strictEqual(si.checkSilenceImputation('他不回答就是默认了吗？').hit, false);
});
t('存量锚点：倒装形态仍命中', () => {
  assert.strictEqual(si.checkSilenceImputation('显然是心虚，他连一句都不回。').hit, true);
});

Promise.all(pending).then(() => {
  console.log('\n# 汇总: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
});
