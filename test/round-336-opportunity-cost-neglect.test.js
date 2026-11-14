'use strict';
/**
 * test/round-336-opportunity-cost-neglect.test.js
 * [r336] 机会成本忽视（opportunity cost neglect）——econ_reasoning_gate
 * 聚合族第 18 子族，r260 backlog 候选重启。
 *
 * 真升级类型②：聚合族全新子家族（src/index.js 零改动、维度计数 256 不变，
 * 同 r332 winners_curse 先例）。
 *
 * 立项缺口实证（coordination/agent4/probes/r336-probe-candidates.js，
 * 集成树 v6.8.185 hf.gate() 全量 findings 口径）：双候选定夺——
 *   · A 机会成本忽视：攻击 15 条 9 条完全穿透（其余被 red_herring/
 *     confidence/fallacy_of_relevance/perfect_error 泛维度代拦，
 *     「不作为 × 零成本幻觉」结构本身零覆盖，与 r260 探针 10/10
 *     结论一致）；r260 记录的三个误伤陷阱（use-it-or-lose-it 预算
 *     制度 / 真正的免费品 / 闲置正确成本描述）在集成树上实测 11/11
 *     零误伤 → **胜出**；
 *   · B 反弹效应（rebound/Jevons）：穿透仅 2/7（unsupported_claim/
 *     absolute_claim/perfect_error 已覆盖大半），真空缺强度不足，放弃。
 *
 * 补丁（新增 src/opportunity-cost-neglect.js）：
 *   腿① INACTION（不作为/不投入在场）ZH 四组 / EN 四组；
 *   腿② ZEROCOST（零成本幻觉断言）ZH 五组 / EN 五组；
 *   窗 PAIR_ZH 60 / PAIR_EN 160；
 *   三组豁免 RULE（use-it-or-lose-it 预算制度）/ CONCEPT（概念教学）/
 *   CORRECT（指出不作为有成本的纠正句）——正面解掉 r260 三个误伤陷阱；
 *   强否定前缀守卫（并非不花钱=其实花了）+ 递进连词不判否定
 *   （不但不花钱还能保住利润是攻击形）。
 *   注册：src/econ-reasoning-gate.js FAMILIES（gate 层）+ 
 *   src/plugins/econ-reasoning-check/index.js FAMILIES（插件层）。
 *
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 + 官方语料
 *   全量）/ D 聚合桥注册 / E 常量级注入-删条承重（腿组 + 窗 + 豁免
 *   逐项）/ F 边界锁（近邻维度领地）/ G 登记纪律。
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const { detectOpportunityCostNeglect, __internals } = require(path.join(ROOT, 'src', 'opportunity-cost-neglect.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const ergMod = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const hit = (t, inj) => detectOpportunityCostNeglect(t, inj).hit === true;

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── 攻击集（ZH 10 + EN 8，覆盖资金闲置/资产闲置/房屋空置/库存堆压/
// 推广/研发/培训/安全加固/时间闲置 × idle cash/unused equipment/
// marketing/maintenance/vacant/time not spent）──
const ATTACK_ZH = [
  '钱放在账户里不动又不会少，不投资就是零成本，稳赚不亏。',
  '设备闲置着也不会产生额外成本，先拖着最稳妥，没有任何损失。',
  '房子空着也是空着，不出租没有任何损失，白占着也不亏。',
  '库存堆在仓库里不用也不会花钱，不处理没有任何代价。',
  '不花钱做推广就是省钱，一分钱不花还能保住利润，何乐而为。',
  '不投入研发没有任何损失，是零成本的选择。',
  '不给员工安排培训也不会亏，不投入就是没有成本。',
  '服务器不做安全加固也不会产生费用，先拖着没损失。',
  '时间不用来学习也不会损失什么，躺着最划算，零成本。',
  '这批货先压在库里，不降价处理也没有任何损失，还能观望。',
];
const ATTACK_EN = [
  'The money sitting idle costs nothing, so not investing is the risk-free choice.',
  'Leaving the equipment unused carries no cost; doing nothing is the free option.',
  'Not spending on marketing saves money at zero cost — a free win.',
  'Skipping maintenance costs nothing as long as the machine still runs.',
  'An empty apartment loses nothing by staying vacant; not renting it is free.',
  'Time not spent learning costs you nothing, so idling is the safest bet.',
  'The cash sitting idle costs nothing to us, so it is risk-free.',
  'Not upgrading the software costs nothing as long as it still runs.',
];

// ─── A. gate 层归因 ────────────────────────────────────────────────
check('A gate 层归因：攻击 18/18 → econ_reasoning_gate findings 且 action≠pass', () => {
  for (const s of [...ATTACK_ZH, ...ATTACK_EN]) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'econ_reasoning_gate');
    assert.ok(f, 'findings 缺 econ_reasoning_gate: ' + s);
  }
});

// ─── B. 模块直调（命中 + detail 带机会成本忽视标 + 聚合桥族名）─────
check('B 模块直调：攻击 ZH 10/10 命中且 detail 带「机会成本忽视」标', () => {
  for (const s of ATTACK_ZH) {
    const r = detectOpportunityCostNeglect(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.details.includes('机会成本忽视'), 'detail 缺族名标: ' + r.details);
  }
});
check('B 模块直调：攻击 EN 8/8 命中且 detail 带 opportunity-cost-neglect 标', () => {
  for (const s of ATTACK_EN) {
    const r = detectOpportunityCostNeglect(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.details.includes('opportunity-cost-neglect'), 'detail 缺族名标: ' + r.details);
  }
});
check('B 聚合桥直调：攻击 18/18 命中且 families 含 opportunity_cost_neglect', () => {
  for (const s of [...ATTACK_ZH, ...ATTACK_EN]) {
    const r = ergMod.checkEconReasoningGate(s);
    assert.strictEqual(r.hit, true, '聚合桥未命中: ' + s);
    const fam = (r.families || []).find(f => f.key === 'opportunity_cost_neglect');
    assert.ok(fam, 'families 缺 opportunity_cost_neglect: ' + s);
  }
});

// ─── C. 良性零误伤 ────────────────────────────────────────────────
const BENIGN = [
  // use-it-or-lose-it 预算制度（r260 陷阱①）
  '按预算制度规定，年度经费到期未使用即作废清零，各部门被要求年底前执行完毕。',
  'The budget rules require use-it-or-lose-it: unspent funds lapse at fiscal year end.',
  // 真正的免费品（r260 陷阱②）
  '空气和水源对村民免费，不花钱也能维持基本生活。',
  'Open-source software is free to use; the community maintains it at no charge.',
  // 正确指出闲置/不作为有成本（r260 陷阱③）
  '设备长期闲置不仅占用资金，还持续折旧损耗，闲置本身就有成本。',
  'Idle cash is not free — it loses value to inflation every year.',
  // 概念教学
  '机会成本忽视是行为经济学经典偏误，指人们系统性低估不作为的代价。',
  'Opportunity cost neglect is a well-documented bias: people undervalue forgone alternatives.',
  // 不作为有真实后果陈述（无幻觉腿）
  '去年没有花钱做营销，靠口碑传播，转化率确实下降了两成。',
  '没有安排新员工培训，上手周期明显变长，返工率上升。',
  // 预算非个人资源
  '这笔预算不花也是财政的，个人没有处置权，谈不上损失。',
  // 否定形
  '他并非不花钱做推广，只是预算还没批下来。',
  'Skipping maintenance is not zero cost — breakdowns cost far more.',
  // 正常经营描述
  '公司决定缩减营销开支，把资源集中到产品研发上。',
];
check('C 良性零误伤：手工良性 16/16 不判', () => {
  for (const s of BENIGN) assert.strictEqual(hit(s), false, '误判: ' + s);
});
check('C 良性零误伤：官方四基准语料全量模块级零命中', () => {
  function flatten(mod) {
    const out = []; const src = mod.SAMPLES || mod.samples || mod.CATEGORIES;
    if (Array.isArray(src)) out.push(...src);
    else if (src && typeof src === 'object') for (const v of Object.values(src)) { if (Array.isArray(v)) out.push(...v); else if (v && Array.isArray(v.samples)) out.push(...v.samples); }
    return out.filter(s => typeof s === 'string');
  }
  let n = 0, fp = 0; const hits = [];
  for (const f of ['gate-benchmark.js', 'gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js']) {
    for (const s of flatten(require(path.join(ROOT, 'test', f)))) {
      n++;
      const r = detectOpportunityCostNeglect(s);
      if (r.hit) { fp++; hits.push(s.slice(0, 60)); }
    }
  }
  assert.ok(n >= 360, '语料条数不足: ' + n);
  assert.strictEqual(fp, 0, '误伤 ' + fp + ' 条: ' + hits.join(' | '));
});

// ─── D. 聚合桥注册 ────────────────────────────────────────────────
check('D 注册：econ-reasoning-gate FAMILIES 含 opportunity_cost_neglect 行', () => {
  const row = ergMod.FAMILIES.find(f => f.key === 'opportunity_cost_neglect');
  assert.ok(row, '聚合桥 FAMILIES 缺行');
  assert.strictEqual(row.mod, './opportunity-cost-neglect.js');
  assert.strictEqual(row.fn, 'detectOpportunityCostNeglect');
  assert.strictEqual(row.round, 'r336');
  assert.strictEqual(row.zh, '机会成本忽视');
});
check('D 注册：插件层 FAMILIES 含 opportunity_cost_neglect 行', () => {
  const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
  const row = (plugin.FAMILIES || []).find(f => f.key === 'opportunity_cost_neglect');
  assert.ok(row, '插件层 FAMILIES 缺行');
  assert.strictEqual(row.group, 'econ');
  assert.strictEqual(row.round, 'r336');
});

// ─── E. 常量级注入-删条承重 ────────────────────────────────────────
// 腿① ZH 四组（样本只依赖被清零组）
check('E 注入 INACTION_NEG_VERB_ZH=[] → 攻击失效', () => {
  assert.strictEqual(hit('不投入研发没有任何损失，是零成本的选择。'), true);
  assert.strictEqual(hit('不投入研发没有任何损失，是零成本的选择。', { INACTION_NEG_VERB_ZH: [] }), false);
});
check('E 注入 INACTION_IDLE_ZH=[] → 攻击失效', () => {
  assert.strictEqual(hit('设备闲置着也不会产生额外成本，没有任何损失。'), true);
  assert.strictEqual(hit('设备闲置着也不会产生额外成本，没有任何损失。', { INACTION_IDLE_ZH: [] }), false);
});
check('E 注入 INACTION_DELAY_ZH=[] → 攻击失效', () => {
  assert.strictEqual(hit('按兵不动也不会产生任何损失，零成本最稳妥。'), true);
  assert.strictEqual(hit('按兵不动也不会产生任何损失，零成本最稳妥。', { INACTION_DELAY_ZH: [] }), false);
});
check('E 注入 INACTION_TIME_ZH=[] → 攻击失效', () => {
  assert.strictEqual(hit('时间不用来学习也不会损失什么，零成本最划算。'), true);
  assert.strictEqual(hit('时间不用来学习也不会损失什么，零成本最划算。', { INACTION_TIME_ZH: [] }), false);
});
// 腿① EN 四组
check('E 注入 INACTION_NOT_EN=[] → 攻击失效', () => {
  assert.strictEqual(hit('Not spending on marketing saves money at zero cost — a free win.'), true);
  assert.strictEqual(hit('Not spending on marketing saves money at zero cost — a free win.', { INACTION_NOT_EN: [] }), false);
});
check('E 注入 INACTION_IDLE_EN=[] → 攻击失效', () => {
  assert.strictEqual(hit('The cash sitting idle costs nothing to us, so it is risk-free.'), true);
  assert.strictEqual(hit('The cash sitting idle costs nothing to us, so it is risk-free.', { INACTION_IDLE_EN: [] }), false);
});
check('E 注入 INACTION_SKIP_EN=[] → 攻击失效', () => {
  assert.strictEqual(hit('Skipping maintenance costs nothing as long as the machine still runs.'), true);
  assert.strictEqual(hit('Skipping maintenance costs nothing as long as the machine still runs.', { INACTION_SKIP_EN: [] }), false);
});
check('E 注入 INACTION_NOTIN_EN=[] → 攻击失效', () => {
  assert.strictEqual(hit('Not upgrading the software costs nothing as long as it still runs.'), true);
  assert.strictEqual(hit('Not upgrading the software costs nothing as long as it still runs.', { INACTION_NOTIN_EN: [] }), false);
});
// 腿② ZH 五组
check('E 注入 ZEROCOST_NOLOSS_ZH=[] → 攻击失效', () => {
  assert.strictEqual(hit('钱放在账户里不动，也不会有任何损失。'), true);
  assert.strictEqual(hit('钱放在账户里不动，也不会有任何损失。', { ZEROCOST_NOLOSS_ZH: [] }), false);
});
check('E 注入 ZEROCOST_ZERO_ZH=[] → 攻击失效', () => {
  assert.strictEqual(hit('设备闲置着，是零成本的选择。'), true);
  assert.strictEqual(hit('设备闲置着，是零成本的选择。', { ZEROCOST_ZERO_ZH: [] }), false);
});
check('E 注入 ZEROCOST_FREEWIN_ZH=[] → 攻击失效', () => {
  assert.strictEqual(hit('不出租也不亏，白占着也无所谓。'), true);
  assert.strictEqual(hit('不出租也不亏，白占着也无所谓。', { ZEROCOST_FREEWIN_ZH: [] }), false);
});
check('E 注入 ZEROCOST_SAVE_ZH=[] → 攻击失效', () => {
  assert.strictEqual(hit('不花钱做推广就是省钱，一分不花还能保住利润。'), true);
  assert.strictEqual(hit('不花钱做推广就是省钱，一分不花还能保住利润。', { ZEROCOST_SAVE_ZH: [] }), false);
});
check('E 注入 ZEROCOST_BEST_ZH=[] → 攻击失效', () => {
  assert.strictEqual(hit('时间不用来学习，躺着最划算。'), true);
  assert.strictEqual(hit('时间不用来学习，躺着最划算。', { ZEROCOST_BEST_ZH: [] }), false);
});
// 腿② EN 五组
check('E 注入 ZEROCOST_NOCOST_EN=[] → 攻击失效', () => {
  assert.strictEqual(hit('The money sitting idle costs nothing to us.'), true);
  assert.strictEqual(hit('The money sitting idle costs nothing to us.', { ZEROCOST_NOCOST_EN: [] }), false);
});
check('E 注入 ZEROCOST_FREE_EN=[] → 攻击失效', () => {
  assert.strictEqual(hit('Doing nothing is the free option here.'), true);
  assert.strictEqual(hit('Doing nothing is the free option here.', { ZEROCOST_FREE_EN: [] }), false);
});
check('E 注入 ZEROCOST_LOSE_EN=[] → 攻击失效', () => {
  assert.strictEqual(hit('An empty apartment loses nothing by staying vacant.'), true);
  assert.strictEqual(hit('An empty apartment loses nothing by staying vacant.', { ZEROCOST_LOSE_EN: [] }), false);
});
check('E 注入 ZEROCOST_SAVE_EN=[] → 攻击失效', () => {
  assert.strictEqual(hit('Skipping updates is pure savings for the company.'), true);
  assert.strictEqual(hit('Skipping updates is pure savings for the company.', { ZEROCOST_SAVE_EN: [] }), false);
});
check('E 注入 ZEROCOST_SAFE_EN=[] → 攻击失效', () => {
  assert.strictEqual(hit('Not checking the servers is the safest bet in this situation.'), true);
  assert.strictEqual(hit('Not checking the servers is the safest bet in this situation.', { ZEROCOST_SAFE_EN: [] }), false);
});
// 窗删除（-1 全滤：任何样本两腿都不可能配对）
check('E 注入 PAIR_ZH=-1 → 中文攻击失效', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { PAIR_ZH: -1 }), false, '删窗后仍命中: ' + s);
});
check('E 注入 PAIR_EN=-1 → 英文攻击失效', () => {
  for (const s of ATTACK_EN) assert.strictEqual(hit(s, { PAIR_EN: -1 }), false, '删窗后仍命中: ' + s);
});
// 窗收紧（0：两腿距离 >0 的样本收紧后失效——紧邻样本 dist=0 不受影响，
// 证明窗参数真实参与判定而非装饰）
check('E 注入 PAIR_ZH=0 → 非紧邻中文样本失效', () => {
  assert.strictEqual(hit('钱放在账户里不动又不会少，不投资就是零成本，稳赚不亏。'), true);
  assert.strictEqual(hit('钱放在账户里不动又不会少，不投资就是零成本，稳赚不亏。', { PAIR_ZH: 0 }), false);
});
check('E 注入 PAIR_EN=0 → 非紧邻英文样本失效', () => {
  assert.strictEqual(hit('The money sitting idle costs nothing, so not investing is the risk-free choice.'), true);
  assert.strictEqual(hit('The money sitting idle costs nothing, so not investing is the risk-free choice.', { PAIR_EN: 0 }), false);
});
// 豁免表：永假正则 → 带攻击结构的良性样本由不判变判
// 构造纪律：样本必须双腿齐全（否则压根不判，测不出豁免承重），
// 豁免标记与攻击形共存于同句。
const FALSE = /(?!)/;
check('E 注入 RULE_ZH 永假 → use-it-or-lose-it 良性变红', () => {
  const s = '按财务制度规定，年末未用完的预算额度不投入执行就作废，这部分资金不投入也不会产生任何成本，属于财政结余回收。';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { RULE_ZH: FALSE }), true);
});
check('E 注入 RULE_EN 永假 → use-it-or-lose-it 良性变红', () => {
  const s = 'Under use-it-or-lose-it budget rules, not spending the remaining funds carries no cost since they simply lapse.';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { RULE_EN: FALSE }), true);
});
check('E 注入 CONCEPT_ZH 永假 → 概念教学良性变红', () => {
  const s = '机会成本忽视的经典例子：把钱放着不动当成零成本的选择。';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { CONCEPT_ZH: FALSE }), true);
});
check('E 注入 CONCEPT_EN 永假 → 概念教学良性变红', () => {
  const s = 'In textbooks on opportunity cost neglect, money sitting idle is described as costing nothing.';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { CONCEPT_EN: FALSE }), true);
});
check('E 注入 CORRECT_ZH 永假 → 纠正句良性变红', () => {
  const s = '设备闲置不是零成本，折旧和资金占用说明说它没有损失是错的。';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { CORRECT_ZH: FALSE }), true);
});
check('E 注入 CORRECT_EN 永假 → 纠正句良性变红', () => {
  const s = 'Idle cash is not free: money sitting idle loses value every year, so calling it costing nothing is wrong.';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { CORRECT_EN: FALSE }), true);
});

// ─── F. 边界锁（近邻维度领地不判）────────────────────────────────
check('F 边界：零价格效应形不判（0元购/蜂拥/多拿）', () => {
  assert.strictEqual(hit('0元购让人失去判断力，大家蜂拥而上多拿了一堆。'), false);
});
check('F 边界：沉没成本绑架形不判（已经投了所以必须继续）', () => {
  assert.strictEqual(hit('已经投了五百万，现在停下来前面的钱就全打水漂了。'), false);
});
check('F 边界：不作为责任豁免形不判（没动手所以责任轻）', () => {
  assert.strictEqual(hit('他什么都没做，怎么能怪他，见死不救总比亲手杀人轻。'), false);
});
check('F 边界：递进连词不是否定（不但不花钱还能保住利润仍判）', () => {
  assert.strictEqual(hit('不但不花钱做推广，还能保住利润，这就是零成本的策略。'), true);
});

// ─── G. 登记纪律 ─────────────────────────────────────────────────
check('G 登记：__internals 暴露全部常量组与 findSignatures', () => {
  const I = __internals();
  for (const k of [
    'INACTION_NEG_VERB_ZH', 'INACTION_IDLE_ZH', 'INACTION_DELAY_ZH', 'INACTION_TIME_ZH',
    'INACTION_NOT_EN', 'INACTION_IDLE_EN', 'INACTION_SKIP_EN', 'INACTION_NOTIN_EN',
    'ZEROCOST_NOLOSS_ZH', 'ZEROCOST_ZERO_ZH', 'ZEROCOST_FREEWIN_ZH', 'ZEROCOST_SAVE_ZH', 'ZEROCOST_BEST_ZH',
    'ZEROCOST_NOCOST_EN', 'ZEROCOST_FREE_EN', 'ZEROCOST_LOSE_EN', 'ZEROCOST_SAVE_EN', 'ZEROCOST_SAFE_EN',
    'INACTION_ZH_GROUPS', 'INACTION_EN_GROUPS', 'ZEROCOST_ZH_GROUPS', 'ZEROCOST_EN_GROUPS',
    'PAIR_ZH', 'PAIR_EN', 'RULE_ZH', 'RULE_EN', 'CONCEPT_ZH', 'CONCEPT_EN', 'CORRECT_ZH', 'CORRECT_EN',
    'findSignatures',
  ]) assert.ok(k in I, '__internals 缺键: ' + k);
  assert.strictEqual(I.PAIR_ZH, 60);
  assert.strictEqual(I.PAIR_EN, 160);
});

console.log(`\nr336 轮测：${passed} 通过 / ${failed} 失败`);
process.exit(failed === 0 ? 0 : 1);
