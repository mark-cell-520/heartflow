/**
 * 「最+主观形容词」泛化补形回归（第 222 轮 / v6.7.125）
 *
 * 接线前实测缺口（scripts/round-222/probe-r222-superlative.js）：
 *   · checkConfidenceCalibration 的中文 superlative 分支是**词表白名单制**：
 *     枚举 60+ 形容词，追不上中文形容词的生成性。
 *   · 53 条「最+评价性形容词+物品/服务」族端到端只命中 40 条，
 *     漏 13 条：最耐用/最灵敏/最省心/最贴心/最难用/最吵/最脏/最新鲜/最准。
 *   · 用户两次当场指出同一盲区（memory 铁律：只抓「最+客观事实」，
 *     漏「最+主观形容词」）。
 *
 * 本轮新增判据：最 + 1~3 字形容词 + 的 + 1~6 字对象（severity 0.2 的
 * overconfidence issue）。三条边界全部经 326 条良性池 + 25 条自建对照
 * 实测零误伤：
 *   ① 时间/序列副词整词中性化（不吃副词+形容词，否则「最新鲜」「最快的车」被误吃）
 *   ② 度量术语前缀中性化（最大回撤/最小样本量/最大误差）
 *   ③ 过程量句式中性化（最XX的YY 是/放在/出现在 ZZ = 陈述过程不是评价）
 *
 * 断言判据纪律（217/218 轮教训）：查内容不查布尔存在。每条 assert 的 msg
 * 写清「实际值」，突变必须让具体某条断言红。
 *
 * 文件形态照 test/self-verification-consumers-r219.test.js（run-all 实测能跑的
 * 单个 async IIFE + 汇总行 + exit）。
 */
const path = require('path');
const ROOT = process.cwd();
const idx = require(path.join(ROOT, 'src/index.js'));
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { console.error('FAIL:', msg); failed++; }
}

console.log('=== 「最+主观形容词」泛化补形回归（第 222 轮）===\n');

// ── ① 词表白名单制的漏判族必须被新判据补上 ────────────────────────
// 形状：最 + 双字/三字评价性形容词 + 的 + 物品/服务对象
{
  const pool = [
    '这是最耐用的地板', '这是最灵敏的传感器', '这是最省心的服务',
    '这是最贴心的设计', '这是最难用的界面', '这是最吵的机器',
    '这是最脏的车间', '这是最准的预报', '这是最薄的玻璃',
    '这是最静的夜', '这是最闹的街', '这是最硬的床',
    '这是最软的糖', '这是最好的服务', '这是最强的对手',
    '这是最棒的表现', '这是最漂亮的设计', '这是最出色的发挥',
  ];
  let hit = 0;
  const miss = [];
  for (const t of pool) {
    const r = idx.checkConfidenceCalibration(t);
    const has = (r.issues || []).some(i => /superlative generic/.test(String(i.detail)));
    if (has) hit++; else miss.push(t);
  }
  assert(hit === pool.length,
    `白名单外形容词族 ${hit}/${pool.length} 命中 superlative generic，漏: ${JSON.stringify(miss)}`);
}

// ── ② 既有白名单族不得回归（新判据是补形不是替换）────────────────
{
  for (const t of ['这是最安静的机器', '这是最省电的一台']) {
    const r = idx.checkConfidenceCalibration(t);
    const subj = (r.issues || []).some(i => /superlative subjective/.test(String(i.detail)));
    const gen = (r.issues || []).some(i => /superlative generic/.test(String(i.detail)));
    assert(subj, `${t} 仍应命中既有 superlative subjective（实际 ${JSON.stringify(r.issues)}）`);
    assert(gen, `${t} 新判据应同时命中 superlative generic（实际 ${JSON.stringify(r.issues)}）`);
  }
  // 「业界最优的方案」：既有白名单经 subjective 捕获；新判据被
  // /最(?:…|优)的?(?:…|方案)/ 建议句式豁免吃掉了 —— 这是真实语义取舍
  // （「最优方案」在无来源时是评价性宣称，但同时是常规工程建议语体），
  // 保守起见不双判，只断言既有白名单仍命中，不作为本轮缺口。
  {
    const r = idx.checkConfidenceCalibration('业界最优的方案');
    const subj = (r.issues || []).some(i => /superlative subjective/.test(String(i.detail)));
    assert(subj, `业界最优的方案 仍应命中既有 superlative subjective（实际 ${JSON.stringify(r.issues)}）`);
  }
}

// ── ③ 时间/序列副词整词中性化（不得误吃「副词+形容词」）──────────
// v5 教训：只删「最新」而 /最新/ 无边界 → 「最新鲜的蔬菜」被吃成漏判；
// 只删「最快的路径」→「最快的车」被误命中。这条防回归。
{
  const neut = [
    '最近三天天气都不错，适合出门散步',
    '最终版本已经确定，请大家按照新流程执行',
    '最初的方案里并没有这一项，是后来补上的',
    '最新版本已经发布，修复了若干已知问题',
    '最后一章的内容需要润色',
    '最早的记录可以追溯到去年三月',
    '最快的路径已经标注在地图上',
    '最短的路径是直线',
  ];
  for (const t of neut) {
    const r = idx.checkConfidenceCalibration(t);
    const gen = (r.issues || []).some(i => /superlative generic/.test(String(i.detail)));
    assert(!gen, `时间/序列副词句不得命中新判据: ${t}（实际 ${JSON.stringify(r.issues)}）`);
  }
}

// ── ④ 度量术语前缀中性化（金融/工程度量名词是客观陈述）──────────
{
  const metric = [
    '这个投资组合的最大回撤是 12%',
    '最小样本量必须大于 30 才满足统计要求',
    '最大的误差出现在系统启动阶段',
    '最小的间隔是 5 毫秒',
    '最长的等待时间出现在高峰期',
  ];
  for (const t of metric) {
    const r = idx.checkConfidenceCalibration(t);
    const gen = (r.issues || []).some(i => /superlative generic/.test(String(i.detail)));
    assert(!gen, `度量术语句不得命中新判据: ${t}（实际 ${JSON.stringify(r.issues)}）`);
  }
}

// ── ⑤ 建议句式豁免（最好/最稳妥的做法是常规建议语体）────────────
{
  const advice = [
    '最好的办法是先备份再操作',
    '最稳妥的做法是逐步灰度发布',
    '最优的方案需要进一步验证',
  ];
  for (const t of advice) {
    const r = idx.checkConfidenceCalibration(t);
    const gen = (r.issues || []).some(i => /superlative generic/.test(String(i.detail)));
    assert(!gen, `建议句式不得命中新判据: ${t}（实际 ${JSON.stringify(r.issues)}）`);
  }
}

// ── ⑥ 过程量句式中性化（最XX的YY 是/放在/出现在 ZZ = 陈述过程）───
{
  const proc = [
    '最重的箱子放在最底层',
    '最重要的指标是转化率',
    '最重要的保证是资金到位',
  ];
  for (const t of proc) {
    const r = idx.checkConfidenceCalibration(t);
    const gen = (r.issues || []).some(i => /superlative generic/.test(String(i.detail)));
    assert(!gen, `过程量句式不得命中新判据: ${t}（实际 ${JSON.stringify(r.issues)}）`);
  }
}

// ── ⑦ 端到端：新增 issue 必须真的走到 gate（checkOutput）────────
// 只测 checkConfidenceCalibration 是单元绿、端到端绿不了的经典假象。
{
  let verified = 0;
  const pool = ['这是最耐用的地板', '这是最省心的服务', '这是最难用的界面', '这是最棒的表现'];
  for (const t of pool) {
    const g = checkOutput(t);
    if (g.gate.action !== 'pass') verified++;
  }
  assert(verified === pool.length,
    `端到端 checkOutput 应把 ${pool.length} 条全部判为非 pass（实际 ${verified}）`);
}

// ── ⑧ 端到端反向：中性化族不得被误升级 --------------------------
// ⚠️ 「最新的方案...」「最好的办法...」这两句**在基线就已经是 verify**
// （既有的 superlative subjective 白名单命中），不是本轮新判据造成的。
// 判据改成「新判据不得贡献 issue」而不是「必须 pass」——否则断言的是
// 与基线无关的东西， mutation 一来就假红。
{
  let leaked = 0;
  const pool = [
    '最近版本已经发布，修复了若干已知问题',
    '最好的办法是先备份再操作',
    '这个投资组合的最大回撤是 12%',
    '最重要的指标是转化率',
  ];
  for (const t of pool) {
    const r = idx.checkConfidenceCalibration(t);
    if ((r.issues || []).some(i => /superlative generic/.test(String(i.detail)))) leaked++;
  }
  assert(leaked === 0, `中性化族不得命中新判据（实际 ${leaked}）`);
  // 端到端层面：这四条不得因本轮改动改变 action。
  // 基线口径（改动前 p3 探针逐条实测）：pass / verify / pass / verify。
  // ⚠️ 「最好的办法」「最重要的指标」在**基线就已是 verify**（既有
  // superlative subjective 白名单命中，detail 实测为 superlative subjective(1)），
  // 与本轮新判据无关。
  {
    const expect = [
      ['最近版本已经发布，修复了若干已知问题', 'pass'],
      ['最好的办法是先备份再操作', 'verify'],
      ['这个投资组合的最大回撤是 12%', 'pass'],
      ['最重要的指标是转化率', 'verify'],
    ];
    for (const [t, want] of expect) {
      const g = checkOutput(t);
      assert(g.gate.action === want,
        `中性化族端到端动作应与基线一致 ${t}: 期望 ${want} 实际 ${g.gate.action}`);
    }
  }
}

// ── ⑨ 不得因为新判据把 action 抬到 rewrite/block（verify 封顶）───
// 判据：superlative generic 的 severity 0.2 是评分量不是闸门量，
// 单独出现只能到 verify。
{
  const g = checkOutput('这是最耐用的地板');
  assert(g.gate.action !== 'block' && g.gate.action !== 'rewrite',
    `单条最+形容词族不得升级到 block/rewrite（实际 ${g.gate.action}）`);
}

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
