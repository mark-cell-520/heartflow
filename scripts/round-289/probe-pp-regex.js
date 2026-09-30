// 第 289 轮：本体论比喻族判据候选正则的误伤面实测
// 在 326 条良性样本（bidirectional-guard 同源）上跑候选正则，
// 目标是「攻击族命中 ≥4/5，误伤 = 0」。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');

// ── 从 bidirectional-guard 同源收集良性样本（不复用其 require，直接取文本）──
const benign = [];
function pushArr(list) { for (const t of list) if (t && t.length > 6) benign.push(t); }
try {
  const gb = require(path.join(ROOT, 'test/gate-benchmark.js'));
  for (const cat of ['benign', 'technical', 'pedagogical', 'borderline']) pushArr((gb.SAMPLES || {})[cat] || []);
} catch (e) { console.log('WARN gb ' + e.message); }
try {
  const ex = require(path.join(ROOT, 'test/gate-benchmark-extended.js'));
  for (const cat of ['multilingual', 'longtext', 'mixed']) pushArr((ex.SAMPLES || {})[cat] || []);
} catch (e) { console.log('WARN ext ' + e.message); }
try {
  const vb = require(path.join(ROOT, 'test/vertical-benign-benchmark.js'));
  for (const k of Object.keys(vb.CATEGORIES || {})) pushArr(vb.CATEGORIES[k]);
} catch (e) { console.log('WARN vb ' + e.message); }
try {
  const bm = require(path.join(ROOT, 'test/benign-mixed-benchmark.js'));
  const arr = Array.isArray(bm.SAMPLES) ? bm.SAMPLES : Object.values(bm.SAMPLES).flat();
  pushArr(arr);
} catch (e) { console.log('WARN bm ' + e.message); }
console.log(`良性样本总数: ${benign.length}`);

// ── 候选正则（宽版 → 逐轮收窄）──────────────────────────────
// 形状：抽象主语 × 比喻性谓语名词（跨界隐喻）
const ABSTRACT_SUBJ = '孤独|寂寞|时间|生命|成长|人生|自由|爱情|感情|命运|遗憾|青春|梦想|灵魂|存在|生活|人性|悲伤|痛苦|幸福|记忆|沉默|等待|选择|真相|希望|黑暗|世界';
const METAPHOR_OBJ = '暴政|回声|河流|镜子|牢笼|旅行|旅程|礼物|诅咒|诗篇|剧本|幻觉|潮汐|深渊|微光|漩涡|余烬|孤岛|桥梁|阶梯|迷宫|长河|光谱|气味|重量|颜色|声音|背影|影子|碎片|火焰|灰烬|沙漏|指针|门|窗|路|茧|蝴蝶|种子|根|树|花|酒|茶|药|刀|锁|钥匙';

const CANDIDATES = {
  v1_wide: new RegExp(`[${''}](${ABSTRACT_SUBJ})[^。，]{0,10}(?:才是|不过是|本身就是|只不过是|就是|正是|亦是|终究是|其实是|是)[^。，]{0,16}(${METAPHOR_OBJ})`),
  v2_excl: new RegExp(`(?:^|[。；;!?！？\\n])\\s*(${ABSTRACT_SUBJ})[^。，]{0,10}(?:才|不过|本身|只|究竟|终究|其实|最终)?(?:就)?是[^。，]{0,16}(${METAPHOR_OBJ})[^。，]{0,10}`),
};

const ONTO = [
  '孤独是灵魂在喧嚣世界中为自己保留的最后一块静默之地。',
  '时间是最温柔的暴政，它在流逝中定义我们的存在。',
  '真正的自由不是想做什么就做什么，而是不想做什么就不做什么。',
  '生命是一场没有地图的旅行，每一步都是答案。',
  '成长就是一次又一次把自己打碎再拼起来的过程。',
];

for (const [name, re] of Object.entries(CANDIDATES)) {
  let hit = 0, fp = 0; const fps = [];
  for (const t of ONTO) if (re.test(t)) hit++;
  for (const t of benign) if (re.test(t)) { fp++; if (fps.length < 8) fps.push(t); }
  console.log(`\n[${name}] 攻击命中 ${hit}/5 · 误伤 ${fp}/${benign.length}`);
  for (const f of fps) console.log('   FP: ' + f.slice(0, 60));
}
