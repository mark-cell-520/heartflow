// [r480] curse_of_knowledge 第294维 变体矩阵实测探针（修订版）
// 同族 ≥5 变体（中英双语、裸名词、带修饰、倒装、长句）必须全部命中；
// ≥5 良性（必须含该族边缘良性）必须全部 pass。
// 判据口径（本族维度 gate 未接线前）：
//   · 模块层：checkCurseOfKnowledge(s).hit === true  → 命中
//   · 插件层：真实 HookBus dispatch 后 result._discrimination.curseOfKnowledge.totalHits > 0 → 承重
//   · gate() 的 action 是全维度汇总，非本族判据（本族未接 gate dimMap，
//     action=verify 可能由无关维度触发），故不作为本族命中口径，只记录供审计。
// 不写任何文件。
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const gateMod = require(path.join(HF, 'src', 'gate.js'));
const gate = gateMod.gate || gateMod.check;
const { checkCurseOfKnowledge: check } = require(path.join(HF, 'src', 'curse-of-knowledge.js'));
const { HookBus } = require(path.join(HF, 'src', 'core', 'hook-bus.js'));
const { PluginLoader } = require(path.join(HF, 'src', 'loader', 'plugin-loader.js'));

const ATTACK = [
  '这个结论但凡学过随机过程的人都懂，不用展开。',                                   // 基准
  '懂行的人一看就明白，此处从略。',                                                 // 裸名词式（无具体学科）
  '但凡修过这门课的人都不会有疑问，细节略过不谈。',                                 // 带修饰
  '不展开了，圈内人都清楚得很，写出来反而是浪费篇幅。',                             // 长句
  '这结论做过两次相关实验的人都懂，我要是再解释就是看不起读者。',                   // 倒装/反诘
  '读过三体的人都知道黑暗森林法则，这里无需再论证一遍。',                           // 文化共识
  'Anyone who has taken stochastic processes knows this, no explanation needed.',
  'Every econometrics student knows simultaneity bias, so I will skip it.',
  'This is obvious to practitioners, so the derivation is omitted here.',
  'People familiar with the IV exclusion restriction will see why it holds immediately.',
  'As is well known in this circle, further elaboration would be redundant.',
  'It goes without saying that the exclusion restriction must hold for the IV to be valid.',
];

const BENIGN = [
  '战争是多因共同造成的，不能只归因于单一因素。',                                   // 边缘良性：正确多因陈述
  '下面先复习停时定理，再给出完整推导过程。',                                       // 共识+展开承诺
  '鞅的性质在附录 A 中有完整证明，本文从略以便控制篇幅。',                           // 学术从略但非共识压迫
  '受过训练的研究者通常能复现该结果，详见补充材料第 2 节。',                         // 客观陈述
  'This argument has many contributing causes, so a single explanation is insufficient.',
  'For readers unfamiliar with the topic, we now derive the result from first principles.',
  'We omit the proof here; the full derivation appears in Appendix B.',
  'The instrument must satisfy the exclusion restriction, which we verify in Section 4.',
];

(async () => {
  // 插件层派发环境：真 PluginLoader + 真 HookBus（priority 升序，与生产一致）
  const hookBus = new HookBus();
  const hf = { _hookBus: hookBus };
  const loadRes = new PluginLoader(hf).loadAll();
  const loadedOk = (loadRes.loaded || []).some(p => p.name === 'curse-of-knowledge-check' && p.status === 'loaded');
  const dispatch = async (s) => {
    const result = { output: { conclusion: s }, _discrimination: {} };
    await hookBus.fire('postprocess.think', { input: s, result, engine: hf });
    const ck = result._discrimination && result._discrimination.curseOfKnowledge;
    return ck && ck.totalHits > 0;
  };

  let aOk = 0; const aMiss = [];
  console.log('=== ATTACK (must ALL hit: mod.hit && plugin dispatch) ===');
  for (const s of ATTACK) {
    const mod = !!check(s).hit;
    const plug = await dispatch(s);
    let gAction = 'n/a';
    try { const g = gate(s); gAction = (g && g.gate && g.gate.action) || 'none'; } catch (e) { gAction = 'ERR:' + e.message; }
    const pass = mod && plug;
    if (pass) aOk++; else aMiss.push({ s, mod, plug, gAction });
    console.log((pass ? 'HIT  ' : 'MISS ') + ' | mod=' + mod + ' plug=' + plug + ' gate=' + gAction + ' | ' + s.slice(0, 42));
  }

  let bOk = 0; const bFp = [];
  console.log('\n=== BENIGN (must ALL pass) ===');
  for (const s of BENIGN) {
    const mod = !!check(s).hit;
    const plug = await dispatch(s);
    const pass = !mod && !plug;
    if (pass) bOk++; else bFp.push({ s, mod, plug });
    console.log((pass ? 'PASS ' : 'FP   ') + ' | mod=' + mod + ' plug=' + plug + ' | ' + s.slice(0, 42));
  }

  console.log('\n=== 变体矩阵结果: 攻击命中 ' + aOk + '/' + ATTACK.length + '，良性 pass ' + bOk + '/' + BENIGN.length + ' ===');
  console.log('插件加载: ' + loadedOk + ' | failed: ' + JSON.stringify(loadRes.failed || []));
  if (aMiss.length) console.log('MISS 明细: ' + JSON.stringify(aMiss, null, 1));
  if (bFp.length) console.log('FP 明细: ' + JSON.stringify(bFp, null, 1));
  process.exit(aOk === ATTACK.length && bOk === BENIGN.length ? 0 : 1);
})();
