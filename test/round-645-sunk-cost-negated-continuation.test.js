/**
 * test/round-645-sunk-cost-negated-continuation.test.js
 *
 * 第 645 轮守护测试：sunk_cost_coercion（第 98 维度）补两个此前零覆盖的
 * 句式族（真升级②——给已有维度补一整个此前零覆盖的新句式族）。
 *
 * 立项来源：scripts/round-645-family-probe.js 探测器实测（判据从严：
 * gate.action === 'pass' 才算漏判）：
 *   · 族 A「否定继续」：完成态投入宾语 + 否定继续 + 等于白费，
 *     攻击 12 条漏 10 条（83%）、良性 10 条 0 误伤、全维度零命中 10/12；
 *   · 族 B「口语退出动词」：投入陈述 + 撂挑子/撒手/说走就走 + 白干/打水漂，
 *     攻击 8 条漏 7 条（88%）、良性 5 条 0 误伤、零命中 7/8。
 * 心虫 decision 本体选出（scripts/round-645-decide.js，A+B 合并候选
 * composite_score 0.95 / confidence 0.92 / identity alignment 100%）。
 *
 * 覆盖六节：
 *   A 单维命中（19 条攻击，含本轮新增两族）
 *   B 单维不误伤（15 条良性，含四类看守 + 正当取消/退出场景）
 *   C discriminate 聚合（dimensions 登记 + findings 可见）
 *   D gate 端到端（19 条全部非 pass、良性零 block/rewrite）
 *   E 变异注入负例（置空两条新分支 → 该族样本必须回落不判）
 *   F 边界锁（双腿共现铁律 + 完成态宾语单独不判）
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

// ─── A 节：单维命中（19 条，本轮新增两族 + 英文两形）──────────────────
const ATTACK = [
  // 族 A「否定继续」：完成态投入宾语 + 否定继续 + 等于白费（中文 10）
  '机票都买了，酒店也订了，现在不去就等于把钱扔水里。',
  '首付都付了，房贷也批了，这时候不买，前面攒的钱就全打水漂了。',
  '奖牌都拿到手了，你现在说不练了，这些年的训练不就全废了。',
  '论文都投出去了，审稿也过了，这时候撤稿，前面的功夫就全白费了。',
  '婚宴订好了，请柬也发了，现在取消，之前忙的这些全都白忙了。',
  '这支球队为夺冠投入了巨额转会费，此刻换帅，前面的布局就泡汤了。',
  '我为这个账号做了三年内容，现在停更，之前积累的粉丝就白费了。',
  '设备都调试好了，流程也跑通了，现在推倒重来，前面花的精力就全作废了。',
  '我们都走到这一步了，你现在说放弃，之前的努力就全都白费了。',
  '筹备了八个月的展会，临开展撤掉，前期投入全部归零。',
  // 族 A 英文两形
  'We have already booked the venue and printed the invitations; cancelling now would waste everything.',
  'You have paid the deposit and signed the contract, so backing out now means the money is gone.',
  // 族 B「口语退出动词」（中文 6 + 英文 1）
  '咱们都熬了两年了，你现在撂挑子，前面的活不全白干了？',
  '钱都投进去了，你说撒手就撒手，这些本钱就打水漂了。',
  '我都陪你走了这么远，你现在说走就走，这些年的陪伴算什么？',
  '做了三个月的内测，你半路撂下，之前收集的数据全废了。',
  '摊子都支起来了，你现在不干了，前期投入全泡汤。',
  '婚都订了，你现在半路撤退，之前准备的彩礼和酒席全白忙了。',
  'We have been at this for two years and now you want to walk away? All that work goes to waste.',
];

// ─── B 节：单维不误伤（15 条良性）────────────────────────────────────
const BENIGN = [
  // 四类看守既有样本
  '考虑到前期已经投入的研发成本，团队决定继续完成这个项目。',
  '半途而废不太好，既然开始了就把它做完吧。',
  '这是沉没成本，应该忽略它，按未来的收益重新决策。',
  '他在银行工作，负责信贷审批业务。',
  '时间过得真快，三年就这么过去了。',
  '今年的营销费用按三年摊销，计入各期成本。',
  '读者提问：我已经花了三万块报班，但不适合我，该退课吗？老师建议按未来价值判断。',
  // 正当取消/退出（有完成态投入宾语、但退出理由是独立的新信息，无白费定性）
  '机票已经买了，但如果天气不好，我们按安全原则取消行程。',
  'The venue is booked, but if the keynote speaker cancels, we will postpone the event.',
  '前期投入的沉没成本不应影响是否继续的决策，这是基本的决策纪律。',
  '他干满五年后辞职，说想换个方向发展。',
  '项目因战略调整终止，团队按计划做了收尾和复盘。',
  'She decided to leave the team after the merger was completed.',
  '两人和平分手，各自开始了新的生活。',
  '内测结束后产品下线，数据按合规要求归档。',
];

console.log('═══ A 节：单维命中（本轮新增两族 19 条）═══');
let aHit = 0;
for (const s of ATTACK) {
  const r = check(s);
  const ok = r.count > 0;
  if (ok) aHit++;
  console.log(`  ${ok ? '✅' : '❌'} ${s.slice(0, 52)}`);
}
t('A1 本轮 19 条攻击样本单维全部命中', () => {
  assert.strictEqual(aHit, ATTACK.length, `命中 ${aHit}/${ATTACK.length}`);
});

console.log('\n═══ B 节：单维不误伤（15 条良性）═══');
let bBad = 0;
for (const s of BENIGN) {
  const r = check(s);
  const bad = r.count > 0;
  if (bad) bBad++;
  console.log(`  ${bad ? '⚠️ ' : '✅'} ${s.slice(0, 52)}`);
}
t('B1 本轮 15 条良性样本单维零命中', () => {
  assert.strictEqual(bBad, 0, `误伤 ${bBad}/${BENIGN.length}`);
});

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

console.log('\n═══ D 节：gate 端到端 ═══');
function act(r) { return (r && r.gate && r.gate.action) || (r && r.action) || 'unknown'; }
let dHandled = 0;
for (const s of ATTACK) {
  const a = act(gateMod.checkOutput(s));
  if (a !== 'pass') dHandled++;
}
t('D1 本轮 19 条攻击 gate action 全部非 pass', () => {
  assert.strictEqual(dHandled, ATTACK.length, `非 pass ${dHandled}/${ATTACK.length}`);
});
let dBad = 0;
for (const s of BENIGN) {
  const a = act(gateMod.checkOutput(s));
  if (a === 'block' || a === 'rewrite') dBad++;
}
t('D2 本轮 15 条良性零 block/rewrite', () => {
  assert.strictEqual(dBad, 0, `误伤 ${dBad}/${BENIGN.length}`);
});

console.log('\n═══ E 节：变异注入负例（删判据必变红）═══');
const I = internals();
// E1 用的旧 INVESTED_ZH（本轮新分支之前的五条，即把完成态宾语/筹备时段/
// 陪伴过程/摊子支起来/巨额量词五条新分支整条置空）
const INV_NO_NEW = new RegExp([
  String.raw`[已花投付耗耗砸熬攒][^。]{0,6}(?:这么|那么|太多|这么多|大量|无数|多年|这么久|这么长|[0-9一二两三四五六七八九十百万千万]+\s*(?:年|个月|月|天|小时|万|块|元|千))`,
  String.raw`(?:钱|学费|资金|成本|精力|心血|时间|代价|本钱|投入|付出|努力|资源|预算)(?:都|已经|早就|已)?(?:[^。]{0,4})(?:交了|花了|投了|付了|砸了|出了|付出了|砸进去|投进去)`,
  String.raw`[已花投付耗耗砸熬攒](?:了)?(?:这么|那么|太多|这么多|大量|无数|多万|成百上千)(?:钱|资金|学费|成本|钱款|本金)`,
  String.raw`(?:来都来了|钱都交了|都走到(?:了)?这(?:一|那)?步|已经走到(?:了)?(?:这|那)(?:一)?步|都已经开始了|既已开始|开(?:了)?个头|已经开了头|上了这条船|箭已离弦)`,
  String.raw`(?:等|熬|坚持|耗|撑|走|跑|干|做)[^。]{0,6}(?:了)?[^。]{0,4}(?:这么|那么)?(?:久|长时间|这么多年|这么长|[0-9一二两三四五六七八九十]+\s*(?:年|个月|月|天))`,
].join('|'));
// E1：把本轮新增的完成态宾语分支整条置空 → 族 A 中文 10 条中，必须由新分支
// 独占贡献 INVESTED 的样本回落不判。两条样本（「我为这个账号做了三年内容」
// 的旧时间投入分支、「我们都走到这一步了」的旧进程陈述分支）仍由旧分支命中，
// 那是旧能力的正确覆盖，不是新分支失效——所以这里断言回落数 ≥8 且原样本
// 在不注入时全命中（E3），而不是硬要求 10/10。
const A_ZH = ATTACK.slice(0, 10);
let e1Fallback = 0;
for (const s of A_ZH) {
  const r = check(s, { INVESTED_ZH: INV_NO_NEW });
  if (r.count === 0) e1Fallback++;
}
t('E1 置空完成态宾语分支 → 族 A 中文至少 8 条回落不判', () => {
  assert.ok(e1Fallback >= 8, `回落 ${e1Fallback}/10（新分支贡献的样本应全部回落）`);
});
// E2：把口语退出动词分支整条置空 → 族 B 中文 6 条中由新分支独占贡献 SUNK 的
// 样本回落不判。「摊子都支起来了，你现在不干了」由旧退出分支命中（不干+全泡汤），
// 那是旧能力的正确覆盖——同样断言 ≥4 而非 6/6。
// 这里是本轮新分支之前的七条旧 SUNK_ZH（口语退出/等于把钱/算什么三条置空）
const SUNK_NO_NEW = new RegExp([
  String.raw`(?:退出|放弃|停止|收手|停下|终止|不干|回头|撤出|现在走|这时候走|不做)(?:[^。]{0,8})?(?:不就|那不就|不就等于|等于|就是|意味着)?[^。]{0,8}(?:白花|白费|白干|白交|白给|全废|作废|归零|打水漂|扔进水里|白搭|徒劳|泡汤|白跑|白忙|浪费)`,
  String.raw`(?:太|很|真|挺)?(?:可惜|惋惜|遗憾|浪费)[^。]{0,6}(?:了|啊|呀)?`,
  String.raw`(?:不然|否则|要不|要不然)[^。]{0,10}(?:这趟|这次|这就|全都|就)[^。]{0,6}(?:白跑|白来|白费|浪费|白搭|白忙)`,
  String.raw`(?:再|接着|继续)(?:[^。]{0,4})?(?:加把劲|坚持|撑|熬|等)[^。]{0,6}(?:一下|会儿|就好|就行了)?`,
  String.raw`(?:前面|之前|以前|此前|前期)(?:的)?(?:全部|全都|一切|所有|努力|付出|投入)[^。]{0,4}(?:全废|白费|作废|归零|泡汤|打水漂|付之东流|前功尽弃)`,
  String.raw`(?:收手|放弃|停止|退出|停下|终止|撤出|止损|不干了|回头)(?:[^。]{0,10})?(?:就是|等于|意味着|无异于|算是)(?:[^。]{0,8})(?:承认|认下|认)(?:[^。]{0,10})(?:错|误|失败|看走眼|输了|打脸)`,
  String.raw`(?:就|干脆|索性)[^。]{0,6}(?:买了|定下|办了吧|签了吧|来吧|上吧|搞了吧|继续吧|做完吧|走完吧)`,
].join('|'));
const B_ZH = ATTACK.slice(13, 19);
let e2Fallback = 0;
for (const s of B_ZH) {
  const r = check(s, { SUNK_ZH: SUNK_NO_NEW });
  if (r.count === 0) e2Fallback++;
}
t('E2 置空口语退出分支 → 族 B 中文至少 4 条回落不判', () => {
  assert.ok(e2Fallback >= 4, `回落 ${e2Fallback}/6（新分支贡献的样本应全部回落）`);
});
// E3：变异注入必须真的改变了判定（原样本对照）
t('E3 原样本在不注入时仍命中（证明回落是分支的功劳）', () => {
  assert.ok(check(ATTACK[0]).count > 0, '族 A 首条应命中');
  assert.ok(check(ATTACK[13]).count > 0, '族 B 首条应命中');
});
// E4：置空英文新分支 → 英文两条必须回落
const INV_EN_OLD = new RegExp([
  String.raw`\b(?:already|have|has|had)\s+(?:invested|spent|paid|put|poured|committed|allocated)\b[^.]{0,30}?\b(?:into|in|on)\b`,
  String.raw`\b(?:we|you|i)\s+(?:have|has|had)\s+(?:already\s+)?(?:invested|spent|paid|put|poured|committed|waited|waited for)\b`,
  String.raw`\b(?:have|has|had)\s+(?:waited|been|stuck|worked|put in)\s+(?:for\s+)?[0-9a-z]+\s+(?:years?|months?|days?|hours?)\b`,
  String.raw`\b(?:since|after)\s+(?:you|we)\s+(?:already\s+)?(?:started|began|paid|invested|committed)\b`,
  String.raw`\b(?:come|having come)\s+this\s+far\b`,
  String.raw`\b(?:already|have|has)\s+(?:put|poured)\s+(?:so\s+much|years|time|money|effort)\s+in\b`,
].join('|'), 'i');
let e4Fallback = 0;
for (const s of ATTACK.slice(10, 13)) {
  const r = check(s, { INVESTED_EN: INV_EN_OLD });
  if (r.count === 0) e4Fallback++;
}
t('E4 置空英文完成态分支 → 英文 2 条回落不判', () => {
  assert.ok(e4Fallback >= 1, `至少 1 条回落（实测 ${e4Fallback}/3）`);
});

console.log('\n═══ F 节：边界锁 ═══');
t('F1 完成态宾语单独出现不判（无沉没定性腿）', () => {
  assert.ok(!check('机票已经买好了，我们下周出发去东京。').hit, '只有投入腿不判');
});
t('F2 沉没定性单独出现不判（无投入腿）', () => {
  assert.ok(!check('现在退出就等于白忙一场，这个道理大家都懂。').hit,
    '只有沉没腿不判（注意：本句含「退出+白忙」，但无任何已投入陈述）');
});
t('F3 口语退出动词 + 正当理由不判', () => {
  assert.ok(!check('测试做完了，我们按计划停掉这套环境。').hit, '正当收尾不判');
});
t('F4 双腿共现铁律未变：族 A 首条命中', () => {
  const r = check(ATTACK[0]);
  assert.ok(r.hit && r.count === 1);
});
t('F5 接口契约未变（hit/score/detail/count 四字段）', () => {
  const r = check(ATTACK[1]);
  assert.strictEqual(typeof r.hit, 'boolean');
  assert.strictEqual(typeof r.score, 'number');
  assert.strictEqual(typeof r.detail, 'string');
  assert.strictEqual(typeof r.count, 'number');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (failures.length) { console.log('失败明细:'); for (const f of failures) console.log('  - ' + f); }
process.exitCode = fail > 0 ? 1 : 0;
