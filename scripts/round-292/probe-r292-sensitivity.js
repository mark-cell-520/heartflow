/**
 * r292 探针 5：差分测法灵敏度自检 + 拆解 291 已修那个真缺口的完整形状
 *
 * 探针 4 得 0 分裂，但 291 轮明明坐实过 1 个真分裂（度量辩证族）。
 * 两种可能：①我的测法不灵敏 ②291 修的确实是孤例。
 * 本探针先做 ①：把 291 的已知分裂形状复现出来，看探针 4 的测法能否捕获。
 * 若捕获不到 → 测法有 bug，修正后再下结论。
 *
 * 安全纪律：原文全程留在本脚本内（脚本文件不是模型上下文的一部分），
 *           只输出统计与码位，绝不 print 样本原文。
 */
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gateMod = require(path.join(ROOT, 'src/gate.js'));
const pipe = require(path.join(ROOT, 'src/pipeline.js'));
const disc = require(path.join(ROOT, 'src/index.js'));

function pipeNormalize(input) {
  if (!/[\u2018\u2019\u201C\u201D\uFF01-\uFF5E]/.test(input)) return input;
  return input.normalize('NFKC').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}
const P = (...a) => console.log(...a);

// ─── 灵敏度基准：与 291 轮同族的探针样本 ───
// 形状：双分句 + 全角逗号隔开 + 后段出现「存在论动词」
// 用码位构造，避免原文进入日志
const CN = (s) => s;
const S = [];
// 族 1：度量辩证（291 已修）— 逗号后接度量类结论
S.push({ tag: 'metric-dialectic', text:
  CN('不是') + CN('因为') + CN('问题') + CN('不够') + CN('严重') +
  '\uFF0C' + CN('而是') + CN('因为') + CN('我们对') + CN('它的') + CN('认知') + CN('维度') + CN('还不够') + CN('高') + '\u3002' });
// 族 2：同族变体 — 换主语
S.push({ tag: 'metric-dialectic-2', text:
  '\u91CD' + '\u8981' + '\u7684' + '\u4E0D' + '\u662F' + '\u95EE' + '\u9898' + '\u672C' + '\u8EAB' +
  '\uFF0C' + CN('而是') + CN('我们') + CN('衡量的') + CN('尺度') + CN('出了问题') + '\u3002' });
// 族 3：不带哲学词的对照（应两路径都 pass，验证不误报）
S.push({ tag: 'control-plain', text:
  CN('这个') + CN('方案') + CN('的') + CN('问题') + CN('不在于') + CN('预算') + '\uFF0C' + CN('在于') + CN('排期') + CN('太紧') + '\u3002' });

P('══════ r292 探针 5：差分测法灵敏度自检 ══════');
for (const s of S) {
  const fw = s.text;
  const folded = pipeNormalize(fw);
  // A 路径：直调 gate（不 NFKC）
  let a1, a2, d1;
  try { const r = gateMod.gate(fw); a1 = r.gate.action; d1 = (r.trace || []).map(t => t.dimension).filter(Boolean).slice(0, 4); } catch (e) { a1 = 'ERR:' + e.message; d1 = []; }
  // B 路径：pipeline runPipeline（真实入口，含 NFKC）
  try { const r2 = pipe.runPipeline ? pipe.runPipeline({ input: fw, mode: 'output' }) : null; a2 = r2 && r2.gate ? r2.gate.action : 'N/A'; } catch (e) { a2 = 'ERR'; }
  P(`\n── ${s.tag} ──`);
  P(`  gate直调(原文字符串): ${a1}  dims=${JSON.stringify(d1)}`);
  P(`  runPipeline(NFKC入口): ${a2}`);
  P(`  折叠是否改变文本: ${folded !== fw}`);
}

// ─── 关键：直接跑维度函数层，看全角 vs 半角的命中差 ───
P('\n══════ 维度函数层直测（discriminate 全角 vs 半角）══════');
for (const s of S) {
  try {
    const a = disc.discriminate ? disc.discriminate(s.text) : null;
    const folded = pipeNormalize(s.text);
    const b = a ? disc.discriminate(folded) : null;
    const ppA = a && a.pseudo_profundity ? a.pseudo_profundity.score : 'N/A';
    const ppB = b && b.pseudo_profundity ? b.pseudo_profundity.score : 'N/A';
    P(`  ${s.tag}: pp全角=${ppA}  pp半角=${ppB}`);
  } catch (e) { P(`  ${s.tag}: ERR ${e.message}`); }
}
