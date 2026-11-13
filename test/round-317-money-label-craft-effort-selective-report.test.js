/* test/round-317-money-label-craft-effort-selective-report.test.js
 * r317 轮测：econ_reasoning_gate 聚合族三个子模块的全新措辞家族
 *   mental_accounting  「闲钱/零花钱/私房钱/副业/分红/利息/理财收益/房租」新来源标签
 *                      × 「不碍事/无伤大雅/不影响生活质量」轻放任消费许可
 *                      （EN stipend/allowance/dividends/passive income/side income）
 *   effort_justification 「打磨/雕琢/推敲/死啃/迭代/修改 × 半年/三个月/几十遍」工艺投入
 *                      × 「逐字逐句/精雕细琢/苦心经营/一遍又一遍」强努力标记
 *                      × 「成品/作品 × 肯定不会差」新质量结论
 *                      （EN polished/labored/refined … for weeks）
 *   p_hacking           「只报告/只汇报/只写进/其余略过」选择性报告动作 × 「成功/符合预期」
 *                      （EN only reported / only the winning / the rest were omitted）
 *                      × 新搜索量词（中文数字三十次/很多组 + out of a hundred slices /
 *                      ran fifty trials）× 新显著性（winning / positive results）
 * 组别：
 *   A gate 归因（攻击样本 → gate action != pass 且 econ_reasoning_gate 承重）
 *   B 模块直调（detectMentalAccounting / detectEffortJustification / detectPHacking hit=true）
 *   C 良性（官方良性语料 369 条去重 + 本轮新增良性 20 条，三模块 hit=false）
 *   D 存量回归（既有攻击样本仍命中）
 *   E 常量级注入（删整组新常量 → 攻击不再命中）
 *   F 元素级注入（逐个删除本轮新增正则元素 → 专属最小样本不再命中）
 *   G 入口双路（gate() / checkOutput() 均非 pass）
 *   H 登记纪律（FAMILIES 表、__internals 导出、头注记 [r317 升级]）
 * 用法: node test/round-317-money-label-craft-effort-selective-report.test.js
 */
'use strict';
const assert = require('assert');
const gateMod = require('../src/gate.js');
const gateFn = typeof gateMod === 'function' ? gateMod : gateMod.gate;
const MA = require('../src/mental-accounting.js');
const EJ = require('../src/effort-justification.js');
const PH = require('../src/p-hacking.js');
const ECON = require('../src/econ-reasoning-gate.js');
const MAI = MA.__internals();
const EJI = EJ.__internals();
const PHI = PH.__internals();

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── 攻击样本 ─────────────────────────────────────────────
const MA_ATTACKS = [
  '这笔闲钱放着也是放着，花了不心疼',
  '反正是闲钱，不花白不花，多买几件也无所谓',
  '零花钱本来就是零花的，多买几本漫画也不碍事',
  '私房钱跟工资不是一个性质，花起来没什么心理负担',
  '副业挣的钱不算正经收入，挥霍起来不觉得可惜',
  '股票分红到了账，等于白给的，奢侈一把也没人管',
  '理财收益来得轻松，拿去挥霍没人会说什么',
  '利息收入不当成工资，随便花也不心疼',
  '房租收入跟薪水不是一码事，花掉了也不必纳入预算',
  'The stipend feels like pocket money, so I blew it on things I would never buy with my salary',
  'Dividends are passive income, so spending them feels free and guiltless',
  'Side income is not real salary, so I splurge it without a second thought',
  'The allowance is my own petty cash, so I spend it however I like',
];
const EJ_ATTACKS = [
  '这个方案打磨了整整半年，质量肯定没问题',
  '团队精雕细琢了这么久，产品一定靠谱',
  '逐字逐句抠了三个月，结论不可能有错',
  '每个细节都反复推敲过，成品肯定不会差',
  '反复修改了几十遍的稿子，交上去肯定不会出差错',
  '苦心经营了两年，这门生意不可能失败',
  'We polished this draft for weeks, so it has to be sound',
  'The team labored over every detail, the design cannot be wrong',
  'I refined the model for months, so the results must be reliable',
];
const PH_ATTACKS = [
  '跑了三十次模拟，只报告了成功的那次',
  '分析了几十个指标，只汇报了显著的那个',
  '测了很多组参数，只把p值小的那组写进了论文',
  'We ran fifty trials and only reported the significant one',
  'Out of a hundred slices, only the winning segment was written up',
];
const NEW_BENIGN = [
  '闲钱也会纳入家庭预算统一规划，不因为来源放松约束',
  '副业收入依法申报纳税，与工资合并管理',
  '分红和利息都计入年度现金流，统一做资产配置',
  '零花钱按月发放，超额需要申请，不搞特殊化',
  '房租收入需要依法开具发票并申报',
  '银行利息按季度结息，计入个人年度综合所得',
  '公司分红方案经股东大会审议通过后执行',
  'The stipend is budgeted alongside the regular salary',
  'Dividends are reported as income and taxed accordingly',
  'Pocket money is tracked in the household budget like any other income',
  '方案打磨了很久，但仍需第三方测试验证才能上线',
  '稿子修改了多少遍与结论正误无关，要看数据本身',
  '精雕细琢不能替代同行评议，结论要经独立复现',
  '生意成不成功取决于市场需求，与苦心经营年数无必然关系',
  'We polished it for weeks, but it still has to pass the benchmark',
  'Time spent refining says nothing about correctness — verify with data',
  '预注册分析方案限定主假设，报告全部预设终点',
  '多重比较校正后仍显著的效应才写入结论',
  '所有试跑结果附在附录，含未显著的部分',
  'We preregistered the trials and report all prespecified outcomes',
];

// ─── A: gate 归因 ────────────────────────────────────────
check('A gate 归因：27 条攻击全部 action != pass 且 econ_reasoning_gate 承重', () => {
  for (const t of MA_ATTACKS.concat(EJ_ATTACKS, PH_ATTACKS)) {
    const r = gateFn(t);
    const action = r.action || (r.gate && r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.notStrictEqual(action, 'pass', 'gate pass: ' + t);
    assert.ok(dims.includes('econ_reasoning_gate'), 'econ 未承重: ' + t + ' dims=' + JSON.stringify(dims));
  }
});

// ─── B: 模块直调 ──────────────────────────────────────────
check('B 模块直调：MA 13/13 命中', () => {
  for (const t of MA_ATTACKS) assert.strictEqual(MA.detectMentalAccounting(t).hit, true, '未命中: ' + t);
});
check('B 模块直调：EJ 9/9 命中', () => {
  for (const t of EJ_ATTACKS) assert.strictEqual(EJ.detectEffortJustification(t).hit, true, '未命中: ' + t);
});
check('B 模块直调：PH 5/5 命中', () => {
  for (const t of PH_ATTACKS) assert.strictEqual(PH.detectPHacking(t).hit, true, '未命中: ' + t);
});

// ─── C: 良性 ──────────────────────────────────────────────
const CORPUS = [
  'test/gate-benchmark.js',
  'test/gate-benchmark-extended.js',
  'test/vertical-benign-benchmark.js',
  'test/benign-mixed-benchmark.js',
];
function flatten(x, out) {
  if (typeof x === 'string') { if (x.trim().length > 3) out.push(x); return out; }
  if (Array.isArray(x)) { for (const y of x) flatten(y, out); return out; }
  if (x && typeof x === 'object') {
    for (const k of Object.keys(x)) { if (k === 'EXPECT') continue; flatten(x[k], out); }
  }
  return out;
}
check('C 良性：官方良性语料 369 条（去重）三模块零误命中', () => {
  const seen = new Set();
  let total = 0;
  for (const f of CORPUS) {
    let m;
    try { m = require('../' + f); } catch (e) { continue; }
    for (const text of flatten(m.SAMPLES || m.CATEGORIES || {}, [])) {
      if (seen.has(text)) continue;
      seen.add(text); total++;
      assert.strictEqual(MA.detectMentalAccounting(text).hit, false, 'MA 误伤: ' + text.slice(0, 50));
      assert.strictEqual(EJ.detectEffortJustification(text).hit, false, 'EJ 误伤: ' + text.slice(0, 50));
      assert.strictEqual(PH.detectPHacking(text).hit, false, 'PH 误伤: ' + text.slice(0, 50));
    }
  }
  assert.strictEqual(total, 369, '语料条数口径: ' + total);
});
check('C 良性：本轮新增 20 条良性三模块零误命中', () => {
  for (const t of NEW_BENIGN) {
    assert.strictEqual(MA.detectMentalAccounting(t).hit, false, 'MA 误伤: ' + t);
    assert.strictEqual(EJ.detectEffortJustification(t).hit, false, 'EJ 误伤: ' + t);
    assert.strictEqual(PH.detectPHacking(t).hit, false, 'PH 误伤: ' + t);
  }
});

// ─── D: 存量回归 ──────────────────────────────────────────
const MA_REGRESS = [
  '这笔年终奖是意外之财，不算正经收入，所以可以放心大胆地挥霍一把。',
  '中奖得来的五万块，跟攒了一年工资不一样，挥霍起来不觉得可惜。',
  '遗产到账就当是天上掉下来的，买起东西来没什么心疼的。',
  'The bonus is found money, not real salary, so I might as well splurge on it guilt-free.',
  'Gift cards are basically free money, so spending them on junk does not really count.',
];
const EJ_REGRESS = [
  '我们熬了几个月做出来的方案，质量肯定没问题。',
  '投入了这么多研发经费，产品不可能失败。',
  '他为这个课题呕心沥血多年，结论想必是对的。',
  'We worked on this for months, so it has to be correct.',
  'Countless sleepless nights went into this, so the result is certainly right.',
];
const PH_REGRESS = [
  '我们试了20种用户分组，终于发现95后用户的付费率显著更高。',
  '换了5种统计方法，其中一种显示结果显著，假设成立。',
  '在几十种配色方案中，有一种的转化率明显高，就用它。',
  'We tested twenty subgroups and finally found one with a significant effect.',
  'Out of forty cities surveyed, one showed a big sales jump, proving the strategy works.',
];
check('D 存量回归：MA 5/5 仍命中', () => {
  for (const t of MA_REGRESS) assert.strictEqual(MA.detectMentalAccounting(t).hit, true, '回归失败: ' + t);
});
check('D 存量回归：EJ 5/5 仍命中', () => {
  for (const t of EJ_REGRESS) assert.strictEqual(EJ.detectEffortJustification(t).hit, true, '回归失败: ' + t);
});
check('D 存量回归：PH 5/5 仍命中', () => {
  for (const t of PH_REGRESS) assert.strictEqual(PH.detectPHacking(t).hit, true, '回归失败: ' + t);
});

// ─── E: 常量级注入 ────────────────────────────────────────
const E_CASES = [
  ['MA 删 SOURCE_ZH3', MA.detectMentalAccounting, MA_ATTACKS[0], { SOURCE_ZH3: [] }],
  ['MA 删 SPEND_ZH3', MA.detectMentalAccounting, MA_ATTACKS[2], { SPEND_ZH3: [] }],
  ['MA 删 SOURCE_EN3', MA.detectMentalAccounting, MA_ATTACKS[9], { SOURCE_EN3: [] }],
  ['MA 删 SPEND_EN3', MA.detectMentalAccounting, MA_ATTACKS[12], { SPEND_EN3: [] }],
  ['EJ 删 EFFORT_ZH2', EJ.detectEffortJustification, EJ_ATTACKS[0], { EFFORT_ZH2: [] }],
  ['EJ 删 EFFORT_EN2', EJ.detectEffortJustification, EJ_ATTACKS[6], { EFFORT_EN2: [] }],
  ['EJ 删 QUALITY_ZH2', EJ.detectEffortJustification, EJ_ATTACKS[3], { QUALITY_ZH2: [] }],
  ['PH 删 SEARCH_ZH2', PH.detectPHacking, PH_ATTACKS[0], { SEARCH_ZH2: [] }],
  ['PH 删 SEARCH_EN3', PH.detectPHacking, PH_ATTACKS[3], { SEARCH_EN3: [] }],
  ['PH 删 WINNER_ZH3', PH.detectPHacking, PH_ATTACKS[0], { WINNER_ZH3: [] }],
  ['PH 删 WINNER_EN3', PH.detectPHacking, PH_ATTACKS[3], { WINNER_EN3: [] }],
  ['PH 删 SIGNIF_ZH3', PH.detectPHacking, PH_ATTACKS[0], { SIGNIF_ZH3: [] }],
  ['PH 删 SIGNIF_EN3', PH.detectPHacking, PH_ATTACKS[4], { SIGNIF_EN3: [] }],
];
for (const [name, fn, sample, inject] of E_CASES) {
  check(`E 常量级注入：${name} → 攻击不再命中`, () => {
    assert.strictEqual(fn(sample, inject).hit, false, '删常量后仍命中: ' + sample);
  });
}

// ─── F: 元素级注入 ────────────────────────────────────────
// 每个本轮新增正则元素配一条「仅该元素承重」的最小样本；删该元素 → 不再命中
const F_CASES = [
  // MA SOURCE_ZH3（8 元素）
  ['MA SOURCE_ZH3[0] 闲钱族', MA.detectMentalAccounting, MAI.SOURCE_ZH3, 0, '这笔闲钱不是工资，花掉也不心疼'],
  ['MA SOURCE_ZH3[1] 零花钱族', MA.detectMentalAccounting, MAI.SOURCE_ZH3, 1, '零花钱不是工资，花掉也不心疼'],
  ['MA SOURCE_ZH3[2] 私房钱族', MA.detectMentalAccounting, MAI.SOURCE_ZH3, 2, '私房钱不是工资，花掉也不心疼'],
  ['MA SOURCE_ZH3[3] 副业收入族', MA.detectMentalAccounting, MAI.SOURCE_ZH3, 3, '副业挣的钱不算正经收入，挥霍起来不觉得可惜'],
  ['MA SOURCE_ZH3[4] 分红族', MA.detectMentalAccounting, MAI.SOURCE_ZH3, 4, '股票分红不是工资，花掉也不心疼'],
  ['MA SOURCE_ZH3[5] 利息族', MA.detectMentalAccounting, MAI.SOURCE_ZH3, 5, '利息收入不是工资，花掉也不心疼'],
  ['MA SOURCE_ZH3[6] 理财收益族', MA.detectMentalAccounting, MAI.SOURCE_ZH3, 6, '理财收益不是工资，花掉也不心疼'],
  ['MA SOURCE_ZH3[7] 房租族', MA.detectMentalAccounting, MAI.SOURCE_ZH3, 7, '房租收入不是工资，花掉也不心疼'],
  // MA SPEND_ZH3（5 元素）
  ['MA SPEND_ZH3[0] 不碍事族', MA.detectMentalAccounting, MAI.SPEND_ZH3, 0, '这笔奖金多花点也不碍事'],
  ['MA SPEND_ZH3[1] 无伤大雅族', MA.detectMentalAccounting, MAI.SPEND_ZH3, 1, '这笔年终奖多花点无伤大雅'],
  ['MA SPEND_ZH3[2] 没什么大不了族', MA.detectMentalAccounting, MAI.SPEND_ZH3, 2, '这笔年终奖多花点没什么大不了'],
  ['MA SPEND_ZH3[3] 不影响生活质量族', MA.detectMentalAccounting, MAI.SPEND_ZH3, 3, '这笔年终奖花掉也不影响生活质量'],
  ['MA SPEND_ZH3[4] 添预算族', MA.detectMentalAccounting, MAI.SPEND_ZH3, 4, '拿这笔年终奖添点预算'],
  // MA SOURCE_EN3（10 元素）
  ['MA SOURCE_EN3[0] stipend', MA.detectMentalAccounting, MAI.SOURCE_EN3, 0, 'The stipend is not real salary, so I might as well spend it all.'],
  ['MA SOURCE_EN3[1] pocket money', MA.detectMentalAccounting, MAI.SOURCE_EN3, 1, 'Pocket money is not real salary, so I might as well spend it all.'],
  ['MA SOURCE_EN3[2] petty cash', MA.detectMentalAccounting, MAI.SOURCE_EN3, 2, 'Petty cash is not real salary, so I might as well spend it all.'],
  ['MA SOURCE_EN3[3] allowance', MA.detectMentalAccounting, MAI.SOURCE_EN3, 3, 'The allowance is not real salary, so I might as well spend it all.'],
  ['MA SOURCE_EN3[4] dividends', MA.detectMentalAccounting, MAI.SOURCE_EN3, 4, 'Dividends are not real salary, so I might as well spend them all.'],
  ['MA SOURCE_EN3[5] passive income', MA.detectMentalAccounting, MAI.SOURCE_EN3, 5, 'Passive income is not real salary, so I might as well spend it all.'],
  ['MA SOURCE_EN3[6] rental income', MA.detectMentalAccounting, MAI.SOURCE_EN3, 6, 'Rental income is not real salary, so I might as well spend it all.'],
  ['MA SOURCE_EN3[7] interest income', MA.detectMentalAccounting, MAI.SOURCE_EN3, 7, 'Interest income is not real salary, so I might as well spend it all.'],
  ['MA SOURCE_EN3[8] investment returns', MA.detectMentalAccounting, MAI.SOURCE_EN3, 8, 'Investment returns are not real salary, so I might as well spend them all.'],
  ['MA SOURCE_EN3[9] side income', MA.detectMentalAccounting, MAI.SOURCE_EN3, 9, 'Side income is not real salary, so I might as well spend it all.'],
  // MA SPEND_EN3（3 元素）
  ['MA SPEND_EN3[0] spend it however', MA.detectMentalAccounting, MAI.SPEND_EN3, 0, 'The pocket money is mine, so I spend it as I see fit.'],
  ['MA SPEND_EN3[1] any way I like', MA.detectMentalAccounting, MAI.SPEND_EN3, 1, 'The pocket money is mine, so I treat it any way I like.'],
  ['MA SPEND_EN3[2] no strings', MA.detectMentalAccounting, MAI.SPEND_EN3, 2, 'The bonus money comes with no strings, so I spend it freely.'],
  // EJ EFFORT_ZH2（3 元素）
  ['EJ EFFORT_ZH2[0] 工艺动词+时长', EJ.detectEffortJustification, EJI.EFFORT_ZH2, 0, '这个方案打磨了整整半年，质量肯定没问题'],
  ['EJ EFFORT_ZH2[1] 强努力标记', EJ.detectEffortJustification, EJI.EFFORT_ZH2, 1, '团队精雕细琢了这么久，产品一定靠谱'],
  ['EJ EFFORT_ZH2[2] 反复+修改', EJ.detectEffortJustification, EJI.EFFORT_ZH2, 2, '反复修改的稿子，交上去肯定不会出差错'],
  // EJ EFFORT_EN2（4 元素）
  ['EJ EFFORT_EN2[0] polished…for weeks', EJ.detectEffortJustification, EJI.EFFORT_EN2, 0, 'We polished this draft for weeks, so it has to be sound.'],
  ['EJ EFFORT_EN2[1] labored over', EJ.detectEffortJustification, EJI.EFFORT_EN2, 1, 'The team labored over the prototype, the design cannot be wrong.'],
  ['EJ EFFORT_EN2[2] over every detail', EJ.detectEffortJustification, EJI.EFFORT_EN2, 2, 'The team checked over every detail, the design cannot be wrong.'],
  ['EJ EFFORT_EN2[3] countless revisions', EJ.detectEffortJustification, EJI.EFFORT_EN2, 3, 'Countless revisions went into this, so the result has to be sound.'],
  // EJ QUALITY_ZH2（2 元素）
  ['EJ QUALITY_ZH2[0] 成品×肯定不会差', EJ.detectEffortJustification, EJI.QUALITY_ZH2, 0, '每个细节都反复推敲过，成品肯定过硬'],
  ['EJ QUALITY_ZH2[1] 肯定会差', EJ.detectEffortJustification, EJI.QUALITY_ZH2, 1, '团队拼命打磨了这么久，肯定不会差'],
  // PH SEARCH_ZH2（2 元素）
  ['PH SEARCH_ZH2[0] 中文数字', PH.detectPHacking, PHI.SEARCH_ZH2, 0, '跑了三十次模拟，只报告了成功的那次'],
  ['PH SEARCH_ZH2[1] 很多族', PH.detectPHacking, PHI.SEARCH_ZH2, 1, '测了很多组参数，只把p值小的那组写进了论文'],
  // PH SEARCH_EN3（3 元素）
  ['PH SEARCH_EN3[0] out of a hundred slices', PH.detectPHacking, PHI.SEARCH_EN3, 0, 'Out of a hundred slices, only the winning segment was written up'],
  ['PH SEARCH_EN3[1] 五十 slices tested', PH.detectPHacking, PHI.SEARCH_EN3, 1, 'Fifty slices tested, and only the winning one was reported'],
  ['PH SEARCH_EN3[2] ran fifty trials', PH.detectPHacking, PHI.SEARCH_EN3, 2, 'We ran fifty trials and only reported the significant one'],
  // PH WINNER_ZH3（4 元素）
  ['PH WINNER_ZH3[0] 只报告族', PH.detectPHacking, PHI.WINNER_ZH3, 0, '跑了三十次模拟，只报告了成功的那次'],
  ['PH WINNER_ZH3[1] 唯独族', PH.detectPHacking, PHI.WINNER_ZH3, 1, '试了五十种方案，唯独成功的那种被写进报告'],
  ['PH WINNER_ZH3[2] 其余略过族', PH.detectPHacking, PHI.WINNER_ZH3, 2, '跑了三十次模拟，成功的那次写进了报告，其余运行的记录都略过不提'],
  ['PH WINNER_ZH3[3] 略过其余族', PH.detectPHacking, PHI.WINNER_ZH3, 3, '跑了三十次模拟，成功的写进报告，略过的其余都是失败运行'],
  // PH WINNER_EN3（4 元素）
  ['PH WINNER_EN3[0] only reported', PH.detectPHacking, PHI.WINNER_EN3, 0, 'We ran fifty trials and only reported the significant one'],
  ['PH WINNER_EN3[1] only the winning', PH.detectPHacking, PHI.WINNER_EN3, 1, 'Out of a hundred slices, only the winning segment was written up'],
  ['PH WINNER_EN3[2] the rest were omitted', PH.detectPHacking, PHI.WINNER_EN3, 2, 'We ran fifty trials; the significant result was kept and the rest were omitted'],
  ['PH WINNER_EN3[3] omitted the rest', PH.detectPHacking, PHI.WINNER_EN3, 3, 'We ran fifty trials, and the significant result was kept while we omitted the rest'],
  // PH SIGNIF_ZH3（5 元素）
  ['PH SIGNIF_ZH3[0] 成功', PH.detectPHacking, PHI.SIGNIF_ZH3, 0, '跑了三十次模拟，只报告了成功的那次'],
  ['PH SIGNIF_ZH3[1] 符合/达到/超出预期', PH.detectPHacking, PHI.SIGNIF_ZH3, 1, '跑了三十次模拟，只报告了符合预期的那次'],
  ['PH SIGNIF_ZH3[2] 如愿', PH.detectPHacking, PHI.SIGNIF_ZH3, 2, '跑了三十次模拟，只报告了如愿的那次'],
  ['PH SIGNIF_ZH3[3] 达到预设', PH.detectPHacking, PHI.SIGNIF_ZH3, 3, '跑了三十次模拟，只报告了达到预设的那次'],
  ['PH SIGNIF_ZH3[4] 跑通', PH.detectPHacking, PHI.SIGNIF_ZH3, 4, '跑了三十次模拟，只报告了跑通的那次'],
  // PH SIGNIF_EN3（3 元素）
  ['PH SIGNIF_EN3[0] winning', PH.detectPHacking, PHI.SIGNIF_EN3, 0, 'Out of a hundred slices, only the winning segment was written up'],
  ['PH SIGNIF_EN3[1] positive results', PH.detectPHacking, PHI.SIGNIF_EN3, 1, 'We ran fifty trials and only reported the positive results'],
  ['PH SIGNIF_EN3[2] succeeded', PH.detectPHacking, PHI.SIGNIF_EN3, 2, 'We ran fifty trials and only reported the trials that succeeded'],
];
const KEY_OF = [
  [MAI.SOURCE_ZH3, 'SOURCE_ZH3'], [MAI.SPEND_ZH3, 'SPEND_ZH3'],
  [MAI.SOURCE_EN3, 'SOURCE_EN3'], [MAI.SPEND_EN3, 'SPEND_EN3'],
  [EJI.EFFORT_ZH2, 'EFFORT_ZH2'], [EJI.EFFORT_EN2, 'EFFORT_EN2'], [EJI.QUALITY_ZH2, 'QUALITY_ZH2'],
  [PHI.SEARCH_ZH2, 'SEARCH_ZH2'], [PHI.SEARCH_EN3, 'SEARCH_EN3'],
  [PHI.WINNER_ZH3, 'WINNER_ZH3'], [PHI.WINNER_EN3, 'WINNER_EN3'],
  [PHI.SIGNIF_ZH3, 'SIGNIF_ZH3'], [PHI.SIGNIF_EN3, 'SIGNIF_EN3'],
];
for (const [name, fn, arr, i, sample] of F_CASES) {
  check(`F 元素级注入：${name} → 最小样本不再命中`, () => {
    const entry = KEY_OF.find(([a]) => a === arr);
    assert.ok(entry, '常量未登记: ' + name);
    const key = entry[1];
    const filtered = arr.slice();
    filtered.splice(i, 1);
    const r = fn(sample, { [key]: filtered });
    assert.strictEqual(r.hit, false, '删元素后仍命中: ' + sample);
  });
}

// ─── G: 入口双路 ──────────────────────────────────────────
check('G 入口双路：gate() 与 checkOutput() 对 4 条代表样本均非 pass', () => {
  const samples = [MA_ATTACKS[0], MA_ATTACKS[9], EJ_ATTACKS[0], PH_ATTACKS[3]];
  for (const t of samples) {
    const g = gateFn(t);
    const ga = g.action || (g.gate && g.gate.action);
    assert.notStrictEqual(ga, 'pass', 'gate pass: ' + t);
    const o = gateMod.checkOutput ? gateMod.checkOutput(t) : null;
    if (o) {
      const oa = o.action || (o.gate && o.gate.action);
      assert.notStrictEqual(oa, 'pass', 'checkOutput pass: ' + t);
    }
  }
});

// ─── H: 登记纪律 ──────────────────────────────────────────
check('H 登记纪律：FAMILIES 表含 mental_accounting / effort_justification / p_hacking 且 fn 名正确', () => {
  const keys = ECON.FAMILIES.map(f => f.key);
  assert.ok(keys.includes('mental_accounting'), 'FAMILIES 缺 mental_accounting');
  assert.ok(keys.includes('effort_justification'), 'FAMILIES 缺 effort_justification');
  assert.ok(keys.includes('p_hacking'), 'FAMILIES 缺 p_hacking');
  assert.strictEqual(ECON.FAMILIES.find(f => f.key === 'mental_accounting').fn, 'detectMentalAccounting');
  assert.strictEqual(ECON.FAMILIES.find(f => f.key === 'effort_justification').fn, 'detectEffortJustification');
  assert.strictEqual(ECON.FAMILIES.find(f => f.key === 'p_hacking').fn, 'detectPHacking');
});
check('H 登记纪律：MA __internals 导出本轮新常量', () => {
  for (const k of ['SOURCE_ZH3', 'SPEND_ZH3', 'SOURCE_EN3', 'SPEND_EN3']) {
    assert.ok(Array.isArray(MAI[k]), 'MA 缺导出: ' + k);
  }
  assert.strictEqual(MAI.SOURCE_ZH3.length, 8);
  assert.strictEqual(MAI.SPEND_ZH3.length, 5);
  assert.strictEqual(MAI.SOURCE_EN3.length, 10);
  assert.strictEqual(MAI.SPEND_EN3.length, 3);
});
check('H 登记纪律：EJ __internals 导出本轮新常量', () => {
  for (const k of ['EFFORT_ZH2', 'EFFORT_EN2', 'QUALITY_ZH2']) {
    assert.ok(Array.isArray(EJI[k]), 'EJ 缺导出: ' + k);
  }
  assert.strictEqual(EJI.EFFORT_ZH2.length, 3);
  assert.strictEqual(EJI.EFFORT_EN2.length, 4);
  assert.strictEqual(EJI.QUALITY_ZH2.length, 2);
});
check('H 登记纪律：PH __internals 导出本轮新常量', () => {
  for (const k of ['SEARCH_ZH2', 'SEARCH_EN3', 'WINNER_ZH3', 'WINNER_EN3', 'SIGNIF_ZH3', 'SIGNIF_EN3']) {
    assert.ok(Array.isArray(PHI[k]), 'PH 缺导出: ' + k);
  }
  assert.strictEqual(PHI.SEARCH_ZH2.length, 2);
  assert.strictEqual(PHI.SEARCH_EN3.length, 3);
  assert.strictEqual(PHI.WINNER_ZH3.length, 4);
  assert.strictEqual(PHI.WINNER_EN3.length, 4);
  assert.strictEqual(PHI.SIGNIF_ZH3.length, 5);
  assert.strictEqual(PHI.SIGNIF_EN3.length, 3);
});
check('H 登记纪律：三模块头注记含 [r317 升级]', () => {
  const fs = require('fs');
  const path = require('path');
  for (const f of ['src/mental-accounting.js', 'src/effort-justification.js', 'src/p-hacking.js']) {
    const src = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    assert.ok(src.includes('[r317 升级]'), f + ' 头注记缺 [r317 升级]');
  }
});

console.log(`\nr317 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
