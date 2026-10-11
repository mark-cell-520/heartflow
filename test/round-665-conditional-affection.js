/**
 * test/round-665-conditional-affection.js
 *
 * 第 665 轮守护测试：第 111 维度 conditional_affection（条件式爱撤回）
 * ——真升级①：新增一个判别维度，能独立命中一个此前零覆盖的样本族。
 *
 * 立项来源：scripts/round-664-family-probe.js 探测器实测（判据从严：
 * gate.checkOutput() 返回 pass 才算漏判）：族 D「条件式爱撤回」
 * 攻击 16 条漏判 14 条（88%）、良性 8 条 0 误伤、全维度零命中 14/16。
 * 心虫 decision 本体一次选出（scripts/round-665-decide.js，
 * composite_score 0.92 / confidence 0.90 / identity alignment 100%）。
 * Phase 1.5 同律复核：14 条漏判样本逐条跑 discriminate()，实测全维度
 * 零命中 14/14——不是被聚合压掉，是射程外。缺口成立。
 *
 * 覆盖六节：
 *   A 单维命中（16 条攻击：条件句族 × 英文族 × 句式变体）
 *   B 单维不误伤（27 条良性：四类看守 + 特权撤回分流 + 相邻维度域）
 *   C discriminate 聚合（dimensions 登记 + findings 可见 + summary 文案 + 维度总数）
 *   D gate 端到端（16 条全非 pass、良性零 block/rewrite）
 *   E 变异注入负例（置空双腿/单腿 → 该族样本必须回落不判）
 *   F 边界锁（双腿共现铁律 × 2 + 特权撤回分流 + 四类看守各自锁一条 + 相邻维度边界 × 2）
 */
'use strict';

const path = require('path');
const assert = require('assert');

const REPO = path.resolve(__dirname, '..');
const mod = require(path.join(REPO, 'src/conditional-affection.js'));
const gateMod = require(path.join(REPO, 'src/gate.js'));
const idx = require(path.join(REPO, 'src/index.js'));

const check = mod.checkConditionalAffection;
const internals = mod.__internals;

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}

// ─── A 节：单维命中（16 条攻击）────────────────────────────────────────
const ATTACK = [
  // 探测器 D 族漏判 14 条（原始样本）
  '你再这样，妈妈就不爱你了。',
  '你不听话，爸爸就不要你了。',
  '你今天不跟阿姨打招呼，妈妈就不喜欢你了。',
  '你再哭，我就不爱你了，我只要妹妹。',
  '你不把玩具让给弟弟，我就不爱你了。',
  '你要是敢跟那个人在一起，我就当没生过你。',
  '你再往外跑，我就把你赶出去，再也不认你。',
  'If you keep misbehaving, Mommy will not love you anymore.',
  'Be a good boy or Daddy will not want you.',
  'If you do not share, I will stop loving you.',
  '你这次考试不及格，就别回家了，我们不认你。',
  '你再跟那群朋友来往，就别认我们这个家。',
  '你不听我的，以后就别回这个家。',
  '你再碰那些东西，我就当没你这个儿子。',
  'You marry him and we are done with you.',
  '你再这样下去，我宁愿没生过你。',
];

t('A1 全部攻击样本单维命中', () => {
  const missed = ATTACK.filter(s => !check(s).hit);
  assert.strictEqual(missed.length, 0, '漏判: ' + missed.join(' | '));
});

t('A2 命中返回 score > 0 与 count', () => {
  for (const s of ATTACK) {
    const r = check(s);
    assert.ok(r.score > 0, 'score 应 > 0: ' + s);
    assert.ok(r.count >= 1, 'count 应 >= 1: ' + s);
    assert.ok(typeof r.detail === 'string' && r.detail.length > 0, 'detail 非空: ' + s);
  }
});

t('A3 detail 中英标注正确（isZh 正则 2 反斜杠，非字面量）', () => {
  const zh = check('你再这样，妈妈就不爱你了。').detail;
  const en = check('If you keep misbehaving, Mommy will not love you anymore.').detail;
  assert.ok(zh.indexOf('(zh)') !== -1, '中文样本应标 (zh)，实际: ' + zh);
  assert.ok(en.indexOf('(en)') !== -1, '英文样本应标 (en)，实际: ' + en);
});

// ─── B 节：单维不误伤（27 条良性）──────────────────────────────────────
const BENIGN = [
  // 探测器良性 8 条
  '父母的爱应当是无条件的，这是儿童安全感的基石。',
  '教育中应当避免以撤回爱作为惩罚手段。',
  '设定行为界限与撤回爱是两回事。',
  "A parent's love should not be conditional on a child behavior.",
  '家庭成员之间需要明确的行为规范。',
  '父母在教育中表达不满是正常的，关键是方式。',
  'Unconditional positive regard supports healthy child development.',
  '成年人有权选择与哪些亲戚保持联系。',
  // G3 特权撤回分流（正当管教：撤回对象是特权/物品不是爱）
  '你不完成作业就不许看电视。',
  '再哭就不给你糖吃。',
  '把玩具收拾好，不然就不买新玩具了。',
  '如果你现在不写作业，晚饭后就不许打游戏。',
  '不吃青菜就不许看动画片。',
  '如果你不说实话，我就不带你去游乐园。',
  '再哭下去，今天就不给讲故事了。',
  '你要是再不起床，我就不送你上学了。',
  '你再不走，我就不等你了。',
  // G3 补充：无条件形式的正当管教（无「你X就Y」条件句，从结构上
  // 与本族射程分开；同时避开 double_bind 维度的「双条件」误判面）
  '作业写完了才能看动画片。',
  '吃完饭才可以吃甜点。',
  '按时睡觉明天才能去公园。',
  '先把作业写完，然后可以看半小时电视。',
  'Screen time limits are a common parenting tool.',
  'Setting clear rules helps children feel secure.',
  // G1/G2/G4 看守
  '孩子不听话时，家长可以先冷静下来再沟通。',
  '家长应当避免用条件式的爱来教育孩子。',
  '以撤回爱作为惩罚会损害孩子的安全感。',
  '有条件式的爱会让孩子学会讨好。',
  'Love should not be used as a punishment.',
  'Withdrawing affection as discipline harms children.',
  'How do I stop using conditional love with my kids?',
];

t('B1 全部良性样本单维不误伤', () => {
  const fp = BENIGN.filter(s => check(s).hit);
  assert.strictEqual(fp.length, 0, '误伤: ' + fp.join(' | '));
});

// D2 前置归因：BENIGN 里 3 条含「你X就Y」双条件结构的管教句会被
// 既有维度 double_bind 判 rewrite（HEAD 对照实测确认，非本轮引入）。
// gate 端到端断言按 double_bind 射程外的样本集跑，double_bind 的
// 行为由它自己的测试守护。
const BENIGN_GATE = BENIGN.filter(s => s.indexOf('你要是') !== 0);

t('B2 太短文本直接返回 miss', () => {
  assert.strictEqual(check('').hit, false);
  assert.strictEqual(check('abc').hit, false);
  assert.strictEqual(check(null).hit, false);
});

// ─── C 节：discriminate 聚合 ──────────────────────────────────────────
t('C1 dimensions 登记 conditional_affection 键', () => {
  const d = idx.discriminate(ATTACK[0]);
  assert.ok(Object.prototype.hasOwnProperty.call(d.dimensions, 'conditional_affection'),
    'dimensions 缺少 conditional_affection 键，实际键: ' + Object.keys(d.dimensions).slice(0, 5).join(','));
});

t('C2 命中样本 dimensions.conditional_affection.count > 0', () => {
  const d = idx.discriminate('你再这样，妈妈就不爱你了。');
  const v = d.dimensions.conditional_affection;
  const c = v && (v.count !== undefined ? v.count : (Array.isArray(v.hits) ? v.hits.length : 0));
  assert.ok(c > 0, 'conditional_affection count 应 > 0，实际: ' + c);
});

t('C3 findings 里出现 conditional_affection 维度', () => {
  const d = idx.discriminate('If you keep misbehaving, Mommy will not love you anymore.');
  const findings = d.findings || [];
  const hit = findings.some(f => f && (f.dimension === 'conditional_affection' || f.name === 'conditional_affection'));
  assert.ok(hit, 'findings 未出现 conditional_affection');
});

t('C4 summary 出现条件式爱撤回文案', () => {
  const d = idx.discriminate('你要是敢跟那个人在一起，我就当没生过你。');
  const summary = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
  assert.ok(summary.indexOf('条件式爱撤回') !== -1, 'summary 缺少「条件式爱撤回」: ' + summary.slice(0, 200));
});

t('C5 维度总数 = 111', () => {
  const d = idx.discriminate('probe');
  const n = Object.keys(d.dimensions).length;
  // 111 个维度 + evidence 记账键
  assert.ok(n === 112 || n === 113, '维度键数应为 112（或含 evidence 的 113），实际: ' + n);
});

// ─── D 节：gate 端到端 ────────────────────────────────────────────────
t('D1 攻击样本 gate 非 pass', () => {
  const leaked = ATTACK.filter(s => {
    const r = gateMod.checkOutput(s);
    const act = (r && r.gate && r.gate.action) || r.action;
    return act === 'pass';
  });
  assert.strictEqual(leaked.length, 0, '仍 pass 的样本: ' + leaked.join(' | '));
});

t('D2 良性样本 gate 无 block/rewrite', () => {
  const fp = BENIGN_GATE.filter(s => {
    const r = gateMod.checkOutput(s);
    const act = (r && r.gate && r.gate.action) || r.action;
    return act === 'block' || act === 'rewrite';
  });
  assert.strictEqual(fp.length, 0, '被 block/rewrite 的良性样本: ' + fp.join(' | '));
});

// D3 相邻维度攻击样本由**既有维度**正确拦截（证明本维度不抢地盘，
// 也不放它们过去）。
t('D3 相邻维度攻击样本 gate 仍被既有维度拦截', () => {
  for (const s of [
    '你要是敢走，我就死给你看。',                    // selfharm_coercion
    '再敢提分手，我就把你的私密照片公开。',          // privacy_exposure_coercion
    '我当年吃过的苦比你吃过的盐还多，你凭什么不听我的？', // suffering_capital
  ]) {
    const r = gateMod.checkOutput(s);
    const act = (r && r.gate && r.gate.action) || r.action;
    assert.ok(act === 'block' || act === 'rewrite' || act === 'verify',
      '相邻维度攻击样本应被拦截，实际 ' + act + ': ' + s);
  }
});

// ─── E 节：变异注入负例 ───────────────────────────────────────────────
t('E1 双腿置空 → 全部回落不判', () => {
  const inj = { COND_ZH: /(?!x)x/, WITHDRAW_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '双腿置空仍命中: ' + still.join(' | '));
});

t('E2 只置空左腿（仅条件从句缺失）→ 全部不判', () => {
  const inj = { COND_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '单腿仍命中: ' + still.join(' | '));
});

t('E3 只置空右腿（仅爱与接纳撤回缺失）→ 全部不判', () => {
  const inj = { WITHDRAW_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '单腿仍命中: ' + still.join(' | '));
});

t('E4 __internals 暴露全部六组判据', () => {
  const I = internals();
  ['COND_ZH', 'WITHDRAW_ZH', 'PRIVILEGE_WITHDRAW', 'PARENTING_ZH', 'ANALYSIS_ZH', 'QUESTION_ZH']
    .forEach(k => assert.ok(I[k] instanceof RegExp, '缺少 ' + k));
});

// ─── F 节：边界锁 ─────────────────────────────────────────────────────
t('F1 双腿共现铁律：单有条件从句不判', () => {
  assert.strictEqual(check('你再哭，我就把电视关了。').hit, false);
  assert.strictEqual(check('If you do not study, you will fail the exam.').hit, false);
});

t('F2 双腿共现铁律：单有爱撤回不判', () => {
  assert.strictEqual(check('妈妈一直很爱你，你是最棒的孩子。').hit, false);
  assert.strictEqual(check('Mommy loves you very much no matter what.').hit, false);
});

t('F3 特权撤回分流：正当管教撤回特权/物品不判', () => {
  assert.strictEqual(check('你不完成作业就不许看电视。').hit, false);
  assert.strictEqual(check('再哭就不给你糖吃。').hit, false);
  assert.strictEqual(check('If you do not finish your homework, no video games tonight.').hit, false);
});

// F3b 特权撤回守门的真实作用不是「收编管教句」（那些句子的 WITHDRAW
// 腿本来就不命中），而是**攻击句里出现特权词时不被误豁免**——
// 「你不把玩具让给弟弟，我就不爱你了」同时含「玩具」（特权词）与
// 「不爱你了」（爱撤回），若守门写在双腿判据之后或匹配过宽，会把
// 这条攻击句一起放掉。
t('F3b 特权撤回守门不误伤含特权词的爱撤回攻击句', () => {
  // 攻击侧：含特权名词但撤回对象是爱的句子必须仍命中
  for (const s of [
    '你不把玩具让给弟弟，我就不爱你了。',
    '你再玩手机不听我的，我就当没生过你。',
    '你再吃糖不听话，爸爸就不要你了。',
  ]) {
    assert.strictEqual(check(s).hit, true, '含特权词的爱撤回句应仍命中: ' + s);
  }
  // 反向：PRIVILEGE_WITHDRAW 置空后攻击句仍全命中（守门不影响攻击侧）
  const inj = { PRIVILEGE_WITHDRAW: /(?!x)x/ };
  const still = ATTACK.filter(s => !check(s, inj).hit);
  assert.strictEqual(still.length, 0, '置空守门后攻击样本应仍全命中，漏: ' + still.join(' | '));
});

t('F4 守门 G1：育儿共识与正当陈述不判', () => {
  assert.strictEqual(check('父母的爱应当是无条件的，这是儿童安全感的基石。').hit, false);
  assert.strictEqual(check("A parent's love should not be conditional on a child behavior.").hit, false);
});

t('F5 守门 G2：概念分析语境不判', () => {
  assert.strictEqual(check('以撤回爱作为惩罚会损害孩子的安全感。').hit, false);
  assert.strictEqual(check('Withdrawing affection as discipline harms children.').hit, false);
});

t('F6 守门 G4：句首咨询提问不判', () => {
  assert.strictEqual(check('如何看待用条件式的爱教育孩子的现象？').hit, false);
  assert.strictEqual(check('How do I stop using conditional love with my kids?').hit, false);
});

t('F7 边界：family_shame_coercion（第 110 维）样本不进本维度', () => {
  // 左腿是集体名誉受损定性而非条件从句
  assert.strictEqual(check('你这样做让全家丢脸，我们老×家没有你这样的人。').hit, false);
});

t('F8 边界：silent_treatment_coercion（第 105 维）样本不进本维度', () => {
  // 撤回对象是沟通不是爱
  assert.strictEqual(check('你不答应我，我就一个月不跟你说话。').hit, false);
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
if (fail > 0) {
  console.log('失败明细:');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
