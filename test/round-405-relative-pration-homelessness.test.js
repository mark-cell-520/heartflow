/**
 * test/round-405-relative-pration-homelessness.test.js
 *
 * [r405] 第 156 维度 relative_pration（诉诸更惨 / 相对剥夺式堵嘴）新增措辞
 * 家族：**「无家可归/安身缺口」族**（既有维度扩族，src/index.js 零改动、
 * dimMap 键数不变；真升级②）。
 *
 * 立项探针实证（coordination/agent4/r405-probe-pool.output.txt，v6.8.203
 * gate() 全量）：存量腿①具体苦难参照只覆盖「没饭吃/睡大街/失业」等生存
 * 缺口，**安身缺口**整族穿透——「你抱怨房租贵？想想还有多少人无家可归」
 * 「You think your workload is bad? Some people do not even have a job.」
 * 「Stop complaining about the commute—some people walk for hours…」
 * 「At least you have a bed to sleep in; some people have nowhere to sleep
 * at night.」「You call this exhausting? Plenty of people cannot even
 * afford a place to stay.」改前 5/8 漏判、良性 1/8 误伤（且该误伤为存量
 * 维度 presupposition，非本维度）。
 *
 * 本轮落地（改后同池复测：攻击 11/11 全命中且归因 relative_pration、
 * 良性 14 条模块层零命中、stash 前后对照证实 2 条存量非 pass 样本与本轮
 * 改动零相关）：
 *   · RP_SUFFER_ZH +7：无家可归/流离失所/居无定所/无处安身/上无片瓦/
 *     露宿街头/风餐露宿（腿①，仍只收具体安处境短语）
 *   · RP_SUFFER_EN +4：do not even have a job|place / walk (for) N
 *     hours|miles / nowhere to sleep|live|stay / cannot (even) afford
 *     a place|home|house|room|bed
 *   · RP_DISMISS_ZH/EN 反问式压制形（腿②扩展）：你+抱怨/喊/嫌/叫苦/叫累/
 *     哭/诉苦+？；EN you think|call|say + your|this|that|it + ？
 *     （宾语锁对方诉求，「You think the housing crisis is serious?」类
 *     议题提问不误伤）
 *
 * 仍守双腿共现（sufferHit AND dismissHit，缺一不判）。边界锁全部落断言：
 * 政策讨论无腿②不判、议题提问（无 your/this/that/it 宾语）不判、
 * 单腿不判、五大守卫常量不回归。
 */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/relative-pration.js');
const gate = require(path.join(ROOT, 'src/gate.js'));
const rprMod = require(path.join(ROOT, 'src/relative-pration.js'));
const { checkRelativePrivation } = rprMod;

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }
const hit = (s) => checkRelativePrivation(s).score > 0;
const gateDims = (s) => (gate.checkOutput(s).findings || []).map((f) => f.dimension);

// ─── A. 模块层：安身缺口攻击 11 条，全部命中 ────────────────────────
// 前 8 条为立项探针穿透样本（改前漏判）；后 3 条为反问式压制形扩展。
// 设计纪律：每条攻击的腿①苦难参照必须是**本轮新短语独占**（变异守卫
// 逐条作废时该样本必须翻转），故每条只含一个新苦难词、不含存量苦难词。
const ATTACKS = [
  '你抱怨房租贵？想想还有多少人无家可归',
  'You think your workload is bad? Some people do not even have a job.',
  'Stop complaining about the commute—some people walk for hours to get to work.',
  'At least you have a bed to sleep in; some people have nowhere to sleep at night.',
  'You call this exhausting? Plenty of people cannot even afford a place to stay.',
  '你嫌累？有人连安稳觉都睡不上',
  '你叫苦什么？山里的孩子连教室都没有',
  'You say your deadline is tight? Some teams cannot even afford a place to work.',
  // 腿①独占样本（供变异守卫逐条翻转）
  '别抱怨奔波苦，历史上多少人流离失所，你这点坎坷算什么',
  '别喊累了，旧社会艺人无处安身，你这点加班算什么',
  '叫苦什么，旧时农民上无片瓦，你这点压力算什么',
  '别抱怨帐篷漏风，昨晚暴雨里露宿街头，你这点苦算什么',
  '喊什么累，勘探队风餐露宿，你这点通勤算什么',
  '嫌房间小？历史上读书人居无定所，你这点委屈算什么',
];
test('A1 攻击 14 条模块层全命中', () => {
  for (const s of ATTACKS) assert(hit(s), '漏判: ' + s);
});
test('A2 攻击 14 条腿②全部在位（双腿共现）', () => {
  // 逐条删腿②后必须不判——防止「苦难短语单腿误判」
  const noDismiss = [
    '还有多少人无家可归',
    'Some people do not even have a job.',
    'some people walk for hours to get to work.',
    'some people have nowhere to sleep at night.',
    'Plenty of people cannot even afford a place to stay.',
    '有人连安稳觉都睡不上',
    '山里的孩子连教室都没有',
    'Some teams cannot even afford a place to work.',
    '历史上多少人流离失所',
    '旧社会艺人无处安身',
    '旧时农民上无片瓦',
    '灾民露宿街头',
    '勘探队风餐露宿',
    '历史上读书人居无定所',
  ];
  for (const s of noDismiss) assert(!hit(s), '单腿误判（缺腿②仍判）: ' + s);
});

// ─── B. 良性 14 条：模块层零命中；gate 层不新增归因 ─────────────────
const BENIGN = [
  '加班确实辛苦，但同时也要看到还有更困难的群体，两者并不矛盾',
  '虽然我们有诸多不易，承认别人的苦难同样重要',
  '我们的待遇还有改善空间，这与关注更广泛的议题并不冲突',
  'Yes others struggle more, but that does not make your workload okay to ignore.',
  '理解全球贫困很重要，这也包括对住房保障制度的持续投入',
  '无家可归是城市治理的重要议题，需要系统性的住房保障方案',
  '他每天通勤四小时，确实辛苦',
  'Some people walk an hour to work, which is why transit funding matters.',
  '你觉得房租高吗？我们可以对比各城市的收入房价比数据',
  'You think the housing crisis is serious? Many people are homeless and the city must act.',
  '灾民流离失所，应急安置和长期住房保障都要跟上',
  '许多人无家可归，收容所 capacity 需要扩建——这是社会政策问题',
  '他露宿街头一周了，社工已经介入',
  'Do you think the shelter has enough beds? The intake numbers are public.',
];
test('B1 良性 14 条模块层零命中', () => {
  for (const s of BENIGN) assert(!hit(s), '误伤: ' + s);
});
test('B2 良性 14 条 gate 层不归因 relative_pration', () => {
  for (const s of BENIGN) {
    const dims = gateDims(s);
    assert(!dims.includes('relative_pration'), 'relative_pration 误伤: ' + s + ' -> ' + dims.join(','));
  }
});
test('B3 良性存量非 pass 条数与基线一致（2 条，均为存量维度）', () => {
  // 「无家可归是城市治理…」rewrite-none、「You think the housing crisis…」
  // verify vagueness——stash 前后对照实证与本轮改动零相关
  // （coordination/agent4/r405-benign-stash.output.txt，DIFF 为空）。
  let pre = 0;
  for (const s of BENIGN) if (gate.checkOutput(s).gate.action !== 'pass') pre++;
  assertEqual(pre, 2, '存量非 pass 条数应为 2');
});

// ─── C. 边界锁：守卫常量 + 单腿 + NFKC 半角形 ─────────────────────
test('C1 META 谬误概念转述不判', () => {
  assert(!hit('所谓诉诸更惨，就是拿别人更惨来堵嘴的逻辑谬误'));
  assert(!hit('Relative privation is the fallacy of saying "others have it worse".'));
});
test('C2 TEACH 教学转述不判', () => {
  assert(!hit('这节课讲诉诸更惨：有人无家可归，你就别抱怨房租了'));
});
test('C3 NEG_FLIP 否定翻转不判', () => {
  assert(!hit('别人无家可归，但这不能抵消你的房租压力'));
  assert(!hit('Others are homeless, but that does not negate your rent burden.'));
});
test('C4 HEDGE 对冲不判', () => {
  assert(!hit('也许有人无家可归，但你的房租压力也是真的'));
});
test('C5 SELF_SUFFER 第一人称自陈比惨不判（让位 suffering_contest）', () => {
  assert(!hit('我比你惨多了，我当年也流离失所过'));
});
test('C6 单腿不判：只有压制无苦难参照', () => {
  assert(!hit('Stop complaining and focus on the fix.'));
  assert(!hit('你叫苦什么，先看数据'));
});
test('C7 单腿不判：只有苦难参照无压制（政策讨论形）', () => {
  assert(!hit('Many people are homeless in this city.'));
  assert(!hit('这座城市有许多人无家可归'));
});
test('C8 NFKC 半角标点形攻击仍命中（pipeline 折叠鲁棒性）', () => {
  assert(hit('你抱怨房租贵,想想还有多少人无家可归'), '半角逗号形漏判（想想通道）');
  assert(hit('你嫌累？,有人连安稳觉都睡不上'), '半角逗号形漏判（反问通道）');
});

// ─── D. 存量回归：r297 EN 家族 + r726 ZH 家族不回归 ────────────────
test('D1 存量 EN 攻击仍命中', () => {
  for (const s of [
    "Stop complaining about the overtime; plenty of people can't even find a job, you're lucky.",
    'This hardship is nothing compared to starving children, so you should be grateful.',
    'At least you can afford a doctor; many people cannot afford medicine.',
    "You're so lucky to have a bed — think of those sleeping on the street.",
  ]) assert(hit(s), '存量 EN 回归漏判: ' + s);
});
test('D2 存量 ZH 攻击仍命中', () => {
  for (const s of [
    '别喊累了，有人连饭都吃不上',
    '知足吧，还有人工资比你低一半呢',
    '至少公司还发工资，好多厂都倒闭了，知足吧',
    '别嫌房租贵了，有人睡大街呢',
  ]) assert(hit(s), '存量 ZH 回归漏判: ' + s);
});
test('D3 存量良性仍豁免', () => {
  for (const s of [
    '至少我们还有备份，系统可以恢复',
    '他虽然辛苦，但别人的苦难不能抵消他的困难',
    'We should be grateful for the backup system; at least the service can recover.',
    'The worker pool is starving for CPU under load; at least the latency budget held.',
  ]) assert(!hit(s), '存量良性回归误伤: ' + s);
});

// ─── E. gate 层端到端：攻击非 pass 且归因 relative_pration ─────────
test('E1 gate 攻击非 pass', () => {
  for (const s of ATTACKS) {
    const r = gate.checkOutput(s);
    assert(r.gate.action !== 'pass', 'gate 放行: ' + s + ' -> ' + r.gate.action);
  }
});
test('E2 gate 攻击归因 relative_pration', () => {
  for (const s of ATTACKS) {
    const dims = gateDims(s);
    assert(dims.includes('relative_pration'), '未归因 relative_pration: ' + s + ' -> ' + dims.join(','));
  }
});

// ─── F. 登记断言 ──────────────────────────────────────────────────
test('F1 维度键仍含 relative_pration（不新增维度键）', () => {
  const keys = Object.keys(gate.discriminate('probe').dimensions);
  assert(keys.includes('relative_pration'), 'relative_pration 键缺失');
});
test('F2 CONSTANTS 导出非空', () => {
  assert(rprMod.CONSTANTS && Array.isArray(rprMod.CONSTANTS.RP_SUFFER_ZH) && rprMod.CONSTANTS.RP_SUFFER_ZH.length >= 7);
  assert(Array.isArray(rprMod.CONSTANTS.RP_SUFFER_EN) && rprMod.CONSTANTS.RP_SUFFER_EN.length >= 4);
  assert(Array.isArray(rprMod.CONSTANTS.RP_DISMISS_ZH) && Array.isArray(rprMod.CONSTANTS.RP_DISMISS_EN));
});

// ─── G. 变异守卫：13 个锚点逐一作废必须变红 ────────────────────────
// 策略与 r401/r402 一致：写盘变异 src/relative-pration.js（4 号自己的
// 模块，不碰 src/index.js）→ spawn 本测试 → 断言失败（exit≠0）→ 还原。
// 变异只把本轮新模式换成永不匹配的 (?!) / [^\s\S]，语法保持合法，
// 断言失败而非加载崩溃。
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
const NEVER_ZH = "'(?!)', ";   // 字符串条目：永不匹配的正则源
const NEVER_EN = '/(?:[^\\s\\S])/i'; // 正则条目：永不匹配
const MUTATIONS = [
  { name: 'RP_SUFFER_ZH 无家可归', mark: "'无家可归', ", to: NEVER_ZH },
  { name: 'RP_SUFFER_ZH 流离失所', mark: "'流离失所', ", to: NEVER_ZH },
  { name: 'RP_SUFFER_ZH 居无定所', mark: "'居无定所', ", to: NEVER_ZH },
  { name: 'RP_SUFFER_ZH 无处安身', mark: "'无处安身', ", to: NEVER_ZH },
  { name: 'RP_SUFFER_ZH 上无片瓦', mark: "'上无片瓦',", to: "'(?!)'," },
  { name: 'RP_SUFFER_ZH 露宿街头', mark: "'露宿街头', ", to: NEVER_ZH },
  { name: 'RP_SUFFER_ZH 风餐露宿', mark: "'风餐露宿',", to: "'(?!)'," },
  { name: 'RP_SUFFER_EN do-not-even-have-a-job', mark: "/(?:don'?t|doesn'?t|do not|does not)\\s+even\\s+have\\s+(?:a|any)\\s+(?:job|work|income|place)\\b/i", to: NEVER_EN },
  { name: 'RP_SUFFER_EN walk-hours-miles', mark: "/\\bwalk(?:s|ed|ing)?\\s+(?:for\\s+)?(?:\\d+|two|three|four|five|several|many)?\\s*(?:hours?|miles?)\\b/i", to: NEVER_EN },
  { name: 'RP_SUFFER_EN nowhere-to-sleep', mark: "/\\bnowhere\\s+to\\s+(?:sleep|live|stay|go)\\b/i", to: NEVER_EN },
  { name: 'RP_SUFFER_EN cannot-afford-a-place', mark: "/(?:can'?t|cannot|couldn'?t)\\s+(?:even\\s+)?afford\\s+(?:a\\s+|any\\s+)?(?:place|home|house|room|bed)\\b/i", to: NEVER_EN },
  { name: 'RP_DISMISS_EN 反问式压制', mark: "/you\\s+(?:think|call|say)\\s+(?:your|this|that|it)\\b[^?]{0,50}\\?/i", to: NEVER_EN },
  { name: 'RP_DISMISS_ZH 反问式压制', mark: "'你[^。！？!?]{0,10}(?:抱怨|喊|嫌|叫苦|叫累|哭|诉苦)[^。！？!?]{0,10}[？?]'", to: "'(?!)'" },
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
  assertEqual(red, MUTATIONS.length, MUTATIONS.length + ' 个锚点逐一作废都必须变红');
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
