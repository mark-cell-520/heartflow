/** r245 matchAlive 逐腿验证：找出被否定过滤误杀的响应词腿 */
const M = require('../../src/framing-effect.js');
const I = M.__internals();
const { detectFramingEffect } = M;

const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不)/;
const IMMEDIATE = /(?:不|没|未|无|非)$/;
const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|不觉得|不感觉|没觉得|没感觉|谈不上|不会再|不会|不再|别|并未因|并没有因|不因)[^。，！？；\n]{0,5}$/;

function allM(re, text) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = []; let m;
  while ((m = g.exec(text)) !== null) { out.push({ idx: m.index, end: m.index + m[0].length, raw: m[0] }); if (m.index === g.lastIndex) g.lastIndex++; }
  return out;
}
const cases = [
  '他说成晋级率很高大家蜂拥报名，说成淘汰率不低一哄而散',
  '换个说法再讲一遍，听众就改变了对同一个方案的决定',
  '蜂拥报名，一哄而散',
];
for (const t of cases) {
  console.log('\n=== ' + t + ' ===');
  for (const [name, list] of [['FLIP_POS_ZH', I.FLIP_POS_ZH], ['FLIP_NEG_ZH', I.FLIP_NEG_ZH],
                               ['POS_FRAME_ZH', I.POS_FRAME_ZH], ['NEG_FRAME_ZH', I.NEG_FRAME_ZH]]) {
    for (const re of list) for (const x of allM(re, t)) {
      const before = t.slice(Math.max(0, x.idx - 8), x.idx);
      const killed = NEG_INSIDE.test(x.raw) || IMMEDIATE.test(before) || NEG_BEFORE.test(before);
      console.log(`  ${name.padEnd(13)} ${killed ? 'KILLED' : 'alive '} ${JSON.stringify(x.raw)}  before=${JSON.stringify(before)}`);
    }
  }
}
