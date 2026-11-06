#!/usr/bin/env node
/**
 * scripts/negative-test-silence-imputation-r727.js
 * [r727] silence_imputation 腿②扩展负例脚本。
 *
 * 机制（对齐 scripts/negative-test-middle-ground-r726.js）：
 *   - 注入点：把模块 __internals 暴露的腿常量替换为 []，判据必须失效
 *     （变红=该腿在承重；不变红=假阴性，豁免/腿根本没起作用）。
 *   - 豁免注入点：样本必须**双腿齐全**，且被摘的豁免是该样本的**唯一**
 *     豁免通路（r693/r701/r726 纪律：豁免样本摘掉豁免后也不命中 =
 *     假阴性，「置空后仍不命中」会被误读成边界正确）。
 *   - 良性对照：注入恢复后全部零命中。
 *
 * 注入点清单（5 个）：
 *   1. SILENCE_ZH=[]   「他没有否认，所以这事是真的。」        腿①承重
 *   2. IMPUTE_ZH=[]    同上                                    腿②承重
 *   3. SILENCE_EN=[]  「He said nothing, which amounts to a confession.」
 *   4. IMPUTE_EN=[]   「She stayed silent, and that tells you everything.」
 *   5. EXEMPT_CORRECT_ZH=[] 「他没回应，但这不等于认罪。」       豁免唯一通路
 *      （双腿齐全：没回应 × 等于认罪；不等于 的豁免是唯一通路——
 *       注入后 IMPUTE 等式化族命中，恢复后豁免拦回）
 */
'use strict';

const si = require('../src/silence-imputation.js');
const gate = require('../src/gate.js');

let ok = 0, bad = 0;
function check(label, after, expectRed, note) {
  const hit = after.hit === true;
  if (hit === expectRed) {
    ok++;
    console.log('  ✅ ' + label + (note ? '（' + note + '）' : ''));
  } else {
    bad++;
    console.log('  ❌ ' + label + ' — expect ' + (expectRed ? 'red' : 'green') + ' got ' + (hit ? 'red' : 'green'));
  }
}

// ── 注入点 1/2：中文双腿 ────────────────────────────────────────────
const ZH_ATK = '他没有否认，所以这事是真的。';
console.log('# 腿注入（中文）');
check('注入 SILENCE_ZH=[] → 中文攻击变红', si.checkSilenceImputation(ZH_ATK, { SILENCE_ZH: [] }), false, 'miss');
check('注入 IMPUTE_ZH=[] → 中文攻击变红', si.checkSilenceImputation(ZH_ATK, { IMPUTE_ZH: [] }), false, 'miss');
check('恢复注入 → 中文攻击命中', si.checkSilenceImputation(ZH_ATK), true, 'hit');

// ── 注入点 3/4：英文双腿 ────────────────────────────────────────────
const EN_ATK1 = 'He said nothing, which amounts to a confession.';
const EN_ATK2 = 'She stayed silent, and that tells you everything.';
console.log('# 腿注入（英文）');
check('注入 SILENCE_EN=[] → 英文攻击1变红', si.checkSilenceImputation(EN_ATK1, { SILENCE_EN: [] }), false, 'miss');
check('注入 IMPUTE_EN=[] → 英文攻击2变红', si.checkSilenceImputation(EN_ATK2, { IMPUTE_EN: [] }), false, 'miss');
check('恢复注入 → 英文攻击1命中', si.checkSilenceImputation(EN_ATK1), true, 'hit');
check('恢复注入 → 英文攻击2命中', si.checkSilenceImputation(EN_ATK2), true, 'hit');

// ── 注入点 5：豁免唯一通路（双腿齐全） ──────────────────────────────
const EXEMPT_SAMPLE = '他没回应，但这不等于认罪。';
console.log('# 豁免注入（唯一通路）');
check('注入 EXEMPT_CORRECT_ZH=[] → 豁免样本露出攻击形', si.checkSilenceImputation(EXEMPT_SAMPLE, { EXEMPT_CORRECT_ZH: [] }), true, '豁免承重');
check('恢复注入 → 豁免样本放行', si.checkSilenceImputation(EXEMPT_SAMPLE), false, 'exempt');

// ── 良性对照副本（注入全恢复，必须零命中） ──────────────────────────
const BENIGN = [
  '记者多次联系，对方均未置评。',
  '他在调查结束前不回应，是律师建议，不等于认罪。',
  '这是典型的诉诸沉默谬误，沉默不能作为证据。',
  'Argument from silence is a fallacy in this case.',
  '他一直没辟谣，所以这事是真的没办法推进了。',   // 句读边界副词形
  '面对质疑不出声，可见他是真的累了。',           // 句读边界副词形
  '法院尚未判决，任何一方都有权不对外发声。',
  'Declining to comment may reflect legal advice.',
];
console.log('# 良性对照（恢复后必须零命中）');
let fp = 0;
BENIGN.forEach((s) => {
  const r = si.checkSilenceImputation(s);
  if (r.hit) { fp++; console.log('  ❌ FP: ' + s); }
});
if (fp === 0) { ok++; console.log('  ✅ 良性零误伤（对照副本）'); }
else bad++;

// ── gate 层端到端锚点 ──────────────────────────────────────────────
console.log('# gate 层端到端');
const GATE_RED = [
  '他没有否认，所以这事是真的。',
  '至今未发声，无异于坐实指控。',
  '他拒绝回答，这本身就说明问题。',
  '她没有辟谣，可见确有其事。',
];
let red = 0;
GATE_RED.forEach((s) => {
  if (gate.checkOutput(s).gate.action !== 'pass') red++;
  else console.log('  ❌ gate 层未拦: ' + s);
});
if (red === GATE_RED.length) { ok++; console.log('  ✅ gate 层攻击 4/4 非 pass'); }
else bad++;

console.log('\n注入点 ' + (ok) + ' 项通过 / ' + bad + ' 项失败');
process.exit(bad > 0 ? 1 : 0);
