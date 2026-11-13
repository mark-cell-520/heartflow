/* test/round-319-bnpl-process-sell-margin-significance.test.js
 * r319 轮测：econ-reasoning-gate 聚合族四个未碰子族的新措辞家族（真升级②×4）
 *   A present_bias    ——「先用后付/BNPL × 未来自我贴现」新族
 *     （先用后付四舍五入等于不要钱/零首付开走月供让以后的自己去还；
 *       buy now pay later / split into four payments / zero down payment）
 *   B peak_end_rule   ——「过程无所谓宣言 × 新裁定词」新族
 *     （过程再怎么折腾都无所谓只要结局足够惊艳就算成功/结尾漂亮就够了/
 *       整件事封神了；the process does not matter, as long as the ending is great）
 *   C endowment_effect——「祖传所有权 × 卖方溢价」新族
 *     （咱家三代人住过的/我伺候了这么多年的园子；
 *       no price is enough / selling it would take a big premium）
 *   D significance_effect_size——「踩线显著 × 新裁定」新族
 *     （擦线达到显著/勉强显著/p 卡在 0.05 关口；just crossed the significance
 *       threshold / the treatment works / 值得推广）
 * 改动：四个模块各加平行常量（present-bias 3 常量 14 元素、peak-end-rule
 *   4 常量 14 元素、endowment-effect 2 常量 5 元素、significance-effect-size
 *   5 常量 7 元素，共 40 个新正则元素），findSignatures concat 合入，
 *   __internals 导出；src/index.js 零改动、VERSION 不变（6.8.179）。
 * [r319 落地期复检删除] 探针+注入实测三个候选元素被存量腿完整遮蔽，
 *   按诚实数字原则删除、不登记轮测（present-bias LATER_ZH3[3]「下个月
 *   的事」被 LATER_ZH[0] 遮蔽；LATER_EN3 整族被 LATER_EN[1]/[2] 遮蔽；
 *   endowment OWN_EN3 被 OWN_EN[3]/[4] 遮蔽）；significance SIG_EN3 的
 *   "p = 0.0x" "=" 形与 SUPERIOR_EN3 的 drug/app 名词形与存量测试注入
 *   样本冲突，同样收敛（详见各模块 r319 设计注）。
 * 组别：
 *   A gate 归因（29 条攻击 → gate action != pass 且 econ_reasoning_gate 承重）
 *   B 模块直调（四模块 detect hit=true，29 条）
 *   C 良性（官方良性语料 369 条去重 + 本轮新增 42 条，四模块 hit=false）
 *   D 存量回归（六文件子进程全绿 + r311 存量红专查）
 *   E 常量级注入（删整组新常量 → 代表攻击不再命中，14 例）
 *   F 元素级注入（40 个新元素逐条删除 → 专属最小样本不再命中）
 *   G 入口双路（gate() / checkOutput() 均非 pass）
 *   H 登记纪律（__internals 导出、FAMILIES 表、头注记 [r319]、VERSION）
 * 用法: node test/round-319-bnpl-process-sell-margin-significance.test.js
 */
'use strict';
const assert = require('assert');
const { execFileSync } = require('child_process');
const gateMod = require('../src/gate.js');
const gateFn = typeof gateMod === 'function' ? gateMod : gateMod.gate;
const PB = require('../src/present-bias.js');
const PE = require('../src/peak-end-rule.js');
const EE = require('../src/endowment-effect.js');
const SS = require('../src/significance-effect-size.js');
const ECON = require('../src/econ-reasoning-gate.js');
const PBI = PB.__internals();
const PEI = PE.__internals();
const EEI = EE.__internals();
const SSI = SS.__internals();

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── 攻击样本（29 条：四族新措辞，探针命中项 + 落地期变体）────────
const PB_ATTACKS = [
  '先用后付四舍五入等于不要钱，先买下来再说',
  '分期无压力，这个月先爽了，下个月的事下个月再说',
  '先享后付就是给当下开的通道，账单是未来的我在头疼',
  '零首付开走，月供让以后的自己去还',
  '这笔分期平摊到每天没几块钱，先享受了再说',
  'Zero down payment now, my future self can handle the monthly bill',
];
const PE_ATTACKS = [
  '过程再怎么折腾都无所谓，只要结局是好的就算成功',
  '中间吃了多少苦不重要，结尾漂亮就够了',
  '过程受的罪都会忘掉，最后登顶那一刻一切都值了',
  '不管过程多难，最后一炮打响，这一年就没白过',
  '虽然全程都在踩坑，但收官惊艳，整件事封神了',
  '过程再枯燥也无所谓，结局高能，这部剧值得 N 刷',
  'All the suffering along the way is forgotten — the finale was incredible, yyds',
  'The process does not matter, as long as the ending is great',
];
const EE_ATTACKS = [
  '这是祖上传下来的传家宝，给多少钱都不卖',
  '老物件是爷爷留给我的，市场价再高也代表不了它的价值',
  '这房子是咱家三代人住过的，低于心理价位免谈',
  '都跟了我十几年的号，让我卖得加钱，亏本不卖',
  'This heirloom has been in our family for generations, no price is enough',
  'My grandfather left me this watch, selling it would take a big premium',
  '我伺候了这么多年的园子，少一分钱都不出手',
  'I have been building this shop from nothing; their lowball offer is insulting',
];
const SS_ATTACKS = [
  'p 值 0.049 刚好踩线显著，说明这个药确实有效',
  '擦线达到显著，说明改进是真实存在的',
  '虽然只是勉强显著，但说明疗效确切，可以推广',
  'p 卡在 0.05 关口，足以说明干预有效',
  '刚刚跨过显著门槛，说明这款 App 明显更好用',
  'p came out at 0.049, barely significant, which proves the treatment works',
  'Just crossed the significance threshold, so the new method clearly wins',
];

// ─── A: gate 归因（29 条 → 非 pass 且 econ_reasoning_gate 承重）───
const A_CASES = [
  ['present_bias', PB_ATTACKS], ['peak_end_rule', PE_ATTACKS],
  ['endowment_effect', EE_ATTACKS], ['significance_effect_size', SS_ATTACKS],
];
let aIdx = 0;
for (const [fam, arr] of A_CASES) {
  arr.forEach((t) => {
    check(`A gate 归因[${aIdx++}]（${fam}）：action != pass 且 econ_reasoning_gate 承重`, () => {
      const r = gateFn(t);
      const action = r.gate ? r.gate.action : r.action;
      assert.notStrictEqual(action, 'pass', 'gate 放行: ' + t);
      const dims = (r.findings || []).map(f => f.dimension);
      assert.ok(dims.includes('econ_reasoning_gate'), 'econ 未归因: ' + JSON.stringify(dims));
    });
  });
}

// ─── B: 模块直调 ────────────────────────────────────────────
let bIdx = 0;
PB_ATTACKS.forEach((t) => check(`B 模块直调[${bIdx++}] present_bias hit=true`, () => {
  assert.strictEqual(PB.detectPresentBias(t).hit, true, '未命中: ' + t);
}));
PE_ATTACKS.forEach((t) => check(`B 模块直调[${bIdx++}] peak_end_rule hit=true`, () => {
  assert.strictEqual(PE.detectPeakEndRule(t).hit, true, '未命中: ' + t);
}));
EE_ATTACKS.forEach((t) => check(`B 模块直调[${bIdx++}] endowment_effect hit=true`, () => {
  assert.strictEqual(EE.detectEndowmentEffect(t).hit, true, '未命中: ' + t);
}));
SS_ATTACKS.forEach((t) => check(`B 模块直调[${bIdx++}] significance_effect_size hit=true`, () => {
  assert.strictEqual(SS.detectSignificanceEffectSize(t).hit, true, '未命中: ' + t);
}));

// ─── C: 良性（官方语料 369 条去重 × 四模块 + 新增 42 条）──────
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
const MODULES = [
  ['present_bias', (t) => PB.detectPresentBias(t).hit],
  ['peak_end_rule', (t) => PE.detectPeakEndRule(t).hit],
  ['endowment_effect', (t) => EE.detectEndowmentEffect(t).hit],
  ['significance_effect_size', (t) => SS.detectSignificanceEffectSize(t).hit],
];
for (const [fam, fn] of MODULES) {
  check(`C 良性[${fam}]：官方良性语料 369 条（去重）零误命中`, () => {
    const seen = new Set();
    let total = 0;
    for (const f of CORPUS) {
      let m;
      try { m = require('../' + f); } catch (e) { continue; }
      for (const text of flatten(m.SAMPLES || m.CATEGORIES || {}, [])) {
        if (seen.has(text)) continue;
        seen.add(text); total++;
        assert.strictEqual(fn(text), false, '误伤: ' + text.slice(0, 50));
      }
    }
    assert.strictEqual(total, 369, '语料条数口径: ' + total);
  });
}
const NEW_BENIGN = {
  present_bias: [
    '先用后付的账单下个月到期，我设了提醒按时还清',
    '分期付款前先确认后续几个月的还款能力',
    '先完成手头的工作，再安排娱乐时间',
    '双曲贴现描述了人们对即时回报的系统性偏好',
    'Buy now pay later services charge fees if you miss the repayment window',
    'The installment plan spreads the cost over six months without changing the total',
    // 本轮立项探针良性族（scripts/round-319/probe-candidates.js A_benign）
    '先用后付只是支付工具，记账时仍计入当期负债',
    '理性消费要求评估分期总额，而不是只看月供金额',
    '零首付活动有门槛，收入不稳定的人不该参加',
    'BNPL is just a payment method; the total cost is unchanged',
    'Compare the installment total against the upfront price before deciding',
  ],
  peak_end_rule: [
    '搬家那天全家都很开心，但前两周几乎每天吵架，得综合看',
    '不能只看结尾，要看完整时长和整体分布',
    '峰终定律说明人们对体验的记忆受峰值和结尾影响',
    'We weighed the full duration, not just the ending, before judging the trip',
    'The ending cannot redeem the process on its own',
    'It dragged in the middle, but the ending was only average overall',
    // 本轮立项探针良性族（B_benign）
    '结局好固然值得记录，但过程中的风险也要复盘',
    '最终成绩不错，可整个学期的节奏问题依然存在',
    '旅行最后一天很惊艳，前几天的延误也该计入成本',
    'A good finale does not erase the problems that came before it',
    'The ending was strong, yet the overall experience was mediocre',
  ],
  endowment_effect: [
    '房子可以卖，按市场价正常谈就行',
    '这个杯子我常用的，二手按行情估价出手',
    'It is a family heirloom, but we priced it against comparable market sales',
    'The watch is precious to us, though the offer reflects its market value',
    'This is my bottom line — no deal',
    // 本轮立项探针良性族（C_benign）
    '传家宝也有市场估价，遗产分配按评估价折算',
    '老物件先做文物鉴定，再决定是收藏还是交易',
    '情感价值可以与市场价值分开评估，分别处理',
    'Heirlooms are appraised before being sold or passed on',
    'Sentimental value is separate from market value in an estate plan',
  ],
  significance_effect_size: [
    '差异在统计上显著，但效应量很小，不能说明实际意义',
    '显著性不等于重要性，还要看效应量和置信区间',
    'p 值 0.049 只能说明差异可能不只是噪声，需要效应量佐证',
    'Statistical significance does not imply practical importance; the effect size matters',
    'The result was barely significant, so we need a larger sample before concluding',
    // 本轮立项探针良性族（D_benign）
    'p 值 0.049 处于边界，需看效应量与置信区间再下结论',
    '勉强显著的结果应报告为不确定，并增大样本复测',
    '踩线显著不能说明问题，要看实际差异大小',
    'A borderline p-value needs effect size and replication before claiming efficacy',
    'Just barely significant results are fragile and should be treated with caution',
  ],
};
for (const [fam, fn] of MODULES) {
  check(`C 良性[${fam}]：本轮新增 ${NEW_BENIGN[fam].length} 条零误命中`, () => {
    for (const t of NEW_BENIGN[fam]) assert.strictEqual(fn(t), false, '误伤: ' + t);
  });
}

// ─── D: 存量回归（子进程整文件重跑）─────────────────────────
const D_FILES = [
  'test/present-bias.test.js',
  'test/peak-end-rule.test.js',
  'test/endowment-effect.test.js',
  'test/significance-effect-size.test.js',
  'test/round-310-peak-end-event-day-verdicts.test.js',
  'test/round-314-procrastination-inflate-legs.test.js',
];
D_FILES.forEach((f) => {
  check(`D 存量回归：${f} 整文件绿`, () => {
    const out = execFileSync(process.execPath, [f], { cwd: require('path').join(__dirname, '..'), encoding: 'utf8' });
    assert.ok(/失败,? 0|失败 0/.test(out) || out.includes('0 失败'), '输出未见零失败: ' + out.slice(-120));
  });
});
// r311（significance × mental_accounting 合卷轮测）的 sig 段本轮复跑全绿，
// 但其 mental_accounting 段 2 个 SPEND_EN2 注入断言在 r319 改动前就红
// （已在 6e49f21 基线 commit 用 git worktree 实证），属存量红、非本轮引入；
// 此处锁定「恰好这 2 条存量红、无新增红」。
check('D 存量回归：r311 恰好 2 条存量红（SPEND_EN2，基线已存在），sig 段无新增红', () => {
  let out = '';
  try {
    out = execFileSync(process.execPath, ['test/round-311-sig-verdict-ma-legs.test.js'],
      { cwd: require('path').join(__dirname, '..'), encoding: 'utf8' });
  } catch (e) { out = e.stdout || ''; }
  const fails = out.split('\n').filter(l => l.includes('✗'));
  assert.strictEqual(fails.length, 2, '存量红数量变化: ' + fails.join(' | '));
  for (const l of fails) assert.ok(l.includes('SPEND_EN2'), '非预期失败项: ' + l);
  assert.ok(out.includes('19 通过'), 'sig 段通过数异常: ' + out.slice(-80));
});

// ─── E: 常量级注入（删整组新常量 → 代表攻击不再命中）──────────
const E_CASES = [
  ['present_bias 删 NOW_ZH3', PB.detectPresentBias, '先用后付无压力，账单是未来的我在头疼', { NOW_ZH3: [] }],
  ['present_bias 删 LATER_ZH3', PB.detectPresentBias, '先用后付无压力，账单是未来的我在头疼', { LATER_ZH3: [] }],
  ['present_bias 删 NOW_EN3', PB.detectPresentBias, 'Buy now, pay later — the bill is my future self\'s problem', { NOW_EN3: [] }],
  ['peak_end_rule 删 WHOLE_VERDICT_ZH3', PE.detectPeakEndRule, '过程再怎么折腾都无所谓，只要结局足够惊艳就算成功', { WHOLE_VERDICT_ZH3: [] }],
  ['peak_end_rule 删 DURATION_ZH3', PE.detectPeakEndRule, '中间吃了多少苦不重要，结尾漂亮就够了', { DURATION_ZH3: [] }],
  ['peak_end_rule 删 WHOLE_VERDICT_EN3', PE.detectPeakEndRule, 'The process does not matter, as long as the ending is great', { WHOLE_VERDICT_EN3: [] }],
  ['peak_end_rule 删 DURATION_EN3', PE.detectPeakEndRule, 'All the hardship along the way is forgotten — the finale was fine, yyds', { DURATION_EN3: [] }],
  ['endowment_effect 删 OWN_ZH3', EE.detectEndowmentEffect, '我伺候了这么多年的园子，少一分钱都不出手', { OWN_ZH3: [] }],
  ['endowment_effect 删 INFLATE_EN3', EE.detectEndowmentEffect, 'This heirloom has been in our family for generations, no price is enough', { INFLATE_EN3: [] }],
  ['significance 删 SIG_ZH3', SS.detectSignificanceEffectSize, '这次结果擦线达到显著，说明药确实有效', { SIG_ZH3: [] }],
  ['significance 删 SIG_EN3', SS.detectSignificanceEffectSize, 'Just crossed the significance threshold, so the new treatment works', { SIG_EN3: [] }],
  ['significance 删 SUPERIOR_ZH3', SS.detectSignificanceEffectSize, '擦线达到显著，说明改进是真实存在的', { SUPERIOR_ZH3: [] }],
  ['significance 删 SUPERIOR_EN3', SS.detectSignificanceEffectSize, 'p came out at 0.049, barely significant, which proves the treatment works', { SUPERIOR_EN3: [] }],
  ['significance 删 SCALE_ZH3', SS.detectSignificanceEffectSize, '勉强达到显著，说明值得推广', { SCALE_ZH3: [] }],
];
for (const [name, fn, sample, inject] of E_CASES) {
  check(`E 常量级注入：${name} → 攻击不再命中`, () => {
    assert.strictEqual(fn(sample).hit, true, '基线未命中: ' + sample);
    assert.strictEqual(fn(sample, inject).hit, false, '删常量后仍命中: ' + sample);
  });
}

// ─── F: 元素级注入（40 个新元素逐条删除 → 最小样本不再命中）────
// 样本设计纪律：最小样本里该元素必须是所属腿的唯一来源（存量腿与
// r314/r310/r311 腿均不覆盖），删后整句必须失配。
const F_CASES = [
  // present_bias NOW_ZH3（6）：未来腿统一用「账单是未来的我在头疼」
  // （存量 LATER_ZH[1] 只收「以后的我在头疼」，不收「未来的我」）
  ['PB NOW_ZH3[0] BNPL+无痛化', PBI, 'NOW_ZH3', 0, PB.detectPresentBias, '先用后付无压力，账单是未来的我在头疼'],
  ['PB NOW_ZH3[1] BNPL+当下', PBI, 'NOW_ZH3', 1, PB.detectPresentBias, '先享后付就是给当下开的通道，账单是未来的我在头疼'],
  ['PB NOW_ZH3[2] 零首付+拿走', PBI, 'NOW_ZH3', 2, PB.detectPresentBias, '零首付开走，月供让以后的自己去还'],
  ['PB NOW_ZH3[3] 四舍五入≈免费', PBI, 'NOW_ZH3', 3, PB.detectPresentBias, '四舍五入就是不要钱，账单是未来的我在头疼'],
  ['PB NOW_ZH3[4] 平摊没几块', PBI, 'NOW_ZH3', 4, PB.detectPresentBias, '这笔分期平摊到每天没几块钱，账单是未来的我在头疼'],
  ['PB NOW_ZH3[5] 等于白送', PBI, 'NOW_ZH3', 5, PB.detectPresentBias, '这个价格等于白送，账单是未来的我在头疼'],
  // present_bias LATER_ZH3（3）
  ['PB LATER_ZH3[0] 账单是未来的我', PBI, 'LATER_ZH3', 0, PB.detectPresentBias, '先用后付无压力，账单是未来的我在头疼'],
  ['PB LATER_ZH3[1] 让以后的自己', PBI, 'LATER_ZH3', 1, PB.detectPresentBias, '零首付开走，月供让以后的自己去还'],
  ['PB LATER_ZH3[2] 先X了再说', PBI, 'LATER_ZH3', 2, PB.detectPresentBias, '先用后付四舍五入等于不要钱，先买下来再说'],
  // present_bias NOW_EN3（5）
  ['PB NOW_EN3[0] buy now pay later', PBI, 'NOW_EN3', 0, PB.detectPresentBias, 'Buy now, pay later — the bill is my future self\'s problem'],
  ['PB NOW_EN3[1] zero down payment', PBI, 'NOW_EN3', 1, PB.detectPresentBias, 'Zero down payment and drive it home today; my future self can deal with it'],
  ['PB NOW_EN3[2] split into four', PBI, 'NOW_EN3', 2, PB.detectPresentBias, 'Split it into four payments; my future self can handle it'],
  ['PB NOW_EN3[3] cost almost nothing', PBI, 'NOW_EN3', 3, PB.detectPresentBias, 'Four payments that cost almost nothing — my future self can sort it out'],
  ['PB NOW_EN3[4] interest-free', PBI, 'NOW_EN3', 4, PB.detectPresentBias, 'Four interest-free payments and my future self can handle the rest'],
  // peak_end_rule WHOLE_VERDICT_ZH3（3）
  ['PE WHOLE_VERDICT_ZH3[0] 只要结局…就算成功', PEI, 'WHOLE_VERDICT_ZH3', 0, PE.detectPeakEndRule, '过程再怎么折腾都无所谓，只要结局足够惊艳就算成功'],
  ['PE WHOLE_VERDICT_ZH3[1] 结尾漂亮就够了', PEI, 'WHOLE_VERDICT_ZH3', 1, PE.detectPeakEndRule, '过程再怎么折腾都无所谓，结尾漂亮就够了'],
  ['PE WHOLE_VERDICT_ZH3[2] 封神/yyds/N刷', PEI, 'WHOLE_VERDICT_ZH3', 2, PE.detectPeakEndRule, '全程都在踩坑，收官惊艳，整件事封神了'],
  // peak_end_rule DURATION_ZH3（5）：裁定词与峰词之间留间隔
  // （detect 要求 dist(dur, peak) !== 0，逗号相邻会腰斩配对）
  ['PE DURATION_ZH3[0] 再怎么折腾都无所谓', PEI, 'DURATION_ZH3', 0, PE.detectPeakEndRule, '过程再怎么折腾都无所谓，只要结局足够惊艳就算成功'],
  ['PE DURATION_ZH3[1] 吃了多少苦不重要', PEI, 'DURATION_ZH3', 1, PE.detectPeakEndRule, '中间吃了多少苦不重要，只要结局足够惊艳就算成功'],
  ['PE DURATION_ZH3[2] 不管过程多难', PEI, 'DURATION_ZH3', 2, PE.detectPeakEndRule, '不管过程多难，只要结局足够惊艳就算成功'],
  ['PE DURATION_ZH3[3] 吃的苦都会忘掉', PEI, 'DURATION_ZH3', 3, PE.detectPeakEndRule, '这次创业吃的苦都会忘掉，最后上市那一刻一切都值了'],
  ['PE DURATION_ZH3[4] 全程都在踩坑', PEI, 'DURATION_ZH3', 4, PE.detectPeakEndRule, '全程都在踩坑，收官惊艳，整件事封神了'],
  // peak_end_rule WHOLE_VERDICT_EN3（3）
  ['PE WHOLE_VERDICT_EN3[0] as long as', PEI, 'WHOLE_VERDICT_EN3', 0, PE.detectPeakEndRule, 'The process does not matter, as long as the ending is great'],
  ['PE WHOLE_VERDICT_EN3[1] yyds/GOAT', PEI, 'WHOLE_VERDICT_EN3', 1, PE.detectPeakEndRule, 'The process dragged forever; the ending itself was fine, but yyds'],
  ['PE WHOLE_VERDICT_EN3[2] masterpiece', PEI, 'WHOLE_VERDICT_EN3', 2, PE.detectPeakEndRule, 'The process dragged forever; the ending itself was fine, but the entire experience was a masterpiece'],
  // peak_end_rule DURATION_EN3（3）
  ['PE DURATION_EN3[0] does not matter', PEI, 'DURATION_EN3', 0, PE.detectPeakEndRule, 'The process does not matter, the ending was incredible, yyds'],
  ['PE DURATION_EN3[1] regardless of', PEI, 'DURATION_EN3', 1, PE.detectPeakEndRule, 'Regardless of the struggle, the ending was incredible, yyds'],
  ['PE DURATION_EN3[2] hardship along the way', PEI, 'DURATION_EN3', 2, PE.detectPeakEndRule, 'All the hardship along the way is forgotten — the finale was fine, yyds'],
  // endowment_effect OWN_ZH3（2）
  ['EE OWN_ZH3[0] 伺候了这么多年', EEI, 'OWN_ZH3', 0, EE.detectEndowmentEffect, '我伺候了这么多年的园子，少一分钱都不出手'],
  ['EE OWN_ZH3[1] 三代人住过的', EEI, 'OWN_ZH3', 1, EE.detectEndowmentEffect, '这房子是咱家三代人住过的，低于心理价位免谈'],
  // endowment_effect INFLATE_EN3（3）
  ['EE INFLATE_EN3[0] no price is enough', EEI, 'INFLATE_EN3', 0, EE.detectEndowmentEffect, 'This heirloom has been in our family for generations, no price is enough'],
  ['EE INFLATE_EN3[1] would take a big premium', EEI, 'INFLATE_EN3', 1, EE.detectEndowmentEffect, 'My grandfather left me this watch, selling it would take a big premium'],
  ['EE INFLATE_EN3[2] lowball offer is insulting', EEI, 'INFLATE_EN3', 2, EE.detectEndowmentEffect, 'I have been building this shop from nothing; their lowball offer is insulting'],
  // significance_effect_size SIG_ZH3（2）：SIG_ZH3[0] 样本避开 p 值锚
  // （存量 SIG_ZH[0] /p\s*值/ 会代拦）
  ['SS SIG_ZH3[0] 擦线/踩线/勉强显著', SSI, 'SIG_ZH3', 0, SS.detectSignificanceEffectSize, '这次结果擦线达到显著，说明药确实有效'],
  ['SS SIG_ZH3[1] p 卡在 0.05 关口', SSI, 'SIG_ZH3', 1, SS.detectSignificanceEffectSize, 'p 卡在 0.05 关口，足以说明干预有效'],
  // significance_effect_size SIG_EN3（2）
  ['SS SIG_EN3[0] p came out at', SSI, 'SIG_EN3', 0, SS.detectSignificanceEffectSize, 'p came out at 0.049, barely significant, which proves the treatment works'],
  ['SS SIG_EN3[1] just crossed the threshold', SSI, 'SIG_EN3', 1, SS.detectSignificanceEffectSize, 'Just crossed the significance threshold, so the new treatment works'],
  // significance_effect_size SUPERIOR_ZH3（1）
  ['SS SUPERIOR_ZH3[0] 改进是真实存在的', SSI, 'SUPERIOR_ZH3', 0, SS.detectSignificanceEffectSize, '擦线达到显著，说明改进是真实存在的'],
  // significance_effect_size SUPERIOR_EN3（1）
  ['SS SUPERIOR_EN3[0] the treatment works', SSI, 'SUPERIOR_EN3', 0, SS.detectSignificanceEffectSize, 'p came out at 0.049, barely significant, which proves the treatment works'],
  // significance_effect_size SCALE_ZH3（1）：需带推断词（sig×裁定×推断三方配对）
  ['SS SCALE_ZH3[0] 可以/值得推广', SSI, 'SCALE_ZH3', 0, SS.detectSignificanceEffectSize, '勉强达到显著，说明值得推广'],
];
for (const [name, I, key, i, fn, sample] of F_CASES) {
  check(`F 元素级注入：${name} → 最小样本不再命中`, () => {
    const arr = I[key];
    assert.ok(Array.isArray(arr), '常量未登记: ' + key);
    assert.ok(i < arr.length, '索引越界: ' + key + '[' + i + ']');
    assert.strictEqual(fn(sample).hit, true, '基线未命中: ' + sample);
    const filtered = arr.slice();
    filtered.splice(i, 1);
    assert.strictEqual(fn(sample, { [key]: filtered }).hit, false, '删元素后仍命中: ' + sample);
  });
}
check('F 登记口径：四模块新常量元素数 14/14/5/7 共 40', () => {
  assert.strictEqual(PBI.NOW_ZH3.length + PBI.LATER_ZH3.length + PBI.NOW_EN3.length, 14);
  assert.strictEqual(PEI.WHOLE_VERDICT_ZH3.length + PEI.DURATION_ZH3.length + PEI.WHOLE_VERDICT_EN3.length + PEI.DURATION_EN3.length, 14);
  assert.strictEqual(EEI.OWN_ZH3.length + EEI.INFLATE_EN3.length, 5);
  assert.strictEqual(SSI.SIG_ZH3.length + SSI.SIG_EN3.length + SSI.SUPERIOR_ZH3.length + SSI.SUPERIOR_EN3.length + SSI.SCALE_ZH3.length, 7);
  assert.strictEqual(F_CASES.length, 40);
});

// ─── G: 入口双路 ────────────────────────────────────────────
check('G 入口双路：gate() 与 checkOutput() 对 8 条代表样本均非 pass', () => {
  for (const t of [PB_ATTACKS[0], PE_ATTACKS[0], EE_ATTACKS[1], SS_ATTACKS[0],
    PB_ATTACKS[5], PE_ATTACKS[7], EE_ATTACKS[3], SS_ATTACKS[5]]) {
    const r1 = gateFn(t);
    const a1 = r1.action || (r1.gate && r1.gate.action);
    assert.notStrictEqual(a1, 'pass', 'gate() 放行: ' + t);
    const r2 = gateMod.checkOutput ? gateMod.checkOutput(t) : null;
    if (r2) {
      const a2 = r2.action || (r2.gate && r2.gate.action);
      assert.notStrictEqual(a2, 'pass', 'checkOutput() 放行: ' + t);
    }
  }
});

// ─── H: 登记纪律 ────────────────────────────────────────────
check('H 登记纪律：ECON FAMILIES 表含四子族且 fn 名正确', () => {
  const fams = ECON.FAMILIES;
  assert.ok(Array.isArray(fams), 'FAMILIES 不可见');
  for (const [key, fn] of [['present_bias', 'detectPresentBias'], ['peak_end_rule', 'detectPeakEndRule'],
    ['endowment_effect', 'detectEndowmentEffect'], ['significance_effect_size', 'detectSignificanceEffectSize']]) {
    const f = fams.find(x => x.key === key);
    assert.ok(f, 'FAMILIES 缺 ' + key);
    assert.strictEqual(f.fn, fn, key + ' fn 名不符');
  }
});
check('H 登记纪律：四模块 __internals 导出本轮 11 常量', () => {
  for (const k of ['NOW_ZH3', 'NOW_EN3', 'LATER_ZH3']) assert.ok(Array.isArray(PBI[k]), 'PB 缺导出: ' + k);
  for (const k of ['WHOLE_VERDICT_ZH3', 'WHOLE_VERDICT_EN3', 'DURATION_ZH3', 'DURATION_EN3']) assert.ok(Array.isArray(PEI[k]), 'PE 缺导出: ' + k);
  for (const k of ['OWN_ZH3', 'INFLATE_EN3']) assert.ok(Array.isArray(EEI[k]), 'EE 缺导出: ' + k);
  for (const k of ['SIG_ZH3', 'SIG_EN3', 'SUPERIOR_ZH3', 'SUPERIOR_EN3', 'SCALE_ZH3']) assert.ok(Array.isArray(SSI[k]), 'SS 缺导出: ' + k);
});
check('H 登记纪律：四模块头注记含 [r319', () => {
  const fs = require('fs');
  const path = require('path');
  for (const f of ['present-bias.js', 'peak-end-rule.js', 'endowment-effect.js', 'significance-effect-size.js']) {
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8');
    assert.ok(src.includes('[r319'), '头注记缺 r319: ' + f);
  }
});
check('H 登记纪律：VERSION 未被本轮改动（6.8.179）', () => {
  const fs = require('fs');
  const path = require('path');
  const v = fs.readFileSync(path.join(__dirname, '..', 'VERSION'), 'utf8').trim();
  assert.strictEqual(v, '6.8.179', 'VERSION 应保持 6.8.179（继承远端对齐值）');
});

console.log(`\nr319 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
