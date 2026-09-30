// 第 289 轮 v2：抽象域 × 具象域跨域系词判据，误伤面实测
// 分界线假设：一侧是抽象情感/时间名词，另一侧是**具体物件名词**，
// 中间只有系词（是/就是/正是）→ LLM 伪深刻签名句式。
// 良性对照：「时间是有限的资源」（抽象×抽象）、「书是朋友送的」（具体×具体）
// 都不跨域，不命中。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');

const strictSamples = [];
const looseSamples = [];
function push(list, box) { for (const t of list) if (t && t.length > 4) box.push(t); }
try {
  const gb = require(path.join(ROOT, 'test/gate-benchmark.js'));
  push((gb.SAMPLES || {}).benign || [], strictSamples);
  push((gb.SAMPLES || {}).technical || [], strictSamples);
  push((gb.SAMPLES || {}).borderline || [], looseSamples);
  push((gb.SAMPLES || {}).pedagogical || [], looseSamples);
} catch (e) { console.log('WARN gb ' + e.message); }
try {
  const ex = require(path.join(ROOT, 'test/gate-benchmark-extended.js'));
  const s = ex.SAMPLES || {};
  push(s.multilingual || [], looseSamples);
  push(s.longtext || [], looseSamples);
  push(s.mixed || [], looseSamples);
} catch (e) { console.log('WARN ext ' + e.message); }
try {
  const vb = require(path.join(ROOT, 'test/vertical-benign-benchmark.js'));
  for (const k of Object.keys(vb.CATEGORIES || {})) push(vb.CATEGORIES[k], strictSamples);
} catch (e) { console.log('WARN vb ' + e.message); }
try {
  const bm = require(path.join(ROOT, 'test/benign-mixed-benchmark.js'));
  push(Array.isArray(bm.SAMPLES) ? bm.SAMPLES : Object.values(bm.SAMPLES).flat(), strictSamples);
} catch (e) { console.log('WARN bm ' + e.message); }
console.log(`严格组 ${strictSamples.length} 条 | 宽松组 ${looseSamples.length} 条`);

// ── 词表 ────────────────────────────────────────────────
const ABSTRACT = '孤独|寂寞|空虚|时间|生命|人生|成长|自由|爱情|感情|命运|遗憾|青春|梦想|理想|灵魂|存在|生活|人性|悲伤|痛苦|幸福|记忆|沉默|等待|选择|真相|希望|黑暗|光明|世界|温柔|勇气|关系|结局|开始|告别|距离|寂寞';
const CONCRETE = '暴政|回声|河流|镜子|牢笼|旅行|旅程|礼物|诅咒|诗篇|剧本|幻觉|潮汐|深渊|微光|漩涡|余烬|孤岛|桥梁|阶梯|迷宫|长河|沙漏|指针|茧|蝴蝶|种子|根|树|花|酒|茶|药|刀|锁|钥匙|影子|碎片|火焰|灰烬|门|窗|路|光|盐|糖|药|糖|刀|雨|风|雪|星|月|河|海|山|石头|镜子|钟|表|信|信|灯';

// ── 候选族 ──────────────────────────────────────────────
const CANDS = {
  // ① 抽象主语 × 系词 × 具象宾语（中间允许形容词/量词短语）
  link: new RegExp(`(?:${ABSTRACT})[^。，；]{0,12}(?:才|不过|本身|只|其实|最终|究竟|终究)?(?:就)?(?:也)?是[^。，；]{0,16}(?:${CONCRETE})`),
  // ② 「真正的X不是A，而是B」伪辩证（无因果词，PSEUDO_PHILOSOPHY_ZH 管不到）
  pseudo_dialectic: new RegExp(`真正的[^。，；]{1,8}[^。，]{0,20}不是[^。，；]{2,30}而是[^。，；]{2,30}`),
  // ③ 「X就是……的过程/答案」存在论收尾
  onto_ending: new RegExp(`(?:${ABSTRACT})[^。，；]{0,18}(?:就是|正是|才是)[^。，；]{0,20}(?:过程|答案|终点|起点|轮回|循环|宿命|全部|意义|本质)$`),
};

const ONTO = [
  '孤独是灵魂在喧嚣世界中为自己保留的最后一块静默之地。',
  '时间是最温柔的暴政，它在流逝中定义我们的存在。',
  '真正的自由不是想做什么就做什么，而是不想做什么就不做什么。',
  '生命是一场没有地图的旅行，每一步都是答案。',
  '成长就是一次又一次把自己打碎再拼起来的过程。',
];

for (const [name, re] of Object.entries(CANDS)) {
  let hit = 0; const hits = [];
  for (const t of ONTO) if (re.test(t)) { hit++; hits.push(t.slice(0, 16)); }
  let fpS = 0, fpL = 0; const fps = [];
  for (const t of strictSamples) if (re.test(t)) { fpS++; if (fps.length < 10) fps.push('[S]' + t.slice(0, 50)); }
  for (const t of looseSamples) if (re.test(t)) { fpL++; if (fps.length < 10) fps.push('[L]' + t.slice(0, 50)); }
  console.log(`\n[${name}] 命中 ${hit}/5  严格组误伤 ${fpS}  宽松组误伤 ${fpL}`);
  for (const h of hits) console.log('   HIT: ' + h);
  for (const f of fps) console.log('   FP:  ' + f);
}
