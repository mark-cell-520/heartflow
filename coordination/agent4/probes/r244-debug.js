// r244 调试：定位 ZH POS_FRAME_ZH 删除后仍命中的承重框架
const mod = require('/data/home/heartflow/src/framing-effect.js');
const I = mod.__internals();
const t = '医生说成功率百分之九十五我立刻签字，说失败率百分之五我马上想换家医院。';
for (const [k, v] of Object.entries(I)) {
  if (!Array.isArray(v)) continue;
  for (const re of v) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(t)) !== null) console.log(k, '::', JSON.stringify(m[0]), '@', m.index);
  }
}
console.log('--- with POS_FRAME_ZH emptied ---');
const r = mod.detectFramingEffect(t, { POS_FRAME_ZH: [] });
console.log(JSON.stringify(r.details || r));
