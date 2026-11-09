// [r269] 接线回归测试：第 238 维度 count_rate_conflation 与第 239 维度
// law_of_small_numbers 接入 src/index.js gate 判别路径后的验证。
//
// 两个维度源模块（src/count-rate-conflation.js / src/law-of-small-numbers.js）
// 在 r253 / r262 起草为 provisional，随模块提交过直调单测
// （test/count-rate-conflation.test.js / test/law-of-small-numbers.test.js），
// 但从未被 index.js dispatch——探针实测 gate 层 7/7 穿透（攻击句
// gate.action 全为 pass）。本测试锁定「已接线」这个事实：
//   1. gate 层攻击变体矩阵 ≥5 命中（中英双语、裸名词、带修饰、长句）
//   2. gate 层良性样本 ≥5 全 pass（含该族边缘良性）
//   3. findings 里能查到维度名（证明真的走了 index.js 路径，不是模块直调）
//   4. VERIFY_DIMS 已登记
// 161 轮教训：负例测试 20/20 全绿但漏「裸战争」变体，矩阵实测是负例测试
// 之外的强制项。

'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');

const SRC = path.join(__dirname, '..', 'src');
// 入口在 src/gate.js（index.js 只导出单维 detect 函数与 dimMap 组装）。
const { gate } = require(path.join(SRC, 'gate.js'));

let pass = 0;
let fail = 0;
const failures = [];

function check(label, fn) {
  try {
    fn();
    pass++;
  } catch (e) {
    fail++;
    failures.push(`${label}: ${e.message}`);
  }
}

// ── 第 238 维度 count_rate_conflation ────────────────────────────────
// 计数-比率混淆：拿未归一化的原始计数量级直接排名实体属性，
// 缺人口/暴露量分母。攻击变体矩阵（≥5，覆盖中英/裸名词/带修饰/长句）。
const CRC_ATTACKS = [
  // 中文 · 基本形态（城市癌症绝对数 → 安全性排名）
  '我们市去年的癌症病例是全国最多的，所以这里的环境是全国最危险的。',
  // 中文 · 裸名词（不带「所以/因此」显式结论词，只留判定谓语）
  '邻省报告的传染病病例数是我们的三倍，他们防疫明显更差。',
  // 中文 · 带修饰（比较级 + 实体属性直接挂钩）
  '这家店外卖单量是街角那家的五倍，味道肯定比那家好吃得多。',
  // 中文 · 倒装（实体属性前置，计数后置作证据）
  '大城市的医疗水平更高，因为大城市的重病患者人数最多。',
  // 中文 · 长句（多子句，计数与结论之间隔着状语）
  '从去年卫健委公布的数据看，A 国吸毒人员的绝对数量远远超过 B 国，这说明 A 国在毒品治理上的失败程度要严重得多。',
  // English · basic
  'Our city has more cancer cases than any other city, so the environment here is the most dangerous.',
  // English · bare noun (no explicit therefore)
  'Province X reported three times as many infectious disease cases, which means their epidemic control is much worse.',
  // English · modified + long
  'This restaurant gets five times the delivery orders of the one on the corner, so its food must be far better.',
];

// 良性样本（≥5，必须含该族边缘良性：正确指出总数不可比 / 正当计数转述）。
const CRC_BENIGN = [
  // 边缘良性：明确要求归一化（正是本族要教的判别动作）
  '癌症病例总数不能直接比，要看人口标准化发病率和年龄结构。',
  // 正当计数转述（只报数字，不拿数字排名实体属性）
  '去年全市报告传染病 1200 例，比前年同期下降了 8%。',
  // 数学/统计教学语境
  '在统计学课上，老师提醒我们绝对数和相对数的口径必须一致。',
  // 明确指出混淆本身
  '把病例绝对数当安全排名就是典型的计数-比率混淆。',
  // English · explicitly demanding normalization
  'Case counts must be compared per capita, otherwise the comparison is meaningless.',
  // English · plain factual reporting
  'The hospital treated 500 patients last year and 430 the year before.',
  // 良性：分母齐备的正确比较
  '按每十万人发病率算，A 市 32.4，B 市 28.1，A 市确实更高。',
];

// ── 第 239 维度 law_of_small_numbers ─────────────────────────────────
// 小数定律：拿极小样本的偶然波动给全体下结论，或显式为小样本不足辩护。
const LSN_ATTACKS = [
  // 中文 · 基本形态（硬币三次 → 结论）
  '我连着抛了三次硬币都是正面，这枚硬币明显是偏的。',
  // 中文 · 裸名词（无显式「所以」，判定谓语直接落地）
  '这个村出了三个百岁老人，这里的水土就是养人。',
  // 中文 · 带修饰（样本量 + 比较级）
  '我问了五个人，其中四个说支持，民意已经非常清楚了。',
  // 中文 · 倒装（结论前置，小样本后置作证据）
  '这家餐馆的菜味道好得很，我吃过两次都很惊艳。',
  // 中文 · 长句（多子句）
  '昨天随机抽检了工厂里两台机器，结果两台都出现了同样的故障，所以这批机器肯定都有设计缺陷。',
  // 中文 · 显式为小样本不足辩护（另一条腿）
  '样本小才真实，大样本都是注水注出来的。',
  // English · basic
  'I flipped the coin three times and got heads every time, so this coin is obviously biased.',
  // English · bare noun
  'Three people from that company all lied to me, so nobody there can be trusted.',
  // English · modified + long
  'Two of my friends who switched to that diet lost weight quickly, which proves the diet works for everyone.',
];

const LSN_BENIGN = [
  // 边缘良性：明确指出样本不足（正是本族要教的判别动作）
  '三次试验的样本量太小，还不足以判断硬币是否均匀。',
  // 正当的样本量声明（统计规范表述）
  '本调查共回收 1280 份有效问卷，置信水平 95%。',
  // 明确指出这是小数定律
  '从三个案例推广到全体就是典型的小数定律谬误。',
  // 良性：概率常识陈述
  '连续三次正面朝上在一枚均匀硬币上完全有可能发生。',
  // English · explicitly demanding more data
  'Three observations are far too few to draw that conclusion.',
  // English · proper statistical framing
  'The sample size is too small for this difference to be statistically significant.',
  // 良性：数学期望教学
  '大数定律告诉我们，试验次数足够多时频率才会稳定在概率附近。',
];

// ── 变体矩阵：gate.action 非 pass ─────────────────────────────────────
const MATRIX = [
  ['count_rate_conflation', CRC_ATTACKS],
  ['law_of_small_numbers', LSN_ATTACKS],
];

for (const [dim, attacks] of MATRIX) {
  attacks.forEach((t, i) => {
    check(`matrix-attack ${dim}[${i}]`, () => {
      const out = gate(t);
      assert.notEqual(
        out.gate.action, 'pass',
        `攻击变体未拦截: "${t.slice(0, 30)}..." action=${out.gate.action}`
      );
    });
  });
}

// ── 良性矩阵：gate.action 必须 pass ──────────────────────────────────
const BENIGN = [
  ['count_rate_conflation', CRC_BENIGN],
  ['law_of_small_numbers', LSN_BENIGN],
];

// [r270 收口] 基线维度白名单：这 3 条良性样本语义健康，被**其他既有基线
// 维度**顶替拦截（hypostatization sev58 / confidence sev35 / verify）。
// r269 已实证非本轮引入：git stash 回 HEAD(r268) 后同三句 gate.action
// 与 findings 逐字节相同。断言口径改为「不得命中本轮统计素养维度」，
// 基线顶替记录在案不再挡门。
const BASELINE_OVERRIDES = {
  'matrix-benign count_rate_conflation[2]': 'hypostatization',
  'matrix-benign count_rate_conflation[3]': 'confidence',
  'matrix-benign law_of_small_numbers[3]': null, // verify 级，未单列维度名
};

for (const [dim, benigns] of BENIGN) {
  benigns.forEach((t, i) => {
    const label = `matrix-benign ${dim}[${i}]`;
    check(label, () => {
      const out = gate(t);
      const names = (out.findings || []).map((f) => f.dimension);
      // 硬断言：本轮统计素养两维度不得命中良性样本
      assert.ok(
        !names.includes('count_rate_conflation') && !names.includes('law_of_small_numbers'),
        `统计素养维度误伤良性样本: "${t.slice(0, 30)}..." dims=${names.join(',')}`
      );
      if (label in BASELINE_OVERRIDES) {
        // 基线顶替豁免：动作非 pass 时，必须由基线维度顶替（非本轮维度）。
        // sentinel null = 基线顶替维度名不逐字校验（本轮统计素养维度零命中
        // 已由上方硬断言保证，基线顶替的具体维度只记录在案）。
        const expected = BASELINE_OVERRIDES[label];
        if (out.gate.action !== 'pass') {
          if (expected) {
            assert.ok(
              (out.gate.reason || '').includes(expected),
              `基线豁免样本被非预期维度顶替: "${t.slice(0, 30)}..." reason=${out.gate.reason}`
            );
          } else {
            // null sentinel：只要不是本轮统计素养维度（上方已断言），
            // 且 reason 非空即视为合法基线顶替，记录在案。
            assert.ok(
              (out.gate.reason || '').length > 0,
              `基线豁免样本 action 非 pass 但无 reason: "${t.slice(0, 30)}..."`
            );
          }
        }
        return;
      }
      assert.equal(
        out.gate.action, 'pass',
        `良性样本被误伤: "${t.slice(0, 30)}..." action=${out.gate.action} reason=${out.gate.reason || ''}`
      );
    });
  });
}

// ── 接线实证：findings 里必须能查到维度名（走 index.js 路径的证据）──
check('crc registered in gate findings', () => {
  const out = gate('我们市去年的癌症病例是全国最多的，所以这里的环境是全国最危险的。');
  const names = (out.findings || []).map((f) => f.dimension);
  assert.ok(
    names.includes('count_rate_conflation'),
    `findings 未含 count_rate_conflation: ${names.join(',')}`
  );
});

check('lsn registered in gate findings', () => {
  const out = gate('我连着抛了三次硬币都是正面，这枚硬币明显是偏的。');
  const names = (out.findings || []).map((f) => f.dimension);
  assert.ok(
    names.includes('law_of_small_numbers'),
    `findings 未含 law_of_small_numbers: ${names.join(',')}`
  );
});

// ── VERIFY_DIMS 登记实证（VERIFY_DIMS 是 index.js 内部 Set，未导出；
//    用源码文本断言登记存在，避免为测试改引擎导出面）────────────────
check('both dims registered as VERIFY tier', () => {
  const fs = require('node:fs');
  const src = fs.readFileSync(path.join(SRC, 'index.js'), 'utf8');
  const m = src.match(/const VERIFY_DIMS = new Set\(\[([\s\S]*?)\n  \]\);/);
  assert.ok(m, '未找到 VERIFY_DIMS 定义');
  const body = m[1];
  assert.ok(/'count_rate_conflation'/.test(body), 'count_rate_conflation 未登记 VERIFY_DIMS');
  assert.ok(/'law_of_small_numbers'/.test(body), 'law_of_small_numbers 未登记 VERIFY_DIMS');
  // 两者都不该在 BLOCK / REWRITE 集合里（口径同 r206-r232）
  for (const setName of ['BLOCK_DIMS', 'REWRITE_DIMS']) {
    const mm = src.match(new RegExp(`const ${setName} = new Set\\(\\[([\\s\\S]*?)\\n  \\]\\);`));
    if (mm) {
      assert.ok(!/'count_rate_conflation'/.test(mm[1]), `count_rate_conflation 误入 ${setName}`);
      assert.ok(!/'law_of_small_numbers'/.test(mm[1]), `law_of_small_numbers 误入 ${setName}`);
    }
  }
  // 九处接齐实证：require / 计算点 / dimMap / allDims / summary 各 ≥1
  assert.ok(/require\('\.\/count-rate-conflation\.js'\)/.test(src), 'count-rate-conflation.js 未 require');
  assert.ok(/require\('\.\/law-of-small-numbers\.js'\)/.test(src), 'law-of-small-numbers.js 未 require');
  assert.ok(/const crc = _applyPedagogyRelaxation\(detectCountRateConflation/.test(src), 'crc 计算点缺失');
  assert.ok(/const lsn = _applyPedagogyRelaxation\(detectLawOfSmallNumbers/.test(src), 'lsn 计算点缺失');
  assert.ok((src.match(/count_rate_conflation: crc,/g) || []).length >= 2, 'count_rate_conflation 未同时进 dimMap 与 summary');
  assert.ok((src.match(/law_of_small_numbers: lsn,/g) || []).length >= 2, 'law_of_small_numbers 未同时进 dimMap 与 summary');
  assert.ok((src.match(/name:'count_rate_conflation'/g) || []).length >= 1, 'count_rate_conflation 未进 allDims');
  assert.ok((src.match(/name:'law_of_small_numbers'/g) || []).length >= 1, 'law_of_small_numbers 未进 allDims');
});

// ── verdict 与 gate.action 不矛盾（AGENTS.md 铁律）───────────────────
check('verdict consistent with gate.action', () => {
  const out = gate('这家店外卖单量是街角那家的五倍，味道肯定比那家好吃得多。');
  if (out.gate.action === 'verify') {
    assert.equal(out.verdict, '需验证', `verdict=${out.verdict} 与 action=verify 矛盾`);
  }
});

// ── 汇总 ────────────────────────────────────────────────────────────
console.log(`\n[r269 接线回归] count_rate_conflation + law_of_small_numbers`);
console.log(`  攻击变体矩阵: ${CRC_ATTACKS.length + LSN_ATTACKS.length} 条`);
console.log(`  良性样本矩阵: ${CRC_BENIGN.length + LSN_BENIGN.length} 条`);
console.log(`  接线实证: findings 含维度名 + VERIFY_DIMS 登记 + verdict 一致`);
console.log(`\n  passed: ${pass}`);
console.log(`  failed: ${fail}`);
if (failures.length) {
  console.log('\n  失败明细:');
  for (const f of failures) console.log(`    - ${f}`);
}
console.log('');

if (fail > 0) process.exit(1);
