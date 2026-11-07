/** r245 MISS 逐腿诊断：定位 framing_effect 剩余漏判的具体断腿 */
const M = require('../../src/framing-effect.js');
const { POS_FRAME_ZH, NEG_FRAME_ZH, FRAME_VERB_ZH, FLIP_POS_ZH, FLIP_NEG_ZH,
        POS_FRAME_EN, NEG_FRAME_EN, FRAME_VERB_EN, FLIP_POS_EN, FLIP_NEG_EN } = M.__internals();

const cases = [
  '同一台手术，包装成成功率百分之九十团队全力支持，换成失败率立刻被否',
  '换个说法再讲一遍，听众就改变了对同一个方案的决定',
  '他说成晋级率很高大家蜂拥报名，说成淘汰率不低一哄而散',
  '同样一份数据，说成达标率九成得到表扬，换成未达标一成遭到否决',
];
const legs = [
  ['POS_FRAME_ZH', POS_FRAME_ZH], ['NEG_FRAME_ZH', NEG_FRAME_ZH],
  ['FRAME_VERB_ZH', FRAME_VERB_ZH], ['FLIP_POS_ZH', FLIP_POS_ZH],
  ['FLIP_NEG_ZH', FLIP_NEG_ZH],
];
for (const c of cases) {
  console.log('\n=== ' + c.slice(0, 40) + ' ===');
  for (const [name, list] of legs) {
    const hits = [];
    for (const re of list) {
      const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
      let m; while ((m = g.exec(c)) !== null) { hits.push(m[0]); if (m.index === g.lastIndex) g.lastIndex++; }
    }
    console.log(`  ${name.padEnd(16)}: ${hits.length ? hits.slice(0,4).map(h=>JSON.stringify(h)).join(' ') : '— 断腿'}`);
  }
}
