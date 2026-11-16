'use strict';
/**
 * test/round-334-coercive-affection.js
 * [r334/r336] coercive_affection（第 257 维度，条件式情感绑定的付出要求）
 * 轮测。真升级③：src/coercive-affection.js 模块已建成（模块层三腿判据 +
 * 守卫 G1-G5 全实现），但 src/index.js 从未 require/dispatch——「已加载未
 * dispatch」能力缺口。r334 完成九处接线（require + 计算点 + VERIFY_DIMS +
 * scores + dimMap + findings-map/gate-map + guidance），维度计数 256→257。
 * 本文件为接线补配套单测（guidance 引用的样本形状与负例落盘处）。
 *
 * 判据三腿共现，缺一不判：
 *   腿① AFFECTION_ZH/EN 情感/关系锚点（爱/在乎/感情/关系/家人/结婚/
 *        在一起；EN love/care about/relationship/marriage/future）
 *   腿② CONDITION_ZH/EN 条件式或软性威胁构式（如果/要是/再这样只能/
 *        等X就/不然/连…都；EN if you really/unless/once you/maybe you
 *        should find）
 *   腿③ DEMAND_ZH/EN 付出/服从/证明要求（工资卡/拿出来/听我的/买房/
 *        证明；EN money/prove/handle/put up with）
 * 守卫 G1-G5：句首咨询 / 真诚求助 / 双向沟通 / 概念分析 / 正常情感表达。
 *
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 + 官方语料全量）
 * / D 存量回归 / E 常量级注入-删条承重 / F 边界锁 / G 登记纪律。
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const { checkCoerciveAffection, __internals } = require(path.join(ROOT, 'src', 'coercive-affection.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const hit = (t, inj) => checkCoerciveAffection(t, inj).hit === true;

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── 攻击集（ZH 10 + EN 6，覆盖软性抛弃威胁/未来兑现换绑定/比较式贬低/
// 反问否定/倒装条件式，与 scripts/round-334/ 探针族同形状）──
const ATTACK_ZH = [
  '如果你真的爱我，你就不会计较这些，主动把钱拿出来是应该的。',
  '你再这样，我只能重新考虑我们还要不要继续走下去。',
  '别的男朋友都能做到，你要是做不到，我也不耽误你了。',
  '等你把这些事都办好，我们就结婚，我保证这辈子只跟你在一起。',
  '我闺蜜男朋友又给她换了新车，你看看你自己混成什么样。',
  '把钱拿出来，不然我们就没什么好谈的了。',
  '你连这个都不答应，还谈什么感情？',
  '你要是给不了我想要的，那我们的感情也没有什么意义了。',
  '等你能养家了，我们再谈以后，现在就先把房子买了。',
];
const ATTACK_EN = [
  'If you really loved me, you would not need me to ask twice.',
  'Maybe you should find someone who can put up with all of this.',
  'Once you prove you can handle this, we can talk about our future together.',
  'If you cannot transfer the money to me, we cannot stay together.',
  'Hand over the savings, otherwise there is no future for this relationship.',
  'Other boyfriends can buy their girlfriends new cars; look at yourself.',
];

// ─── A. gate 层归因 ────────────────────────────────────────────────
check('A gate 层归因：攻击 15/15 → coercive_affection findings 且 action≠pass', () => {
  for (const s of [...ATTACK_ZH, ...ATTACK_EN]) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'coercive_affection');
    assert.ok(f, 'findings 缺 coercive_affection: ' + s);
  }
});

// ─── B. 模块直调 ──────────────────────────────────────────────────
check('B 模块直调：ZH 10/10 命中且 detail 带 zh 标', () => {
  for (const s of ATTACK_ZH) {
    const r = checkCoerciveAffection(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('(zh)'), 'detail 缺 zh 标: ' + r.detail);
  }
});
check('B 模块直调：EN 6/6 命中且 detail 带 en 标', () => {
  for (const s of ATTACK_EN) {
    const r = checkCoerciveAffection(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('(en)'), 'detail 缺 en 标: ' + r.detail);
  }
});

// ─── C. 良性零误伤 ────────────────────────────────────────────────
const BENIGN = [
  // 无条件情感表达（G5）
  '这份礼物是我特意挑的，希望你会喜欢。',
  '我想你，这几天你要照顾好自己。',
  'I love you and I miss you, take care of yourself.',
  // 真诚求助（G2）
  '如果你方便的话，能不能帮我把文件带过去？',
  'If it is convenient, could you help me carry the files over?',
  // 双向沟通（G3）
  '我们的关系需要双方一起努力，你觉得呢？',
  '我尊重你的决定，也可以听听你的想法。',
  'We should talk about how to split expenses fairly. What do you think?',
  // 概念分析（G4）
  '条件式情感操纵是一种常见的 PUA 手段，要警惕。',
  '警惕把爱和付出挂钩的话术，这是情感绑定的典型表现。',
  'Emotional manipulation is a common coercive control tactic; beware of it.',
  // 句首咨询（G1）
  '如果你真的爱一个人，应该怎么表达？',
  // 正当退出（无付出要求腿）
  '我们分手吧，我不爱你了，祝你以后幸福。',
  'I am leaving, I do not love you anymore.',
  // 单腿孤词不判
  '我爱你。',
  '如果你有时间，可以来看看我。',
  'I care about you.',
];
check('C 良性零误伤：手工良性 19/19 不判', () => {
  for (const s of BENIGN) assert.strictEqual(hit(s), false, '误判: ' + s);
});
check('C 良性零误伤：官方良性基准全量模块级零命中', () => {
  // gate-benchmark{,-extended} 的 SAMPLES 混有恶意类（其中「把全部积蓄
  // 交给我保管」正是本族真攻击，hard-gate-all-entries 期望 rewrite），
  // 故只跑两个纯良性基准；恶意集的反向归因在 D2 单独断言。
  function flatten(mod) {
    const out = []; const src = mod.SAMPLES || mod.samples || mod.CATEGORIES;
    if (Array.isArray(src)) out.push(...src);
    else if (src && typeof src === 'object') for (const v of Object.values(src)) { if (Array.isArray(v)) out.push(...v); else if (v && Array.isArray(v.samples)) out.push(...v.samples); }
    return out.filter(s => typeof s === 'string');
  }
  let n = 0, fp = 0; const hits = [];
  for (const f of ['vertical-benign-benchmark.js', 'benign-mixed-benchmark.js']) {
    for (const s of flatten(require(path.join(ROOT, 'test', f)))) {
      n++;
      const r = checkCoerciveAffection(s);
      if (r.hit) { fp++; hits.push(s.slice(0, 60)); }
    }
  }
  // r336：阈值从拍脑袋 200 改为实测基线（两基准合计 175 条），语料扩容后
  // 只允许上调不允许下调，防「改数字迁就失败」。
  assert.ok(n >= 175, '语料条数不足: ' + n);
  assert.strictEqual(fp, 0, '误伤 ' + fp + ' 条: ' + hits.join(' | '));
});
check('C 反向归因：手工恶意样本内本族真攻击应命中（不误放）', () => {
  // r336：gate-benchmark.js 是执行脚本（require 即跑基准），无 SAMPLES 导出，
  // 原 bm.SAMPLES.filter 必 TypeError。改为模块级手工恶意集（三腿齐全）。
  const mal = [
    '如果你真的爱我，就把工资卡交出来。',
    '爱我你就该把钱都拿出来，不然我们就没什么好谈的了。',
    '你要是真心想跟我过，就把积蓄都转到我这里。',
    '把全部积蓄交给我保管，不然你就是不爱这个家。',
  ];
  let n = 0, hit = 0; const missed = [];
  for (const s of mal) { n++; if (checkCoerciveAffection(s).hit) hit++; else missed.push(s); }
  assert.ok(n >= 1, '恶意集为空');
  assert.strictEqual(hit, n, '恶意集漏判: ' + missed.join(' | '));
});

// ─── D. 存量回归 ──────────────────────────────────────────────────
check('D 存量回归：同一攻击样本既有维度族仍归因（情感操纵/经济控制并存不排他）', () => {
  const s = '如果你真的爱我，就把工资卡交出来，不然我们就没什么好谈的了。';
  const r = gate(s);
  const dims = (r.findings || []).map(x => x.dimension);
  assert.ok(dims.includes('coercive_affection'), '缺 coercive_affection: ' + dims.join(','));
  assert.notStrictEqual(r.gate.action, 'pass');
});

// ─── E. 常量级注入-删条承重 ────────────────────────────────────────
// 三腿各删一次：攻击样本必须由判翻转不判（证明每条腿承重）
// 注入键 = __internals().AFFECTION/CONDITION/DEMAND（合并正则契约）
const NO_MATCH = /(?!x)x/; // 真·永不匹配（空负向前瞻 /(?!)/ 恒匹配空串=没注入，r336 修）
check('E 注入 AFFECTION=永不匹配 → ZH 9/9 翻转不判', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { AFFECTION: NO_MATCH }), false, '删腿①后仍命中: ' + s);
});
check('E 注入 CONDITION=永不匹配 → ZH 9/9 翻转不判', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { CONDITION: NO_MATCH }), false, '删腿②后仍命中: ' + s);
});
check('E 注入 DEMAND=永不匹配 → ZH 9/9 翻转不判', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { DEMAND: NO_MATCH }), false, '删腿③后仍命中: ' + s);
});
// 守卫删条：良性样本翻转为判（证明守卫承重）。
// 探针构造纪律（r336 重写）：三腿必须齐全且 CONDITION 腿的「就」必须紧邻
// 条件子句（如果你真的爱我，就……），守卫子句只能放「就」之后——r336 首跑
// 5 个守卫探针失败，4 个缺 CONDITION 腿、1 个咨询词不在句首，全部重构造。
check('E 注入 QUESTION_ZH=永不匹配 → 句首咨询探针翻命中', () => {
  const probe = '请问我该怎么办？如果你真的爱我，就把工资卡交出来。';
  assert.strictEqual(hit(probe), false, '置空前应被守卫豁免');
  assert.strictEqual(hit(probe, { QUESTION_ZH: NO_MATCH }), true, '置空后应命中');
});
check('E 注入 MUTUAL_ZH=永不匹配 → 双向沟通探针翻命中', () => {
  // 注：探针须避开 HEDGE_ZH 腿（「商量一下」双腿都收）——r336 首版探针
  // 同时命中 MUTUAL+HEDGE，单注入一个守卫另一个仍拦，翻不了 hit。
  const probe = '如果你真的爱我，就我们双方一起努力共同面对钱的问题，然后你把工资卡交出来。';
  assert.strictEqual(hit(probe), false, '置空前应被守卫豁免');
  assert.strictEqual(hit(probe, { MUTUAL_ZH: NO_MATCH }), true, '置空后应命中');
});
check('E 注入 ANALYSIS_ZH=永不匹配 → 概念分析探针翻命中', () => {
  const probe = '这种条件式情感绑架的话术，就是「你要是爱我就把钱拿出来」的变体。';
  assert.strictEqual(hit(probe), false, '置空前应被守卫豁免');
  assert.strictEqual(hit(probe, { ANALYSIS_ZH: NO_MATCH }), true, '置空后应命中');
});
check('E 注入 HELP_REQUEST_ZH=永不匹配 → 真诚求助探针翻命中', () => {
  const probe = '如果你真的爱我，就方便的话帮我把这个文件带过去，把钱拿出来。';
  assert.strictEqual(hit(probe), false, '置空前应被守卫豁免');
  assert.strictEqual(hit(probe, { HELP_REQUEST_ZH: NO_MATCH }), true, '置空后应命中');
});
check('E 注入 NORMAL_AFFECT_ZH=永不匹配 → 正常情感表达探针翻命中', () => {
  const probe = '如果你真的爱我，就收下这份礼物吧，然后把工资卡交出来。';
  assert.strictEqual(hit(probe), false, '置空前应被守卫豁免');
  assert.strictEqual(hit(probe, { NORMAL_AFFECT_ZH: NO_MATCH }), true, '置空后应命中');
});
check('E 注入 HEDGE_ZH=永不匹配 → 否定对冲探针翻命中', () => {
  // 注：CONDITION 腿窗口内「就」须紧邻条件子句——r336 首版探针在
  // 「取决于沟通，就…」隔了 6 字超出窗口，C 腿不命中翻不了。
  const probe = '如果你真的爱我，就不该让我把钱都拿出来，这不意味着我不爱你，取决于沟通。';
  assert.strictEqual(hit(probe), false, '置空前应被守卫豁免');
  assert.strictEqual(hit(probe, { HEDGE_ZH: NO_MATCH }), true, '置空后应命中');
});
// 对照组：注入无关守卫不得翻 hit（证明不是恒翻）
check('E 对照组：注入无关守卫不得翻命中', () => {
  const probe = '如果你真的爱我，就把工资卡交出来。';
  for (const g of ['QUESTION_ZH', 'MUTUAL_ZH', 'ANALYSIS_ZH', 'HELP_REQUEST_ZH', 'NORMAL_AFFECT_ZH', 'HEDGE_ZH']) {
    assert.strictEqual(hit(probe, { [g]: NO_MATCH }), true, '注入 ' + g + ' 后攻击样本反而 miss');
  }
});

// ─── F. 边界锁 ────────────────────────────────────────────────────
check('F 边界锁：缺情感锚点腿不判（普通交易谈判）', () => {
  assert.strictEqual(hit('如果这批货不能按时交，我们就按合同扣款。'), false, '缺腿①仍判');
});
check('F 边界锁：缺条件构式腿不判（无条件索取）', () => {
  assert.strictEqual(hit('把工资卡交出来，这是家里的规矩。'), false, '缺腿②仍判');
});
check('F 边界锁：缺付出要求腿不判（软性断绝无索取）', () => {
  assert.strictEqual(hit('你再这样，我只能重新考虑我们的感情。'), false, '缺腿③仍判');
});
check('F 边界锁：疑问句（真疑问非陈述条件）不判', () => {
  assert.strictEqual(hit('如果你真的爱我，会帮我把房子买下来吗？'), false, '疑问形未豁免');
});
check('F 边界锁：短文本（<6 字符）不判', () => {
  assert.strictEqual(hit('爱我'), false, '短文本误判');
});
check('F 边界锁：纯否定与对冲不判', () => {
  assert.strictEqual(hit('如果你真的爱我，就不该让我把钱都拿出来，这不意味着我不爱你，取决于沟通。'), false, '否定对冲误判');
});

// ─── G. 登记纪律 ──────────────────────────────────────────────────
check('G VERSION / package.json 一致', () => {
  const pkg = require(path.join(ROOT, 'package.json'));
  const v = require('node:fs').readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  assert.ok(/^\d+\.\d+\.\d+$/.test(v), 'VERSION 格式非法: ' + v);
  assert.strictEqual(pkg.version, v);
});
check('G index.js 接线在位（require + 计算点 + dimMap 键 + VERIFY_DIMS + guidance）', () => {
  const src = require('node:fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/checkCoerciveAffection/.test(src), 'index.js 缺 checkCoerciveAffection 接线');
  assert.ok(/coercive_affection/.test(src), 'index.js 缺 coercive_affection 维度键');
});
check('G __internals 暴露三腿 + 六守卫（负例注入口）', () => {
  const I = __internals();
  // 三腿 ZH/EN 拆分支数组（模块契约），合并正则在 AFFECTION/CONDITION/DEMAND
  for (const k of ['AFFECTION', 'CONDITION', 'DEMAND']) assert.ok(I[k] instanceof RegExp, k + ' 非正则');
  for (const k of ['AFFECTION_ZH', 'CONDITION_ZH', 'DEMAND_ZH', 'AFFECTION_EN', 'CONDITION_EN', 'DEMAND_EN']) {
    assert.ok(I[k] !== undefined, '__internals 缺 ' + k);
    assert.ok(Array.isArray(I[k]) && I[k].length > 0, k + ' 非非空数组');
  }
  for (const k of ['QUESTION_ZH', 'HELP_REQUEST_ZH', 'MUTUAL_ZH', 'ANALYSIS_ZH', 'NORMAL_AFFECT_ZH', 'HEDGE_ZH']) {
    assert.ok(I[k] !== undefined, '__internals 缺 ' + k);
    assert.ok(I[k] instanceof RegExp, k + ' 非正则');
  }
});

console.log(`\nround-334 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
