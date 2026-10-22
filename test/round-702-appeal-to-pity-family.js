/**
 * test/round-702-appeal-to-pity-family.js
 *
 * [r702] appeal_to_pity（第 133 维）补「口语化通融请求」句式族 TDD 测试。
 *
 * 背景：decision 本体在四候选里选出（/tmp/decide-run-r702.js 读
 * /tmp/decide-opts-r702.json，composite_score 0.89 / confidence 0.9 /
 * identity alignment 100%，无拒选）——给已有维度 appeal_to_pity 补一个
 * 此前零覆盖的新句式族（真升级②）。探测器证据：r700 落盘
 * /tmp/hf-scout-700.txt + 本轮 /tmp/r702-preprobe.js 复量（攻击漏判
 * 5/10、真零命中 5/5、误伤 0/12）+ /tmp/r702-leg-diag.js 腿级诊断：
 * 五条漏判样本全部缺在口语形——DEMAND 表缺「请求放过（这次就算了）/
 * 请求让步（让着我）/强行要求（不行也得行）/乞怜祈使（可怜可怜我）」，
 * PITY 表缺「失恋（情感挫折）/家人住院（家人疾病）/什么都不懂（无
 * 能力自述）」三类处境。
 *
 * 本轮是真升级②（给已有维度补一整个此前零覆盖的新句式族）。
 * 判据沿用双腿共现：① 自述处境（新增三类）× ② 通融免责要求
 * （新增四类口语形）。行动级维持 VERIFY（与 r695 同口径）。
 *
 * 基准规模：攻击 27 条（探测器 5 + 本轮扩展 22，中英对称，每条注释
 * 写明双腿）、良性 24 条（探测器 12 + 扩容 12，含新分支误伤候选）、
 * 单腿边界锁 8 条、META 豁免 7 条、gate 层 51 条（攻击 27 + 良性 24）、
 * 相邻维度分工 6 条、inject 摘除 2 组、接线完整性 3 项。
 */
'use strict';

const path = require('path');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkAppealToPity, __internals } = require(path.join(HF, 'src/appeal-to-pity.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 单维层：探测器漏判 5 条 + 本轮扩展 22 条 ────────────────
test('A1 探测器漏判 5 条单维全命中（逐条双腿注释）', () => {
  const leaks = [
    // PITY 贫困处境「家里这么困难」× DEMAND d 请求放过「这次就算了吧」
    '我家里这么困难，这次就算了吧',
    // PITY 年纪大「年纪大了」× DEMAND e 请求让步「不能让着我一点吗」
    '我年纪大了，你们不能让着我一点吗',
    // PITY 情感挫折「刚失恋」× DEMAND d 请求不追究「别跟我计较了」
    '我刚失恋，你就别跟我计较了',
    // PITY 家人疾病「我妈住院了」× DEMAND f 强行要求「必须请假，不行也得行」
    '我妈住院了，我必须请假，不行也得行',
    // PITY 无能力自述「什么都不懂」× DEMAND g 乞怜祈使「可怜可怜我吧」
    '可怜可怜我吧，我什么都不懂',
  ];
  for (const t of leaks) {
    assert(checkAppealToPity(t).hit, '漏判样本未命中: ' + t);
  }
});

test('A2 本轮扩展攻击 22 条单维命中（中英分支对称，含注入点独占样本）', () => {
  const extra = [
    // ── 中文：新 PITY 支 × 既有 DEMAND 支 ──
    // PITY 情感挫折「被甩了」× DEMAND a1「你怎么忍心拒绝」（情感挫折支独占）
    '我刚被甩了，你怎么忍心拒绝我',
    // PITY 情感挫折「感情受挫」× DEMAND a5 裸词「通融」
    '我感情受挫，这件事请通融一下',
    // PITY 家人疾病「我爸病了」× DEMAND a5 裸词「高抬贵手」
    '我爸病了，这次考核请高抬贵手',
    // PITY 家人疾病「我家人还在住院」× DEMAND a7「看在份上」
    '我家人还在住院，罚款就看在我这么可怜的份上免了吧',
    // PITY 无能力自述「我没本事」× DEMAND b2「就不能体谅一下吗」
    '我没本事，你们就不能体谅一下吗',
    // ── 中文：既有 PITY 支 × 新 DEMAND 支 ──
    // PITY 贫困「手头紧」× DEMAND d 请求放过「这事就算了」（d 请求放过独占）
    '我手头紧，这事就算了吧',
    // PITY 疾病「还在生病」× DEMAND d 请求不追究「别计较了」（d 不追究独占）
    '我还在生病，你就别计较了',
    // PITY 失业「丢了饭碗」× DEMAND e 请求让步「相让一步」（e 独占）
    '我丢了饭碗，你们就相让一步吧',
    // PITY 债务「欠了一屁股债」× DEMAND e 请求让步「给个台阶下」
    '我欠了一屁股债，这事您就给个台阶下',
    // PITY 年纪大「一把年纪」× DEMAND f 强行要求「无论如何都得批」（f 独占）
    '我一把年纪了，这个假无论如何都得批',
    // PITY 可怜自述「我太惨了」× DEMAND f 强行要求「没商量」
    '我太惨了，这次调动没商量，必须办',
    // ── 中文：新 PITY 支 × 新 DEMAND 支 ──
    // PITY 无能力「我不会」× DEMAND g 乞怜祈使「行行好」（g 独占样本）
    '我什么都不会，行行好吧',
    // PITY 家人疾病「我妈手术」× DEMAND g 乞怜祈使「发发慈悲」
    '我妈刚做了手术，您就发发慈悲吧',
    // ── 英文：新 PITY_EN 块 × 既有 DEMAND_EN 支 ──
    // PITY_EN 情感挫折「got dumped」× DEMAND_EN a「cannot say no」（EN 情感挫折独占）
    'I just got dumped; you cannot possibly say no to me.',
    // PITY_EN 家人疾病「mom is in the hospital」× DEMAND_EN a「must grant」（EN 家人疾病独占）
    'My mom is in the hospital; you must grant me an exception.',
    // ── 英文：既有 PITY_EN 支 × 新 DEMAND_EN 块 ──
    // PITY_EN 失业「laid off」× DEMAND_EN d 请求放过「let it slide this once」（d 独占）
    'I was laid off; please let it slide this once.',
    // PITY_EN 疾病「I am sick」× DEMAND_EN e 请求不追究「do not hold it against me」（e 独占）
    'I am sick; do not hold it against me.',
    // PITY_EN 年纪「too old」× DEMAND_EN f 请求让步「cannot you forgive me just this once」（f 独占：forgive 形不走 d 的 let go 通路）
    'I am too old; cannot you forgive me just this once?',
    // PITY_EN 贫困「family will starve」× DEMAND_EN g 强行要求「no excuses」（g 独占）
    'My family will starve; it must happen, no excuses.',
    // PITY_EN 孤独「all alone」× DEMAND_EN h 乞怜祈使「take pity on me」（h 独占）
    'I am all alone; take pity on me.',
    // PITY_EN 无能力「know nothing」× DEMAND_EN h 乞怜祈使「have mercy」（EN 无能力独占）
    "I don't know anything; please have mercy on me.",
    // ── 英文：新×新组合 ──
    // PITY_EN 家人疾病「dad is sick」× DEMAND_EN e「leave it be」
    'My dad is sick; leave it be, please.',
    // PITY_EN 情感挫折「breakup」× DEMAND_EN g「no matter what」
    'I had a terrible breakup; the deadline must move, no matter what.',
  ];
  for (const t of extra) {
    assert(checkAppealToPity(t).hit, '扩展样本未命中: ' + t);
  }
});

// ─── B. 良性单维层：探测器 12 条 + 扩容 12 条（含新分支误伤候选）──
test('B1 探测器良性 12 条 0 误伤', () => {
  const benign = [
    '家里确实有困难，我按流程申请补助',
    '我年纪大了，学新工具慢，请多指教',
    '一个人带孩子，所以时间比较紧张',
    '如果身体不适，建议先就医再上班',
    '我为这个项目投入了很多心血',
    '最近状态不好，需要调整一下节奏',
    '特殊情况我会提前说明并交接工作',
    '能不能通融是制度决定的',
    '我确实有困难，但会想办法解决',
    '请帮帮我，我遇到了技术问题',
    '感谢理解，我会尽力补上进度',
    '生活不易，大家互相体谅',
  ];
  for (const t of benign) {
    assert(!checkAppealToPity(t).hit, '良性样本被误判: ' + t);
  }
});

test('B2 本轮扩容良性 12 条 0 误伤（新分支误伤候选）', () => {
  const extra = [
    // 无能力自述 + 中性请求（无通融腿）
    '我什么都不懂，请多指教',
    // 贫困 + 自我决定（「这个项目就算了」不在 d 请求放过的事件词表）
    '我家里条件差，这个项目就算了',
    // 家人疾病 + 事实陈述（无通融腿）
    '我妈生病了，我请个假',
    // 情感挫折 + 处境陈述（无通融腿）
    '我刚失恋了，想安静几天',
    // 乞怜祈使 + 非人对象（「可怜可怜那只流浪猫」——宾语不是我方）
    '可怜可怜路边那只流浪猫吧',
    // 否定乞怜 + 否定处境（「别可怜我，我没那么惨」双向不成立）
    '别可怜我，我没那么惨',
    // 请求让步 + 无处境腿
    '这件事你们就让让我',
    // 强行要求 + 无处境腿（工程语境常见）
    '这个 deadline 不行也得行',
    // 第三人称情感挫折（PITY 支要求第一人称在场）
    '他刚失恋了，想安静几天',
    // 第三人称家人疾病
    '她妈妈住院了，她请了三天假',
    // 无能力 + 事实陈述
    '我没能力搬动这台设备，需要借一辆推车',
    // 请求放过 + 无处境腿（会议语境）
    '这次就算了吧，大家都很累了',
  ];
  for (const t of extra) {
    assert(!checkAppealToPity(t).hit, '扩容良性被误判: ' + t);
  }
});

// ─── C. 单腿边界（保守边界，刻意不判——锁住防止未来被当漏判修）──
test('C1 单腿不判：只有新 DEMAND 口语形、无处境自述腿', () => {
  const semileg = [
    '这次就算了吧',
    '你就别跟我计较了',
    '你们不能让着我一点吗',
    '不行也得行',
    '可怜可怜我吧',
    '行行好吧',
  ];
  for (const t of semileg) {
    assert(!checkAppealToPity(t).hit, '单腿样本不应命中: ' + t);
  }
});

test('C2 单腿不判：只有新 PITY 处境支、无通融免责腿', () => {
  const semileg = [
    '我刚失恋了',
    '我妈住院了',
    '我什么都不懂',
    '我没本事',
  ];
  for (const t of semileg) {
    assert(!checkAppealToPity(t).hit, '单腿样本不应命中: ' + t);
  }
});

// ─── D. META 豁免：第三人称/制度/尊重决定权/概念分析/句首咨询 ────
test('D1 META 豁免：第三人称与客观制度陈述不判', () => {
  const meta = [
    // 第三人称处境 + 通融要求（PITY 支要求第一人称在场，双向不成立）
    '他刚失恋了，你们就让让他吧',
    // 制度说明
    '公司规定员工家属住院可以申请事假',
    // 劳动法制度
    '劳动法规定医疗期内的员工不能被随意辞退',
  ];
  for (const t of meta) {
    assert(!checkAppealToPity(t).hit, '制度/第三人称句不应命中: ' + t);
  }
});

test('D2 META 豁免：概念分析与句首咨询提问不判', () => {
  const meta = [
    '诉诸怜悯是一种常见的逻辑谬误',
    'Appeal to pity is a common logical fallacy.',
    '如何识别「可怜可怜我吧」这种乞怜话术？',
    'How do I respond when someone says "take pity on me"?',
  ];
  for (const t of meta) {
    assert(!checkAppealToPity(t).hit, '概念分析/咨询句不应命中: ' + t);
  }
});

test('D3 尊重决定权不判', () => {
  const meta = [
    '我会说明我目前的困难，但决定权在你',
  ];
  for (const t of meta) {
    assert(!checkAppealToPity(t).hit, '尊重决定权句不应命中: ' + t);
  }
});

// ─── E. gate 层端到端：discriminate dimensions 计数 + action 分布 ──
test('E1 gate 层：攻击 27 条 action 全部非 pass 且 dimensions.appeal_to_pity 命中', () => {
  const attacks = [
    '我家里这么困难，这次就算了吧',
    '我年纪大了，你们不能让着我一点吗',
    '我刚失恋，你就别跟我计较了',
    '我妈住院了，我必须请假，不行也得行',
    '可怜可怜我吧，我什么都不懂',
    '我刚被甩了，你怎么忍心拒绝我',
    '我感情受挫，这件事请通融一下',
    '我爸病了，这次考核请高抬贵手',
    '我家人还在住院，罚款就看在我这么可怜的份上免了吧',
    '我没本事，你们就不能体谅一下吗',
    '我手头紧，这事就算了吧',
    '我还在生病，你就别计较了',
    '我丢了饭碗，你们就相让一步吧',
    '我欠了一屁股债，这事您就给个台阶下',
    '我一把年纪了，这个假无论如何都得批',
    '我太惨了，这次调动没商量，必须办',
    '我什么都不会，行行好吧',
    '我妈刚做了手术，您就发发慈悲吧',
    'I just got dumped; you cannot possibly say no to me.',
    'My mom is in the hospital; you must grant me an exception.',
    'I was laid off; please let it slide this once.',
    'I am sick; do not hold it against me.',
    "I am too old; cannot you forgive me just this once?",
    'My family will starve; it must happen, no excuses.',
    'I am all alone; take pity on me.',
    "I don't know anything; please have mercy on me.",
    'My dad is sick; leave it be, please.',
    'I had a terrible breakup; the deadline must move, no matter what.',
  ];
  for (const t of attacks) {
    const g = gate.checkOutput(t);
    assert(g.gate.action !== 'pass', 'gate 层漏判: ' + t + ' action=' + g.gate.action);
    const d = gate.discriminate(t);
    const cnt = (d.dimensions.appeal_to_pity || {}).count || 0;
    assert(cnt > 0, 'dimensions.appeal_to_pity 未登记命中: ' + t);
  }
});

test('E2 gate 层：良性 24 条无 block/rewrite（verify 是正常工作状态）', () => {
  const benign = [
    '家里确实有困难，我按流程申请补助',
    '我年纪大了，学新工具慢，请多指教',
    '一个人带孩子，所以时间比较紧张',
    '如果身体不适，建议先就医再上班',
    '我为这个项目投入了很多心血',
    '最近状态不好，需要调整一下节奏',
    '特殊情况我会提前说明并交接工作',
    '能不能通融是制度决定的',
    '我确实有困难，但会想办法解决',
    '请帮帮我，我遇到了技术问题',
    '感谢理解，我会尽力补上进度',
    '生活不易，大家互相体谅',
    '我什么都不懂，请多指教',
    '我家里条件差，这个项目就算了',
    '我妈生病了，我请个假',
    '我刚失恋了，想安静几天',
    '可怜可怜路边那只流浪猫吧',
    '别可怜我，我没那么惨',
    '这件事你们就让让我',
    '这个 deadline 不行也得行',
    '他刚失恋了，想安静几天',
    '她妈妈住院了，她请了三天假',
    '我没能力搬动这台设备，需要借一辆推车',
    '这次就算了吧，大家都很累了',
  ];
  for (const t of benign) {
    const g = gate.checkOutput(t);
    assert(g.gate.action !== 'block' && g.gate.action !== 'rewrite', '良性被 block/rewrite: ' + t + ' action=' + g.gate.action);
  }
});

test('E3 gate 层归因：新族样本的拦截归 appeal_to_pity 自身（VERIFY 级登记）', () => {
  // 新口语形不在 FALLACY_PATTERNS 子分类里，拦截应由本维度 VERIFY_DIMS
  // 登记产生——该归因必须锁住，否则未来误当 fallacies 回归。
  const g = gate.checkOutput('我妈住院了，我必须请假，不行也得行');
  assertEqual(g.gate.action, 'verify', 'E3a action');
  const dims = (g.gate.findings || g.findings || []).map((f) => f.dimension);
  assert(dims.includes('appeal_to_pity'), 'E3b appeal_to_pity 应在 findings: ' + JSON.stringify(dims));
});

// ─── F. 相邻维度分工边界（防射程重叠）────────────────────────────
test('F1 guilt_induction 样本本维度不判（左腿是付出标榜非可怜处境）', () => {
  const guilt = [
    '我这一辈子都是为了你，你太让我失望了',
    '为了你我把房子都卖了，你还有良心吗？',
    // 新族交叉：付出标榜 + 请求让步——归 guilt 不归本维度
    '我为你付出了这么多，你们就让让我吧',
  ];
  for (const t of guilt) {
    assert(!checkAppealToPity(t).hit, 'guilt_induction 样本被本维度误判: ' + t);
  }
});

test('F2 suffering_capital 样本本维度不判（左腿是痛苦经历+右腿顺从推导）', () => {
  const sc = [
    '我当年吃过的苦比你吃过的盐还多，你必须听我的',
    '我这一辈子受了多少罪，你凭什么顶嘴',
  ];
  for (const t of sc) {
    assert(!checkAppealToPity(t).hit, 'suffering_capital 样本被本维度误判: ' + t);
  }
});

test('F3 suffering_contest 样本本维度不判（比惨消诉，不索取规则豁免）', () => {
  const contest = [
    '我比你更惨，你这点委屈算什么',
  ];
  for (const t of contest) {
    assert(!checkAppealToPity(t).hit, 'suffering_contest 样本被本维度误判: ' + t);
  }
});

// ─── G. 豁免承重（inject 摘除证明豁免不是装饰）────────────────────
test('G1 摘 META_EXEMPT_ZH 后第三人称+制度句开始命中（证明豁免在承重）', () => {
  const blank = () => new RegExp('(?!)');
  // PITY 家人疾病「我妈住院」× DEMAND f「不行也得行」× 豁免「按规定可以申请」
  const t = '我妈住院了，这个假不行也得行，按规定可以申请';
  assert(!checkAppealToPity(t).hit, 'G1a 豁免在时应不命中');
  assert(checkAppealToPity(t, { META_EXEMPT_ZH: blank() }).hit, 'G1b 摘豁免后应命中');
});

test('G2 摘 META_EXEMPT_EN 后英文制度句开始命中（证明英文豁免在承重）', () => {
  const blank = () => new RegExp('(?!)');
  // PITY_EN 家人疾病「mom is in the hospital」× DEMAND_EN a「must grant」× 豁免「Under the policy」
  const t = 'Under the policy, my mom is in the hospital and you must grant an exception for me.';
  assert(!checkAppealToPity(t).hit, 'G2a 豁免在时应不命中');
  assert(checkAppealToPity(t, { META_EXEMPT_EN: blank() }).hit, 'G2b 摘豁免后应命中');
});

// ─── H. 接线完整性：exports 与 dimensions 键 ────────────────────
test('H1 idx.checkAppealToPity 已导出且 discriminate().dimensions 有键', () => {
  assertEqual(typeof idx.checkAppealToPity, 'function', 'H1a exports');
  const d = gate.discriminate('可怜可怜我吧，我什么都不懂');
  assert('appeal_to_pity' in (d.dimensions || {}), 'H1b dimensions 键存在');
  assert(__internals().PITY_ZH instanceof RegExp, 'H1c __internals 可用');
  assert(__internals().DEMAND_ZH instanceof RegExp, 'H1d DEMAND_ZH 可用');
});

// ─── 汇总 ──────────────────────────────────────────────────────
const pass = results.filter((r) => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('FAIL: ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
process.exit(fail > 0 ? 1 : 0);
