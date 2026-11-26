/**
 * test/round-483-look-elsewhere-effect.test.js
 *
 * r483 — provisional 第 297 维 look_elsewhere_effect（look-elsewhere effect /
 * 多重搜索下的假阳性误读族）
 * TDD：先写测试（红），后写实现（绿）。
 *
 * 立项证据：coordination/agent4/r483-probe-pool.output.txt
 *   · 族 A（多团队/多地域/多指标独立搜索，把某处撞出的显著性当作
 *     信号为真/独立验证的证据）穿透 5/9；
 *   · 存量 p-hacking（第58维族）腿①要求流程被结果反向决定（事后选
 *     指标/采到显著为止），本族无任何流程污染标记；
 *   · clustering_illusion 腿①聚集陈述腿②显著性归因（巧合/蹊跷），
 *     本族不依赖聚集语义而是搜索空间宽度；
 *   · researcher_degrees_of_freedom 管分析流程被结果反向决定。
 *   → 语义独立，真实缺口。
 *
 * 格式：module.exports = function({test}){...}（test/run-all.js 动态加载器调用）
 */
'use strict';

const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';

module.exports = function ({ test }) {
  // ── A：模块层攻击（ZH 10 + EN 8）——双腿 AND 命中 ──
  const attacksZH = [
    '全球有二十个团队独立扫描了这片天区，大家都找到了同一个显著性峰值，说明这个信号是真的。',
    '我们换了五个国家重新做了一遍，每个国家都能做出显著结果，这足以证明结论稳健。',
    '那么多实验室重复测了这个效应，总有几个测出了显著，多数实验室都验证了它。',
    '不同分析团队独立找到了同一个峰值，交叉验证说明这不是噪声。',
    '不止一组研究者发现了这个现象，五个独立课题组都报告了显著效应。',
    '几十个城市都做了这项调查，其中不少城市的数据呈现显著相关，可见该规律普遍成立。',
    '这么多机构翻来覆去地检验，总有几个能撞出显著结果，这正说明效应真实存在。',
    '多个独立小组分别分析了这批数据，凡是找到显著的那几个小组都支持原假设。',
    '我们在几十个指标里扫出了显著的那个，指标够多，总有一个能中。',
    '上百次重复实验里出现了显著结果，重复次数足够多，这还能是偶然吗。',
  ];
  const attacksEN = [
    'Twenty independent teams scanned the same sky region and all found the same significant peak, which confirms the signal is real.',
    'We replicated the study in five different countries and every one came out significant.',
    'Several independent labs found the same effect, so it must be real.',
    'Multiple research groups independently reported significance for the same hypothesis.',
    'We scanned dozens of cities and a good number of them showed significant correlations, so the pattern holds widely.',
    'With so many groups running the test, a few are bound to hit significance — which shows the effect is genuine.',
    'Among the dozens of metrics we tried, several came out significant, and that is enough to confirm the hypothesis.',
    'Hundreds of repeated trials produced a significant result; with that many tries it cannot be chance.',
  ];

  // ── B：良性（12）——含该族边缘良性 ──
  const benign = [
    '多重比较会让假阳性率升高，所以我们对所有检验做了 Bonferroni 校正。',
    '二十个团队扫描了同一天区，但每个团队的显著性都需要单独评估，先验概率仍然很低。',
    '虽然多个团队报告了显著效应，但发表偏倚意味着未发表的阴性结果没有被计入。',
    '多个独立课题组重复出了同一效应，且都经过预注册和多重比较校正，这提高了结论可信度。',
    'These independent teams all found the peak, but without a multiple-comparison correction the false-positive rate stays high.',
    'Several labs replicated the effect, which is real evidence — as long as the analysis plan was preregistered.',
    '这个效应只在预先设定的单一假设下检验，未做任何事后筛选，因此显著结果可用。',
    '我们事前确定了终点指标和分析方案，没有扫描其他变量，所以这个显著性不需要校正。',
    'The hypothesis was specified before data collection and only one comparison was planned.',
    '扫描多个子群后我们做了 FDR 校正，并对每个显著子群标注了事后分析的性质。',
    'Multiple comparisons raise the false-positive rate, so we report the corrected p-values alongside the raw ones.',
    '该天区扫描覆盖了已知的搜索范围，局部后验概率已按 trials factor 折减后仍然显著。',
  ];

  // ── C：结构性红灯样本（缺腿不判）──
  const leg1Only = [
    '全球有二十个团队独立扫描了这片天区。',
    '我们换了五个国家重新做了一遍这个调查。',
    'Twenty independent teams scanned the same sky region.',
    'We replicated the study in five different countries.',
  ];
  const leg2Only = [
    '这个信号看起来是真的，物理图像也很自洽。',
    '这说明结论是稳健的，机理上没有疑点。',
    'The signal looks real and the mechanism is consistent.',
    'This confirms the effect is genuine beyond reasonable doubt.',
  ];

  // ── D：豁免样本（多重比较校正/预注册纪律在场 → 不判）──
  // 三条均含双腿（腿①搜索空间宽度 + 腿②显著性当验证），豁免是唯一
  // 压制项——I3 负例注入据此证明豁免承重。
  const corrected = [
    '几十个团队扫描了同一天区并各自报告了显著峰值，但 Bonferroni 校正后没有一个存活。',
    '我们在几百个子群里找到了显著相关，不过已经做过 Bonferroni 校正。',
    'Hundreds of subgroups were scanned and several came out significant, but after Bonferroni correction nothing survived.',
    '几十个团队各自做出了显著结果，不过 Bonferroni 校正之后没有一个存活。',
  ];

  // ── E：否定守卫 ──
  const negated = [
    '并不是说二十个团队都找到显著就证明信号为真，搜索空间越大假阳性越多。',
    '别拿「这么多团队都撞到了显著」当验证，这恰恰是 look-elsewhere 效应。',
    'It is not true that many teams hitting significance confirms the signal; the search space is huge.',
  ];

  // ── F：同族变体（ZH/EN、裸名词、带修饰、倒装、长句）──
  const variants = [
    '二十个团队。同一天区。都找到了显著。这足以说明信号为真。',
    '那么多研究者翻来覆去检验过，总有能撞出显著结果的，这正说明效应是真的。',
    'The effect was tested by many independent groups across many countries, and significance kept showing up, so it must be real.',
    'Scanned by dozens of teams, the same peak came out significant in every one of them — the signal is confirmed.',
    '不论换多少个城市、多少个指标、多少批样本重做，都能做出显著结果，重复次数足够多，这绝不是噪声。',
    'So many labs tried it that a few were bound to find significance, and that is exactly why the effect is real.',
  ];

  // ── G：边缘良性（该族边缘：正确多因/独立评估陈述）──
  const edgeBenign = [
    '多个团队独立发现同一峰值只是提高了关注度，是否成立要看 trials factor 校正后的后验概率。',
    '二十个团队里多数报告了显著，也有团队报告了阴性，我们按全部结果汇总而不是只算阳性的。',
    'Several teams found significance and several did not; we pooled all results instead of counting only the positives.',
    '不同国家的重复实验结论不一致，说明这个效应可能受当地条件影响，需要分层分析。',
    '我们扫了多个指标，只有事前设定的那个显著，其余均不显著，也未更换终点。',
    'Many metrics were scanned, but only the prespecified one was significant and the rest were null.',
  ];

  const mod = require(path.join(HF, 'src', 'look-elsewhere-effect.js'));
  const check = mod.checkLookElsewhereEffect;

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

  test('D1 校正/预注册豁免 3/3', () => {
    const bad = corrected.filter(t => check(t).hit === true);
    if (bad.length) throw new Error('corrected fired: ' + bad[0]);
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
    for (const t of ['', '显著', '扫描', null, undefined]) {
      const r = check(t);
      if (r.hit !== false) throw new Error('non-safe hit for: ' + JSON.stringify(t));
    }
  });

  test('H2 internals 导出常量可注入', () => {
    const it = mod.__internals();
    for (const k of ['SEARCH_ZH', 'SEARCH_EN', 'SIGNIF_ZH', 'SIGNIF_EN', 'CORRECT_ZH', 'CORRECT_EN', 'NEG_ZH', 'NEG_EN']) {
      if (!it[k]) throw new Error('missing internal: ' + k);
    }
  });

  // ── I：负例注入（逐组翻转，证明每组承重）──
  test('I1 负例注入：腿① ZH 全摘后 ZH 攻击不命中', () => {
    const it = mod.__internals();
    const inj = { SEARCH_ZH: /(?!x)x/, SIGNIF_ZH: it.SIGNIF_ZH, SEARCH_EN: /(?!x)x/, SIGNIF_EN: it.SIGNIF_EN };
    const still = attacksZH.filter(t => check(t, inj).hit === true);
    if (still.length) throw new Error('still hit after leg1 removal: ' + still[0]);
  });

  test('I2 负例注入：腿② ZH 全摘后 ZH 攻击不命中', () => {
    const it = mod.__internals();
    const inj = { SIGNIF_ZH: /(?!x)x/, SEARCH_ZH: it.SEARCH_ZH, SEARCH_EN: /(?!x)x/, SIGNIF_EN: it.SIGNIF_EN };
    const still = attacksZH.filter(t => check(t, inj).hit === true);
    if (still.length) throw new Error('still hit after leg2 removal: ' + still[0]);
  });

  test('I3 负例注入：豁免全摘后校正样本转为命中（证明豁免承重）', () => {
    const it = mod.__internals();
    const inj = { CORRECT_ZH: /(?!x)x/, CORRECT_EN: /(?!x)x/ };
    const fired = corrected.filter(t => check(t, inj).hit === true);
    if (fired.length !== corrected.length) {
      throw new Error('exemption not load-bearing: fired ' + fired.length + '/' + corrected.length);
    }
  });

  // ── J：端到端 ───────────────────────────────────────
  // 本族走插件层 dispatch（r295/r479/r481/r482 先例），gate 层 dimMap 无
  // look_elsewhere_effect 键，故 J1 验 gate 不崩溃 + 生产 PluginLoader
  // 真实 HookBus 的 postprocess.think hook 写入
  // result._discrimination.lookElsewhereEffect（不用自造假桩——r479 教训）。
  const { HookBus } = require(path.join(HF, 'src', 'core', 'hook-bus.js'));
  async function _probePlugin(samples) {
    const { PluginLoader } = require(path.join(HF, 'src', 'loader', 'plugin-loader.js'));
    const hookBus = new HookBus();
    const hf = { _hookBus: hookBus };
    const res = new PluginLoader(hf).loadAll();
    const out = {
      loadedOk: (res.loaded || []).some(p => p.name === 'look-elsewhere-effect-check' && p.status === 'loaded'),
      failed: res.failed || [],
      snapshots: [],
    };
    for (const s of samples) {
      const result = { output: { conclusion: s }, _discrimination: {} };
      await hookBus.fire('postprocess.think', { input: s, result, engine: hf });
      out.snapshots.push({ s, le: result._discrimination && result._discrimination.lookElsewhereEffect });
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
    const miss = probe.snapshots.filter(x => !x.le || x.le.totalHits === 0).map(x => x.s);
    if (miss.length) throw new Error('插件未承重 ' + miss.length + ' 条: ' + miss[0]);
  });

  test('J2 良性不写 lookElsewhereEffect（插件层零误伤）', async () => {
    const probe = await _probePlugin(benign.concat(edgeBenign));
    const fp = probe.snapshots.filter(x => x.le && x.le.totalHits > 0).map(x => x.s);
    if (fp.length) throw new Error('插件误伤 ' + fp.length + ' 条: ' + fp[0]);
  });
};
