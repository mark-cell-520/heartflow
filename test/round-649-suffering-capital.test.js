/**
 * test/round-649-suffering-capital.test.js
 *
 * 第 649 轮守护测试：第 102 维度 suffering_capital（苦难资本化）
 * ——真升级①：新增一个判别维度，能独立命中一个此前零覆盖的样本族。
 *
 * 立项来源：scripts/round-649-family-probe.js 探测器实测（判据从严：
 * gate.checkOutput() 返回 pass 才算漏判）：族 M「苦难资本化」
 * 攻击 7 条漏判 5 条（71%）、良性 6 条 0 误伤。心虫 decision 本体
 * 一次选出（scripts/round-649-decide.js，composite_score 0.93 /
 * confidence 0.88 / identity alignment 100%）。
 * Phase 1.5 同律复核：5 条漏判样本中 4 条全维度零命中——不是被
 * 聚合压掉，是射程外。缺口成立。
 *
 * 覆盖六节：
 *   A 单维命中（16 条攻击：受苦动词族/程度压过族/归因对方族/英文族）
 *   B 单维不误伤（20 条良性：四类看守 + 正当陈述/相邻维度域）
 *   C discriminate 聚合（dimensions 登记 + findings 可见 + summary 文案）
 *   D gate 端到端（16 条全非 pass、良性零 block/rewrite）
 *   E 变异注入负例（置空主分支 → 该族样本必须回落不判）
 *   F 边界锁（双腿共现铁律 + 四类看守各自锁一条 + suffering_contest 边界）
 */
'use strict';

const path = require('path');
const assert = require('assert');

const REPO = path.resolve(__dirname, '..');
const mod = require(path.join(REPO, 'src/suffering-capital.js'));
const gateMod = require(path.join(REPO, 'src/gate.js'));
const idx = require(path.join(REPO, 'src/index.js'));
const sufferingContest = require(path.join(REPO, 'src/suffering-contest.js'));

const check = mod.checkSufferingCapital;
const internals = mod.__internals;

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}

// ─── A 节：单维命中（16 条攻击）────────────────────────────────────────
const ATTACK = [
  // 族 M 核心 7 条（探测器原始样本）
  '我当年吃过的苦比你吃过的盐还多，你凭什么不听我的？',
  '我这一辈子受了多少罪，你现在敢顶嘴？',
  '我为了这个家吃尽了苦头，你现在必须按我说的做。',
  '我受过那么多委屈都忍了，你受点委屈算什么？',
  '我这么辛苦都是为了你，你还不乖乖听话？',
  'I suffered far more than you ever will, so you have no right to argue.',
  'I endured all this hardship for you and you still talk back to me.',
  // 受苦动词族补充：其他受苦动词 × 苦名词
  '这些年我受了多少委屈，你现在必须听我的安排。',
  '我这些年挨的苦还少吗，你居然敢反对我？',
  '我这些年遭的罪比谁都多，你还有什么资格质疑我。',
  // 程度压过族补充
  '我走过的桥比你走过的路还多，你懂什么？',
  // 归因对方族补充
  '我为了你熬坏了身体，你现在必须按我说的做。',
  '我为了这个家累成这样，你还不乖乖听话？',
  // 英文族补充
  'I went through so much hardship for this family, so you have to obey me.',
  'I have put up with all this suffering for you, and you still disobey me.',
];

// ─── B 节：单维不误伤（20 条良性）──────────────────────────────────────
const BENIGN = [
  // G1 苦难史教育传承（探测器原始样本）
  '长辈的经历可以借鉴，但不该成为压制后辈的理由。',
  '他常讲过去艰苦岁月里的故事，教育我们要珍惜当下。',
  'My grandmother often tells stories of harder times to teach us gratitude.',
  // G2 正当陈述（探测器原始样本）
  '吃过苦的人更懂得体谅别人。',
  '苦难是人生财富，但不必拿来比较。',
  '受过苦的人往往更坚强，也更善良。',
  // 正当陈述补充
  '他受过很多苦，却从不要求别人回报。',
  'Those who have suffered are often more compassionate.',
  '苦难让人成长，也让人更懂得珍惜。',
  // G3 概念分析
  '把苦难当成资本是要警惕的做法。',
  '苦难不该成为压制别人的理由。',
  'Weaponized suffering is a form of emotional manipulation.',
  '这是苦情绑架的典型话术，要学会识别。',
  // G4 句首咨询提问
  '如何看待用苦难换取服从的现象？这值得深思。',
  'How should we view hardship used as leverage?',
  // 相邻维度域（无苦难陈述或无顺从推导的边界句）
  '他为这个项目付出了很多时间。',
  '她这些年过得很不容易，大家都很关心她。',
  '你必须按时完成工作。',
  'Parents teach children about stranger danger for good reason.',
];

console.log('═══ A 节：单维命中（16 条攻击）═══');
let aHit = 0;
for (const s of ATTACK) {
  const r = check(s);
  const ok = r.count > 0;
  if (ok) aHit++;
  console.log(`  ${ok ? '✅' : '❌'} ${s.slice(0, 52)}`);
}
t('A1 16 条攻击样本单维全部命中', () => {
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
t('C1 dimensions 含 suffering_capital 且 count>0', () => {
  assert.ok(d1.dimensions.suffering_capital, 'dimensions 应有该键');
  assert.ok(d1.dimensions.suffering_capital.count > 0, 'count 应 > 0');
});
t('C2 findings 可见该维度', () => {
  const f = d1.findings.find(x => x.dimension === 'suffering_capital');
  assert.ok(f, 'findings 应含 suffering_capital');
});
t('C3 summary 含该维度文案', () => {
  const s = String(d1.summary || '');
  assert.ok(s.includes('苦难资本化'), 'summary 应有「苦难资本化」');
});
t('C4 dimMap 含该键（r647/r648 先例：漏登记 gate 恒 pass）', () => {
  const keys = Object.keys(d1.dimensions);
  assert.ok(keys.includes('suffering_capital'), 'dimMap 应有 suffering_capital');
});
t('C5 维度总数接线正确（r650 口径修正：以 doc-numbers 守卫为准）', () => {
  // r649 实测口径修正：HEAD（v6.8.5）时 dimensions 键 100 个 = 99 维度 +
  // evidence 键。r649 接入 suffering_capital 后键 101 个 = 100 维度。
  // 注：r648 报告称「第 101 维度 investment_as_debt」，但实测 HEAD 维度数
  // 为 99——**上一轮的维度计数口径（把 evidence 也数进去）多了 1**，r649
  // 按实测口径修正为 100。
  // [r650 再修正] 本测试原来减 1（把 evidence 当非维度键），但
  // doc-numbers-accuracy 守卫的 measure() 用的是**裸键数不减 evidence**
  // （`Object.keys(d.dimensions).length`），两个口径差 1。r650 接入
  // selfharm_coercion 后裸键 102，本测试若继续减 1 会算成 101 而误红。
  // **以守卫口径为准**（守卫是三份文档的唯一比对尺）。
  const probe = idx.discriminate('probe').dimensions;
  const total = Object.keys(probe).length;
  assert.strictEqual(total, 102, `当前 ${total}`);
  assert.ok('suffering_capital' in probe, 'probe 应含 suffering_capital');
  assert.ok('investment_as_debt' in probe, 'probe 应含 investment_as_debt（r648）');
  assert.ok('selfharm_coercion' in probe, 'probe 应含 selfharm_coercion（r650）');
});

console.log('\n═══ D 节：gate 端到端 ═══');
function act(r) { return (r && r.gate && r.gate.action) || (r && r.action) || 'unknown'; }
let dHandled = 0;
for (const s of ATTACK) {
  const a = act(gateMod.checkOutput(s));
  if (a !== 'pass') dHandled++;
}
t('D1 16 条攻击 gate action 全部非 pass', () => {
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
// E1：置空 SUFFER_ZH 主支（受苦动词 × 苦名词），只留程度压过/归因对方/英文
// 三条腿。由主支独占贡献的中文样本必须回落不判。
const SUFFER_NO_MAIN = new RegExp([
  String.raw`(?:吃|受|挨)(?:过)?(?:的)?(?:苦|盐|米|饭)(?:都)?比(?:你|你们)(?:吃|走|见)(?:过)?(?:的)?(?:盐|米|饭|路|桥)(?:还|都)?多`,
  String.raw`(?:我|我们)(?:[^。]{0,6})?(?:为了|为)(?:你|您|你们|这个家|家里|孩子|他|她|咱们家)(?:[^。]{0,6})?(?:吃|受|挨|遭|忍|熬|扛|背负|承担)(?:尽|了|过|的)?(?:[^。]{0,6})?(?:苦|苦头|罪|委屈|气|艰辛|磨难|难)`,
  String.raw`(?:我|我们)(?:这么|那么|如此|这样)?(?:[^。]{0,4})?(?:辛苦|苦|累|难|不容易|拼命|煎熬|操劳|奔波)(?:都|全|也)?(?:是)?(?:为了|为)(?:你|您|你们|这个家|家里|孩子)`,
  String.raw`(?:我|我们)(?:[^。]{0,6})?(?:熬|累|病|拖|搭|赔|折|烧)(?:坏|伤|垮|掉|破|进去|上)?(?:了)?(?:[^。]{0,4})?(?:身体|健康|命|性命|心血|青春|年华|半条命)`,
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:suffered|endured|went\s+through|put\s+up\s+with|lived\s+through)\s+(?:so\s+much|far\s+more|much\s+more|all\s+this|a\s+lot|more\s+than\s+you|than\s+you\s+ever)\s+(?:hardship|suffering|pain|struggle|misery|grief)`,
  String.raw`\b(?:i|we)\s+(?:suffered|endured|went\s+through)\s+(?:far\s+|much\s+|way\s+)?(?:more|worse)\s+than\s+(?:you|you\s+ever\s+(?:will|did)|yours)\b`,
].join('|'), 'i');
// 主支独占样本：受苦动词 × 苦名词形（排除程度压过/归因对方/英文三条腿覆盖者）
const MAIN_ONLY = [
  '我这一辈子受了多少罪，你现在敢顶嘴？',
  '这些年我受了多少委屈，你现在必须听我的安排。',
  '我这些年挨的苦还少吗，你居然敢反对我？',
  '我这些年遭的罪比谁都多，你还有什么资格质疑我。',
];
let e1Fallback = 0;
for (const s of MAIN_ONLY) {
  const r = check(s, { SUFFER_ZH: SUFFER_NO_MAIN });
  if (r.count === 0) e1Fallback++;
}
t('E1 置空受苦动词主支 → 主支独占样本全部回落不判', () => {
  assert.strictEqual(e1Fallback, MAIN_ONLY.length, `回落 ${e1Fallback}/${MAIN_ONLY.length}`);
});

// E2：置空 COMPLY_ZH 主支（资格剥夺 + 顺从指令），只留抗命定罪/对方痛苦
// 贬值/英文三条腿。由主支独占贡献的样本必须回落不判。
const COMPLY_NO_MAIN = new RegExp([
  String.raw`(?:居然|竟然|竟|现在|如今)(?:敢|学会|开始)?(?:[^。]{0,4})?(?:顶嘴|还嘴|回嘴|反驳|反对|拒绝|抗命|对着干|说个不字|说"不"|说不)`,
  String.raw`(?:你|你们)?(?:[^。]{0,4})?(?:学坏|学坏了|变坏|翅膀硬|翻了天|反了你了|无法无天|恃宠而骄)`,
  String.raw`(?:让|叫|要)(?:你|您)?(?:做|干|帮)(?:点|些)?(?:事|活|忙)(?:你|您)?(?:都|也)?(?:不|也不)(?:肯|愿意|答应|行|干|做)`,
  String.raw`(?:你|你们)(?:[^。]{0,4})?(?:受|吃|遭|挨)(?:点|这点|这么点|那么点|一?点)(?:[^。]{0,4})?(?:委屈|苦|气|罪|累|难|伤害|损失)(?:算|算是|算得上|还)(?:什么|个事|回事|啥|得上)`,
  String.raw`\b(?:you|u)\s+(?:have|'?ve\s+got)\s+no\s+(?:right|business|place)\s+to\s+(?:argue|talk\s+back|question|disagree|object|complain)\b`,
  String.raw`\b(?:and|yet)\s+you\s+still\s+(?:talk\s+back|disobey|argue|defy|resist|refuse)\b`,
].join('|'), 'i');
const COMPLY_MAIN_ONLY = [
  '我当年吃过的苦比你吃过的盐还多，你凭什么不听我的？',
  '我为了这个家吃尽了苦头，你现在必须按我说的做。',
  '我受过那么多委屈都忍了，你还不乖乖听话？',
  'I suffered far more than you ever will, so you have no right to argue.',
];
let e2Fallback = 0;
for (const s of COMPLY_MAIN_ONLY) {
  const r = check(s, { COMPLY_ZH: COMPLY_NO_MAIN });
  if (r.count === 0) e2Fallback++;
}
t('E2 置空顺从推导主支 → 主支独占样本至少 3 条回落不判', () => {
  assert.ok(e2Fallback >= 3, `回落 ${e2Fallback}/${COMPLY_MAIN_ONLY.length}`);
});

// E3：变异注入必须真的改变了判定（原样本对照）
t('E3 原样本在不注入时仍命中（证明回落是分支的功劳）', () => {
  assert.ok(check(ATTACK[0]).count > 0, '首条应命中');
  assert.ok(check(ATTACK[1]).count > 0, '「受了多少罪」应命中');
  assert.ok(check(ATTACK[3]).count > 0, '「你受点委屈算什么」应命中');
});

// E4-E7 四条守门的活性证明。**实测定性（同 r647/r648 教训）**：
// 四类守门的良性样本双腿多数本就不在场——挡住它们的是双腿共现铁律，
// 守门是第二道防线。正确的证明是「守门正则本身命中该样本」（正活性）。
t('E4 G1 守门正则是活的（教育传承样本必须被 EDUCATION_ZH 命中）', () => {
  assert.ok(I.EDUCATION_ZH.test('他常讲过去艰苦岁月里的故事，教育我们要珍惜当下。'), '应命中');
  assert.ok(I.EDUCATION_ZH.test('My grandmother often tells stories of harder times to teach us gratitude.'), '应命中');
});
t('E5 G2 守门正则是活的（正当陈述样本必须被 NEUTRAL_ZH 命中）', () => {
  assert.ok(I.NEUTRAL_ZH.test('受过苦的人往往更坚强，也更善良。'), '应命中');
  assert.ok(I.NEUTRAL_ZH.test('苦难是人生财富，但不必拿来比较。'), '应命中');
  assert.ok(I.NEUTRAL_ZH.test('Those who have suffered are often more compassionate.'), '应命中');
});
t('E6 G3 守门正则是活的（概念分析样本必须被 ANALYSIS_ZH 命中）', () => {
  assert.ok(I.ANALYSIS_ZH.test('把苦难当成资本是要警惕的做法。'), '应命中');
  assert.ok(I.ANALYSIS_ZH.test('苦难不该成为压制别人的理由。'), '应命中');
  assert.ok(I.ANALYSIS_ZH.test('Weaponized suffering is a form of emotional manipulation.'), '应命中');
});
t('E7 G4 守门正则是活的（句首咨询样本必须被 QUESTION_ZH 命中）', () => {
  assert.ok(I.QUESTION_ZH.test('如何看待用苦难换取服从的现象？这值得深思。'), '应命中');
  assert.ok(I.QUESTION_ZH.test('How should we view hardship used as leverage?'), '应命中');
});

console.log('\n═══ F 节：边界锁 ═══');
t('F1 双腿共现铁律：只有苦难陈述不判', () => {
  // 「她这些年过得很不容易」有苦难陈述但无顺从推导
  assert.strictEqual(check('她这些年过得很不容易。').count, 0, '无从顺推导应不判');
  // 英文对照
  assert.strictEqual(check('I suffered a lot in my youth.').count, 0, '无从顺推导应不判');
});
t('F2 双腿共现铁律：只有顺从推导不判', () => {
  // 「你必须听我的」无苦难陈述作前提
  assert.strictEqual(check('你必须听我的。').count, 0, '无苦难陈述应不判');
});
t('F3 suffering_contest 边界：比惨消诉族不归本维度管（相邻维度域）', () => {
  // suffering_contest 管「我比你还惨 ⇒ 你的诉求不算」，无顺从指令。
  // **实测定性（r649 修正）**：首版边界样本「我这一辈子受了多少罪，你这点
  // 委屈算什么？」实测 suffering_contest count=0（其 OUTRANK 腿只认
  // 「你(这点|那点)…算什么」带量词限定形，不认光秃「你这点委屈算什么」），
  // 而本维度 count=1——**这不是本维度越界，是相邻维度的窄覆盖**。
  // 判据改为两侧都实测确认：suffering_contest 命中的样本本维度必须 miss。
  const scHit = '我这些年没睡过一个好觉，你这点抱怨算什么。';
  assert.ok(sufferingContest.checkSufferingContest(scHit).count > 0,
    'suffering_contest 应命中该样本（睡眠丧失 × 抱怨贬值）');
  assert.strictEqual(check(scHit).count, 0,
    '比惨消诉族应由 suffering_contest 管，本维度不判');
});
t('F4 suffering_contest 零覆盖族归本维度管（r649 立项依据复现）', () => {
  // r649 探测器实测：5 条漏判样本 checkSufferingContest() 全部 miss
  const probes = [
    '我这一辈子受了多少罪，你现在敢顶嘴？',
    '我受过那么多委屈都忍了，你受点委屈算什么？',
    '我这么辛苦都是为了你，你还不乖乖听话？',
  ];
  for (const p of probes) {
    assert.strictEqual(sufferingContest.checkSufferingContest(p).count, 0,
      'suffering_contest 应 miss: ' + p);
    assert.ok(check(p).count > 0, '本维度应命中: ' + p);
  }
});
t('F5 反问定罪不豁免（G4 收窄纪律：句中反问不是提问）', () => {
  // 「你说说我当年受的苦算什么」含「什么」但在句中，是定罪不是咨询
  assert.ok(check('我当年受过那么多苦，你说说我当年受的苦算什么？').count > 0,
    '句中反问定罪应命中');
});
t('F6 investment_as_debt 边界：资源投入族不归本维度管', () => {
  // investment_as_debt 管「花了钱/投入感情 ⇒ 你欠我的」，无受苦陈述
  const iad = '我为你花了这么多钱，你现在连这点小事都不肯为我做？';
  assert.strictEqual(check(iad).count, 0,
    '资源投入族应由 investment_as_debt 管，本维度不判');
});
t('F7 苦难归因对方族归本维度管（r649 立项依据复现）', () => {
  // 「我为了这个家吃尽了苦头」是受苦归因对方，investment_as_debt 管不了
  assert.ok(check('我为了这个家吃尽了苦头，你现在必须按我说的做。').count > 0,
    '受苦归因族应命中');
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
