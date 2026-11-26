#!/usr/bin/env node
// test/round-479-curse-of-knowledge.test.js
// r479 TDD — 第 294 维度 curse_of_knowledge（知识的诅咒/解释坍缩）
// 族定义：解读者把专业共同体内部共识当作受众共享前提，未做任何转译
//   即推进论证——用「圈内人都懂」豁免解释义务，使论证的可验证性
//    silently 坍缩到仅同行可读。
//   腿① CONSENSUS_ZH/EN：专业共识断言（黑话术语在场 + 认定受众同专业：
//     学过…的都懂 / 做这行的都熟悉 / 圈内人不需要 / Anyone familiar with
//     / every econometrics student knows / It goes without saying that）
//   腿② COLLAPSE_ZH/EN：解释坍缩（跳过展开/不赘述/不用再解释/不需要
//     解释/我就跳过了/skip the derivation/no explanation needed/
//     should not need spelling out）
// 双腿 AND 才判；单腿（术语在场但承诺展开 / 坍缩陈述但无专业归属）不判。
// 先红：未实现前 A/B 段全部 fail；实现后全绿。
'use strict';
const assert = require('node:assert');
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const gateMod = require(path.join(HF, 'src', 'gate.js'));
const gate = gateMod.gate || gateMod.check || gateMod.checkOutput;
const MODULE = path.join(HF, 'src', 'curse-of-knowledge.js');

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log('PASS: ' + name); } catch (e) { failed++; console.log('FAIL: ' + name + ' — ' + e.message); }
}
// [r480 修订] C 段为插件层异步 hook 端到端。上一轮自造的 _mkHookBus
// 假 HookBus 不读 opts.priority、按注册序 fire，与生产契约不符：
// 生产 src/core/hook-bus.js:45 on(event, handler, opts) 记录 opts.priority，
// :111 fire() 按 priority 升序 dispatch。注册序下 sycophancy-check
// （pri 180，注册最末）最后整体替换 result._discrimination，冲掉
// curse-of-knowledge-check（pri 200）写入的 curseOfKnowledge 键——
// 即「桩不排序」被误读成「产品未接线」。
// 修法：改用生产真实 HookBus，契约一致，失败必须真实。
const { HookBus } = require(path.join(HF, 'src', 'core', 'hook-bus.js'));
function _mkHookBus() { return new HookBus(); }
async function _probePlugin(samples) {
  const { PluginLoader } = require(path.join(HF, 'src', 'loader', 'plugin-loader.js'));
  const hookBus = _mkHookBus();
  const hf = { _hookBus: hookBus };
  const res = new PluginLoader(hf).loadAll();
  const out = { loadedOk: (res.loaded || []).some(p => p.name === 'curse-of-knowledge-check' && p.status === 'loaded'), failed: res.failed || [], snapshots: [] };
  for (const s of samples) {
    const result = { output: { conclusion: s }, _discrimination: {} };
    await hookBus.fire('postprocess.think', { input: s, result, engine: hf });
    out.snapshots.push({ s, ck: result._discrimination && result._discrimination.curseOfKnowledge });
  }
  return out;
}

// ─── A) 模块层攻击（同族变体：中英、裸名词、带修饰、倒装、长句）──────────
const ATTACK_ZH = [
  // 共识断言 × 坍缩（中文）
  '这个结论但凡学过随机过程的人都懂，不用展开。',
  '只要看 Fst 值就知道这两群已经分化了，这还需要解释？',
  '简单说就是贝叶斯后验被先验带跑了，你肯定一听就明白。',
  '细节见规范第 3.2 节，做这行的都熟悉，不赘述。',
  '这属于常识性问题，圈内人不需要我再解释一遍。',
  '结论很直白：两阶段最小二乘的工具变量在这里外生了，行家一看就懂。',
  '这么基础的推导还要我写？看论文的人都明白。',
  '细节就不展开了，反正你们团队都是搞这个的。',
  // 倒装/长句
  '但凡接触过计量经济学的人都知道，这里的内生性会让 OLS 估计有偏，这一点我想不需要再展开。',
  '既然读者都是做分布式系统的，CAP 定理的推导过程我就直接跳过了。',
];
const ATTACK_EN = [
  'Anyone who has taken stochastic processes knows this, no explanation needed.',
  'Needless to say, telomere length is directly tied to cellular aging.',
  'As everyone in this field knows, conjugate priors are the obvious choice.',
  // [r479 修订] 原样本缺腿①（无受众同专业认定）——「makes the divergence
  // clear」只是自明系动词，不是共识断言。补腿①后重立：
  'The Fst value makes the divergence clear, and anyone familiar with population genetics will see it immediately — this should not need spelling out.',
  'Obviously the posterior is dragged by the prior; you can see it immediately.',
  'This is textbook stuff for anyone in the field, so I will skip the derivation.',
  'Anyone familiar with OLS will see immediately why the estimator is biased here.',
  'It goes without saying that the instrumental variable must satisfy exclusion.',
  'Every econometrics student knows what simultaneity bias means.',
  'Since your team works on this daily, I will leave the implementation details unstated.',
  // [r479 修订] 句首元共识副词形（Obviously/Clearly + 坍缩腿）
  'Clearly the endogeneity bias is present here, so there is no need to spell it out.',
];

// ─── B) 良性（含边缘良性：教学展开形 / 科普意图形 / 术语定义 / 数据引用）──
const BENIGN = [
  // 边缘良性：明确承诺展开（坍缩词在场但被展开承诺抵消）
  '这个结论但凡学过随机过程的人都懂，但我还是从定义开始讲一遍。',
  '细节见规范第 3.2 节，我在这里把关键部分复述一遍。',
  '结论很直白：两阶段最小二乘的工具变量在这里外生了，我展开讲一遍，先看第一阶段。',
  'This is textbook stuff for anyone in the field, so let me walk through the derivation step by step.',
  // 边缘良性：科普意图
  '这属于常识性问题，但我尽量用通俗的话讲清楚。',
  // 术语定义句（概念讨论）
  'CAP 定理指的是：在分布式系统中，一致性、可用性与分区容错性三者不可同时满足。',
  'Fst 值衡量两个群体间的遗传分化程度，取值 0 到 1，越大表示分化越明显。',
  'Instrumental variable exclusion means the instrument affects the outcome only through the treatment.',
  // 数据引用/严谨表述
  '图 3 显示两群在 PC1 上明显分离，Fst=0.21，与地理距离正相关。',
  '实验设计见附录 A，样本量与排除标准按预注册方案执行。',
  'The gradient oscillates because the learning rate exceeds the stability bound; see eq. 12.',
  '结论仅在样本范围内成立，外推需谨慎。',
];

let mod = null;
try { mod = require(MODULE); } catch (e) { mod = null; }
const check = mod && (mod.checkCurseOfKnowledge || mod.detectCurseOfKnowledge);

console.log('-- A 模块层攻击 ' + (ATTACK_ZH.length + ATTACK_EN.length) + ' 条（应全命中）');
t('A: 攻击全命中（模块层 hit === true）', () => {
  assert.ok(check, '模块未导出 checkCurseOfKnowledge/detectCurseOfKnowledge');
  const miss = [];
  for (const s of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = check(s);
    if (!r || !r.hit) miss.push(s);
  }
  assert.strictEqual(miss.length, 0, '未命中 ' + miss.length + ' 条: ' + JSON.stringify(miss, null, 1));
});

console.log('-- B 良性 ' + BENIGN.length + ' 条（应零命中）');
t('B: 良性零命中（模块层）', () => {
  assert.ok(check, '模块未导出检测函数');
  const fp = [];
  for (const s of BENIGN) {
    const r = check(s);
    if (r && r.hit) fp.push(s);
  }
  assert.strictEqual(fp.length, 0, '误伤: ' + JSON.stringify(fp, null, 1));
});

// ─── C) 插件层端到端 ────────────────────────────────────────────
// hook 链是 async，先预跑收集快照（await），再同步断言。
let _C_ATTACK = null, _C_BENIGN = null, _C_PROBE_ERR = null;
(async () => {
  try {
    _C_ATTACK = await _probePlugin(ATTACK_ZH.concat(ATTACK_EN));
    _C_BENIGN = await _probePlugin(BENIGN);
  } catch (e) { _C_PROBE_ERR = e; }
})();
// 上面 IIFE 在模块顶层启动，微任务在同步代码之后才执行——故 C 段断言
// 不能在此处同步跑。改用：把 C 段断言注册为 t()，但在进程 exit 前
// 以 await 方式执行（见文件末尾 runner）。
const _C_TESTS = [];
function tc(name, fn) { _C_TESTS.push({ name, fn }); }

console.log('-- C 插件层端到端（postprocess.think hook → _discrimination.curseOfKnowledge）');
// [r479 修订] C 段原测 gate() 端到端（findings 含 curse_of_knowledge）——
// 那要求改 src/index.js 的 dimMap/allDims/score 等六处接入点，属 1 号
// 写权限（本轮禁碰）。本轮实际接线路径是 r295 econ-reasoning-check
// 既定先例的插件层：PluginLoader 自动扫描 src/plugins/ 目录 →
// init(hf, ctx) 挂 postprocess.think hook → 写 result._discrimination.
// curseOfKnowledge。故 C 段改测该真实 dispatch 路径：用真 PluginLoader
// 实例化全部插件，喂结论文本，断言 _discrimination 承重。
tc('C1: 新族攻击经插件 hook 写入 _discrimination.curseOfKnowledge', () => {
  assert.ok(!_C_PROBE_ERR, '插件探针异常: ' + (_C_PROBE_ERR && _C_PROBE_ERR.message));
  assert.strictEqual(_C_ATTACK.loadedOk, true, '插件未被 PluginLoader 自动加载: ' + JSON.stringify(_C_ATTACK.failed));
  const miss = _C_ATTACK.snapshots.filter(x => !x.ck || x.ck.totalHits === 0).map(x => x.s);
  assert.strictEqual(miss.length, 0, '插件未承重 ' + miss.length + ' 条: ' + JSON.stringify(miss, null, 1));
});
tc('C2: 良性样本经插件 hook 不写 curseOfKnowledge', () => {
  assert.ok(!_C_PROBE_ERR, '插件探针异常: ' + (_C_PROBE_ERR && _C_PROBE_ERR.message));
  const fp = _C_BENIGN.snapshots.filter(x => x.ck && x.ck.totalHits > 0).map(x => x.s);
  assert.strictEqual(fp.length, 0, '插件误伤: ' + JSON.stringify(fp, null, 1));
});
tc('C3: 插件导出的 analyze() 与模块检测同结果（无第二套真相）', () => {
  const plug = require(path.join(HF, 'src', 'plugins', 'curse-of-knowledge-check', 'index.js'));
  assert.ok(typeof plug.analyze === 'function', '插件未导出 analyze()');
  const s = ATTACK_ZH[0];
  const viaPlugin = plug.analyze(s);
  const viaModule = check(s);
  assert.ok(viaPlugin && viaPlugin.totalHits > 0, '插件 analyze 未命中');
  assert.strictEqual(!!(viaModule && viaModule.hit), viaPlugin.totalHits > 0, '插件与模块判定不一致');
});

console.log('-- D 单腿不判（双腿 AND 承重证明）');
t('D1: 只腿②坍缩（无专业共识归属）不判', () => {
  assert.ok(check, '模块未导出检测函数');
  const oneLeg = [
    '这部分我省略不写了，大家将就看。',
    '推导过程太长了，这里就不写了。',
    'I will skip the derivation to save space.',
    'The details are too long to include here.',
  ];
  for (const s of oneLeg) {
    const r = check(s);
    assert.ok(!r || !r.hit, '单腿不应命中: ' + s);
  }
});
t('D2: 只腿①共识（无坍缩）不判', () => {
  assert.ok(check, '模块未导出检测函数');
  const oneLeg = [
    '学过随机过程的人都知道鞅的性质，我们先复习一下停时定理。',
    '做芯片设计这一行的都清楚时序收敛的判据，下面给出完整推导。',
    'Anyone who has taken stochastic processes knows this, so here is the proof in full.',
    'Every econometrics student knows simultaneity bias, and the appendix derives it from scratch.',
  ];
  for (const s of oneLeg) {
    const r = check(s);
    assert.ok(!r || !r.hit, '单腿不应命中: ' + s);
  }
});

console.log('-- E 否定守卫');
t('E1: 否定前缀不判', () => {
  assert.ok(check, '模块未导出检测函数');
  const neg = [
    '这并不是说学过随机过程的人就懂，我们从头讲起。',
    '不能因为大家都熟悉就跳过，规范第 3.2 节我会完整引用。',
    'It is not true that everyone in this field already knows this, so I will derive it here.',
  ];
  for (const s of neg) {
    const r = check(s);
    assert.ok(!r || !r.hit, '否定句不应命中: ' + s);
  }
});

// ─── F) [r480] 变体矩阵新发现缺口（上一轮探针未覆盖的 6 条）──────────
// r480 变体矩阵实测暴露 6 条同族穿透：2 条中文缺腿②、4 条英文缺腿。
// 先立测试（红），再补腿。这些样本与 A 段不重复，属同族不同措辞形态。
const GAP_ATTACK = [
  // 中文：腿①「做过两次相关实验的人都懂」命中 CONSENSUS_ZH[0]，
  // 但「我要是再解释就是看不起读者」非坍缩腿——反诘式贬损性坍缩。
  '这结论做过两次相关实验的人都懂，我要是再解释就是看不起读者。',
  // 中文：「读过三体的人都知道」命中 CONSENSUS_ZH[0]，
  // 「这里无需再论证一遍」缺腿②——「论证」未入坍缩词表。
  '读过三体的人都知道黑暗森林法则，这里无需再论证一遍。',
  // 英文：This is obvious to practitioners（受众同专业认定，元共识形）
  // + the derivation is omitted（被动省略形）双腿均缺。
  'This is obvious to practitioners, so the derivation is omitted here.',
  // 英文：People familiar with the IV exclusion restriction（受众同专业认定）
  // + will see why it holds immediately（当场自明形）双腿均缺。
  'People familiar with the IV exclusion restriction will see why it holds immediately.',
  // 英文：As is well known in this circle（元共识断言）+ further elaboration
  // would be redundant（冗余性坍缩）双腿均缺。
  'As is well known in this circle, further elaboration would be redundant.',
  // 中文：反诘坍缩「细节略过不谈」——省略动词形（略过）缺收尾。
  '但凡修过这门课的人都不会有疑问，细节略过不谈。',
];
console.log('-- F 变体矩阵缺口（r480 新发现，补腿后必须全命中）');
t('F1: 变体矩阵新发现缺口全命中', () => {
  assert.ok(check, '模块未导出检测函数');
  const miss = [];
  for (const s of GAP_ATTACK) {
    const r = check(s);
    if (!r || !r.hit) miss.push(s);
  }
  assert.strictEqual(miss.length, 0, '未命中 ' + miss.length + ' 条: ' + JSON.stringify(miss, null, 1));
});
// 补腿不得误伤：与缺口同构的良性边缘样本必须继续 pass。
t('F2: 补腿后边缘良性不误伤', () => {
  assert.ok(check, '模块未导出检测函数');
  const edge = [
    '战争是多因共同造成的，不能只归因于单一因素。',                       // 正确多因陈述
    '下面先复习停时定理，再给出完整推导过程。',                           // 共识+展开承诺
    '鞅的性质在附录 A 中有完整证明，本文从略以便控制篇幅。',               // 学术从略非共识压迫
    '受过训练的研究者通常能复现该结果，详见补充材料第 2 节。',             // 客观陈述
    'This argument has many contributing causes, so a single explanation is insufficient.',
    'For readers unfamiliar with the topic, we now derive the result from first principles.',
    'We omit the proof here; the full derivation appears in Appendix B.',
    'The instrument must satisfy the exclusion restriction, which we verify in Section 4.',
  ];
  const fp = [];
  for (const s of edge) {
    const r = check(s);
    if (r && r.hit) fp.push(s);
  }
  assert.strictEqual(fp.length, 0, '误伤: ' + JSON.stringify(fp, null, 1));
});

// ─── runner：C 段依赖异步 hook 探针，须在微任务清空后执行 ────
(async () => {
  // 等待 _probePlugin IIFE 落地（两轮探针各 22/12 条样本）
  for (let i = 0; i < 50 && (!_C_ATTACK || !_C_BENIGN) && !_C_PROBE_ERR; i++) {
    await new Promise(r => setImmediate(r));
  }
  for (const c of _C_TESTS) t(c.name, c.fn);
  console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
  process.exit(failed > 0 ? 1 : 0);
})();
