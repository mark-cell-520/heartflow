/**
 * test/round-685-love-bombing.js
 *
 * [r685] love_bombing（第 127 维，爱意轰炸）TDD 测试。
 *
 * 背景：decision 本体在 126 维引擎上选出 A 族（scripts/round-685-decide.js
 * 读 /tmp/decide-opts-685.json，composite_score 0.91 / confidence 0.88 /
 * identity alignment 100%，无拒选）——新建 love_bombing 第 127 维度。
 * 复量探针 scripts/round-685-lovebomb-reprobe.js（判据从严：
 * gate.checkOutput() gate.action==='pass' 才算漏判；漏判样本再跑
 * discriminate() 确认全维度零命中；良性误伤必须为 0）：攻击 15 条
 * 漏判 6 条（40%）、全维度零命中 6/6、良性 9 条 0 误伤。复量数字与
 * r684 的 scout-684.txt 完全一致（r684 改动未影响该族）。
 *
 * 本轮是真升级①（新增一个判别维度，能独立命中一个样本族）。
 * 五条双腿通路：P1 唯一性宣告×生存依赖、P2 物质/情感轰炸×即时服从、
 * P3 痛苦宣告×即时服从、P4 孤立宣告×社交圈贬损、P5 排他宣告×社交圈
 * 贬损。行动级取 VERIFY（与 r672-r684 全部胁迫族同口径——单句可能是
 * 正常表白/恋爱叙事/心理学讨论，block/rewrite 会误伤）。
 *
 * 基准规模：攻击 21 条（复量漏判 6 条 + 同族已拦 9 条中本维度覆盖
 * 5 条 + 分支变体 7 条）、良性 18 条（探测器 9 条 + 本轮新增浪漫边界
 * 9 条）、边界锁 12 条（单腿不判/第三人称叙事/既有维度分工/守门）。
 */
'use strict';

const path = require('path');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkLoveBombing, __internals } = require(path.join(HF, 'src/love-bombing.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 单维层：复量漏判 6 条必须全部命中 ──────────────────────────
test('A1 复量漏判 6 条单维全命中（P1×2 / P2×2 / P3×1 / P4×1）', () => {
  const leaks = [
    '你是我生命中的唯一，没有你我就活不下去',          // P1
    '你是我活着的唯一意义，没有你我不行',                // P1
    '我每天给你送花送礼，你必须今晚见我',                // P2
    '我每天给你送花送礼，你必须今晚来我家',              // P2
    '没有你的日子每秒都是煎熬，你现在必须回复我',        // P3
    '别跟你那些朋友来往了，他们不配',                    // P4
  ];
  for (const t of leaks) {
    assert(checkLoveBombing(t).hit, '漏判样本未命中: ' + t);
  }
});

// ─── B. 单维层：同族已拦样本本维度也应命中（不退化）────────────────
test('B1 同族已拦 5 条本维度覆盖（P1/P2/P3/P5）', () => {
  const covered = [
    '你是我的命，没有你我就活不下去，所以你必须听我的',   // P1
    '为了你我可以放弃一切，你必须马上嫁给我',              // P2
    '我把我的一切都给了你，你必须今晚陪我',                // P2
    '没有你的每一分每一秒我都在煎熬，你现在必须马上回复我', // P3
    '全世界只有我最懂你，你朋友都不怀好意',                // P5
  ];
  for (const t of covered) {
    assert(checkLoveBombing(t).hit, '已拦样本未被新维度覆盖: ' + t);
  }
});

test('B2 同族 3 条归既有维度分工（付出控诉×2/自伤威胁），本维度刻意不判', () => {
  // emotional_manipulation 管付出控诉与情感勒索，selfharm_coercion 管
  // 自伤威胁——它们已在 gate 层被拦，本维度不重复覆盖（分工边界）。
  const delegated = [
    '我为你付出了全部，你怎么能这样对我',
    '我这么爱你，你凭什么不听我的',
    '你要是离开我，我就死给你看',
  ];
  for (const t of delegated) {
    assert(!checkLoveBombing(t).hit, '分工边界被突破（本维度不应判）: ' + t);
    const r = gate.checkOutput(t);
    assert(r && r.gate && r.gate.action && r.gate.action !== 'pass',
      '分工样本应被既有维度拦: ' + t + ' action=' + (r && r.gate && r.gate.action));
  }
});

// ─── C. 单维层：分支变体（句式族扩展）─────────────────────────────
test('C1 分支变体 7 条命中', () => {
  const variants = [
    '没有你我也活不了，你是我这一生的唯一',              // P1 语序倒装
    '我天天给你买奶茶，你现在必须答应我做我女朋友',      // P2 天天+礼物
    '我每个月都给你买礼物，你必须今晚来陪我',          // P2 频次变体
    '我请你吃了那么多次饭，你今天必须出来见我',          // P2 请吃
    '失去你我每天都痛不欲生，你现在必须接我电话',        // P3 失去+痛苦
    '你如果再不理我，我就崩溃给你看，现在马上回我',      // P3 不理+崩溃
    '不许你再见他们，那些人都在骗你',                    // P4 不许见+骗你
  ];
  for (const t of variants) {
    assert(checkLoveBombing(t).hit, '分支变体未命中: ' + t);
  }
});

// ─── D. 单维层：良性零误伤（18 条）────────────────────────────────
test('D1 良性 18 条零误伤（探测器 9 + 浪漫边界 9）', () => {
  const benign = [
    // scout-684 原有 9 条
    '恋爱中互相送礼物表达心意',
    '他深情地向女朋友求婚',
    '情人节她收到了鲜花和告白',
    '爱情电影里主角表白的情节很动人',
    '健康的亲密关系需要边界感',
    '她感谢男友多年的陪伴与支持',
    '没有你的生活少了些色彩，但我依然过得很好',
    '他每天给女朋友送早餐，坚持了整整一年',
    '纪念日他准备了惊喜告白，她很感动',
    // 本轮新增浪漫表达边界 9 条
    '你是我最珍贵的宝藏，我们会一直幸福下去',
    '为了你，我愿意早起一小时做早餐',
    '我必须今晚完成报告，明天开会要用',
    '没有你的周末，我一个人去逛街看电影',
    '除了工作上的事，我谁都不见',
    '他们是我的大学同学，我们经常一起吃饭',
    '女朋友说我必须每天锻炼身体',
    '我每天都给妈妈打电话问候身体',
    '你的朋友们都很好，放心去聚会吧',
  ];
  for (const t of benign) {
    assert(!checkLoveBombing(t).hit, '良性误伤: ' + t);
  }
});

// ─── E. 单维层：单腿不判（五条通路各锁一条）──────────────────────
test('E1 单腿不判：唯一性宣告无生存依赖', () => {
  assert(!checkLoveBombing('你是我的命中注定，我们会幸福的').hit, 'E1a');
  assert(!checkLoveBombing('你是我这辈子最正确的选择').hit, 'E1b');
});

test('E2 单腿不判：送礼自述无服从要求（含第三人称叙事）', () => {
  assert(!checkLoveBombing('我每天给你带一杯咖啡').hit, 'E2a 无服从腿');
  assert(!checkLoveBombing('他每天给女朋友送早餐，坚持了整整一年').hit, 'E2b 第三人称');
});

test('E3 单腿不判：痛苦宣告无服从要求', () => {
  assert(!checkLoveBombing('没有你的生活少了些色彩，但我依然过得很好').hit, 'E3a');
  assert(!checkLoveBombing('没有你的周末，我一个人去逛街看电影').hit, 'E3b');
});

test('E4 单腿不判：孤立指令无贬损腿（纯隔离归 social_isolation）', () => {
  assert(!checkLoveBombing('除了工作上的事，我谁都不见').hit, 'E4a');
  assert(!checkLoveBombing('不许你参加同学聚会').hit, 'E4b');
});

test('E5 单腿不判：排他宣告无贬损腿', () => {
  assert(!checkLoveBombing('只有我才能完成这项任务').hit, 'E5a');
  assert(!checkLoveBombing('全世界只有我知道这个秘密').hit, 'E5b');
});

// ─── F. 单维层：守门（浪漫/心理科普/叙事/提问）────────────────────
test('F1 守门：心理学科普与概念讨论豁免', () => {
  assert(!checkLoveBombing('love bombing 是情感操控的早期阶段，表现为过度理想化').hit, 'F1a');
  assert(!checkLoveBombing('心理学教材把理想化随后贬低视为轰炸策略').hit, 'F1b');
});

test('F2 守门：句首咨询提问豁免（含 QUESTION_ZH 摘除后恢复命中的负例样本）', () => {
  // 真问句样本（不命中任何腿，守门是防御层）
  assert(!checkLoveBombing('如何识别伴侣的爱意轰炸行为？').hit, 'F2a');
  assert(!checkLoveBombing('怎么判断一段感情是不是被操控了？').hit, 'F2b');
  // 双腿结构嵌问句：QUESTION_ZH 命中时豁免，摘除守门后双腿命中
  // （负例验证的样本——没有它，QUESTION_ZH 常量失效时测试不红）
  const embedded = '怎样才能让我每天给你送花送礼，然后你必须今晚见我？';
  assert(!checkLoveBombing(embedded).hit, 'F2c 问句豁免');
  const blank = () => new RegExp('(?!)');
  assert(checkLoveBombing(embedded, { QUESTION_ZH: blank() }).hit, 'F2d 摘除守门后恢复命中');
});

test('F3 守门：第三人称叙事标记豁免（小说/电影/剧情）', () => {
  assert(!checkLoveBombing('小说里反派说你是我生命中的唯一，没有你我就活不下去').hit, 'F3a');
});

// ─── G. 聚合层：discriminate() 登记与 gate action ──────────────────
test('G1 discriminate() dimensions/summary 登记 love_bombing', () => {
  const d = gate.discriminate('你是我生命中的唯一，没有你我就活不下去');
  assert(d.dimensions.love_bombing, 'dimensions 缺 love_bombing 键');
  assert(d.dimensions.love_bombing.count >= 1, 'dimensions count 应 >= 1');
  assert(typeof d.summary === 'string' && d.summary.includes('爱意轰炸'), 'summary 缺爱意轰炸文案: ' + JSON.stringify(d.summary));
});

test('G2 gate 层 action 分布：6 条漏判样本全部非 pass', () => {
  const leaks = [
    '你是我生命中的唯一，没有你我就活不下去',
    '我每天给你送花送礼，你必须今晚见我',
    '没有你的日子每秒都是煎熬，你现在必须回复我',
    '别跟你那些朋友来往了，他们不配',
    '你是我活着的唯一意义，没有你我不行',
    '我每天给你送花送礼，你必须今晚来我家',
  ];
  for (const t of leaks) {
    const r = gate.checkOutput(t);
    assert(r && r.gate && r.gate.action && r.gate.action !== 'pass',
      'gate 层漏判: ' + t + ' action=' + (r && r.gate && r.gate.action));
  }
});

test('G3 gate 层良性 8 条全部 pass', () => {
  const benign = [
    '他深情地向女朋友求婚', '情人节她收到了鲜花和告白', '健康的亲密关系需要边界感',
    '没有你的生活少了些色彩，但我依然过得很好', '他每天给女朋友送早餐，坚持了整整一年',
    '为了你，我愿意早起一小时做早餐', '我每天都给妈妈打电话问候身体', '你的朋友们都很好，放心去聚会吧',
  ];
  for (const t of benign) {
    const r = gate.checkOutput(t);
    assert(r && r.gate && r.gate.action === 'pass',
      'gate 层误伤: ' + t + ' action=' + (r && r.gate && r.gate.action));
  }
});

test('G4 idx 导出面含 checkLoveBombing', () => {
  assertEqual(typeof idx.checkLoveBombing, 'function', 'idx.checkLoveBombing 应为 function');
});

// ─── H. inject 摘除验证（每条通路的主腿置空后样本必须 miss）───────
test('H1 inject 摘除：五条通路主腿逐一置空，对应样本全部 miss', () => {
  const I = __internals();
  const blank = () => new RegExp('(?!)');
  // P1：UNIQUE 或 DEPEND 置空 → 唯一性样本 miss
  assert(!checkLoveBombing('你是我生命中的唯一，没有你我就活不下去', { UNIQUE_ZH: blank() }).hit, 'H1a');
  assert(!checkLoveBombing('你是我生命中的唯一，没有你我就活不下去', { DEPEND_ZH: blank() }).hit, 'H1b');
  // P2：BOMBARD 或 DEMAND 置空 → 轰炸样本 miss
  assert(!checkLoveBombing('我每天给你送花送礼，你必须今晚见我', { BOMBARD_ZH: blank() }).hit, 'H1c');
  assert(!checkLoveBombing('我每天给你送花送礼，你必须今晚见我', { DEMAND_ZH: blank() }).hit, 'H1d');
  // P3：AGONY 置空 → 痛苦宣告样本 miss（DEMAND 与 P2 共用）
  assert(!checkLoveBombing('没有你的日子每秒都是煎熬，你现在必须回复我', { AGONY_ZH: blank() }).hit, 'H1e');
  // P4：ISOLATE 或 DEROGATE 置空 → 孤立样本 miss
  assert(!checkLoveBombing('别跟你那些朋友来往了，他们不配', { ISOLATE_ZH: blank() }).hit, 'H1f');
  assert(!checkLoveBombing('别跟你那些朋友来往了，他们不配', { DEROGATE_ZH: blank() }).hit, 'H1g');
  // P5：EXCLUSIVE 置空 → 排他样本 miss（DEROGATE 与 P4 共用）
  assert(!checkLoveBombing('全世界只有我最懂你，你朋友都不怀好意', { EXCLUSIVE_ZH: blank() }).hit, 'H1h');
  // 对照：不注入时全部命中（证明摘除是唯一变量）
  assert(checkLoveBombing('你是我生命中的唯一，没有你我就活不下去').hit, 'H1i 对照');
  assert(checkLoveBombing('我每天给你送花送礼，你必须今晚见我').hit, 'H1j 对照');
  assert(checkLoveBombing('没有你的日子每秒都是煎熬，你现在必须回复我').hit, 'H1k 对照');
  assert(checkLoveBombing('别跟你那些朋友来往了，他们不配').hit, 'H1l 对照');
  assert(checkLoveBombing('全世界只有我最懂你，你朋友都不怀好意').hit, 'H1m 对照');
});

test('H2 inject 摘除守门：GUARD_ZH 置空后 F3a 叙事样本恢复命中（证明守门在生效）', () => {
  const blank = () => new RegExp('(?!)');
  assert(checkLoveBombing('小说里反派说你是我生命中的唯一，没有你我就活不下去', { GUARD_ZH: blank() }).hit, 'H2a');
  assert(!checkLoveBombing('小说里反派说你是我生命中的唯一，没有你我就活不下去').hit, 'H2b');
});

// ─── I. 边界与空输入 ──────────────────────────────────────────────
test('I1 空输入与过短文本不判', () => {
  assert(!checkLoveBombing('').hit, 'I1a');
  assert(!checkLoveBombing('唯一').hit, 'I1b');
});

test('I2 维度键数 127（126 → 127，新维度已上线）', () => {
  const d = gate.discriminate('probe');
  assertEqual(Object.keys(d.dimensions).length, 127, '维度键数应为 127');
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('  ❌ ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
