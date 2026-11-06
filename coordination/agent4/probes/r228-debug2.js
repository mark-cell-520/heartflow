// r228 调试2：逐要件 trace H7-ZH（复制 findSignatures 逻辑加打印）
const M = require('/data/home/heartflow/src/conditional-transposition.js');
const I = M.__internals();

const text = '健康人群里携带该基因的概率只有百分之一，所以携带该基因的人是健康人的概率也只有百分之一。';
const isZh = true;

// extractTokens 等价复制
function extractTokens(text, isZh) {
  const out = [];
  const vres = isZh ? I.ZH_VALUE_RES : I.EN_VALUE_RES;
  for (const { re, to } of vres) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      let v = null;
      try { v = to(m); } catch (e) { v = null; }
      if (v == null || !isFinite(v) || v <= 0 || v >= 1) continue;
      out.push({ kind: 'value', v, idx: m.index, end: m.index + m[0].length, raw: m[0] });
      if (m.index === reG.lastIndex) reG.lastIndex++;
    }
  }
  const eres = isZh ? I.EXTREME_ZH : I.EXTREME_EN;
  for (const re of eres) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      out.push({ kind: 'extreme', v: m[0], idx: m.index, end: m.index + m[0].length, raw: m[0] });
      if (m.index === reG.lastIndex) reG.lastIndex++;
    }
  }
  out.sort((a, b) => a.idx - b.idx);
  return out;
}

const tokens = extractTokens(text, isZh);
console.log('tokens:', JSON.stringify(tokens));

// 推断词
const iG = new RegExp(I.INFER_ZH.source, 'g');
const infers = []; let im;
while ((im = iG.exec(text)) !== null) { infers.push({ idx: im.index, end: im.index + im[0].length }); if (im.index === iG.lastIndex) iG.lastIndex++; }
console.log('infers:', JSON.stringify(infers));

// 否定守卫逐位置验证
const NEG_ZH = /不能|不应|不可|未必|不一定|并非|不代表|不意味着|很难|不要|无须|无需|不足以|不构成|称不上|算不上|并不|并不会|不会|不是说|不能说|谈不上|并没有|也不存在|不等于|推不出|无法据此|难以|难以据此/;
for (const inf of infers) {
  console.log('inf', inf.idx, 'pre8=', JSON.stringify(text.slice(Math.max(0, inf.idx - 8), inf.idx)), 'neg=', NEG_ZH.test(text.slice(Math.max(0, inf.idx - 8), inf.idx)));
}
for (const t of tokens) {
  console.log('tok', t.idx, t.raw, 'pre8=', JSON.stringify(text.slice(Math.max(0, t.idx - 8), t.idx)), 'neg=', NEG_ZH.test(text.slice(Math.max(0, t.idx - 8), t.idx)));
}

// 条件框 + 实体回指
const frames = [];
for (const f of I.FRAME_ZH) {
  const reG = new RegExp(f.re.source, f.re.flags.includes('g') ? f.re.flags : f.re.flags + 'g');
  let m;
  while ((m = reG.exec(text)) !== null) { frames.push({ start: m.index, end: m.index + m[0].length, entity: m[f.ent] }); if (m.index === reG.lastIndex) reG.lastIndex++; }
}
console.log('frames:', JSON.stringify(frames));

// 豁免逐项
const groups = ['EXEMPT_BASERATE_ZH', 'EXEMPT_CORRECT_ZH', 'EXEMPT_META_ZH', 'EXEMPT_ESTIMATE_ZH'];
for (const g of groups) {
  const hit = I[g].some(re => re.test(text));
  console.log(g, '=', hit);
}

// sameToken 与距离
function sameToken(t1, t2) {
  if (t1.kind !== t2.kind) return false;
  const scale = Math.max(1, Math.abs(t1.v), Math.abs(t2.v));
  return Math.abs(t1.v - t2.v) <= 1e-9 * scale;
}
console.log('sameToken(15,39):', sameToken(tokens[0], tokens[2] !== undefined ? tokens[2] : tokens[1]));

// 最终：直接调用模块看结果
console.log('module result:', JSON.stringify(M.checkConditionalTransposition(text)));
