/**
 * 第 79 维度 percentage_overflow（分配占比合计溢出）单元测试
 * v6.8.28 / 第 545 轮（r544 立项、r545 收口）
 *
 * 判据：分配语境 × 分项 ≥ 2 × 和 > 100.5%
 * 四类排除：变化语境 / 频率统计 / 时段分期 / 完成度
 */
'use strict';

const assert = require('assert');
const path = require('path');
const { checkPercentageOverflow } = require(path.join(__dirname, '..', 'src', 'percentage-overflow.js'));

// [r557 修复] 原文件用 describe(...) 包裹整个用例体，且终止括号写在
// 第 171 行（describe 回调尾部）——裸跑时 describe 未定义直接抛
// ReferenceError，run-all 拿不到任何「N 通过, M 失败」汇总行，
// 于是该文件长期计为 failed（污染 data/test-count.json，
// 进而让 doc-numbers 的规格表断言进入自锁）。改为仓库约定的裸跑型。

{
  let pass = 0, fail = 0;
  const failures = [];
  const t = (name, fn) => {
    try { fn(); pass++; } catch (e) { fail++; failures.push(`${name}: ${e.message}`); }
  };

  // ── 攻击族：分配语境 × 和 > 100% ──────────────────────
  const attacks = [
    ['中文菜单分配溢出', 'A 占 80%，B 占 70%，两者合计覆盖全部场景。'],
    ['中文选择分项溢出', '调研显示，45% 的用户选择了 A，55% 的用户选择了 B，还有 30% 选择了 C。'],
    ['市场营收占比溢出', '北美市场占营收的 60%，欧洲市场占 50%，两者相加已超过百分之百。'],
    ['团队构成分项溢出', '团队里 70% 是工程师，60% 是设计师，其余为运营人员。'],
    ['英文预算分配溢出', '60% of the budget goes to marketing and 55% goes to R&D.'],
    ['性别构成分项溢出', '男性占 55%，女性占 48%，其他占 5%。'],
    ['投入用途分项溢出', '研发投入占 40%，市场投入占 45%，行政占 20%，合计远超百分之百。'],
    ['投票分项溢出', '35% voted yes, 40% voted no, and 30% abstained.'],
    ['梯队分组溢出', '第一梯队占 33%，第二梯队占 34%，第三梯队占 34%，另有 10% 未分组。'],
    ['预算用途溢出', '总预算的 48% 用于人力，52% 用于设备，还有 15% 用于场地。'],
    ['英文选择分项溢出', '60% of respondents chose A, 50% chose B.'],
    ['部门占比溢出', '甲部门占 65%，乙部门占 40%，剩余部门分其他部分。'],
    ['民调分项溢出', '受访者中 58% 支持，42% 反对，另有 12% 表示中立。'],
    ['预算产品市场溢出', '预算的 55% 用于产品，46% 用于市场，剩下 20% 用于研发。'],
    ['英文地域构成溢出', '50% of the students are from China, 45% from India, and 15% from Europe.'],
    ['样本性别填写溢出', '样本中 62% 为男性，38% 为女性，还有 5% 未填写性别。'],
  ];
  for (const [name, text] of attacks) {
    t('attack: ' + name, () => {
      const r = checkPercentageOverflow(text);
      assert.strictEqual(r.hit, true, '应命中');
      assert.ok(r.score >= 0.7, `score 应 ≥0.7，实际 ${r.score}`);
      assert.ok(/合计溢出/.test(r.detail), 'detail 应含合计溢出说明');
    });
  }

  // ── 排除规则一：变化语境 ──────────────────────────────
  const changeExcluded = [
    '第一季度营收增长 12%，利润增长 8%。',
    '渗透率从 12% 提升到 35%，市场规模翻倍。',
    '同比增长 15%，环比增长 3%。',
    'The rate rose from 12% to 35% this quarter.',
  ];
  for (const text of changeExcluded) {
    t('exclude-change: ' + text.slice(0, 18), () => {
      assert.strictEqual(checkPercentageOverflow(text).hit, false);
    });
  }

  // ── 排除规则二：频率统计 ──────────────────────────────
  const freqExcluded = [
    '活跃用户中 68% 每天登录，72% 每周登录。',
    'The survey found 30% exercise daily, 45% weekly, 25% rarely.',
  ];
  for (const text of freqExcluded) {
    t('exclude-freq: ' + text.slice(0, 18), () => {
      assert.strictEqual(checkPercentageOverflow(text).hit, false);
    });
  }

  // ── 排除规则三：时段 / 分期 ───────────────────────────
  const phaseExcluded = [
    '上半年完成度 50%，下半年完成度 60%。',
    '第一周完成 55%，第二周完成 60%。',
  ];
  for (const text of phaseExcluded) {
    t('exclude-phase: ' + text.slice(0, 18), () => {
      assert.strictEqual(checkPercentageOverflow(text).hit, false);
    });
  }

  // ── 排除规则四：完成度 / 进度 ─────────────────────────
  const progressExcluded = [
    '前端进度 60%，后端进度 70%。',
    'The project is 60% done on the frontend and 70% done on the backend.',
  ];
  for (const text of progressExcluded) {
    t('exclude-progress: ' + text.slice(0, 18), () => {
      assert.strictEqual(checkPercentageOverflow(text).hit, false);
    });
  }

  // ── 排除规则五：不同指标的比率 ────────────────────────
  const rateExcluded = [
    '检测准确率 95%，误报率 2%，漏报率 8%。',
    '该方法在测试集上准确率 91.5%，F1 分数 0.89。',
    'CPU 占用率 85%，内存占用率 78%，磁盘占用率 45%。',
    '本次考试语文及格率为 30%，数学及格率为 25%。',
  ];
  for (const text of rateExcluded) {
    t('exclude-rate: ' + text.slice(0, 18), () => {
      assert.strictEqual(checkPercentageOverflow(text).hit, false);
    });
  }

  // ── 良性样本（正常分配陈述）──────────────────────────
  const benign = [
    '华北区占 30%，华东区占 35%，华南区占 20%，其他区域合计 15%。',
    '45% 的用户选择了 A，55% 的用户选择了 B。',
    '中国大陆占 45%，港澳台占 8%，海外占 47%。',
    '用户中 45% 为女性，55% 为男性。',
    '北美市场占 60%，欧洲市场占 30%，亚太占剩余 10%。',
    '70% of respondents agreed, while 20% disagreed and 10% were neutral.',
    '系统延迟从 200ms 降到 50ms。',
    '团队有 5 名工程师，3 名设计师。',
    '注册用户 10000 人，其中 80% 完成了首次登录。',
    '今年营收 800 万，其中利润占比 12%。',
    '华东区销售额占比 55%，华南占比 30%。',
  ];
  for (const text of benign) {
    t('benign: ' + text.slice(0, 18), () => {
      assert.strictEqual(checkPercentageOverflow(text).hit, false);
    });
  }

  // ── 边界：单个百分比不判 ──────────────────────────────
  t('boundary: single-pct', () => {
    assert.strictEqual(checkPercentageOverflow('用户中 80% 是男性。').hit, false);
  });
  t('boundary: exactly-100', () => {
    assert.strictEqual(checkPercentageOverflow('甲占 50%，乙占 50%。').hit, false);
  });
  t('boundary: short-text', () => {
    assert.strictEqual(checkPercentageOverflow('占 60%').hit, false);
    assert.strictEqual(checkPercentageOverflow('').hit, false);
    assert.strictEqual(checkPercentageOverflow(null).hit, false);
  });
  t('boundary: near-threshold-100.4', () => {
    // 差异在四舍五入容差内（0.5 个百分点），不判
    assert.strictEqual(checkPercentageOverflow('甲约 50.2%，乙约 50.2%。').hit, false);
  });
  t('boundary: overflow-105-grades-score', () => {
    const r = checkPercentageOverflow('甲占 60%，乙占 50%，丙占 10%，合计严重溢出。');
    assert.strictEqual(r.hit, true);
    assert.ok(r.score >= 0.85, `和 ≥105 时 score 应 ≥0.85，实际 ${r.score}`);
  });

  // ── 端到端：gate 层 verify + findings 含新维度 ────────
  t('e2e: gate returns verify with new dimension', () => {
    const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
    const r = gate('团队里 70% 是工程师，60% 是设计师，其余为运营人员。');
    assert.strictEqual(r.gate.action, 'verify');
    assert.ok(r.findings.some(f => f.dimension === 'percentage_overflow'),
      'findings 应含 percentage_overflow');
    const dim = r.dimensions.percentage_overflow;
    assert.strictEqual(dim.hit, true);
  });

  t('e2e: benign stays pass', () => {
    const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
    const r = gate('华北区占 30%，华东区占 35%，华南区占 20%，其他区域合计 15%。');
    assert.strictEqual(r.dimensions.percentage_overflow.hit, false);
  });

  console.log('');
  console.log(`percentage_overflow: ${pass} passed, ${fail} failed`);
  if (failures.length) console.log(failures.join('\n'));
  process.exit(fail > 0 ? 1 : 0);
}
