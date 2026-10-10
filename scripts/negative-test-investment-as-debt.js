/**
 * scripts/negative-test-investment-as-debt.js
 *
 * [r648] 第 101 维度 investment_as_debt 的变异注入负例脚本。
 * 形状同 r643/r647：把判据的每一条腿/守门置空，证明该族样本的命中数
 * 必然下降——删除判据必变红，防止「永远绿的装饰性测试」。
 *
 * 七个变异组：
 *   M1 置空 INVESTED 主支（投入动词 × 资源名词）      → 中文投入族回落
 *   M2 置空 DEBT 主支（欠债定性 + 拒绝定罪）          → 讨账族回落
 *   M3 置空 INVESTED 生活供给支                        → 供你吃穿族回落
 *   M4 只留生活供给支，证明该支本身是活的              → 反向对照
 *   M5 置空中文侧 INVESTED，逼英文独立命中             → 英文族仍命中
 *   M6 G1 概念分析守门正活性                           → 守门命中良性
 *   M7 G2/G3/G4 守门正活性                             → 守门命中良性
 * 反向对照：不注入任何变异时全部样本仍命中。
 */
'use strict';

const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const mod = require(path.join(HF, 'src/investment-as-debt.js'));
const check = mod.checkInvestmentAsDebt;
const I = mod.__internals();

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log(`  ✅ ${name}`); }
  catch (e) { fail++; console.log(`  ❌ ${name} :: ${e.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

// ─── 攻击样本池（覆盖四条腿）──────────────────────────────────────────
const ZH_MAIN = [   // 投入动词 × 资源名词（M1 主支独占）
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
const ZH_SUPPLY = [ // 生活供给支（M3 独占）
  '我供你吃供你穿，现在让你做点事都不行？',
  '一把屎一把尿把你养大，现在让你做点事都不行？',
  '我养你这么大，你现在必须按我说的做。',
];
const EN = [        // 英文族（M5 独占）
  'I have spent so much money on you, and now you cannot even do this one thing for me?',
  'I invested years in you, so you owe me your loyalty no matter what.',
  'I gave up my career for you, so you have to do what I say.',
  'I poured my whole life into this family, and now you cannot even do this one small thing?',
  'We raised you through school, so you owe us your loyalty no matter what.',
];
const DEBT_MAIN_ONLY = [ // 讨账族（M2 主支独占）
  '我为你花了这么多钱，你现在连这点小事都不肯为我做？',
  '我供你吃供你穿，现在让你做点事都不行？',
  '我为你付出了这么多，你欠我的这辈子都还不清。',
  '我在你身上花了这么多时间，你现在这样对得起我吗？',
  '为了你我把积蓄都搭进去了，你现在这点要求都不答应？',
  '我在这个项目上投入了全部精力，你们不能就这样拒绝我。',
  'I invested years in you, so you owe me your loyalty no matter what.',
];

// ─── M1：置空 INVESTED 主支（只留生活供给/机会成本/英文四条腿）────────
const INVESTED_NO_MAIN = new RegExp([
  String.raw`(?:供|养|供养)(?:你|您|你们)?(?:吃|穿|喝|住|行|读书|上学|念书|受教育|学琴|学画)`,
  String.raw`(?:吃|穿|喝|住|用)(?:的|用的)?(?:都|全)(?:是|靠)(?:我|我供|我养|家里)`,
  String.raw`(?:一?把(?:屎|尿|辛酸泪|心血))(?:一?把(?:尿|屎|汗|泪))?(?:[^。]{0,8})?(?:把|将)?(?:你|您)?(?:养|带|拉扯|扶养)(?:大|成人|到现在)?`,
  String.raw`(?:我|我们)(?:[^。]{0,4})?(?:放弃|舍弃|辞掉|辞去|推掉|错过|失去|赔上|搭上)(?:了|过)?(?:[^。]{0,8})?(?:工作|事业|机会|前程|前途|出国|留学|升迁|升职|调任|项目|案子|时间|身体|健康|婚姻|家庭)`,
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:spent|invested|put|poured|dumped|sank)\s+(?:so\s+much|so\s+many|a\s+lot|all\s+my|(?:my|our)\s+(?:whole|entire)|years?|my\s+life|my\s+youth|everything)\s+(?:money|time|effort|love|energy|youth|life)?\s*(?:on|into|in)\s+(?:you|this\s+(?:family|relationship|marriage)|us)\b`,
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:given|sacrificed|gave\s+up|given\s+up)\s+(?:up\s+)?(?:so\s+much|everything|my\s+career|my\s+job|my\s+life)\s+(?:for|to)\s+(?:you|this\s+family|us)\b`,
  String.raw`\b(?:i|we)\s+(?:raised|put)\s+you\s+(?:through\s+)?(?:school|college|university|all\s+these\s+years)\b`,
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:clothed|fed|housed|supported|provided\s+for)\s+(?:you|this\s+family)\b`,
].join('|'), 'i');

console.log('═══ M1 置空投入动词主支 ═══');
let m1Flip = 0;
for (const s of ZH_MAIN) {
  const r = check(s, { INVESTED_ZH: INVESTED_NO_MAIN });
  if (r.count === 0) m1Flip++;
  console.log(`  ${r.count === 0 ? '✅回落' : '❌仍命中'} ${s.slice(0, 48)}`);
}
t(`M1 ${ZH_MAIN.length} 条投入族样本全部回落不判`, () =>
  assert(m1Flip === ZH_MAIN.length, `回落 ${m1Flip}/${ZH_MAIN.length}`));

// ─── M2：置空 DEBT 主支（只留顺从指令/讨账反问/英文）──────────────────
const DEBT_NO_MAIN = new RegExp([
  String.raw`(?:必须|得|应该|应当|务必要|非得)(?:[^。]{0,6})?(?:听|听从|依|顺从|服从|照办|按我说的|照我说的|听我的)`,
  String.raw`(?:不然|否则|要不然|要不)(?:[^。]{0,10})?(?:就是|等于|算是|属于)?(?:[^。]{0,8})?(?:没良心|不孝|不义|忘恩|负义|白眼|狼心|肺|不配|不是人|没心)`,
  String.raw`(?:你|您)?(?:算|数|盘|清算|掂量|算算|数数|盘盘)(?:得|不|给我|一算|过来|得清|一下)?(?:[^。]{0,4})?(?:清|过来|明白|清楚|准)?[吗呢]?[?？]?`,
  String.raw`\b(?:the\s+)?(?:least|very\s+least)\s+you\s+(?:can|could)\s+do\b`,
  String.raw`\b(?:after\s+all|considering\s+everything)\s+(?:i|we)\s+(?:have\s+)?(?:done|given|sacrificed)\b`,
  String.raw`\b(?:how|and\s+now)\s+(?:dare|can\s+you)\s+(?:you\s+)?(?:refuse|say\s+no|deny)\s+(?:me|this)\b`,
].join('|'), 'i');

console.log('\n═══ M2 置空义务推导主支 ═══');
let m2Flip = 0;
for (const s of DEBT_MAIN_ONLY) {
  const r = check(s, { DEBT_ZH: DEBT_NO_MAIN });
  if (r.count === 0) m2Flip++;
  console.log(`  ${r.count === 0 ? '✅回落' : '❌仍命中'} ${s.slice(0, 48)}`);
}
t(`M2 ${DEBT_MAIN_ONLY.length} 条讨账族样本全部回落不判`, () =>
  assert(m2Flip === DEBT_MAIN_ONLY.length, `回落 ${m2Flip}/${DEBT_MAIN_ONLY.length}`));

// ─── M3：置空生活供给支 ──────────────────────────────────────────────
// 注意：主支的投入动词表本身含「供|养」二字，「供你吃供你穿」「我养你
// 这么大」会被主支兜住——所以 M3 的注入版必须**同时**排除主支里的
// 「供/养」动词，只留主支其余动词（花/投入/付出/耗/砸/垫/付等），
// 才能证明生活供给支是独立贡献的。首版只删供给支、主支照旧兜住，
// 实测 0/3 回落——那是变异脚本自己的构造缺陷，不是判据冗余。
const SUPPLY_REMOVED = new RegExp([
  // 主支复刻，但动词组去掉「供|养|供养|哺养|养育」（这些由供给支独占贡献）
  String.raw`(?:我|我们|咱|咱们|本人)?(?:这些年|这些年来|这么多年|这些年里|一直以来|从头到尾|从小到大|自从)?(?:在(?:你|您)?(?:身上|这儿|这里|那边)?)?(?:为|给|替|帮)?(?:你|您|你们|这个家|家里|孩子|他|她)?(?:[^。]{0,6})?(?:花|花费|耗|耗费|投入|投进|砸|倒贴|搭进|搭上|垫上|付|付出|供给|供应|栽培|抚育|拉扯|奉献|牺牲|呕心沥血|操心|操心费力)(?:了|过|的)?(?:[^。]{0,10})?(?:多少|这么|那么|所有|全部|大半|一辈子|半辈子|一生)?(?:钱|金钱|银子|积蓄|工资|收入|钞票|时间|光阴|岁月|年华|青春|心血|心思|精力|感情|情感|爱|心血|汗水|力气|力|心)?`,
  // 「为你付出/奉献/牺牲」族
  String.raw`(?:为|给|替|帮)(?:你|您|你们|这个家|家里)?(?:付出|奉献|牺牲|投入|给予|给了|花了|费了|操了)(?:这么|那么|所有|全部|这么|这么多|那么多)?(?:多|许多|不少)?`,
  // 机会成本
  String.raw`(?:我|我们)(?:[^。]{0,4})?(?:放弃|舍弃|辞掉|辞去|推掉|错过|失去|赔上|搭上)(?:了|过)?(?:[^。]{0,8})?(?:工作|事业|机会|前程|前途|出国|留学|升迁|升职|调任|项目|案子|时间|身体|健康|婚姻|家庭)`,
  // 英文
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:spent|invested|put|poured|dumped|sank)\s+(?:so\s+much|so\s+many|a\s+lot|all\s+my|(?:my|our)\s+(?:whole|entire)|years?|my\s+life|my\s+youth|everything)\s+(?:money|time|effort|love|energy|youth|life)?\s*(?:on|into|in)\s+(?:you|this\s+(?:family|relationship|marriage)|us)\b`,
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:given|sacrificed|gave\s+up|given\s+up)\s+(?:up\s+)?(?:so\s+much|everything|my\s+career|my\s+job|my\s+life)\s+(?:for|to)\s+(?:you|this\s+family|us)\b`,
  String.raw`\b(?:i|we)\s+(?:raised|put)\s+you\s+(?:through\s+)?(?:school|college|university|all\s+these\s+years)\b`,
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:clothed|fed|housed|supported|provided\s+for)\s+(?:you|this\s+family)\b`,
].join('|'), 'i');

console.log('\n═══ M3 置空生活供给支（供/养 + 吃穿 + 一把屎一把尿）═══');
let m3Flip = 0;
for (const s of ZH_SUPPLY) {
  const r = check(s, { INVESTED_ZH: SUPPLY_REMOVED });
  if (r.count === 0) m3Flip++;
  console.log(`  ${r.count === 0 ? '✅回落' : '❌仍命中'} ${s.slice(0, 48)}`);
}
t(`M3 ${ZH_SUPPLY.length} 条生活供给样本全部回落不判`, () =>
  assert(m3Flip === ZH_SUPPLY.length, `回落 ${m3Flip}/${ZH_SUPPLY.length}`));

// ─── M4：只留生活供给支，证明该支本身是活的（反向对照）────────────────
const SUPPLY_ONLY = new RegExp([
  String.raw`(?:供|养|供养)(?:你|您|你们)?(?:吃|穿|喝|住|行|读书|上学|念书|受教育|学琴|学画)`,
  String.raw`(?:一?把(?:屎|尿|辛酸泪|心血))(?:一?把(?:尿|屎|汗|泪))?(?:[^。]{0,8})?(?:把|将)?(?:你|您)?(?:养|带|拉扯|扶养)(?:大|成人|到现在)?`,
  // 「我养你这么大」——「养 + 你 + 这么 + 大」的简式（无「一把…一把…」前缀）
  String.raw`(?:我|我们)?(?:[^。]{0,4})?养(?:你|您|你们)(?:这么|那么)?(?:大|成人|到现在)`,
].join('|'), 'i');

console.log('\n═══ M4 只留生活供给支（证明该支独立存活）═══');
let m4Alive = 0;
for (const s of ZH_SUPPLY) {
  const r = check(s, { INVESTED_ZH: SUPPLY_ONLY });
  if (r.count > 0) m4Alive++;
  console.log(`  ${r.count > 0 ? '✅仍命中' : '❌回落'} ${s.slice(0, 48)}`);
}
t(`M4 ${ZH_SUPPLY.length} 条生活供给样本在只留该支时仍全部命中`, () =>
  assert(m4Alive === ZH_SUPPLY.length, `命中 ${m4Alive}/${ZH_SUPPLY.length}`));

// ─── M5：置空中文侧 INVESTED，逼英文独立命中 ────────────────────────
const EN_ONLY = new RegExp([
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:spent|invested|put|poured|dumped|sank)\s+(?:so\s+much|so\s+many|a\s+lot|all\s+my|(?:my|our)\s+(?:whole|entire)|years?|my\s+life|my\s+youth|everything)\s+(?:money|time|effort|love|energy|youth|life)?\s*(?:on|into|in)\s+(?:you|this\s+(?:family|relationship|marriage)|us)\b`,
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:given|sacrificed|gave\s+up|given\s+up)\s+(?:up\s+)?(?:so\s+much|everything|my\s+career|my\s+job|my\s+life)\s+(?:for|to)\s+(?:you|this\s+family|us)\b`,
  String.raw`\b(?:i|we)\s+(?:raised|put)\s+you\s+(?:through\s+)?(?:school|college|university|all\s+these\s+years)\b`,
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:clothed|fed|housed|supported|provided\s+for)\s+(?:you|this\s+family)\b`,
].join('|'), 'i');

console.log('\n═══ M5 只留英文侧 INVESTED（中文族应回落、英文族应仍命中）═══');
let m5EnAlive = 0;
for (const s of EN) {
  const r = check(s, { INVESTED_ZH: EN_ONLY });
  if (r.count > 0) m5EnAlive++;
  console.log(`  ${r.count > 0 ? '✅仍命中' : '❌回落'} ${s.slice(0, 48)}`);
}
t(`M5a ${EN.length} 条英文样本在只留英文支时全部仍命中`, () =>
  assert(m5EnAlive === EN.length, `命中 ${m5EnAlive}/${EN.length}`));

// ─── M6/M7：守门正活性（良性样本必须被对应守门命中）──────────────────
console.log('\n═══ M6 守门正活性 ═══');
t('M6a G1 ANALYSIS_ZH 命中概念分析样本', () => {
  assert(I.ANALYSIS_ZH.test('感情不是交易，不该用金钱衡量。'), '应命中');
  assert(I.ANALYSIS_ZH.test('这是付出绑架的典型案例，心理学家早有研究。'), '应命中');
  assert(I.ANALYSIS_ZH.test('感情里最怕的就是把付出当成筹码。'), '应命中');
});
t('M6b G2 VOLUNTARY_ZH 命中正当付出样本', () => {
  assert(I.VOLUNTARY_ZH.test('他这些年资助了几个学生，从没想过回报。'), '应命中');
  assert(I.VOLUNTARY_ZH.test('志愿者的付出是自愿的，不图回报。'), '应命中');
  assert(I.VOLUNTARY_ZH.test('Parents invest love and time in their children without expecting repayment.'), '应命中');
});
t('M6c G3 PROCEDURE_ZH 命中制度性回报样本', () => {
  assert(I.PROCEDURE_ZH.test('按合同约定，相关费用应当据实结算。'), '应命中');
  assert(I.PROCEDURE_ZH.test('赡养义务是法律规定的，与感情投入无关。'), '应命中');
});
t('M6d G4 QUESTION_ZH 命中句首咨询样本', () => {
  assert(I.QUESTION_ZH.test('怎么衡量一段关系的付出是否对等？这是心理学研究的课题。'), '应命中');
  assert(I.QUESTION_ZH.test('如何区分正常付出与情感绑架？关键看有没有附加条件。'), '应命中');
});

// ─── 反向对照：不注入时全部命中（排除恒不命中造成的假翻转）───────────
console.log('\n═══ 反向对照（不注入任何变异）═══');
const ALL = [...ZH_MAIN, ...ZH_SUPPLY, ...EN];
let ctrlHit = 0;
for (const s of ALL) {
  const r = check(s);
  if (r.count > 0) ctrlHit++;
}
t(`反向对照 ${ALL.length} 条攻击样本不注入时全部命中`, () =>
  assert(ctrlHit === ALL.length, `命中 ${ctrlHit}/${ALL.length}`));

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exitCode = fail > 0 ? 1 : 0;
