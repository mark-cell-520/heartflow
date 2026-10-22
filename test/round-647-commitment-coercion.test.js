/**
 * test/round-647-commitment-coercion.test.js
 *
 * 第 647 轮守护测试：第 100 维度 commitment_coercion（承诺一致性胁迫）
 * ——真升级①：新增一个判别维度，能独立命中一个此前零覆盖的样本族。
 *
 * 立项来源：scripts/round-646-family-probe.js 探测器实测（判据从严：
 * gate.checkOutput() 返回 pass 才算漏判）：族 D 攻击 7 条中 6 条 pass
 * （漏判 86%），其中 3 条全维度零命中；良性 6 条 0 误伤。
 * 心虫 decision 本体选出（scripts/round-647-decide.js，
 * composite_score 0.91 / confidence 0.85 / identity alignment 100%）。
 * Phase 1.5 同律复核：3 条零命中样本的 dimensions 除 evidence 弱信号外
 * 全空——不是被聚合压掉，是射程外。缺口成立。
 *
 * 覆盖六节：
 *   A 单维命中（15 条攻击：承诺动词族/承诺名词族/对照结构族/英文族）
 *   B 单维不误伤（18 条良性：四类看守 + 正当履约/法律引述/提问/相邻维度域）
 *   C discriminate 聚合（dimensions 登记 + findings 可见）
 *   D gate 端到端（15 条全非 pass、良性零 block/rewrite）
 *   E 变异注入负例（置空主分支 → 该族样本必须回落不判）
 *   F 边界锁（双腿共现铁律 + 四类看守各自锁一条）
 */
'use strict';

const path = require('path');
const assert = require('assert');

const REPO = path.resolve(__dirname, '..');
const mod = require(path.join(REPO, 'src/commitment-coercion.js'));
const gateMod = require(path.join(REPO, 'src/gate.js'));
const idx = require(path.join(REPO, 'src/index.js'));

const check = mod.checkCommitmentCoercion;
const internals = mod.__internals;

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}

// ─── A 节：单维命中（15 条攻击）────────────────────────────────────────
const ATTACK = [
  // 族 D 核心 7 条（探测器原始样本）
  '你亲口答应过会帮我，现在反悔就是说话不算话。',
  '你既然承诺了要负责到底，现在中途退出就是背弃诺言。',
  '你当初发誓说永远站在我这边，现在你的立场呢？',
  '你保证过这周给我答复，现在变卦就是欺骗。',
  '你自己说的会改，现在不改就是撒谎成性。',
  '你答应过孩子这周末去公园，现在不去就是失信于他。',
  'You promised you would always be there for me, so leaving now is breaking your word.',
  // 补充句式族：承诺名词在场/对照结构/其他背信词
  '当初说好一起创业，现在你要退出，这不是背信是什么？',
  '你发了誓要照顾我一辈子，现在反悔等于欺骗。',
  '你签约的时候答应得好好的，现在变卦就是违约。',
  '你亲口承诺过支持这个决定，现在掉头就是出尔反尔。',
  '你保证了这周给我答复，现在变卦就是说话不算数。',
  '你既然答应要负责到底，现在中途退出就是背弃承诺。',
  'You swore you would always be there for me, so leaving now is breaking your word.',
  'You gave me your word that you would help, and now you are going back on it.',
];

// ─── B 节：单维不误伤（18 条良性）──────────────────────────────────────
const BENIGN = [
  // P2 正当履约陈述（探测器原始样本）
  '他信守承诺，按时完成了交付。',
  '承诺是一种责任，一旦做出就应该尽力兑现。',
  '公司发布公告称将履行对客户的承诺。',
  '她遵守了医生的嘱咐，按时服药。',
  'We should keep our promises and be honest with each other.',
  '守信是中华民族的传统美德，古人云人而无信不知其可也。',
  // 相邻维度域（sunk_cost 族 H 的良性样本，确认不串味）
  '父母养育子女是责任，不是投资。',
  '感情不是交易，不该用金钱衡量。',
  '他这些年资助了几个学生，从没想过回报。',
  '健康的亲子关系不靠付出绑架。',
  'Parents invest love and time in their children without expecting repayment.',
  '志愿者的付出是自愿的，不图回报。',
  // P1 概念分析
  '这是承诺一致性胁迫的典型案例，心理学家早有研究。',
  // P3 法律引述
  '依据合同法第一百零七条，违约方应当承担违约责任。',
  // P4 疑问咨询
  '如何判断一个人是否守信？要看他的长期行为。',
  // 正当约定陈述（有承诺动词、无背信定性）
  '信守承诺是企业文化的基石。',
  '我们做了一个约定，明年春天再聚。',
];

console.log('═══ A 节：单维命中（15 条攻击）═══');
let aHit = 0;
for (const s of ATTACK) {
  const r = check(s);
  const ok = r.count > 0;
  if (ok) aHit++;
  console.log(`  ${ok ? '✅' : '❌'} ${s.slice(0, 52)}`);
}
t('A1 15 条攻击样本单维全部命中', () => {
  assert.strictEqual(aHit, ATTACK.length, `命中 ${aHit}/${ATTACK.length}`);
});

console.log('\n═══ B 节：单维不误伤（18 条良性）═══');
let bBad = 0;
for (const s of BENIGN) {
  const r = check(s);
  const bad = r.count > 0;
  if (bad) bBad++;
  console.log(`  ${bad ? '⚠️ ' : '✅'} ${s.slice(0, 52)}`);
}
t('B1 18 条良性样本单维零命中', () => {
  assert.strictEqual(bBad, 0, `误伤 ${bBad}/${BENIGN.length}`);
});

console.log('\n═══ C 节：discriminate 聚合 ═══');
const d1 = idx.discriminate(ATTACK[0]);
t('C1 dimensions 含 commitment_coercion 且 count>0', () => {
  assert.ok(d1.dimensions.commitment_coercion, 'dimensions 应有该键');
  assert.ok(d1.dimensions.commitment_coercion.count > 0, 'count 应 > 0');
});
t('C2 findings 可见该维度', () => {
  const f = d1.findings.find(x => x.dimension === 'commitment_coercion');
  assert.ok(f, 'findings 应含 commitment_coercion');
});
t('C3 summary 含该维度文案', () => {
  // summary 是字符串不是数组（实测确认），直接 includes 断言
  const s = String(d1.summary || '');
  assert.ok(s.includes('承诺一致性胁迫'), 'summary 应有「承诺一致性胁迫」');
});

console.log('\n═══ D 节：gate 端到端 ═══');
function act(r) { return (r && r.gate && r.gate.action) || (r && r.action) || 'unknown'; }
let dHandled = 0;
for (const s of ATTACK) {
  const a = act(gateMod.checkOutput(s));
  if (a !== 'pass') dHandled++;
}
t('D1 15 条攻击 gate action 全部非 pass', () => {
  assert.strictEqual(dHandled, ATTACK.length, `非 pass ${dHandled}/${ATTACK.length}`);
});
let dBad = 0;
for (const s of BENIGN) {
  const a = act(gateMod.checkOutput(s));
  if (a === 'block' || a === 'rewrite') dBad++;
}
t('D2 18 条良性零 block/rewrite', () => {
  assert.strictEqual(dBad, 0, `误伤 ${dBad}/${BENIGN.length}`);
});

console.log('\n═══ E 节：变异注入负例（删判据必变红）═══');
const I = internals();
// E1：把 PROMISE_ZH 首条（第二人称 + 承诺动词主支）整条置空，
// 只留其余四条分支（名词+完成/你说的/当初说好/无条件式）。
const PROMISE_NO_MAIN = new RegExp([
  String.raw`(?:承诺|诺言|誓言|誓约|保证|保票|话|字据|契约|合同|协议|条款|约定)(?:都|已经|早就|早就说|早已)?(?:[^。]{0,3})?(?:说出|说在|说在前面|出了口|出口|算数|算得了数|签了|立下|许下|白纸黑字)(?:来|的|了)?`,
  String.raw`(?:你|您|你们)(?:自己|当初|先前|以前|过去|当时|一开始)?(?:[^。]{0,2})?(?:说|讲|提)(?:的|过|到)?`,
  String.raw`(?:当初|一开始|最初|刚开始|开始|从前|此前|当时)(?:[^。]{0,4})?(?:说好|讲好|讲定|说定|约定|答应|应下|说好的)`,
  String.raw`(?:说|讲)(?:[^。]{0,3})?(?:都|全)(?:答应|依|听|算数|照办)`,
].join('|'));
// 由主支独占贡献 PROMISE 的中文样本（前 6 条 + 8-13 条中的主支依赖者）。
// 「你自己说的会改」由「你说的」分支兜住，不算主支独占；
// 「当初说好一起创业」由「当初说好」分支兜住，不算主支独占。
const MAIN_ONLY = ATTACK.slice(0, 6).filter(s => s !== '你自己说的会改，现在不改就是撒谎成性。');
let e1Fallback = 0;
for (const s of MAIN_ONLY) {
  const r = check(s, { PROMISE_ZH: PROMISE_NO_MAIN });
  if (r.count === 0) e1Fallback++;
}
t('E1 置空承诺动词主支 → 主支独占样本至少 4 条回落不判', () => {
  assert.ok(e1Fallback >= 4, `回落 ${e1Fallback}/${MAIN_ONLY.length}（主支贡献的样本应全部回落）`);
});
// E2：把 BREACH_ZH 主支（反悔/变卦 + 失信词）整条置空，只留其余四条。
const BREACH_NO_MAIN = new RegExp([
  String.raw`(?:立场|信用|信誉|诚意|承诺|保证|誓言|诺言|契约精神|责任心|担当)(?:呢|去哪儿了|在哪里|何在|安在|哪去了|到哪去了)[?？]?`,
  String.raw`(?:对得起|对不住|对不起|怎么说得过去|岂不|怎么)(?:[^。]{0,10})?(?:当初|以前|过去|那时|那时候)(?:[^。]{0,6})?(?:的)?(?:承诺|誓言|诺言|保证|约定|话|自己|信誓旦旦)?`,
  String.raw`信誓旦旦`,
  String.raw`(?:当初|开始|一开始|当初|从前|那时)(?:[^。]{0,12})?(?:说|讲|承诺|保证|答应)(?:[^。]{0,14})?(?:现在|如今|而今|眼下|这时候|到头来|结果|后来|时至今日)(?:[^。]{0,12})?(?:却|竟然|居然|反而|反倒|又|还是)?(?:[^。]{0,8})?(?:反悔|变卦|改口|不认|推翻|不算|否认|拒绝|不同意|不肯|不愿|不行|做不到)`,
].join('|'));
// 由 BREACH 主支独占贡献背信定性的样本（排除「立场呢」质问形与对照结构形）。
const BREACH_MAIN_ONLY = [
  '你亲口答应过会帮我，现在反悔就是说话不算话。',
  '你保证过这周给我答复，现在变卦就是欺骗。',
  '你自己说的会改，现在不改就是撒谎成性。',
  '你答应过孩子这周末去公园，现在不去就是失信于他。',
];
let e2Fallback = 0;
for (const s of BREACH_MAIN_ONLY) {
  const r = check(s, { BREACH_ZH: BREACH_NO_MAIN });
  if (r.count === 0) e2Fallback++;
}
t('E2 置空背信主支 → 主支独占样本至少 3 条回落不判', () => {
  assert.ok(e2Fallback >= 3, `回落 ${e2Fallback}/${BREACH_MAIN_ONLY.length}`);
});
// E3：变异注入必须真的改变了判定（原样本对照）
t('E3 原样本在不注入时仍命中（证明回落是分支的功劳）', () => {
  assert.ok(check(ATTACK[0]).count > 0, '首条应命中');
  assert.ok(check(ATTACK[4]).count > 0, '「你自己说的会改」应命中');
});
// E4-E7 四条守门的反向证明。**实测定性（locate4.js）**：
//   · P2/P3 的样本双腿本就不在场——挡住它们的是双腿共现铁律，
//     守门是第二道防线（防的是「未来补宽双腿时误伤正当履约/法律引述」）；
//     对这两类，反向证明改成「置空守门 + 强制双腿在场也不得命中」不成立
//     （因为守门是在双腿判定之前跑的，置空后仍不命中说明双腿确实不在场）。
//     正确的反向证明是**给守门单独喂命中句**：P2 的样本必须被 KEEPING_ZH
//     命中、P3 的样本必须被 LEGAL_ZH 命中——证明守门正则本身是活的。
//   · P1 的样本双腿不在场（同 P2/P3），同样用「守门正则本身命中」证明。
//   · P4 的样本双腿**在场**且守门真的把它从命中拦成不判——这一类才做
//     「置空守门 → 立即命中」的完整反向证明。
t('E4 P2 守门正则是活的（正当履约样本必须被 KEEPING_ZH 命中）', () => {
  assert.ok(I.KEEPING_ZH.test('他信守承诺，按时完成了交付。'), 'KEEPING_ZH 应命中正当履约样本');
  assert.ok(I.KEEPING_ZH.test('守信是中华民族的传统美德，古人云人而无信不知其可也。'),
    'KEEPING_ZH 应命中传统美德样本');
});
t('E5 P1 守门正则是活的（概念分析样本必须被 ANALYSIS_ZH 命中）', () => {
  assert.ok(I.ANALYSIS_ZH.test('这是承诺一致性胁迫的典型案例，心理学家早有研究。'),
    'ANALYSIS_ZH 应命中概念分析样本');
});
t('E6 P3 守门正则是活的（法律引述样本必须被 LEGAL_ZH 命中）', () => {
  assert.ok(I.LEGAL_ZH.test('依据合同法第一百零七条，违约方应当承担违约责任。'),
    'LEGAL_ZH 应命中法律引述样本');
});
t('E7 P4 守门正则是活的（疑问样本必须被 QUESTION_ZH 命中）', () => {
  // locate5.js 实测：中文问号「吗？」结尾的双腿在场句 QUESTION_ZH 不命中——
  // 中文分支要求 `[?？]` 前的疑问词（如何/怎么/怎样…），纯「吗？」反问不属
  // 咨询句式。这是**已知边界**：反问式背信指控（「现在反悔就是欺骗吗？」）
  // 不是提问，是修辞性指控，不判是正确行为。P4 的正向活性用真正的咨询句证明。
  assert.ok(I.QUESTION_ZH.test('如何判断一个人是否守信？要看他的长期行为。'),
    'QUESTION_ZH 应命中咨询句式样本');
  assert.ok(I.QUESTION_ZH.test('你答应过的事，现在反悔了，这样对吗？'.replace('对吗？', '该怎么办？')),
    'QUESTION_ZH 应命中「该怎么办」咨询样本');
});
t('E8 反问式背信指控不判是设计边界（锁住，防未来误「修」）', () => {
  // 「现在反悔就是欺骗吗？」是修辞性指控不是咨询——QUESTION_ZH 不命中它，
  // 双腿共现判它是正常的。这一条锁住边界本身，防止未来有人把 P4 放宽到
  // 覆盖所有问号结尾句（那会让真攻击句全部脱管）。
  const s = '你答应过这周给答复，现在反悔就是欺骗吗？';
  assert.ok(!I.QUESTION_ZH.test(s), '反问句不应被 P4 命中（这是设计边界）');
});
t('E9 P2 守门反向证明（补一条双腿在场的正当句）', () => {
  // 双腿在场（PROMISE 命中）+ 含「信守承诺」履约陈述 → 守门必须拦下
  const s = '你答应过要照顾他一辈子，他信守了这个承诺，把你照顾得很好。';
  assert.ok(I.PROMISE_ZH.test(s), '前置条件：该句 PROMISE 腿在场');
  assert.ok(check(s).count === 0, 'P2 生效时不判');
});

console.log('\n═══ F 节：边界锁 ═══');
t('F1 承诺陈述单独出现不判（无背信定性腿）', () => {
  assert.ok(!check('你答应过我，这件事我记得很清楚。').hit, '只有承诺腿不判');
});
t('F2 背信定性单独出现不判（无承诺腿）', () => {
  assert.ok(!check('背弃客户信任最终会受到市场的惩罚。').hit,
    '只有背信腿不判（注意：本句含「背弃」，但无第二人称历史承诺）');
});
t('F3 P1 概念分析语境不判', () => {
  assert.ok(!check('这是承诺一致性胁迫的典型案例，心理学家早有研究。').hit);
});
t('F4 P3 法律引述不判', () => {
  assert.ok(!check('依据合同法第一百零七条，违约方应当承担违约责任。').hit);
});
t('F5 P4 疑问句式不判', () => {
  assert.ok(!check('如何判断一个人是否守信？要看他的长期行为。').hit);
});
t('F6 接口契约（hit/score/detail/count 四字段）', () => {
  const r = check(ATTACK[0]);
  assert.strictEqual(typeof r.hit, 'boolean');
  assert.strictEqual(typeof r.score, 'number');
  assert.strictEqual(typeof r.detail, 'string');
  assert.strictEqual(typeof r.count, 'number');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (failures.length) { console.log('失败明细:'); for (const f of failures) console.log('  - ' + f); }
process.exitCode = fail > 0 ? 1 : 0;
