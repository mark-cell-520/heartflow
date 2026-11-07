/**
 * r249-benign-corpus-probe.js — 在官方良性语料上预演 B 候选（计数-比率混淆）
 * 语料来源（按 bidirectional-guard.js 的加载方式）：
 *   test/gate-benchmark.js SAMPLES（benign/technical/pedagogical/borderline）
 *   test/gate-benchmark-extended.js（extended 各类）
 *   test/vertical-benign-benchmark.js CATEGORIES（垂直场景 150）
 *   test/benign-mixed-benchmark.js（中英混排 25）
 */
const path = require('path');
const hf = require('/data/home/heartflow/src/gate.js');
const ROOT = '/data/home/heartflow';

// ── 判据原型 ──
const QTY_ZH = /(?:最多|第一|首位|居首|名列前茅|遥遥领先|两倍|三倍|四倍|五倍|六倍|七八倍|翻倍|翻番|多[一二两三四五六七八九十]成|高于|多于|超过|远超)/;
const NOUN_ZH = /(?:病例|确诊|感染|事故|投诉|伤亡|故障|挂科|获奖|单量|销量|中标|死亡|差评|退单|报修|工单|起数|患病人数|感染人数|死亡人数|受伤人数|伤亡人数|投诉量|获奖数|订单量|出货量)/;
const VERDICT_ZH = /(?:更危险|最不安全|不安全|更差|最差|最烂|更糟|最糟|更强|更好|最好|更野|水平高|水平低|技术差|技术好|防疫|教育|服务|味道|质量|更厉害|更能干|更专业|更可靠|更不可靠|更安全|更弱|技不如人|更优秀|更差劲|更菜|更牛|更稳|出问题|有问题|靠不住|不放心)/;

const QTY_EN = /\b(?:most|the most|highest|number one|first place|twice|three times|four times|five times|six times|double|triple|\d+% more|\d+ percent more|more than|higher than|exceeds|exceeding)\b/i;
const NOUN_EN = /\b(?:cases|infections|accidents|complaints|casualties|failures|deaths|crashes|prizes|orders|sales|faults|tickets|incidents|awards|wins|refunds|returns|lawsuits)\b/i;
const VERDICT_EN = /\b(?:more dangerous|the most dangerous|unsafe|worse|the worst|stronger|better|the best|more reckless|higher quality|lower quality|better tasting|more skilled|more professional|more reliable|less reliable|safer|weaker|more capable|more competent|better run|poorer)\b/i;

const CORRECTIVE_ZH = /(?:率|人均|按人口|除以|折算|发病率|死亡率|投诉率|获奖率|挂科率|事故率|发生率|命中率|转化率|比率|比例|占比|每万人|每千人|每十万|同口径|可比口径|量级|基数|规模|考生|用户数|客流|工时|里程|暴露|分母|归一|平均到|不等于|不可比|不能直接比|要折算|换算成|分子分母|绝对数|原始计数|统计口径|口径)/;
const CORRECTIVE_EN = /\b(?:per capita|per person|per head|rate|incidence|ratio|percentage|normalise|normalize|normalised|normalized|divided by|adjust(?:ed|ing)? for|controlling for|per ten thousand|per million|population|cohort|candidates|foot traffic|mileage|exposure|denominator|not comparable|comparable only|raw count|absolute count|count versus rate|count vs rate)\b/i;

function matches(text, re) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = [];
  let m;
  while ((m = g.exec(text)) !== null) { out.push([m.index, m.index + m[0].length]); if (m.index === g.lastIndex) g.lastIndex++; }
  return out;
}
function pairNear(text, a, b, win) {
  const am = matches(text, a), bm = matches(text, b);
  for (const [as, ae] of am) for (const [bs, be] of bm) {
    const d = as < be && bs < ae ? 0 : Math.max(as, bs) - Math.min(ae, be);
    if (d <= win) return true;
  }
  return false;
}
function protoHit(text) {
  if (!text || typeof text !== 'string') return false;
  if (CORRECTIVE_ZH.test(text) || CORRECTIVE_EN.test(text)) return false;
  if (pairNear(text, NOUN_ZH, QTY_ZH, 14) && pairNear(text, NOUN_ZH, VERDICT_ZH, 40)) return true;
  if (pairNear(text, NOUN_EN, QTY_EN, 40) && pairNear(text, NOUN_EN, VERDICT_EN, 90)) return true;
  return false;
}

// ── 收集良性语料 ──
const corpora = [];
function push(name, t) { if (typeof t === 'string' && t.trim()) corpora.push({ src: name, text: t }); }

const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
for (const [cat, arr] of Object.entries(gb.SAMPLES || {})) {
  if (!Array.isArray(arr)) continue;
  for (const it of arr) {
    if (typeof it === 'string') push(`gb:${cat}`, it);
    else if (it && typeof it === 'object') push(`gb:${cat}`, it.text || it.sample || it.input || it.prompt || it.content);
  }
}
console.log(`gate-benchmark 累计 ${corpora.length}`);

const ext = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
for (const [k, v] of Object.entries(ext)) {
  if (Array.isArray(v)) for (const it of v) {
    if (typeof it === 'string') push(`ext:${k}`, it);
    else if (it && typeof it === 'object') push(`ext:${k}`, it.text || it.sample || it.input || it.prompt || it.content);
  }
}
console.log(`+extended 累计 ${corpora.length}`);

const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
for (const [cat, arr] of Object.entries(vb.CATEGORIES || {})) {
  if (!Array.isArray(arr)) continue;
  for (const it of arr) {
    if (typeof it === 'string') push(`vert:${cat}`, it);
    else if (it && typeof it === 'object') push(`vert:${cat}`, it.text || it.sample || it.input || it.prompt || it.content);
  }
}
console.log(`+vertical 累计 ${corpora.length}`);

const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
for (const [k, v] of Object.entries(bm)) {
  if (Array.isArray(v)) for (const it of v) {
    if (typeof it === 'string') push(`mixed:${k}`, it);
    else if (it && typeof it === 'object') push(`mixed:${k}`, it.text || it.sample || it.input || it.prompt || it.content);
  }
}
console.log(`+mixed 累计 ${corpora.length}`);

console.log(`\n合计良性语料 ${corpora.length} 条`);
let hits = 0;
for (const c of corpora) {
  const proto = protoHit(c.text);
  let r = null;
  try { r = hf.gate(c.text); } catch (e) { /* ignore */ }
  const dims = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
  if (proto) {
    hits++;
    console.log(`  [PROTO-HIT] (${c.src}) ${c.text.slice(0, 80)}`);
    console.log(`       gate.action=${r ? (r.gate && r.gate.action) || r.action : '?'} existing_dims=[${dims.join(',')}]`);
  }
}
console.log(`\n原型判据命中：${hits}/${corpora.length}`);
