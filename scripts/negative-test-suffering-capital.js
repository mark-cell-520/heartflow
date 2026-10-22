/**
 * scripts/negative-test-suffering-capital.js
 *
 * [r649] 第 102 维度 suffering_capital 的变异注入负例脚本。
 * 形状同 r643/r647/r648：把判据的每一条腿/守门置空，证明该族样本的
 * 命中数必然下降——删除判据必变红，防止「永远绿的装饰性测试」。
 *
 * 七个变异组：
 *   M1 置空 SUFFER 主支（受苦动词 × 苦名词）        → 受苦族回落
 *   M2 置空 COMPLY 主支（资格剥夺 + 顺从指令）       → 资格剥夺族回落
 *   M3 置空程度压过支                                → 比苦族回落
 *   M4 只留程度压过支，证明该支本身是活的            → 反向对照
 *   M5 只留英文侧，逼英文独立命中                    → 英文族仍命中
 *   M6 G1/G2/G3/G4 守门正活性                        → 守门命中良性
 * 反向对照：不注入任何变异时全部样本仍命中。
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const HF = __HF;
const mod = require(path.join(HF, 'src/suffering-capital.js'));
const check = mod.checkSufferingCapital;
const I = mod.__internals();

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log(`  ✅ ${name}`); }
  catch (e) { fail++; console.log(`  ❌ ${name} :: ${e.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

// ─── 攻击样本池（覆盖各条腿）─────────────────────────────────────────
const ZH_MAIN = [   // 受苦动词 × 苦名词（M1 主支独占）
  '我这一辈子受了多少罪，你现在敢顶嘴？',
  '这些年我受了多少委屈，你现在必须听我的安排。',
  '我这些年挨的苦还少吗，你居然敢反对我？',
  '我这些年遭的罪比谁都多，你还有什么资格质疑我。',
  '我当年受过那么多苦，你说说我当年受的苦算什么？',
];
const ZH_COMPARE = [ // 程度压过支（M3 独占）
  '我当年吃过的苦比你吃过的盐还多，你凭什么不听我的？',
  '我走过的桥比你走过的路还多，你懂什么？',
];
const ZH_ATTRIB = [ // 归因对方支（M2 左腿之一）
  '我为了这个家吃尽了苦头，你现在必须按我说的做。',
  '我为了你熬坏了身体，你现在必须按我说的做。',
  '我为了这个家累成这样，你还不乖乖听话？',
];
const EN = [        // 英文族（M5 独占）
  'I suffered far more than you ever will, so you have no right to argue.',
  'I endured all this hardship for you and you still talk back to me.',
  'I went through so much hardship for this family, so you have to obey me.',
  'I have put up with all this suffering for you, and you still disobey me.',
];
const COMPLY_MAIN_ONLY = [ // 资格剥夺/顺从指令族（M2 右腿主支独占）
  '我当年吃过的苦比你吃过的盐还多，你凭什么不听我的？',
  '我为了这个家吃尽了苦头，你现在必须按我说的做。',
  '我这些年受了多少委屈，你现在必须听我的安排。',
  'I suffered far more than you ever will, so you have no right to argue.',
];

// ─── M1：置空 SUFFER 主支（只留程度压过/归因对方/代价/英文四条腿）──────
const SUFFER_NO_MAIN = new RegExp([
  String.raw`(?:吃|受|挨|走|看|过)(?:过)?(?:的)?(?:苦|盐|米|饭|路|桥)(?:都)?比(?:你|你们)(?:吃|走|见|过)(?:过)?(?:的)?(?:盐|米|饭|路|桥)(?:还|都)?多`,
  String.raw`(?:我|我们)(?:[^。]{0,6})?(?:为了|为)(?:你|您|你们|这个家|家里|孩子|他|她|咱们家)(?:[^。]{0,6})?(?:吃|受|挨|遭|忍|熬|扛|背负|承担)(?:尽|了|过|的)?(?:[^。]{0,6})?(?:苦|苦头|罪|委屈|气|艰辛|磨难|难)`,
  String.raw`(?:我|我们)(?:这么|那么|如此|这样)?(?:[^。]{0,4})?(?:辛苦|苦|累|难|不容易|拼命|煎熬|操劳|奔波)(?:[^。]{0,2})?(?:都|全|也)?(?:是)?(?:为了|为)(?:你|您|你们|这个家|家里|孩子)`,
  String.raw`(?:我|我们)(?:[^。]{0,6})?(?:累|苦|熬|撑|扛|受)(?:成|到)(?:[^。]{0,2})?(?:这样|这样了|这个样|这副样子|这样一副|这个地步|这般|如此)`,
  String.raw`(?:我|我们)(?:[^。]{0,6})?(?:熬|累|病|拖|搭|赔|折|烧)(?:坏|伤|垮|掉|破|进去|上)?(?:了)?(?:[^。]{0,4})?(?:身体|健康|命|性命|心血|青春|年华|半条命)`,
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:suffered|endured|went\s+through|put\s+up\s+with|lived\s+through)\s+(?:so\s+much|far\s+more|much\s+more|all\s+this|a\s+lot|more\s+than\s+you|than\s+you\s+ever)\s+(?:hardship|suffering|pain|struggle|misery|grief)`,
  String.raw`\b(?:i|we)\s+(?:suffered|endured|went\s+through)\s+(?:so\s+much|all\s+this)\s+(?:hardship|suffering|pain)\s+(?:for|to\s+(?:raise|support|provide\s+for))\s+(?:you|this\s+family|us)\b`,
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:put\s+up\s+with|tolerated|swallowed|borne)\s+(?:so\s+much|all\s+this|more\s+than)\s+(?:for|from)\s+(?:you|this\s+family|them)\b`,
  String.raw`\b(?:i|we)\s+(?:suffered|endured|sacrificed|went\s+through)\s+(?:far\s+|much\s+|way\s+)?(?:more|worse)\s+than\s+(?:you|you\s+ever\s+(?:will|did)|yours)\b`,
].join('|'), 'i');

console.log('═══ M1 置空受苦动词主支 ═══');
let m1Flip = 0;
for (const s of ZH_MAIN) {
  const r = check(s, { SUFFER_ZH: SUFFER_NO_MAIN });
  if (r.count === 0) m1Flip++;
  console.log(`  ${r.count === 0 ? '✅回落' : '❌仍命中'} ${s.slice(0, 48)}`);
}
t(`M1 ${ZH_MAIN.length} 条受苦族样本全部回落不判`, () =>
  assert(m1Flip === ZH_MAIN.length, `回落 ${m1Flip}/${ZH_MAIN.length}`));

// ─── M2：置空 COMPLY 主支（只留抗命定罪/对方痛苦贬值/英文三条腿）──────
const COMPLY_NO_MAIN = new RegExp([
  String.raw`(?:居然|竟然|竟|现在|如今)(?:敢|学会|开始)?(?:[^。]{0,4})?(?:顶嘴|还嘴|回嘴|反驳|反对|拒绝|抗命|对着干|说个不字|说"不"|说不)`,
  String.raw`(?:你|你们)?(?:[^。]{0,4})?(?:学坏|学坏了|变坏|翅膀硬|翻了天|反了你了|无法无天|恃宠而骄)`,
  String.raw`(?:让|叫|要)(?:你|您)?(?:做|干|帮)(?:点|些)?(?:事|活|忙)(?:你|您)?(?:都|也)?(?:不|也不)(?:肯|愿意|答应|行|干|做)`,
  String.raw`(?:你|你们)(?:[^。]{0,4})?(?:受|吃|遭|挨)(?:点|这点|这么点|那么点|一?点)(?:[^。]{0,4})?(?:委屈|苦|气|罪|累|难|伤害|损失)(?:算|算是|算得上|还)(?:什么|个事|回事|啥|得上)`,
  String.raw`(?:你|你们)(?:这点|这么点|那点)(?:[^。]{0,4})?(?:委屈|苦|气|罪|事|损失|伤害|抱怨)(?:算|算是|算得上)(?:什么|个事|回事|啥)`,
  String.raw`(?:受|吃|挨|遭)(?:的|过)?(?:[^。]{0,4})?(?:苦|罪|委屈|磨难|艰辛)(?:算|算是|算得上)(?:什么|个事|回事|啥)`,
  String.raw`\b(?:you|u)\s+(?:have|'?ve\s+got)\s+no\s+(?:right|business|place)\s+to\s+(?:argue|talk\s+back|question|disagree|object|complain)\b`,
  String.raw`\b(?:and|yet)\s+you\s+still\s+(?:talk\s+back|disobey|argue|defy|resist|refuse)\b`,
].join('|'), 'i');

console.log('\n═══ M2 置空顺从推导主支 ═══');
// 注：M2 只注入中文侧 COMPLY_ZH，英文样本由英文右腿独立命中（M5 已证明），
// 故 M2 断言范围取中文样本 3 条；英文样本的右腿翻转由 M5b 的反向对照覆盖。
let m2Flip = 0;
const M2_ZH = COMPLY_MAIN_ONLY.filter(s => !/^[A-Z]/.test(s));
for (const s of M2_ZH) {
  const r = check(s, { COMPLY_ZH: COMPLY_NO_MAIN });
  if (r.count === 0) m2Flip++;
  console.log(`  ${r.count === 0 ? '✅回落' : '❌仍命中'} ${s.slice(0, 48)}`);
}
t(`M2 ${M2_ZH.length} 条资格剥夺族中文样本全部回落不判`, () =>
  assert(m2Flip === M2_ZH.length, `回落 ${m2Flip}/${M2_ZH.length}`));

// ─── M3：置空程度压过支（只留主支/归因对方/代价/英文）─────────────────
// 注意：主支的受苦动词组含「吃|受|挨」且容许「[^。]{0,6}」插入，
// 「我当年吃过的苦比你吃过的盐还多」可能被主支兜住——所以 M3 的注入版
// 把主支复刻一份但去掉「比…多」比较结构（在主支尾部加负向断言不现实，
// 改为直接从主支中删去「吃|受|挨」三个动词，逼程度压过支独占贡献）。
const SUFFER_NO_COMPARE = new RegExp([
  // 主支复刻，动词组去掉「吃|受|挨」（这三个由程度压过支独占贡献）
  String.raw`(?:我|我们|咱|咱们)(?:当年|当初|这些年|这些年来|这些年里|这么多年|这一辈子|这辈子|这一生|前半生|半辈子|从小|从小到大|一直以来|多年以来|早年间|年轻的时候)?(?:[^。]{0,6})?(?:遭|忍|熬|历|经历|承受|背负)(?:过|了|的|尽)?(?:[^。]{0,6})?(?:多少|这么|那么|所有|那么多|这么多|无数的?|一生的?|半辈子的?)?(?:苦|苦难|苦头|苦楚|罪|委屈|气|艰辛|磨难|折磨|难处|酸楚|屈辱)`,
  // 尽字完成态（动词组同样去掉吃|受|挨）
  String.raw`(?:遭|忍|熬)(?:尽|遍|透)(?:了)?(?:[^。]{0,4})?(?:苦头|苦|委屈|罪|气|磨难|艰辛|白眼|冷眼|屈辱)`,
  // 委屈承受 + 隐忍完成态
  String.raw`(?:受|挨|忍|咽|吞)(?:了|过)?(?:[^。]{0,6})?(?:委屈|气|苦|罪|白眼|冷眼|指责|埋怨)(?:[^。]{0,4})?(?:都|也|全)(?:忍|受|咽|吞|扛|顶)(?:了|下|过来|住)?`,
  // 归因对方
  String.raw`(?:我|我们)(?:[^。]{0,6})?(?:为了|为)(?:你|您|你们|这个家|家里|孩子|他|她|咱们家)(?:[^。]{0,6})?(?:吃|受|挨|遭|忍|熬|扛|背负|承担)(?:尽|了|过|的)?(?:[^。]{0,6})?(?:苦|苦头|罪|委屈|气|艰辛|磨难|难)`,
  String.raw`(?:我|我们)(?:这么|那么|如此|这样)?(?:[^。]{0,4})?(?:辛苦|苦|累|难|不容易|拼命|煎熬|操劳|奔波)(?:[^。]{0,2})?(?:都|全|也)?(?:是)?(?:为了|为)(?:你|您|你们|这个家|家里|孩子)`,
  String.raw`(?:我|我们)(?:[^。]{0,6})?(?:累|苦|熬|撑|扛|受)(?:成|到)(?:[^。]{0,2})?(?:这样|这样了|这个样|这副样子|这样一副|这个地步|这般|如此)`,
  String.raw`(?:我|我们)(?:[^。]{0,6})?(?:熬|累|病|拖|搭|赔|折|烧)(?:坏|伤|垮|掉|破|进去|上)?(?:了)?(?:[^。]{0,4})?(?:身体|健康|命|性命|心血|青春|年华|半条命)`,
  // 英文
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:suffered|endured|went\s+through|put\s+up\s+with|lived\s+through)\s+(?:so\s+much|far\s+more|much\s+more|all\s+this|a\s+lot|more\s+than\s+you|than\s+you\s+ever)\s+(?:hardship|suffering|pain|struggle|misery|grief)`,
  String.raw`\b(?:i|we)\s+(?:suffered|endured|sacrificed|went\s+through)\s+(?:far\s+|much\s+|way\s+)?(?:more|worse)\s+than\s+(?:you|you\s+ever\s+(?:will|did)|yours)\b`,
].join('|'), 'i');

console.log('\n═══ M3 置空程度压过支 ═══');
let m3Flip = 0;
for (const s of ZH_COMPARE) {
  const r = check(s, { SUFFER_ZH: SUFFER_NO_COMPARE });
  if (r.count === 0) m3Flip++;
  console.log(`  ${r.count === 0 ? '✅回落' : '❌仍命中'} ${s.slice(0, 48)}`);
}
t(`M3 ${ZH_COMPARE.length} 条比苦族样本全部回落不判`, () =>
  assert(m3Flip === ZH_COMPARE.length, `回落 ${m3Flip}/${ZH_COMPARE.length}`));

// ─── M4：只留程度压过支，证明该支本身是活的（反向对照）────────────────
const COMPARE_ONLY = new RegExp([
  String.raw`(?:吃|受|挨|走|看|过)(?:过)?(?:的)?(?:苦|盐|米|饭|路|桥)(?:都)?比(?:你|你们)(?:吃|走|见|过)(?:过)?(?:的)?(?:盐|米|饭|路|桥)(?:还|都)?多`,
].join('|'), 'i');

console.log('\n═══ M4 只留程度压过支（证明该支独立存活）═══');
let m4Alive = 0;
for (const s of ZH_COMPARE) {
  const r = check(s, { SUFFER_ZH: COMPARE_ONLY });
  if (r.count > 0) m4Alive++;
  console.log(`  ${r.count > 0 ? '✅仍命中' : '❌回落'} ${s.slice(0, 48)}`);
}
t(`M4 ${ZH_COMPARE.length} 条比苦族样本在只留该支时仍全部命中`, () =>
  assert(m4Alive === ZH_COMPARE.length, `命中 ${m4Alive}/${ZH_COMPARE.length}`));

// ─── M5：置空中文侧 SUFFER，逼英文独立命中 ──────────────────────────
const EN_ONLY = new RegExp([
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:suffered|endured|went\s+through|put\s+up\s+with|lived\s+through)\s+(?:so\s+much|far\s+more|much\s+more|all\s+this|a\s+lot|more\s+than\s+you|than\s+you\s+ever)\s+(?:hardship|suffering|pain|struggle|misery|grief)`,
  String.raw`\b(?:i|we)\s+(?:suffered|endured|went\s+through)\s+(?:so\s+much|all\s+this)\s+(?:hardship|suffering|pain)\s+(?:for|to\s+(?:raise|support|provide\s+for))\s+(?:you|this\s+family|us)\b`,
  String.raw`\b(?:i|we)\s+(?:have\s+)?(?:put\s+up\s+with|tolerated|swallowed|borne)\s+(?:so\s+much|all\s+this|more\s+than)\s+(?:for|from)\s+(?:you|this\s+family|them)\b`,
  String.raw`\b(?:i|we)\s+(?:suffered|endured|sacrificed|went\s+through)\s+(?:far\s+|much\s+|way\s+)?(?:more|worse)\s+than\s+(?:you|you\s+ever\s+(?:will|did)|yours)\b`,
].join('|'), 'i');

console.log('\n═══ M5 只留英文侧 SUFFER（中文族应回落、英文族应仍命中）═══');
let m5EnAlive = 0;
for (const s of EN) {
  const r = check(s, { SUFFER_ZH: EN_ONLY });
  if (r.count > 0) m5EnAlive++;
  console.log(`  ${r.count > 0 ? '✅仍命中' : '❌回落'} ${s.slice(0, 48)}`);
}
t(`M5a ${EN.length} 条英文样本在只留英文支时全部仍命中`, () =>
  assert(m5EnAlive === EN.length, `命中 ${m5EnAlive}/${EN.length}`));
let m5ZhFallback = 0;
for (const s of ZH_MAIN) {
  const r = check(s, { SUFFER_ZH: EN_ONLY });
  if (r.count === 0) m5ZhFallback++;
}
t(`M5b ${ZH_MAIN.length} 条中文样本在只留英文支时全部回落`, () =>
  assert(m5ZhFallback === ZH_MAIN.length, `回落 ${m5ZhFallback}/${ZH_MAIN.length}`));

// ─── M6：守门正活性（良性样本必须被对应守门命中）────────────────────
console.log('\n═══ M6 守门正活性 ═══');
t('M6a G1 EDUCATION_ZH 命中苦难史教育样本', () => {
  assert(I.EDUCATION_ZH.test('他常讲过去艰苦岁月里的故事，教育我们要珍惜当下。'), '应命中');
  assert(I.EDUCATION_ZH.test('My grandmother often tells stories of harder times to teach us gratitude.'), '应命中');
});
t('M6b G2 NEUTRAL_ZH 命中正当陈述样本', () => {
  assert(I.NEUTRAL_ZH.test('受过苦的人往往更坚强，也更善良。'), '应命中');
  assert(I.NEUTRAL_ZH.test('苦难是人生财富，但不必拿来比较。'), '应命中');
  assert(I.NEUTRAL_ZH.test('Those who have suffered are often more compassionate.'), '应命中');
});
t('M6c G3 ANALYSIS_ZH 命中概念分析样本', () => {
  assert(I.ANALYSIS_ZH.test('把苦难当成资本是要警惕的做法。'), '应命中');
  assert(I.ANALYSIS_ZH.test('苦难不该成为压制别人的理由。'), '应命中');
  assert(I.ANALYSIS_ZH.test('Weaponized suffering is a form of emotional manipulation.'), '应命中');
});
t('M6d G4 QUESTION_ZH 命中句首咨询样本', () => {
  assert(I.QUESTION_ZH.test('如何看待用苦难换取服从的现象？这值得深思。'), '应命中');
  assert(I.QUESTION_ZH.test('How should we view hardship used as leverage?'), '应命中');
});

// ─── 反向对照：不注入时全部命中（排除恒不命中造成的假翻转）───────────
console.log('\n═══ 反向对照（不注入任何变异）═══');
const ALL = [...ZH_MAIN, ...ZH_COMPARE, ...ZH_ATTRIB, ...EN];
let ctrlHit = 0;
for (const s of ALL) {
  const r = check(s);
  if (r.count > 0) ctrlHit++;
}
t(`反向对照 ${ALL.length} 条攻击样本不注入时全部命中`, () =>
  assert(ctrlHit === ALL.length, `命中 ${ctrlHit}/${ALL.length}`));

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exitCode = fail > 0 ? 1 : 0;
