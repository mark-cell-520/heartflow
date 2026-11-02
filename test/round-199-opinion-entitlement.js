/**
 * test/round-199-opinion-entitlement.js — 第 196 维度 opinion_entitlement
 * （观点权利豁免/主观主义谬误：观点主观宣告×拒绝举证两腿结构）
 * 负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入后，依赖该腿的攻击必须停止命中；依赖某豁免的陷阱
 *      样本在抹掉它后必须转为命中（证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良性另在
 * variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部 gate.action 非 pass
 * 且 opinion_entitlement 承重，≥5 良性全部 pass）。本族枚举刻意收裸名词
 * 形态（「我的观点」「我的信念」去修饰仍命中；EN 裸 "my belief" 命中）；
 * 主观偏好域（口味/颜色/审美/价值观）与「尊重他人权利」「愿意修正」是明确
 * 豁免，边缘良性据此放行。
 *
 * 立项证据：三层研究 + 引擎差距实测——r199 家族探针在当前引擎（v6.8.127，
 * 195 维）复测：观点权利豁免族攻击 6/6 gate.action=pass（真零命中）、良性
 * 3/3 pass（零误伤）；Phase 1.5 同律复核 6/6 零命中。侦察落盘
 * /tmp/hf-scout-<ts>.txt（逻辑谬误检测方向命中 HN 258 arXiv 2405.02318
 * NL2FOL，GitHub 120★ Real_time_fallacy_detection——均依赖 LLM，不适合纯
 * 规则引擎；unfalsifiability/entitlement 三层搜索空返，判据纯规则自有实现）。
 */
const assert = require('assert');
const { checkOpinionEntitlement } = require('../src/opinion-entitlement.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
const NEVER = /(?!x)x/; // 永不匹配（注入用：以之替换某常量即抹掉该常量）

// ─── 攻击样本（中文×5 / 英文×2 / 含裸名词、带修饰、倒装、长句）────────
const ATTACK = [
  '我有权保留我的观点，你拿我没办法。',                                             // 裸：权利宣告 + 拒绝说服
  '这不过是我个人的主观看法罢了，你可以不认同，但我绝不会因此改变。',              // 带修饰长句
  '你的证据再充分也无所谓，这是我固有的信念，容不得你来质疑。',                    // 倒装：证据前置 + 固有信念
  '每个人都有自己的立场，我只是在坚持我作为公民的言论自由，你有你的数据，但我想怎么相信是我的自由，你说服不了我。', // 长句多腿
  '这是我的信念，谁也说服不了我。',                                               // 短/裸
  "I'm entitled to my own opinion, so your evidence simply doesn't matter to me.", // EN entitled + evidence doesn't matter
  "That's just my personal belief, and I refuse to let your data change my mind.", // EN personal belief + refuse
];

// ─── 良性样本（边缘良性：偏好域/尊重他人/价值观分歧/修正开放/单腿语义/证据在场）─
const BENIGN = [
  '口味没有对错，有人嗜甜有人嗜咸，这很正常。',                       // 偏好域（口味）
  '我尊重你保留自己观点的权利，但这份数据确实支持另一个结论。',        // 尊重他人权利 + 证据在场
  '在价值观这样的话题上，我们同意各自保留意见，不必强求一致。',        // 价值观分歧（偏好域）+ 无腿
  '这只是我目前的看法，如果数据证明我错了，我愿意修正。',              // 修正开放
  '选什么颜色纯粹看个人喜好，没有高低之分。',                          // 偏好域（颜色/喜好）
  '目前没有证据表明它存在，我们暂不采纳这个假设。',                    // 单腿②语义，正当证据纪律（无腿①）
  '这是我的观点，下面是支撑它的三项数据。',                            // 有腿①但接受证据（无腿②）
];

// ─── 陷阱（证各豁免承重：抹掉豁免后必须转为命中）────────────────────
const TRAP_PREF = '颜色没有对错，但这是我的信念，你说服不了我。';                         // 偏好域「颜色」豁免
const TRAP_RESP = '我尊重你保留观点的权利，但这是我的立场，我绝不会改。';                 // 尊重他人权利豁免
const TRAP_REV  = '这是我的观点，我绝不会改，但如果出现新证据我愿意修正。';               // 修正/证据开放豁免
const TRAP_META = '他总把『这是我的信仰，你拿我没办法』挂在嘴边，这正是典型的主观主义。'; // 元话语/概念引述豁免
const TRAP_HEDGE = '这是我的观点，我可能不会改。';                                        // 对冲豁免
const TRAP_Q    = '这是我的立场，你说服不了我吗？';                                        // 疑问句豁免

console.log('\n[正向：攻击命中 / 良性放行 / 陷阱放行]');
for (const s of ATTACK) t('攻击命中: ' + s.slice(0, 22), () => {
  const r = checkOpinionEntitlement(s); assert.ok(r.hit, '应命中却漏判'); assert.ok(r.score > 0, 'score 应 >0');
});
for (const s of BENIGN) t('良性放行: ' + s.slice(0, 22), () => {
  assert.ok(!checkOpinionEntitlement(s).hit, '应放行却误判');
});
for (const [nm, s] of [['偏好域', TRAP_PREF], ['尊重他人', TRAP_RESP], ['修正开放', TRAP_REV], ['元话语', TRAP_META], ['对冲', TRAP_HEDGE], ['疑问', TRAP_Q]]) {
  t('陷阱放行(' + nm + ')', () => assert.ok(!checkOpinionEntitlement(s).hit, nm + '陷阱应被豁免'));
}

console.log('\n[承重：逐常量注入]');
t('抹掉观点宣告腿①（中英）→ 全部攻击停止命中（证 ENTITLEMENT 腿承重）', () => {
  const inject = { ENTITLEMENT_ZH: NEVER, ENTITLEMENT_EN: NEVER };
  for (const s of ATTACK) assert.ok(!checkOpinionEntitlement(s, inject).hit, '宣告腿被抹后应停止命中: ' + s.slice(0, 20));
});
t('抹掉拒绝举证腿②（中英）→ 全部攻击停止命中（证 IMMUNITY 腿承重）', () => {
  const inject = { IMMUNITY_ZH: NEVER, IMMUNITY_EN: NEVER };
  for (const s of ATTACK) assert.ok(!checkOpinionEntitlement(s, inject).hit, '免疫腿被抹后应停止命中: ' + s.slice(0, 20));
});
t('只抹掉英文宣告腿 → 英文攻击停止命中，中文攻击仍命中（证中英逐侧独立）', () => {
  const inject = { ENTITLEMENT_EN: NEVER };
  assert.ok(!checkOpinionEntitlement(ATTACK[5], inject).hit, '英文攻击应停止命中');
  assert.ok(!checkOpinionEntitlement(ATTACK[6], inject).hit, '英文攻击应停止命中');
  assert.ok(checkOpinionEntitlement(ATTACK[0], inject).hit, '中文攻击应仍命中');
});
for (const [nm, s, key] of [
  ['偏好域', TRAP_PREF, 'PREFERENCE_DOMAIN'],
  ['尊重他人', TRAP_RESP, 'RESPECT_OTHER'],
  ['修正开放', TRAP_REV, 'REVISION_OPEN'],
  ['元话语', TRAP_META, 'META_NOUN'],
  ['对冲', TRAP_HEDGE, 'HEDGE'],
  ['疑问', TRAP_Q, 'QUESTION'],
]) {
  t('抹掉' + nm + '豁免 → ' + nm + '陷阱转为命中（证 ' + key + ' 承重）', () => {
    const inject = {}; inject[key] = NEVER;
    const r = checkOpinionEntitlement(s, inject);
    assert.ok(r.hit, '抹掉' + nm + '豁免后陷阱应转为命中');
  });
}

console.log('\n[变体矩阵：真实 gate() 复量（161 轮教训）]');
for (const s of ATTACK) t('矩阵攻击 gate.action≠pass 且 opinion_entitlement 承重: ' + s.slice(0, 20), () => {
  const g = gate(s);
  assert.notStrictEqual(g.gate.action, 'pass', '攻击变体应非 pass');
  assert.ok((g.findings || []).some(f => f.dimension === 'opinion_entitlement'), 'opinion_entitlement 应承重进入 findings');
});
for (const s of BENIGN) t('矩阵良性 gate.action=pass: ' + s.slice(0, 20), () => {
  assert.strictEqual(gate(s).gate.action, 'pass', '良性变体应 pass');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
