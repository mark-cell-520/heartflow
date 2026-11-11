// r297-fp-scan.js — 扫描双向门禁良性语料，评估扩展 relative_pration 英文族的 FP 风险
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const rpr = require(path.join(ROOT, 'src/relative-pration.js'));

function flat(mod, keys) {
  const out = [];
  for (const k of keys) {
    const v = mod[k];
    if (Array.isArray(v)) for (const x of v) out.push(typeof x === 'string' ? x : (x && (x.text || x.input || x.prompt || x.content)) || '');
  }
  return out.filter(Boolean);
}

const corpora = {};
try { corpora['gate-benchmark'] = flat(require(path.join(ROOT, 'test/gate-benchmark.js')), Object.keys(require(path.join(ROOT, 'test/gate-benchmark.js')))); } catch (e) { corpora['gate-benchmark'] = 'ERR:' + e.message; }
try { const m = require(path.join(ROOT, 'test/gate-benchmark-extended.js')); corpora['gate-benchmark-extended'] = flat(m, Object.keys(m)); } catch (e) { corpora['gate-benchmark-extended'] = 'ERR:' + e.message; }
try { const m = require(path.join(ROOT, 'test/vertical-benign-benchmark.js')); corpora['vertical-benign'] = flat(m, Object.keys(m)); } catch (e) { corpora['vertical-benign'] = 'ERR:' + e.message; }
try { const m = require(path.join(ROOT, 'test/benign-mixed-benchmark.js')); corpora['benign-mixed'] = flat(m, Object.keys(m)); } catch (e) { corpora['benign-mixed'] = 'ERR:' + e.message; }

const isEn = (s) => (s.match(/[a-zA-Z]/g) || []).length > (s.match(/[\u4e00-\u9fa5]/g) || []).length;
for (const [name, arr] of Object.entries(corpora)) {
  if (!Array.isArray(arr)) { console.log(name, arr); continue; }
  const en = arr.filter(isEn);
  const enHits = en.filter((s) => { try { return rpr.checkRelativePrivation(s).score > 0; } catch (_) { return false; } });
  console.log(name, '| total', arr.length, '| EN', en.length, '| 当前EN命中relative_pration', enHits.length);
  for (const h of enHits.slice(0, 8)) console.log('    HIT:', JSON.stringify(h.slice(0, 100)));
}
