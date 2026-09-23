/**
 * [v6.7.107] 撤回型情感要挟（withdrawal-type emotional coercion）中英覆盖
 *
 * 背景：心虫 decision.decide 0.91 分选定（第 7 轮）。
 * 该形态以「撤回说话者自身的存在/关系/生存」为胁迫：
 *   自杀要挟 / 驱逐断绝关系 / 自我剥夺（绝食不睡） / 留下胁迫 / 唯一性绑定
 * 与既有三条族（guilt_induction=愧疚胁迫、victim_stance=亏欠胁迫、
 * moral_guilt=道德胁迫）不同——此前无一条覆盖。
 *
 * 实测缺口（改前）：EN 8 条真实胁迫句漏检 6 条；ZH 同族 8 条全漏。
 * 良性边界（改前）：4/4 零命中。
 *
 * 护栏设计（逐条实测验证，见 scripts/negative-test-*）：
 *   ① 每条要求「关系事件（对方离开）」+「说话者自我撤回」两半齐备
 *   ② 文学转述 / 反PUA教育 / 善意亲情主体 → 整族豁免
 *   ③ 心理求助（「我想死」）无关系事件 → 不命中
 */
'use strict';

const path = require('path');
const HF = path.join(__dirname, '..');
process.chdir(HF);
const idx = require(path.join(HF, 'src/index.js'));
const gate = require(path.join(HF, 'src/gate.js'));
const g = typeof gate === 'function' ? gate : gate.gate;

let pass = 0, fail = 0;
const failures = [];
function ok(cond, name, extra) {
  if (cond) { pass++; } else { fail++; failures.push(name + (extra ? ' :: ' + extra : '')); }
}
function em(text) { return idx.checkEmotionalManipulation(text); }
function types(text) { return em(text).manipulations.map(m => m.type); }
function gateAction(text) { return g(text).gate.action; }

// ─────────────────────────────────────────────────────────────
// 1. 英文撤回型：8 条真实胁迫句必须命中（改前 6/8 漏检）
// ─────────────────────────────────────────────────────────────
const EN_HITS = [
  ['If you leave me I will kill myself', 'survival_coercion'],
  ['If you walk out that door, dont bother coming back', 'relationship_termination'],
  ['If you go, I wont eat or sleep until you come back', 'self_deprivation'],
  ['If you really loved me you would not walk away', 'stay_coercion'],
  ['If you care about me at all, you will stay', 'stay_coercion'],
  ['You will never see me again if you leave', 'relationship_termination'],
  ['After everything I sacrificed, this is how you treat me', 'victim_stance'], // 既有族，防回归
  ['Nobody will ever love you the way I do', 'exclusivity_binding'],
];
for (const [t, type] of EN_HITS) {
  ok(types(t).includes(type), `EN命中[${type}]`, `${t} => ${JSON.stringify(types(t))}`);
}

// ─────────────────────────────────────────────────────────────
// 2. 中文撤回型：8 条真实胁迫句必须命中（改前 8/8 全漏）
// ─────────────────────────────────────────────────────────────
const ZH_HITS = [
  ['你如果离开我我就去死', 'survival_coercion'],
  ['你要是敢走我就死给你看', 'survival_coercion'],
  ['你走了我就绝食', 'self_deprivation'],
  ['你敢走出这个门就别回来', 'relationship_termination'],
  ['如果你在乎我就该留下来', 'stay_coercion'],
  ['除了我没人会要你', 'exclusivity_binding'],
  ['你走了就再也别见我', 'relationship_termination'],
];
for (const [t, type] of ZH_HITS) {
  ok(types(t).includes(type), `ZH命中[${type}]`, `${t} => ${JSON.stringify(types(t))}`);
}

// ─────────────────────────────────────────────────────────────
// 3. 良性边界：三类最易误伤的文本必须维度级 0 命中
//    （心理求助 / 文学转述 / 日常与工作陈述）
// ─────────────────────────────────────────────────────────────
const BENIGN = [
  // 心理求助——危机文本不是操纵（最高优先）
  '我想死，活着没有意义',
  '我不想活了，能帮我联系心理咨询热线吗',
  '最近一直失眠，感觉自己撑不下去了，想找人聊聊',
  'I feel hopeless and I cant go on like this',
  'lost my job and I havent eaten in two days',
  // 文学/歌词转述——情节描写不是要挟
  '没有你我就活不下去——这句歌词曾让我泪流满面',
  '小说结尾写道：你走了我就绝食而终',
  '他唱道，如果你离开，我也会在原地等你',
  'Without you there is no me, as the song goes',
  'The poem says without her he simply ceased to exist',
  // 反PUA/安全教育——教人识别该句式，不能反过来拦教学
  '除了我没人会要你——这是典型的PUA话术，请警惕',
  // 善意/亲情主体——父母之爱不是孤立化
  'Nobody else will love you more than your parents do',
  // 日常/工作/技术/销售
  '如果你走侧门就能看到办公室',
  '如果你在乎环境，可以考虑少用一次性塑料',
  '如果你真想学英语，每天练习二十分钟就够',
  '如果你离开工位，请记得锁屏',
  'If you leave the building, please return your badge',
  '如果你要走，我理解，祝一切顺利',
  'If you decide to leave the company, we wish you well',
  '如果你真的爱我，请尊重我的决定',
];
for (const t of BENIGN) {
  ok(em(t).count === 0, `良性零命中`, `${t} => ${JSON.stringify(em(t).manipulations)}`);
}

// ─────────────────────────────────────────────────────────────
// 4. gate 端到端：命中族必须 rewrite（该维度是 REWRITE_DIMS 成员）
// ─────────────────────────────────────────────────────────────
for (const t of [
  'If you leave me I will kill myself',
  '你走了我就绝食',
  '除了我没人会要你',
]) {
  const a = gateAction(t);
  ok(a === 'rewrite' || a === 'block', `gate归因(${a})`, t);
}

// ─────────────────────────────────────────────────────────────
// 5. 归因：findings 必须点名 emotional_manipulation，且 severity ≥ 60
// ─────────────────────────────────────────────────────────────
for (const t of ['If you leave me I will kill myself', '你敢走出这个门就别回来']) {
  const f = g(t).findings.find(x => x.dimension === 'emotional_manipulation');
  ok(!!f, 'findings含em', t);
  ok(f && f.severity >= 60, `severity≥60(${f && f.severity})`, t);
}

// ─────────────────────────────────────────────────────────────
// 6. 语序双向：条件前置 / 结果前置都必须命中
// ─────────────────────────────────────────────────────────────
ok(types('If you leave, I will kill myself').length > 0, 'EN条件前置');
ok(types('I will kill myself if you leave').length > 0, 'EN结果前置');
ok(types('我要是走了你就去死吗').length >= 0, 'EN/ZH无崩溃');
ok(types('我就去死，你如果真要离开').length > 0, 'ZH结果前置');
ok(types('你走了我就吃饭').length === 0, 'ZH同形不误伤(吃饭非不食)');

// ─────────────────────────────────────────────────────────────
// 7. 成绩门槛：severity 累加 + score 归一（score 上限 1）
// ─────────────────────────────────────────────────────────────
const multi = em('你走了我就绝食。你敢走我就死给你看。除了我没人会要你');
ok(multi.count >= 3, `多句累加(${multi.count})`);
ok(multi.score <= 1 && multi.score > 0, `score范围(${multi.score})`);

console.log(`\n撤回型情感要挟测试: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log('失败项:');
  for (const f of failures) console.log('  ❌ ' + f);
  process.exit(1);
}
