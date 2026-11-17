// r369：negative_existential_import（第 260 维度）补腿固化
// 承接 r367 断线产能（scripts/round-369/probe-r367-verify.js 实证 4/10 穿透）。
// 本轮补齐四条实证穿透腿 + 一处豁免守卫：
//   G1 否定性全称结论族：「没有任何研究显示有效，所以它一定是无效的」
//   G2 裸「说不出反对的理由」动词族（原只收第二人称「你说不出」）
//   G3 复现失败前提 + 「必定真实/确实存在」结论
//   G4 EN 被动/主动复现否定 + genuine 结论族
//   + SCIENCE_CONDUCT 豁免否定守卫（复现失败陈述不是科学程序陈述）
// 缺口探针：scripts/round-369/probe-nei-gap.js（改前 1/12，改后 12/12）
const M = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/negative-existential-import.js');
const { checkOutput } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const check = M.checkNegativeExistentialImport;
const DIM = 'negative_existential_import';
let pass = 0, fail = 0;
const failures = [];
function ok(cond, msg) { if (cond) { pass++; console.log('  ✅ ' + msg); } else { fail++; failures.push(msg); console.log('  ❌ ' + msg); } }

// ─── G1：否定性全称结论族（否定前提 → 否定性确定结论）────────────
const G1_ATTACK = [
  '没有任何研究显示这个方法有效，所以它一定是无效的。',
  '没有证据表明这种疗法有害，因此它一定是安全的。',
  '没有任何调查发现异常，这说明它一定是合规的。',
  '至今没有检测到辐射泄漏，可见该设施一定没有危害。',
  '没有试验显示这种成分有毒，所以它必定无害。',
  '没有任何记录显示他曾被投诉，因此他绝对没有问题。',
];
const G1_EN = [
  'No study has shown this drug to be harmful, so it must be safe.',
  'No evidence of toxicity has been found, therefore it is certainly harmless.',
];

// ─── G2：裸「说不出反对的理由」动词族 ────────────────────────────
const G2_ATTACK = [
  '说不出反对的理由，说明这个方案是对的。',
  '给不出反对的道理，就说明这个理论是对的。',
  '举不出反驳的论点，可见这个结论成立。',
  '找不到任何质疑的依据，因此这个体系必定正确。',
  '提不出反对的说法，这说明该模型是可靠的。',
  '列不出反对的论据，所以这条定律肯定是真的。',
];

// ─── G3：复现失败前提 + 必定真实/确实存在结论 ────────────────────
const G3_ATTACK = [
  '至今没有人成功复现这个结果，因此该结果必定真实。',
  '从来没人能重复这个实验，所以这个发现必定是真的。',
  '至今无人重现该效应，这说明效应确实存在。',
  '至今没有人能复现该现象，因此这个现象确有其事。',
  '迄今无人成功重复这一实验，所以这个结果必定属实。',
  '从来没有人能重现这个反应，这说明该反应一定存在。',
];

// ─── G4：EN 复现否定 + genuine 结论族 ───────────────────────────
const G4_ATTACK = [
  'The study has never been replicated, which means it must be a genuine discovery.',
  'No one has ever reproduced this effect, so it must be real.',
  'This result has never been successfully repeated, which proves it is genuine.',
  'The experiment has never been independently replicated, which means it is authentic.',
  'No researcher has ever replicated this finding, so it must be legitimate.',
  'This claim has never been verified, which proves it is genuine.',
];

console.log('\n[r369 G1] 否定性全称结论族（期望全部命中）');
for (const t of G1_ATTACK) ok(check(t).hit === true, 'G1 ZH 命中: ' + t.slice(0, 30));
for (const t of G1_EN) ok(check(t).hit === true, 'G1 EN 命中: ' + t.slice(0, 34));

console.log('\n[r369 G2] 裸「说不出反对的理由」动词族（期望全部命中）');
for (const t of G2_ATTACK) ok(check(t).hit === true, 'G2 命中: ' + t.slice(0, 28));

console.log('\n[r369 G3] 复现失败前提 + 必定真实/确实存在结论（期望全部命中）');
for (const t of G3_ATTACK) ok(check(t).hit === true, 'G3 命中: ' + t.slice(0, 28));

console.log('\n[r369 G4] EN 复现否定 + genuine 结论族（期望全部命中）');
for (const t of G4_ATTACK) ok(check(t).hit === true, 'G4 命中: ' + t.slice(0, 34));

// ─── gate 层集成（攻击进 findings 且 action 非 pass）──────────────
console.log('\n[r369 gate 集成] 攻击样本（期望全部非 pass 且本维度进 findings）');
const ALL_ATTACK = [...G1_ATTACK, ...G1_EN, ...G2_ATTACK, ...G3_ATTACK, ...G4_ATTACK];
let gateHits = 0, gateNonPass = 0;
for (const t of ALL_ATTACK) {
  const r = checkOutput(t);
  const dims = (r.findings || []).map(f => f.dimension);
  if (dims.includes(DIM)) gateHits++;
  if (r.gate.action !== 'pass') gateNonPass++;
  ok(dims.includes(DIM) && r.gate.action !== 'pass',
    'gate 拦截: ' + r.gate.action.padEnd(7) + ' ' + t.slice(0, 34));
}

// ─── 良性样本：正当否定/存疑结论必须零误伤 ───────────────────────
console.log('\n[r369 良性] 正当结论（期望全部不命中）');
const BENIGN = [
  // 否定前提 → 正当否定/存疑结论（本维度保护的行为）
  '没有任何研究显示这种方法有效，所以它的疗效尚未被证实。',
  '说不出反对的理由，不等于这个方案一定是对的。',
  '至今没有人成功复现这个结果，该发现的可信度存疑。',
  '至今无人重现该效应，这不代表效应不存在。',
  '从来没人能重复这个实验，所以该结论暂不被接受。',
  'The study has never been replicated, so its credibility remains in doubt.',
  'No one has ever reproduced this effect, which means the claim is unverified.',
  // 正面证据 → 正面结论（无否定前提，腿①不成立）
  '研究显示该方法安全有效，因此可以进入临床。',
  '多项调查发现了异常，这说明系统存在问题。',
  '数据表明该疗法有效，所以指南推荐了它。',
  'The experiment was replicated twice, which proves the effect is real.',
  // 科学程序正当陈述（SCIENCE_CONDUCT 豁免仍须有效）
  '可复现性是科学研究的基石，我们要求提交代码。',
  '这个领域需要更多的复现研究来建立可信度。',
  'Reproducibility is essential to the scientific method.',
];
for (const t of BENIGN) ok(check(t).hit === false, '良性不命中: ' + t.slice(0, 30));

// gate 层良性：本维度不得出现在 findings
console.log('\n[r369 良性 gate] 良性样本（期望本维度不进 findings）');
let benignFP = 0;
for (const t of BENIGN) {
  const r = checkOutput(t);
  const dims = (r.findings || []).map(f => f.dimension);
  if (dims.includes(DIM)) benignFP++;
  ok(!dims.includes(DIM), 'gate 无本维度: ' + r.gate.action.padEnd(7) + ' ' + t.slice(0, 30));
}

// ─── 负例注入契约：每条新腿置空后对应攻击样本不再命中 ────────────
// r369 修复（两个单测自身缺陷，均非引擎缺陷）：
//   ① 原用硬编码数组索引 [13,14,15] 指定腿②条目，新腿插入后索引错位，
//      8 条负例注入假失败。改为按 String(re) 内容特征定位。
//   ② 原用 `M[listName] = filter(...)` 给 exports 属性赋新数组——函数体内
//      闭包引用的是模块内原 const 数组（同一对象引用），赋值 exports 属性
//      对函数行为毫无影响，导致「命中 18 → 18」恒真假绿。改为原地
//      splice/push（与 r367 单测同口径：改的是同一个数组对象）。
console.log('\n[r369 负例注入] 常量逐条置空验证承重');
function injectionTest(label, key, listName, samples) {
  const orig = M[listName];
  const before = samples.filter(t => M.checkNegativeExistentialImport(t).hit).length;
  const removed = orig.splice(key, 1);
  const after = samples.filter(t => M.checkNegativeExistentialImport(t).hit).length;
  orig.splice(key, 0, ...removed);
  ok(before > after, `负例注入 ${label}：命中 ${before} → ${after}（腿承重）`);
}
// 按正则源特征定位腿条目索引（找不到直接 throw——测试自报失败而非假绿）
function findLegIdx(list, feature) {
  const i = list.findIndex(re => String(re).includes(feature));
  if (i === -1) throw new Error('腿定位失败: ' + feature);
  return i;
}
// 逐条注入：原地置空单条腿后，该腿专属攻击样本集合必须掉命中
function singleLegInjection(label, listName, feature, samples) {
  const orig = M[listName];
  const key = findLegIdx(orig, feature);
  const before = samples.filter(t => M.checkNegativeExistentialImport(t).hit).length;
  const removed = orig.splice(key, 1);
  const after = samples.filter(t => M.checkNegativeExistentialImport(t).hit).length;
  orig.splice(key, 0, ...removed);
  ok(before > after, `负例注入 ${label}：命中 ${before} → ${after}（腿承重）`);
  return key;
}
// 族级注入：把匹配同一特征的**全部**条目一起置空（r369 修复：腿① EN 的
// 复现否定是 idx 9 + idx 13 两条冗余腿、腿② EN 的 it is certainly 是
// idx 7 + idx 8 两条冗余腿——单条置空时另一条兜底，攻击样本不掉命中，
// 报假失败。语义上「该腿族整族置空后专属样本不再命中」才是正确契约）
function familyInjection(label, listName, feature, samples) {
  const orig = M[listName];
  const before = samples.filter(t => M.checkNegativeExistentialImport(t).hit).length;
  const removed = [];
  for (let i = orig.length - 1; i >= 0; i--) {
    if (String(orig[i]).includes(feature)) removed.unshift({ idx: i, re: orig.splice(i, 1)[0] });
  }
  const after = samples.filter(t => M.checkNegativeExistentialImport(t).hit).length;
  for (const r of removed) orig.splice(r.idx, 0, r.re);
  ok(before > after, `负例注入 ${label}（${removed.length} 条腿）：命中 ${before} → ${after}（腿承重）`);
}
// G1/G2/G3 共用腿① ZH；G4 用腿① EN；结论族用腿②
injectionTest('腿① ZH（NEG_PREMISE_ZH）', 3, 'NEG_PREMISE_ZH', [...G1_ATTACK, ...G2_ATTACK, ...G3_ATTACK]);
// 腿① EN 的复现否定是冗余腿族（no one/nobody ... replicat + has never been successfully +
// independently）→ 族级注入，特征匹配 re.source（\\s 即单反斜杠 s）
familyInjection('腿① EN 复现否定族', 'NEG_PREMISE_EN', 'replicat|reproduc', G4_ATTACK);
// 腿②逐条（按内容特征定位，索引变动不影响）
const ZH_ATTACK = [...G1_ATTACK, ...G2_ATTACK, ...G3_ATTACK];
singleLegInjection('腿② ZH 必定真实族', 'EXIST_CONCL_ZH', '(?:真实|属实|确有其事|是真的|为真)', ZH_ATTACK);
singleLegInjection('腿② ZH 确实存在族', 'EXIST_CONCL_ZH', '(?:确实|的确|实有|确有)(?:存在|有过|发生过|是真的|属实)', ZH_ATTACK);
singleLegInjection('腿② ZH 否定性全称族', 'EXIST_CONCL_ZH', '(?:无效|无用|假的|不成立|错误|安全|无害|合规', ZH_ATTACK);
singleLegInjection('腿② ZH 裸可靠性族', 'EXIST_CONCL_ZH', '(?:可靠的|正确的|正当的|可行的|有效的|可信的|没有问题的)', ZH_ATTACK);
singleLegInjection('腿② EN genuine 族', 'EXIST_CONCL_EN', '(?:genuine|authentic|real|legitimate|bona', G4_ATTACK);
// 腿② EN 的 it must be 是两条冗余腿 → 族级注入
familyInjection('腿② EN it must be 族', 'EXIST_CONCL_EN', 'must|has\\s+to', G4_ATTACK);
// certainly 族只有 idx 7 一条腿，但 G4_ATTACK 里没有「certainly」形样本（都被
// must/genuine 腿兜底）——注入它专属形态的样本证承重
const G4_CERTAINLY = [
  'This effect has never been reproduced, therefore it is certainly real.',
];
familyInjection('腿② EN certainly 族', 'EXIST_CONCL_EN', 'certainly', G4_CERTAINLY);

// ─── SCIENCE_CONDUCT 守卫契约 ───────────────────────────────────
console.log('\n[r369 豁免守卫] SCIENCE_CONDUCT 否定守卫');
const SCI_ATTACK = [
  '至今没有人成功复现这个结果，因此该结果必定真实。',
  'The study has never been replicated, which means it must be a genuine discovery.',
];
for (const t of SCI_ATTACK) ok(check(t).hit === true, 'SCI 守卫后复现失败形仍判: ' + t.slice(0, 26));
// 守卫不得吃掉正当科学程序陈述
const SCI_BENIGN = [
  '可复现性是科学研究的基石。',
  'Reproducibility is essential to the scientific method.',
  '这项研究通过了同行评审。',
  '该论文已按可复现标准提交代码。',
];
for (const t of SCI_BENIGN) ok(check(t).hit === false, 'SCI 正当程序仍豁免: ' + t.slice(0, 22));

// ─── 合约 ───────────────────────────────────────────────────────
console.log('\n[r369 合约]');
ok(M.checkNegativeExistentialImport('毫无关系的普通陈述，与谬误无关') !== null, '未命中返回对象而非 null');
ok(M.checkNegativeExistentialImport('') .hit === false, '空串不判');
ok(M.checkNegativeExistentialImport('难道没有人见过龙吗？所以龙一定存在？').hit === false, '疑问句不判');

console.log(`\n[r369 汇总] ${pass} passed / ${fail} failed`);
if (fail > 0) { console.log('失败项:'); failures.forEach(f => console.log('  - ' + f)); process.exit(1); }
console.log('r369 negative_existential_import 补腿: ' + pass + ' passed / 0 failed');
