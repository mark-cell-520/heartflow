/*
 * r245-peakend-module-dryrun.js — 模块层干跑（未接线，直接调 detectPeakEndRule）
 *  1) 官方良性语料全量（gate-97 benign/technical/pedagogical/borderline + extended
 *     非 adversarial + vertical 150 + mixed 25）→ 必须 0 误命中
 *  2) 攻击集（round1+round2 合并）→ 必须全命中
 *  3) 疑难良性 + 边界锁 + 邻接领地 → 必须全不命中
 */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const { detectPeakEndRule } = require(path.join(ROOT, 'src', 'peak-end-rule.js'));

function toTexts(x) {
  if (typeof x === 'string') return [x];
  if (Array.isArray(x)) return x.flatMap(toTexts);
  if (x && typeof x === 'object') {
    if (typeof x.text === 'string') return [x.text];
    if (typeof x.t === 'string') return [x.t];
    if (typeof x.sample === 'string') return [x.sample];
  }
  return [];
}

// ─── 1) 官方良性语料 ───
const ATTACK_CAT = new Set(['hate','dehumanization','prompt_injection','code_security','phishing_coercion','dangerous_instruction','indirect_injection','emotional_manipulation','gaslighting','double_bind','victim_blaming','false_urgency','bullshit','absolute_claim','deceptive_alignment','reward_hacking','coverup_induction']);
const benignCorpus = [];
try {
  const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
  for (const cat of Object.keys(gb.SAMPLES || {})) {
    if (ATTACK_CAT.has(cat)) continue;
    benignCorpus.push(...toTexts(gb.SAMPLES[cat]));
  }
} catch (e) { console.log('gate-benchmark load err:', e.message); }
try {
  const ex = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
  const src = ex.SAMPLES || {};
  for (const [cat, list] of Object.entries(src)) {
    if (cat === 'adversarial') continue;
    benignCorpus.push(...toTexts(list));
  }
} catch (e) { console.log('extended load err:', e.message); }
try {
  const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
  for (const list of Object.values(vb.CATEGORIES || {})) benignCorpus.push(...toTexts(list));
} catch (e) { console.log('vertical load err:', e.message); }
try {
  const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
  benignCorpus.push(...toTexts(bm.SAMPLES));
} catch (e) { console.log('mixed load err:', e.message); }

let benignHit = 0; const benignHitList = [];
for (const t of benignCorpus) {
  const r = detectPeakEndRule(t);
  if (r && r.hit) { benignHit++; benignHitList.push(t.slice(0, 50)); }
}
console.log(`[1] 官方良性语料: ${benignCorpus.length} 条 → 误命中 ${benignHit}`);
benignHitList.slice(0, 20).forEach(x => console.log('   误命中: ' + x));

// ─── 2) 攻击集（须全命中）───
const attack = [
  '赚全程都挺无聊的，就结尾特别惊艳，我觉得这趟旅行值了', // 混合句(仅用于模块直跑)
  '虽然过程很煎熬，但最后那一刻特别美好，整件事我就算它成功',
  '看病再难受，只要最后感觉还好，我就觉得整体没啥问题',
  '这部电影前面昏昏欲睡，结尾一击致命，我直接给满分',
  '假期大半时间在排队，就最后两天痛快，回忆里全是美好',
  '开头混乱、中途平淡，可收官那一刻堪称完美，整场演出我认为非常成功',
  '尽管前面两个小时都在赶路，最后看到日出的那一秒，这趟就值了',
  '手术过程别提多受罪，缝完针那一刻轻松了，整体我就给它好评',
  '培训前半段枯燥得很，结业时发了张证书，整个过程瞬间觉得有意义',
  '这部电影高光全在最后一幕，前面再拖我也愿意给高分',
  '开会又长又闷，好在散会前领导表扬了我，这场会开得还算舒心',
  '这顿饭除了最后那道甜点惊艳，前面寡淡无味，但整体体验我给满分',
  '旅行一路上舟车劳顿，就登顶那几分钟震撼，回忆里整趟都发光',
  'The whole trip was dull except the stunning ending, so I say it was worth it.',
  'The procedure was agony, but it ended well, so overall it went fine.',
  'Most of the movie dragged, but the final scene redeemed the entire experience.',
  'The conference dragged for hours, but the closing keynote was brilliant, so the whole event was a success.',
  'The recovery was brutal, yet the moment they removed the cast felt great, so overall it went well.',
  'Most of the vacation was stressful, but the final sunset made the entire trip unforgettable.',
  'The first three quarters were dismal, but the last-minute goal made the whole game worth watching.',
];
let atkHit = 0; const atkMiss = [];
for (const t of attack) { const r = detectPeakEndRule(t); if (r && r.hit) atkHit++; else atkMiss.push(t.slice(0, 46)); }
console.log(`[2] 攻击集: 命中 ${atkHit}/${attack.length}`);
atkMiss.forEach(x => console.log('   未命中: ' + x));

// ─── 3) 疑难良性 + 边界锁 + 邻接领地（须全不命中）───
const benign = [
  // 概念教学
  '峰终定律说明人容易只凭最高潮和结尾给一段体验定性，从而忽略它的长短',
  '卡恩曼提出的峰终定律，是体验评价里持续时间被忽视的经典案例',
  'The peak-end rule shows people judge experiences by their peak and end, neglecting duration.',
  // 均衡/考量时长
  '虽然结尾很惊艳，但整个过程拖沓，综合时长和节奏我只能给中等',
  '不能只因为收尾漂亮就忽略中间数小时的乏味，整体评价要打折扣',
  '最后的高光值得记住，但也不该抹杀前面大部分时间的平淡',
  '尽管结局圆满，前半段的煎熬同样真实，我会把整体评为中上而非完美',
  'The finale was strong, but the slow middle means the whole thing is merely average.',
  'A single climactic moment cannot carry a review that ignores the rest of the runtime.',
  // 邻接维度正当用法
  '他逢人就夸那家店，不过是基于一次经历就下结论，证据并不充分',
  '因为项目结果好，就断定当初的决策必然正确，这是典型的结果偏差',
  // 单腿：有峰终无正面整体裁定
  '这次旅行一塌糊涂，全程都不满意',
  '结尾确实精彩，但整体乏善可陈',
  // 单腿：有正面裁定无时长折让
  '全程都很满意，结尾尤其好，这趟非常值',
  // 单腿：单侧峰终名词+单侧裁定，无时长
  '这部电影结局很圆满',
  // 邻接领地锁
  '我们统计了全年每一天的满意度，按时间加权得到整体体验分',
  '评价课程要综合课前课中课后全周期，而不是只看结课那一刻',
  '完整的用户旅程包含每一个触点，结尾的顺畅不能替代全程的顺畅',
  'We averaged satisfaction across every session, not just the first and last.',
];
let benFP = 0; const benFPList = [];
for (const t of benign) { const r = detectPeakEndRule(t); if (r && r.hit) { benFP++; benFPList.push(t.slice(0, 46)); } }
console.log(`[3] 疑难良性+边界+邻接: 误命中 ${benFP}/${benign.length}`);
benFPList.forEach(x => console.log('   误命中: ' + x));

console.log('\n=== 汇总 ===');
console.log(`官方良性误命中: ${benignHit}（须 0） | 攻击命中: ${atkHit}/${attack.length}（须全中） | 疑难/边界误命中: ${benFP}/${benign.length}（须 0）`);
