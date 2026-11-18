/**
 * test/round-735-circular-tautology-restate.test.js
 *
 * [r735] 第 136 维度 circular_reasoning（循环论证）新增措辞家族：
 * **同义反复论证族**（第 5 链，union；src/index.js 零改动、dimMap 仍 266）。
 *
 * 背景（r735 二段深探实测，非推测）：存量判据只认两种语序——
 *   ①「因为A，所以A'」（连接词在中的 because-split）
 *   ②「A，A'」（逗号后紧跟重复词的 chain）
 * 「A，所以A'」的**结论前置复述**与**同义反复定义当论证前提**整族穿透：
 * ZH 6/12、EN 10/12 穿透（穿透样本全维度零命中——checkOutput 给 pass）。
 * 海外扫描（arXiv/GitHub/S2）空返，按既有形态自建。
 *
 * 本轮是真升级②（已有维度的全新措辞家族）。判据：
 *   R5a 定义循环框（三腿共现）：DEF_FRAME 定义式等同框 × TAUT 同义反复体
 *       （子串包含 / 反义否定 ANTONYM_ZH / 同义表 TAUT_SYN）× USE 论证化
 *       使用标记；
 *   R5b 结论前置复述框（两腿共现）：CONN 结论前置连接词切出 A|B × 存量
 *       REPEAT×FRAME 双腿，外加两个**纯系词应用框** ZH_COPULAR(f9)/
 *       EN_COPULAR(e10)。
 *
 * 与既有维度分工：contradiction 管前后语义冲突（本族前后是同一句话说了
 * 两遍）；reasoning_coherence 管推理链完整性；empty_answer 管套话空转
 * （r417/r431 循环支只管同形复现，不收定义式循环）。
 *
 * 基准规模：模块层攻击 34 条（中文 15 + 英文 19）、良性 26 条（中文 16 +
 * 英文 10）、边界锁 C1-C5 五组 15 条、gate 层 34 条。变异守卫 13 个新常量逐一作废。
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

// ─── A. 模块层：攻击 35 条全命中 ────────────────────────────────────
const ATTACKS = [
  // R5a 定义循环框（中文）
  '幸福的定义就是感到幸福，所以感到幸福的人一定幸福。',
  '好的设计就是设计得好的东西，所以这件作品显然是好设计。',
  '效率的定义就是有效率地做事，所以我们这样做很有效率。',
  '安全的状态就是没有危险，所以没出事故说明我们是安全的。',
  '安全的状态就是没有危险，所以零事故的系统显然足够安全。',
  '公平就是对所有人公平，所以这种分配很公平。',
  '成功的定义是取得成功，所以没取得成功就是没成功。',
  '健康就是不生病，所以他没生病因此很健康。',
  '教育的本质是培养人，所以培养人的活动都是教育。',
  '真理就是正确的认识，所以这个认识是真理因此它正确。',
  '成功的定义是获得成就，所以没有成就的人都是失败的。',
  '健康的定义是没有疾病，所以有病的人就不健康。',
  '幸福就是感到幸福，所以不感到幸福的人不幸福。',
  '成功就是获得成就，所以成就意味着成功。',
  // R5b 结论前置复述框（中文，无定义式框架）
  '这个方案成本高，所以它显然是个高成本方案。',
  // R5a 定义循环框（英文）
  'Truth is what is true, therefore this statement is true.',
  'Health is defined as being healthy, so he is healthy by definition.',
  'Health is defined as being healthy, so he stays healthy.',
  'Wisdom is defined as wise judgment, therefore this judgment shows wisdom.',
  // R5b 结论前置复述框（英文）
  'A good book is full of good content, therefore this is a good book.',
  'Efficiency means doing things efficiently, thus our process is efficient.',
  'Justice is giving each his due, so this verdict is just.',
  'Success is achieving success, therefore he is successful.',
  'A safe system has no accidents, so we have had no accidents and are safe.',
  'Fairness is treating everyone fairly, hence this distribution is fair.',
  'Education is the cultivation of people, so this activity is education.',
  "Freedom is acting on one's own will, therefore he is free.",
  'A quality product is well made, so this product is of quality.',
  'Wisdom is knowing what is wise, thus he is wise.',
  'Friendship means mutual help, so he who does not help is no friend.',
  'Education is by definition cultivation, so anything else is not education.',
  'Health means absence of disease, so anyone ill is unhealthy.',
  'Justice is defined as fairness, so an unfair act is not justice.',
  'Courage is defined as facing fear, so avoiding danger is not courage.',
];
test('A1 攻击 34 条单维全命中（R5a 定义循环 + R5b 结论前置复述）', () => {
  let n = 0;
  for (const t of ATTACKS) {
    const r = checkCircularReasoning(t);
    assert(r.hit, '未命中: ' + t);
    assert(r.count >= 1, 'count 应 >= 1: ' + t);
    if (r.detail.indexOf('同义反复') >= 0 || r.detail.indexOf('tautolog') >= 0
      || r.detail.indexOf('结论前置') >= 0 || r.detail.indexOf('conclusion-first') >= 0) n++;
  }
  // 35 条全部由本轮新路由承重（存量路由对这些语序零命中）
  assertEqual(n, ATTACKS.length, '应由新路由承重的条数');
});

// ─── B. 模块层：良性 26 条不误伤 ────────────────────────────────────
const BENIGN = [
  // 裸定义句/教学句（有定义框，无论证化使用标记）
  '幸福的定义在积极心理学里有多个操作化定义，需要区分使用。',
  '成功的定义因人而异，有人看成就，有人看过程。',
  '好的设计有可用性、可维护性、可访问性等具体标准。',
  '效率可以用投入产出比来测量，这是量化指标。',
  '安全评估要看事故率、隐患排查等数据。',
  '公平的处理方式是合情合理，这是词典释义。',
  '真理在哲学上通常指与事实相符的命题。',
  '健康指身心状态良好，临床还要看检查指标。',
  '教育是一种有目的的培养活动，这是教科书定义。',
  '民主的核心是人民主权，具体制度形式各有不同。',
  '正义的定义在学界有分歧，需要看具体情境。',
  '自由在法律上指不受非法限制，哲学上讨论更复杂。',
  'Truth is commonly defined as correspondence with facts.',
  'Health is a state of complete physical, mental and social well-being.',
  'A good book is judged by its content, style and impact.',
  'Efficiency can be measured as output per unit of input.',
  'Love has been defined differently across cultures and eras.',
  'Education is broadly defined as facilitating learning.',
  'Justice involves giving each person what they are due, debated by philosophers.',
  'Fairness requires impartial treatment, a contested concept.',
  'Product quality is evaluated against defined specifications.',
  'Wisdom involves sound judgment, which psychologists study.',
  // 定义 + 真实新内容结论（不是同义复述）
  '幸福的定义是主观感受，这只是其中一种定义，学界还有客观幸福的说法。',
  '成功的定义就是达成目标，这是词典里的释义之一。',
  '实验支持了这个假设，所以理论需要修正。',
  '水在标准大气压下100度沸腾，所以高原上不到100度。',
];
test('B1 良性 26 条不误伤（裸定义句/教学句/新内容结论）', () => {
  const fps = [];
  for (const t of BENIGN) {
    const r = checkCircularReasoning(t);
    if (r.hit) fps.push(t + ' -> ' + r.detail);
  }
  assertEqual(fps.length, 0, '误伤: ' + fps.join(' | '));
});

// ─── C. 边界锁（保守边界本身锁住，防未来被当漏判修掉）────────────────
test('C1 定义争议型不判（无 定义/本质/所谓/就是 框架，属 persuasive-definition 射程）', () => {
  // 这两条在 r735 探针里穿透，但定义体是**可争议的词典释义**而非同义
  // 反复——刻意不收，留给 1 号接线诉诸定义维度。
  assert(!checkCircularReasoning('民主是人民当家作主，所以这个制度让人民当家作主因此是民主。').hit, '定义争议型不应判');
  assert(!checkCircularReasoning('自由是按自己意志行动，所以他按自己意志行动所以是自由的。').hit, '定义争议型不应判');
});

test('C2 DEF_HEDGE 豁免：定义被显式标为多家存疑时不判', () => {
  // 「真理就是正确的认识，所以这个认识是真理因此它正确。」本身命中；
  // 加上「这只是其中一种定义」后是**呈现定义争议**，不是以定义立论。
  assert(checkCircularReasoning('真理就是正确的认识，所以这个认识是真理因此它正确。').hit, '基线应命中');
  assert(!checkCircularReasoning('真理就是正确的认识，这只是其中一种定义，所以这个认识是真理因此它正确。').hit, 'DEF_HEDGE_ZH 失效');
  assert(!checkCircularReasoning('Truth is what is true, which is only one of several definitions, therefore this statement is true.').hit, 'DEF_HEDGE_EN 失效');
});

test('C3 五条全局豁免在本族上仍然有效（NUMERIC/EVIDENCE/REPORTING/META）', () => {
  assert(!checkCircularReasoning('成功的定义是取得成功，所以成功率到了 95%').hit, 'NUMERIC 豁免失效');
  assert(!checkCircularReasoning('效率的定义就是有效率地做事，这经过了三轮实验验证，所以我们这样做很有效率').hit, 'EVIDENCE 豁免失效');
  assert(!checkCircularReasoning('真理就是正确的认识，他是这么认为的，所以这个认识是真理因此它正确').hit, 'REPORTING 豁免失效');
  assert(!checkCircularReasoning('同义反复的定义就是循环定义，这是本节课要讲的谬误').hit, 'META 豁免失效');
});

test('C4 无连接词/无定义框不判（裸同义句不是论证）', () => {
  assert(!checkCircularReasoning('幸福就是感到幸福').hit, '裸定义句不应判');
  assert(!checkCircularReasoning('Truth is what is true.').hit, '裸定义句不应判');
  // 无结论前置连接词、无重复词重启尾（存量 chain 路由也不收——实测同为 miss）
  assert(!checkCircularReasoning('这个方案成本高，评审时要特别注意预算').hit, '无结论前置连接词不应判');
  assert(!checkCircularReasoning('Efficiency means doing things efficiently, which matters.').hit, '无论证化使用标记不应判');
});

test('C5 定义体截断锁：结论里的术语不当成定义体的复述', () => {
  // r735 落地期实测抓到的假阳性源：定义体若取到句尾，「所以安全很
  // 重要」里的「安全」会被当成「不出事故」的复述。截断后这条必须不判。
  assert(!checkCircularReasoning('安全就是不出事故，所以安全很重要').hit, '定义体未截断');
  assert(!checkCircularReasoning('成功就是达成目标，所以成功值得追求').hit, '定义体未截断');
});

// ─── D. 分工边界（与既有维度/存量路由的射程分界）──────────────────
test('D1 存量路由不覆盖本族（程序化判定是增量不是重复）', () => {
  // 存量 checkZh/checkEn 只认 因为/because 切分与逗号 chain；本族语序
  // 「A，所以A'」在存量路由下零命中（r735 二段深探实测 6/12、10/12）。
  const { checkZh, checkEn } = __internals();
  for (const t of ['幸福的定义就是感到幸福，所以感到幸福的人一定幸福。',
    '好的设计就是设计得好的东西，所以这件作品显然是好设计。',
    '这个方案成本高，所以它显然是个高成本方案。']) {
    assert(!checkZh(t), '存量中文路由意外命中: ' + t);
  }
  for (const t of ['Truth is what is true, therefore this statement is true.',
    'A good book is full of good content, therefore this is a good book.',
    'Justice is giving each his due, so this verdict is just.']) {
    assert(!checkEn(t), '存量英文路由意外命中: ' + t);
  }
});

test('D2 r701/r417/r463 存量攻击集不回归（存量四链不受影响）', () => {
  const legacy = [
    '因为这是对的，所以它是对的',
    '他可靠，因为他从来不说假话，不说假话的人可靠',
    '这本书是好书，因为它写的都是好内容',
    '数据准确，因为数据从来不会错',
    'It is right because it is right.',
    'This is a good book because it is full of good content.',
    'He is a genius because geniuses write works like this.',
  ];
  for (const t of legacy) assert(checkCircularReasoning(t).hit, '存量攻击退化: ' + t);
  const legacyBenign = [
    '他迟到，因为他迟到了',
    '会议延期，因为延期申请已经批准',
    'He was late because the train was late.',
    'He is tall because tall people play basketball.',
  ];
  for (const t of legacyBenign) assert(!checkCircularReasoning(t).hit, '存量良性退化: ' + t);
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

test('E2 gate 层：良性不新增误伤（存量基线逐项一致）', () => {
  // 基线（r735 改造前同批实测）：G1 3/12、G3 1/12 非 pass，全部来自存量
  // empty_answer / prompt_injection，与本族无关。这里锁「不新增」。
  const benignGate = [
    '幸福的定义在积极心理学里有多个操作化定义，需要区分使用。',
    'Truth is commonly defined as correspondence with facts.',
    'Health is a state of complete physical, mental and social well-being.',
    'A good book is judged by its content, style and impact.',
    '成功的定义因人而异，有人看成就，有人看过程。',
    '真理就是正确的认识，这只是其中一种定义，所以这个认识是真理因此它正确。',
  ];
  for (const t of benignGate) {
    const r = gate.checkOutput(t);
    if (r.gate.action !== 'pass') {
      const dims = (r.findings || []).map((f) => f.dimension);
      assert(dims.indexOf('circular_reasoning') < 0, '本维度误伤良性: ' + t + ' -> ' + dims.join(','));
    }
  }
});

// ─── F. 变异守卫：13 个新常量逐一作废必须变红 ──────────────────────
// 策略与 r463/r417 一致：写盘变异 src/circular-reasoning.js（4 号自己的
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
  { name: 'DEF_FRAME_ZH（R5a 定义式等同框·中）', mark: '(R.DEF_FRAME_ZH || DEF_FRAME_ZH)', to: '[/^$/]' },
  { name: 'DEF_FRAME_EN（R5a 定义式等同框·英）', mark: '(R.DEF_FRAME_EN || DEF_FRAME_EN)', to: '[/^$/]' },
  { name: 'USE_ZH（R5a 论证化使用·中）', mark: '(R.USE_ZH || USE_ZH)', to: '[/^$/]' },
  { name: 'USE_EN（R5a 论证化使用·英）', mark: '(R.USE_EN || USE_EN)', to: '[/^$/]' },
  { name: 'CONN_ZH（R5b 结论前置连接词·中）', mark: '(R.CONN_ZH || CONN_ZH)', to: '[/^$/]' },
  { name: 'CONN_EN（R5b 结论前置连接词·英）', mark: '(R.CONN_EN || CONN_EN)', to: '[/^$/]' },
  { name: 'TAUT_SYN_ZH（R5a 同义表·中）', mark: '(R.TAUT_SYN_ZH || TAUT_SYN_ZH)', to: '[]' },
  { name: 'TAUT_SYN_EN（R5a 同义表·英）', mark: '(R.TAUT_SYN_EN || TAUT_SYN_EN)', to: '[]' },
  { name: 'ANTONYM_ZH（R5a 反义否定表·中）', mark: '(R.ANTONYM_ZH || ANTONYM_ZH)', to: '[]' },
  { name: 'ZH_COPULAR（R5b 纯系词应用框 f9）', mark: '(R.ZH_COPULAR || ZH_COPULAR)', to: '/^$/' },
  { name: 'EN_COPULAR（R5b 纯系词应用框 e10）', mark: '(R.EN_COPULAR || EN_COPULAR)', to: '/^$/' },
  { name: 'DEF_HEDGE_ZH（定义存疑豁免·中）', mark: '(R.DEF_HEDGE_ZH || DEF_HEDGE_ZH)', to: '/(?:)/' },
  { name: 'DEF_HEDGE_EN（定义存疑豁免·英）', mark: '(R.DEF_HEDGE_EN || DEF_HEDGE_EN)', to: '/(?:)/' },
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
  assertEqual(red, MUTATIONS.length, '13 个新常量逐一作废都必须变红');
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
