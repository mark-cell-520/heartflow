// 第 289 轮 v5：候选正则最终定版扫描（16 攻击 + 225 严格 + 101 宽松）
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

const TAIL = '[。！？…，,、；;\\s"\'）)\\]】」』]*$';
const SIMILE_Q = '(?:一盒|一杯|一场|一面|一盏|一把|一颗|一朵|一座|一艘|一本|一首|一束|一线|一缕)';

const CANDS = {
  // ① 跨域系词（允许句末标点收尾；交付版上把句点也纳入 TAIL）
  link_tail: new RegExp(`^(?:真正的|所有的|一切的|所谓的)?[^。！？\\n]{0,30}?(?:才|不过|本身|只|其实|最终|究竟|终究)?(?:就)?是[^。！？\\n]{0,30}(?:之地|之路|之光|之火|之窗|之门|之药|之国|之乡|的过程|的答案|的本质|的回声|的影子|的轮回|的循环|的宿命|的意义|的真相|的全部|的定义|的倒影|的碎片|的余烬|的深渊|的潮汐|的漩涡|的微光|的余温|的底色)${TAIL}`),
  // ② 伪辩证「真正的X不是A而是B」—— 需 A/B 都是抽象判断（含本体论收尾词或对偶封闭句式）
  pseudo_dialectic: new RegExp(`^(?:真正的|所有的)[^。！？\\n]{1,10}[，,]?[^。！？\\n]{0,24}不是[^。！？\\n]{1,40}而是[^。！？\\n]{1,40}`),
  // ②-2 「X不是A，而是B」不带「真正的」但 B 侧收本体论名词
  pseudo_dialectic2: new RegExp(`^[^。！？\\n]{0,10}不是[^。！？\\n]{2,40}，?而是[^。！？\\n]{2,40}(?:主宰|和解|前行|答案|本质|过程|轮回|宿命|意义|境界|格局|认知|觉醒|智慧|选择|机会|味道|本身|全部|真相|成长|自由|灵魂|相遇|告别|重逢|治愈)`),
  // ③ 明喻量化收尾「就像一盒…」
  simile: new RegExp(`[^。！？\\n]{0,24}(?:就像|如同|仿佛|好比|恰似)[^。！？\\n]{0,16}${SIMILE_Q}[^。！？\\n]{0,30}`),
  // ④ 无条件治愈/时间全称
  heal_all: new RegExp(`(?:时间|岁月|时光)[^。！？\\n]{0,8}(?:会|终将|一定会|必将)?[^。！？\\n]{0,6}(?:治愈|抚平|冲淡|冲散|抹平)[^。！？\\n]{0,4}(?:一切|所有|全部|任何)[^。！？\\n]{0,6}(?:创伤|伤痛|伤害|痛苦|悲伤|记忆|伤痕|裂痕)`),
  // ⑤ 「所有的X，都是为了Y」宿命式收尾
  all_for: new RegExp(`^所有(?:的)?(?:离别|失去|结束|告别|伤痛|创伤|伤痕|错过|离开)[^。！？\\n]{0,10}(?:都)?是[^。！？\\n]{0,14}(?:为了)?[^。！？\\n]{0,14}(?:重逢|相遇|开始|成长|铺垫|伏笔|礼物|答案|意义|必然|命中注定|自己)`),
  // ⑥ 零例外全称承诺（no_fallback/absolute 交叉族，此处只看 gate 归因面）
  zero_exception: new RegExp(`[^。！？\\n]{0,12}(?:永远|始终|一定会|必然|终将)[^。！？\\n]{0,16}(?:不会|不可能|无法)[^。！？\\n]{0,12}(?:失败|出错|有问题|落空|白费|辜负)`),
};

for (const [name, re] of Object.entries(CANDS)) {
  let hit = 0;
  for (const t of ONTO) if (re.test(t)) hit++;
  let fpS = 0; const f1 = [];
  for (const t of strictSamples) if (re.test(t)) { fpS++; if (f1.length < 6) f1.push(t.slice(0, 60)); }
  let fpL = 0; const f2 = [];
  for (const t of looseSamples) if (re.test(t)) { fpL++; if (f2.length < 3) f2.push(t.slice(0, 60)); }
  console.log(`\n[${name}] 命中 ${hit}/16  严格误伤 ${fpS}/225  宽松误伤 ${fpL}/101`);
  for (const f of f1) console.log('   S-FP: ' + f);
  for (const f of f2) console.log('   L-FP: ' + f);
}
