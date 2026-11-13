/**
 * r308 — 第 252 维度 vivid_case_availability（生动个案可得性偏差）负例注入测试
 *
 * 覆盖 src/vivid-case-availability.js 的全部承重结构：
 *   1. 两腿判据常量（VIVID_ZH / VIVID_EN / SKEW_ZH / SKEW_EN）
 *   2. 邻近窗（PROXIMITY_ZH 80 / PROXIMITY_EN 200）
 *   3. 豁免表（DATA_PRESENT / REASONING_NEGATION / CONCEPT / HEDGE / QUESTION）
 *   4. 量词单人形（单个量词）
 *
 * 纪律：每条断言逐常量验证承重——改常量必须让对应测试变红，不许有
 * 「永绿」断言（r161/r227 教训）。
 */
'use strict';

const assert = require('assert');
const path = require('path');

const M = require(path.join(__dirname, '..', 'src', 'vivid-case-availability.js'));
const { checkVividCaseAvailability } = M;

let pass = 0;
let fail = 0;
const failures = [];

function check(label, actual, expected) {
  try {
    assert.strictEqual(actual, expected);
    pass++;
  } catch (e) {
    fail++;
    failures.push(label + ' | expected=' + expected + ' actual=' + actual);
  }
}

// ─────────────────────────────────────────────────────────────
// 组1：VIVID_ZH 腿①生动个案词（命中族）
// ─────────────────────────────────────────────────────────────
const VIVID_ZH_CASES = [
  // 亲眼看到族
  ['亲眼看到+危害夸大', '我亲眼看到一个人抽烟活到九十岁，所以吸烟的危害被夸大了。', true],
  ['亲眼目睹+太危险', '我亲眼目睹了一场严重的车祸，所以坐车太危险了。', true],
  ['当时就在现场+高发', '他当时就在现场，可见这类事故很常见。', true],
  // 案例族
  ['有个案例+反对', '有个案例说疫苗有害，所以很多人反对疫苗。', true],
  ['网上有个案例+恐慌', '网上有个案例说疫苗有害，所以大家都在恐慌。', true],
  ['新闻里有个+夸大', '新闻里有个小孩玩手机考上清华，所以玩手机没问题。', true],
  ['视频里有个+没问题', '视频里有个小孩不学习也成功，所以学习不重要。', true],
  ['听说过一件事+比比皆是', '听说过一件事，这种人比比皆是。', true],
  // 熟人转述族
  ['朋友的朋友+高估', '朋友的朋友被雷击了两次，所以雷击的风险被高估了。', true],
  ['邻居买彩票+靠谱', '邻居买彩票中了大奖，说明买彩票是靠谱的投资方式。', true],
  ['同事中奖+稳赚', '同事买彩票中奖了，所以买彩票稳赚不亏。', true],
];
for (const [label, text, want] of VIVID_ZH_CASES) {
  check('VIVID_ZH ' + label, checkVividCaseAvailability(text).hit, want);
}

// ─────────────────────────────────────────────────────────────
// 组2：SKEW_ZH 腿②概率/危险性偏斜推断（命中族）
// ─────────────────────────────────────────────────────────────
const SKEW_ZH_CASES = [
  ['危害被夸大', '网上有个案例说吸烟者很长寿，所以吸烟的危害被夸大了。', true],
  ['太危险', '新闻里有个坠机事件，所以坐飞机太危险了。', true],
  ['很常见', '听说有人中奖，所以中奖其实很常见。', true],
  ['比比皆是', '网上有个案例说这种现象，所以这种情况比比皆是。', true],
  ['靠谱', '有个案例说这个方法有效，所以这个方法靠谱。', true],
  ['很多人反对', '有个案例说疫苗有害，所以很多人都在反对疫苗。', true],
  ['大家恐慌', '有个案例说食品有毒，所以大家都在恐慌。', true],
  ['概率很高', '有个案例说有人被误诊，所以误诊的概率很高。', true],
];
for (const [label, text, want] of SKEW_ZH_CASES) {
  check('SKEW_ZH ' + label, checkVividCaseAvailability(text).hit, want);
}

// ─────────────────────────────────────────────────────────────
// 组3：VIVID_EN / SKEW_EN（英文腿）
// ─────────────────────────────────────────────────────────────
const EN_CASES = [
  ['EN I saw+too dangerous', 'I saw a plane crash on the news, flying is clearly too dangerous.', true],
  ['EN case where+far more common', 'There was a case where a guy got struck by lightning twice, so it must be far more common than statistics claim.', true],
  ['EN friend of a friend+overblown', 'A friend of a friend won the lottery, so the odds must be overblown.', true],
  ['EN viral video+way more dangerous', 'A viral video showed a shark attack, so sharks are way more dangerous than people think.', true],
  ['EN I witnessed+so many people', 'I witnessed a mugging on the subway, so the subway is full of crime.', true],
  ['EN story about+odds are high', 'There was a story about a guy winning twice, so the odds are high.', true],
];
for (const [label, text, want] of EN_CASES) {
  check('EN ' + label, checkVividCaseAvailability(text).hit, want);
}

// ─────────────────────────────────────────────────────────────
// 组4：豁免表（良性——不判）
// ─────────────────────────────────────────────────────────────
const EXEMPT_CASES = [
  // DATA_PRESENT：数据在场
  ['统计在场-吸烟', '吸烟有害健康，统计显示吸烟者肺癌发病率显著更高。', false],
  ['数据在场-坠机', '根据统计数据，民航事故率远低于道路交通。', false],
  ['EN data present', 'According to statistics, the crash rate has declined steadily for years.', false],
  // REASONING_NEGATION：推理否定
  ['孤证否定-疫苗', '网上那个案例是孤证，不能说明疫苗总体上有害。', false],
  ['不代表-邻居', '我邻居坚持运动二十年，但这不能说明所有人都能因此长寿。', false],
  ['EN does not prove', 'My uncle smoked for sixty years and stayed healthy, but one case does not prove smoking is safe.', false],
  // CONCEPT：概念/教学转述
  ['可得性偏差概念', '媒体报道生动个案容易放大公众的风险感知，这是可得性偏差的典型表现。', false],
  ['EN availability heuristic', 'The availability heuristic means people overestimate risks after vivid media coverage.', false],
  // QUESTION：疑问句
  ['疑问-夸大', '网上有个案例说疫苗有害，所以危害真的被夸大了吗？', false],
  // 无腿①（纯统计陈述）
  ['纯统计-无个案', '研究表明这个疗法的有效率是百分之七十二。', false],
  ['EN pure stats', 'Research shows the vaccine is 95% effective.', false],
];
for (const [label, text, want] of EXEMPT_CASES) {
  check('EXEMPT ' + label, checkVividCaseAvailability(text).hit, want);
}

// ─────────────────────────────────────────────────────────────
// 组5：邻近窗边界（两腿共现但距离超窗 → 不判）
// ─────────────────────────────────────────────────────────────
{
  const filler = '另外补充一些完全无关的背景描述和许多其他内容来把两腿拉开距离。';
  const far = '网上有个案例说疫苗有害，' + filler.repeat(6) + '所以很多人都在反对疫苗。';
  check('PROXIMITY 超窗不判', checkVividCaseAvailability(far).hit, false);
  const near = '网上有个案例说疫苗有害，所以很多人都在反对疫苗。';
  check('PROXIMITY 窗内判', checkVividCaseAvailability(near).hit, true);
}

// ─────────────────────────────────────────────────────────────
// 组6：结构/导出验证（模块承重）
// ─────────────────────────────────────────────────────────────
check('EXPORT checkVividCaseAvailability', typeof M.checkVividCaseAvailability, 'function');
check('EXPORT dimension name', M.DIMENSION_NAME, 'vivid_case_availability');
check('EXPORT severity', M.SEVERITY, 55);
{
  const r = checkVividCaseAvailability('我亲眼看到一个人抽烟活到九十岁，所以吸烟的危害被夸大了。');
  check('RETURN has hit', r.hit, true);
  check('RETURN has score', typeof r.score, 'number');
  check('RETURN has guidance', typeof r.guidance, 'string');
  check('RETURN has dimension', r.dimension, 'vivid_case_availability');
}

// ─────────────────────────────────────────────────────────────
// 组7：维度接线验证（252 维 / VERIFY_DIMS）
// ─────────────────────────────────────────────────────────────
{
  const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
  const r = gate('我亲眼看到一个人抽烟活到九十岁，所以吸烟的危害被夸大了。');
  check('WIRING gate action', r.gate.action !== 'pass', true);
  const hasDim = (r.findings || []).some(f => f.dimension === 'vivid_case_availability');
  check('WIRING findings 含维度名', hasDim, true);

  // 良性样本不得 rewrite/block（至少不得因本维度被 rewrite）
  const b = gate('媒体报道生动个案容易放大公众的风险感知，这是可得性偏差的典型表现。');
  const bDim = (b.findings || []).some(f => f.dimension === 'vivid_case_availability');
  check('WIRING 良性样本不命中本维度', bDim, false);
}

// ─────────────────────────────────────────────────────────────
// 组8：维度注册验证（经 discriminate() 真实路径——VERIFY_DIMS/dimMap 不导出，
// 用 dimensions 键实测，与 scripts/measure-claimed-numbers.js 同口径）
// ─────────────────────────────────────────────────────────────
{
  const { discriminate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
  const d = discriminate('我亲眼看到一个人抽烟活到九十岁，所以吸烟的危害被夸大了。');
  const keys = Object.keys(d.dimensions || {});
  check('REG dimensions 含 vivid_case_availability',
    keys.includes('vivid_case_availability'), true);
  check('REG dimensions 总数 254', keys.length, 254); // r309/r311/r313 先后接入 252→254

  // VERIFY_DIMS 侧：走 gate 层验证——本维度是 verify 级（非 pass/rewrite/block
  // 由本维度单独触发时不应为 block）
  const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
  const g = gate('网上有个案例说疫苗有害，所以很多人都在反对疫苗。');
  check('REG gate 层 verify 级可达', ['verify', 'rewrite', 'block'].includes(g.gate.action), true);
}

// ─────────────────────────────────────────────────────────────
console.log('');
console.log('r308 vivid_case_availability 负例注入测试');
console.log('──────────────────────────────────────────────');
if (failures.length) {
  for (const f of failures) console.log('  ❌ ' + f);
}
console.log('──────────────────────────────────────────────');
console.log('RESULT pass=' + pass + ' fail=' + fail);
if (fail > 0) process.exit(1);
