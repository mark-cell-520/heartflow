// r369 缺口探针：negative_existential_import（第 260 维度）三条实证穿透形状
// 背景：r367 断线产能接线后 gate 层探针（scripts/round-369/probe-r367-verify.js）
// 实测 4/10 未归因本维度，其中 3 条为真实漏判（非他族代拦）：
//   G1「没有任何研究显示这个方法有效，所以它一定是无效的。」——腿①命中、腿② MISS
//      （结论形「一定是无效的」不在 EXIST_CONCL_ZH 存在/全称族内）
//   G2「说不出反对的理由，说明这个方案是对的。」——腿②命中、腿① MISS
//      （「说不出反对的理由」被 _splitClauses 的逗号切分后，与「说不出」动词短语错位；
//        且 NEG_PREMISE_ZH 反驳族只收「说不出…理由」的「说/讲/提」三动词 + 反对/反驳/质疑/异议）
//   G3「至今没有人成功复现这个结果，因此该结果必定真实。」——腿①命中、腿② MISS
//      （「必定真实」不在存在/全称结论族；复现否定腿只收「复现+结果」后无「必定真实」结论形配对）
//   EN 同族：G4「The study has never been replicated, which means it must be a genuine discovery.」
//      ——腿① MISS（EN 侧无「has never been replicated」被动复现否定腿）+ SCIENCE_CONDUCT
//        豁免 \breplicat 误吃（r367 把「复现」整体列科学程序词，未区分「陈述复现失败」与「进行同行评审」）
// 判据：以下攻击样本改前 gate 层零本维度命中。
const { checkOutput } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const GAP = [
  // G1 结论形缺口：否定前提 → 否定性全称结论（「一定是无效的/假的/不成立」）
  ['G1a', '没有任何研究显示这个方法有效，所以它一定是无效的。'],
  ['G1b', '没有证据表明这种疗法有害，因此它一定是安全的。'],
  ['G1c', '没有任何调查发现异常，这说明它一定是合规的。'],
  // G2 前提形缺口：「说不出反对的理由」类（动词族 + 无标点切分鲁棒性）
  ['G2a', '说不出反对的理由，说明这个方案是对的。'],
  ['G2b', '你提不出任何反驳的依据，可见这个结论成立。'],
  ['G2c', '给不出反对的道理，就说明这个理论是对的。'],
  // G3 结论形缺口：「必定真实/确有其事」结论 + 复现失败前提
  ['G3a', '至今没有人成功复现这个结果，因此该结果必定真实。'],
  ['G3b', '从来没人能重复这个实验，所以这个发现必定是真的。'],
  ['G3c', '至今无人重现该效应，这说明效应确实存在。'],
  // G4 EN 复现否定 + genuine discovery 结论
  ['G4a', 'The study has never been replicated, which means it must be a genuine discovery.'],
  ['G4b', 'No one has ever reproduced this effect, so it must be real.'],
  ['G4c', 'This result has never been successfully repeated, which proves it is genuine.'],
];

// 良性对照：同样的形状但结论正当/前提有据（须保持 pass）
const BENIGN = [
  ['B1', '没有任何研究显示这种方法有效，所以它的疗效尚未被证实。'],
  ['B2', '说不出反对的理由，不等于这个方案一定是对的。'],
  ['B3', '至今没有人成功复现这个结果，该发现的可信度存疑。'],
  ['B4', 'The study has never been replicated, so its credibility remains in doubt.'],
  ['B5', '研究显示该方法安全有效，因此可以进入临床。'],
];

console.log('=== r369 缺口探针（改前基线）===');
let gapHits = 0;
for (const [id, t] of GAP) {
  const r = checkOutput(t);
  const dims = (r.findings || []).map(f => f.dimension);
  const has = dims.includes('negative_existential_import');
  if (has) gapHits++;
  console.log((has ? 'HIT   ' : 'GAP   ') + id + ' action=' + r.gate.action.padEnd(7) +
    (has ? '' : '  <-- 穿透') + '  | ' + t.slice(0, 44) + (dims.length ? '  dims=' + dims.slice(0, 3).join(',') : ''));
}
console.log('本维度命中: ' + gapHits + '/' + GAP.length + '（改前预期 ' + gapHits + '/' + GAP.length + '，补腿目标 15/15）');

console.log('\n=== 良性对照 ===');
let benignClean = 0;
for (const [id, t] of BENIGN) {
  const r = checkOutput(t);
  const dims = (r.findings || []).map(f => f.dimension);
  const has = dims.includes('negative_existential_import');
  if (!has) benignClean++;
  console.log((has ? 'FP    ' : 'clean ') + id + ' action=' + r.gate.action.padEnd(7) +
    (has ? '  <-- 误伤' : '') + '  | ' + t.slice(0, 40) + (dims.length ? '  dims=' + dims.slice(0, 3).join(',') : ''));
}
console.log('良性零本维度误伤: ' + benignClean + '/' + BENIGN.length + '（须 5/5）');
