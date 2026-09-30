/**
 * r293 探针 3：跨引擎 gate 侧口径 —— 半角中文文本在 gate() 直调 vs checkOutput()
 *
 * 291/292 的结论是「两条入口跑不同形态」：gate() 直调走 toHalfWidthSafe（不动中文标点），
 * checkOutput() 走 runPipeline 入口 NFKC（折半角）。所以**同一条半角中文文本**
 * 在两条路径下判别输入不同。本探针量化这个差异到底影响多少 gate 判词。
 *
 * 方法：用 scripts/round-293/ 下自造的候选（中文 + 半角标点），
 * 同时跑 gate(text) 与 runPipeline({input:text}).gate / checkOutput(text)，
 * 比较 action。
 *
 * 只输出计数与动作变化，不输出中文原文。
 */
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const P = (...a) => console.log(...a);

const gateMod = require(path.join(ROOT, 'src', 'gate.js'));
const { checkOutput, runPipeline } = gateMod;

const FW2HALF = { '\uFF0C': ',', '\u3002': '.', '\uFF01': '!', '\uFF1F': '?', '\uFF1A': ':', '\uFF1B': ';', '\u3001': ',' };
function fold(s) { let r = s; for (const [a, b] of Object.entries(FW2HALF)) r = r.split(a).join(b); return r; }

// 候选：覆盖 doubt-engine / index / frame-check 常用的判别场景
// 形状描述列在注释，原文只在本文件出现一次（451 纪律）
const CANDS = [
  ['光速就是299792458米每秒。', 'knowledgeBoundary/claimed_exact_knowledge'],
  ['圆周率约等于3点14159。', 'knowledgeBoundary/precise'],
  ['根据最新研究数据2025年人口一定是14点1亿人。', 'knowledgeBoundary'],
  ['因为系统延迟很高所以用户流失了。', 'knowledgeBoundary/causal'],
  ['主要原因是数据库连接池配置不当。', 'knowledgeBoundary/causal_attribution'],
  ['这个东西就是不可变的常量而已。', 'knowledgeBoundary/simplified'],
  ['这是最好的解决方案，没有之一。', 'knowledgeBoundary/absolute'],
  ['我们完成了架构级重构。', 'knowledgeBoundary/self_aggrandizement'],
  ['它从一个空壳占位模块变成了真正的完整实现。', 'knowledgeBoundary/qualitative_leap'],
  ['我们堵住了三种绕过攻击的缺口。', 'knowledgeBoundary/self_scored'],
  ['你误解了，我的意思是可以的。', 'defensiveness/blaming'],
  ['其实我说的写的是可以这样做。', 'defensiveness/clarify'],
  ['只是用词不当的小问题。', 'defensiveness/weaken'],
  ['就算是延迟也还可以接受的。', 'defensiveness/concession'],
  ['但你要知道这个其实很简单。', 'defensiveness/deflect'],
  ['作为AI助手，我理解你的建议。', 'defensiveness/ai_identity'],
  ['这个方案完全可行，当然还有一些风险。', 'contradiction/family16'],
  ['这个设计绝对安全，可能有边界问题。', 'contradiction/family17'],
  ['真正的成长，是不再计较结果。', 'pseudo_profundity'],
  ['所有痛苦都源于幻觉。', 'pseudo_profundity'],
  ['这不是能力问题，而是维度不够。', 'pseudo_profundity'],
];

const rows = [];
for (const [txt, tag] of CANDS) {
  const fw = fold(txt);
  const half = fold(txt);
  let gDirect, gOut, gPipe;
  try { gDirect = gateMod.gate(txt).gate.action; } catch (e) { gDirect = 'ERR'; }
  try { gOut = checkOutput(txt).gate.action; } catch (e) { gOut = 'ERR'; }
  try {
    const r = typeof gateMod.runPipeline === 'function' ? runPipeline({ input: txt }) : null;
    gPipe = r && r.gate ? r.gate.action : 'N/A';
  } catch (e) { gPipe = 'ERR'; }
  rows.push({ tag, gDirect, gOut, gPipe });
}

P('══════ r293 探针 3：gate 直调 vs checkOutput 跨形态判词 ════');
P('口径：每个候选跑  gate(原文) / checkOutput(原文) / runPipeline(原文)\n');
let split = 0;
for (const r of rows) {
  const mark = (r.gDirect !== r.gOut) ? '  <== 分裂' : '';
  if (mark) split++;
  P(`  [${r.tag}] direct=${r.gDirect} checkOutput=${r.gOut} pipeline=${r.gPipe}${mark}`);
}
P(`\ngate() vs checkOutput() 判词不一致: ${split}/${rows.length}`);

// 反向：把候选整体折叠成半角再跑两条路
P('\n── 半角化后的候选（折叠句号逗号）──');
let split2 = 0;
for (const [txt, tag] of CANDS) {
  const half = fold(txt);
  let gDirect, gOut;
  try { gDirect = gateMod.gate(half).gate.action; } catch (e) { gDirect = 'ERR'; }
  try { gOut = checkOutput(half).gate.action; } catch (e) { gOut = 'ERR'; }
  const mark = (gDirect !== gOut) ? '  <== 分裂' : '';
  if (mark) split2++;
  P(`  [${tag}] direct=${gDirect} checkOutput=${gOut}${mark}`);
}
P(`\n半角候选下 gate() vs checkOutput() 不一致: ${split2}/${CANDS.length}`);
