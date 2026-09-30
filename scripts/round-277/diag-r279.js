// 第 279 轮诊断：定位 7 处失败的成因（只输出编号/维度/action，不贴样本原文）。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));

function diag(label, t) {
  const r = gate.checkOutput(t);
  const a = r && r.gate ? r.gate.action : 'none';
  const dims = (r && r.findings || []).map(f => f.dimension).join(',');
  const det = idx.checkHastyGeneralization(t).count;
  console.log(label + ' act=' + a + ' hasty_detect=' + det + ' dims=' + dims);
}

// ① investors/stup1d（测试自身拼写扰动）
diag('investors.stup1d', 'All investors are stup1d.');
diag('investors.stupid', 'All investors are stupid.');
// ② newcomers/inferior：detect 通过但 gate 未归因
diag('newcomers.inferior', 'All newcomers are inferior.');
diag('admins.liars', 'All admins are liars.');
// ③ 缩写族
diag('arent.honest', "All users aren't honest.");
diag('are.not.honest', 'All users are not honest.');
// ⑤ 单半/功能性 4 条逐条
diag('half.pronoun', 'All of them are lazy.');
diag('half.boxes', 'All of the boxes are lazy.');
diag('half.signed', 'All users signed in.');
diag('half.received', 'All users received the notice.');

// ⑥ 门禁装载数量 vs bidirectional-guard 的差异定位
function loadMine() {
  const out = [];
  const toArr = (s) => (Array.isArray(s) ? s : (s && typeof s === 'object' ? Object.values(s).flat() : []));
  const txt = (s) => (typeof s === 'string' ? s : (s && s.text) || '');
  try { const gb = require(path.join(__dirname, '..', '..', 'test', 'gate-benchmark.js'));
    for (const c of ['benign', 'technical', 'borderline', 'pedagogical']) for (const s of toArr(gb.SAMPLES[c])) { const t = txt(s); if (t) out.push({ set: 'gb.' + c, t }); } } catch (e) { console.log('gb fail ' + e.message); }
  try { const ex = require(path.join(__dirname, '..', '..', 'test', 'gate-benchmark-extended.js'));
    for (const c of ['multilingual', 'longtext', 'mixed']) for (const s of toArr(ex.SAMPLES[c])) { const t = txt(s); if (t) out.push({ set: 'ext.' + c, t }); } } catch (e) { console.log('ext fail ' + e.message); }
  try { const vb = require(path.join(__dirname, '..', '..', 'test', 'vertical-benign-benchmark.js'));
    for (const l of Object.values(vb.CATEGORIES || {})) for (const s of l) { const t = txt(s); if (t) out.push({ set: 'vert', t }); } } catch (e) { console.log('vert fail ' + e.message); }
  try { const bm = require(path.join(__dirname, '..', '..', 'test', 'benign-mixed-benchmark.js'));
    for (const s of toArr(bm.SAMPLES)) { const t = txt(s); if (t) out.push({ set: 'mixed', t }); } } catch (e) { console.log('mixed fail ' + e.message); }
  return out;
}
const mine = loadMine();
const nonPassBySet = {};
for (const s of mine) {
  const r = gate.checkOutput(s.t);
  const a = r && r.gate ? r.gate.action : 'none';
  if (a !== 'pass' && a !== 'none') {
    nonPassBySet[s.set] = (nonPassBySet[s.set] || 0) + 1;
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    console.log('NONPASS set=' + s.set + ' dims=' + dims + ' len=' + s.t.length);
  }
}
console.log('MINE_TOTAL=' + mine.length);
console.log('MINE_NONPASS_BY_SET=' + JSON.stringify(nonPassBySet));
