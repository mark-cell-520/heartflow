/**
 * test/round-402-motivated-reasoning-benefit-imputation.test.js
 *
 * [r402] 第 232 维度 motivated_reasoning（诉诸动机/Bulverism）新增措辞家族：
 * **实利归因即驳回族**（既有维度扩族，src/index.js 零改动、dimMap 键数不变）。
 *
 * 背景（r402 立项探针实测，非推测）：存量射程只认「身份/处境归因」
 * （同行/既得利益/被收买/屁股决定脑袋/biased/on the payroll），对
 * **可计量物质收益归因**整族穿透——「他说这话纯粹是为了卖课，你别信」
 * 「She wants the extra scan only to bump up her bill.」存量 4/6 漏判、
 * 良性 0/6 误伤。本轮落地新族补上射程。
 * 海外扫描（arXiv cs.AI/cs.CL + GitHub + S2）按 hf4-scout.sh 走查，
 * arXiv 命中条目的 title/summary 经 triage 后无直接可落地措辞族
 * （记录在 coordination/agent4/r402-scout-logicrun.log），按既有形态自建。
 *
 * 本轮是真升级②（已有维度的全新措辞家族）。判据：
 *   MOTIVE_B_ZH/EN 实利归因族 × 腿② claimRefZh/claimActZh/claimActEn
 *   论点可指认扩展 × 腿③（既有 dismiss / 纯动机推定通道）。
 *   腿①形态：排他标记（纯粹/说到底/不外乎/一心想/无非/只是/就；EN
 *       only/merely/just/simply/purely）× 实利动词（是为了/是想/意在/
 *       图/谋求/贪图/为了；EN to sell/to bump/only oppose…because）×
 *       可计量物质收益名词（卖课/多收一次费/提成/回扣/流量/KPI/位子；
 *       EN bill/commission/promotion/quota/bonus）。
 *
 * 与存量 MOTIVE_A 刻意错开：存量认身份/处境词，新族认具体经济收益词；
 * 存量排他标记只认 无非/不过/只不过/只是，新族扩展到 纯粹/说到底/
 * 说到底/一心想 + EN only/merely/simply/purely to-形。
 *
 * 良性边界锁（B7-B9 设计纪律，全部落测试断言）：
 *   - 第一人称（我/我们/本人）是动机自陈披露，不判；
 *   - 机构主体（医院/平台/公司/机制）是制度激励分析，不判；
 *   - 公共利益框架（老百姓的利益/用户的权益）实利名词语义被接管，不判；
 *   - 否定形（纯粹不想挣钱）是否定陈述，不判；
 *   - 无可指认论点（他纯粹是想挣钱）不判——腿②要求论点可指认；
 *   - 可核查理由（是因为上次的指标有异常）不判（含 NFKC 半角逗号修正）。
 *
 * 基准规模：模块层攻击 15 条（新族承重）、良性 17 条、边界锁 C1-C7、
 * 存量回归 D1-D2、gate 层端到端 E1-E2、变异守卫 10 个锚点。
 */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/motivated-reasoning.js');
const gate = require(path.join(ROOT, 'src/gate.js'));
const { checkMotivatedReasoning } = require(path.join(ROOT, 'src/motivated-reasoning.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 模块层：实利归因攻击 15 条，全部由本轮新族承重 ──────────────
const ATTACKS = [
  // r402 立项探针穿透样本（存量射程 4/6 漏判）
  '他说这话纯粹是为了卖课，你别信',
  '她坚持复查，不过是想多收一次费',
  'You only oppose the merger because you did not get the job.',
  'She wants the extra scan only to bump up her bill.',
  'He is just saying that to sell more books.',
  // 腿①变体（说到底/只是想要/无非是图/鼓吹/一心想）
  '专家建议收紧审批，说到底是为了保住自己的位子',
  '他反对新政只是想要提成',
  '你质疑这个标准，无非是图回扣',
  '他们鼓吹换设备，纯粹是为了业绩',
  '她组织这次测评，一心想的是流量',
  // EN 变体（to-形 / purely to / merely to / 标记后置形 / 言论动词形）
  'The critic pans every sequel only to drive traffic to his own site.',
  'She recommends the audit purely to inflate her consulting bill.',
  'The vendor pushes the upgrade merely to boost commission.',
  'You support the merger just because it pads your own bonus.',
  '这番话无非是想多收点学费',
];
test('A1 攻击 15 条单维全命中且由实利归因新族承重', () => {
  let n = 0;
  for (const t of ATTACKS) {
    const r = checkMotivatedReasoning(t);
    assert(r.hit, '未命中: ' + t);
    assert(r.count >= 1, 'count 应 >= 1: ' + t);
    // detail 形如「诉诸动机(zh/benefit+dismiss: …)」——benefit 路由即新族
    if (r.detail.indexOf('benefit') >= 0) n++;
    else console.log('  [存量代拦] ' + t + ' -> ' + r.detail.slice(0, 40));
  }
  assertEqual(n, ATTACKS.length, '应由实利归因新族承重的条数');
});

// ─── B. 模块层：良性 16 条不误伤 ────────────────────────────────────
const BENIGN = [
  // 第一人称动机自陈披露（B7：自陈不是 Bulverism）
  '我推荐这门课只是想把东西讲好，不图别的',
  // 机构制度激励分析（B8：主体是机制不是言者）
  '医院鼓励复查，因为每次复查都有收益，这是机制设计问题',
  '平台做信息流是为了流量，这是商业模式决定的',
  // 可核查理由（B9：理由实质段 + NFKC 半角逗号修正）
  '她坚持复查，是因为上次的指标有异常',
  '他反对新政，是因为方案里第三条确实超预算了',
  // 公共利益框架（PUBLIC_BENEFIT 豁免）
  '他这么做只是为了老百姓的利益',
  '这项改革纯粹是为了用户的权益',
  '他推荐这项改革纯粹是为了老百姓的利益',
  // 利益冲突正当披露
  '他是同行，但数据核对过没问题',
  // 存疑 / 疑问 / 元讨论
  '他推荐这门课可能只是为了卖课，也许另有原因',
  '他为什么推荐这门课？是为了卖课吗？',
  '诉诸动机是一种循环论证变体，本节课分析它的结构',
  'bulverism is the fallacy of explaining away a view by the speaker\'s motives',
  // 无排他标记的普通因果
  '他推荐这款产品是因为效果好',
  '她要求复查是流程规定',
  'He recommends the book because it is well researched.',
  'She requested a second opinion as standard procedure.',
];
test('B1 良性 17 条模块层不误伤', () => {
  const fps = [];
  for (const t of BENIGN) {
    const r = checkMotivatedReasoning(t);
    if (r.hit) fps.push(t + ' -> ' + r.detail);
  }
  assertEqual(fps.length, 0, '误伤: ' + fps.join(' | '));
});

// ─── C. 边界锁（保守边界本身锁住，防未来被当漏判修掉）────────────────
test('C1 PUBLIC_BENEFIT 豁免：受益方是公众/他人时不判', () => {
  assert(checkMotivatedReasoning('他说这话纯粹是为了卖课，你别信').hit, '基线应命中');
  assert(!checkMotivatedReasoning('他这么做只是为了老百姓的利益').hit, 'PUBLIC_BENEFIT 失效（中）');
  assert(!checkMotivatedReasoning('这项改革纯粹是为了用户的权益').hit, 'PUBLIC_BENEFIT 失效（中2）');
});

test('C2 第一人称自陈披露不判（B7）', () => {
  assert(!checkMotivatedReasoning('我推荐这门课只是想把东西讲好，不图别的').hit, '第一人称自陈被误判');
  assert(!checkMotivatedReasoning('我坚持复查，不过是想多确认一次，免得漏诊').hit, '第一人称自陈被误判（2）');
});

test('C3 机构制度激励分析不判（B8）', () => {
  assert(!checkMotivatedReasoning('医院鼓励复查，因为每次复查都有收益，这是机制设计问题').hit, '机构主体被误判');
  assert(!checkMotivatedReasoning('平台做信息流是为了流量，这是商业模式决定的').hit, '机构主体被误判（2）');
});

test('C4 否定形不判（纯粹不想挣钱）', () => {
  assert(!checkMotivatedReasoning('他纯粹不想挣钱').hit, '否定形被误判');
  assert(!checkMotivatedReasoning('她推荐这门课不是为了卖课，是为了真的帮到读者').hit, '否定形被误判（2）');
});

test('C5 无可指认论点不判（腿②约束：他纯粹是想挣钱）', () => {
  assert(!checkMotivatedReasoning('他纯粹是想挣钱').hit, '无论点指代不应判');
  assert(checkMotivatedReasoning('他推荐这门课纯粹是想挣钱').hit, '有论点动词应命中');
});

test('C6 可核查理由不判（含 NFKC 半角逗号跨子句修正）', () => {
  assert(!checkMotivatedReasoning('她坚持复查，是因为上次的指标有异常').hit, '理由实质段被误判');
  assert(!checkMotivatedReasoning('她坚持复查,是因为上次的指标有异常').hit, '半角逗号版仍应豁免');
  assert(!checkMotivatedReasoning('他反对新政，是因为方案里第三条确实超预算了').hit, 'REASON_GIVEN 失效');
});

test('C7 全局豁免在本族上仍然有效（HEDGE/QUESTION/META）', () => {
  assert(!checkMotivatedReasoning('他推荐这门课可能只是为了卖课，也许另有原因').hit, 'HEDGE 失效');
  assert(!checkMotivatedReasoning('他为什么推荐这门课？是为了卖课吗？').hit, 'QUESTION 失效');
  assert(!checkMotivatedReasoning('诉诸动机是一种循环论证变体，本节课分析它的结构').hit, 'META 失效');
});

// ─── D. 存量回归（MOTIVE_A 身份处境族不受影响）─────────────────────
test('D1 存量 MOTIVE_A 攻击不回归（模块层）', () => {
  for (const t of ['他说这些无非是想出名',
    '他之所以反对，不过是因为他是同行，利益相关而已。',
    'We can dismiss his objection; he is only protecting his own interests.',
    '她反对这个方案，不过是因为她是既得利益者']) {
    assert(checkMotivatedReasoning(t).hit, '存量 MOTIVE_A 退化: ' + t);
  }
});

test('D2 存量良性不回归（模块层）', () => {
  for (const t of ['他推荐这款产品是因为效果好',
    '他反对新政，是因为方案里第三条确实超预算了',
    'He recommends the book because it is well researched.']) {
    assert(!checkMotivatedReasoning(t).hit, '存量良性退化: ' + t);
  }
});

// ─── E. gate 层端到端 ──────────────────────────────────────────────
test('E1 gate 层：本族攻击非 pass 且 motivated_reasoning finding 在场', () => {
  const miss = [];
  for (const t of ATTACKS) {
    const r = gate.checkOutput(t);
    if (r.gate.action === 'pass') { miss.push(t); continue; }
    const dims = (r.findings || []).map((f) => f.dimension);
    assert(dims.indexOf('motivated_reasoning') >= 0, '本维度未承重: ' + t + ' -> ' + dims.join(','));
  }
  assertEqual(miss.length, 0, 'gate 层漏判: ' + miss.join(' | '));
});

test('E2 gate 层：良性不新增本维度误伤（存量误伤逐项一致）', () => {
  // 基线（r402 改动前同批实测，git stash 对照）：3/16 非 pass，全部来自
  // 存量维度（monocausal_attribution ×2 / completion_evidence ×1），与本族
  // 无关。这里锁「motivated_reasoning 零误伤」。
  let preexisting = 0;
  for (const t of BENIGN) {
    const r = gate.checkOutput(t);
    if (r.gate.action !== 'pass') {
      const dims = (r.findings || []).map((f) => f.dimension);
      assert(dims.indexOf('motivated_reasoning') < 0, '本维度误伤良性: ' + t + ' -> ' + dims.join(','));
      preexisting++;
    }
  }
  assertEqual(preexisting, 3, '存量误伤条数应与基线一致（3 条，全为存量维度）');
});

// ─── F. 变异守卫：10 个锚点逐一作废必须变红 ───────────────────────
// 策略与 r401/r735 一致：写盘变异 src/motivated-reasoning.js（4 号自己的
// 模块，不碰 src/index.js）→ spawn 本测试 → 断言失败（exit≠0）→ 还原。
// 变异只把用法点的正则组换成永不匹配的 [^\s\S] 或删去扩展动词尾，
// 语法保持合法，断言失败而非加载崩溃。
// 说明：DISMISS_ZH 本轮扩展（你别信/不足信/信不得）不单独设守卫——
// 该通道与 r257 纯动机推定通道冗余覆盖同一批样本（探针实测 dismiss
// 通道无独占承重样本），作废它任何断言都不会红，设了就是假守卫。
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
  { name: 'MOTIVE_B_ZH 实利名词组', mark: '(卖课|售卖|多收|收费|收钱|提成|回扣|返点|奖金|钱财|生意|流量|名气|地位|升职|位子|业绩|绩效|学费|医药费|挂号费|检查费|手术费|教材费|会员费|佣金|报酬|外快|油水|钱|财|利)', to: '[^\\s\\S]' },
  { name: 'MOTIVE_B_ZH 排他标记×实利动词跨', mark: '[^。；，,;不没未勿]{0,8}(是为了|是想|意在|图的是|惦记的是|冲的是|冲着|想要|想|图|图个|谋求|贪图|为了|的是)', to: '[^\\s\\S]' },
  { name: 'MOTIVE_B_EN 实利名词组', mark: '(?:sales?|bills?|commission|commissions?|money|profit|profits?|fees?|revenue|numbers?|quota|clicks?|traffic|bonus|premium|tuition|rating|rankings?|ads?|streams?|views?|books?|courses?|copies|enrollments?|sign-?ups?|subscriptions?)', to: '(?:[^\\s\\S])' },
  { name: 'MOTIVE_B_EN only+动词+because 动词组', mark: '(?:oppose|opposes|support|supports|want|wants|insist|insists|push|pushes|pushing|recommend|recommends|order|orders|request|requests|demand|demands|arrange|arranges|endorse|endorses|reject|rejects|criticize|criticizes|praise|praises)', to: '(?:[^\\s\\S])' },
  { name: 'MOTIVE_B_EN 标记后置形动词组', mark: '(?:oppose|opposes|support|supports|want|wants|insist|insists|push|pushes|pushing|recommend|recommends|order|orders|request|requests|demand|demands|arrange|arranges|endorse|endorses|reject|rejects|criticize|criticizes|praise|praises|say|says|said|claim|claims|argue|argues)', to: '(?:[^\\s\\S])' },
  { name: 'PUBLIC_BENEFIT 公共利益主体组', mark: '(人民|群众|公众|大家|老百姓|消费者|用户|患者|学生|孩子|家人|社区|公共|集体|国家|社会|大局)', to: '[^\\s\\S]' },
  { name: 'claimRefZh 论点指代名词组', mark: '(这话|这番|这种话|这套|这一套|此番|此论|该言论|这番言论|这种说法|那套|这一论)', to: '[^\\s\\S]' },
  { name: 'claimActZh 主语组', mark: '(你|您|他|她|他们|对方|此人|专家|作者|医生|老师|律师|老板|家长|会员|观众|读者|消费者|那位|某)', to: '[^\\s\\S]' },
  { name: 'claimActEn 扩展动词尾', mark: '|pans|slams|trashes|bashes|blasts|attacks|mocks|ridicules|knocks)', to: ')' },
  { name: 'MOTIVE_A_ZH 半角逗号跨子句修正', mark: '[^，。；,;]{0,18}', to: '[^，。；]{0,18}' },
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
  assertEqual(red, MUTATIONS.length, '10 个锚点逐一作废都必须变红');
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
