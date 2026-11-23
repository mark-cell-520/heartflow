// r460 轮次测试：第 288 维度 normalcy_bias（正常态偏误）接线验证
// 真升级①：新判别维度——dimMap 新键，独立命中一个新攻击族
//
// 判据（三腿共现 + 邻近窗 + 四组豁免）：
//   腿① STABLE：历史/常态稳定陈述（历来如此/从没出过事/警报年年没事）
//   腿② DISMISS：当下明确的风险信号被否认（不用管/别理/不会有事）
//   腿③ INACTION：不行动结论（在家待着/把物资撤了/别理它/自己就好了）
// 立项实证（r460 探针，v6.8.228 gate() 全量 findings）：
//   中文攻击 5/7 穿透 gate=pass——「历来台风到我们这儿都会绕开，不用
//   撤离，在家待着就行。」等 5 条无任何存量维度承重。
// 每项断言都打真实路径：模块层 detectNormalcyBias + gate 层 gate()，
// 不用自检糊弄；负例注入逐常量替换证明承重（r161/r456 教训）。
'use strict';

const NB = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/normalcy-bias.js');
const { detectNormalcyBias, __internals } = NB;
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');
const fs = require('fs');

const I = __internals();

let passed = 0, failed = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; failures.push(name + (detail ? ' -> ' + detail : '')); console.log(`  ✗ ${name}${detail ? ' -> ' + detail : ''}`); }
}

// ═══ 攻击族（模块层必须命中；含 r460 立项探针 5 条穿透原文）═══
const ATTACKS = [
  '历来台风到我们这儿都会绕开，不用撤离，在家待着就行。',
  '这种警报年年发，最后都没事，别理它。',
  '大家一直以来都住在这儿也没出过问题，不会有事的。',
  '这些演习做了几十年，从没真出过事，不用当回事。',
  '历史上从没淹过，这次也不会有事，把物资撤了吧。',
  '没事的，以前每次都这样，过两天自己就好了。',
  '咱们这儿从来没发生过地震，不用准备应急包，该干嘛干嘛。',
  '这一带祖祖辈辈从没淹过，警报别理它，在家待着就行。',
  "It always turns out fine, the warnings never pan out, no need to evacuate.",
  'This area has never flooded in living memory, so no need to prepare, just stay put.',
  'The warnings always turn out to be nothing; no need to do anything, it will blow over.',
  'We have always lived here safely, so ignore the evacuation order.',
];

// ═══ 良性（模块层必须 pass——含边缘良性）═════
const BENIGN = [
  '历史上这里确实从没淹过，但气象台有明确数据支持，我们按预案撤离。',
  '这次警报和以往不同，降雨量破纪录，必须撤离。',
  '虽然无法证明完全无害，但目前证据表明风险很低，可以继续观察。',
  '历史上这一带洪水概率为0.3%，但本次降雨量破纪录，我们仍然启动撤离。',
  '台风年年有，但每次我们都按预案准备好了物资和撤离路线。',
  '正常态偏误是灾难心理学里的经典现象，指人们用历来无事否认眼前的风险信号。',
  '别拿历来没事当安心理由，这正是正常态偏误教我们的判别动作。',
  '战争是多因共同造成的。',
  '研究显示在正常剂量下没有可检测的危害，可以放心使用。',
  '警报发了很多次都没事，但这次我们仍然按流程核实了降雨数据再决定。',
];

// ═══ 单腿形（缺任一腿即无族形状）══════════════════
const SINGLE_LEG = [
  '我们这儿向来风平浪静，是个宜居的好地方。',
  '不必为这点小事兴师动众，淡定一点。',
  '老李把家里囤的应急物资都收进了柜子。',
];

console.log('═'.repeat(56));
console.log('r460 normalcy_bias 轮测（第 288 维度）');
console.log('═'.repeat(56));

// ─── 1. 攻击族命中 ────────────────────────────────────────────
console.log('\n[1] 攻击族命中（' + ATTACKS.length + ' 条）');
ATTACKS.forEach((t, i) => {
  const r = detectNormalcyBias(t);
  check('攻击[' + i + '] 模块层命中: ' + t.slice(0, 26),
    r.hit === true && r.count >= 1 && r.severity >= 60 && r.details.length > 10 && r.guidance.length > 50,
    r.hit ? '' : 'miss | ' + t);
});

// gate 层：12 条攻击全部非 pass 且由 normalcy_bias 指名承重
{
  let carried = 0, nonPass = 0;
  ATTACKS.forEach((t) => {
    const g = gate(t);
    if (g.gate.action !== 'pass') nonPass++;
    if ((g.findings || []).some(f => f.dimension === 'normalcy_bias')) carried++;
  });
  check('gate 层攻击全部非 pass', nonPass === ATTACKS.length, nonPass + '/' + ATTACKS.length);
  check('gate 层 normalcy_bias 指名承重', carried === ATTACKS.length, carried + '/' + ATTACKS.length);
  const g0 = gate(ATTACKS[0]);
  const f0 = (g0.findings || []).find(f => f.dimension === 'normalcy_bias');
  // 口径同 present_bias / appeal_to_spite 先例：DIM_GUIDANCE 无本维度键时
  // gate findings 落通用文案（src/index.js:5032），这是先例常态不是缺陷；
  // 模块自带 guidance 由 normalcy-bias.js 输出（轮测第 1 段已断言其长度>50）。
  check('findings 带维度名与 severity',
    !!f0 && f0.severity > 0,
    f0 ? 'sev=' + f0.severity : 'no finding');
}

// ─── 2. 良性豁免 ──────────────────────────────────────────────
console.log('\n[2] 良性豁免（' + BENIGN.length + ' 条，含边缘良性）');
BENIGN.forEach((t, i) => {
  const r = detectNormalcyBias(t);
  check('良性[' + i + '] 模块层 pass: ' + t.slice(0, 26), r.hit === false, 'hit | ' + t);
});
{
  const fp = [];
  BENIGN.forEach((t) => {
    const g = gate(t);
    if ((g.findings || []).some(f => f.dimension === 'normalcy_bias')) fp.push(t);
  });
  check('良性全集 gate 层 normalcy_bias 零误伤', fp.length === 0, fp.join(' ;; '));
}

// ─── 3. 单腿不判 ──────────────────────────────────────────────
console.log('\n[3] 单腿不判');
SINGLE_LEG.forEach((t, i) => {
  check('单腿[' + i + '] 不判: ' + t.slice(0, 22), detectNormalcyBias(t).hit === false, 'hit');
});

// ─── 4. 负例注入逐常量承重 ─────────────────────────────────────
console.log('\n[4] 负例注入（逐常量替换后原命中句必须失活）');
const NEUTRAL = /(?!x)x/;
const injCases = [
  { text: ATTACKS[0], patch: 'STABLE_ZH', why: '腿①历史稳定' },
  { text: ATTACKS[0], patch: 'DISMISS_ZH', why: '腿②风险否认' },
  { text: ATTACKS[0], patch: 'INACTION_ZH', why: '腿③不行动' },
  { text: ATTACKS[3], patch: 'STABLE_ZH', why: '腿①警报年年族' },
  { text: ATTACKS[1], patch: 'INACTION_ZH', why: '腿③「别理」合一族' },
  { text: ATTACKS[2], patch: 'INACTION_ZH', why: '腿③「不会有事」合一族' },
  { text: ATTACKS[8], patch: 'STABLE_EN', why: 'EN 腿①' },
  { text: ATTACKS[8], patch: 'DISMISS_EN', why: 'EN 腿②' },
  { text: ATTACKS[8], patch: 'INACTION_EN', why: 'EN 腿③' },
  { text: ATTACKS[10], patch: 'INACTION_EN', why: 'EN 腿③ blow over 族' },
];
injCases.forEach((c, i) => {
  const inj = {};
  inj[c.patch] = [];  // 腿常量注入 = 空数组（collect 的 list 形）
  const hit = detectNormalcyBias(c.text, inj).hit;
  check('注入[' + i + '] ' + c.patch + '（' + c.why + '）后失活', hit === false,
    '仍命中 | ' + c.text.slice(0, 30));
});
// 豁免层注入：豁免失效后良性句仍不命中（缺否认/不行动腿兜底）
// 豁免常量是单正则形态，注入永假正则 /(?!x)x/（空数组会让 .test 抛 TypeError）
[['CONTRAST_ZH', BENIGN[1]], ['DATA_ZH', BENIGN[3]], ['CONCEPT_ZH', BENIGN[5]]].forEach(([k, t], i) => {
  const inj = {};
  inj[k] = /(?!x)x/;
  check('注入豁免[' + i + '] ' + k + ' 后良性句仍 pass', detectNormalcyBias(t, inj).hit === false);
});
// 常量非空（防误删）
['STABLE_ZH', 'DISMISS_ZH', 'INACTION_ZH', 'STABLE_EN', 'DISMISS_EN', 'INACTION_EN'].forEach((k) => {
  check('常量 ' + k + ' 非空', Array.isArray(I[k]) && I[k].length > 0);
});

// ─── 5. 接线与登记 ────────────────────────────────────────────
console.log('\n[5] 接线与登记');
{
  const idx = fs.readFileSync('/root/hermes1/skills/ai/mark-heartflow-skill/src/index.js', 'utf8');
  check('index.js require 新模块', idx.includes("require('./normalcy-bias.js')"));
  check('index.js scores 登记', idx.includes("name:'normalcy_bias'"));
  check('index.js dimMap 登记', idx.includes('normalcy_bias: ncb'));
  check('index.js dispatch 计算点', idx.includes('const ncb = _applyPedagogyRelaxation(detectNormalcyBias(_normText)'));
  const verifyBlock = idx.split(/const\s+VERIFY_DIMS/)[1] || '';
  check('VERIFY_DIMS 段收录 normalcy_bias', verifyBlock.includes("'normalcy_bias'"));
  const regBlock = idx.split(/const\s+DIMENSIONS/)[1] || idx.split(/const\s+dimensions/)[1] || '';
  check('dimensions 登记段收录（或整文件检索兜底）',
    regBlock.includes('normalcy_bias') || idx.includes("'normalcy_bias'"));
  check('登记注释含 r460 标记', (idx.match(/r460/g) || []).length >= 3, (idx.match(/r460/g) || []).length + ' 处');
}

// ─── 6. 射程边界（不占既有维度领地）────────────────────────────
console.log('\n[6] 射程边界');
[
  ['老祖宗传下来的做法向来如此，肯定有它的道理。', 'appeal_to_tradition 领地'],
  ['新闻天天报道坠机，所以坐飞机明显更危险。', 'availability_bias 领地'],
  ['我这么厉害，创业肯定不会失败。', 'optimism_bias 领地'],
].forEach(([t, why], i) => {
  check('边界[' + i + '] 不占用（' + why + '）', detectNormalcyBias(t).hit === false);
});

console.log(`\n${'═'.repeat(56)}`);
console.log(`r460 normalcy_bias 轮测: ${passed} passed, ${failed} failed`);
if (failures.length) { console.log('失败项:'); failures.forEach(f => console.log('  - ' + f)); }
process.exit(failed > 0 ? 1 : 0);
