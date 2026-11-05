/**
 * test/round-734-evidence-gap.test.js
 * [r734 / v6.8.89] evidence 维度复活轮测试（证据缺口：有断言却拿不出证据）
 *
 * 背景（r734 轮初实测，修复前，require('./src/gate.js').gate）：
 *   160 个判别维度里 evidence 一维是**纯装饰**。src/index.js 的打分器：
 *       score = (evidence && evidence.length > 0) ? 0.5 : 1.0
 *       if (claim.length < 5) score -= 0.2
 *   而 discriminate(text, evidence = []) 的默认值是**空数组**，pipeline 全链路
 *   （gate / checkInput / checkOutput / runPipeline）从不传 evidence。于是：
 *       · score 恒为 1.0（claim ≥ 5 字符）或 0.8（claim < 5 字符）
 *       · issues 恒为空数组
 *       · index.js 的 `if (ev.score < 0.25)` **自 v6.7.73 起一次都没成立过**
 *   实测四份基准语料 378 条样本，dimension === 'evidence' 的 finding：**0 条**。
 *
 * 修复：src/evidence-gap.js —— 链级判据（两腿共现才判缺口）
 *   支① DEMAND：类法则型经验断言（效能动词/比较级 × 量词）
 *   支② SUPPLY：全文无任何证据标记（具名来源/引用/方法论/对冲语/一手经验/
 *               命名机构）
 *   接线：index.js 的 checkEvidence 在未显式传 evidence 时委托本模块；
 *         激活阈值 0.25 → 0.65；severity 口径 (0.5-score)*100 → (1-score)*100
 *         （原式在 score>0.5 时算出负严重度，findings 按 severity 降序排，
 *           真缺口会被排到最后一名）。
 *
 * 本测试守八件事：
 *   ① 类法则经验断言真的被判证据缺口（安全/质量收益，0 → N）
 *   ② 已知保守排除有反向断言防回归（第一人称/特指主语不判）
 *   ③ 精度护栏真的在干活（规范/报道/定义/特指/疑问/祈使/教学/有来源全不判）
 *   ④ 存量行为零回归：四份语料 378 条的 gate.action 分布逐项不变
 *   ⑤ 存量 API 契约零回归：显式传 evidence 时的供给侧口径一个字不改
 *   ⑥ 族规模/权重数组长度可机器记账（防 r734 首版的 NaN 静默失效）
 *   ⑦ discrimination-trace 能透出 evidence 的命中证据
 *   ⑧ MCP 三处接线（AGENTS.md 约定 3）
 */
'use strict';

// [r733 踩坑沿用] src/utils/stdio-guard.js 会把「非 JSON-RPC 帧」的 stdout 写入
// 改道 stderr，而 run-all.js 的 execFile 只 capture stdout。两重保险：
// ① 加载任何引擎模块前先关掉守卫；② 汇总行输出走加载前捕获的原始
// process.stdout.write，免疫任何后续 patch。
process.env.HF_KEEP_STDOUT_LOGS = '1';
const _rawStdoutWrite = process.stdout.write.bind(process.stdout);
function say(line) { _rawStdoutWrite(line + '\n'); }

const path = require('path');
const assert = require('assert');
const ROOT = path.join(__dirname, '..');
const gateMod = require(path.join(ROOT, 'src', 'gate.js'));
const gate = gateMod.gate;
const { discriminate } = require(path.join(ROOT, 'src', 'index.js'));
const eg = require(path.join(ROOT, 'src', 'evidence-gap.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; say('  ✅ ' + name); }
  catch (e) { fail++; say('  ❌ ' + name + ' → ' + e.message); }
}

say('\n[r734] evidence 维度复活轮测试（证据缺口 / chain-level evidence gap）\n');

const hasEvidenceFinding = (text) => {
  const r = gate(text);
  return (r.findings || []).find(f => f.dimension === 'evidence') || null;
};

// ── 1. 攻击形态：类法则经验断言 × 无证据标记 → 判缺口 ──────────
say('【1】类法则经验断言被判证据缺口（收益：evidence 维度从 0 命中变成真判别）');

const GAPS = [
  // 英文 · 效能动词 × 量词
  'Coffee reduces the risk of heart disease by 25%.',
  'Meditation lowers blood pressure by 12%.',
  'Drinking green tea improves memory by 40 percent.',
  'Regular exercise increases productivity by 3x.',
  'A plant-based diet lowers cholesterol by 30 percent.',
  'Stand-up meetings reduce project delays by 45%.',
  'Cold showers boost immunity by 2x.',
  'Reading 30 minutes a day improves focus by 18%.',
  // 英文 · 量词在前副形
  'Batching delivers a 3x improvement in latency.',
  // 中文 · 效能动词 × 量词
  '运动能降低血压 10%。',
  '冥想可以降低焦虑水平 25%。',
  '早睡能把反应速度加快 15%。',
  '远程办公使团队产出提升 20%。',
  '每天快走三十分钟可以减少两成心血管疾病风险。',
  '补充维生素 C 能预防感冒，效率提升百分之三十。',
  // 中文 · 比较级 × 量词
  '深度学习比传统方法准确率高出 12%。',
  '针灸比止痛药见效快 3 倍。',
];

t('18 条类法则经验断言全部出现 evidence finding', () => {
  const missed = GAPS.filter(x => !hasEvidenceFinding(x));
  assert.strictEqual(missed.length, 0, '漏判: ' + JSON.stringify(missed));
});
t('模块级同样 18/18 命中，且 score < 0.65', () => {
  for (const x of GAPS) {
    const r = eg.checkEvidenceGap(x);
    assert.ok(r.count > 0, '模块级漏判: ' + x);
    assert.ok(r.score < 0.65, 'score 未跌破阈值: ' + x + ' → ' + r.score);
  }
});
t('finding 带 severity 与命中原文（审计可回溯）', () => {
  const f = hasEvidenceFinding('Coffee reduces the risk of heart disease by 25%.');
  assert.ok(f, '无 finding');
  assert.ok(f.severity >= 40, 'severity 过低: ' + f.severity);
  assert.ok(/reduces the risk of heart disease by 25/.test(f.details), 'details 无命中原文: ' + f.details);
});
t('两条无依据断言叠加 → score 更低（0.10 以下）', () => {
  const r = eg.checkEvidenceGap('Coffee reduces the risk of heart disease by 25%. Meditation lowers blood pressure by 12%.');
  assert.strictEqual(r.count, 2, '应记 2 条，实得 ' + r.count);
  assert.ok(r.score < 0.15, '两条应压到 0.15 以下，实得 ' + r.score);
});

// ── 2. 已知保守排除（反向断言防回归）────────────────────────
// 这三类不是漏判 bug，是刻意设计：第一人称自述与特指主语的证据在说话场景里，
// 规则引擎看不到。写进测试是为了让「将来放宽这两条」变成一次显式的决定。
say('【2】保守排除有反向断言（第一人称/特指主语不判——刻意设计，非漏判）');

const EXCLUDED = [
  'Our new optimizer cuts training cost by 60%.',      // our → 第一人称
  'This technique is 30% more efficient.',              // This → 特指
  '这种学习方法能提升记忆效率 3 倍。',                    // 这种 → 特指
  '这款产品能把转化率提高 3 倍。',                        // 这款 → 特指
];
t('4 条保守排除样本不判（防将来误放宽）', () => {
  const fired = EXCLUDED.filter(x => hasEvidenceFinding(x));
  assert.strictEqual(fired.length, 0, '被误判: ' + JSON.stringify(fired));
});

// ── 3. 精度护栏：四类框架 + 疑问/祈使/教学/有来源 ───────────
say('【3】精度护栏（37 条对抗性良性样本 0 误判）');

const BENIGN = [
  // 规范性（陈述的是规则，不是事实）
  '逾期 90 天以上的贷款要计提坏账准备。',
  '传染病报告须在 24 小时内上报。',
  '论文查重率要求低于百分之十五。',
  '零信任架构要求每次访问都重新鉴权。',
  '安全基线检查项一共 42 条。',
  '信用卡盗刷申诉处理周期是 15 个工作日。',
  '血液透析每周安排三次。',
  '退款将在三个工作日内原路返回。',
  '该商品支持七天无理由退换。',
  // 报道性（陈述的是已发生观测）
  '攻击面分析显示暴露的接口比上季度少了。',
  '反欺诈系统拦截了一笔可疑转账。',
  '本次压测显示接口耗时降低 40%。',
  'The report shows that our churn dropped by 12%.',
  '日志里发现了异常的登录地点，正在排查。',
  // 定义性（陈述的是构成关系）
  '证书过期会导致 TLS 握手失败。',
  '抗生素滥用会导致耐药性。',
  '这个手术需要切除病灶周围两厘米。',
  '基金定投适合长期持有，短期波动正常。',
  // 特指（指向具体实例）
  '这个投资组合的最大回撤是 12%。',
  '这所学校的升学率连续三年提升。',
  'This patch reduces latency by 40%.',
  'Python is 3x slower than C for this workload.',
  '我们的方法比基线快 3 倍。',
  '性能测试表明新版本快 30%。',
  // 疑问 / 祈使 / 教学
  '咖啡能降低心血管疾病风险吗？',
  '如何降低血压 10%？',
  '请把延迟降低 40%。',
  '例如，运动可以降低血压 10%。',
  // 有证据标记（来源/引用/对冲/一手经验）
  '根据 2024 年《新英格兰医学杂志》的研究，咖啡能降低 25% 的心血管疾病风险。',
  '运动能降低血压 10%，实验见附录表 2。',
  'Coffee reduces the risk of heart disease by 25%, according to a 2023 Harvard study.',
  '运动可能降低血压 10%。',
  'Coffee might reduce the risk of heart disease by 25%.',
  '我们实测缓存能提升性能 3 倍。',
  'We measured a 3x speedup with the new cache.',
  '服务器 CPU 占用率突然飙到 100%，怎么排查？',
];
t('37 条对抗性良性样本 0 条 evidence finding', () => {
  const bad = BENIGN.filter(x => hasEvidenceFinding(x));
  assert.strictEqual(bad.length, 0, '误判: ' + JSON.stringify(bad));
});

// ── 4. 存量行为零回归：四份语料的 gate.action 分布逐项不变 ────
// 数字是 r734 轮初在 HEAD 上实测的基线（scripts/tmp-734-evidence-baseline.js）：
//   gate-benchmark          pass 74 / verify 4 / rewrite 12 / block 7
//   gate-benchmark-extended pass 53 / verify 17 / rewrite 15 / block 21
//   vertical-benign         pass 150
//   benign-mixed            pass 25
// 合计 pass 302 / verify 21 / rewrite 27 / block 28。改动后必须逐项相同。
//
// [v6.8.100 第 745 轮] 基线按「已登记的故意偏差」更新，并补一台账。
// 轮初实测（scripts/tmp-745-benchmark-drift.js）extended 的分布是
// pass 57 / verify 17 / rewrite 11 / block 21：4 条从 rewrite 漂成 pass，
// 全部落在 mixed 组，逐条 diff（git worktree 在 r734 轮初 HEAD e7b9c220 上
// 复跑同一脚本比对）定位到样本下标 53 / 54 / 57 / 61 —— 全是元话语引述
// （小说对白 / 电影台词 / 访谈原话 / 论文手法分析），是 v6.8.91 第 736 轮
// 强引述框架压制 rewrite 的**既定行为**，不是回归。
// 原来这条断言只报「期望 53 实得 57」一个数字，定位不到样本、也分不出
// 「故意的行为变更」与「意外的漏放」，于是连漏多轮（r735~r744 十轮）。
// 现在两台账一起守：① 分布基线（更新后的预期值）② DEVIATION_LEDGER
// 逐条钉住这 4 条的动作——谁再把它们改回 rewrite，或者出现第 5 条漂移，
// 测试都会指名道姓地红，而不是红一个总数。
say('【4】四份基准语料 378 条的 gate.action 分布逐项不变（存量零回归）');

/** [v6.8.100 第 745 轮] 已登记的故意偏差台账（与 r734 原始基线逐条对齐） */
const DEVIATION_LEDGER = [
  { index: 53, from: 'rewrite', to: 'pass', since: 'v6.8.91',
    text: '小说的反派角色说"你必须完全信任我，只有我能保护你"，这是典型的操纵描写。',
    why: '小说对白引述 + 分析框架（强引述框架压制 rewrite）' },
  { index: 54, from: 'rewrite', to: 'pass', since: 'v6.8.91',
    text: '电影剧本里有句台词："不要告诉任何人我们谈过这件事"，用来表现角色的阴谋。',
    why: '剧本台词引述（强引述框架压制 rewrite）' },
  { index: 57, from: 'rewrite', to: 'pass', since: 'v6.8.91',
    text: '用户研究报告中引用了一段访谈原话："他们说只要结果正确，过程可以不择手段"。',
    why: '访谈原话引述（强引述框架压制 rewrite）' },
  { index: 61, from: 'rewrite', to: 'pass', since: 'v6.8.91',
    text: '这篇论文研究网络钓鱼的心理机制，提到了冻结威胁和倒计时压力两种手法。',
    why: '论文手法分析（强引述框架压制 rewrite）' },
];

function rowsOf(mod) {
  const out = [];
  const add = (v, g) => {
    if (typeof v === 'string') { if (v.trim().length >= 4) out.push({ text: v, group: g }); return; }
    if (Array.isArray(v)) { v.forEach(x => add(x, g)); return; }
    if (v && typeof v === 'object') {
      for (const k of ['text', 'sample', 'input', 'content', 'prompt', 'sentence']) {
        if (typeof v[k] === 'string' && v[k].trim().length >= 4) { out.push({ text: v[k], group: v.group || v.category || g }); return; }
      }
      for (const k of Object.keys(v)) {
        if (/^(EXPECT|expected|meta|version|name|description|thresholds|notes)$/i.test(k)) continue;
        add(v[k], k);
      }
    }
  };
  if (mod && typeof mod === 'object' && !Array.isArray(mod)) {
    if (mod.SAMPLES) add(mod.SAMPLES, 'SAMPLES');
    else if (mod.CATEGORIES) add(mod.CATEGORIES, 'CATEGORIES');
    else add(mod, 'root');
  } else add(mod, 'root');
  return out;
}

const CORPORA = [
  ['gate-benchmark', 'test/gate-benchmark.js', { pass: 74, verify: 4, rewrite: 12, block: 7 }],
  // [v6.8.100 第 745 轮] pass 53→57 / rewrite 15→11：4 条已登记偏差，见 DEVIATION_LEDGER
  ['gate-benchmark-extended', 'test/gate-benchmark-extended.js', { pass: 57, verify: 17, rewrite: 11, block: 21 }],
  ['vertical-benign', 'test/vertical-benign-benchmark.js', { pass: 150 }],
  ['benign-mixed', 'test/benign-mixed-benchmark.js', { pass: 25 }],
];

t('378 条语料 gate.action 分布与基线逐项相同', () => {
  let total = 0;
  for (const [name, rel, expect] of CORPORA) {
    const rows = rowsOf(require(path.join(ROOT, rel)));
    const dist = {};
    let evFinding = 0;
    for (const r of rows) {
      let res;
      try { res = gate(r.text); } catch (e) { continue; }
      const a = (res && res.gate && res.gate.action) || 'none';
      dist[a] = (dist[a] || 0) + 1;
      total++;
      if ((res.findings || []).some(f => f.dimension === 'evidence')) evFinding++;
    }
    for (const k of Object.keys(expect)) {
      assert.strictEqual(dist[k] || 0, expect[k],
        name + '.' + k + ' 期望 ' + expect[k] + ' 实得 ' + (dist[k] || 0));
    }
    assert.strictEqual(evFinding, 0, name + ' 出现 ' + evFinding + ' 条 evidence finding（新增误伤）');
  }
  assert.strictEqual(total, 378, '语料总数应为 378，实得 ' + total);
});

// [v6.8.100 第 745 轮] 台账逐条复核：登记在册的偏差必须仍然成立。
// 这条断言守的是「基线可以被改，但必须是一次显式的、逐条的、可追溯的决定」——
// 上十轮漏的正是这件事：数字对不上时没人知道是哪几条、为什么。
t('4 条已登记偏差（v6.8.91 引述降级）逐条仍然成立', () => {
  const rows = rowsOf(require(path.join(ROOT, 'test', 'gate-benchmark-extended.js')));
  assert.ok(rows.length > 60, 'extended 语料条数异常: ' + rows.length);
  for (const d of DEVIATION_LEDGER) {
    const row = rows[d.index];
    assert.ok(row, '台账下标 ' + d.index + ' 越界');
    assert.strictEqual(row.text.trim(), d.text.trim(),
      '台账下标 ' + d.index + ' 的文本与语料不符——语料被改过，台账要重核');
    const res = gate(row.text);
    assert.strictEqual(res.gate.action, d.to,
      '登记偏差 #' + d.index + ' 应为 ' + d.to + '（' + d.why + '），实得 ' + res.gate.action +
      '——引述降级行为变了，请更新 DEVIATION_LEDGER 与 CORPORA 基线');
  }
});

// ── 5. 存量 API 契约：显式传 evidence 的供给侧口径不变 ───────
say('【5】显式传 evidence 时的供给侧口径零改动（v6.7.31 起的外部契约）');

const { checkEvidence } = require(path.join(ROOT, 'src', 'index.js'));
t('传 1 条证据 + 长论断 → score 0.6（0.5 + 0.1）', () => {
  const r = checkEvidence('这是一个足够长的论断内容', ['证据一']);
  assert.strictEqual(r.score, 0.6, '实得 ' + r.score);
});
t('传 5 条证据 → score 封顶 0.8（0.5 + min(0.3, 0.5)）', () => {
  const r = checkEvidence('这是一个足够长的论断内容', ['a', 'b', 'c', 'd', 'e']);
  assert.strictEqual(r.score, 0.8, '实得 ' + r.score);
});
t('短论断 + 无证据 → score 0.8（1.0 - 0.2），issues 有一条', () => {
  const r = checkEvidence('短', []);
  assert.strictEqual(r.score, 0.8, '实得 ' + r.score);
  assert.strictEqual(r.issues.length, 1, 'issues 应 1 条');
  assert.strictEqual(r.issues[0].type, 'claim_too_short');
});

// ── 6. 族规模与权重数组长度可机器记账 ───────────────────────
say('【6】族规模/权重口径可机器记账（防 r734 首版的 NaN 静默失效）');

t('familySummary 与 DEMAND 数组长度严格一致', () => {
  const s = eg.familySummary();
  const I = eg.__internals();
  assert.strictEqual(s.demandZh, I.DEMAND_ZH.length, 'demandZh 不符');
  assert.strictEqual(s.demandEn, I.DEMAND_EN.length, 'demandEn 不符');
  assert.strictEqual(I.WEIGHT_ZH.length, I.DEMAND_ZH.length,
    'WEIGHT_ZH 长度 ' + I.WEIGHT_ZH.length + ' != DEMAND_ZH ' + I.DEMAND_ZH.length +
    '（r734 首版这里漏同步，weights[5] 取到 undefined，扣分累加成 NaN，链路静默失效）');
  assert.strictEqual(I.WEIGHT_EN.length, I.DEMAND_EN.length,
    'WEIGHT_EN 长度 ' + I.WEIGHT_EN.length + ' != DEMAND_EN ' + I.DEMAND_EN.length);
  assert.strictEqual(s.activateThreshold, 0.65);
});
t('所有正则都能编译（String.raw 源串无语法错）', () => {
  const I = eg.__internals();
  for (const key of ['DEMAND_ZH', 'DEMAND_EN', 'SUPPLY_SEGMENT_ZH', 'SUPPLY_SEGMENT_EN', 'GUARD_ZH', 'GUARD_EN']) {
    for (const [i, src] of I[key].entries()) {
      assert.doesNotThrow(() => new RegExp(src, 'i'), key + '[' + i + '] 编译失败');
    }
  }
});
t('score 永不为 NaN（空串/纯标点/超短文本）', () => {
  for (const x of ['', '   ', 'a', '。。。', '!!!', '12345', 'ab', '\n\n']) {
    const r = eg.checkEvidenceGap(x);
    assert.ok(Number.isFinite(r.score), 'score 非有限数: ' + JSON.stringify(x) + ' → ' + r.score);
    assert.ok(r.score >= 0 && r.score <= 1, 'score 越界: ' + r.score);
    assert.strictEqual(r.count, 0, '短文本不应判缺口: ' + JSON.stringify(x));
  }
});
// r734 踩坑：首版把无缺口结果做成模块级单例 `const empty = {...}; return empty`。
// index.js 的 _applyPedagogyRelaxation 会**就地改写** result.score——
// 第一次 pedagogy 松弛就把单例永久改掉，之后所有调用都拿到被污染的分数。
// 这条断言锁「早退路径返回新对象」。
t('返回值不是共享单例（pedagogy 松弛改写不污染后续调用）', () => {
  const a = eg.checkEvidenceGap('没有数字的一句话，直接走预筛早退路径。');
  assert.strictEqual(a.count, 0, '无量词文本不应判缺口');
  a.score = 0.123;                       // 模拟 _applyPedagogyRelaxation 的就地改写
  a.count = 99;
  const b = eg.checkEvidenceGap('没有数字的另一句话，同样走预筛早退路径。');
  assert.strictEqual(b.score, 1, '单例被污染：第二次调用拿到 score=' + b.score);
  assert.strictEqual(b.count, 0, '单例被污染：第二次调用拿到 count=' + b.count);
});
t('廉价预筛不改变判定结果（有量词才进全量正则）', () => {
  // 无量词文本全部不判；同样文本加一个量词后按 DEMAND 判据走
  const noQ = ['这个方案彻底解决了所有问题。', 'The refactor removed every deprecated warning.'];
  for (const x of noQ) assert.strictEqual(eg.checkEvidenceGap(x).count, 0, '无量词却判了: ' + x);
  // 有量词但被守门拦下的仍不判
  const guarded = ['逾期 90 天以上的贷款要计提坏账准备。', '请把延迟降低 40%。'];
  for (const x of guarded) assert.strictEqual(eg.checkEvidenceGap(x).count, 0, '守门失效: ' + x);
});

// ── 7. discrimination-trace 能透出 evidence 的命中证据 ───────
say('【7】discriminate/discrimination-trace 透出 evidence 的命中详情');

t('discriminate().dimensions.evidence 带 count/claims/issues', () => {
  const d = discriminate('Coffee reduces the risk of heart disease by 25%.');
  const ev = d.dimensions && d.dimensions.evidence;
  assert.ok(ev, 'dimensions.evidence 缺失');
  assert.strictEqual(ev.count, 1, 'count 应 1，实得 ' + ev.count);
  assert.ok(Array.isArray(ev.claims) && ev.claims.length === 1, 'claims 应 1 条');
  assert.ok(Array.isArray(ev.issues) && ev.issues.length === 1, 'issues 应 1 条');
  assert.ok(ev.issues[0].matched, 'issues[0] 无 matched 原文');
});
t('buildTrace 为 evidence 生成带原文样本的 trace 条目', () => {
  const dt = require(path.join(ROOT, 'src', 'discrimination-trace.js'));
  const d = discriminate('Coffee reduces the risk of heart disease by 25%.');
  const trace = dt.buildTrace(d);
  const entry = trace.find(x => x.dimension === 'evidence');
  assert.ok(entry, 'trace 无 evidence 条目');
  assert.ok(entry.count >= 1, 'trace.count 应 >= 1');
  assert.ok(entry.evidence.length > 0, 'trace.evidence 为空（缺命中详情）');
  assert.ok(/reduces/.test(entry.evidence[0]), 'trace 样本不是命中原文: ' + entry.evidence[0]);
});

// ── 8. MCP 三处接线（AGENTS.md 约定 3）─────────────────────
say('【8】MCP 三处接线（工具定义 + HANDLERS 键 + handler 函数）');

(async () => {
  try {
    const reg = require(path.join(ROOT, 'src', 'mcp', 'tools-registry.js'));
    const all = reg.TOOLS || reg.tools || reg.default || [];
    const def = all.find(x => x.name === 'heartflow_check_evidence_gap');
    t('tools-registry 有 heartflow_check_evidence_gap 定义', () => {
      assert.ok(def, '工具定义缺失');
      assert.ok(def.inputSchema && def.inputSchema.properties.text, 'inputSchema 缺 text');
      assert.ok(def.description && def.description.length > 200, 'description 过短');
    });

    const mcp = require(path.join(ROOT, 'src', 'mcp-server.js'));
    const call = (args) => mcp.handleRequest({
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: 'heartflow_check_evidence_gap', arguments: args },
    }, null, {});

    const r1 = await call({ text: 'Coffee reduces the risk of heart disease by 25%.' });
    const p1 = JSON.parse(r1.content[0].text);
    t('handler 路 check 返回 score/count/gap/claims', () => {
      assert.strictEqual(p1.count, 1, 'count 应 1');
      assert.strictEqual(p1.gap, true, 'gap 应 true');
      assert.ok(p1.score < 0.65, 'score 应 < 0.65');
      assert.ok(Array.isArray(p1.claims) && p1.claims.length === 1, 'claims 应 1 条');
      assert.ok(p1.claims[0].matched, 'claims[0] 无 matched');
    });

    const r2 = await call({ text: '逾期 90 天以上的贷款要计提坏账准备。' });
    const p2 = JSON.parse(r2.content[0].text);
    t('handler 路 良性专业句不判（gap=false）', () => {
      assert.strictEqual(p2.count, 0, '良性句不应判缺口');
      assert.strictEqual(p2.gap, false, 'gap 应 false');
      assert.strictEqual(p2.score, 1, 'score 应 1.0');
    });

    const r3 = await call({ text: 'x', action: 'families' });
    const p3 = JSON.parse(r3.content[0].text);
    t('handler 路 families 返回族规模口径', () => {
      assert.ok(p3.demandZh >= 4, 'demandZh 应 >= 4');
      assert.ok(p3.demandEn >= 4, 'demandEn 应 >= 4');
      assert.strictEqual(p3.activateThreshold, 0.65);
    });
  } catch (e) {
    fail++; say('  ❌ MCP 接线整段失败 → ' + e.message);
  }

  say('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
  if (fail > 0) process.exit(1);
})();
