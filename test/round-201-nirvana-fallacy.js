/**
 * test/round-201-nirvana-fallacy.js — 第 198 维度 nirvana_fallacy（完美方案谬误：
 * nirvana fallacy / perfect solution fallacy——不完美宣告×行动废止两腿结构）
 * 负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入后，依赖该腿的攻击必须停止命中；依赖某豁免的陷阱
 *      样本在抹掉它后必须转为命中（证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良性另在
 * variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部 gate.action 非 pass
 * 且 nirvana_fallacy 维度承重，≥5 良性全部 pass）。本族枚举刻意收裸名词
 * 形态（「不完美」「有漏洞」「治标不治本」「一劳永逸」「放弃」「废止」
 * 去后缀仍命中）；废止动词带否定前缀 lookbehind 保护（「不该放弃」
 * 「没有取消」是正确坚持，不判）。
 *
 * 立项证据：三层研究 + 引擎差距实测——grep -ril 'nirvana|perfect solution|
 * 治标不治本|完美方案|一劳永逸|银弹' src/ 仅命中 fallacy-fallacy.js 的
 * 概念引述豁免表与 index.js:5866 一条窄正则（「不完美…等于…没用」固定
 * 句式），198 维前无一以「不完美×废止」两腿覆盖本族；GitHub faina
 * （NAACL 2025, aclanthology.org/2025.naacl-long.34/）20 类谬误分类学
 * 含 perfect solution fallacy 类，可作对照；判据为心虫自有纯规则实现。
 */
const assert = require('assert');
const { checkNirvanaFallacy } = require('../src/nirvana-fallacy.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
const NEVER = /(?!x)x/; // 永不匹配

// ─── 攻击样本（中文×5 / 英文×3 / 含裸名词、带修饰、倒装、长句）────────
const ATTACK = [
  '这个药不能根治癌症，所以吃它毫无意义，干脆放弃治疗算了。',                 // 不能根治 + 毫无意义/放弃（裸动词）
  '口罩无法100%防住病毒，既然防不住就该取消，戴了也是白费功夫。',             // 无法100% + 取消/白费（带修饰长句）
  '隔离措施只是治标不治本，根本不该采用，纯属多此一举。',                     // 治标不治本 + 不该采用/多此一举
  '新系统不能一劳永逸地解决所有问题，可见投入它就是徒劳，不如趁早叫停。',     // 不能一劳永逸 + 徒劳/不如叫停
  '任何方案都不可能完美，有漏洞的东西就该被彻底废止，不必留下。',             // 不可能完美 + 有漏洞 + 废止（倒装：缺陷宣告前置）
  "This policy isn't perfect, so it's not worth pursuing — might as well do nothing.", // EN isn't perfect + not worth/might as well
  "The vaccine can't fully eliminate infection, therefore there's no point in rolling it out.", // EN can't fully eliminate + no point
  'Since the plan can\'t completely fix the problem, we should abandon it and wait for a perfect solution.', // EN 长句 + should abandon/wait for perfect
];

// ─── 良性样本（边缘良性：多因陈述/缺废止腿/让步-肯定/ interim /仅缺陷认知）──
const BENIGN = [
  '战争是多因共同造成的，不能简单归因于单一因素。',                           // 边缘良性（多因正确陈述，无缺陷×废止双腿）
  '这个方案目前还不能根治，但能缓解大部分症状，值得在临床推广。',             // 缺废止腿（对局限+收益的正确认知）
  '疫苗不能百分之百防感染，但它显著降低了重症率，应当继续接种。',             // 让步-肯定（不完美但收益在场）
  '在找不到更好的根治方法之前，先用现有手段控制病情是正确的过渡做法。',       // interim（找不到根治 + 先控制）
  '这个系统有漏洞，研发团队正在连夜修复补丁，下周发布更新。',                 // 仅缺陷认知无废止腿
  "The treatment isn't a cure, but it slows the disease and buys patients time, so it remains valuable.", // EN 缺废止腿
  "We can't eradicate poverty completely, yet each measure measurably reduces it — that's why we iterate.", // EN 让步-肯定
];

// ─── 陷阱（证豁免承重：抹掉豁免后必须转为命中）──────────────────────
const TRAP_META = '这种「不完美就没意义」的论证犯了完美方案谬误（nirvana fallacy），把理想化对照当成了行动标准。';
const TRAP_CONCESSION = '这个药不能根治，但能显著延长生存期，所以并非没有意义。';
const TRAP_HARM = '这个药有严重的副作用和成瘾风险，所以必须立即停止使用。';
const TRAP_INTERIM = '在找不到根治方法之前，现行方案暂缓废止、继续控制病情是对的。';
const TRAP_QUESTION = '不能根治就没有意义吗？';

console.log('\n[正向：攻击命中 / 良性放行]');
for (const s of ATTACK) t('攻击命中: ' + s.slice(0, 24), () => {
  const r = checkNirvanaFallacy(s); assert.ok(r.hit, '应命中却漏判'); assert.ok(r.score >= 0.5, 'score 应 ≥0.5');
});
for (const s of BENIGN) t('良性放行: ' + s.slice(0, 24), () => {
  assert.ok(!checkNirvanaFallacy(s).hit, '应放行却误判');
});
t('概念转述陷阱：放行', () => assert.ok(!checkNirvanaFallacy(TRAP_META).hit, '概念转述应放行'));
t('让步-肯定陷阱：放行', () => assert.ok(!checkNirvanaFallacy(TRAP_CONCESSION).hit, '让步-肯定应放行'));
t('证据型废止陷阱：放行', () => assert.ok(!checkNirvanaFallacy(TRAP_HARM).hit, '危害型废止应放行'));
t('过渡/ interim 陷阱：放行', () => assert.ok(!checkNirvanaFallacy(TRAP_INTERIM).hit, 'interim 应放行'));
t('疑问句陷阱：放行', () => assert.ok(!checkNirvanaFallacy(TRAP_QUESTION).hit, '疑问句应放行'));

console.log('\n[承重：逐常量注入]');
t('抹掉不完美宣告腿（中英）→ 全部攻击停止命中（证 IMPERFECT 腿承重）', () => {
  const inject = { IMPERFECT_ZH: [NEVER], IMPERFECT_EN: [NEVER] };
  for (const s of ATTACK) assert.ok(!checkNirvanaFallacy(s, inject).hit, '不完美腿被抹后应停止命中: ' + s.slice(0, 24));
});
t('抹掉行动废止腿（中英）→ 全部攻击停止命中（证 REJECT 腿承重）', () => {
  const inject = { REJECT_ZH: [NEVER], REJECT_EN: [NEVER] };
  for (const s of ATTACK) assert.ok(!checkNirvanaFallacy(s, inject).hit, '废止腿被抹后应停止命中: ' + s.slice(0, 24));
});
t('抹掉概念转述豁免 → 概念陷阱转为命中（证 EXEMPT_META 承重）', () => {
  const r = checkNirvanaFallacy(TRAP_META, { EXEMPT_META_ZH: [NEVER], EXEMPT_META_EN: [NEVER] });
  assert.ok(r.hit, '抹掉概念豁免后陷阱应转为命中');
});
t('抹掉让步-肯定豁免 → 让步陷阱转为命中（证 EXEMPT_CONCESSION 承重）', () => {
  const r = checkNirvanaFallacy(TRAP_CONCESSION, { EXEMPT_CONCESSION_ZH: [NEVER], EXEMPT_CONCESSION_EN: [NEVER] });
  assert.ok(r.hit, '抹掉让步豁免后陷阱应转为命中');
});
t('抹掉证据型废止豁免 → 危害陷阱转为命中（证 EXEMPT_HARM 承重）', () => {
  const r = checkNirvanaFallacy(TRAP_HARM, { EXEMPT_HARM_ZH: [NEVER], EXEMPT_HARM_EN: [NEVER] });
  assert.ok(r.hit, '抹掉危害豁免后陷阱应转为命中');
});
t('抹掉过渡豁免 → interim 陷阱转为命中（证 EXEMPT_INTERIM 承重）', () => {
  const r = checkNirvanaFallacy(TRAP_INTERIM, { EXEMPT_INTERIM_ZH: [NEVER], EXEMPT_INTERIM_EN: [NEVER] });
  assert.ok(r.hit, '抹掉过渡豁免后陷阱应转为命中');
});
t('疑问句去问号 → 转为命中（证疑问句豁免承重）', () => {
  assert.ok(checkNirvanaFallacy('不能根治就没有意义吗？').hit === false, '带问号应放行');
  const r = checkNirvanaFallacy('不能根治就没有意义'); // 去问号
  assert.ok(r.hit, '去掉问号后应转为命中');
});
t('只抹掉英文不完美腿 → 英文攻击停止命中，中文攻击仍命中（证中英逐侧独立）', () => {
  const inject = { IMPERFECT_EN: [NEVER] };
  for (const i of [5, 6, 7]) assert.ok(!checkNirvanaFallacy(ATTACK[i], inject).hit, '英文攻击应停止命中');
  assert.ok(checkNirvanaFallacy(ATTACK[0], inject).hit, '中文攻击应仍命中');
});
t('邻近窗外两腿共现不判（证邻近窗承重）', () => {
  const far = '这个方案不能根治，' + '此处插入一段与主题无关的叙述文字，'.repeat(7) + '干脆放弃。';
  assert.ok(!checkNirvanaFallacy(far).hit, '超出邻近窗的两腿共现不应判');
});

console.log('\n[变体矩阵：真实 gate() 复量（161 轮教训）]');
for (const s of ATTACK) t('矩阵攻击 gate.action≠pass 且 nirvana_fallacy 承重: ' + s.slice(0, 22), () => {
  const g = gate(s);
  assert.notStrictEqual(g.gate.action, 'pass', '攻击变体应非 pass');
  assert.ok((g.findings || []).some(f => f.dimension === 'nirvana_fallacy'), 'nirvana_fallacy 应承重进入 findings');
});
for (const s of BENIGN) t('矩阵良性 gate.action=pass: ' + s.slice(0, 22), () => {
  assert.strictEqual(gate(s).gate.action, 'pass', '良性变体应 pass');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
