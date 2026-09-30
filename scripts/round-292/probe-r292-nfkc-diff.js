/**
 * r292 探针 3：真实语料 NFKC 差分测试（坐着实缺口）
 *
 * 上一轮（291）已坐实一类真缺口：
 *   gate() 直调 discriminate(原文) 命中 → 但 checkOutput() 经 runPipeline
 *   入口 NFKC 折叠全角标点后漏判。
 * 本轮做系统性扫描：把全部 benchmark 语料按 NFKC 变形后重跑 gate，
 *   看是否存在「原文非 pass / 变形后 pass」的分裂。
 *
 * 安全纪律：只输出维度名/分裂计数/语料键，不输出任何中文原文。
 */
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

const gateMod = require(path.join(ROOT, 'src/gate.js'));

// ── pipeline 入口的归一化逻辑（复刻 pipeline.js:71-75）──
function pipeNormalize(input) {
  if (typeof input !== 'string') return input;
  if (/[\u2018\u2019\u201C\u201D\uFF01-\uFF5E]/.test(input)) {
    return input.normalize('NFKC')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');
  }
  return input;
}

function toArray(src) {
  if (!src) return [];
  if (Array.isArray(src)) return src;
  if (typeof src === 'object') return Object.entries(src).flatMap(([k, v]) => (Array.isArray(v) ? v.map(x => ({ ...(typeof x === 'string' ? { text: x } : x), _cat: k })) : []));
  return [];
}
function textOf(s) { return typeof s === 'string' ? s : (s && s.text) || ''; }

const P = (...a) => console.log(...a);

// ─── 收集语料 ───
const corpora = [];
function loadCorpus(label, mod, pick) {
  try {
    const m = require(mod);
    const sets = pick(m);
    for (const [key, samples] of Object.entries(sets)) {
      corpora.push({ label: `${label}.${key}`, samples });
    }
  } catch (e) { P(`  (跳过 ${label}: ${e.message})`); }
}

loadCorpus('bench97', path.join(ROOT, 'test/gate-benchmark.js'), (m) => {
  const out = {};
  for (const cat of Object.keys(m.SAMPLES || {})) out[cat] = toArray(m.SAMPLES[cat]);
  return out;
});
loadCorpus('benchExt', path.join(ROOT, 'test/gate-benchmark-extended.js'), (m) => {
  const out = {};
  const s = m.SAMPLES || {};
  if (Array.isArray(s)) out.flat = s;
  else for (const [k, v] of Object.entries(s)) out[k] = toArray(v);
  return out;
});

P('══════ r292 探针 3：真实语料 NFKC 差分 ══════');
let totalSamples = 0;
for (const c of corpora) totalSamples += c.samples.filter(s => textOf(s)).length;
P(`语料集: ${corpora.length} 个  样本总数: ${totalSamples}\n`);

// ─── 差分测试 ───
let splitTotal = 0;
const splits = [];
for (const c of corpora) {
  const list = c.samples.map(s => ({ text: textOf(s), cat: s._cat || null, orig: s })).filter(x => x.text);
  const res = { both_flagged: 0, both_pass: 0, newly_flagged: 0, newly_dropped: 0, dropped: [] };
  for (const x of list) {
    const norm = pipeNormalize(x.text);
    if (norm === x.text) {
      // 不含可折叠字符 → 两种路径等价，统计进 both
      const r1 = gateMod.gate(x.text);
      (r1.gate.action !== 'pass') ? res.both_flagged++ : res.both_pass++;
      continue;
    }
    let a1, a2, d1;
    try { const r1 = gateMod.gate(x.text); a1 = r1.gate.action; d1 = collectDims(r1); } catch (_) { a1 = 'ERROR'; d1 = []; }
    try { const r2 = gateMod.gate(norm); a2 = r2.gate.action; } catch (_) { a2 = 'ERROR'; }
    const f1 = a1 !== 'pass', f2 = a2 !== 'pass';
    if (f1 && !f2) { res.newly_dropped++; res.dropped.push({ dims: d1, action: a1 }); }
    else if (!f1 && f2) { res.newly_flagged++; }
    else if (f1 && f2) res.both_flagged++;
    else res.both_pass++;
  }
  splitTotal += res.newly_dropped + res.newly_flagged;
  P(`── ${c.label} ──`);
  P(`  两者均非pass: ${res.both_flagged}  两者均pass: ${res.both_pass}`);
  P(`  【原文拦/变形后放】漏判分裂: ${res.newly_dropped}   【原文放/变形后拦】新增拦截: ${res.newly_flagged}`);
  if (res.dropped.length) {
    const byDim = {};
    for (const d of res.dropped) for (const dm of d.dims) byDim[dm] = (byDim[dm] || 0) + 1;
    P(`    漏判分裂维度: ${JSON.stringify(byDim)}`);
    for (const d of res.dropped.slice(0, 5)) P(`    症状: 维度命中 ${d.dims.join('/')} → 折叠后 action=${d.action}→pass`);
  }
}
P(`\n合计分裂: ${splitTotal}`);

function collectDims(r) {
  const out = new Set();
  if (r && Array.isArray(r.trace)) for (const t of r.trace) if (t && t.dimension && t.dimension !== '_normalization') out.add(t.dimension);
  if (r && Array.isArray(r.findings)) for (const f of r.findings) if (f && f.dimension) out.add(f.dimension);
  return [...out];
}
