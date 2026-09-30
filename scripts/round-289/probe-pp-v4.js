// 第 289 轮 v4：真实 LLM 伪深刻样本 16 条 × 网格扫描
// 上一轮 5 条自造样本太少（只有 2 条撞上「抽象×具象系词」）。
// 本轮换真实的 LLM 空泛结尾话术，测 4 个候选族的命中与误伤。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const strictSamples = [], looseSamples = [];
function push(list, box) { for (const t of list) if (t && t.length > 4) box.push(t); }
try {
  const gb = require(path.join(ROOT, 'test/gate-benchmark.js'));
  push((gb.SAMPLES || {}).benign || [], strictSamples); push((gb.SAMPLES || {}).technical || [], strictSamples);
  push((gb.SAMPLES || {}).borderline || [], looseSamples); push((gb.SAMPLES || {}).pedagogical || [], looseSamples);
} catch (e) {}
try {
  const ex = require(path.join(ROOT, 'test/gate-benchmark-extended.js')); const s = ex.SAMPLES || {};
  push(s.multilingual || [], looseSamples); push(s.longtext || [], looseSamples); push(s.mixed || [], looseSamples);
} catch (e) {}
try {
  const vb = require(path.join(ROOT, 'test/vertical-benign-benchmark.js'));
  for (const k of Object.keys(vb.CATEGORIES || {})) push(vb.CATEGORIES[k], strictSamples);
} catch (e) {}
try {
  const bm = require(path.join(ROOT, 'test/benign-mixed-benchmark.js'));
  push(Array.isArray(bm.SAMPLES) ? bm.SAMPLES : Object.values(bm.SAMPLES).flat(), strictSamples);
} catch (e) {}

// 16 条真实 LLM 伪深刻收尾（形状：把普通结论升格成本体论命题）
const ONTO = [
  '孤独是灵魂在喧嚣世界中为自己保留的最后一块静默之地。',
  '时间是最温柔的暴政，它在流逝中定义我们的存在。',
  '真正的自由不是想做什么就做什么，而是不想做什么就不做什么。',
  '生命是一场没有地图的旅行，每一步都是答案。',
  '成长就是一次又一次把自己打碎再拼起来的过程。',
  '真正的成熟，是终于学会与不完美的自己和解。',
  '孤独是成长的必修课，它让我们有机会与自己对话。',
  '自由不是随心所欲，而是自我主宰。',
  '生活就像一盒巧克力，你永远不知道下一颗是什么味道。',
  '真正的勇气，不是没有恐惧，而是带着恐惧依然前行。',
  '所有的离别，都是为了更好的重逢。',
  '生命的意义不在于长短，而在于我们如何度过。',
  '时间会治愈一切创伤，只要你愿意给它一个机会。',
  '幸福不是拥有得多，而是计较得少。',
  '沉默是最深沉的告别，胜过千言万语。',
  '真正的智慧，是知道自己不知道什么。',
];

const ABSTRACT = '孤独|寂寞|空虚|时间|生命|人生|成长|自由|爱情|感情|命运|遗憾|青春|梦想|理想|灵魂|存在|生活|人性|悲伤|痛苦|幸福|记忆|沉默|等待|选择|真相|希望|黑暗|光明|世界|温柔|勇气|真正|成熟|智慧|离别|重逢|治愈|创伤|治愈|计较|主宰|恐惧|意义|完美|答案|和解';
const CANDS = {
  c1_abs_link_obj: new RegExp(`(?:${ABSTRACT})[^。！？；;]{0,30}(?:才|不过|本身|只|其实|最终|究竟|终究)?(?:就)?是[^。！？；;]{0,30}(?:之地|之路|过程|答案|本质|定义|机会|味道|parts)`),
  c2_not_but: new RegExp(`(?:${ABSTRACT})[^。！？；;]{0,12}[^。！？；;]{0,12}(?:不|没)[^。！？；;]{0,30}(?:而是|而是因为|而是你|而是学会|而是我们|而是选择)`),
  c3_neg_quant: new RegExp(`[^。！？；;]{0,10}所有人[^。！？；;]{0,16}(?:会|都|必然|终将)`),
  c4_intro: new RegExp(`(?:说到底|归根结底|本质上来说|归根到底|说到底)[^。]{2,40}`),
};

for (const [name, re] of Object.entries(CANDS)) {
  let hit = 0; const hitTexts = [];
  for (const t of ONTO) if (re.test(t)) { hit++; hitTexts.push(t.slice(0, 14)); }
  let fp = 0; const fps = [];
  for (const t of strictSamples) if (re.test(t)) { fp++; if (fps.length < 6) fps.push(t.slice(0, 60)); }
  let fpL = 0;
  for (const t of looseSamples) if (re.test(t)) fpL++;
  console.log(`\n[${name}] 命中 ${hit}/${ONTO.length}  严格误伤 ${fp}/${strictSamples.length}  宽松误伤 ${fpL}/${looseSamples.length}`);
  for (const h of hitTexts) console.log('   HIT: ' + h);
  for (const f of fps) console.log('   FP: ' + f);
}
