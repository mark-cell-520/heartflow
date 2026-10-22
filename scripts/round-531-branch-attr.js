// r531: 为 round-530 守卫测试确定变异支归属（只输出索引，不输出样本原文）
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'harm-invalidation.js'), 'utf8');
const attacks = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'round-530-harm-invalidation-samples.json'), 'utf8'));
const benign = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'round-530-harm-invalidation-benign.json'), 'utf8'));

// 把 const X = new RegExp([ ... ].join('|'), 'i') 的字符串数组拆出来
function extractDecl(name) {
  const start = src.indexOf(`const ${name} = new RegExp([`);
  if (start < 0) throw new Error('decl not found: ' + name);
  const m = src.slice(start + 1).match(/\n\]\.join\(/);
  if (!m) throw new Error('array end not found: ' + name);
  const seg = src.slice(start, start + 1 + m.index + 1);
  // 逐项求值：把 ['a','b'].join('|') 的每一项 eval
  const items = [];
  const re = /'((?:[^'\\]|\\.)*)'/g;
  let mm;
  while ((mm = re.exec(seg)) !== null) {
    let lit;
    try { lit = JSON.parse('"' + mm[1].replace(/\\'/g, "'") + '"'); } catch (e) { lit = mm[1]; }
    // 处理字符串拼接的项（值含 + 连接）
    items.push(lit);
  }
  return items;
}

const decls = ['HARM_DENY_ZH', 'HARM_DENY_EN', 'MINIMIZE_ZH', 'MINIMIZE_EN', 'EXEMPT_ZH', 'EXEMPT_EN'];
const map = {};
for (const d of decls) map[d] = extractDecl(d);

console.log('== 声明项数 ==');
for (const d of decls) console.log(`${d}: ${map[d].length} 项`);

function hitBranches(text, decl) {
  const out = [];
  map[decl].forEach((b, i) => {
    try { if (new RegExp(b, 'i').test(text)) out.push(i); } catch (e) { out.push('E' + i); }
  });
  return out;
}

console.log('\n== 攻击样本支归属（idx → deny 支 / minimize 支）==');
attacks.forEach((s, i) => {
  const isZh = /[\u4e00-\u9fff]/.test(s);
  const denyName = isZh ? 'HARM_DENY_ZH' : 'HARM_DENY_EN';
  const minName = isZh ? 'MINIMIZE_ZH' : 'MINIMIZE_EN';
  const exZh = hitBranches(s, 'EXEMPT_ZH');
  const exEn = hitBranches(s, 'EXEMPT_EN');
  console.log(`atk#${i} lang=${isZh ? 'zh' : 'en'} deny=${JSON.stringify(hitBranches(s, denyName))} min=${JSON.stringify(hitBranches(s, minName))} exempt_zh=${JSON.stringify(exZh)} exempt_en=${JSON.stringify(exEn)}`);
});

console.log('\n== 良性样本（应全 miss；列出任何命中的支）==');
benign.forEach((s, i) => {
  const hits = [];
  for (const d of decls) {
    const h = hitBranches(s, d);
    if (h.length) hits.push(`${d}:${JSON.stringify(h)}`);
  }
  if (hits.length) console.log(`ben#${i} ${hits.join(' ')}`);
});
console.log('\n== 豁免探针基线检查 ==');
const probeZh = '我们先核算每个人的分摊金额，风险由我们承担；你无需承担后果，这事不用你点头。';
const probeEn = 'I will bear the cost of the recall, so you do not have to carry the cost yourself, and you can just sign here.';
for (const p of [{ n: 'probeZh', t: probeZh, lang: 'zh' }, { n: 'probeEn', t: probeEn, lang: 'en' }]) {
  const denyName = p.lang === 'zh' ? 'HARM_DENY_ZH' : 'HARM_DENY_EN';
  const minName = p.lang === 'zh' ? 'MINIMIZE_ZH' : 'MINIMIZE_EN';
  console.log(`${p.n} deny=${JSON.stringify(hitBranches(p.t, denyName))} min=${JSON.stringify(hitBranches(p.t, minName))}`);
}
