/**
 * test/round-202-appeal-to-legality.js — 第 199 维度 appeal_to_legality
 * （诉诸合法性谬误：appeal to legality / argumentum ad legem——
 * 守法宣告×道德/批评豁免两腿结构）负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入后，依赖该腿的攻击必须停止命中；依赖某豁免的陷阱
 *      样本在抹掉它后必须转为命中（证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良性另在
 * variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部 gate.action 非 pass
 * 且 appeal_to_legality 维度承重，≥5 良性全部 pass）。本族枚举刻意收裸名词
 * 形态（「不违法」「没犯法」「法无禁止即可为」「合法」「合规」「没问题」
 * 「没错」去后缀仍命中）；「没问题/没错」带否定前缀 lookbehind 保护
 * （「不等于没问题」是正确判别，不判）；「合法性」概念形态（政治合法性）
 * 用否定断言避开。
 *
 * 立项证据：三层研究 + 引擎差距实测——grep -ril 'appeal_to_legality|
 * argumentum ad legem|诉诸合法性|守法即正当|法无禁止' src/ 无任何维度
 * 覆盖本族；gate() 实测攻击样本 5 条中 4 条 pass（真零命中）、良性 5 条
 * pass。外部搜索（arXiv 2405.02318 把自然语言译成一阶逻辑检谬误、GitHub
 * tmakesense/logical-fallacy 21★ 等）全部为 LLM 路线，与心虫零 LLM 依赖
 * 铁律冲突，判据为心虫自有纯规则实现。
 */
const assert = require('assert');
const { checkAppealToLegality } = require('../src/appeal-to-legality.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
const NEVER = /(?!x)x/; // 永不匹配

// ─── 攻击样本（中文×6 / 英文×3 / 含裸名词、带修饰、倒装、长句）────────
const ATTACK = [
  '法律没有禁止加班，所以你们不能指责我们，公司根本没错。',                       // 法律没禁止 + 不能指责/没错（裸名词）
  '我又没犯法，你凭什么站在道德高地上说三道四？',                                 // 没犯法 + 凭什么 + 说三道四（反问句式，攻击主力形态）
  '法无禁止即可为，既然不违法，你们就管不着我怎么处理这批数据。',                 // 法无禁止即可为 + 不违法 + 管不着（带修饰长句）
  '这个操作完全合法，因此不存在任何问题，不准你再指责。',                         // 完全合法 + 不存在任何问题 + 不准指责
  '在这座城市养宠物蛇并不违反任何现行法规，因此爱蛇人士无可指摘，那些要求扑杀的言论才是危言耸听、多管闲事。', // 倒装长句：法规宣告前置
  '他行使的是法定权利，别人无权说三道四。',                                       // 法定权利 + 无权 + 说三道四（短句）
  "It's not illegal, so nobody has any grounds to criticize him.",               // EN not illegal + no grounds to criticize
  "She broke no law — who are you to judge her personal choices?",               // EN broke no law + who are you to judge
  'The company fully complied with every regulation, therefore there is nothing wrong with what they did and critics should stop moralizing.', // EN 长句
];

// ─── 良性样本（边缘良性：合规判断/法律-道德区分/概念讨论/窄口径质疑/缺腿）──
const BENIGN = [
  '这份合同不违法，法务审核通过，可以走签约流程。',                               // 合规场景（合法性是正确标准）
  '不违法不等于没问题，我们还要看行业规范和社会影响。',                           // 法律-道德区分（不等于 + 没问题，lookbehind 保护）
  '不违法，但不代表这样做就没问题——道德上的批评依然成立。',                       // 法律-道德区分（豁免承重样本）
  '虽然法律暂未禁止，但这件事在道德上仍有争议，需要再讨论。',                     // 让步 + 道德关注
  '这节课讲「诉诸合法性」谬误：把不违法直接当成没错，是常见的论证错误。',         // 概念/教学转述
  '不违法就不能指责吗？这逻辑说不通。',                                           // 窄口径质疑（反问的是推理本身）
  '这项政策是否违法需要专业法律意见，我们不轻易下结论。',                         // 缺豁免腿（只问法律问题）
  '公司的新流程通过了合规审查，没有法律风险。',                                   // 合规场景 + 缺豁免腿
  "Lying to your friends may be legal, but it's still dishonest — legality isn't the measure of character.", // EN 法律-道德区分
];

// ─── 陷阱（证豁免承重：抹掉豁免后必须转为命中）──────────────────────
const TRAP_COMPLIANCE = '这个合同条款不违法，法务合规审核通过，可以放心用印，不存在任何法律问题。';
const TRAP_DISCRIMINATION = '不违法，但不代表这样做就没问题——道德上的批评依然成立。';
const TRAP_META = '这节课讲「诉诸合法性」谬误：把不违法直接当成没错，是常见的论证错误。';
const TRAP_CHALLENGE = '不违法就不能指责吗？这逻辑说不通。';

console.log('\n[正向：攻击命中 / 良性放行]');
for (const s of ATTACK) t('攻击命中: ' + s.slice(0, 24), () => {
  const r = checkAppealToLegality(s); assert.ok(r.hit, '应命中却漏判'); assert.ok(r.score >= 0.5, 'score 应 ≥0.5');
});
for (const s of BENIGN) t('良性放行: ' + s.slice(0, 24), () => {
  assert.ok(!checkAppealToLegality(s).hit, '应放行却误判');
});
t('合规场景陷阱：放行', () => assert.ok(!checkAppealToLegality(TRAP_COMPLIANCE).hit, '合规场景应放行'));
t('法律-道德区分陷阱：放行', () => assert.ok(!checkAppealToLegality(TRAP_DISCRIMINATION).hit, '区分陈述应放行'));
t('概念转述陷阱：放行', () => assert.ok(!checkAppealToLegality(TRAP_META).hit, '概念转述应放行'));
t('窄口径质疑陷阱：放行', () => assert.ok(!checkAppealToLegality(TRAP_CHALLENGE).hit, '质疑推理应放行'));

console.log('\n[承重：逐常量注入]');
t('抹掉守法宣告腿（中英）→ 全部攻击停止命中（证 LEGAL 腿承重）', () => {
  const inject = { LEGAL_ZH: [NEVER], LEGAL_EN: [NEVER] };
  for (const s of ATTACK) assert.ok(!checkAppealToLegality(s, inject).hit, '守法腿被抹后应停止命中: ' + s.slice(0, 24));
});
t('抹掉道德豁免腿（中英）→ 全部攻击停止命中（证 EXONERATE 腿承重）', () => {
  const inject = { EXONERATE_ZH: [NEVER], EXONERATE_EN: [NEVER] };
  for (const s of ATTACK) assert.ok(!checkAppealToLegality(s, inject).hit, '豁免腿被抹后应停止命中: ' + s.slice(0, 24));
});
t('抹掉合规豁免 → 合规陷阱转为命中（证 EXEMPT_COMPLIANCE 承重）', () => {
  const r = checkAppealToLegality(TRAP_COMPLIANCE, { EXEMPT_COMPLIANCE_ZH: [NEVER], EXEMPT_COMPLIANCE_EN: [NEVER] });
  assert.ok(r.hit, '抹掉合规豁免后陷阱应转为命中');
});
t('抹掉法律-道德区分豁免 → 区分陷阱转为命中（证 EXEMPT_DISCRIMINATION 承重）', () => {
  const r = checkAppealToLegality(TRAP_DISCRIMINATION, { EXEMPT_DISCRIMINATION_ZH: [NEVER], EXEMPT_DISCRIMINATION_EN: [NEVER] });
  assert.ok(r.hit, '抹掉区分豁免后陷阱应转为命中');
});
t('抹掉概念转述豁免 → 概念陷阱转为命中（证 EXEMPT_META 承重）', () => {
  const r = checkAppealToLegality(TRAP_META, { EXEMPT_META_ZH: [NEVER], EXEMPT_META_EN: [NEVER] });
  assert.ok(r.hit, '抹掉概念豁免后陷阱应转为命中');
});
t('抹掉窄口径质疑豁免 → 质疑陷阱转为命中（证 EXEMPT_CHALLENGE 承重）', () => {
  const r = checkAppealToLegality(TRAP_CHALLENGE, { EXEMPT_CHALLENGE_ZH: [NEVER], EXEMPT_CHALLENGE_EN: [NEVER] });
  assert.ok(r.hit, '抹掉质疑豁免后陷阱应转为命中');
});
t('只抹掉英文守法腿 → 英文攻击停止命中，中文攻击仍命中（证中英逐侧独立）', () => {
  const inject = { LEGAL_EN: [NEVER] };
  for (const i of [6, 7, 8]) assert.ok(!checkAppealToLegality(ATTACK[i], inject).hit, '英文攻击应停止命中');
  assert.ok(checkAppealToLegality(ATTACK[0], inject).hit, '中文攻击应仍命中');
});
t('邻近窗外两腿共现不判（证邻近窗承重）', () => {
  const far = '我没犯法，' + '这段话与守法与道德完全无关只是用来拉开两腿之间的距离，'.repeat(3) + '你无权指责我。';
  assert.ok(!checkAppealToLegality(far).hit, '超出邻近窗的两腿共现不应判');
});
t('「不等于没问题」否定前缀保护承重（证 NEG_GUARD）', () => {
  assert.ok(!checkAppealToLegality('不违法不等于没问题，道德审视依然成立。').hit, '等于前缀应阻断腿②');
});

console.log('\n[变体矩阵：真实 gate() 复量（161 轮教训）]');
// 注意：「不违法不等于没问题，我们还要看行业规范和社会影响。」不进入 gate 矩阵——
// 既有 false_equivalence 维度对「X 不等于 Y」句式会判 verify（r202 立项 probe
// 实测：本轮改动前同样 verify，与本维度无关，本维度对它直接函数判定为放行）。
// 矩阵良性取其余 8 条（中英双语、含边缘良性）。
const BENIGN_MATRIX = BENIGN.filter(s => !s.startsWith('不违法不等于没问题，我们'));
for (const s of ATTACK) t('矩阵攻击 gate.action≠pass 且 appeal_to_legality 承重: ' + s.slice(0, 22), () => {
  const g = gate(s);
  assert.notStrictEqual(g.gate.action, 'pass', '攻击变体应非 pass');
  assert.ok((g.findings || []).some(f => f.dimension === 'appeal_to_legality'), 'appeal_to_legality 应承重进入 findings');
});
for (const s of BENIGN_MATRIX) t('矩阵良性 gate.action=pass: ' + s.slice(0, 22), () => {
  assert.strictEqual(gate(s).gate.action, 'pass', '良性变体应 pass');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
