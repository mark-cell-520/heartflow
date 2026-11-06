// r228 调试：H6/H7/H10 漏判定位——逐要件打印中间状态
const M = require('/data/home/heartflow/src/conditional-transposition.js');
// 复刻内部函数做可视化（不依赖私有访问，用 internals + 自制等价逻辑）
const I = M.__internals();

const cases = {
  'H6-EN': 'Among law-abiding citizens this pattern occurs once in a hundred thousand, so the probability that someone with this pattern is law-abiding is also one in a hundred thousand.',
  'H7-ZH': '健康人群里携带该基因的概率只有百分之一，所以携带该基因的人是健康人的概率也只有百分之一。',
  'H10-EN': 'The probability of a DNA match in innocent people is one in ten million; the probability that a DNA match means the person is innocent is therefore also one in ten million.',
};

function allIdx(list, text) {
  const out = [];
  for (const re of list) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) { out.push({ idx: m.index, text: m[0] }); if (m.index === reG.lastIndex) reG.lastIndex++; }
  }
  return out;
}

for (const [id, text] of Object.entries(cases)) {
  const isZh = /[\u4e00-\u9fff]/.test(text);
  console.log('===== ' + id + ' (isZh=' + isZh + ') =====');
  // 1. 数值 token
  const vres = isZh ? I.ZH_VALUE_RES : I.EN_VALUE_RES;
  const vals = [];
  for (const { re, to } of vres) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) { vals.push({ idx: m.index, raw: m[0], v: (() => { try { return to(m); } catch (e) { return null; } })() }); if (m.index === reG.lastIndex) reG.lastIndex++; }
  }
  console.log('数值token:', JSON.stringify(vals));
  // 2. 极值 token
  const eres = isZh ? I.EXTREME_ZH : I.EXTREME_EN;
  console.log('极值token:', JSON.stringify(allIdx(eres, text).map(h => ({ idx: h.idx, text: h.text }))));
  // 3. 条件框
  const flist = isZh ? I.FRAME_ZH : I.FRAME_EN;
  const frames = [];
  for (const f of flist) {
    const reG = new RegExp(f.re.source, f.re.flags.includes('g') ? f.re.flags : f.re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) { frames.push({ start: m.index, end: m.index + m[0].length, entity: m[f.ent] }); if (m.index === reG.lastIndex) reG.lastIndex++; }
  }
  console.log('条件框:', JSON.stringify(frames));
  // 4. 推断词
  const ire = isZh ? I.INFER_ZH : I.INFER_EN;
  const iG = new RegExp(ire.source, ire.flags.includes('g') ? ire.flags : ire.flags + 'g');
  const infers = []; let im;
  while ((im = iG.exec(text)) !== null) { infers.push({ idx: im.index, end: im.index + im[0].length, raw: im[0] }); if (im.index === iG.lastIndex) iG.lastIndex++; }
  console.log('推断词:', JSON.stringify(infers));
  // 5. 实体回指词
  for (const fr of frames) {
    const words = isZh
      ? (() => { const o = []; for (let i = 0; i + 2 <= fr.entity.length; i++) o.push(fr.entity.slice(i, i + 2)); return o; })()
      : fr.entity.toLowerCase().split(/[^a-z'-]+/);
    console.log('实体「' + fr.entity + '」候选词:', JSON.stringify(words));
  }
}
