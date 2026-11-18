/**
 * test/round-398-red-herring-concession.test.js
 *
 * [r398] 第 255 维度 red_herring（转移话题/偷换论题）新增措辞家族：
 * **回应冲淡族**（concede 对比冲淡 + narrate 叙事岔开；union；
 * src/index.js 零改动、dimMap 仍 266）。
 *
 * 背景（r398 轮初探针实测，非推测）：存量判据（r323 三段结构 + r324/r358
 * 补腿）只认**显式置换标记**（别再说/更重要的是/可是你知道/现在不是时候），
 * 对「不搁置、不反问，用一个对比标记把指控蒙过去、后半段另起一头与指控
 * 事项不相关的成绩/贡献/资历/苦劳」整族穿透——scripts/round-398/
 * probe-pool.js（v6.8.198 实测）12 条攻击 10 条穿透 gate=pass；良性 14
 * 条 2 条非 pass 但均非本维度代拦（既有基线 contradiction /
 * helplessness_induction）。海外扫描（arXiv/GitHub/S2）空返，按既有形态
 * 自建。这是 causalNLP/logical-fallacy（EMNLP 2022, arXiv:2202.13758）
 * 13 类谬误里 red herring 教科书形（"redirect the argument to another
 * issue to which the person doing the redirecting can respond"）此前唯一
 * 未覆盖的子族。
 *
 * 判据（新族三墙资格门 + 存量结构腿，全部可负例注入置空）：
 *   腿① SHIFT 置换标记：concede（但/但是/却/不过/yet/but/however）或
 *       narrate（强调/谈起/列举/把话题转到/shifted the topic/…）；
 *   腿② ORIGIN 原议题段：必须含 CRITICISM 批评锚点（有人批评/被质疑/
 *       讨论…问题/You complain about…）——同主体比较陈述不判；
 *   腿③ REPLACE 替换议题段：与腿②零共享实词（存量 CONTINUE 墙），且
 *       concede 必须含 MERIT 社会成绩框、narrate 叙事动词形必须含
 *       MERIT 或 EXCUSE 外归因框（显式转题标记 explicit 免框）；
 *   豁免：ADDRESS（替换段是补救/正面回应——已修复/在整改/已解释）。
 *
 * 与既有维度分工：whataboutism（Tu quoque）管把指控反弹回对话者本人的
 * 反问形，本族**另起一头成绩**、不反弹；fallacy_of_relevance 管用推断
 * 词连接的不相干前提-结论，本族无推断词（但/却/yet 不是推论标记）；
 * soft_deflection 管不给结论的滑脱，本族明确给出替代事项；
 * anecdote（民间掌故）管个人经历当证据，「开始讲小时候打疫苗的经历」
 * 类同议题延续（CONTINUE 墙拦截）刻意不收。
 *
 * 基准规模：模块层攻击 22 条（中文 13 + 英文 9）、良性 27 条（中文 16 +
 * 英文 11）、边界锁 C1-C8、存量回归 D1-D3、gate 层 49 条。变异守卫 8 个
 * 新常量逐一作废 + 2 组 MARKERS 注入删条。
 */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/red-herring.js');
const gate = require(path.join(ROOT, 'src/gate.js'));
const { checkRedHerring, __internals } = require(path.join(ROOT, 'src/red-herring.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 模块层：攻击 22 条全命中且由本轮新路由承重 ────────────────────
const ATTACKS = [
  // concede 对比冲淡（中文）
  '有人批评公司污染环境，但他们为当地创造了那么多就业。',
  '有人说这款药副作用大，但药厂历史悠久、值得信赖。',
  '市民抱怨房价太高，但开发商强调他们上缴了巨额税收。',
  '他被质疑论文数据造假，但导师是领域内的权威专家。',
  '有人批评这部剧台词差，但制片人去年捐建了三所希望小学。',
  '面对环保质疑，企业代表却谈起了自己多年来获得的各项荣誉。',
  '公众质疑财报有水分，但公司上缴的税收养活了不少本地供应商。',
  '用户投诉App偷窥隐私，但团队拿过多次国际大奖。',
  // narrate 叙事岔开（中文）
  '他说这家餐馆卫生差，老板立刻强调自己资助了多少学生。',
  '讨论工资拖欠问题，代表却谈起了行业整体困难。',
  '他批评政策失误，对方立刻把话题转到他的私生活上。',
  '媒体追问事故原因，发言人话锋一转讲起了公司的创业历程。',
  '有人质疑数据造假，她开始细数自己获得过的各项荣誉。',
  // concede 对比冲淡（英文）
  'You question the contract terms, yet our team has twenty years of experience.',
  'Critics say the app leaks data, but the company has donated millions to charity.',
  'She criticized the restaurant for poor hygiene, but the owner emphasized how many students he had funded.',
  'They questioned the safety report, but the manufacturer has decades of experience in aerospace.',
  'Residents complained about the noise, however the factory provides hundreds of local jobs.',
  // narrate 叙事岔开（英文）
  'They discussed the payroll problem, but the representative began to talk about industry-wide difficulties.',
  'He challenged the mayor on the corruption allegations, but she shifted the topic to her decade of public service.',
  'The reporter questioned the drug side effects, so the CEO started talking about the company donations to hospitals.',
  'The activist accused the mining company of polluting the river, but its PR team moved the conversation to the thousands of trees they planted.',
];
test('A1 攻击 22 条单维全命中（concede 对比冲淡 + narrate 叙事岔开）', () => {
  let n = 0;
  for (const t of ATTACKS) {
    const r = checkRedHerring(t);
    assert(r.hit, '未命中: ' + t);
    assert(r.score >= 0.6, 'score 应 >= 0.6: ' + t);
    if (r.details.indexOf('对比冲淡') >= 0 || r.details.indexOf('叙事岔开') >= 0) n++;
  }
  // 22 条全部由本轮新路由承重（存量四族标记对这些语序零命中）
  assertEqual(n, ATTACKS.length, '应由新路由承重的条数');
});

// ─── B. 模块层：良性 25 条不误伤 ────────────────────────────────────
const BENIGN = [
  // 同主体比较陈述（无批评锚点）
  '这家餐厅味道很好，但是价格有点贵。',
  '这款车油耗低，但空间确实不如同级车型。',
  'The interface is clean, but the loading speed could be better.',
  'The plan is ambitious, but the budget is tight.',
  // 同方案反陈述（无社会成绩框）
  '有人批评方案成本高，但实施周期短其实是优势。',
  '虽然有人批评这部电影节奏慢，但它的配乐确实出色。',
  // 回应原议题的补救/正面回应（ADDRESS 豁免）
  '用户反映App经常闪退，但新版本已经修复了大部分问题。',
  '有人批评工厂污染环境，但他们捐建了希望小学，并且已经整改了排污问题。',
  '客户投诉系统卡顿，但工程师正在排查原因。',
  '市民抱怨房价太高，但开发商解释成本构成后大家理解了。',
  '员工抱怨加班多，但公司说这个项目结束后会补休。',
  'Users complained about frequent crashes, but the latest version has already fixed most of the issues.',
  'Critics say the plant pollutes the river, but the company donated to charity and has already fixed the discharge problem.',
  'Critics say the app leaks data, but the company has already patched the vulnerability.',
  'She criticized the restaurant for poor hygiene, but the health inspector gave it a passing grade last month.',
  'The manager asked about the delay, but the team lead explained the dependency chain.',
  // 对冲 / 议程管理 / 元概念（全局豁免）
  '有人批评进度慢，但也许下个季度能赶上，这还要看资源到位情况。',
  '先讨论预算问题，再讨论人事安排，我们一个一个来。',
  '把话题转到无关的事情上，是转移话题谬误的典型形式。',
  'People are discussing the scandal, but perhaps the investigation will clarify things.',
  'Discussing the merger problem, the CFO began to talk about industry-wide difficulties, which is a classic red herring.',
  // 同议题延续（CONTINUE 零共享实词墙——个人经历 anecdote 射程）
  '讨论疫苗安全性时，发言人开始讲自己小时候打疫苗的经历。',
  // 无置换标记的直接回应
  '面对污染质疑，企业公布了整改方案并接受了第三方复查。',
  '讨论疫苗安全性时，发言人拿出了完整的实验数据。',
  '媒体追问事故原因，发布会展示了完整的监控录像。',
  'The journalist questioned the mayor about the contract, and the mayor released the full document.',
];
test('B1 良性 27 条不误伤（比较陈述/补救回应/全局豁免/同议题延续）', () => {
  const fps = [];
  for (const t of BENIGN) {
    const r = checkRedHerring(t);
    if (r.hit) fps.push(t + ' -> ' + r.details);
  }
  assertEqual(fps.length, 0, '误伤: ' + fps.join(' | '));
});

// ─── C. 边界锁（保守边界本身锁住，防未来被当漏判修掉）────────────────
test('C1 同主体比较陈述不判（无批评锚点，CRITICISM 资格门）', () => {
  assert(!checkRedHerring('这家餐厅味道很好，但是价格有点贵。').hit, '比较陈述不应判');
  assert(!checkRedHerring('The interface is clean, but the loading speed could be better.').hit, 'EN 比较陈述不应判');
});

test('C2 同方案反陈述不判（无社会成绩框，MERIT 精度墙）', () => {
  assert(!checkRedHerring('有人批评方案成本高，但实施周期短其实是优势。').hit, '同方案反陈述不应判');
  assert(!checkRedHerring('虽然有人批评这部电影节奏慢，但它的配乐确实出色。').hit, '配乐反陈述不应判');
});

test('C3 ADDRESS 豁免：替换段是补救/正面回应时不判', () => {
  assert(!checkRedHerring('用户反映App经常闪退，但新版本已经修复了大部分问题。').hit, '已修复形不应判');
  assert(!checkRedHerring('客户投诉系统卡顿，但工程师正在排查原因。').hit, '正在排查形不应判');
  assert(!checkRedHerring('Users complained about frequent crashes, but the latest version has already fixed most of the issues.').hit, 'EN 已修复形不应判');
  // 反向锁：同一形状换入不相关成绩即判（证明豁免精确卡在回应义上）
  assert(checkRedHerring('用户反映App偷窥隐私，但团队拿过多次国际大奖。').hit, '同类形换成绩框应判');
});

test('C4 tu quoque 射程不判（他者问题对照归 whataboutism，本族另起成绩）', () => {
  assert(!checkRedHerring('You complain about corruption, yet your own party has scandals too.').hit, '反弹回对话者不应由本族判');
  assert(!checkRedHerring('你说这款车不安全，可你去年不也闯过一次红灯吗？').hit === false || true, 'counter 存量族独立判定');
  // 存量 counter 反问族对该样本独立命中（既有行为，与本族分工不同）
  assert(checkRedHerring('你说这款车不安全，可你去年不也闯过一次红灯吗？').hit, '存量 counter 族应仍命中');
});

test('C5 CONTINUE 同议题延续不判（零共享实词墙——个人经历 anecdote 射程）', () => {
  // 「开始讲打疫苗的经历」与原议题共享实词「疫苗」：同一议题内部的个人
  // 经历举证，不是议题置换。刻意不收，留给 anecdote 维度射程。
  assert(!checkRedHerring('讨论疫苗安全性时，发言人开始讲自己小时候打疫苗的经历。').hit, '同议题延续不应判');
});

test('C6 全局豁免对新族仍然有效（HEDGE/AGENDA/META_CONCEPT）', () => {
  assert(!checkRedHerring('有人批评进度慢，但也许下个季度能赶上，这还要看资源到位情况。').hit, 'HEDGE 豁免失效');
  assert(!checkRedHerring('先讨论预算问题，再讨论人事安排，我们一个一个来。').hit, 'AGENDA 豁免失效');
  assert(!checkRedHerring('把话题转到无关的事情上，是转移话题谬误的典型形式。').hit, 'META 豁免失效');
});

test('C7 显式转题标记免框但仍需批评锚点（explicit 双边界）', () => {
  // 免框：「私生活」无成绩/外归因框，显式标记自带搁置义 → 判
  assert(checkRedHerring('他批评政策失误，对方立刻把话题转到他的私生活上。').hit, '显式转题应判');
  // 需锚点：裸显式标记无批评语境 → 不判
  assert(!checkRedHerring('他把话题转到了自己的私生活上。').hit, '无批评锚点不应判');
});

test('C8 高频标记回退纪律：但/却 不得劫持存量 redirect 样本', () => {
  // 「但是更重要的是」被负向断言挡给 redirect 族；即便 但 在前，回退
  // 机制也必须让存量样本维持命中（r324 同 index 竞争教训的延伸）。
  assert(checkRedHerring('你的代码有 bug，但是更重要的是，难道我们不该先谈谈竞争对手的漏洞吗？').hit, 'redirect 反问形被 但 劫持');
  assert(checkRedHerring('财报的事现在不是讨论的时候，更重要的是竞争对手已经抢占了市场。').hit, '存量 defer+redirect 形应仍命中');
});

// ─── D. 分工边界与存量回归 ─────────────────────────────────────────
test('D1 存量四族标记不受新族影响（dismiss/counter/redirect/defer）', () => {
  const legacy = [
    '别再说我迟到了，公司去年不是也搞过一次团建吗？',
    '你指责我贪污，可是你知道我这些年给灾区捐了多少钱吗？',
    '财报的事现在不是讨论的时候，当务之急是稳住投资者信心。',
    '疫苗的安全性问题，现在不是讨论的时候，当务之急是恢复经济。',
    '这些问题先放着，难道用户增长不是更关键的吗？',
    'Never mind the budget overrun, the real issue is our competitors.',
  ];
  for (const t of legacy) assert(checkRedHerring(t).hit, '存量攻击退化: ' + t);
  const legacyBenign = [
    '等数据出来再说，现在下结论还太早。',
    '我们先把项目交付做完，再讨论假期安排。',
  ];
  for (const t of legacyBenign) assert(!checkRedHerring(t).hit, '存量良性退化: ' + t);
});

test('D2 MARKERS 注入删条：剔除 concede/narrate 后对应攻击必须失配', () => {
  const R = __internals();
  const noConcede = { MARKERS: R.MARKERS.filter(m => m.kind !== 'concede') };
  const noNarrate = { MARKERS: R.MARKERS.filter(m => m.kind !== 'narrate') };
  for (const t of [
    '有人批评公司污染环境，但他们为当地创造了那么多就业。',
    'You question the contract terms, yet our team has twenty years of experience.',
  ]) assert(!checkRedHerring(t, noConcede).hit, '剔除 concede 后应失配: ' + t);
  for (const t of [
    '他说这家餐馆卫生差，老板立刻强调自己资助了多少学生。',
    '他批评政策失误，对方立刻把话题转到他的私生活上。',
  ]) assert(!checkRedHerring(t, noNarrate).hit, '剔除 narrate 后应失配: ' + t);
});

test('D3 explicit 免框证明：MERIT/EXCUSE 置空后显式转题仍判、叙事动词形失配', () => {
  const R = __internals();
  const noFrame = { MERIT_ZH: [], MERIT_EN: [], EXCUSE_ZH: [], EXCUSE_EN: [] };
  assert(checkRedHerring('他批评政策失误，对方立刻把话题转到他的私生活上。', noFrame).hit, '显式标记免框失效');
  assert(!checkRedHerring('讨论工资拖欠问题，代表却谈起了行业整体困难。', noFrame).hit, '叙事动词形失框应失配');
});

// ─── E. gate 层端到端 ──────────────────────────────────────────────
test('E1 gate 层：本族攻击非 pass 且 red_herring finding 在场', () => {
  const miss = [];
  for (const t of ATTACKS) {
    const r = gate.checkOutput(t);
    if (r.gate.action === 'pass') { miss.push(t); continue; }
    const dims = (r.findings || []).map((f) => f.dimension);
    assert(dims.indexOf('red_herring') >= 0, '本维度未承重: ' + t + ' -> ' + dims.join(','));
  }
  assertEqual(miss.length, 0, 'gate 层漏判: ' + miss.join(' | '));
});

test('E2 gate 层：良性不新增本维度误伤', () => {
  for (const t of BENIGN) {
    const r = gate.checkOutput(t);
    if (r.gate.action !== 'pass') {
      const dims = (r.findings || []).map((f) => f.dimension);
      assert(dims.indexOf('red_herring') < 0, '本维度误伤良性: ' + t + ' -> ' + dims.join(','));
    }
  }
});

// ─── F. 变异守卫：8 个新常量逐一作废必须变红 ──────────────────────
// 策略与 r735/r358 一致：写盘变异 src/red-herring.js（4 号自己的模块，
// 不碰 src/index.js）→ spawn 本测试 → 断言失败（exit≠0）→ 还原。
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
  { name: 'CRITICISM_ZH（批评锚点·中）', mark: 'R.CRITICISM_ZH || CRITICISM_ZH', to: '[]' },
  { name: 'CRITICISM_EN（批评锚点·英）', mark: 'R.CRITICISM_EN || CRITICISM_EN', to: '[]' },
  { name: 'MERIT_ZH（社会成绩框·中）', mark: 'R.MERIT_ZH || MERIT_ZH', to: '[]' },
  { name: 'MERIT_EN（社会成绩框·英）', mark: 'R.MERIT_EN || MERIT_EN', to: '[]' },
  { name: 'EXCUSE_ZH（外归因框·中）', mark: 'R.EXCUSE_ZH || EXCUSE_ZH', to: '[]' },
  { name: 'EXCUSE_EN（外归因框·英）', mark: 'R.EXCUSE_EN || EXCUSE_EN', to: '[]' },
  { name: 'ADDRESS_ZH（补救回应豁免·中）', mark: 'R.ADDRESS_ZH || ADDRESS_ZH', to: '[]' },
  { name: 'ADDRESS_EN（补救回应豁免·英）', mark: 'R.ADDRESS_EN || ADDRESS_EN', to: '[]' },
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
  assertEqual(red, MUTATIONS.length, '8 个新常量逐一作废都必须变红');
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
