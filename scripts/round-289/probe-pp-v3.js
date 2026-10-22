// 第 289 轮 v3：按「系词前跨度 / 系词后跨度」网格扫描，取 0 误伤下的最大命中
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const strictSamples = [], looseSamples = [];
function push(list, box) { for (const t of list) if (t && t.length > 4) box.push(t); }
try {
  const gb = require(path.join(ROOT, 'test/gate-benchmark.js'));
  push((gb.SAMPLES || {}).benign || [], strictSamples); push((gb.SAMPLES || {}).technical || [], strictSamples);
  push((gb.SAMPLES || {}).borderline || [], looseSamples); push((gb.SAMPLES || {}).pedagogical || [], looseSamples);
  const ex = require(path.join(ROOT, 'test/gate-benchmark-extended.js')); const s = ex.SAMPLES || {};
  push(s.multilingual || [], looseSamples); push(s.longtext || [], looseSamples); push(s.mixed || [], looseSamples);
} catch (e) { console.log('WARN ' + e.message); }
try { const vb = require(path.join(ROOT, 'test/vertical-benign-benchmark.js'));
  for (const k of Object.keys(vb.CATEGORIES || {})) push(vb.CATEGORIES[k], strictSamples);
} catch (e) {}
try { const bm = require(path.join(ROOT, 'test/benign-mixed-benchmark.js'));
  push(Array.isArray(bm.SAMPLES) ? bm.SAMPLES : Object.values(bm.SAMPLES).flat(), strictSamples);
} catch (e) {}

const ABSTRACT = '孤独|寂寞|空虚|时间|生命|人生|成长|自由|爱情|感情|命运|遗憾|青春|梦想|理想|灵魂|存在|生活|人性|悲伤|痛苦|幸福|记忆|沉默|等待|选择|真相|希望|黑暗|光明|世界|温柔|勇气|结局|开始|告别|距离|成熟|包容|理解';
const CONCRETE = '暴政|回声|河流|镜子|牢笼|旅行|旅程|礼物|诅咒|诗篇|剧本|幻觉|潮汐|深渊|微光|漩涡|余烬|孤岛|桥梁|阶梯|迷宫|长河|沙漏|指针|茧|蝴蝶|种子|花|酒|茶|药|刀|锁|钥匙|影子|碎片|火焰|灰烬|门|窗|路|光|盐|雨|风|雪|星|月|河|海|山|石头|钟|信|灯';

const ONTO = [
  '孤独是灵魂在喧嚣世界中为自己保留的最后一块静默之地。',
  '时间是最温柔的暴政，它在流逝中定义我们的存在。',
  '真正的自由不是想做什么就做什么，而是不想做什么就不做什么。',
  '生命是一场没有地图的旅行，每一步都是答案。',
  '成长就是一次又一次把自己打碎再拼起来的过程。',
];

// 族①：抽象主语 … 系词 … 具象宾语
console.log('── 族① ABSTRACT … 系词 … CONCRETE ──');
for (const pre of [12, 20, 30, 40]) {
  for (const post of [16, 24, 32, 40]) {
    const re = new RegExp(`(?:${ABSTRACT})[^。！？；;]{0,${pre}}(?:才|不过|本身|只|其实|最终|究竟|终究|就|也|仅仅|不过是|本身就是)?是[^。！？；;]{0,${post}}(?:${CONCRETE})`);
    let hit = 0; for (const t of ONTO) if (re.test(t)) hit++;
    let fp = 0; for (const t of strictSamples) if (re.test(t)) fp++;
    let fpL = 0; for (const t of looseSamples) if (re.test(t)) fpL++;
    console.log(`pre=${pre} post=${post} → 命中 ${hit}/5  严格误伤 ${fp}  宽松误伤 ${fpL}`);
  }
}

// 族②：「…就是…的过程/答案/本质」存在论收尾
console.log('\n── 族② ABSTRACT … 就是 … 过程/答案/本质 ──');
for (const mid of [14, 22, 30, 40]) {
  const re = new RegExp(`(?:${ABSTRACT})[^。！？；;]{0,${mid}}(?:就是|正是|才是|不外乎)[^。！？；;]{0,30}(?:的过程|的答案|的本质|的轮回|的循环|的宿命|的意义|的真相|的全部)$`);
  let hit = 0; for (const t of ONTO) if (re.test(t)) hit++;
  let fp = 0; for (const t of strictSamples) if (re.test(t)) fp++;
  let fpL = 0; for (const t of looseSamples) if (re.test(t)) fpL++;
  console.log(`mid=${mid} → 命中 ${hit}/5  严格误伤 ${fp}  宽松误伤 ${fpL}`);
}
