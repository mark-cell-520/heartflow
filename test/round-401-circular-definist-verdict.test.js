/**
 * test/round-401-circular-definist-verdict.test.js
 *
 * [r401] 第 136 维度 circular_reasoning（循环论证）新增措辞家族：
 * **诉诸定义裁决族**（第 6 链，union；src/index.js 零改动、dimMap 仍 266）。
 *
 * 背景（r401 探针实测，非推测）：存量判据只认「定义体复述术语」的同义
 * 反复（R5a）与「结论是定义体复述」的结论前置（R5b）；**规定性定义被
 * 拿来直接裁决个案**的族整族穿透——定义体不是同义反复（「筛选」不复述
 * 「教育」），结论也不是复述（是拿定义当尺子给个案下裁决）。r400 交接
 * 的 F2 探针穿透 2/10（ZH 本质式、EN true-meaning 式各一条全维度零
 * 命中），本轮扩样后存量五链对该族 ZH 6/6、EN 4/4 穿透。
 * 海外扫描（arXiv/GitHub/S2）空返，按既有形态自建。
 *
 * 本轮是真升级②（已有维度的全新措辞家族）。判据：
 *   R6 诉诸定义裁决框（三腿共现）：DEF_STIP 规定性定义框（X 的本质/
 *       真正含义/真正意义/核心/实质/真谛/内涵/精髓 是/在于 Y；EN the
 *       true meaning/essence/nature of X is Y / real X means Y）× USE
 *       论证化使用（沿用 R5a）× VERDICT 案件裁决标记（只有…才/无论…
 *       都/称不上/根本不/说明不/证明不；EN proves/shows/means、
 *       anyone who…is not、counts as、nothing but）。
 *
 * 与既有维度分工：R5a 管同义反复定义当前提；fallacy_of_relevance 管
 * 答非所问的相关性谬误；contradiction 管前后语义冲突。本族管「定义
 * 立规 → 案件裁决」的丐词结构：结论的全部效力来自被 stipulate 的定义
 * 本身。
 *
 * 基准规模：模块层攻击 10 条（definist 承重）+ 4 条（存量 R5b 代拦，
 * 边界记录）、良性 19 条、边界锁 C1-C6、存量回归 D1-D2、gate 层端到端
 * E1-E2、变异守卫 6 个常量（4 新 + 2 META 扩展）。
 */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/circular-reasoning.js');
const gate = require(path.join(ROOT, 'src/gate.js'));
const { checkCircularReasoning, __internals } = require(path.join(ROOT, 'src/circular-reasoning.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 模块层：诉诸定义裁决攻击 10 条，新路由 R6 承重 ────────────────
const ATTACKS = [
  // 穿透样本（r400 F2 探针 2 条全维度零命中）
  '教育的本质是筛选，所以只有考高分的学习才是有意义的，其他都是浪费时间',
  'The true meaning of justice is fairness of outcome, so any unequal result proves injustice',
  // 腿①变体（真谛/实质/essence of/means 形）
  '健康的真谛在于平衡，所以只有作息规律的生活才算健康',
  '勇气的实质是直面恐惧，因此任何临阵退缩的行为都称不上勇敢',
  'The essence of education is obedience, so any questioning of the teacher defeats the purpose',
  'Real courage means feeling no fear, so anyone who feels afraid is not truly brave',
  'The essence of discipline is compliance, so any questioning of orders counts as indiscipline.',
  'The real meaning of love is sacrifice, so anyone who keeps boundaries is not truly loving',
  // 腿③变体（说明不 / 根本不是）
  '善良的本质是无条件顺从，所以你提出异议就说明你并不善良',
  '爱的本质是心疼，所以不肯为对方花钱的根本不是爱',
];
test('A1 攻击 10 条单维全命中且由 R6 诉诸定义裁决路由承重', () => {
  let n = 0;
  for (const t of ATTACKS) {
    const r = checkCircularReasoning(t);
    assert(r.hit, '未命中: ' + t);
    assert(r.count >= 1, 'count 应 >= 1: ' + t);
    if (r.detail.indexOf('诉诸定义裁决') >= 0 || r.detail.indexOf('definist verdict') >= 0) n++;
  }
  // 10 条全部由本轮新路由承重（存量五链对这些语序零命中——r401 探针实测）
  assertEqual(n, ATTACKS.length, '应由新路由承重的条数');
});

// ─── B. 模块层：良性 19 条不误伤 ────────────────────────────────────
const BENIGN = [
  // 词典/教学形定义（有定义、无论证化裁决）
  '词典把民主定义为人民主权，这一制度是否符合要看实际权力结构。',
  '词典释义只是起点，实际判断还要结合案例事实。',
  '定义可以帮助澄清概念，但不能替代对事实的检验。',
  '正义的定义在学界有分歧，需要看具体情境。',
  '词典里「健康」指身心状态良好，临床判断还要看检查指标。',
  '成功的标准因人而异，有人看成就，有人看过程。',
  'The meaning of courage is debated; different cultures emphasize different aspects.',
  '教育的目的是培养能力，具体路径有多种探索。',
  'A good employee can both follow direction and raise concerns when needed.',
  'Definitions are useful starting points, not verdicts on specific cases.',
  // 定义框在场但结论是中性陈述（无裁决标记）
  '教育的本质是培养，需要家庭、学校与社会共同参与。',
  '团队协作的核心是沟通，项目管理课程里有专门章节。',
  'The essence of the policy is efficiency, which the committee debated for hours.',
  'Real professionalism means expertise, and this candidate clearly has it.',
  '健康的核心是均衡饮食与规律运动，这是公共卫生领域的基础共识。',
  '成功的真谛在于自我实现，每个人对此都有不同的理解。',
  // 存疑豁免 / 元讨论
  '教育的本质是筛选，这只是其中一种定义，所以只有考高分的学习才是有意义的',
  '诉诸定义裁决是一种常见的循环论证变体，本节课会分析它的结构。',
  'The definist fallacy is a form of circular reasoning studied in logic courses.',
];
test('B1 良性 19 条不误伤（词典教学形/中性结论/存疑豁免/元讨论）', () => {
  const fps = [];
  for (const t of BENIGN) {
    const r = checkCircularReasoning(t);
    if (r.hit) fps.push(t + ' -> ' + r.detail);
  }
  assertEqual(fps.length, 0, '误伤: ' + fps.join(' | '));
});

// ─── C. 边界锁（保守边界本身锁住，防未来被当漏判修掉）────────────────
test('C1 DEF_HEDGE 豁免：定义被显式标为多家存疑时不判', () => {
  assert(checkCircularReasoning('教育的本质是筛选，所以只有考高分的学习才是有意义的，其他都是浪费时间').hit, '基线应命中');
  assert(!checkCircularReasoning('教育的本质是筛选，这只是其中一种定义，所以只有考高分的学习才是有意义的').hit, 'DEF_HEDGE_ZH 失效');
  assert(!checkCircularReasoning('The true meaning of justice is fairness of outcome, which is only one of several definitions, so any unequal result proves injustice.').hit, 'DEF_HEDGE_EN 失效');
});

test('C2 META 豁免：评析诉诸定义裁决话术本身不判（r401 扩展项）', () => {
  // 「诉诸定义裁决指的是用规定性定义直接下结论，比如…就是典型」含完整三腿，
  // 但整句是元讨论（ fallacy 名 + 指/比如），必须豁免。
  assert(!checkCircularReasoning('诉诸定义裁决指的是用规定性定义直接下结论，比如「教育的本质是筛选，所以只有考高分的学习才是有意义的」就是典型').hit, 'META_EXEMPT_ZH 失效');
  assert(!checkCircularReasoning('The definist fallacy is when a stipulated definition decides the case, e.g. "The true meaning of justice is fairness of outcome, so any unequal result proves injustice."').hit, 'META_EXEMPT_EN 失效');
});

test('C3 全局豁免在本族上仍然有效（NUMERIC/EVIDENCE/REPORTING）', () => {
  assert(!checkCircularReasoning('教育的本质是筛选，所以只有排名前 10% 的学习才是有意义的').hit, 'NUMERIC 豁免失效');
  assert(!checkCircularReasoning('教育的本质是筛选，这经过了三轮实验验证，所以只有考高分的学习才是有意义的').hit, 'EVIDENCE 豁免失效');
  assert(!checkCircularReasoning('教育的本质是筛选，他认为如此，所以只有考高分的学习才是有意义的').hit, 'REPORTING 豁免失效');
});

test('C4 无论证化使用标记不判（裸定义/裸裁决不是论证）', () => {
  assert(!checkCircularReasoning('教育的本质是筛选，只有考高分的学习才是有意义的').hit, '无 USE 标记不应判');
  assert(!checkCircularReasoning('The true meaning of justice is fairness of outcome; any unequal result proves injustice.').hit, '无 USE 标记不应判');
});

test('C5 无规定性定义框不判（裁决标记 + 连接词但定义框缺席）', () => {
  assert(!checkCircularReasoning('因为努力很重要，所以只有拼尽全力的人才算真正活着').hit, '无定义框不应判');
  assert(!checkCircularReasoning('He believes results are everything, so anyone without them is not truly successful.').hit, '无定义框不应判');
});

test('C6 定义框在连接词之后不判（定义必须先行、裁决在后）', () => {
  assert(!checkCircularReasoning('所以只有考高分的学习才是有意义的，教育的本质是筛选').hit, '定义后置不应判');
  assert(!checkCircularReasoning('So any unequal result proves injustice, the true meaning of justice is fairness of outcome.').hit, '定义后置不应判');
});

test('C7 定义框 + USE 但结论无裁决标记不判（中性新断言）', () => {
  assert(!checkCircularReasoning('教育的本质是培养，所以需要家庭、学校与社会共同参与').hit, '无裁决标记不应判');
  assert(!checkCircularReasoning('The essence of education is cultivation, so it requires long-term investment.').hit, '无裁决标记不应判');
});

// ─── D. 分工边界与存量回归 ─────────────────────────────────────────
test('D1 存量 R5a/R5b 路由不受影响（存量攻击集不回归）', () => {
  // r735 同义反复族：R5a 定义循环 + R5b 结论前置复述
  for (const t of ['幸福的定义就是感到幸福，所以感到幸福的人一定幸福。',
    '好的设计就是设计得好的东西，所以这件作品显然是好设计。',
    'Truth is what is true, therefore this statement is true.',
    'A good book is full of good content, therefore this is a good book.']) {
    assert(checkCircularReasoning(t).hit, '存量 R5 攻击退化: ' + t);
  }
  // r701/r417/r463 存量四链
  for (const t of ['因为这是对的，所以它是对的',
    '他可靠，因为他从来不说假话，不说假话的人可靠',
    '这本书是好书，因为它写的都是好内容',
    'It is right because it is right.',
    'This is a good book because it is full of good content.']) {
    assert(checkCircularReasoning(t).hit, '存量攻击退化: ' + t);
  }
  // 存量良性
  for (const t of ['他迟到，因为他迟到了', '会议延期，因为延期申请已经批准',
    'He was late because the train was late.']) {
    assert(!checkCircularReasoning(t).hit, '存量良性退化: ' + t);
  }
});

test('D2 存量 R5b 代拦样本记录在案（边界如实：4 条由存量链承重）', () => {
  // 这 4 条形似本族但术语在结论中复现，存量 R5b 结论前置复述先承重——
  // 探测针实测记录，不算漏判（action 非 pass），也不算新路由承重。
  const s5Only = [
    '团队协作的核心是各司其职，所以任何越界指点的做法都算不上真正的协作',
    '专业的真谛是客户至上，所以任何拒绝客户要求的行为都算不上专业',
    '成功的真正含义是财富自由，所以一个没有财富自由的人无论多满足都不算成功',
    '公平的真正含义是结果平等，所以让有能力的人多得资源本质上是不公平的',
  ];
  for (const t of s5Only) {
    const r = checkCircularReasoning(t);
    assert(r.hit, '应命中: ' + t);
    assert(r.detail.indexOf('结论前置') >= 0 || r.detail.indexOf('conclusion-first') >= 0, '应由存量 R5b 承重: ' + t + ' -> ' + r.detail);
  }
});

// ─── E. gate 层端到端 ──────────────────────────────────────────────
test('E1 gate 层：本族攻击非 pass 且 circular_reasoning finding 在场', () => {
  const miss = [];
  for (const t of ATTACKS) {
    const r = gate.checkOutput(t);
    if (r.gate.action === 'pass') { miss.push(t); continue; }
    const dims = (r.findings || []).map((f) => f.dimension);
    assert(dims.indexOf('circular_reasoning') >= 0, '本维度未承重: ' + t + ' -> ' + dims.join(','));
  }
  assertEqual(miss.length, 0, 'gate 层漏判: ' + miss.join(' | '));
});

test('E2 gate 层：良性不新增本维度误伤（存量误伤逐项一致）', () => {
  // 基线（r401 改造前同批实测）：4/19 非 pass，全部来自存量维度
  // （monocausal_attribution ×2 / empty_answer ×1 / mediator_confusion ×1），
  // 与本族无关。这里锁「circular_reasoning 零误伤」。
  for (const t of BENIGN) {
    const r = gate.checkOutput(t);
    if (r.gate.action !== 'pass') {
      const dims = (r.findings || []).map((f) => f.dimension);
      assert(dims.indexOf('circular_reasoning') < 0, '本维度误伤良性: ' + t + ' -> ' + dims.join(','));
    }
  }
});

// ─── F. 变异守卫：6 个常量逐一作废必须变红 ─────────────────────────
// 策略与 r735/r463 一致：写盘变异 src/circular-reasoning.js（4 号自己的
// 模块，不碰 src/index.js）→ spawn 本测试 → 断言失败（exit≠0）→ 还原。
// 断言失败而非加载崩溃：变异只替换用法点的常量引用，语法保持合法。
const fs = require('fs');
const cp = require('child_process');
const { arm, disarm, recover } = require('./mutation-guard-recovery.js');
recover([SRC]); // 启动即解毒上一次硬杀残留

const SELF = __filename;
function runSelf() {
  try {
    cp.execSync('node ' + JSON.stringify(SELF), {
      cwd: ROOT, stdio: 'pipe',
      env: Object.assign({}, process.env, { _HF_SELF_SPAWN_DEPTH: String(Number(process.env._HF_SELF_SPAWN_DEPTH || 0) + 1) }),
    });
    return 0;
  } catch (e) { return typeof e.status === 'number' ? e.status : 1; }
}
const MUTATIONS = [
  { name: 'DEF_STIP_ZH（R6 规定性定义框·中）', mark: '(R.DEF_STIP_ZH || DEF_STIP_ZH)', to: '[/^$/]' },
  { name: 'DEF_STIP_EN（R6 规定性定义框·英）', mark: '(R.DEF_STIP_EN || DEF_STIP_EN)', to: '[/^$/]' },
  { name: 'VERDICT_ZH（R6 案件裁决标记·中）', mark: '(R.VERDICT_ZH || VERDICT_ZH)', to: '/(?:)/' },
  { name: 'VERDICT_EN（R6 案件裁决标记·英）', mark: '(R.VERDICT_EN || VERDICT_EN)', to: '/(?:)/' },
  { name: 'META_EXEMPT_ZH（r401 扩展：诉诸定义元讨论豁免·中）', mark: 'R.META_EXEMPT_ZH || META_EXEMPT_ZH', to: '/(?:)/' },
  { name: 'META_EXEMPT_EN（r401 扩展：definist 元讨论豁免·英）', mark: 'R.META_EXEMPT_EN || META_EXEMPT_EN', to: '/(?:)/' },
];
if (Number(process.env._HF_SELF_SPAWN_DEPTH || 0) < 1) {
  const orig = fs.readFileSync(SRC, 'utf8');
  let red = 0;
  for (const mut of MUTATIONS) {
    assert(orig.split(mut.mark).length === 2, '锚点不唯一: ' + mut.mark);
    const mutated = orig.replace(mut.mark, mut.to);
    arm(SRC, fs.readFileSync(SRC, 'utf8'));
    fs.writeFileSync(SRC, mutated, 'utf8');
    const code = runSelf();
    fs.writeFileSync(SRC, orig, 'utf8');
    disarm(SRC);
    console.log(`${mut.name}: exit=${code} ${code !== 0 ? '✅ 变红' : '❌ 守卫不敏感'}`);
    if (code !== 0) red++;
  }
  assertEqual(red, MUTATIONS.length, '6 个常量逐一作废都必须变红');
  assertEqual(runSelf(), 0, '还原后必须 PASS');
}

// ─── 汇总 ──────────────────────────────────────────────────────────
const pass = results.filter((r) => r.ok).length;
for (const r of results) {
  if (!r.ok) console.log('FAIL ' + r.name + ': ' + r.err);
}
console.log(`结果: ${pass} 通过, ${results.length - pass} 失败, 共 ${results.length} 个`);
// 测试脚本最后一行：清理（还原变异 + 拆除侧车），防止硬杀留毒
try { disarm(SRC); } catch (_) {}
try { recover([SRC]); } catch (_) {}
if (pass !== results.length) process.exit(1);
