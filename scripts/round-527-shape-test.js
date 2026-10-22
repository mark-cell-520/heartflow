'use strict';
// r527 deny-zh 补支 v3 / min-zh 补支 v3：按形状实测逐条收敛。
// 上一版补支「根本没受伤」未中（形状测试 deny=false），因为原行0 要求
// (没|未|不)(有|受|造成) 后紧跟伤名，而「根本没受伤」是 没+直接受伤。
// 本版本逐形状验证后再写。
const path = require('node:path');
const fs = require('node:fs');
const mod = require(path.join(__dirname, '..', 'src', 'harm-invalidation.js'));
const I = mod.__internals();

// 候选支（先用 new RegExp 逐个在形状串上验证）
const shapes = {
  sA: '根本没受伤',
  sB: '没有受损',
  sC: '未受影响',
  sD: '没人掉块肉',
  sE: '实际上也没人掉块肉',
  sF: '其实只是不适应',
  sG: '大家其实没有真的受损',
  sH: '她根本没受伤',
  sI: '压根没受伤',
  sJ: '并没有伤人',
};

const cand = {
  // 否定词直接贴伤名：根本/压根/丝毫/一点 + 没|未 + 伤名（无「有」）
  c1: '(?:根\\s*本|压根|丝毫|一点|半点|压根儿)\\s*(?:没|未)\\s*(?:受\\s*伤|伤\\s*害|损\\s*失|受\\s*损|影\\s*响|后\\s*遗\\s*症|不\\s*适|中\\s*毒|泄\\s*露)',
  // 「没有|未 + (人|谁|任何人) + (掉|受|缺) …」
  c2: '(?:没|未)\\s*(?:有|见)\\s*(?:人|谁|任何)\\s*(?:受|掉|缺|崴|伤)(?:伤|块|肉|腿|胳)\\s*(?:肉|腿|胳)?',
  // 「大家|谁 + (其实|实际上) + 没有 + 真的 + 受损|受影响」
  c3: '(?:大\\s*家|谁|人\\s*家)\\s*(?:其\\s*实|事\\s*实\\s*上|实\\s*际\\s*上)\\s*(?:并)?\\s*(?:没|未)\\s*(?:有)?\\s*(?:真\\s*的|真正|实\\s*质)?\\s*(?:受\\s*损|受\\s*影\\s*响|损\\s*失|受\\s*伤)',
};

console.log('--- 候选支形状验证（before 现状）---');
for (const [cn, re] of Object.entries(cand)) {
  const R = new RegExp(re);
  const res = Object.entries(shapes).map(([sn, sv]) => `${sn}=${R.test(sv) ? 'Y' : '-'}`).join(' ');
  console.log(`  ${cn}: ${res}`);
}
console.log('--- 当前引擎对形状的命中 ---');
for (const [sn, sv] of Object.entries(shapes)) {
  console.log(`  ${sn}: deny=${I.HARM_DENY_ZH.test(sv)} min=${I.MINIMIZE_ZH.test(sv)}`);
}
console.log('结束');
