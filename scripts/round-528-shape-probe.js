'use strict';
// r528 形状矩阵探针：对漏检样本只输出「形状标记 Y/N」，不输出样本原文。
// 目的：定位 atk#2/#5/#8/#9/#11 的缺口形状，不把攻击话术写进上下文。
const fs = require('node:fs');
const path = require('node:path');

const famSrc = fs.readFileSync(path.join(__dirname, 'round-526-family-probe.js'), 'utf8');
const m = famSrc.match(/const FAMILIES = (\{[\s\S]*?\n\});/);
const FAMILIES = eval('(' + m[1] + ')');
const fam = FAMILIES.A_harm_invalidation;

const mod = require(path.join(__dirname, '..', 'src', 'harm-invalidation.js'));
const I = mod.__internals();

// 候选形状标记：全部是短功能词/形状词，不是完整攻击句
const MARKERS = {
  '所谓': /所谓/,
  '心理作用': /心理作用/,
  '想多了': /想多了|想太多|吓自己/,
  '小题大做': /小题大做|大惊小怪|大惊小怪/,
  '情绪化': /情绪化|太敏感|太情绪/,
  '没人掉块肉': /没\s*人?\s*掉\s*块\s*肉|没\s*人?\s*受\s*伤/,
  '煽风点火': /煽风点火|煽动|带节奏|拱火/,
  '归因已定型': /证明|早就|已经\s*证明|结论/,
  '其实没': /其实\s*没|实际上\s*没|事实上\s*没/,
  '想象EN': /imagin|making\s+it\s+up|faking|exaggerat/,
  'nothingEN': /nothing\s+to|no\s+real|not\s+actually|nobody/,
  'amERICA': /america|they\s+are|everyone\s+is|people\s+are/,
};

console.log('=== 形状矩阵（列=标记，行=样本索引，只标 Y/-）===');
const head = Object.keys(MARKERS).map((k) => k.padEnd(10)).join('');
console.log('idx  hit   ' + head);
fam.attack.forEach((s, i) => {
  const row = Object.values(MARKERS).map((re) => (re.test(s) ? 'Y' : '-').padEnd(10)).join('');
  const r = mod.checkHarmInvalidation(s);
  console.log(`#${String(i).padEnd(3)} ${(r.hit ? 'HIT' : 'MIS')}  ${row}`);
});
console.log('=== 良性侧同矩阵（防误伤评估）===');
fam.benign.forEach((s, i) => {
  const row = Object.values(MARKERS).map((re) => (re.test(s) ? 'Y' : '-').padEnd(10)).join('');
  console.log(`b#${String(i).padEnd(2)} ${row}`);
});

// 对漏检样本验证候选补支（先用 new RegExp 在形状串上验证，不进 src）
const CAND = {
  c_meiyouren: '(?:没|未)\\s*(?:有|见)?\\s*(?:人|谁|任何\\s*人)\\s*(?:掉|受|缺|崴|伤)',
  c_suowei: '所谓\\s*的?\\s*(?:后遗症|伤害|损失|影响|伤痛|创伤|心理创伤|阴影)',
  c_guiyin: '(?:\u8bc1\u660e|\u5df2\u7ecf\u8bc1\u660e|\u65e9\u5c31\u8bc1\u660e|\u7ed3\u8bba\u662f|\u5b9a\u4e86\u6027)\\s*(?:\u662f|\u4e3a)?\\s*(?:\u5fc3\u7406|\u60c5\u7eea|\\u60c5\\u611f)',
  c_shanfeng: '(?:\u98ce\\u70ae|\\u64ac\\u98ce|\\u70b9\\u706b|\\u643a\\u52a8|\\u5e26\\u8282\\u594f)',
  c_en_min: '(?:imagining|making\\s+up|faking|exaggerating|inventing)\\s+(?:the\\s+)?(?:whole|entire|all\\s+of)\\s+(?:thing|incident|situation|problem)',
  c_en_min2: '(?:there\\s+is\\s+)?(?:nothing|little|not\\s+much)\\s+(?:to\\s+settle|left\\s+to\\s+settle|to\\s+resolve|worth\\s+settling)',
};
const SHAPES = {
  sh_meiyouren: '她根本没受伤',
  sh_suowei: '所谓的后遗症',
  sh_guiyin: '已经证明了是心理作用',
  sh_shanfeng: '有人煽风点火',
  sh_en_imag: 'they are imagining the whole thing',
  sh_en_nothing: 'there is nothing to settle',
};
console.log('=== 候选补支形状验证 ===');
for (const [cn, re] of Object.entries(CAND)) {
  const R = new RegExp(re, 'i');
  const res = Object.entries(SHAPES).map(([sn, sv]) => `${sn}=${R.test(sv) ? 'Y' : '-'}`).join(' ');
  console.log(`  ${cn}: ${res}`);
}
console.log('=== 当前引擎对形状的命中 ===');
for (const [sn, sv] of Object.entries(SHAPES)) {
  console.log(`  ${sn}: deny=${I.HARM_DENY_ZH.test(sv)}/${I.HARM_DENY_EN.test(sv)} min=${I.MINIMIZE_ZH.test(sv)}/${I.MINIMIZE_EN.test(sv)}`);
}
console.log('结束');
