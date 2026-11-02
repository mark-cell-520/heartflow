/**
 * test/round-192-false-precision.js — 第 188 维度
 * false_precision（伪精确断言：无来源无约数的过分精确数字）负例注入测试
 * + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入「永不匹配正则」后，依赖该腿的攻击必须停止命中
 *      （证明不是装饰）；依赖某豁免的陷阱样本在抹掉它后必须转为命中
 *      （证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良性另在
 * variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部 gate.action 非 pass
 * 且 false_precision 维度承重，≥5 良性全部 pass）。
 *
 * 立项证据（/tmp/hf-probe-r192.js，直调 gate.js v6.8.118 / 187 维引擎）：
 * 本族 6 条攻击 4 条真零命中（「用户满意度达到 92.6 分」「性能提升了整整
 * 3.7 倍」「新药可延长预期寿命 12.5 年」「The study shows engagement
 * improved by exactly 47.83%.」全部 pass 且 findings 全空），另 2 条仅被
 * 非本族维度（proxy_metric_goal / unsupported_claim）代拦；6 条边缘良性
 * 零误伤。本维度收口 perfect_error S1 [v6.7.93] 度量名词语境豁免腾出的
 * 数字幻觉盲区。
 */
const assert = require('assert');
const { checkFalsePrecision } = require('../src/false-precision.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// 负例注入器：永不匹配的正则
const NEVER = /(?!x)x/;

// ─── 攻击样本（中文：小数%/小数倍/小数评分/小数年限/精确副词/裸名词/倒装/长句）──
const ATTACK_ZH = [
  '该方案使转化率提升了 37.42%，效果非常显著。',                 // 小数百分比+效果动词
  '用户满意度达到 92.6 分，远超预期。',                         // 小数评分+度量名词
  '性能提升了整整 3.7 倍，几乎没有代价。',                       // 精确副词「整整」+小数倍数
  '新药可延长预期寿命 12.5 年。',                               // 小数年限+寿命
  '准确率精确地达到 99.37%，创历史新高。',                       // 精确副词「精确地」+小数%
  '转化率 37.42%，完播率 21.8%。',                               // 裸名词形（无动词）伪精确陈列
  '高达 99.37% 的准确率，几乎无人能及。',                         // 倒装（数值先行）
  '经三轮迭代，系统响应速度提升了 2.8 倍，错误率下降到 0.37%。',   // 长句+双伪精确
  '该模型在测试集上的准确率达到 99.37%。',                       // 带修饰长句
  '这款面霜能让皮肤水分值提升到 87.5 分。',                       // 营销话术小数评分
  '术后复发率下降到 1.83%，效果堪称完美。',                       // 疗效小数%
  '只要坚持使用，专注力就能提高 2.4 倍。',                        // 条件句+小数倍
];
// ─── 攻击样本（英文）──
const ATTACK_EN = [
  'The study shows engagement improved by exactly 47.83%.',       // exactly+小数%
  'Our model achieves 99.37% accuracy on the benchmark.',         // 小数%+度量名词
  'The new drug extends life expectancy by 12.5 years.',          // 小数年限
  'Response time dropped 3.7x after the optimization.',           // 小数倍数
  'Customer satisfaction reached 92.6 points in the survey.',     // 小数评分
];

// ─── 良性样本（来源/对冲/仪器/时长/统计口径/元讨论/疑问/天然精确/边缘多因）──
const BENIGN = [
  '根据国家统计局 2025 年数据，增长率达到 5.2%。',                // 具名来源
  '用户满意度大约为 92.6 分，误差范围 ±0.3 分。',                 // 对冲+容差
  'Roughly 47.8% of respondents agreed.',                        // EN 对冲
  '该项目历时 2.5 年，参与人数达到 1200 人。',                    // 时长语境+自然计数
  '监控报表显示 CPU 使用率稳定在 87.3%。',                        // 仪器读数语域（r437 边界）
  '去年同期增长 18.5%，今年达到 21.3%。',                          // 统计口径（同比）
  'v6.8.118 版本于 2026-11-02 发布，共修改 12 个文件。',           // 版本号+日期+计数
  '圆周率 π 约等于 3.14159，误差可忽略。',                        // 数学常数+对冲
  '测量精度达到 0.01 毫米，符合工艺要求。',                        // 精度规格
  '气温达到 36.5 度，创本周新高。',                               // 物理量纲
  '手机售价 3999.50 元，全网最低。',                              // 金额（非族内单位）
  '请把数据保留两位小数，例如 87.35%。',                           // 元讨论（有效数字）
  '准确率能达到 99.37% 吗？',                                     // 疑问句
  '实验组有效率为 87.3%，对照组为 82.1%。',                        // 边缘：度量名词未入表且无效果动词（r192 已知边界①，保守不判）
  '战争是多因共同造成的，资源、文化、经济因素交织，不能单一归因。', // 边缘良性：多因陈述（无数字）
  'The project took 2.5 years to complete.',                      // EN 时长语境
  '压测报告显示接口耗时降低到 87.3% 以下。',                        // 仪器读数（报告+显示）
];

// ─── 一、正向：攻击全命中、良性全放行 ────────────────────────────
console.log('■ 正向（无注入态）');
for (const [i, s] of ATTACK_ZH.entries()) {
  t(`攻击ZH#${i + 1} 命中: ${s.slice(0, 28)}…`, () => {
    const r = checkFalsePrecision(s);
    assert.ok(r.hit, `未命中: ${JSON.stringify(r)}`);
    assert.ok(r.score >= 0.6, `分数过低: ${r.score}`);
  });
}
for (const [i, s] of ATTACK_EN.entries()) {
  t(`攻击EN#${i + 1} 命中: ${s.slice(0, 34)}…`, () => {
    const r = checkFalsePrecision(s);
    assert.ok(r.hit, `未命中: ${JSON.stringify(r)}`);
  });
}
for (const [i, s] of BENIGN.entries()) {
  t(`良性#${i + 1} 放行: ${s.slice(0, 24)}…`, () => {
    const r = checkFalsePrecision(s);
    assert.ok(!r.hit, `误命中: ${JSON.stringify(r)} → ${s}`);
  });
}

// ─── 二、承重：逐常量注入「永不匹配正则」 ────────────────────────
console.log('■ 常量负例注入承重');
const INJ_PREC_ZH = { PREC_ZH: [NEVER] };
const INJ_PREC_EN = { PREC_EN: [NEVER] };
const INJ_CLAIM_ZH = { CLAIM_ZH: [NEVER] };
const INJ_CLAIM_EN = { CLAIM_EN: [NEVER] };

t('腿①PREC_ZH承重：注入后中文攻击全停', () => {
  // 选「分/倍/年/精确副词」形——百分比形与 PREC_EN 的 % 模式同源共源，
  // 空 PREC_ZH 不会停（EN % 模式仍匹配），同源腿的承重由 EN 侧样例验证。
  const ZH_ONLY = ATTACK_ZH.filter(s => !/%|％/.test(s));
  assert.ok(ZH_ONLY.length >= 4, '中文非%形攻击样本不足');
  for (const s of ZH_ONLY) assert.ok(!checkFalsePrecision(s, INJ_PREC_ZH).hit, s);
});
t('腿①PREC_EN承重：注入后英文攻击全停', () => {
  // 选 years/points/x 形——百分比形与 PREC_ZH 同源，EN 独有形验证之。
  const EN_ONLY = ATTACK_EN.filter(s => /years|points|x\b/i.test(s));
  assert.ok(EN_ONLY.length >= 3, '英文独有形攻击样本不足');
  for (const s of EN_ONLY) assert.ok(!checkFalsePrecision(s, INJ_PREC_EN).hit, s);
});
t('腿②CLAIM_ZH承重：注入后中文攻击全停', () => {
  for (const s of ATTACK_ZH) assert.ok(!checkFalsePrecision(s, INJ_CLAIM_ZH).hit, s);
});
t('腿②CLAIM_EN承重：注入后英文攻击全停', () => {
  for (const s of ATTACK_EN) assert.ok(!checkFalsePrecision(s, INJ_CLAIM_EN).hit, s);
});

// 豁免承重：抹掉该豁免后，对应陷阱良性必须转为命中
const EXEMPT_CASES = [
  ['EXEMPT_HEDGE_ZH', '用户满意度大约为 92.6 分，误差范围 ±0.3 分。', { EXEMPT_HEDGE_ZH: [NEVER] }],
  ['EXEMPT_HEDGE_EN', 'Roughly 47.8% of respondents agreed.', { EXEMPT_HEDGE_EN: [NEVER] }],
  ['EXEMPT_SOURCE_ZH', '根据国家统计局 2025 年数据，增长率达到 5.2%。', { EXEMPT_SOURCE_ZH: [NEVER] }],
  ['EXEMPT_EXACT_ZH', '该项目历时 2.5 年，参与人数达到 1200 人。', { EXEMPT_EXACT_ZH: [NEVER] }],
  ['EXEMPT_INSTRUMENT_ZH', '监控报表显示 CPU 使用率稳定在 87.3%。', { EXEMPT_INSTRUMENT_ZH: [NEVER] }],
  ['EXEMPT_YOY_ZH', '去年同期增长 18.5%，今年达到 21.3%。', { EXEMPT_YOY_ZH: [NEVER] }],
  ['EXEMPT_META_ZH', '报告里通常保留两位小数，87.35% 的增长率会显示为 87.4%。', { EXEMPT_META_ZH: [NEVER] }],
];
for (const [name, sample, inj] of EXEMPT_CASES) {
  t(`豁免${name}承重：抹掉后「${sample.slice(0, 18)}…」转命中`, () => {
    assert.ok(!checkFalsePrecision(sample).hit, '无注入态应放行');
    assert.ok(checkFalsePrecision(sample, inj).hit, '注入后应转命中');
  });
}

// ─── 三、gate 层变体矩阵（161 轮教训：负例测试之外的强制项）──────
console.log('■ gate 变体矩阵');
const MATRIX_ATTACK = [
  '该方案使转化率提升了 37.42%，效果非常显著。',
  '用户满意度达到 92.6 分，远超预期。',
  '性能提升了整整 3.7 倍，几乎没有代价。',
  '新药可延长预期寿命 12.5 年。',
  'The study shows engagement improved by exactly 47.83%.',
  'Our model achieves 99.37% accuracy on the benchmark.',
  '高达 99.37% 的准确率，几乎无人能及。',
  '经三轮迭代，系统响应速度提升了 2.8 倍，错误率下降到 0.37%。',
];
for (const [i, s] of MATRIX_ATTACK.entries()) {
  t(`矩阵攻击#${i + 1} gate 非 pass 且 false_precision 承重`, () => {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', `action=${r.gate.action}`);
    assert.ok((r.findings || []).some(f => f.dimension === 'false_precision'),
      `false_precision 未承重: ${(r.findings || []).map(f => f.dimension).join(',')}`);
  });
}
const MATRIX_BENIGN = [
  '用户满意度大约为 92.6 分，误差范围 ±0.3 分。',
  '该项目历时 2.5 年，参与人数达到 1200 人。',
  '监控报表显示 CPU 使用率稳定在 87.3%。',
  'v6.8.118 版本于 2026-11-02 发布，共修改 12 个文件。',
  '圆周率 π 约等于 3.14159，误差可忽略。',
  '实验组有效率为 87.3%，对照组为 82.1%。',
  '战争是多因共同造成的，资源、文化、经济因素交织，不能单一归因。',
  'The project took 2.5 years to complete.',
];
for (const [i, s] of MATRIX_BENIGN.entries()) {
  t(`矩阵良性#${i + 1} gate pass`, () => {
    const r = gate(s);
    assert.strictEqual(r.gate.action, 'pass',
      `action=${r.gate.action} findings=${(r.findings || []).map(f => f.dimension).join(',')}`);
  });
}

// ─── 汇总 ────────────────────────────────────────────────────────
console.log(`\nround-192 false_precision: ${pass} passed / ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
