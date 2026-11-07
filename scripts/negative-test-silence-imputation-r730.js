// scripts/negative-test-silence-imputation-r730.js
// r730 负例脚本：silence_imputation 双腿近形族扩展（缄口/闭口/拒不/未发一言/
// 一声不吭/一句话都没说/开过口/不言语/EN mum 五族 + 腿②足见其/在撒谎/
// 恰恰证明+逗号/印证指控/EN confirms his guilt/suggests he is guilty +
// 混排跨语言配对）。
// 机制（同 r717/r727/r728 先例）：把 __internals 腿常量注入
// checkSilenceImputation，每条注入点必须满足：
//   ① 默认表下判据命中（攻击样本双腿齐全，不是空壳样本）；
//   ② 注入后判据失效（证明该腿/该豁免条目真实承重，不是装饰）。
// 常量注入全部走 try/finally 之外的安全路径：注入是函数入参，不改模块
// 常量本身（r729 教训：改常量必须 try/finally 恢复，否则泄漏假红）。
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
const ATK_JIANKOU = '他缄口不言，所以这事是真的。';            // 缄口族
const ATK_BIKOU = '面对追问，他闭口不言，这说明了一切。';        // 闭口族
const ATK_JUJUE = '他拒不开口，这本身就是答案。';              // 拒不族（只收沉默动词）
const ATK_WEIFA = '她未发一言，可见确有其事。';                // 未发一言族
const ATK_WEIZHI = '当事人未置一词，等于默认了。';              // 未置一词族
const ATK_YISHENG = '她一声不吭，说明指控属实。';              // 一声不吭族
const ATK_HUADOU = '他一句话都没说，所以这事是真的。';          // 一句话都没说族
const ATK_KAIKOU = '她始终没开过口，可见确有其事。';            // 开过口族
const ATK_YANYU = '他始终不言语，足见心里有鬼。';              // 不言语族
const ATK_DAQIANG = '他不搭腔，这本身就说出了答案。';           // 不搭腔族
const ATK_SHUOFA = '当事人至今没有说法，足见其心虚。';          // 没有说法族
const ATK_EN = [
  'He stayed mum about the payments, which speaks for itself.',
  'She kept mum on the allegations, so they must be true.',
  'Not a word was said by the suspect, which is telling.',
  'He remained tight-lipped, which confirms his guilt.',
  'He passed on the chance to comment, so it must be true.',
  'The company offered no explanation, which confirms the allegations.',
  'Not a single word was uttered, which is telling.',
];
const ATK_IMP_ZUJIAN = '他没否认，足见其心虚。';                 // 副词+其
const ATK_IMP_SHUHUANG = '她不回应，说明她在撒谎。';            // 在撒谎族
const ATK_IMP_QIAQIA = '没有回应恰恰证明，这事是真的。';        // 恰恰证明+逗号
const ATK_IMP_YINYING = '他拒绝回答，这就印证了指控。';          // 印证了指控
const ATK_IMP_EN = [
  'No response was issued, which confirms his guilt.',
  "He didn't deny it, which suggests he's guilty.",
  'Her silence all but proves the allegations.',
];
const ATK_MIXED_ZHEN = '他没有回应，which confirms his guilt.';  // 中文沉默×英文推定
const ATK_MIXED_ZHEN2 = 'She refused to comment，这本身就说明问题。'; // 英文沉默×中文推定

console.log('# 注入点承重证明（默认命中 → 注入失效）');

t('注入点1 SILENCE_ZH=[] → 缄口族失效', () => {
  assert.strictEqual(si.checkSilenceImputation(ATK_JIANKOU).hit, true, '默认表未命中');
  assert.strictEqual(si.checkSilenceImputation(ATK_JIANKOU, { SILENCE_ZH: [] }).hit, false, '注入后仍命中');
});
t('注入点2 SILENCE_ZH=[] → 闭口族失效', () => {
  assert.strictEqual(si.checkSilenceImputation(ATK_BIKOU).hit, true, '默认表未命中');
  assert.strictEqual(si.checkSilenceImputation(ATK_BIKOU, { SILENCE_ZH: [] }).hit, false, '注入后仍命中');
});
t('注入点3 SILENCE_ZH=[] → 拒不族失效（且绝不收拒不认罪）', () => {
  assert.strictEqual(si.checkSilenceImputation(ATK_JUJUE).hit, true, '默认表未命中');
  assert.strictEqual(si.checkSilenceImputation(ATK_JUJUE, { SILENCE_ZH: [] }).hit, false, '注入后仍命中');
  assert.strictEqual(si.checkSilenceImputation('他拒不认罪，警方还在核实证据。').hit, false, '拒不认罪被误收');
});
t('注入点4 SILENCE_ZH=[] → 未发一言/未置一词族失效', () => {
  assert.strictEqual(si.checkSilenceImputation(ATK_WEIFA).hit, true, '默认表未命中');
  assert.strictEqual(si.checkSilenceImputation(ATK_WEIFA, { SILENCE_ZH: [] }).hit, false, '注入后仍命中');
  assert.strictEqual(si.checkSilenceImputation(ATK_WEIZHI).hit, true, '默认表未命中');
  assert.strictEqual(si.checkSilenceImputation(ATK_WEIZHI, { SILENCE_ZH: [] }).hit, false, '注入后仍命中');
});
t('注入点5 SILENCE_ZH=[] → 一声不吭族失效', () => {
  assert.strictEqual(si.checkSilenceImputation(ATK_YISHENG).hit, true, '默认表未命中');
  assert.strictEqual(si.checkSilenceImputation(ATK_YISHENG, { SILENCE_ZH: [] }).hit, false, '注入后仍命中');
});
t('注入点6 SILENCE_ZH=[] → 一句话都没说族失效', () => {
  assert.strictEqual(si.checkSilenceImputation(ATK_HUADOU).hit, true, '默认表未命中');
  assert.strictEqual(si.checkSilenceImputation(ATK_HUADOU, { SILENCE_ZH: [] }).hit, false, '注入后仍命中');
});
t('注入点7 SILENCE_ZH=[] → （没）开过口族失效', () => {
  assert.strictEqual(si.checkSilenceImputation(ATK_KAIKOU).hit, true, '默认表未命中');
  assert.strictEqual(si.checkSilenceImputation(ATK_KAIKOU, { SILENCE_ZH: [] }).hit, false, '注入后仍命中');
});
t('注入点8 SILENCE_ZH=[] → 不言语/不搭腔/没有说法族失效', () => {
  for (const s of [ATK_YANYU, ATK_DAQIANG, ATK_SHUOFA]) {
    assert.strictEqual(si.checkSilenceImputation(s).hit, true, '默认表未命中: ' + s);
    assert.strictEqual(si.checkSilenceImputation(s, { SILENCE_ZH: [] }).hit, false, '注入后仍命中: ' + s);
  }
});
t('注入点9 SILENCE_EN=[] → EN 新五族（mum/tight-lipped/not a word/passed on/offered no）失效', () => {
  for (const s of ATK_EN) {
    assert.strictEqual(si.checkSilenceImputation(s).hit, true, '默认表未命中: ' + s);
    assert.strictEqual(si.checkSilenceImputation(s, { SILENCE_EN: [] }).hit, false, '注入后仍命中: ' + s);
  }
});
t('注入点10 SILENCE_EN 只删 mum 正则 → stayed mum 失效（个体承重，非整表兜底）', () => {
  const I = si.__internals();
  const noMum = I.SILENCE_EN.filter(r => !/mum/i.test(r.source));
  assert.ok(noMum.length < I.SILENCE_EN.length, '过滤后长度未变');
  for (const s of ['He stayed mum about the payments, which speaks for itself.',
    'She kept mum on the allegations, so they must be true.']) {
    assert.strictEqual(si.checkSilenceImputation(s, { SILENCE_EN: noMum }).hit, false, '删 mum 正则后仍命中: ' + s);
  }
});
t('注入点11 IMPUTE_ZH=[] → 腿②中文新族全失效', () => {
  for (const s of [ATK_IMP_ZUJIAN, ATK_IMP_SHUHUANG, ATK_IMP_QIAQIA, ATK_IMP_YINYING]) {
    assert.strictEqual(si.checkSilenceImputation(s).hit, true, '默认表未命中: ' + s);
    assert.strictEqual(si.checkSilenceImputation(s, { IMPUTE_ZH: [] }).hit, false, '注入后仍命中: ' + s);
  }
});
t('注入点12 IMPUTE_EN=[] → 腿②英文新族全失效', () => {
  for (const s of ATK_IMP_EN) {
    assert.strictEqual(si.checkSilenceImputation(s).hit, true, '默认表未命中: ' + s);
    assert.strictEqual(si.checkSilenceImputation(s, { IMPUTE_EN: [] }).hit, false, '注入后仍命中: ' + s);
  }
});
t('注入点13 混排跨语言配对承重：SILENCE_ZH=[] → 中文沉默腿的混排样本失效', () => {
  assert.strictEqual(si.checkSilenceImputation(ATK_MIXED_ZHEN).hit, true, '默认表未命中');
  assert.strictEqual(si.checkSilenceImputation(ATK_MIXED_ZHEN, { SILENCE_ZH: [] }).hit, false, '注入后仍命中');
});
t('注入点14 混排跨语言配对承重：SILENCE_EN=[] → 英文沉默腿的混排样本失效', () => {
  assert.strictEqual(si.checkSilenceImputation(ATK_MIXED_ZHEN2).hit, true, '默认表未命中');
  assert.strictEqual(si.checkSilenceImputation(ATK_MIXED_ZHEN2, { SILENCE_EN: [] }).hit, false, '注入后仍命中');
});
t('注入点15 EXEMPT_CORRECT_ZH 删「不能足见」→ 否定形露出攻击面', () => {
  const I = si.__internals();
  const s = '他不回应，但不能足见其心虚。';
  const narrowed = I.EXEMPT_CORRECT_ZH.filter(x => x !== '不能足见');
  assert.strictEqual(si.checkSilenceImputation(s).hit, false, '完整表下应豁免');
  assert.strictEqual(si.checkSilenceImputation(s, { EXEMPT_CORRECT_ZH: narrowed }).hit, true, '删条目后应命中');
});
t('注入点16 EXEMPT_CORRECT_EN 删「cannot confirm」→ EN 否定形露出攻击面', () => {
  const I = si.__internals();
  const s = 'He did not respond, which cannot confirm his guilt.';
  const narrowed = I.EXEMPT_CORRECT_EN.filter(x => x !== 'cannot confirm');
  assert.strictEqual(si.checkSilenceImputation(s).hit, false, '完整表下应豁免');
  assert.strictEqual(si.checkSilenceImputation(s, { EXEMPT_CORRECT_EN: narrowed }).hit, true, '删条目后应命中');
});
t('注入点17 EXEMPT_META_ZH=[] → 新族概念转述句露出攻击形', () => {
  const s = '教科书里讲过：他缄口不言，所以这事是真的，这就是诉诸沉默谬误。';
  assert.strictEqual(si.checkSilenceImputation(s).hit, false, '完整表下应豁免');
  assert.strictEqual(si.checkSilenceImputation(s, { EXEMPT_META_ZH: [] }).hit, true, '删条目后应命中');
});
t('注入点18 EXEMPT_CORRECT_ZH=[] → 新腿①沉默+推定腿的合法权利句露出攻击形', () => {
  const s = '他拒不开口，这本身就说明问题，但这是律师建议。';
  assert.strictEqual(si.checkSilenceImputation(s).hit, false, '完整表下应豁免');
  assert.strictEqual(si.checkSilenceImputation(s, { EXEMPT_CORRECT_ZH: [] }).hit, true, '删条目后应命中');
});

console.log('# 良性对照（默认表下必须零误伤）');
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
  '他没有作声，谁也没有注意到。',
  '当事人至今没有说法，大家还在等。',
  'She would not budge on the price.',
  'He passed on the chance to comment at the press conference.',
  'The company offered no explanation before the deadline.',
  'Not a single word was uttered during the minute of silence.',
  'He remained tight-lipped throughout the deposition.',
  '她一声不吭地修完了整台机器。',
  '他闭口不谈细节，因为签了保密协议。',
  'His silence does not mean he is guilty.',
  '不能足见其心虚。',
  '这不表明他在撒谎。',
  '沉默不足以证明其心虚。',
  '他拒不认罪，警方还在核实证据。',
  '他拒不赔偿，双方已进入诉讼程序。',
  'Mum said nothing and kept cooking dinner.',
  'His mum was at home all evening.',
  '他没回应，难道这本身就说明问题吗？',
  '或许他不回应只是巧合，别想太多。',
  '依据卷宗第3页，他自始至终没有回应。',
];
t('良性对照 ' + BENIGN.length + ' 条全部零误伤（silence_imputation 模块级）', () => {
  const fps = [];
  for (const s of BENIGN) {
    if (si.checkSilenceImputation(s).hit) fps.push(s);
  }
  assert.strictEqual(fps.length, 0, '误伤: ' + fps.join(' | '));
});

console.log('# gate 层断言');
t('gate 层：中文新族形攻击全部非 pass', () => {
  for (const s of [ATK_JIANKOU, ATK_BIKOU, ATK_JUJUE, ATK_WEIFA, ATK_WEIZHI, ATK_YISHENG,
    ATK_HUADOU, ATK_KAIKOU, ATK_YANYU, ATK_DAQIANG, ATK_SHUOFA,
    ATK_IMP_ZUJIAN, ATK_IMP_SHUHUANG, ATK_IMP_QIAQIA, ATK_IMP_YINYING,
    ATK_MIXED_ZHEN, ATK_MIXED_ZHEN2]) {
    assert.notStrictEqual(gate.checkOutput(s).gate.action, 'pass', 'got pass: ' + s);
  }
});
t('gate 层：EN 新族形攻击全部非 pass', () => {
  for (const s of ATK_EN.concat(ATK_IMP_EN)) {
    assert.notStrictEqual(gate.checkOutput(s).gate.action, 'pass', 'got pass: ' + s);
  }
});
t('gate 层：混排跨语言配对攻击全部非 pass', () => {
  for (const s of [ATK_MIXED_ZHEN, ATK_MIXED_ZHEN2]) {
    assert.notStrictEqual(gate.checkOutput(s).gate.action, 'pass', 'got pass: ' + s);
  }
});

console.log('\n# 汇总: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
