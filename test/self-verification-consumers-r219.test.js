#!/usr/bin/env node
/**
 * test/self-verification-consumers-r219.test.js
 *
 * 第 219 轮新增：218 轮修活的两条恒崩字段（_selfVerification /
 * _reflectionLoopClosed）第一次拥有**真消费者**的回归防线。
 *
 * 接线前实测缺口（scripts/round-219/probe-r219-consumers.js）：
 *   · _selfVerification 12/12 落地，但 src 侧读取点 = 0（只有测试读）
 *   · _reflectionLoopClosed 12/12 落地，src 侧读取点 = 0
 *   · gate-verdict VERIFY_SIGNALS 5 条里没有它们
 *   · MCP SIGNAL_KEYS / report 段也没有它们
 * 即「心虫判了但没有任何下游听得见」。
 *
 * 判据纪律（217/218 轮教训）：查内容不查布尔存在。断言判据写在每个
 * assert 的 msg 里，突变必须让具体某条断言红，而不是整体崩掉。
 *
 * 文件形态照 test/reflection-loop-wiring.test.js（217 轮同款、run-all
 * 实测能跑通 IIFE async 段）：单个 async IIFE + 汇总行 + exit。
 */
const path = require('path');
const { buildGateVerdict } = require(path.join(process.cwd(), 'src/gate-verdict.js'));
const { ReportGenerator } = require(path.join(process.cwd(), 'src/report/report-generator.js'));

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { console.error('FAIL:', msg); failed++; }
}

console.log('=== 自验证信号消费者接线回归（第 219 轮）===\n');

(async () => {
  // ── ① gate-verdict：真问题必须变 verify ──────────────────────────
  {
    const v = buildGateVerdict({ _selfVerificationIssues: ['可能存在隐藏假设'] });
    assert(v.action === 'verify', '_selfVerificationIssues 非空 => verify（实际 ' + v.action + '）');
    assert(v.signals.includes('推理自验证问题'), 'signals 应含「推理自验证问题」（实际 ' + v.signals + '）');
    assert(String(v.reason).includes('隐藏假设') || String(v.reason).length > 0, 'reason 应带可读细节');
  }

  // ② 仅 counterfactual 噪声不得触发（这条防 verify 泛滥成默认值）
  {
    const v = buildGateVerdict({
      _selfVerification: { passed: false, issues: ['未考虑替代推理路径'], confidence: 0.75 },
    });
    assert(v.action === 'pass', '_selfVerification.issues 只有 counterfactual 噪声 => 不得触发（实际 ' + v.action + '）');
  }

  // ③ 空数组不得触发
  {
    const v = buildGateVerdict({ _selfVerificationIssues: [] });
    assert(v.action === 'pass', '空 issues 数组 => pass（实际 ' + v.action + '）');
  }

  // ④ 反思健康退化必须变 verify，healthy 必须 pass
  {
    const vOk = buildGateVerdict({ _reflectionLoopClosed: { health: 'healthy', reflected: true } });
    assert(vOk.action === 'pass', '_reflectionLoopClosed.health=healthy => pass（实际 ' + vOk.action + '）');
    const vBad = buildGateVerdict({ _reflectionLoopClosed: { health: 'degraded', reflected: true } });
    assert(vBad.action === 'verify', 'health=degraded => verify（实际 ' + vBad.action + '）');
    assert(vBad.signals.includes('反思健康退化'), 'signals 应含「反思健康退化」');
    assert(String(vBad.reason).includes('degraded'), 'reason 应报 health 值本身（实际 ' + vBad.reason + '）');
  }

  // ⑤ verify 不得压过既有 rewrite / block 优先级
  {
    const vRewrite = buildGateVerdict({ _selfContradictory: true, _selfVerificationIssues: ['x'] });
    assert(vRewrite.action === 'rewrite', '既有 rewrite 信号应压过新增 verify（实际 ' + vRewrite.action + '）');
    const vBlock = buildGateVerdict({ _highRiskOutput: true, _selfVerificationIssues: ['x'] });
    assert(vBlock.action === 'block', '既有 block 信号应压过新增 verify（实际 ' + vBlock.action + '）');
  }

  // ⑥ report 段：三态边界（真问题 / 仅噪声 / 字段缺失）
  {
    const rg = new ReportGenerator();
    const rReal = rg.generate({
      output: { conclusion: '方案可行，因为前两步已验证通过' },
      chain: { stages: [{ name: 'SYNTHESIS', result: { reasoningChain: '因为前两步已验证通过，所以方案可行' } }] },
      _selfVerification: {
        passed: false,
        checks: { reverseConsistency: true, logicalChain: false, counterfactual: false, coverageCheck: true },
        issues: ['可能存在隐藏假设', '未考虑替代推理路径'],
        confidence: 0.75,
      },
      _selfVerificationIssues: ['可能存在隐藏假设'],
      _reflectionLoopClosed: { health: 'healthy' },
    });
    const sv = rReal.report.selfVerification;
    assert(sv && typeof sv === 'object', 'report.selfVerification 段应存在');
    if (sv) {
      assert(sv.confidence === 0.75, '应报 confidence 连续量（实际 ' + sv.confidence + '）');
      assert(sv.checks && sv.checks.logicalChain === false && sv.checks.counterfactual === false,
        '四 check 逐项可读（logicalChain/counterfactual 应 false）');
      assert(Array.isArray(sv.issues) && sv.issues.length === 1 && sv.issues[0] === '可能存在隐藏假设',
        'issues 只含真问题（counterfactual 已过滤，实际 ' + JSON.stringify(sv.issues) + '）');
      assert(sv.passed === false, '有真问题 => passed=false');
      assert(!!sv.note && String(sv.note).includes('counterfactual'), 'counterfactual 应以 note 出现');
      assert(sv.reflectionHealth === 'healthy', '反思健康状态应进报告');
    }

    const rNoise = rg.generate({
      output: { conclusion: 'x' },
      _selfVerification: { passed: false, issues: ['未考虑替代推理路径'], confidence: 0.75 },
      _selfVerificationIssues: [],
    });
    const sv2 = rNoise.report.selfVerification;
    assert(sv2 && sv2.passed === true, '仅 counterfactual 噪声 => 报告侧 passed=true（实际 ' + (sv2 && sv2.passed) + '）');
    assert(sv2 && Array.isArray(sv2.issues) && sv2.issues.length === 0, '噪声不进 issues');

    const rAbsent = rg.generate({ output: { conclusion: 'x' } });
    assert(rAbsent.report.selfVerification === null || rAbsent.report.selfVerification === undefined,
      '字段缺失时不得造空壳段（实际 ' + JSON.stringify(rAbsent.report.selfVerification) + '）');

    const rRlOnly = rg.generate({ output: { conclusion: 'x' }, _reflectionLoopClosed: { health: 'degraded' } });
    const sv4 = rRlOnly.report.selfVerification;
    assert(sv4 && sv4.reflectionHealth === 'degraded', '只有反思段时只报 reflectionHealth');
  }

  // ⑦ 引擎真跑：think() 必须同时落地两个字段且不误报成 verify
  {
    try {
      const { HeartFlow } = require(path.join(process.cwd(), 'src/core/heartflow.js'));
      const hf = new HeartFlow();
      await hf.start();
      const r = await hf.think('帮我看看这个方案有没有什么问题', { compact: false });
      assert(!!(r && r._selfVerification), 'think() 产出 _selfVerification');
      assert(Array.isArray(r && r._selfVerificationIssues),
        'think() 产出 _selfVerificationIssues（219 轮新增，修复前字段不存在）');
      assert(!!(r && r._reflectionLoopClosed), 'think() 产出 _reflectionLoopClosed');
      // 噪声-only 的常规场景：_selfVerificationNoise 标记应出现
      assert(r._selfVerificationNoise === 'counterfactual_only' || (r._selfVerificationIssues || []).length > 0,
        '常规输入应有噪声标记或真问题，二者必居其一（实际 noise=' + r._selfVerificationNoise
        + ' issues=' + JSON.stringify(r._selfVerificationIssues) + '）');
      // 端到端：verify 不应被噪声灌满
      const v = buildGateVerdict(r);
      const noiseOnly = (r._selfVerificationIssues || []).length === 0;
      if (noiseOnly) {
        assert(v.action !== 'verify' || (v.signals && !v.signals.includes('推理自验证问题')),
          '噪声-only 时 gate 不得因自验证报 verify');
      }
    } catch (e) {
      assert(false, '引擎侧断言失败: ' + (e && e.message));
    }
  }

  console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => {
  console.error('FATAL:', e && e.message);
  process.exit(1);
});
