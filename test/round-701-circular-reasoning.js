/**
 * test/round-701-circular-reasoning.js
 *
 * [r701] 第 136 维度 circular_reasoning（循环论证）TDD 测试。
 *
 * 背景：decision 本体在 135 维引擎上选出（/tmp/decide-run-r701.js 读
 * /tmp/decide-opts-r701.json，composite_score 0.90 / confidence 0.88 /
 * identity alignment 100%，无拒选）。候选题池来自 r700 探测器落盘
 * /tmp/hf-scout-700.txt：攻击 10 条漏判 8/10、真零命中 7/8、良性 0/12
 * 误伤；本轮 /tmp/r701-preprobe.js 复验 6/6 仍 pass。判据从严：只有
 * gate.checkOutput() gate.action === 'pass' 才算漏判。
 *
 * 本轮是真升级①（新增第 136 个判别维度）。
 * 判据是双腿共现：①同词共现（跨连接词的实词片段重复）② 定义式复述框
 * （主语重启/类指名词化/恒常习惯/全称判断/判言重启/同构复述，缺一不判）。
 *
 * 与既有维度分工由 D 组锁住：
 *   · contradiction 管前后语义冲突，本族前后不冲突（同一句话说了两遍）；
 *   · reasoning_coherence 管推理链完整性，本族三段俱全；
 *   · evidence 管有无出处，本族攻击句常无数字也无来源；
 *   · FALLACY_PATTERNS 旧 3 条 circular_reasoning 正则只认嵌套形。
 *
 * 基准规模：攻击 20 条（中文 10 + 英文 10）、良性 28 条（中文 18 +
 * 英文 10）、边界锁 10 条、分工边界 8 条、gate 层 23 条。
 */
'use strict';

const path = require('path');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const { checkCircularReasoning } = require(path.join(HF, 'src/circular-reasoning.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 单维层：攻击 20 条全命中（逐条双腿注释）──────────────────────
test('A1 中文攻击 10 条单维全命中（同词共现×定义式复述框）', () => {
  const attacks = [
    // 同词「是对的」× 系词复述（因为A所以A 整句同构）
    '因为这是对的，所以它是对的',
    // 同词「可靠」× 类指名词化（从来不说假话 + 的人可靠）
    '他可靠，因为他从来不说假话，不说假话的人可靠',
    // 同词「是好」× 全称判断（都是好内容）
    '这本书是好书，因为它写的都是好内容',
    // 同词「天才」× 主语重启（天才才写得出）
    '他是天才，因为天才才写得出这样的作品',
    // 同词「合理」× 主语重启（合理的规定才这么写）
    '这个规定合理，因为合理的规定才这么写',
    // 同词「数据」× 主语重启+恒常（数据从来不会错）
    '数据准确，因为数据从来不会错',
    // 无连接词复述链：同词「诚实」× 类指名词化（诚实的人从不说谎）
    '他诚实，诚实的人从不说谎，他没说过谎',
    // 同词「真理」× 主语重启（真理就是这样的）
    '这是真理，因为真理就是这样的',
    // 同词「好用」× 主语重启（好用的产品才好用）
    '产品好用，因为好用的产品才好用',
    // 同词「专业」× 否定主语重启（不专业的人做不到）
    '他专业，因为不专业的人做不到这么专业',
  ];
  for (const t of attacks) {
    const r = checkCircularReasoning(t);
    assert(r.hit, '未命中: ' + t);
    assert(r.count >= 1, 'count 应 >= 1: ' + t);
  }
});

test('A2 英文攻击 10 条单维全命中（中英分支对齐）', () => {
  const attacks = [
    // e4 整句同构 + e6 纯系词复述
    'It is right because it is right.',
    // e2 类指关系从句（people who never lie are reliable）
    'He is reliable because he never lies, and people who never lie are reliable.',
    // e6 纯系词复述（it is full of good content）
    'This is a good book because it is full of good content.',
    // e3 定义式尾（geniuses write works like this）
    'He is a genius because geniuses write works like this.',
    // e3 定义式尾（reasonable rules are written this way）
    'This rule is reasonable because reasonable rules are written this way.',
    // e1a 主语重启+恒常尾（data never makes mistakes）
    'The data is accurate because data never makes mistakes.',
    // 分号链 + e9 恒常标记同现（honest people never lie）
    'He is honest; honest people never lie, and he has never lied.',
    // e3 定义式尾（the truth is like this）
    'This is the truth because the truth is like this.',
    // 相邻实词对重复（works well / work well）
    'The product works well because good products work well.',
    // e1b 否定定义（unprofessional people cannot do this）
    'He is professional because unprofessional people cannot do this.',
  ];
  for (const t of attacks) {
    const r = checkCircularReasoning(t);
    assert(r.hit, '未命中: ' + t);
  }
});

// ─── B. 良性不误伤（28 条）────────────────────────────────────
test('B1 良性 28 条不误伤（依据在场/新事实/无条件句）', () => {
  const benign = [
    // r700 探测器原 12 条良性
    '这个结论成立，因为三项实验都验证了它',
    '数据准确，因为经过了三次独立复核',
    '他诚实，同事都证实他从不说谎',
    '这本书好，读者评分 4.8 且有专业书评',
    '产品好用，用户留存率提升了 30%',
    '他的专业能力有十年项目记录支撑',
    '真理需要证据，我们来检查依据',
    '该规定依据行业标准制定',
    '结论有数据支撑，假设经过验证',
    '他的说法可以追溯到原始文献',
    '这是公认的定义，所以如此',
    '请提供证据支持这个结论',
    // 附加中文良性：新事实/同一事件重申/引述
    '会议延期，因为延期申请已经批准',
    '项目取消，因为取消通知已下发',
    '他迟到，因为他迟到了',
    '他是好人，因为他是捐款最多的',
    '我同意，因为我同意这个方案',
    '这本书好，因为都是正版书',
    '他开心，因为开心是他一生的追求',
    '循环论证是指因为这是对的，所以它是对的',
    '为什么他是天才？因为天赋需要培养',
    // 附加英文良性
    'He was late because the train was late.',
    'She is happy because her father is happy.',
    'The meeting was long because the discussion was long.',
    'This rule works because the team tested it carefully.',
    'He is tall because tall people play basketball.',
    'The project succeeded because the team worked hard.',
    'She is kind because kindness matters to her.',
    'The plan is good because it has good reviews.',
  ];
  for (const t of benign) {
    const r = checkCircularReasoning(t);
    assert(!r.hit, '误伤: ' + t + ' -> ' + r.detail);
  }
});

// ─── C. 边界锁（保守边界本身锁住，防未来被当漏判修掉）────────────
test('C1 有重复但无定义式框架不判（同一事件重申是强调句）', () => {
  // 「他迟到，因为他迟到了」——重复词在场但后半句是同一事件重申，
  // 没有定义式框架（的人/从来/就是/都是…）。刻意不判。
  const r = checkCircularReasoning('他迟到，因为他迟到了');
  assert(!r.hit, '同一事件重申不应判');
});

test('C2 有重复但后半句引入新事实不判（申请/批准是事件）', () => {
  const r = checkCircularReasoning('会议延期，因为延期申请已经批准');
  assert(!r.hit, '新事实句不应判');
});

test('C3 功能词重复不判（他是/因为/这个不是论证内容）', () => {
  const r = checkCircularReasoning('他是好人，因为他是捐款最多的');
  assert(!r.hit, '功能词 bigram 重复不应判');
});

test('C4 条件后置不判（错了就要认是条件句）', () => {
  const r = checkCircularReasoning('他错了，因为错了就要认');
  assert(!r.hit, '条件句不应判');
});

test('C5 数字/百分比在场不判（量化陈述自带外部锚点）', () => {
  const r = checkCircularReasoning('产品好用，因为好评率到了 95%');
  assert(!r.hit, '数字在场不应判');
});

test('C6 英文无条件句不判（tall people play basketball 是因果主张）', () => {
  const r = checkCircularReasoning('He is tall because tall people play basketball.');
  assert(!r.hit, '英文条件/因果句不应判');
});

test('C7 四条豁免各救一条「形似攻击」样本（负例脚本的承重点）', () => {
  // 每条都含完整的「同词共现×定义式复述框」攻击结构，唯一阻止判定的是
  // 对应的豁免——杀掉任一豁免，该条立刻变红（r701 负例实测）。
  // NUMERIC：量化陈述自带外部锚点
  assert(!checkCircularReasoning('数据准确，因为数据从来不会错，准确率到了 95%').hit, 'NUMERIC 豁免失效');
  // EVIDENCE：有实验/验证的陈述是引用
  assert(!checkCircularReasoning('这本书是好书，因为它写的都是好内容，经过了三轮实验验证').hit, 'EVIDENCE 豁免失效');
  // REPORTING：引述转述是新信息来源
  assert(!checkCircularReasoning('他是天才，因为天才才写得出这样的作品，他是这么认为的').hit, 'REPORTING 豁免失效');
  // META：评析/教学话术本身
  assert(!checkCircularReasoning('这本书是好书，因为它写的都是好内容——循环论证指的就是这种现象').hit, 'META 豁免失效');
});

test('C8 恒常陈述锁：个体习惯/传统诉诸不判（r701 实测误伤修正）', () => {
  // 这两条在首版帧逻辑下被误判（恒常标记无否定要求 + 从来在主语重启
  // 尾表里），收紧后锁定：「他总是有理由」是个体习惯陈述（新增了
  // 「有理由」这个事实），「事情从来如此」是传统诉诸，都不是同义反复。
  assert(!checkCircularReasoning('他总是迟到，因为他总是有理由').hit, '个体习惯误判');
  assert(!checkCircularReasoning('事情就是这样，因为事情从来如此').hit, '传统诉诸误判');
  // 对照：带否定的定义式恒常句仍判（数据从来不会错）
  assert(checkCircularReasoning('数据准确，因为数据从来不会错').hit, '带否定的恒常定义式应判');
});

// ─── D. 分工边界（与既有维度/旧正则的射程分界）──────────────────
test('D1 contradiction 分工：前后语义冲突不归本维度', () => {
  // 矛盾句（先说好又说不好）与本族同构度最高，但 contradiction 管冲突、
  // 本族管同义反复。这里锁「矛盾句不被本维度误判」。
  const r = checkCircularReasoning('这个方案好，这个方案也不好');
  assert(!r.hit, '矛盾句不应由循环论证判');
});

test('D2 FALLACY_PATTERNS 旧正则不覆盖本族（程序化判定是增量不是重复）', () => {
  // 旧 3 条只认嵌套形：因为X所以X因为 / 这本身就是X这证明 / 之所以X是因为X所以
  const oldPats = [
    /因为[^，。]*?所以[^，。]*?因为/i,
    /这本身就是[^，。]*?这证明/i,
    /之所以[^，。]*?是因为[^，。]*?所以/i,
  ];
  const attacks = ['因为这是对的，所以它是对的', '这本书是好书，因为它写的都是好内容', '数据准确，因为数据从来不会错'];
  for (const t of attacks) {
    const oldHit = oldPats.some((p) => p.test(t));
    assert(!oldHit, '旧正则意外命中（说明不是射程外）: ' + t);
    assert(checkCircularReasoning(t).hit, '新维度应命中: ' + t);
  }
});

test('D3 元话语豁免：评析/教学循环论证不判', () => {
  const metas = [
    '循环论证是一种常见的逻辑谬误',
    'Circular reasoning is a common logical fallacy.',
    '我们来分析这个循环论证的案例',
  ];
  for (const t of metas) {
    assert(!checkCircularReasoning(t).hit, '元话语误判: ' + t);
  }
});

test('D4 依据在场豁免：有实验/文献的陈述不判', () => {
  const evidenced = [
    '这个结论成立，因为三项实验都验证了它',
    '他的专业能力有十年项目记录支撑',
    'This rule works because the team tested it carefully.',
  ];
  for (const t of evidenced) {
    assert(!checkCircularReasoning(t).hit, '依据在场误判: ' + t);
  }
});

// ─── E. gate 层端到端（十处接线生效证明）──────────────────────
test('E1 gate 层：本族攻击全部非 pass', () => {
  const attacks = [
    '因为这是对的，所以它是对的',
    '这本书是好书，因为它写的都是好内容',
    '他是天才，因为天才才写得出这样的作品',
    '数据准确，因为数据从来不会错',
    '他诚实，诚实的人从不说谎，他没说过谎',
    'It is right because it is right.',
    'He is a genius because geniuses write works like this.',
    'The product works well because good products work well.',
    'He is professional because unprofessional people cannot do this.',
  ];
  for (const t of attacks) {
    const a = gate.checkOutput(t).gate.action;
    assert(a !== 'pass', 'gate 层漏判: ' + t + ' -> ' + a);
  }
});

test('E2 gate 层：良性 8 条仍 pass', () => {
  // 选样先查归属：「He was late because the train was late.」与
  // 「She is happy because her father is happy.」单维层 0 误伤，但 gate 层
  // 被**既有维度**（empty_answer）判 verify，与本维度无关（r701 实测
  // cr count = 0）——换成 gate 层真 pass 的样本，防止下轮误当误伤。
  const benign = [
    '这个结论成立，因为三项实验都验证了它',
    '会议延期，因为延期申请已经批准',
    '他迟到，因为他迟到了',
    '他是好人，因为他是捐款最多的',
    '他的说法可以追溯到原始文献',
    'The plan is good because it has good reviews.',
    'The project succeeded because the team worked hard.',
    'She is kind because kindness matters to her.',
  ];
  for (const t of benign) {
    const a = gate.checkOutput(t).gate.action;
    assertEqual(a, 'pass', 'gate 层误拦: ' + t + ' -> ' + a);
  }
});

test('E3 gate 层：circular_reasoning 登记可见（防登记缺口形态）', () => {
  const d = gate.discriminate('因为这是对的，所以它是对的');
  assert(d.dimensions && d.dimensions.circular_reasoning, 'dimensions 缺少 circular_reasoning 键');
  const cnt = d.dimensions.circular_reasoning.count ?? d.dimensions.circular_reasoning.totalHits ?? 0;
  assert(cnt > 0, 'circular_reasoning count 应 > 0，实际 ' + cnt);
  const findings = d.findings || [];
  assert(findings.some((f) => f.dimension === 'circular_reasoning'), 'findings 缺少 circular_reasoning');
});

// ─── 汇总 ────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
if (fail > 0) {
  console.log('失败项:');
  for (const r of results) if (!r.ok) console.log('  -', r.name, '::', r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
process.exit(fail > 0 ? 1 : 0);
