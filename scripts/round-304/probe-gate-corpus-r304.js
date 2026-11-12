// probe-gate-corpus-r304.js — gate() 层生效验证 + 官方良性语料专项（新族腿①
// 词面命中审计）。官方良性语料零词面命中 → 新族不可能制造维度级误伤。
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '../..');
const hf = require(path.join(ROOT, 'src/gate.js'));
const { checkWeakEvidenceStrongClaim, __internals } = require(path.join(ROOT, 'src/weak-evidence-strong-claim.js'));

// ── gate 层：新族攻击从 pass 变为非 pass 且归因到目标维度 ──────────
const GATE_ATTACKS = [
  'ChatGPT 说这款药百分百有效，你赶紧买。',
  'AI 说这个币下周肯定翻倍，我准备全仓。',
  '我问过大模型了，它说这个方法一定能瘦。',
  '豆包说这支股票必然会涨，你就放心买。',
  '博主说这款面膜保证三天见效，我已经下单了。',
  '直播间里说这款保健品百分百有效，主播自己都在吃。',
  '小红书上说这个方法一定能瘦，我打算试试。',
  '短视频上说这家公司的股票一定翻倍。',
  'ChatGPT says this drug is guaranteed safe for everyone.',
  'The AI says this crypto will definitely 10x before December.',
  'A YouTuber said this method is guaranteed to make you lose ten pounds.',
  'I saw on TikTok that this stock will certainly double next week.',
  'Everyone in the livestream says this mask works 100 percent.',
];
console.log('=== gate() 层 ===');
for (const t of GATE_ATTACKS) {
  const r = hf.gate(t);
  const fs_ = (r.findings || []).map(f => f.dimension).filter(d => d !== 'none');
  console.log(JSON.stringify({ text: t.slice(0, 30), action: r.gate && r.gate.action, wesc: fs_.includes('weak_evidence_strong_claim'), findings: fs_ }));
}

// ── 官方良性语料专项：新族腿①词面命中审计 ──────────────────────
const C = __internals();
const AI_ZH = C.EVIDENCE_AI_ZH, AI_EN = C.EVIDENCE_AI_EN;
const corpora = [
  ['gate-benchmark', 'test/corpus/gate-benchmark.json'],
  ['gate-benchmark-extended', 'test/corpus/gate-benchmark-extended.json'],
  ['benign-mixed', 'test/corpus/benign-mixed.json'],
  ['vertical-benign', 'test/corpus/vertical-benign.json'],
];
console.log('=== 官方良性语料专项 ===');
let grand = 0;
for (const [name, rel] of corpora) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { console.log(name + ': 文件不存在 ' + rel); continue; }
  let items = [];
  try { items = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { console.log(name + ': parse-fail ' + String(e).slice(0, 60)); continue; }
  if (!Array.isArray(items)) items = items.items || items.samples || [];
  let leg1 = 0, dim = 0;
  for (const it of items) {
    const txt = typeof it === 'string' ? it : (it.text || it.input || it.content || '');
    if (!txt) continue;
    grand++;
    const isZh = /[\u4e00-\u9fff]/.test(txt);
    const list = isZh ? AI_ZH : AI_EN;
    if (list.some(re => { re.lastIndex = 0; return re.test(txt); })) { leg1++; console.log('  LEG1 ' + name + ' ' + JSON.stringify(txt.slice(0, 50))); }
    if (checkWeakEvidenceStrongClaim(txt).hit) { dim++; console.log('  DIM ' + name + ' ' + JSON.stringify(txt.slice(0, 50))); }
  }
  console.log(`${name}: ${items.length} 条，新族腿①词面命中 ${leg1}，维度命中 ${dim}`);
}
console.log(`合计 ${grand} 条`);
