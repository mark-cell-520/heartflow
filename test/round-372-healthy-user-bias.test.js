'use strict';
// round-372：健康使用者偏倚/健康依从者效应新子族（econ_reasoning_gate 第 27
// 子族 / 插件层第 32 族）。r372 立项探针（scripts/round-372/probe-r372-pool.js，
// v6.8.190 pristine 基线）：16 候选同池定拨——A adverse_selection 攻击 5/5 但
// 被存量维度全代拦边际零；B moral_hazard 2/5、C free_rider 1/4、D 合成谬误
// 2/5、F illicit_process 3/4 全被 absolute_claim 代拦、G 概率相加 4/4 全被
// perfect_error 代拦、H zero_risk_bias 良性 3/4 非 pass 边界脏；**M
// healthy_user_bias 攻击穿透 8/16 真零命中 + 良性 0/4 零误伤**——唯一
// 「存量零覆盖 × 良性边界全净」候选。二段扩样深探（probe-r372-healthyuser.js，
// 16 攻击 + 12 良性风险）：攻击 8/16 穿透（另 8/16 被 reverse_causation/
// fallacy_of_relevance/confidence 代拦），良性 10/12 pass（2 条非 pass 系存量
// 维度误拦）。落地后 gate 层复跑：攻击 16/16 非 pass 且 econ_reasoning_gate
// 归因 healthy_user_bias 族；良性 19/19 本族零增量（5 条非 pass 均系存量维度
// 代拦：unsupported_claim/stereotype/mediator_confusion/sealioning/empty_answer）。
// 新增 src/healthy-user-bias.js（两腿：腿①健康行为/依从群体 × 腿②归因断言，
// 缺一不判；腿②只收归因不收裸结果——「每天跑步的人体检指标全面更好」是
// 观察陈述不判；CONCEPT/CORRECT 两组豁免均承重；腿①否定守卫解「不吃维生素
// 的人」对照组形，腿②强否定守卫解「不能保证有效」对冲形）。src/index.js
// 零改动、VERSION 不 bump（真升级②：已有聚合族全新措辞家族）。海外扫描：
// arXiv 两轮各 15 条全 OR 展开噪声零相关、GitHub repos 0、S2 429 限流——
// 空返，按既有形态自建。
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
const { checkEconReasoningGate, FAMILIES: GATE_FAMS } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
const { detectHealthyUserBias: detect } = require(path.join(ROOT, 'src', 'healthy-user-bias.js'));

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + ' :: ' + e.message); }
}
function actionOf(text) { const r = gcheck(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) {
  const r = gcheck(text);
  return (r.findings || []).map(f => f.dimension);
}

// ─── A 攻击样本：gate 层非 pass 且 econ_reasoning_gate 归因 ───
const ATTACK_ZH = [
  '吃维生素的人明显更健康，所以维生素让人健康。',
  '坚持复诊的病人死亡率更低，复诊本身就是延长生命的良方。',
  '数据摆在这：每天跑步的人体检指标全面更好，跑步就是健康的保证。',
  '长期吃保健品的人群住院率显著低，说明这些补充剂真的防病。',
  '依从性好的患者预后更佳，因此只要按时吃药就能战胜疾病。',
  '常年吃鱼油的人几乎不失眠，鱼油对睡眠有奇效。',
  '主动参加体检的人得癌概率更低，体检本身就能防癌。',
  '喝红酒的人心血管病更少，红酒保护心脏实锤了。',
  '经常散步的老人感冒明显少，散步就是最好的疫苗。',
  '按时吃药的人复发率低，说明这药对谁都管用。',
];
const ATTACK_EN = [
  'People who take supplements are healthier, which proves the supplements work.',
  'Patients who adhere to their medication have lower mortality, so adherence itself extends life.',
  'Regular joggers have better checkup numbers across the board, so jogging guarantees health.',
  'Wine drinkers have fewer heart attacks, which shows that wine protects the heart.',
  'Seniors who walk every day catch far fewer colds, so walking is the best vaccine.',
  'Those who take their pills on schedule relapse less, which means the drug works for everyone.',
];

console.log('### A 攻击样本 gate 层');
check('A1 ZH 攻击 10/10 非 pass 且 econ_reasoning_gate 归因', () => {
  for (const t of ATTACK_ZH) {
    const a = actionOf(t);
    assert(a !== 'pass', 'pass :: ' + t);
    assert(dimsOf(t).includes('econ_reasoning_gate'), '未归因 econ_reasoning_gate :: ' + t + ' :: ' + dimsOf(t));
  }
});
check('A2 EN 攻击 6/6 非 pass 且 econ_reasoning_gate 归因', () => {
  for (const t of ATTACK_EN) {
    const a = actionOf(t);
    assert(a !== 'pass', 'pass :: ' + t);
    assert(dimsOf(t).includes('econ_reasoning_gate'), '未归因 econ_reasoning_gate :: ' + t + ' :: ' + dimsOf(t));
  }
});

// ─── B 模块层命中 + gate 桥聚合 ───
console.log('### B 模块层');
check('B1 攻击 16/16 模块命中', () => {
  for (const t of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = detect(t);
    assert(r && r.hit, 'miss :: ' + t);
    assert(r.dimension === 'healthy_user_bias', 'dimension 字段异常 :: ' + t);
    assert(typeof r.guidance === 'string' && r.guidance.length > 50, 'guidance 缺失 :: ' + t);
  }
});
check('B2 gate 桥聚合含 healthy_user_bias 族', () => {
  const r = checkEconReasoningGate(ATTACK_ZH[0]);
  assert(r && r.hit, 'gate 桥未命中');
  const keys = (r.families || []).map(f => f.key);
  assert(keys.includes('healthy_user_bias'), '聚合 families 缺 healthy_user_bias :: ' + keys);
});

// ─── C 良性样本零误伤（模块零命中 + gate findings 不含 econ_reasoning_gate）──
console.log('### C 良性样本');
const BENIGN = [
  // 纯结果陈述（无归因断言——腿②缺省，本族设计边界）
  '每天跑步的人体检指标全面更好。',
  '数据显示补充剂使用者住院率更低。',
  // 概念教学（点名健康使用者偏倚/依从者效应）
  '健康使用者偏倚是指把补充剂使用者更健康直接当成补充剂让人健康的证据的错误。',
  'The healthy-user effect confounds treatment benefits with pre-existing health.',
  // 混杂讨论/正确限定（可能/自选择/相关不等于/这与……有关）
  '吃维生素的人更健康，可能因为他们本来就更注重健康管理。',
  '吃维生素的人更健康，可能说明维生素有效，但这只是自选择混杂。',
  '锻炼习惯与收入、教育水平相关，这些因素都会影响健康结果。',
  '复诊率高的患者死亡风险低，研究者认为这与疾病严重程度有关。',
  '该研究发现规律运动的人认知衰退更慢，但作者承认可能存在自选择。',
  '长期服用他汀的人群死亡率更低，但这可能反映的是健康使用者效应。',
  '常吃巧克力的人更不容易中风？相关不等于因果，需要进一步验证。',
  '观察性研究中依从性混杂很常见，不能据此下因果结论。',
  '需要随机对照才能区分干预效果与依从者自选择。',
  '补充剂使用者往往同时有多种健康习惯，单一归因并不成立。',
  '主动体检者健康意识强，其健康结果不能直接归功于体检。',
  'This supplement may help some people, but the observational data cannot prove it works.',
  'Those who do not take supplements are just as healthy as those who do.',
  // 对照组/否定群体形 + 对冲形
  '不吃维生素的人反而更健康，这说明维生素没有效果。',
  '不能保证吃保健品的人就更健康，个体差异很大。',
  // 无关句（不同族射程）
  '买保险的都是身体不好的，健康的人根本不会买。',
];
check('C1 良性 21/21 模块零命中', () => {
  for (const t of BENIGN) {
    const r = detect(t);
    assert(!(r && r.hit), '误命中 :: ' + t);
  }
});
check('C2 良性 21/21 gate findings 不含 econ_reasoning_gate（本族零增量）', () => {
  // 存量维度可能对个别良性句 verify（r372 实测 5 条：unsupported_claim/
  // stereotype/mediator_confusion/sealioning/empty_answer 代拦——非本族
  // 增量，上线前后一致）；本族必须令 gate findings 不出现 econ_reasoning_gate。
  for (const t of BENIGN) {
    assert(!dimsOf(t).includes('econ_reasoning_gate'), '本族在良性句新增 gate 增量 :: ' + t);
  }
});

// ─── D 豁免/判据结构逐组证明 ───
console.log('### D 豁免与判据结构');
check('D1 CONCEPT 豁免（概念教学，须框架词共现）', () => {
  const t = '健康使用者偏倚是指把补充剂使用者更健康直接当成补充剂让人健康的证据的错误。';
  const r = detect(t);
  assert(!(r && r.hit), 'CONCEPT 未豁免');
});
check('D1b CONCEPT 不收裸概念名（前缀绕过防护）', () => {
  // 「别再拿健康使用者偏倚说事」无框架词——必须照常命中，防概念名前缀绕过
  const t = '别再拿健康使用者偏倚说事，吃维生素的人明显更健康，所以维生素让人健康。';
  const r = detect(t);
  assert(r && r.hit, '裸概念名被误豁免');
});
check('D1c EN CONCEPT 豁免（textbook pitfall 框架词）', () => {
  const t = 'The healthy-user effect is a classic textbook pitfall: people who take supplements are healthier, and makers cite that as proof their product works.';
  const r = detect(t);
  assert(!(r && r.hit), 'EN CONCEPT 未豁免');
});
check('D2 CORRECT 豁免（混杂讨论——可能因为本来就更注重健康管理）', () => {
  const t = '吃维生素的人更健康，可能因为他们本来就更注重健康管理。';
  const r = detect(t);
  assert(!(r && r.hit), 'CORRECT 未豁免');
});
check('D2b CORRECT 豁免（自选择混杂承认）', () => {
  const t = '吃维生素的人更健康，可能说明维生素有效，但这只是自选择混杂。';
  const r = detect(t);
  assert(!(r && r.hit), '自选择混杂承认未豁免');
});
check('D2c EN CORRECT 豁免（might + self-selection confounds）', () => {
  const t = 'People who take supplements might be healthier, and this might suggest the supplements work, but self-selection confounds it.';
  const r = detect(t);
  assert(!(r && r.hit), 'EN CORRECT 未豁免');
});
check('D3 纯结果陈述不判（腿②缺省——观察转述不是归因）', () => {
  const t = '每天跑步的人体检指标全面更好。';
  const r = detect(t);
  assert(!(r && r.hit), '纯结果陈述误判');
});
check('D4 缺腿①不判（有归因断言，无行为群体）', () => {
  const t = '维生素让人健康，这是公认的常识。';
  const r = detect(t);
  assert(!(r && r.hit), '缺腿①误判');
});
check('D5 缺腿②不判（有行为群体，无归因断言）', () => {
  const t = '主动体检的人往往更注重自身健康状况。';
  const r = detect(t);
  assert(!(r && r.hit), '缺腿②误判');
});
check('D6 对照组形不判（腿①否定守卫——「不吃维生素的人」）', () => {
  const t = '不吃维生素的人反而更健康，这说明维生素没有效果。';
  const r = detect(t);
  assert(!(r && r.hit), '对照组形误判');
});
check('D6b EN 对照组形不判（those who do not take）', () => {
  const t = 'Those who do not take supplements are just as healthy as those who do.';
  const r = detect(t);
  assert(!(r && r.hit), 'EN 对照组形误判');
});
check('D7 对冲形不判（腿②强否定——「不能保证……有效」）', () => {
  const t = '不能保证吃保健品的人就更健康，个体差异很大。';
  const r = detect(t);
  assert(!(r && r.hit), '对冲形误判');
});
check('D8 EN 强否定不判（does not prove）', () => {
  const t = 'People who take supplements are healthier, but that does not prove the supplements work.';
  const r = detect(t);
  assert(!(r && r.hit), 'EN 强否定误判');
});
check('D9 超距不判（群体与归因断言相距过远）', () => {
  const t = '各种让人健康的宣传铺天盖地：广告牌、直播带货、明星代言、药店最显眼的位置，一应俱全。而实际上，吃维生素的人往往同时有多种健康习惯。';
  const r = detect(t);
  assert(!(r && r.hit), '超距误判');
});

// ─── E 负例注入：逐条删掉本轮每个承重模式，断言守卫必须翻转 ───
console.log('### E 负例注入');
// 每条样本对所注入常量单源承重（删后守卫翻转）。腿①四分组（ZH A/B、EN A/B）
// 与腿②两分组各自配单源样本；CONCEPT/CORRECT 基线被豁免（不命中），删后
// 翻红——证明两组豁免均为承重而非死重。
const INJ = {
  // 腿① ZH A 形（动词+群体名词）
  GROUP_ZH_A: ['吃维生素的人明显更健康，所以维生素让人健康。'],
  // 腿① ZH B 形（产品名+集体名词，动词缺席——红酒爱好者）
  GROUP_ZH_B: ['红酒爱好者心血管病更少，说明红酒保护心脏。'],
  // 腿① EN A 形（who 定语从句）
  GROUP_EN_A: ['People who take supplements are healthier, which proves the supplements work.'],
  // 腿① EN B 形（修饰名词族 regular joggers）
  GROUP_EN_B: ['Regular joggers have better checkup numbers across the board, so jogging guarantees health.'],
  // 腿② 归因断言
  CAUSAL_ZH: ['吃维生素的人明显更健康，所以维生素让人健康。'],
  CAUSAL_EN: ['People who take supplements are healthier, which proves the supplements work.'],
  // 豁免承重证明：基线被豁免不命中，删常量后翻红
  CONCEPT_ZH: ['健康使用者偏倚是指把补充剂使用者更健康直接当成补充剂让人健康的证据的错误。'],
  CONCEPT_EN: ['The healthy-user effect is a classic textbook pitfall: people who take supplements are healthier, and makers cite that as proof their product works.'],
  CORRECT_ZH: ['吃维生素的人更健康，可能说明维生素有效，但这只是自选择混杂。'],
  CORRECT_EN: ['People who take supplements might be healthier, and this might suggest the supplements work, but self-selection confounds it.'],
};
let injTotal = 0, injFlipped = 0;
for (const [key, samples] of Object.entries(INJ)) {
  check('E 注入删 ' + key + ' → ' + samples.length + ' 样本守卫翻转', () => {
    for (const t of samples) {
      injTotal++;
      const base = detect(t);
      const inj = detect(t, { [key]: [] });
      const baseHit = !!(base && base.hit);
      const injHit = !!(inj && inj.hit);
      assert(baseHit !== injHit, '守卫未翻转（base=' + baseHit + ' inj=' + injHit + '）:: ' + key + ' :: ' + t);
      if (baseHit !== injHit) injFlipped++;
    }
  });
}

// ─── F 存量回归（不抢同组其它子族样本 + 存量族仍工作）──
console.log('### F 存量回归');
check('F1 mercantilism 攻击样本不被本族拦', () => {
  const r = detect('出口大于进口才叫赚钱，顺差越大越占便宜。');
  assert(!(r && r.hit), 'healthy_user_bias 抢 mercantilism 样本');
});
check('F2 decoy_effect 攻击样本不被本族拦', () => {
  const r = detect('基础版功能这么少，专业版只贵一点就显得特别划算。');
  assert(!(r && r.hit), 'healthy_user_bias 抢 decoy_effect 样本');
});
check('F3 paradox_of_thrift 攻击样本不被本族拦', () => {
  const r = detect('如果人人都不消费、多储蓄，总需求不会受影响，经济照样增长。');
  assert(!(r && r.hit), 'healthy_user_bias 抢 paradox_of_thrift 样本');
});
check('F4 confounding_by_indication 攻击样本不被本族拦（r339 近邻边界）', () => {
  const r = detect('重病患者才用这种药，所以是用药导致死亡。');
  assert(!(r && r.hit), 'healthy_user_bias 抢 confounding_by_indication 样本');
});
check('F5 reverse_causation 攻击样本不被本族拦（近邻边界）', () => {
  const r = detect('不是锻炼让人健康，而是健康的人才去锻炼。');
  assert(!(r && r.hit), 'healthy_user_bias 抢 reverse_causation 样本');
});
check('F6 存量 benign 语料零误命中（官方良性集形状）', () => {
  const benign = [
    '两个人的合作比一个人单干更有效率。',
    '机会成本是经济学的基础概念，指被放弃的替代用途的价值。',
    'The regression controls for age, income, and baseline health status.',
    '家庭应该为退休和意外建立应急储蓄，这是稳健的理财习惯。',
    '吃早餐是一天中最重要的一餐，食堂的早餐搭配很合理。',
    'The study enrolled 1,200 participants and followed them for five years.',
  ];
  for (const t of benign) {
    const r = detect(t);
    assert(!(r && r.hit), '误命中官方良性形状 :: ' + t);
  }
});
check('F7 存量 econ 子族聚合仍工作（mercantilism 直调）', () => {
  const r = checkEconReasoningGate('出口大于进口才叫赚钱，顺差越大越占便宜。');
  assert(r && r.hit, 'mercantilism 存量族不再命中');
  const keys = (r.families || []).map(f => f.key);
  assert(keys.includes('mercantilism'), '存量 mercantilism 族丢失 :: ' + keys);
});

// ─── G 登记纪律 ───
console.log('### G 登记');
check('G1 gate 桥族表含 healthy_user_bias(r372) 且计数 35（r379 flat_rate_bias 入表后 34→35）', () => {
  assert(GATE_FAMS.some(f => f.key === 'healthy_user_bias' && f.round === 'r372'), 'gate 桥缺 healthy_user_bias');
  assert.strictEqual(GATE_FAMS.length, 37, 'gate 桥计数 ' + GATE_FAMS.length);
});
check('G2 插件族表含 healthy_user_bias(r372) 且计数 34（r373/r374 扩族义务：32→33→34，28 econ + 6 stats）', () => {
  assert(plugin.FAMILIES.some(f => f.key === 'healthy_user_bias' && f.round === 'r372'), '插件缺 healthy_user_bias');
  assert.strictEqual(plugin.FAMILIES.length, 42, '插件计数 ' + plugin.FAMILIES.length);
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'econ').length, 36, 'econ 计数异常');
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 6, 'stats 计数异常');
});
check('G3 插件 analyze(only=healthy_user_bias) 路由可用', () => {
  const r = plugin.analyze(ATTACK_ZH[0], { only: 'healthy_user_bias' });
  assert(r && r.totalHits > 0 && r.families.length === 1 && r.families[0].key === 'healthy_user_bias', 'only 路由异常');
});
check('G4 claims.jsonl 含 r372 认领（agent-4/dimension）', () => {
  const claims = fs.readFileSync(path.join(ROOT, 'coordination', 'claims.jsonl'), 'utf8')
    .split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } });
  assert(claims.some(c => c && c.round === 'r372' && c.agent === 'agent-4' && c.kind === 'dimension'), '缺 r372 认领');
});
check('G5 VERSION 未被 r372 改动（基线 6.8.192）', () => {
  const v = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  // r372 聚合族扩族、src/index.js 零改动、dimMap 键数不变，VERSION 不 bump。
  assert.strictEqual(v, '6.8.192', 'VERSION 应为 6.8.192（r385 基线同步：r380 duration_neglect bump），实为 ' + v);
});

console.log('\n测试结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
console.log('负例注入: ' + injFlipped + '/' + injTotal + ' 翻转');
process.exit(fail === 0 ? 0 : 1);
