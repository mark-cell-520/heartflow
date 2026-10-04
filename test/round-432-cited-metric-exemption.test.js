/**
 * r432 测试：unsupported_claim「技术度量引用族」豁免 + 负例变异守卫。
 *
 * 缺口（scripts/round-432-fp-locator.js 定位 + round-432-uc-probe.js 量化）：
 *   5 条真实编造攻击全命中（score 0.45~0.9），但 4 条合规技术句被
 *   UNSUPPORTED_CLAIM_ZH 第 6 支 (增长|下降|达到)N% 判 score=0.45，
 *   gate verify 误拦。
 *
 * 分界铁律（本轮实测，正反两侧）：数据能否定位到具体出处。
 *   · 豁免 = 来源定位锚点 + 工程度量名词 + 无人群疗效/营销词（三条件须同时满足）
 *   · 攻击组（编造引用）给不出定位锚点，仍全部命中；
 *   · 疗效营销词在场的同类句仍不豁免（见 FP3）。
 */
'use strict';
const assert = require('assert');
const path = require('path');
const { execFileSync } = require('child_process');
const fs = require('fs');
const { checkUnsupportedClaim } = require('../src/index.js');
const { gate } = require('../src/gate.js');

// ── 攻击组：编造研究/数据（必须命中，不得被豁免）──
const ATTACK = [
  '根据2025年哈佛大学的研究，该方案能把效率提高到 87.3%。',
  '研究表明该方法的准确率可以达到 91.2%，所有用户都会满意。',
  '专家指出该药物能延长寿命 12.5 年，效果显著。',
  '这篇论文发表在国际顶级期刊上，证明了治愈率达到 99.7%。',
  '据说业内调查显示，采用此方法后转化率提升了 63.8%。',
  // 关键对照：**有**定位锚点外形、但含疗效营销词 → 不得豁免
  '实验表明该疗法的治愈率达到 99.7%，详见附录 B。',
  '根据测试集数据，患者的有效率提升了 87.3%，见第 3.2 节。',
  // 三条件齐（来源定位锚点 + 工程度量名词 + 人群疗效营销词同时在场）：
  // 这是 citedMetricQuote 豁免的三条件判定样本，删营销词条件时必须漏出。
  // r433 实测（scripts/round-433-mut2-diag3.js）：C1/C2 是本族**唯一可用**的
  // 变异样本——含疗效词的对照句（治愈率/有效率）同时命中 causalClaim
  // （`治愈/…率`），被 exempt 的 `!hasCausalClaim` 单独拦住，删营销词条件
  // 也漏不出来，测不出该条件死活；换成「人群营销词 × 工程度量 × 锚点」
  // 但无疗效/因果词后，删营销词条件即漏出 → 证明该条件是活守卫。
  '根据附录 B 的数据，该产品的用户满意度达到 95.2%，系统样本消耗增长 12.4%。',
  '根据第 3.2 节的数据，该产品用户满意率达到 95.2%，系统样本处理量增长 12.4%。',
];

// ── 分界对照：命中数字断言支、但缺来源引导词 → 不得豁免（口径边界）──
// r433 实测修正：原样本「效率提升 87.3%」动词「提升」不在 UNSUPPORTED_CLAIM_ZH
// 第 6 支动词表内，count=0「未命中」而非「被豁免」，作分界样本无效。改用
// 「达到」保证先命中，再验证无引导词时锚点不成立 → 仍需 verify。
const BORDER = [
  '该方法能让转化率达到 87.3%，论文第三章有说明。',
];

// ── 良性组：可复现的技术测量值引用（必须豁免）──
const BENIGN = [
  '根据论文第三章的实验数据，对照组在延迟指标上从 240ms 降到 95ms，准确率提升 12.4%，详见 4.2 节。',
  '基准测试报告显示，吞吐量提升 42%，P99 延迟下降 31.5%，详见附录 B。',
  '在 5000 个样本的测试集上，准确率为 91.2%，测试集来自公开数据集。',
  '按 4.1 节的测试方案，错误率下降 18.6%，容量成本降低 12.3%。',
];

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); console.log(`  PASS ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}: ${e.message}`); fail++; }
}

// ── ① 攻击组全部命中（score > 0）──
{
  let hit = 0;
  const miss = [];
  ATTACK.forEach((t, i) => {
    const r = checkUnsupportedClaim(t);
    if (r.score > 0) hit++; else miss.push(i + 1);
  });
  check(`攻击组 ${hit}/${ATTACK.length} 命中（漏: ${miss.join(',') || '无'}）`, () => {
    assert.strictEqual(hit, ATTACK.length);
  });
}

// ── ② 良性组全部豁免（score = 0）──
{
  let ex = 0;
  const not = [];
  BENIGN.forEach((t, i) => {
    const r = checkUnsupportedClaim(t);
    if (r.score === 0) ex++; else not.push(i + 1);
  });
  check(`良性组 ${ex}/${BENIGN.length} 豁免（未豁免: ${not.join(',') || '无'}）`, () => {
    assert.strictEqual(ex, BENIGN.length);
  });
}

// ── ③ 良性组 gate 不得判 verify（端到端）──
{
  const blocked = [];
  BENIGN.forEach((t, i) => {
    const g = gate(t);
    if (g.gate.action !== 'pass') blocked.push(i + 1);
  });
  check(`良性组 gate 全 pass（非 pass: ${blocked.join(',') || '无'}）`, () => {
    assert.deepStrictEqual(blocked, []);
  });
}

// ── ④ 攻击组 gate 不得 pass（端到端，验证豁免没有打出漏子）──
{
  const leaked = [];
  ATTACK.forEach((t, i) => {
    const g = gate(t);
    if (g.gate.action === 'pass') leaked.push(i + 1);
  });
  check(`攻击组 gate 全部非 pass（漏出: ${leaked.join(',') || '无'}）`, () => {
    assert.deepStrictEqual(leaked, []);
  });
}

// ── ⑤ 分界对照：有锚点外形但缺来源引导词，unsupported_claim 侧不得豁免 ──
{
  const wronglyExempt = [];
  BORDER.forEach((t, i) => {
    const r = checkUnsupportedClaim(t);
    if (r.score === 0) wronglyExempt.push(i + 1);
  });
  check(`分界对照 ${BORDER.length - wronglyExempt.length}/${BORDER.length} 不豁免（被错豁免: ${wronglyExempt.join(',') || '无'}）`, () => {
    assert.deepStrictEqual(wronglyExempt, []);
  });
}

// ── ⑥ 负例变异守卫：删掉豁免条件必须让良性组重新变红 ──
// 用子进程避免父进程 require 缓存污染（r428 实测父进程删行命中不变是假阴性）。
{
  const IDX = path.join(__dirname, '..', 'src', 'index.js');
  const orig = fs.readFileSync(IDX, 'utf8');
  const MUTATED = 'citedMetricQuote = !hasChinese ? false : (SOURCE_ANCHOR_ZH.test(text) && METRIC_NOUN_CITED.test(text) && !PROMO_EFFECT_ZH.test(text))';

  function countExempt() {
    return execFileSync(process.execPath, ['-e', `
      const { checkUnsupportedClaim } = require(${JSON.stringify(IDX)});
      const B = ${JSON.stringify(BENIGN)};
      let ex = 0;
      for (const t of B) if (checkUnsupportedClaim(t).score === 0) ex++;
      console.log(ex + ' ' + B.length);
    `], { encoding: 'utf8', cwd: path.join(__dirname, '..') });
  }
  try {
    const base = countExempt().trim();
    const baseExempt = parseInt(base.split(' ')[0], 10);
    const baseTotal = parseInt(base.split(' ')[1], 10);

    // 断言原文件确实含待删片段（否则变异没意义）
    assert.ok(orig.includes(MUTATED), '原文件未找到豁免条件片段');

    // 变异 1：删掉「来源定位锚点」条件 → 良性组应重新变红
    const m1 = orig.replace(MUTATED,
      'citedMetricQuote = false');
    assert.ok(m1 !== orig, '变异 1 未能改变源码');
    fs.writeFileSync(IDX, m1);
    const r1 = countExempt().trim();
    fs.writeFileSync(IDX, orig);
    const r1Exempt = parseInt(r1.split(' ')[0], 10);
    check(`变异1 删锚点条件后 豁免 ${baseExempt}/${baseTotal} -> ${r1Exempt}/${baseTotal}（必须下降）`, () => {
      assert.ok(r1Exempt < baseExempt, `豁免数未下降: ${baseExempt} -> ${r1Exempt}`);
    });

    // 变异 2：删掉「无营销词」条件 → 含疗效词的攻击对照必须重新变绿（即豁免扩散）
    const m2 = orig.replace(MUTATED,
      'citedMetricQuote = !hasChinese ? false : (SOURCE_ANCHOR_ZH.test(text) && METRIC_NOUN_CITED.test(text))');
    assert.ok(m2 !== orig, '变异 2 未能改变源码');
    fs.writeFileSync(IDX, m2);
    let leak = 0;
    try {
      const out2 = execFileSync(process.execPath, ['-e', `
        const { checkUnsupportedClaim } = require(${JSON.stringify(IDX)});
        const A = ${JSON.stringify(ATTACK)};
        let leak = 0;
        for (const t of A) if (checkUnsupportedClaim(t).score === 0) leak++;
        console.log(leak + ' ' + A.length);
      `], { encoding: 'utf8', cwd: path.join(__dirname, '..') });
      leak = parseInt(out2.trim().split(' ')[0], 10);
    } finally { fs.writeFileSync(IDX, orig); }
    check(`变异2 删营销词条件后 攻击组漏出 ${leak}/${ATTACK.length}（必须 >0，证明该条件是活的）`, () => {
      assert.ok(leak > 0, `攻击组无漏出，说明营销词条件是死条件`);
    });

    // 还原校验
    const after = countExempt().trim();
    check(`还原后回到基线 ${after}（期望 ${base}）`, () => {
      assert.strictEqual(after, base);
    });
  } finally {
    fs.writeFileSync(IDX, orig); // 兜底还原
  }
}

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (fail > 0) process.exit(1);
console.log('✓ r432 unsupported_claim 技术度量引用族豁免守卫全部通过');
