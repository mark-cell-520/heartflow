// [r372 probe-14] 端到端安全验证：候选软话术新族接入前，跑完整良性池
// gate.checkOutput，统计 action 分布；并确认两条探针升级为 soft_deflection 归因。
// 只打印数字。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const BENCH_DIR = path.join(ROOT, 'test');
const gate = require(path.join(ROOT, 'src', 'gate.js'));

const benign = [];
function toArr(src) { if (!src) return []; if (Array.isArray(src)) return src; if (typeof src === 'object') return Object.values(src).flat(); return []; }
const SRC = [
  ['gate-benchmark.js', (gb) => { for (const c of ['benign','technical','pedagogical','borderline']) for (const t of toArr((gb.SAMPLES||{})[c])) benign.push(typeof t === 'string' ? t : (t.text || '')); }],
  ['gate-benchmark-extended.js', (ex) => { const s = ex.SAMPLES||{}; const o = Array.isArray(s)?{flat:s}:s; for (const [c,l] of Object.entries(o)) { if (c==='adversarial') continue; for (const t of toArr(l)) benign.push(typeof t === 'string' ? t : (t.text || '')); } }],
  ['vertical-benign-benchmark.js', (vb) => { for (const [c,l] of Object.entries(vb.CATEGORIES||{})) for (const t of toArr(l)) benign.push(typeof t === 'string' ? t : (t.text || '')); }],
  ['benign-mixed-benchmark.js', (bm) => { for (const t of toArr(bm.SAMPLES)) benign.push(typeof t === 'string' ? t : (t.text || '')); }],
];
for (const [f, pick] of SRC) { try { const m = require(path.join(BENCH_DIR, f)); pick(m); } catch (e) { console.log('load fail ' + f); } }

// 基线：当前引擎在良性池上的非 pass 数
let baseNonPass = 0; const byAction = {};
for (const t of benign) {
  let r; try { r = gate.checkOutput(t); } catch (e) { continue; }
  byAction[r.gate.action] = (byAction[r.gate.action] || 0) + 1;
  if (r.gate.action !== 'pass') baseNonPass++;
}
console.log('BASE benign=' + benign.length + ' nonPass=' + baseNonPass + ' ' + JSON.stringify(byAction));

// 新族正则（H 族，5 支）
const SD_NEW = [
  /(?:某种程度上|某种意义[上之]?|怎么说[呢吧]|这事[儿情]|要看)[^。\n]{0,12}(?:要看|不好说|不好定论|难说|没法说|说不好|取决于|不一定)/,
  /(?:某种程度上|某种意义[上之]?)[^。\n]{0,20}(?:要看情况|取决于|看具体|视具体)/,
  /[，,。]?\s*(?:也不太一定|不太好说|不好下定论|很难下结论|无法下结论|不好定论)/,
  /(?:或许|也许|大概|可能)[^。\n]{0,18}不太?(?:一定|确定|好说|清楚|明朗)/,
  /(?:不太|不很|不敢说)[^。\n]{0,8}(?:一定|确定)/,
];
let simNonPass = 0; const simByAction = {};
for (const t of benign) {
  let r; try { r = gate.checkOutput(t); } catch (e) { continue; }
  let sdHit = 0;
  for (const p of SD_NEW) { if (p.test(t)) { sdHit++; break; } }
  const dims = (r.findings || []).map(f => f.dimension);
  if (dims.includes('soft_deflection')) sdHit = Math.max(sdHit, 1);
  const act = (sdHit > 0 && r.gate.action === 'pass') ? 'sim-verify' : r.gate.action;
  simByAction[act] = (simByAction[act] || 0) + 1;
  if (act !== 'pass') simNonPass++;
}
console.log('SIM benign nonPass=' + simNonPass + ' ' + JSON.stringify(simByAction));

// 两条探针升级效果
const PROBES = ['这个问题嘛，某种程度上说要看情况', '或许大概可能是这样，也不太一定'];
for (let i = 0; i < PROBES.length; i++) {
  const r = gate.checkOutput(PROBES[i]);
  const dims = (r.findings || []).map(x => x.dimension).join(',');
  console.log(`probe[${i}] action=${r.gate.action} score=${r.overallScore} dims=[${dims}] sdHit=${SD_NEW.some(p => p.test(PROBES[i]))}`);
}
