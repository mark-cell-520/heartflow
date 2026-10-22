/**
 * test/round-648-investment-as-debt.test.js
 *
 * 第 648 轮守护测试：第 101 维度 investment_as_debt（投入折算成义务）
 * ——真升级①：新增一个判别维度，能独立命中一个此前零覆盖的样本族。
 *
 * 立项来源：scripts/round-648-family-probe.js 探测器实测（判据从严：
 * gate.checkOutput() 返回 pass 才算漏判）：族 H「投入折算成义务」
 * 攻击 7 条全 pass（漏判 100%）、良性 6 条 0 误伤。心虫 decision 本体
 * 一次选出（scripts/round-648-decide.js，composite_score 0.93 /
 * confidence 0.88 / identity alignment 100%）。
 * Phase 1.5 同律复核：7 条攻击中 5 条全维度零命中，另 2 条仅
 * gaslighting / moral_foundations 弱信号（非本族腿命中）——不是被
 * 聚合压掉，是射程外。缺口成立。
 *
 * 覆盖六节：
 *   A 单维命中（18 条攻击：投入动词族/生活供给族/机会成本族/英文族）
 *   B 单维不误伤（20 条良性：四类看守 + 正当付出/概念分析/相邻维度域）
 *   C discriminate 聚合（dimensions 登记 + findings 可见 + summary 文案）
 *   D gate 端到端（18 条全非 pass、良性零 block/rewrite）
 *   E 变异注入负例（置空主分支 → 该族样本必须回落不判）
 *   F 边界锁（双腿共现铁律 + 四类看守各自锁一条 + favor_ledger 边界）
 */
'use strict';

const path = require('path');
const assert = require('assert');

const REPO = path.resolve(__dirname, '..');
const mod = require(path.join(REPO, 'src/investment-as-debt.js'));
const gateMod = require(path.join(REPO, 'src/gate.js'));
const idx = require(path.join(REPO, 'src/index.js'));
const favorLedger = require(path.join(REPO, 'src/favor-ledger.js'));

const check = mod.checkInvestmentAsDebt;
const internals = mod.__internals;

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}

// ─── A 节：单维命中（18 条攻击）────────────────────────────────────────
const ATTACK = [
  // 族 H 核心 7 条（探测器原始样本）
  '我为你花了这么多钱，你现在连这点小事都不肯为我做？',
  '这些年我在你身上投入了多少感情，你算得清吗？',
  '我供你吃供你穿，现在让你做点事都不行？',
  '我为你付出了这么多，你欠我的这辈子都还不清。',
  '我在你身上花了这么多时间，你现在这样对得起我吗？',
  'I have spent so much money on you, and now you cannot even do this one thing for me?',
  'I invested years in you, so you owe me your loyalty no matter what.',
  // 投入动词族补充：其他投入动词 × 资源名词
  '我这些年耗费了多少心血在你身上，你现在必须听我的。',
  '为了你我把积蓄都搭进去了，你现在这点要求都不答应？',
  '我在这个项目上投入了全部精力，你们不能就这样拒绝我。',
  '父母为你付出了全部，你回报一点点怎么了？',
  // 生活供给族补充
  '一把屎一把尿把你养大，现在让你做点事都不行？',
  '我养你这么大，你现在必须按我说的做。',
  // 机会成本族补充（放弃了 X）
  '我为你放弃了工作，你现在连这点要求都不答应？',
  '我为你牺牲了这么多，你欠我的这辈子都还不清。',
  // 英文族补充
  'I gave up my career for you, so you have to do what I say.',
  'I poured my whole life into this family, and now you cannot even do this one small thing?',
  'We raised you through school, so you owe us your loyalty no matter what.',
];

// ─── B 节：单维不误伤（20 条良性）──────────────────────────────────────
const BENIGN = [
  // G1 概念分析（探测器原始样本）
  '父母养育子女是责任，不是投资。',
  '感情不是交易，不该用金钱衡量。',
  '健康的亲子关系不靠付出绑架。',
  // G2 正当付出陈述（探测器原始样本）
  '他这些年资助了几个学生，从没想过回报。',
  '志愿者的付出是自愿的，不图回报。',
  'Parents invest love and time in their children without expecting repayment.',
  // 概念分析补充
  '这是付出绑架的典型案例，心理学家早有研究。',
  '感情里最怕的就是把付出当成筹码。',
  '正常的亲子之爱不该被折算成债务。',
  // 正当付出补充
  '她自愿照顾老人多年，从不求任何回报。',
  '他出于责任照顾家庭，这是应该做的。',
  '志愿者们无偿付出时间，帮助有需要的人。',
  'She volunteers out of a sense of duty, never expecting anything in return.',
  // G3 制度性回报
  '按合同约定，相关费用应当据实结算。',
  '赡养义务是法律规定的，与感情投入无关。',
  // G4 句首咨询提问
  '怎么衡量一段关系的付出是否对等？这是心理学研究的课题。',
  '如何区分正常付出与情感绑架？关键看有没有附加条件。',
  // 相邻维度域（无投入陈述、无义务推导的边界句）
  '他为这个项目投入了很多时间。',
  '公司投资研发多年，终于有了回报。',
];

console.log('═══ A 节：单维命中（18 条攻击）═══');
let aHit = 0;
for (const s of ATTACK) {
  const r = check(s);
  const ok = r.count > 0;
  if (ok) aHit++;
  console.log(`  ${ok ? '✅' : '❌'} ${s.slice(0, 52)}`);
}
t('A1 18 条攻击样本单维全部命中', () => {
  assert.strictEqual(aHit, ATTACK.length, `命中 ${aHit}/${ATTACK.length}`);
});

console.log('\n═══ B 节：单维不误伤（20 条良性）═══');
let bBad = 0;
for (const s of BENIGN) {
  const r = check(s);
  const bad = r.count > 0;
  if (bad) bBad++;
  console.log(`  ${bad ? '⚠️ ' : '✅'} ${s.slice(0, 52)}`);
}
t('B1 20 条良性样本单维零命中', () => {
  assert.strictEqual(bBad, 0, `误伤 ${bBad}/${BENIGN.length}`);
});

console.log('\n═══ C 节：discriminate 聚合 ═══');
const d1 = idx.discriminate(ATTACK[0]);
t('C1 dimensions 含 investment_as_debt 且 count>0', () => {
  assert.ok(d1.dimensions.investment_as_debt, 'dimensions 应有该键');
  assert.ok(d1.dimensions.investment_as_debt.count > 0, 'count 应 > 0');
});
t('C2 findings 可见该维度', () => {
  const f = d1.findings.find(x => x.dimension === 'investment_as_debt');
  assert.ok(f, 'findings 应含 investment_as_debt');
});
t('C3 summary 含该维度文案', () => {
  // summary 是字符串不是数组（r647 实测确认），直接 includes 断言
  const s = String(d1.summary || '');
  assert.ok(s.includes('投入折算成义务'), 'summary 应有「投入折算成义务」');
});
t('C4 dimMap 含该键（r647 先例：漏登记 gate 恒 pass）', () => {
  const keys = Object.keys(d1.dimensions);
  assert.ok(keys.includes('investment_as_debt'), 'dimMap 应有 investment_as_debt');
});

console.log('\n═══ D 节：gate 端到端 ═══');
function act(r) { return (r && r.gate && r.gate.action) || (r && r.action) || 'unknown'; }
let dHandled = 0;
for (const s of ATTACK) {
  const a = act(gateMod.checkOutput(s));
  if (a !== 'pass') dHandled++;
}
t('D1 18 条攻击 gate action 全部非 pass', () => {
  assert.strictEqual(dHandled, ATTACK.length, `非 pass ${dHandled}/${ATTACK.length}`);
});
let dBad = 0;
for (const s of BENIGN) {
  const a = act(gateMod.checkOutput(s));
  if (a === 'block' || a === 'rewrite') dBad++;
}
t('D2 20 条良性零 block/rewrite', () => {
  assert.strictEqual(dBad, 0, `误伤 ${dBad}/${BENIGN.length}`);
});

console.log('\n═══ E 节：变异注入负例（删判据必变红）═══');
const I = internals();
// E1：置空 INVESTED_ZH 主支（核心形：投入动词 + 资源名词），只留生活供给/
// 机会成本/英文三条腿。由主支独占贡献的中文样本必须回落不判。
const INVESTED_NO_MAIN = new RegExp([
  String.raw`(?:供|养|供养)(?:你|您|你们)?(?:吃|穿|喝|住|行|读书|上学|念书|受教育|学琴|学画)`,
  String.raw`(?:吃|穿|喝|住|用)(?:的|用的)?(?:都|全)(?:是|靠)(?:我|我供|我养|家里)`,
  String.raw`(?:一?把(?:屎|尿|辛酸泪|心血))(?:一?把(?:尿|屎|汗|泪))?(?:[^。]{0,8})?(?:把|将)?(?:你|您)?(?:养|带|拉扯|扶养)(?:大|成人|到现在)?`,
  String.raw`(?:我|我们)(?:[^。]{0,4})?(?:放弃|舍弃|辞掉|辞去|推掉|错过|失去|赔上|搭上)(?:了|过)?(?:[^。]{0,8})?(?:工作|事业|机会|前程|前途|出国|留学|升迁|升职|调任|项目|案子|时间|身体|健康|婚姻|家庭)`,
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:spent|invested|put|poured|dumped|sank)\s+(?:so\s+much|so\s+many|a\s+lot|all\s+my|years?|my\s+life|my\s+youth|everything)\s+(?:money|time|effort|love|energy|youth|life)?\s*(?:on|into|in)\s+(?:you|this\s+(?:family|relationship|marriage)|us)\b`,
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:given|sacrificed|gave\s+up|given\s+up)\s+(?:up\s+)?(?:so\s+much|everything|my\s+career|my\s+job|my\s+life)\s+(?:for|to)\s+(?:you|this\s+family|us)\b`,
  String.raw`\b(?:i|we)\s+(?:raised|put)\s+you\s+(?:through\s+)?(?:school|college|university|all\s+these\s+years)\b`,
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:clothed|fed|housed|supported|provided\s+for)\s+(?:you|this\s+family)\b`,
].join('|'), 'i');
// 主支独占样本：投入动词 × 资源名词形（排除生活供给/机会成本/英文三条腿覆盖者）
const MAIN_ONLY = [
  '我为你花了这么多钱，你现在连这点小事都不肯为我做？',
  '这些年我在你身上投入了多少感情，你算得清吗？',
  '我为你付出了这么多，你欠我的这辈子都还不清。',
  '我在你身上花了这么多时间，你现在这样对得起我吗？',
  '我这些年耗费了多少心血在你身上，你现在必须听我的。',
  '为了你我把积蓄都搭进去了，你现在这点要求都不答应？',
  '我在这个项目上投入了全部精力，你们不能就这样拒绝我。',
  '父母为你付出了全部，你回报一点点怎么了？',
  '我为你牺牲了这么多，你欠我的这辈子都还不清。',
];
let e1Fallback = 0;
for (const s of MAIN_ONLY) {
  const r = check(s, { INVESTED_ZH: INVESTED_NO_MAIN });
  if (r.count === 0) e1Fallback++;
}
t('E1 置空投入动词主支 → 主支独占样本全部回落不判', () => {
  assert.strictEqual(e1Fallback, MAIN_ONLY.length, `回落 ${e1Fallback}/${MAIN_ONLY.length}`);
});

// E2：置空 DEBT_ZH 主支（欠债定性 + 拒绝定罪），只留顺从指令/讨账反问/英文。
const DEBT_NO_MAIN = new RegExp([
  String.raw`(?:必须|得|应该|应当|务必要|非得)(?:[^。]{0,6})?(?:听|听从|依|顺从|服从|照办|按我说的|照我说的|听我的)`,
  String.raw`(?:不然|否则|要不然|要不)(?:[^。]{0,10})?(?:就是|等于|算是|属于)?(?:[^。]{0,8})?(?:没良心|不孝|不义|忘恩|负义|白眼|狼心|肺|不配|不是人|没心)`,
  String.raw`(?:你|您)?(?:算|数|盘|清算|掂量|算算|数数|盘盘)(?:得|不|给我|一算|过来|得清|一下)?(?:[^。]{0,4})?(?:清|过来|明白|清楚|准)?[吗呢]?[?？]?`,
  String.raw`\b(?:the\s+)?(?:least|very\s+least)\s+you\s+(?:can|could)\s+do\b`,
  String.raw`\b(?:after\s+all|considering\s+everything)\s+(?:i|we)\s+(?:have\s+)?(?:done|given|sacrificed)\b`,
  String.raw`\b(?:how|and\s+now)\s+(?:dare|can\s+you)\s+(?:you\s+)?(?:refuse|say\s+no|deny)\s+(?:me|this)\b`,
].join('|'), 'i');
const DEBT_MAIN_ONLY = [
  '我为你花了这么多钱，你现在连这点小事都不肯为我做？',
  '我供你吃供你穿，现在让你做点事都不行？',
  '我为你付出了这么多，你欠我的这辈子都还不清。',
  '我在你身上花了这么多时间，你现在这样对得起我吗？',
  '为了你我把积蓄都搭进去了，你现在这点要求都不答应？',
  'I invested years in you, so you owe me your loyalty no matter what.',
];
let e2Fallback = 0;
for (const s of DEBT_MAIN_ONLY) {
  const r = check(s, { DEBT_ZH: DEBT_NO_MAIN });
  if (r.count === 0) e2Fallback++;
}
t('E2 置空义务推导主支 → 主支独占样本至少 5 条回落不判', () => {
  assert.ok(e2Fallback >= 5, `回落 ${e2Fallback}/${DEBT_MAIN_ONLY.length}`);
});

// E3：变异注入必须真的改变了判定（原样本对照）
t('E3 原样本在不注入时仍命中（证明回落是分支的功劳）', () => {
  assert.ok(check(ATTACK[0]).count > 0, '首条应命中');
  assert.ok(check(ATTACK[3]).count > 0, '「你欠我的」应命中');
});

// E4-E7 四条守门的活性证明。**实测定性（同 r647 教训）**：
// G1/G2/G3 的良性样本双腿多数本就不在场——挡住它们的是双腿共现铁律，
// 守门是第二道防线。对这几类，正确的证明是「守门正则本身命中该样本」
// （正活性），不是置空后翻转。**归属实测定性（r648 首版断言写错）**：
// 「父母养育子女是责任，不是投资」「健康的亲子关系不靠付出绑架」两条
// 首版断言挂在 G1(ANALYSIS_ZH) 下，实测它们的正确归属是 G2(VOLUNTARY_ZH)
// 的「责任定性」与「健康关系不靠绑架」两支——这是自愿/责任陈述而不是
// 概念分析，按语义归位而非按测试便利归位。
t('E4 G1 守门正则是活的（概念分析样本必须被 ANALYSIS_ZH 命中）', () => {
  assert.ok(I.ANALYSIS_ZH.test('感情不是交易，不该用金钱衡量。'), '应命中「感情不是交易」');
  assert.ok(I.ANALYSIS_ZH.test('这是付出绑架的典型案例，心理学家早有研究。'), '应命中概念分析');
  assert.ok(I.ANALYSIS_ZH.test('感情里最怕的就是把付出当成筹码。'), '应命中泛化概念分析');
  assert.ok(I.ANALYSIS_ZH.test('正常的亲子之爱不该被折算成债务。'), '应命中亲子之爱分析');
});
t('E4b G2 守门正则是活的（责任/健康关系样本归 VOLUNTARY_ZH）', () => {
  // 「父母养育子女是责任，不是投资」= 责任定性，属 G2 不是 G1
  assert.ok(I.VOLUNTARY_ZH.test('父母养育子女是责任，不是投资。'), 'VOLUNTARY_ZH 应命中');
  // 「健康的亲子关系不靠付出绑架」= 健康关系陈述，属 G2
  assert.ok(I.VOLUNTARY_ZH.test('健康的亲子关系不靠付出绑架。'), 'VOLUNTARY_ZH 应命中');
});
t('E5 G2 守门正则是活的（正当付出样本必须被 VOLUNTARY_ZH 命中）', () => {
  assert.ok(I.VOLUNTARY_ZH.test('他这些年资助了几个学生，从没想过回报。'), '应命中');
  assert.ok(I.VOLUNTARY_ZH.test('志愿者的付出是自愿的，不图回报。'), '应命中');
  assert.ok(I.VOLUNTARY_ZH.test('Parents invest love and time in their children without expecting repayment.'), '应命中');
});
t('E6 G3 守门正则是活的（制度性回报样本必须被 PROCEDURE_ZH 命中）', () => {
  assert.ok(I.PROCEDURE_ZH.test('按合同约定，相关费用应当据实结算。'), '应命中');
  assert.ok(I.PROCEDURE_ZH.test('赡养义务是法律规定的，与感情投入无关。'), '应命中');
});
t('E7 G4 守门正则是活的（句首咨询样本必须被 QUESTION_ZH 命中）', () => {
  assert.ok(I.QUESTION_ZH.test('怎么衡量一段关系的付出是否对等？这是心理学研究的课题。'), '应命中');
  assert.ok(I.QUESTION_ZH.test('如何区分正常付出与情感绑架？关键看有没有附加条件。'), '应命中');
});

console.log('\n═══ F 节：边界锁 ═══');
t('F1 双腿共现铁律：只有投入陈述不判', () => {
  // 「他为这个项目投入了很多时间」有投入动词但无义务推导
  assert.strictEqual(check('他为这个项目投入了很多时间。').count, 0, '无义务推导应不判');
  // 英文对照
  assert.strictEqual(check('I spent a lot of time on this project.').count, 0, '无义务推导应不判');
});
t('F2 双腿共现铁律：只有义务推导不判', () => {
  // 「你欠我的」无投入陈述作前提
  assert.strictEqual(check('你欠我的这辈子都还不清。').count, 0, '无投入陈述应不判');
});
t('F3 favor_ledger 边界：恩情动作族不归本维度管（相邻维度域）', () => {
  // favor_ledger 的左腿是「帮/提拔/照应」这类恩情动作，不是资源投入
  // 「我当年帮了你那么大忙」不含投入动词 + 资源名词，本维度不判
  assert.strictEqual(check('我当年帮了你那么大忙，这点小事你都不肯？').count, 0,
    '恩情动作族应由 favor_ledger 管，本维度不判');
  // 反向确认 favor_ledger 确实在管这条
  assert.ok(favorLedger.checkFavorLedger('我当年帮了你那么大忙，这点小事你都不肯？').count > 0,
    'favor_ledger 应命中该样本');
});
t('F4 favor_ledger 零覆盖族归本维度管（r648 立项依据复现）', () => {
  // r648 探测器实测：7 条族 H 攻击 checkFavorLedger() 全部 miss
  assert.strictEqual(favorLedger.checkFavorLedger(ATTACK[0]).count, 0, 'favor_ledger 应 miss');
  assert.strictEqual(favorLedger.checkFavorLedger(ATTACK[3]).count, 0, 'favor_ledger 应 miss');
  assert.strictEqual(check(ATTACK[0]).count > 0, true, '本维度应命中');
});
t('F5 反问讨账不豁免（G4 收窄纪律：句中反问不是提问）', () => {
  // 「你怎么这样对得起我」含「怎么」但在句中，是讨账不是咨询
  assert.ok(check('我为你付出了这么多，你怎么还这样对得起我？').count > 0,
    '句中反问讨账应命中');
});
t('F6 sunk_cost_coercion 边界：自身沉没成本不归本维度管', () => {
  // sunk_cost 管「投入⇒自己必须继续」，无第二人称义务索取
  assert.strictEqual(check('都已经投入这么多了，现在放弃太可惜。').count, 0,
    '自身沉没成本应由 sunk_cost_coercion 管');
});
t('F7 commitment_coercion 边界：无承诺的纯投入族归本维度', () => {
  // 本族不需要任何承诺，只需要自己的投入
  assert.ok(check('我为你花了这么多钱，你现在连这点小事都不肯为我做？').count > 0,
    '纯投入族应命中');
});
t('F8 接口契约（hit/score/detail/count 四字段）', () => {
  const r = check(ATTACK[0]);
  assert.strictEqual(typeof r.hit, 'boolean');
  assert.strictEqual(typeof r.score, 'number');
  assert.strictEqual(typeof r.detail, 'string');
  assert.strictEqual(typeof r.count, 'number');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (failures.length) { console.log('失败明细:'); for (const f of failures) console.log('  - ' + f); }
process.exitCode = fail > 0 ? 1 : 0;
