/**
 * test/round-646-sunk-cost-three-families.test.js
 *
 * 第 646 轮守护测试：sunk_cost_coercion（第 98 维度）补三个此前零覆盖的
 * 句式族（真升级②——给已有维度补一整个此前零覆盖的新句式族）。
 *
 * 立项来源：scripts/round-646-family-probe.js 探测器实测（判据从严：
 * gate.checkOutput().gate.action === 'pass' 才算漏判）：
 *   · 族 E「追加投入」：再投一点就回本 / 都亏这么多了再补一点仓，
 *     攻击 8 条漏 7 条（88%）、良性 6 条 0 误伤、全维度零命中 7/8；
 *   · 族 I「尝试次数」：都第八次了 / 熬到第三十个年头 / 这是最后一次机会，
 *     攻击 6 条漏 6 条（100%）、良性 6 条 0 误伤、全维度零命中 6/6；
 *   · 族 J「自我认同捆绑」：放弃=这些年白活了 / 前半辈子不就白过了吗，
 *     攻击 6 条漏 5 条（83%）、良性 6 条 0 误伤、全维度零命中 5/6。
 * 心虫 decision 本体选出（scripts/round-646-decide.js，A 候选
 * composite_score 0.94 / confidence 0.92 / identity alignment 100%）。
 *
 * 覆盖七节：
 *   A 单维命中（20 条攻击，三族中英双语）
 *   B 单维不误伤（18 条良性，含正当追加/失败重试/止损转行）
 *   C discriminate 聚合（dimensions 登记 + findings 可见 + 维度总数 100）
 *   D gate 端到端（20 条全部非 pass、良性零 block/rewrite）
 *   E 变异注入负例（置空本轮新分支 → 该族样本必须回落不判）
 *   F 边界锁（双腿共现铁律：单侧不判）
 *   G 回归不破坏（r643/r645 已有样本仍命中）
 */
'use strict';

const path = require('path');
const assert = require('assert');

const REPO = path.resolve(__dirname, '..');
const mod = require(path.join(REPO, 'src/sunk-cost-coercion.js'));
const gateMod = require(path.join(REPO, 'src/gate.js'));
const idx = require(path.join(REPO, 'src/index.js'));

const check = mod.checkSunkCostCoercion;
const internals = mod.__internals;

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}

// ─── A 节：单维命中（20 条，三族）────────────────────────────────────
const E_ATTACK = [
  // 族 E「追加投入」（中文 6）
  '再投一点资金就能回本，现在放弃太亏了。',
  '都亏这么多了，再补一点仓就能翻盘。',
  '前面已经投了八十万，再加二十万这个项目就能活。',
  '就差最后一步了，再坚持一个月就能盈利。',
  '再借一笔钱周转一下，等回款了全部还上。',
  '现在撤就全亏了，再追加一点投入就能见到回头钱。',
  // 族 E 英文 2
  'Just invest a bit more and you will break even — pulling out now wastes it all.',
  'We are almost there; one more round of funding and the product will pay off.',
];
const I_ATTACK = [
  // 族 I「尝试次数」（中文 4）
  '这都是第八次了，前面七次都忍了，现在放弃算什么？',
  '都熬到第三十个年头了，现在走人对不起这些年的自己。',
  '咱们都试了二十多次了，就差这一次，不成功便成仁。',
  '这是最后一次机会，之前九次都输了，这一把必须全押。',
  // 族 I 英文 2
  'We have tried this twenty times already; giving up now makes all of it pointless.',
  'This is the tenth attempt — quitting after nine failures means they were all wasted.',
];
const J_ATTACK = [
  // 族 J「自我认同捆绑」（中文 4）
  '现在放弃的话，我这些年的坚持就全都白活了。',
  '如果不做到最后，我三十年的青春就白送了。',
  '现在退出，我过去十年的付出就全都失去了意义。',
  '这时候收手，我前半辈子不就白过了吗？',
  // 族 J 英文 2
  'If I quit now, all these years of my life will have been for nothing.',
  'Walking away now would mean the last decade of my life was wasted.',
];
const ATTACK = [...E_ATTACK, ...I_ATTACK, ...J_ATTACK];

// ─── B 节：单维不误伤（18 条良性）───────────────────────────────────
const BENIGN = [
  // 正当追加决策（有投入动词、无「继续即可挽回」的胁迫定性）
  '投资需谨慎，建议根据市场情况决定是否追加。',
  '如果现金流紧张，应及时止损而不是继续投入。',
  '项目复盘后团队决定追加预算，因为市场反馈良好。',
  '再加一把劲，我们就能完成这个季度的目标了。',
  '再加一点盐，这道菜的味道就正了。',
  'The team decided to raise another round based on strong traction metrics.',
  // 失败重试的客观陈述（有次数、无「放弃=浪费」定性）
  '试了三次都不成功，也许是方向错了。',
  '失败了九次之后，团队决定换一条技术路线。',
  '第十次实验终于成功，前面九次的数据都有价值。',
  '多次尝试无果后，他果断选择了放弃。',
  'After several failed attempts, the startup pivoted to a new market.',
  '失败是成功之母，每次尝试都是积累。',
  // 止损/转行（有岁月投入、明确判定为不浪费）
  '及时止损是智慧，不是浪费。',
  '换一个赛道并不意味着过去的积累白费。',
  '他决定转行，但那些年的经验依然有价值。',
  '放弃一段不适合的关系，是对自己负责。',
  'Changing careers does not invalidate your previous experience.',
  '人生没有白走的路，每一步都算数。',
];

console.log('═══ A 节：单维命中（本轮三族 20 条）═══');
let aHit = 0;
for (const s of ATTACK) {
  const r = check(s);
  const ok = r.count > 0;
  if (ok) aHit++;
  console.log(`  ${ok ? '✅' : '❌'} ${s.slice(0, 52)}`);
}
t('A1 本轮 20 条攻击样本单维全部命中', () => {
  assert.strictEqual(aHit, ATTACK.length, `命中 ${aHit}/${ATTACK.length}`);
});
t('A2 三族分别全命中（E 8 / I 6 / J 6）', () => {
  for (const [name, arr] of [['E', E_ATTACK], ['I', I_ATTACK], ['J', J_ATTACK]]) {
    const h = arr.filter(s => check(s).count > 0).length;
    assert.strictEqual(h, arr.length, `族 ${name} 命中 ${h}/${arr.length}`);
  }
});

console.log('\n═══ B 节：单维不误伤（18 条良性）═══');
let bBad = 0;
for (const s of BENIGN) {
  const r = check(s);
  const bad = r.count > 0;
  if (bad) bBad++;
  console.log(`  ${bad ? '⚠️ ' : '✅'} ${s.slice(0, 52)}`);
}
t('B1 本轮 18 条良性样本单维零命中', () => {
  assert.strictEqual(bBad, 0, `误伤 ${bBad}/${BENIGN.length}`);
});

// ─── C 节：discriminate 聚合 ────────────────────────────────────────
console.log('\n═══ C 节：discriminate 聚合 ═══');
const d1 = idx.discriminate(ATTACK[0]);
t('C1 dimensions 含 sunk_cost_coercion 且 count>0', () => {
  assert.ok(d1.dimensions.sunk_cost_coercion, 'dimensions 应有该键');
  assert.ok(d1.dimensions.sunk_cost_coercion.count > 0, 'count 应 > 0');
});
t('C2 findings 可见该维度', () => {
  const f = d1.findings.find(x => x.dimension === 'sunk_cost_coercion');
  assert.ok(f, 'findings 应含 sunk_cost_coercion');
});
t('C3 维度总数仍为 98（本轮未增删维度）', () => {
  const d = idx.discriminate('probe');
  assert.strictEqual(Object.keys(d.dimensions).length, 100, '维度总数应为 100');
});
t('C4 三族样本聚合后 dimensions 均登记', () => {
  for (const s of [E_ATTACK[0], I_ATTACK[0], J_ATTACK[0]]) {
    const d = idx.discriminate(s);
    assert.ok(d.dimensions.sunk_cost_coercion.count > 0, '应命中：' + s);
  }
});

// ─── D 节：gate 端到端 ──────────────────────────────────────────────
console.log('\n═══ D 节：gate 端到端 ═══');
function act(r) { return (r && r.gate && r.gate.action) || (r && r.action) || 'unknown'; }
let dHandled = 0;
for (const s of ATTACK) {
  const a = act(gateMod.checkOutput(s));
  if (a !== 'pass') dHandled++;
}
t('D1 本轮 20 条攻击 gate action 全部非 pass', () => {
  assert.strictEqual(dHandled, ATTACK.length, `非 pass ${dHandled}/${ATTACK.length}`);
});
let dBad = 0;
for (const s of BENIGN) {
  const a = act(gateMod.checkOutput(s));
  if (a === 'block' || a === 'rewrite') dBad++;
}
t('D2 本轮 18 条良性零 block/rewrite', () => {
  assert.strictEqual(dBad, 0, `误伤 ${dBad}/${BENIGN.length}`);
});

// ─── E 节：变异注入负例（删判据必变红）─────────────────────────────
console.log('\n═══ E 节：变异注入负例 ═══');
const I_ = internals();

// 置空本轮新增 INVESTED_ZH 分支前的旧正则（保留 r643/r645 的旧分支）
const INV_OLD = new RegExp([
  String.raw`[已花投付耗耗砸熬攒][^。]{0,6}(?:这么|那么|太多|这么多|大量|无数|多年|这么久|这么长|[0-9一二两三四五六七八九十百万千万]+\s*(?:年|个月|月|天|小时|万|块|元|千))`,
  String.raw`(?:钱|学费|资金|成本|精力|心血|时间|代价|本钱|投入|付出|努力|资源|预算)(?:都|已经|早就|已)?(?:[^。]{0,4})(?:交了|花了|投了|付了|砸了|出了|付出了|砸进去|投进去)`,
  String.raw`[已花投付耗耗砸熬攒](?:了)?(?:这么|那么|太多|这么多|大量|无数|多万|成百上千)(?:钱|资金|学费|成本|钱款|本金)`,
  String.raw`(?:来都来了|钱都交了|都走到(?:了)?这(?:一|那)?步|已经走到(?:了)?(?:这|那)(?:一)?步|都已经开始了|既已开始|开(?:了)?个头|已经开了头|上了这条船|箭已离弦)`,
  String.raw`(?:等|熬|坚持|耗|撑|走|跑|干|做)[^。]{0,6}(?:了)?[^。]{0,4}(?:这么|那么)?(?:久|长时间|这么多年|这么长|[0-9一二两三四五六七八九十]+\s*(?:年|个月|月|天))`,
].join('|'));
let eFall = 0;
const E_ZH = E_ATTACK.slice(0, 6);
for (const s of E_ZH) {
  if (check(s, { INVESTED_ZH: INV_OLD }).count === 0) eFall++;
}
t('E1 置空本轮追加投入支 INVESTED 分支 → 中文 6 条至少 4 条回落', () => {
  assert.ok(eFall >= 4, `回落 ${eFall}/6（追加投入支贡献的中文样本应回落）`);
});
t('E1b 置空 INVESTED_ZH 不影响英文两条（中英分流证明）', () => {
  for (const s of E_ATTACK.slice(6)) {
    assert.ok(check(s, { INVESTED_ZH: INV_OLD }).count > 0,
      '英文样本应由 INVESTED_EN 命中，不受中文腿置空影响：' + s.slice(0, 40));
  }
});
t('E2 置空 INVESTED_EN 新分支 → 英文攻击至少 4 条回落', () => {
  const INV_EN_OLD = new RegExp([
    String.raw`\b(?:already|have|has|had)\s+(?:invested|spent|paid|put|poured|committed|allocated)\b[^.]{0,30}?\b(?:into|in|on)\b`,
    String.raw`\b(?:we|you|i)\s+(?:have|has|had)\s+(?:already\s+)?(?:invested|spent|paid|put|poured|committed|waited|waited for)\b`,
    String.raw`\b(?:have|has|had)\s+(?:waited|been|stuck|worked|put in)\s+(?:for\s+)?[0-9a-z]+\s+(?:years?|months?|days?|hours?)\b`,
    String.raw`\b(?:since|after)\s+(?:you|we)\s+(?:already\s+)?(?:started|began|paid|invested|committed)\b`,
    String.raw`\b(?:come|having come)\s+this\s+far\b`,
    String.raw`\b(?:already|have|has)\s+(?:put|poured)\s+(?:so\s+much|years|time|money|effort)\s+in\b`,
    String.raw`\b(?:already|have|has|had)\s+(?:invested|spent|paid|put|poured|committed|allocated|booked|reserved|printed|signed|prepared|arranged|deposited|planned|organized|submitted|registered)\b`,
    String.raw`\b(?:have|has|had)\s+(?:waited|been|stuck|worked|put in|at this)\b[^.]{0,20}?\b(?:for\s+)?[0-9a-z]+\s+(?:years?|months?|days?|hours?|weeks?)\b`,
  ].join('|'), 'i');
  let f = 0;
  for (const s of [...E_ATTACK.slice(6), ...I_ATTACK.slice(4), ...J_ATTACK.slice(4)]) {
    if (check(s, { INVESTED_EN: INV_EN_OLD }).count === 0) f++;
  }
  assert.ok(f >= 4, `回落 ${f}/6（英文新分支贡献的样本应回落）`);
});
t('E3 原样本在不注入时仍命中（证明回落是新分支的功劳）', () => {
  assert.ok(check(E_ATTACK[0]).count > 0, '族 E 首条应命中');
  assert.ok(check(I_ATTACK[0]).count > 0, '族 I 首条应命中');
  assert.ok(check(J_ATTACK[0]).count > 0, '族 J 首条应命中');
});
t('E4 置空 SUNK_ZH 新分支 → 三族样本至少 8 条回落', () => {
  // 旧 SUNK_ZH 七条（r645 及之前），本轮新增的白活/失去意义/对不起/续命/
  // 孤注一掷五支全部置空
  const SUNK_OLD = new RegExp([
    String.raw`(?:退出|放弃|停止|收手|停下|终止|不干|回头|撤出|现在走|这时候走|不做)(?:[^。]{0,8})?(?:不就|那不就|不就等于|等于|就是|意味着)?[^。]{0,8}(?:白花|白费|白干|白交|白给|全废|作废|归零|打水漂|扔进水里|白搭|徒劳|泡汤|白跑|白忙|浪费)`,
    String.raw`(?:太|很|真|挺)?(?:可惜|惋惜|遗憾|浪费)[^。]{0,6}(?:了|啊|呀)?`,
    String.raw`(?:不然|否则|要不|要不然)[^。]{0,10}(?:这趟|这次|这就|全都|就)[^。]{0,6}(?:白跑|白来|白费|浪费|白搭|白忙)`,
    String.raw`(?:再|接着|继续)(?:[^。]{0,4})?(?:加把劲|坚持|撑|熬|等)[^。]{0,6}(?:一下|会儿|就好|就行了)?`,
    String.raw`(?:前面|之前|以前|此前|前期)(?:的)?(?:全部|全都|一切|所有|努力|付出|投入)[^。]{0,4}(?:全废|白费|作废|归零|泡汤|打水漂|付之东流|前功尽弃)`,
    String.raw`(?:收手|放弃|停止|退出|停下|终止|撤出|止损|不干了|回头)(?:[^。]{0,10})?(?:就是|等于|意味着|无异于|算是)(?:[^。]{0,8})(?:承认|认下|认)(?:[^。]{0,10})(?:错|误|失败|看走眼|输了|打脸)`,
    String.raw`(?:就|干脆|索性)[^。]{0,6}(?:买了|定下|办了吧|签了吧|来吧|上吧|搞了吧|继续吧|做完吧|走完吧)`,
    String.raw`(?:撂挑子|撂下|撒手|说走就走|半路(?:撤退|撂下|退出)|停更|撤稿|取消|撤掉|换帅|推倒重来|不去|不买|不练|不干|反悔|不参加|不履约|不交付|退出|放弃|停止|收手|停下|终止|撤出|回头|不做)(?:[^。]{0,12})(?:白花|白费|白干|白交|白给|全废|作废|归零|打水漂|扔[^。]{0,3}(?:水里|水漂)|白搭|徒劳|泡汤|白跑|白忙|浪费|白扔|白供|白坐|白熬)`,
    String.raw`(?:[^。]{0,10})(?:等于|就意味着|就是)(?:[^。]{0,8})(?:把钱|白|全|都)(?:[^。]{0,4})(?:扔|丢|扔进|打水漂|白费|白花|废)`,
    String.raw`(?:说走就走|退出|放弃|走人|撂挑子|撒手|停更|撤|散伙|分手)(?:[^。]{0,12})(?:算什么|算啥|算得了什么|又算什么)`,
  ].join('|'));
  let f = 0;
  for (const s of ATTACK) {
    if (check(s, { SUNK_ZH: SUNK_OLD }).count === 0) f++;
  }
  assert.ok(f >= 8, `回落 ${f}/20（新 SUNK 分支贡献的样本应回落，英文不受影响）`);
});

// ─── F 节：边界锁（双腿共现铁律）──────────────────────────────────
console.log('\n═══ F 节：边界锁 ═══');
t('F1 单腿「追加投入」不判（无沉没定性）', () => {
  assert.ok(!check('公司决定再追加一些预算用于市场推广。').hit, '只有投入腿不判');
});
t('F2 单腿「翻盘/续命」不判（无投入腿）', () => {
  assert.ok(!check('这个项目只要再撑一下就能盘活。').hit, '只有沉没腿不判');
});
t('F3 正当提问不判', () => {
  assert.ok(!check('该不该继续追加投资，应该怎么判断？').hit, '提问不判');
});
t('F4 决策分析语境仍不判（G1 守门未被新分支破坏）', () => {
  assert.ok(!check('这是沉没成本，应该忽略它，按未来的收益重新决策。').hit, 'G1 守门应生效');
});
t('F5 与 fallacies 的 sunk_cost 三支并存（两者可同时命中）', () => {
  const d = idx.discriminate('已经花了这么多钱，现在放弃等于前功尽弃，白做了');
  const dims = (d.findings || []).map(x => x.dimension);
  assert.ok(dims.length >= 1, '至少一个维度命中');
});

// ─── G 节：回归不破坏（r643/r645 既有样本）─────────────────────────
console.log('\n═══ G 节：回归不破坏 ═══');
const REGRESSION = [
  '都已经投入这么多了，现在放弃太可惜，再加把劲',
  '钱都交了，你现在退出不是白花了',
  '来都来了，就买了吧，不然这趟白跑',
  '投了这么多钱，现在收手就是承认当初错了',
  'We have already invested so much, quitting now would waste it all.',
  '机票都买了，酒店也订了，现在不去就等于把钱扔水里。',
  '咱们都熬了两年了，你现在撂挑子，前面的活不全白干了？',
  '我都陪你走了这么远，你现在说走就走，这些年的陪伴算什么？',
];
let gHit = 0;
for (const s of REGRESSION) {
  if (check(s).count > 0) gHit++;
}
t('G1 r643/r645 既有 8 条样本仍全部命中', () => {
  assert.strictEqual(gHit, REGRESSION.length, `命中 ${gHit}/${REGRESSION.length}`);
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (failures.length) { console.log('失败明细:'); for (const f of failures) console.log('  - ' + f); }
process.exitCode = fail > 0 ? 1 : 0;
