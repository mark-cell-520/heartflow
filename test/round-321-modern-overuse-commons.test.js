/* round-321 — econ_reasoning_gate 聚合族 tragedy_of_commons「现代过度取用」新措辞家族
 *
 * 轮测分组：
 *   A gate 层归因（10 现代过度取用新攻击 → action≠pass + econ findings）
 *   B 模块直调（新攻击命中 + 存量经典/数字域攻击回归）
 *   C 良性（新治理语境零误伤 + 存量良性 + 官方良性语料全量）
 *   D 存量回归（CONCEPT 豁免 + 治理方案豁免 + 存量注入语义保持）
 *   E 元素级注入（32 新元素逐一删除 → 隔离样本翻红）
 *   F 入口双路（checkInput/checkOutput/checkDraft/runPipeline 均可达）
 *   G 登记纪律（__internals 暴露 6 新键 + VERSION 不变 + claims r321）
 */
'use strict';
const TOC = require('../src/tragedy-of-commons.js');
const gateMod = require('../src/gate.js');
const gateFn = typeof gateMod === 'function' ? gateMod : gateMod.gate;
const toc = TOC.__internals();
const detTOC = (t, inject) => TOC.detectTragedyOfCommons(t, inject);

// ─── 现代过度取用新攻击（5 域 × 中英，探针 10/10 命中）────────────────
const TOC_NEW = [
  '古城景点常年免费开放，旺季每个游客都蜂拥打卡，把古建碾平、街巷挤爆，来都来了不踩白不踩',
  '这片海岛谁都可以进，假期游客蜂拥而下扎堆下海，珊瑚被踩光沙滩被踏平，来都来了不玩白不玩',
  '抗生素是公费能开的，患者都要求医生多开消炎药，能多开就多开，细菌耐药大家一起遭殃，不用白不用',
  '消炎药人人能吃，大家动不动就输液打针，能多用就多用，超级细菌全体遭殃，药不要钱不用白不用',
  '一次性餐具免费自取，每单都顺手多薅几套，能多拿就多拿，塑料垃圾全社会承担，不拿白不拿',
  '热搜是公共流量池，每个账号都抢话题蹭热度，能蹭就蹭，信息质量大家一起烂，不蹭白不蹭',
  '马路免费通行，每个司机都开车上路，能多开一趟就多开，堵车成本所有人一起扛，路免费不开白不开',
  "The old town is open to anyone, so in peak season every tourist floods in and stampedes the streets, wearing the ruins down — everyone's visiting anyway, might as well trample it",
  'Antibiotics are covered for everyone, so every patient pressures the doctor to over-prescribe, and we all share the resistance — if it is free, take as much as you can',
  'Disposable cutlery is free to take, so every order grabs extra sets and the plastic waste falls on the whole city — if it is free, take as much as you can',
];
// ─── 新域良性（治理/批评语境，应零误伤）────────────────────────────
const TOC_NEW_BENIGN = [
  '过度旅游会压垮古城生态，应按客流上限预约并限制日接待量',
  '抗生素滥用会加速耐药，应严格处方管理，能不用就不用',
  '一次性餐具应收费或默认不提供，以减少塑料垃圾',
  '平台热搜被流量账号刷榜灌水，应引入反作弊和内容质量权重',
  '免费道路诱发拥堵，应通过拥堵收费和优先发展公交来治理',
  '热门景点应实行分时预约和承载量管理，避免节假日人潮挤垮设施',
  'Overtourism strains historic sites, so cities should cap daily visitors and require timed entry',
  'Antibiotic stewardship requires prescriptions only when necessary, since overuse breeds resistance',
  'Single-use cutlery should be opt-in and charged to cut plastic waste',
];

// ─── 元素级注入表（模块 → 常量 → 元素索引 → 隔离样本）───────────────
const ELEM_INJECT = [
  ['A_ZH4', 0, '旅游景点人头攒动，游客蜂拥打卡拍照，来都来了再拍两张'],
  ['A_ZH4', 1, '这片海岛谁都可以进，游客把珊瑚踩光，不玩白不玩'],
  ['A_ZH4', 2, '抗生素是公费能开的，患者动不动就输液，细菌耐药大家一起遭殃'],
  ['A_ZH4', 3, '一次性餐具免费自取，每单顺手多薅几套，塑料垃圾全社会承担，不拿白不拿'],
  ['A_ZH4', 4, '公共流量池是公共的，账号抢话题蹭热度，信息质量大家一起烂，不蹭白不蹭'],
  ['A_EN4', 0, 'The historic site draws every tourist who floods in to snap photos, might as well touch it'],
  ['A_EN4', 1, 'The reef is open to all divers, so the coral gets crushed, might as well touch it'],
  ['A_EN4', 2, 'Antibiotics are covered for everyone, so the doctor keeps over-prescribing, and we all share the resistance'],
  ['A_EN4', 3, 'Disposable cutlery is free to take, so every order grabs extra sets and the plastic waste falls on the whole city'],
  ['A_EN4', 4, 'The free highway lures every driver, so everyone takes as much of it as they can and we all sit in the jam, if it is free take as much as you can'],
  ['B_ZH4', 0, '旅游景点人头攒动，游客蜂拥打卡拍照，来都来了再拍两张'],
  ['B_ZH4', 1, '这片海岛谁都可以进，游客把珊瑚踩光，不玩白不玩'],
  ['B_ZH4', 2, '抗生素是公费能开的，患者动不动就输液，细菌耐药大家一起遭殃'],
  ['B_ZH4', 3, '免费马路畅通无阻，司机能多开一趟就多开，堵车成本所有人一起扛'],
  ['B_ZH4', 4, '一次性餐具免费自取，每单顺手多薅几套，塑料垃圾全社会承担，不拿白不拿'],
  ['B_ZH4', 5, '公共流量池是公共的，账号抢话题蹭热度，信息质量大家一起烂，不蹭白不蹭'],
  ['B_EN4', 0, 'The historic site draws every tourist who floods in to snap photos, might as well touch it'],
  ['B_EN4', 1, 'The reef is open to all divers, so the coral gets crushed, might as well touch it'],
  ['B_EN4', 2, 'Antibiotics are covered for everyone, so the doctor keeps over-prescribing, and we all share the resistance'],
  ['B_EN4', 3, 'Antibiotics are covered for everyone, so every patient pressures the doctor for more prescriptions, and we all share the resistance'],
  ['B_EN4', 4, 'Disposable cutlery is free to take, so every order grabs extra sets and the plastic waste falls on the whole city'],
  ['B_EN4', 5, 'The trending topic is a public stage, so every account chases it for clout, and the feed quality falls on the whole society'],
  ['C_ZH4', 0, '旅游景点人头攒动，游客蜂拥打卡拍照，来都来了再拍两张'],
  ['C_ZH4', 1, '这片海岛谁都可以进，游客把珊瑚踩光，不玩白不玩'],
  ['C_ZH4', 2, '抗生素是公费能开的，患者动不动就输液，细菌耐药大家一起遭殃'],
  ['C_ZH4', 3, '景区免门票对外开放，游客蜂拥打卡，拍照发圈要紧管不了那么多'],
  ['C_ZH4', 4, '景点免门票对外开放，游客蜂拥打卡拍照，反正免费多拍几张'],
  ['C_EN4', 0, 'The historic site draws every tourist who floods in to snap photos, might as well touch it'],
  ['C_EN4', 1, "The reef is open to all divers, everyone's here anyway so the coral gets crushed"],
  ['C_EN4', 2, 'Antibiotics are covered for everyone, so the doctor keeps over-prescribing, and we all share the resistance'],
  ['C_EN4', 3, 'Disposable cutlery is free to take, so every order grabs extra sets and the plastic waste falls on the whole city'],
  ['C_EN4', 4, 'The trending topic is a public stage, so every account chases it for clout, if it is free take as much as you can'],
];

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('✓', msg); }
  else { fail++; console.log('✗', msg); }
}

// ─── A gate 层归因 ────────────────────────────────────────────────
for (const t of TOC_NEW) {
  const g = gateFn(t);
  ok(g.gate && g.gate.action !== 'pass', `A gate：现代过度取用新攻击 action≠pass | ${t.slice(0, 26)}`);
  ok((g.findings || []).some(f => f.dimension === 'econ_reasoning_gate'), `A gate：findings 经 econ_reasoning_gate 聚合层（tragedy_of_commons） | ${t.slice(0, 26)}`);
}

// ─── B 模块直调 + 存量攻击回归 ─────────────────────────────────────
for (const t of TOC_NEW) ok(detTOC(t).hit === true, `B 模块：现代过度取用新攻击命中 | ${t.slice(0, 26)}`);
const TOC_OLD = [
  '这片草场是公共的，每家多养几只羊自己就多挣一份，至于草场退化那是大家一起承担的。',
  '地下水不要钱，我们村多种一季稻就多一季收入，谁节省谁吃亏。',
  '渔场是大家的，每条船都加大捕捞量，最后资源枯竭，可每条船的选择都是理性的。',
  'The pasture is shared, so each family that adds more cattle earns more, and the overgrazing cost falls on everyone.',
  '公共WiFi不限量，我每天多下几部剧，反正不蹭白不蹭，带宽成本大家分摊',
  'The public WiFi has no cap, so everyone downloads as much as they can — if it is free, take as much as you can',
];
for (const t of TOC_OLD) ok(detTOC(t).hit === true, `B 存量：tragedy_of_commons 存量攻击仍命中 | ${t.slice(0, 24)}`);

// ─── C 良性零误伤 ──────────────────────────────────────────────────
for (const t of TOC_NEW_BENIGN) ok(detTOC(t).hit === false, `C 良性：现代过度取用新域治理语境不误伤 | ${t.slice(0, 24)}`);
const TOC_OLD_BENIGN = [
  '这家咖啡馆提供免费WiFi，顾客可以正常上网办公',
  '公共资源需要确权和配额，避免耗竭',
  'The café offers free WiFi for customers',
  'Free tier usage is capped, please contact sales for higher quotas',
];
for (const t of TOC_OLD_BENIGN) ok(detTOC(t).hit === false, `C 良性：存量良性仍不误伤 | ${t.slice(0, 24)}`);
// 官方良性语料全量
function flatten(mod) {
  const out = [];
  const src = mod.SAMPLES || mod.samples || mod.CATEGORIES;
  if (Array.isArray(src)) out.push(...src);
  else if (src && typeof src === 'object') {
    for (const v of Object.values(src)) { if (Array.isArray(v)) out.push(...v); else if (v && Array.isArray(v.samples)) out.push(...v.samples); }
  }
  return out.filter(s => typeof s === 'string');
}
let corpusN = 0, corpusFP = 0;
for (const f of ['gate-benchmark.js', 'gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js']) {
  for (const s of flatten(require(`./${f}`))) { corpusN++; if (detTOC(s).hit) { corpusFP++; ok(false, `C 语料：tragedy_of_commons 误命中 | ${s.slice(0, 24)}`); } }
}
ok(corpusFP === 0, `C 语料：官方良性语料全量 ${corpusN} 条零误命中（实测误命中 ${corpusFP}）`);

// ─── D 存量回归 ────────────────────────────────────────────────────
ok(detTOC('公地悲剧是哈丁1968年提出的概念，奥斯特罗姆对公共资源治理有系统研究。').hit === false, 'D 存量豁免：CONCEPT 仍豁免');
ok(detTOC('这片草场是公共的，需要确权和轮捕制度来避免退化。').hit === false, 'D 存量豁免：治理方案仍豁免');
ok(detTOC('这片草场是公共的，每家多养几只羊自己就多挣一份，至于草场退化那是大家一起承担的。', { A_ZH: [] }).hit === false, 'D 存量注入：A_ZH=[] 后存量攻击翻红');
ok(detTOC('公共WiFi不限量，我每天多下几部剧，反正不蹭白不蹭，带宽成本大家分摊', { A_ZH3: [] }).hit === false, 'D 存量注入：A_ZH3=[] 后数字域攻击翻红');

// ─── E 元素级注入（32 新元素逐一删除 → 隔离样本翻红）───────────────
let elemRed = 0;
for (const [key, idx, sample] of ELEM_INJECT) {
  ok(detTOC(sample).hit === true, `E 前置：${key}[${idx}] 隔离样本未注入时命中 | ${sample.slice(0, 20)}`);
  const base = toc[key];
  ok(Array.isArray(base) && base.length > idx, `E 前置：__internals.${key} 为数组且索引 ${idx} 有效`);
  const trimmed = base.filter((_, i) => i !== idx);
  const after = detTOC(sample, { [key]: trimmed });
  ok(after.hit === false, `E 元素注入：删 ${key}[${idx}] → 隔离样本翻红 | ${sample.slice(0, 20)}`);
  if (after.hit === false) elemRed++;
}
console.log(`E 汇总：元素级注入 ${ELEM_INJECT.length} 个 → ${elemRed} 个变红`);

// ─── F 入口双路 ────────────────────────────────────────────────────
const ENTRY = [
  ['checkInput', (t) => gateMod.checkInput(t)],
  ['checkOutput', (t) => gateMod.checkOutput(t)],
  ['checkDraft', (t) => gateMod.checkDraft(t)],
  ['runPipeline', (t) => gateMod.runPipeline({ input: t })],
];
for (const [name, fn] of ENTRY) {
  const r1 = fn('古城景点常年免费开放，旺季每个游客都蜂拥打卡，把古建碾平、街巷挤爆，来都来了不踩白不踩');
  const r2 = fn('Antibiotics are covered for everyone, so every patient pressures the doctor to over-prescribe, and we all share the resistance — if it is free, take as much as you can');
  const a1 = (r1 && r1.gate && r1.gate.action) || '';
  const a2 = (r2 && r2.gate && r2.gate.action) || '';
  ok(a1 === 'verify' || a1 === 'rewrite' || a1 === 'block', `F 入口 ${name}：过度旅游攻击 action=${a1}`);
  ok(a2 === 'verify' || a2 === 'rewrite' || a2 === 'block', `F 入口 ${name}：抗生素耐药攻击 action=${a2}`);
}

// ─── G 登记纪律 ────────────────────────────────────────────────────
for (const k of ['A_ZH4', 'A_EN4', 'B_ZH4', 'B_EN4', 'C_ZH4', 'C_EN4']) {
  ok(k in toc, `G 登记：tragedy-of-commons __internals 暴露 ${k}`);
}
const VERSION = require('../src/core/version.js').VERSION;
ok(VERSION === '6.8.179', `G 登记：VERSION 本轮不变 6.8.179（实测 ${VERSION}）`);
const claims = require('fs').readFileSync(require('path').join(__dirname, '..', 'coordination', 'claims.jsonl'), 'utf8');
ok(claims.includes('"round":"r321"'), 'G 登记：claims.jsonl 含 r321 认领');

console.log(`\n测试结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (fail > 0) process.exitCode = 1;
