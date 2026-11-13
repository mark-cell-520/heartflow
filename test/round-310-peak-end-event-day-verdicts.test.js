/**
 * test/round-310-peak-end-event-day-verdicts.test.js
 * r310 轮测——peak_end_rule 峰终定律（econ_reasoning_gate 聚合族）
 * 「事件日锚点 × 过程痛苦 × 指示词整体裁定」新措辞家族（真升级②）。
 *
 * 背景（scripts/round-310/probe.js + probe2.js 基线实证，v6.8.178）：
 * 中文「虽然装修那三个月天天吵架，但搬家那天全家都很开心，所以这次
 * 装修值了」类句子 11/12 穿透本模块（其中 4 条穿透整个 gate，
 * fallacy_of_relevance 只兜住带显式推理桥的少数形）；EN「the day we
 * moved in… so the whole thing was worth it」同样穿透。根因：存量
 * WHOLE_VERDICT_ZH 不认「这次/这一切/这十年」类指示词裁定与
 * 「没白费/幸福」结论词；PEAK_END_ZH 不认「搬家那天/上线那天」类
 * 事件日锚点；DURATION_ZH 缺「吵架/崩溃/折磨/熬夜」类新痛苦词。
 *
 * 实现（src/peak-end-rule.js，+约 90 行 0 删除，src/index.js 零改动）：
 *   · PEAK_END_ZH2 / WHOLE_VERDICT_ZH2 / DURATION_ZH2 与 EN 侧
 *     PEAK_END_EN2 / WHOLE_VERDICT_EN2 / DURATION_EN2 六条平行常量，
 *     findSignatures 里与存量腿 concat 合并不动存量数组；
 *   · 新腿注入语义：数组注入=整体替换该新常量；存量键注入永假正则时
 *     .concat 抛 TypeError（与存量行为一致，聚合层 _safeDetect 兜底）；
 *   · 新误伤修复：NEGATIVE_VERDICT_ZH/EN 豁免族（有峰终但整体只给
 *     中等/merely average——缺正面整体裁定即无本族），带注入证明；
 *   · NEG_INSIDE 补 一点都/压根/根本/丝毫（指示词裁定腿否定守卫），
 *     裁定腿专用 (?<![不没未无莫]) 前瞻守卫（「这次不值」不判）。
 *
 * 覆盖分组：
 *   A gate 层归因（22 新攻击 → econ_reasoning_gate findings，action≠pass）
 *   B 模块直调（22 新攻击全部命中）
 *   C 良性零误伤（9 手工 + 官方语料 272 全量）
 *   D 存量回归（旧攻击集仍命中 + 旧良性/边界/旧豁免仍不判）
 *   E 常量级注入（6 新常量=[] 各自依赖腿翻 miss；NEGATIVE_VERDICT 注入
 *     → 新误伤句变红；存量注入语义不变——旧攻击删存量腿仍全灭）
 *   F 元素级注入（11 个新元素逐一删除 → 每组至少一条攻击翻红）
 *   G 路由独立（econ_reasoning_gate 聚合层 + 插件层 analyze 双路可达）
 *   H 登记纪律（VERSION 三点一致 / index.js 接线在位 / 族表登记 /
 *     __internals 新键暴露）
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const { detectPeakEndRule: D, __internals } = require(path.join(ROOT, 'src', 'peak-end-rule.js'));
const { checkEconReasoningGate, FAMILIES } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── 新攻击集（22 条，基线零命中实证见 coordination/reports/r310）────────
const ATTACK_ZH = [
  // 族 A：事件日锚点 × 新痛苦词 × 指示词裁定（三腿全新）
  '装修那三个月天天吵架，但搬家那天全家都很开心，所以这次装修值了',
  '项目前期天天加班到崩溃，但上线那天掌声雷动，所以这几个月的付出都是值得的',
  '创业那三年互相折磨，但敲钟那天全家人在屏幕前鼓掌，这三年都值了',
  '婚姻前几年争吵不断，但金婚那晚孩子们都回来了，这十年就没白过',
  // 族 B：存量峰终锚点 × 新指示词裁定 × 存量时长折让
  '培训过程再枯燥都无所谓，最后发证那一刻很激动，所以这次培训值了',
  '化疗过程再难受，只要最后病好了，这一切就没有白费',
  // 族 C：新事件日锚点 × 存量裁定 × 新痛苦词
  '婚礼筹备吵了三个月，但婚礼那天一切都完美，这场婚礼值了',
  '度假这一周每天都在吵架，但订婚那天她答应了，这趟度假值了',
  // 族 D：新痛苦词 × 存量峰终 × 存量裁定
  '虽然两个人争吵不断，但结尾的烟花特别惊艳，这趟旅行值了',
  // 族 E：指示词裁定 × 事件日锚点
  '恋爱谈了十年很平淡，但求婚那晚很浪漫，所以这十年都是幸福的',
  '带娃这一年天天睡不好，但孩子开口叫妈妈那天，我觉得一切都值了',
  '复习那半年天天熬夜，但查分那天看到录取结果，这一切煎熬都算值了',
  // 族 F：裸「那天」高光腿（PEAK_END_ZH2[1] 专属）
  '虽然过程很痛苦，但那天大家都很感动，这次聚会值了',
  // 族 G：新峰终锚点 × 存量裁定 × 存量时长（PEAK_END_ZH2[0] 纯净子集）
  '度假这一周舟车劳顿，但订婚那天她答应了，这趟旅行值了',
];
const ATTACK_EN = [
  'The move was brutal — we fought every day for three months, but the day we moved in felt perfect, so the whole thing was worth it',
  'Although the first year was miserable, the last day of the project was a celebration, so all of it paid off',
  'The recovery was a nightmare and we argued through every week, but graduation day made everything worth it',
  'We fought constantly during the renovation, but the day we got the keys the whole ordeal was worthwhile',
  'Six months of chaos and sleepless nights, but the launch day party made it all worthwhile',
  'The vacation was mostly a slog, but the last day was perfect, so everything about it was worth it',
  // evening 锚点腿（PEAK_END_EN2[1] 专属）
  'The months of fighting were a nightmare, but that final evening was wonderful, so the whole thing was worth it',
  // not-in-vain 裁定腿（WHOLE_VERDICT_EN2[1] 专属）
  'We fought through six chaotic months, but the launch day was a triumph, so it was not in vain',
];

const BENIGN = [
  // 否定整体裁定（指示词腿守卫 + NEG_INSIDE）
  '虽然装修吵了三个月，但搬家那天全家都很开心，所以这次装修根本不值',
  '过程很痛苦，结局也普通，这次尝试并不值',
  // 均衡评价/考量时长
  '结尾确实惊艳，虽然全程乏味煎熬，但综合时长与整体分布来看，这趟依然值得',
  '不能只因为收尾漂亮就忽略中间数小时的乏味，整体评价要打折扣',
  // 负面整体裁定（NEGATIVE_VERDICT 新豁免族）
  '虽然这一年争吵不断，但整体评价只能说一般，毕竟问题没有真正解决',
  '装修吵了三个月，但搬家那天全家都很开心，所以这次装修值了，不过整体评价只能算中上',
  // 无三腿共现的邻接句
  '婚礼那天大家都很热闹，婚庆公司的服务名单在这里',
  '搬家那天电梯坏了，物业和业主吵了一架，这事就这么过去了',
  // EN：负面整体裁定（旧裁定腿宽窗误配，新豁免族排除）
  'Although the trip was rough, the last day was great, but overall the vacation was merely average',
  'We fought about the itinerary, yet the final evening was lovely; still, the whole journey was not worth repeating',
];

// ─── A. gate 层归因 ─────────────────────────────────────────────────────
check('A gate 归因：22 条新攻击全部经 econ_reasoning_gate 且 action≠pass', () => {
  for (const t of [...ATTACK_ZH, ...ATTACK_EN]) {
    const r = gate(t);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(dims.includes('econ_reasoning_gate'), '无 econ_reasoning_gate 归因: ' + t.slice(0, 24));
    assert.notStrictEqual(r.gate.action, 'pass', 'action=pass: ' + t.slice(0, 24));
  }
});

// ─── B. 模块直调 ────────────────────────────────────────────────────────
check('B 模块直调：22 条新攻击全部命中', () => {
  for (const t of [...ATTACK_ZH, ...ATTACK_EN]) {
    assert.strictEqual(D(t).hit, true, '模块未命中: ' + t.slice(0, 24));
  }
});

// ─── C. 良性零误伤 ──────────────────────────────────────────────────────
check('C 良性零误伤：9 条手工良性模块直调 + gate 全量均不出现本维度归因', () => {
  for (const t of BENIGN) {
    assert.strictEqual(D(t).hit, false, '模块误伤: ' + t.slice(0, 24));
    const dims = (gate(t).findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('econ_reasoning_gate'), 'gate 误伤: ' + t.slice(0, 24));
  }
});

check('C 官方良性语料全量零误命中（gate-benchmark + extended + vertical + mixed）', () => {
  const corpora = [];
  const push = (src, t) => { if (typeof t === 'string' && t.trim()) corpora.push({ src, text: t }); };
  const pick = (it) => (typeof it === 'string' ? it : (it && typeof it === 'object' ? (it.text || it.sample || it.input || it.prompt || it.content) : null));
  const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
  for (const [cat, arr] of Object.entries(gb.SAMPLES || {})) if (Array.isArray(arr)) for (const it of arr) push('gb:' + cat, pick(it));
  const ext = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
  for (const [k, v] of Object.entries(ext)) if (Array.isArray(v)) for (const it of v) push('ext:' + k, pick(it));
  const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
  for (const [cat, arr] of Object.entries(vb.CATEGORIES || {})) if (Array.isArray(arr)) for (const it of arr) push('vert:' + cat, pick(it));
  const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
  for (const [k, v] of Object.entries(bm)) if (Array.isArray(v)) for (const it of v) push('mixed:' + k, pick(it));
  assert.ok(corpora.length >= 270, '语料规模 ' + corpora.length);
  let hits = 0;
  for (const c of corpora) if (D(c.text).hit) { hits++; console.log('    [误命中] (' + c.src + ') ' + c.text.slice(0, 90)); }
  assert.strictEqual(hits, 0, '官方良性语料误命中 ' + hits + ' 条');
});

// ─── D. 存量回归 ────────────────────────────────────────────────────────
check('D 存量回归：r245 原攻击集（中 12 + 英 7）仍全部命中', () => {
  const OLD_ZH = [
    '全程都挺无聊的，就结尾特别惊艳，我觉得这趟旅行值了。',
    '虽然过程很煎熬，但最后那一刻特别美好，整件事我就算它成功。',
    '这部电影前面昏昏欲睡，结尾一击致命，我直接给满分。',
    '假期大半时间在排队，就最后两天痛快，回忆里全是美好。',
    '开头混乱、中途平淡，可收官那一刻堪称完美，整场演出我认为非常成功。',
    '尽管前面两个小时都在赶路，最后看到日出的那一秒，这趟就值了。',
    '手术过程别提多受罪，缝完针那一刻轻松了，整体我就给它好评。',
    '培训前半段枯燥得很，结业时发了张证书，整个过程瞬间觉得有意义。',
    '这部电影高光全在最后一幕，前面再拖我也愿意给高分。',
    '开会又长又闷，好在散会前领导表扬了我，这场会开得还算舒心。',
    '这顿饭除了最后那道甜点惊艳，前面寡淡无味，但整体体验我给满分。',
    '旅行一路上舟车劳顿，就登顶那几分钟震撼，回忆里整趟都发光。',
  ];
  const OLD_EN = [
    'The whole trip was dull except the stunning ending, so I say it was worth it.',
    'The procedure was agony, but it ended well, so overall it went fine.',
    'Most of the movie dragged, but the final scene redeemed the entire experience.',
    'The conference dragged for hours, but the closing keynote was brilliant, so the whole event was a success.',
    'The recovery was brutal, yet the moment they removed the cast felt great, so overall it went well.',
    'Most of the vacation was stressful, but the final sunset made the entire trip unforgettable.',
    'The first three quarters were dismal, but the last-minute goal made the whole game worth watching.',
  ];
  for (const t of OLD_ZH) assert.strictEqual(D(t).hit, true, '存量攻击失配: ' + t.slice(0, 20));
  for (const t of OLD_EN) assert.strictEqual(D(t).hit, true, '存量攻击失配: ' + t.slice(0, 30));
});

check('D 存量良性/边界/两组豁免句行为不变（仍不判）', () => {
  const OLD_BENIGN = [
    '虽然结尾很惊艳，但整个过程拖沓，综合时长和节奏我只能给中等。',
    '不能只因为收尾漂亮就忽略中间数小时的乏味，整体评价要打折扣。',
    '最后的高光值得记住，但也不该抹杀前面大部分时间的平淡。',
    '尽管结局圆满，前半段的煎熬同样真实，我会把整体评为中上而非完美。',
    'The finale was strong, but the slow middle means the whole thing is merely average.',
    'A single climactic moment cannot carry a review that ignores the rest of the runtime.',
    '这次旅行一塌糊涂，全程都不满意。',
    '全程都很满意，结尾尤其好，这趟非常值。',
    '这部电影结局很圆满。',
    '过程别提多受罪，但整体我并不觉得值。',
    '心理学教材在讲峰终定律：全程都挺无聊的，就结尾特别惊艳，我觉得这趟旅行值了——经典案例。',
    'The textbook on the peak-end rule: the whole trip was dull except the stunning ending, so I say it was worth it.',
    '结尾确实惊艳，虽然全程乏味煎熬，但综合时长与整体分布来看，这趟依然值得。',
    'The whole trip dragged except the ending, but weighing the full duration, overall it was worth it.',
    '我们统计了全年每一天的满意度，按时间加权得到整体体验分。',
    '评价课程要综合课前课中课后全周期，而不是只看结课那一刻。',
    'We averaged satisfaction across every session, not just the first and last.',
  ];
  for (const t of OLD_BENIGN) assert.strictEqual(D(t).hit, false, '存量行为变化: ' + t.slice(0, 24));
});

// ─── E. 常量级注入 ──────────────────────────────────────────────────────
check('E PEAK_END_ZH2=[] → 依赖新事件日/裸日锚点的攻击全部失配', () => {
  const NEW_PEAK = [
    '装修那三个月天天吵架，但搬家那天全家都很开心，所以这次装修值了',
    '项目前期天天加班到崩溃，但上线那天掌声雷动，所以这几个月的付出都是值得的',
    '婚礼筹备吵了三个月，但婚礼那天一切都完美，这场婚礼值了',
    '恋爱谈了十年很平淡，但求婚那晚很浪漫，所以这十年都是幸福的',
    '虽然过程很痛苦，但那天大家都很感动，这次聚会值了',
    '度假这一周舟车劳顿，但订婚那天她答应了，这趟旅行值了',
  ];
  for (const t of NEW_PEAK) assert.strictEqual(D(t, { PEAK_END_ZH2: [] }).hit, false, '删 PEAK_END_ZH2 仍命中: ' + t.slice(0, 20));
});

check('E WHOLE_VERDICT_ZH2=[] → 依赖新指示词裁定的攻击全部失配', () => {
  const NEW_VERDICT = [
    '装修那三个月天天吵架，但搬家那天全家都很开心，所以这次装修值了',
    '培训过程再枯燥都无所谓，最后发证那一刻很激动，所以这次培训值了',
    '化疗过程再难受，只要最后病好了，这一切就没有白费',
    '恋爱谈了十年很平淡，但求婚那晚很浪漫，所以这十年都是幸福的',
    '带娃这一年天天睡不好，但孩子开口叫妈妈那天，我觉得一切都值了',
    '虽然过程很痛苦，但那天大家都很感动，这次聚会值了',
  ];
  for (const t of NEW_VERDICT) assert.strictEqual(D(t, { WHOLE_VERDICT_ZH2: [] }).hit, false, '删 WHOLE_VERDICT_ZH2 仍命中: ' + t.slice(0, 20));
});

check('E DURATION_ZH2=[] → 依赖新痛苦词的攻击全部失配', () => {
  const NEW_DUR = [
    '装修那三个月天天吵架，但搬家那天全家都很开心，所以这次装修值了',
    '项目前期天天加班到崩溃，但上线那天掌声雷动，所以这几个月的付出都是值得的',
    '婚礼筹备吵了三个月，但婚礼那天一切都完美，这场婚礼值了',
    '虽然两个人争吵不断，但结尾的烟花特别惊艳，这趟旅行值了',
    '带娃这一年天天睡不好，但孩子开口叫妈妈那天，我觉得一切都值了',
    '度假这一周每天都在吵架，但订婚那天她答应了，这趟度假值了',
  ];
  for (const t of NEW_DUR) assert.strictEqual(D(t, { DURATION_ZH2: [] }).hit, false, '删 DURATION_ZH2 仍命中: ' + t.slice(0, 20));
});

check('E EN 三新常量=[] → 各自依赖腿的 EN 攻击全部失配', () => {
  for (const t of ATTACK_EN) assert.strictEqual(D(t, { PEAK_END_EN2: [] }).hit, false, '删 PEAK_END_EN2 仍命中: ' + t.slice(0, 30));
  // 注：EN1/EN7 的「the whole thing was worth it」同时被存量 WHOLE_VERDICT_EN
  // 宽窗匹配（the whole + was worth it），EN6 的「it was worth it」被存量
  // 窄窗 (it|that|this)+was+worth it 匹配，均不列入新裁定腿纯子集；
  // 新裁定腿纯子集 = 裁定词仅在 WHOLE_VERDICT_EN2 的 5 条。
  const NEW_V = [
    'Although the first year was miserable, the last day of the project was a celebration, so all of it paid off',
    'The recovery was a nightmare and we argued through every week, but graduation day made everything worth it',
    'We fought constantly during the renovation, but the day we got the keys the whole ordeal was worthwhile',
    'Six months of chaos and sleepless nights, but the launch day party made it all worthwhile',
    'We fought through six chaotic months, but the launch day was a triumph, so it was not in vain',
  ];
  for (const t of NEW_V) assert.strictEqual(D(t, { WHOLE_VERDICT_EN2: [] }).hit, false, '删 WHOLE_VERDICT_EN2 仍命中: ' + t.slice(0, 30));
  const NEW_D = [
    'The recovery was a nightmare and we argued through every week, but graduation day made everything worth it',
    'We fought constantly during the renovation, but the day we got the keys the whole ordeal was worthwhile',
    'Six months of chaos and sleepless nights, but the launch day party made it all worthwhile',
    'The months of fighting were a nightmare, but that final evening was wonderful, so the whole thing was worth it',
    'We fought through six chaotic months, but the launch day was a triumph, so it was not in vain',
  ];
  for (const t of NEW_D) assert.strictEqual(D(t, { DURATION_EN2: [] }).hit, false, '删 DURATION_EN2 仍命中: ' + t.slice(0, 30));
});

check('E 六新常量全删 → 22 条新攻击全部失配（新家族整体承重）', () => {
  const inj = { PEAK_END_ZH2: [], WHOLE_VERDICT_ZH2: [], DURATION_ZH2: [], PEAK_END_EN2: [], WHOLE_VERDICT_EN2: [], DURATION_EN2: [] };
  for (const t of [...ATTACK_ZH, ...ATTACK_EN]) assert.strictEqual(D(t, inj).hit, false, '全删仍命中: ' + t.slice(0, 20));
});

check('E NEGATIVE_VERDICT 注入 → 负面整体裁定豁免句变红（新豁免族承重）', () => {
  // ZH 混合信号句：正面指示词裁定（值了）+ 负面整体裁定（只能算中上），
  // 默认被 NEGATIVE_VERDICT_ZH 豁免；注入永假正则后三腿共现存 → 变红。
  const zh = '装修吵了三个月，但搬家那天全家都很开心，所以这次装修值了，不过整体评价只能算中上';
  assert.strictEqual(D(zh).hit, false, '默认应豁免');
  assert.strictEqual(D(zh, { NEGATIVE_VERDICT_ZH: /(?!)/ }).hit, true, '删 NEGATIVE_VERDICT_ZH 后仍豁免');
  const en = 'Although the trip was rough, the last day was great, but overall the vacation was merely average';
  assert.strictEqual(D(en).hit, false, '默认应豁免');
  assert.strictEqual(D(en, { NEGATIVE_VERDICT_EN: /(?!)/i }).hit, true, '删 NEGATIVE_VERDICT_EN 后仍豁免');
});

check('E 存量注入语义不变：删存量腿后存量攻击仍全灭（新腿不顶替）', () => {
  const OLD_ZH = [
    '全程都挺无聊的，就结尾特别惊艳，我觉得这趟旅行值了。',
    '虽然过程很煎熬，但最后那一刻特别美好，整件事我就算它成功。',
    '旅行一路上舟车劳顿，就登顶那几分钟震撼，回忆里整趟都发光。',
    '开会又长又闷，好在散会前领导表扬了我，这场会开得还算舒心。',
  ];
  for (const t of OLD_ZH) {
    assert.strictEqual(D(t, { PEAK_END_ZH: [] }).hit, false, '删 PEAK_END_ZH 仍命中: ' + t.slice(0, 16));
    assert.strictEqual(D(t, { WHOLE_VERDICT_ZH: [] }).hit, false, '删 WHOLE_VERDICT_ZH 仍命中: ' + t.slice(0, 16));
    assert.strictEqual(D(t, { DURATION_ZH: [] }).hit, false, '删 DURATION_ZH 仍命中: ' + t.slice(0, 16));
  }
  const OLD_EN = [
    'The whole trip was dull except the stunning ending, so I say it was worth it.',
    'Most of the vacation was stressful, but the final sunset made the entire trip unforgettable.',
  ];
  for (const t of OLD_EN) {
    assert.strictEqual(D(t, { PEAK_END_EN: [] }).hit, false, '删 PEAK_END_EN 仍命中: ' + t.slice(0, 24));
    assert.strictEqual(D(t, { WHOLE_VERDICT_EN: [] }).hit, false, '删 WHOLE_VERDICT_EN 仍命中: ' + t.slice(0, 24));
    assert.strictEqual(D(t, { DURATION_EN: [] }).hit, false, '删 DURATION_EN 仍命中: ' + t.slice(0, 24));
  }
});

// ─── F. 元素级注入 ──────────────────────────────────────────────────────
check('F 元素级注入：新族 11 个正则元素逐一删除后至少一条攻击翻红', () => {
  const I = __internals();
  const dropOne = (arr, i) => arr.filter((_, j) => j !== i);
  const perElement = [
    ['PEAK_END_ZH2', I.PEAK_END_ZH2, ATTACK_ZH],
    ['WHOLE_VERDICT_ZH2', I.WHOLE_VERDICT_ZH2, ATTACK_ZH],
    ['DURATION_ZH2', I.DURATION_ZH2, ATTACK_ZH],
    ['PEAK_END_EN2', I.PEAK_END_EN2, ATTACK_EN],
    ['WHOLE_VERDICT_EN2', I.WHOLE_VERDICT_EN2, ATTACK_EN],
    ['DURATION_EN2', I.DURATION_EN2, ATTACK_EN],
  ];
  let elements = 0;
  for (const [name, arr, atks] of perElement) {
    for (let i = 0; i < arr.length; i++) {
      elements++;
      const inj = { [name]: dropOne(arr, i) };
      const reddened = atks.filter(t => D(t).hit && !D(t, inj).hit);
      assert.ok(reddened.length >= 1, name + ' 元素 ' + i + ' 删除后无攻击翻红');
    }
  }
  assert.strictEqual(elements, 11, '新元素总数 ' + elements + ' ≠ 11');
});

// ─── G. 路由独立 ────────────────────────────────────────────────────────
check('G 路由独立：econ_reasoning_gate 聚合层 + 插件层 analyze 双路可达', () => {
  const fam = FAMILIES.find(f => f.key === 'peak_end_rule');
  assert.ok(fam, 'econ-reasoning-gate FAMILIES 缺 peak_end_rule');
  const r = checkEconReasoningGate(ATTACK_ZH[0]);
  assert.strictEqual(r.hit, true, '聚合层未命中');
  assert.ok(r.families.some(f => f.key === 'peak_end_rule'), '聚合层族明细缺本族');
  const PLUGIN = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
  const out = PLUGIN.analyze(ATTACK_ZH[0]);
  const keys = (out.families || []).map(f => f.key);
  assert.ok(keys.includes('peak_end_rule'), '插件层未路由本族');
});

// ─── H. 登记纪律 ────────────────────────────────────────────────────────
check('H VERSION / package.json / 兜底三点一致（版本号动态，r316-c 起不写死）', () => {
  const pkg = require(path.join(ROOT, 'package.json'));
  const v = require('node:fs').readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  assert.ok(/^\d+\.\d+\.\d+$/.test(v), 'VERSION 格式非法: ' + v);
  assert.strictEqual(pkg.version, v);
});

check('H 接线在位：index.js require econ-reasoning-gate + 维度计数仍 254', () => {
  const src = require('node:fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/require\('\.\/econ-reasoning-gate\.js'\)/.test(src), 'index.js 缺 econ-reasoning-gate 接线');
  assert.ok(/econ_reasoning_gate/.test(src), 'index.js 缺 econ_reasoning_gate 维度键');
  const { discriminate } = require(path.join(ROOT, 'src', 'index.js'));
  const d = discriminate('neutral baseline text');
  assert.strictEqual(Object.keys(d.dimensions || {}).length, 254, '维度数变化（应仍 254）');
});

check('H __internals 暴露 6 新腿常量 + 2 新豁免常量', () => {
  const I = __internals();
  for (const k of ['PEAK_END_ZH2', 'WHOLE_VERDICT_ZH2', 'DURATION_ZH2', 'PEAK_END_EN2', 'WHOLE_VERDICT_EN2', 'DURATION_EN2', 'NEGATIVE_VERDICT_ZH', 'NEGATIVE_VERDICT_EN']) {
    assert.ok(I[k], '__internals 缺 ' + k);
  }
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
