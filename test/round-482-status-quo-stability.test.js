/**
 * test/round-482-status-quo-stability.test.js
 *
 * r482 — provisional 第296维 status_quo_stability（现状稳定论证族）
 * TDD：先写测试（红），后写实现（绿）。
 *
 * 格式：module.exports = function({test}){...}（test/run-all.js 动态加载器调用）
 */
'use strict';

const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';

module.exports = function ({ test }) {
  // ── A：模块层攻击（ZH 10 + EN 8）——双腿 AND 命中 ──
  const attacksZH = [
    '现有方案虽然有毛病，但至少稳定，新方案风险太大。',
    '老系统再慢也是自己人知根知底，换新的谁说得准。',
    '旧的报表格式看惯了，新模板肯定要出乱子。',
    '当前架构凑合能用，重构只会引入新问题。',
    '现有代码虽然丑，但跑得动就别重构。',
    '现在这套流程能跑，改成新的万一出岔子谁负责。',
    '老办法虽然土，但胜在稳妥，新法子没试过不敢冒险。',
    '现有供应商合作很久了，换一家磨合期太长风险更高。',
    '默认配置就是这么设的，动了它反而容易坏。',
    '原来的系统虽然老旧，但新系统上线风险扛不住。',
  ];
  const attacksEN = [
    'The current system is buggy but stable; switching is too risky.',
    'The existing code is ugly, but refactoring it would only introduce new bugs.',
    'Our old vendor works fine, and onboarding a new one carries too much risk.',
    'The legacy report format is familiar; a new template will definitely cause chaos.',
    'Keep the current setup; a migration would open up risks we cannot control.',
    'The old system is slow but predictable; the new one might fail in production.',
    'If the existing config works, why bother reviewing alternatives that could break things.',
    'We have run this process for years; replacing it now is too risky.',
  ];

  // ── B：良性（12）——含该族边缘良性 ──
  const benign = [
    '现有方案的问题我们记录在案，新方案有回滚计划和灰度窗口。',
    '沿用传统做法之前，我们对比了新方法的成本与效果。',
    '我们保留现有系统，因为迁移成本与停机损失已有量化评估。',
    '现有架构稳定是因为有多活机房和混沌演练兜底，我们按季度复评。',
    '现有代码确实该重构，技术债清单和拆分步骤已经列清楚。',
    'The default is reasonable, and we compared it with alternatives before choosing.',
    'We switched to the new system after a six-week pilot with measurable results.',
    'The legacy system stays only until the new one passes the same load tests.',
    '现有供应商报价最高，我们已经和另外两家谈了条件。',
    '新旧系统并行运行三个月，数据一致后才切换。',
    '现有流程跑得慢，我们做了压测，瓶颈在数据库索引。',
    '老系统的风险我们评估过，有回滚方案和值班预案。',
  ];

  // ── C：结构性红灯样本（缺腿不判）──
  const leg1Only = [
    '现有方案有毛病，新方案也有毛病，两个都不完美。',
    'The current system has problems, and so does the new one.',
  ];
  const leg2Only = [
    '新方案风险太大，我们干脆不做了，维持空白状态。',
    'Switching is too risky, so we will not do anything at all.',
  ];

  // ── D：豁免样本（量化证据在场 → 不判）──
  // 三条均含双腿（腿①现状在场 + 腿②风险断言），豁免是唯一压制项——
  // I3 负例注入据此证明豁免承重。
  const quantified = [
    '现有方案稳定性有数据支撑：过去十二个月故障三次，平均恢复四十分钟，新方案无数据。',
    '现有架构故障率低于千分之一，过去十二个月只中断两次，换新系统谁说得准。',
    'The current setup is stable per the data: 99.98% uptime over twelve months, but a migration might fail in production.',
  ];

  // ── E：否定守卫 ──
  const negated = [
    '并不是「现有方案稳定新方案风险大」这种情况，两个方案我们都评估了。',
    '别再说新方案风险太大了，风险评估报告显示它比现状更稳。',
    'It is not that the new plan is riskier; the risk assessment says otherwise.',
  ];

  // ── F：同族变体（ZH/EN、裸名词、带修饰、倒装、长句）──
  const variants = [
    '现有。新方案。风险太大。',
    '当前这套系统虽说有种种不是，可一旦更换，风险谁来兜底。',
    '现有的东西再怎么不好也是熟悉的，陌生的东西风险难以估量，这就是我不赞成更换的理由。',
    'The existing setup, whatever its flaws, is at least a known quantity, whereas the alternative is an unknown risk.',
    'Staying with the current tool is the lower-risk path; the alternative has too many unknowns.',
    '老系统我们再熟悉不过，新系统看起来很美但风险太高，不值得赌。',
  ];

  // ── G：边缘良性（该族边缘：正确多因/独立评估陈述）──
  const edgeBenign = [
    '新旧方案各有风险，我们按发生概率和影响面分别打分后择优。',
    '维持现状也有风险，技术债累积本身就是一种成本。',
    '更换供应商风险高，所以我们先用小批量订单试了三个月。',
    'Both options carry risk; we compared failure modes and mitigation costs side by side.',
    'Keeping the status quo is a decision too, and we evaluated it against the alternatives.',
    '现有系统稳定是新系统迁移的参照系，我们把切换窗口切成了四次灰度。',
  ];

  const mod = require(path.join(HF, 'src', 'status-quo-stability.js'));
  const check = mod.checkStatusQuoStability;

  test('A1 模块层攻击 ZH 10/10 命中', () => {
    const misses = attacksZH.filter(t => check(t).hit !== true);
    if (misses.length) throw new Error('ZH miss ' + misses.length + ': ' + misses[0]);
  });

  test('A2 模块层攻击 EN 8/8 命中', () => {
    const misses = attacksEN.filter(t => check(t).hit !== true);
    if (misses.length) throw new Error('EN miss ' + misses.length + ': ' + misses[0]);
  });

  test('B1 良性 12/12 零命中', () => {
    const fps = benign.filter(t => check(t).hit === true);
    if (fps.length) throw new Error('benign FP ' + fps.length + ': ' + fps[0]);
  });

  test('C1 缺腿①不判（单腿在场）', () => {
    const bad = leg1Only.filter(t => check(t).hit === true);
    if (bad.length) throw new Error('leg1-only fired: ' + bad[0]);
  });

  test('C2 缺腿②不判（单腿在场）', () => {
    const bad = leg2Only.filter(t => check(t).hit === true);
    if (bad.length) throw new Error('leg2-only fired: ' + bad[0]);
  });

  test('D1 量化证据豁免 3/3', () => {
    const bad = quantified.filter(t => check(t).hit === true);
    if (bad.length) throw new Error('quantified fired: ' + bad[0]);
  });

  test('E1 否定守卫 3/3', () => {
    const bad = negated.filter(t => check(t).hit === true);
    if (bad.length) throw new Error('negated fired: ' + bad[0]);
  });

  test('F1 变体矩阵 6/6 命中', () => {
    const misses = variants.filter(t => check(t).hit !== true);
    if (misses.length) throw new Error('variant miss ' + misses.length + ': ' + misses[0]);
  });

  test('G1 边缘良性 6/6 不误伤', () => {
    const fps = edgeBenign.filter(t => check(t).hit === true);
    if (fps.length) throw new Error('edge-benign FP ' + fps.length + ': ' + fps[0]);
  });

  test('H1 空/短文本安全返回', () => {
    for (const t of ['', '现有', '风险', null, undefined]) {
      const r = check(t);
      if (r.hit !== false) throw new Error('non-safe hit for: ' + JSON.stringify(t));
    }
  });

  test('H2 internals 导出常量可注入', () => {
    const it = mod.__internals();
    for (const k of ['STATUS_ZH', 'STATUS_EN', 'RISK_ZH', 'RISK_EN', 'QUANT_ZH', 'QUANT_EN', 'NEG_ZH', 'NEG_EN']) {
      if (!it[k]) throw new Error('missing internal: ' + k);
    }
  });

  // ── I：负例注入（逐组翻转，证明每组承重）──
  test('I1 负例注入：腿① ZH 全摘后 ZH 攻击不命中', () => {
    const it = mod.__internals();
    const inj = { STATUS_ZH: /(?!x)x/, RISK_ZH: it.RISK_ZH, STATUS_EN: /(?!x)x/, RISK_EN: it.RISK_EN };
    const still = attacksZH.filter(t => check(t, inj).hit === true);
    if (still.length) throw new Error('still hit after leg1 removal: ' + still[0]);
  });

  test('I2 负例注入：腿② ZH 全摘后 ZH 攻击不命中', () => {
    const it = mod.__internals();
    const inj = { RISK_ZH: /(?!x)x/, STATUS_ZH: it.STATUS_ZH, STATUS_EN: /(?!x)x/, RISK_EN: it.RISK_EN };
    const still = attacksZH.filter(t => check(t, inj).hit === true);
    if (still.length) throw new Error('still hit after leg2 removal: ' + still[0]);
  });

  test('I3 负例注入：豁免全摘后量化样本转为命中（证明豁免承重）', () => {
    const it = mod.__internals();
    const inj = { QUANT_ZH: /(?!x)x/, QUANT_EN: /(?!x)x/ };
    const fired = quantified.filter(t => check(t, inj).hit === true);
    if (fired.length !== quantified.length) {
      throw new Error('exemption not load-bearing: fired ' + fired.length + '/' + quantified.length);
    }
  });

  // ── J：端到端 ───────────────────────────────────────
  // 本族走插件层 dispatch（r295/r479/r481 先例），gate 层 dimMap 无
  // status_quo_stability 键，故 J1 验 gate 不崩溃 + 生产 PluginLoader
  // 真实 HookBus 的 postprocess.think hook 写入
  // result._discrimination.statusQuoStability（不用自造假桩——r479 教训）。
  const { HookBus } = require(path.join(HF, 'src', 'core', 'hook-bus.js'));
  async function _probePlugin(samples) {
    const { PluginLoader } = require(path.join(HF, 'src', 'loader', 'plugin-loader.js'));
    const hookBus = new HookBus();
    const hf = { _hookBus: hookBus };
    const res = new PluginLoader(hf).loadAll();
    const out = {
      loadedOk: (res.loaded || []).some(p => p.name === 'status-quo-stability-check' && p.status === 'loaded'),
      failed: res.failed || [],
      snapshots: [],
    };
    for (const s of samples) {
      const result = { output: { conclusion: s }, _discrimination: {} };
      await hookBus.fire('postprocess.think', { input: s, result, engine: hf });
      out.snapshots.push({ s, sq: result._discrimination && result._discrimination.statusQuoStability });
    }
    return out;
  }

  test('J1 gate 层不崩溃 + 插件层 hook 端到端承重', async () => {
    const gateMod = require(path.join(HF, 'src', 'gate.js'));
    const gate = gateMod.gate || gateMod.check;
    for (const t of attacksZH.concat(attacksEN)) {
      const g = gate(t);
      if (!g || !g.gate) throw new Error('gate 返回异常: ' + t.slice(0, 30));
    }
    const probe = await _probePlugin(attacksZH.concat(attacksEN));
    if (!probe.loadedOk) throw new Error('插件未被 PluginLoader 自动加载: ' + JSON.stringify(probe.failed));
    const miss = probe.snapshots.filter(x => !x.sq || x.sq.totalHits === 0).map(x => x.s);
    if (miss.length) throw new Error('插件未承重 ' + miss.length + ' 条: ' + miss[0]);
  });

  test('J2 良性不写 statusQuoStability（插件层零误伤）', async () => {
    const probe = await _probePlugin(benign.concat(edgeBenign));
    const fp = probe.snapshots.filter(x => x.sq && x.sq.totalHits > 0).map(x => x.s);
    if (fp.length) throw new Error('插件误伤 ' + fp.length + ' 条: ' + fp[0]);
  });
};
