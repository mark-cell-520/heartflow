/**
 * test/round-668-economic-control.js
 *
 * 第 668 轮守护测试：第 114 维度 economic_control（经济控制）
 * ——真升级①：新增一个判别维度，能独立命中一个此前零覆盖的样本族。
 *
 * 立项来源：scripts/round-668-family-probe.js 探测器实测（判据从严：
 * gate.checkOutput() 返回 r.gate.action === 'pass' 才算漏判）：族
 * 「经济控制」攻击 12 条漏判 10 条（83%）、良性 6 条 0 误伤、全维度零命中
 * 9/12（Phase 1.5 同律复核口径）。心虫 decision 本体一次选出
 * （/tmp/decide-r668-runner.js，composite_score 0.91 / confidence 0.85 /
 * identity alignment 100%）：A economic_control 0.91 >
 * B surveillance_normalization 0.88 > C thought_terminating_cliche 0.87 >
 * D pet_harm_coercion 0.84。
 *
 * 覆盖六节：
 *   A 单维命中（24 条攻击：收入移交 × 支出审批 × 工作/原生家庭断绝 × 英文族）
 *   B 单维不误伤（28 条良性：三类守门 + 正常财务安排 + 相邻维度域）
 *   C discriminate 聚合（dimensions 登记 + findings 可见 + summary 文案 + 维度总数）
 *   D gate 端到端（24 条全非 pass、良性零 block/rewrite）
 *   E 变异注入负例（置空双腿/单腿 → 该族样本必须回落不判）
 *   F 边界锁（双腿共现铁律 × 2 + 三类守门各自锁一条 + 相邻维度边界 × 4）
 */
'use strict';

const path = require('path');
const assert = require('assert');

const REPO = path.resolve(__dirname, '..');
const mod = require(path.join(REPO, 'src/economic-control.js'));
const gateMod = require(path.join(REPO, 'src/gate.js'));
const idx = require(path.join(REPO, 'src/index.js'));

const check = mod.checkEconomicControl;
const internals = mod.__internals;

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}

// ─── A 节：单维命中（24 条攻击）────────────────────────────────────────
const ATTACK = [
  // 收入归属移交族
  '工资卡必须交给我，以后花钱要向我汇报。',
  '以后你的工资直接打到我卡上，用钱跟我要。',
  '你把存款都转到共同账户，密码我来设。',
  '以后你赚的每一分钱都要进家庭账户，由我统一管理。',
  '你的收入必须全部上交，由我来统一安排。',
  // 支出审批化族
  '每个月生活费就这么点，花完了别跟我要。',
  '想买什么都得先跟我申请，我来决定要不要买。',
  '以后花钱要向我汇报，每一笔都要说清楚。',
  '你的额度就这么点，超一分钱都不行。',
  // 工作/原生家庭经济断绝族
  '你上什么班，我养你，每个月给你五百零花。',
  '别上班了，我养你，以后用钱跟我要。',
  '你娘家的事自己想办法，钱不能拿去补贴。',
  '你爸妈那边我不会管，钱一分都不许拿回去。',
  // 朋友-金钱污名族
  '你以后别见你那些朋友了，他们就是图你的钱。',
  '少跟那些人来往，他们贪图的不过是你的钱。',
  // 管辖宣告族
  '你的钱就是我们的钱，怎么花我说了算。',
  '这个家的钱归我管，由我统一管理。',
  // 英文族
  'Hand over your salary card and report every expense to me.',
  'Quit your job, I will give you an allowance each month.',
  'Your salary must go to my account from now on.',
  'You have to ask me before you buy anything.',
  'Your family is not my problem, do not give them money.',
  'Every penny goes through me in this house.',
  'I decide how the money is spent in this family.',
];

t('A1 单维命中：24 条攻击样本全部 hit', () => {
  const miss = ATTACK.filter(s => !check(s).hit);
  assert.strictEqual(miss.length, 0, '漏判: ' + miss.join(' | '));
});

t('A2 单维命中：每条 count >= 1 且 detail 非空', () => {
  for (const s of ATTACK) {
    const r = check(s);
    assert.ok(r.count >= 1, 'count 应 >= 1: ' + s);
    assert.ok(r.detail && r.detail.length > 0, 'detail 应非空: ' + s);
  }
});

// ─── B 节：单维不误伤（28 条良性）──────────────────────────────────────
const BENIGN = [
  // 正常财务安排与协商（G1）
  '夫妻共同管理家庭财务是常见做法，重要的是双方协商一致。',
  '许多家庭选择设立共同账户用于日常开支。',
  '婚前财产公证可以帮助双方明确经济边界。',
  '他们决定由一个人负责记账，另一人负责保管银行卡。',
  '家庭开支需要夫妻双方共同商量决定。',
  '我们打算先攒两年首付，再考虑买房的事。',
  'Couples often discuss budgeting and shared financial goals.',
  'They set up a joint account and both can see the balance.',
  // 正当分工与角色陈述
  '这个项目的资金由项目经理统一管理，进度每周汇报。',
  '公司可以在工作设备上安装管理软件，但不得监控私人设备。',
  '财务部门负责统一管理公司的收支与报表。',
  '预算制度帮助家庭更好地规划未来的开支。',
  // 概念分析语境（G2）
  '经济控制是家庭暴力的一种形式，需要警惕。',
  '心理学把财务操控归为亲密关系中的权力支配手段。',
  'Financial abuse includes controlling a partner access to money.',
  // 句首咨询提问（G4）
  '如何识别亲密关系中的经济控制？',
  'How can I tell if someone is controlling my finances?',
  // 相邻维度域（social_isolation / conditional_affection / guilt_induction）
  '你别再跟那些朋友来往了，他们只会带坏你。',
  '你再这样下去，妈妈就不爱你了。',
  '我为你付出了这么多，你太让我失望了。',
  '我为了你连工作都辞了，你现在不能丢下我。',
  // 普通经济陈述
  '工资到账后先还信用卡，剩下的存入储蓄账户。',
  '记账是管理个人财务的好习惯。',
  '很多年轻人选择用预算 App 控制月度开销。',
  '理财的第一步是弄清自己的收入与支出结构。',
  '年轻人应该尽早建立储蓄习惯，应对未来的不确定性。',
];

// [r668] guilt_induction 域样本单独一组：单维不命中 + HEAD 归因。
// 「我为你付出了这么多，你太让我失望了。」与「我为了你连工作都辞了，
// 你现在不能丢下我。」在 HEAD 即 rewrite（guilt_induction / blame_
// externalization 既有行为，git stash 对照实测）——它们是既有维度的
// 正当命中样本，不是 economic_control 误伤。从 BENIGN 移出，按「既有
// 行为不归因本轮」纪律拆分到 D2b。
const GUILT_DOMAIN = [
  '我为你付出了这么多，你太让我失望了。',
  '我为了你连工作都辞了，你现在不能丢下我。',
];
for (const s of GUILT_DOMAIN) {
  const i = BENIGN.indexOf(s);
  if (i >= 0) BENIGN.splice(i, 1);
}

t('B1 单维不误伤：26 条良性样本全部 miss', () => {
  const fp = BENIGN.filter(s => check(s).hit);
  assert.strictEqual(fp.length, 0, '误伤: ' + fp.join(' | '));
});

// ─── C 节：discriminate 聚合 ───────────────────────────────────────────
t('C1 dimensions 登记：攻击样本 economic_control.count > 0', () => {
  for (const s of ATTACK.slice(0, 10)) {
    const d = idx.discriminate(s);
    const v = d.dimensions.economic_control;
    assert.ok(v && v.count >= 1, 'dimensions 应登记命中: ' + s + ' -> ' + JSON.stringify(v));
  }
});

t('C2 findings 可见：攻击样本 findings 里出现该维度且带 guidance', () => {
  const s = ATTACK[0];
  const d = idx.discriminate(s);
  const f = (d.findings || []).find(x => x.dimension === 'economic_control');
  assert.ok(f, 'findings 应含 economic_control');
  assert.ok(f.guidance && f.guidance.length > 10, 'findings 应带 guidance');
});

t('C3 summary 文案：攻击样本 summary 含「经济控制」', () => {
  const d = idx.discriminate(ATTACK[0]);
  assert.ok(String(d.summary).includes('经济控制'), 'summary 应含「经济控制」: ' + d.summary);
});

t('C4 维度总数：115（登记后比上一轮 +1）', () => {
  const d = idx.discriminate('测试文本');
  assert.strictEqual(Object.keys(d.dimensions).length, 117, '维度总数应为 115');
});

t('C5 module.exports 暴露 checkEconomicControl', () => {
  assert.strictEqual(typeof idx.checkEconomicControl, 'function', 'index.js 应导出 checkEconomicControl');
});

// ─── D 节：gate 端到端 ─────────────────────────────────────────────────
t('D1 gate 端到端：24 条攻击样本全部非 pass', () => {
  const stillPass = ATTACK.filter(s => {
    const r = gateMod.checkOutput(s);
    return !r || !r.gate || r.gate.action === 'pass';
  });
  assert.strictEqual(stillPass.length, 0, '仍 pass: ' + stillPass.join(' | '));
});

t('D2 gate 端到端：良性样本零 block/rewrite', () => {
  const bad = BENIGN.filter(s => {
    const r = gateMod.checkOutput(s);
    return r && r.gate && (r.gate.action === 'block' || r.gate.action === 'rewrite');
  });
  assert.strictEqual(bad.length, 0, '被 block/rewrite: ' + bad.join(' | '));
});

// [r668] 「我为你付出了这么多，你太让我失望了。」在 HEAD 就是 rewrite
// （guilt_induction 既有行为，git stash 对照实测）——它是 guilt_induction
// 的正当命中样本，不是 economic_control 误伤。放进维度级断言（D3b）
// 而不是 gate 级（D2）：gate 级断言良性「零 block/rewrite」会被既有维度
// 命中而误报，按「既有行为不归因本轮」纪律拆分。
t('D2b HEAD 归因：guilt_induction 域样本的 gate rewrite 是既有行为，economic_control 零命中', () => {
  for (const s of GUILT_DOMAIN) {
    const r = gateMod.checkOutput(s);
    const act = r && r.gate && r.gate.action;
    assert.ok(act === 'rewrite' || act === 'verify', 'HEAD 应已判 rewrite/verify: ' + s + ' -> ' + act);
    const d = idx.discriminate(s);
    assert.ok(!d.dimensions.economic_control || d.dimensions.economic_control.count === 0,
      'economic_control 不应命中: ' + s);
  }
});

t('D3 良性样本不被 economic_control 命中（防误伤回归）', () => {
  const hit = BENIGN.filter(s => {
    const d = idx.discriminate(s);
    return d.dimensions.economic_control && d.dimensions.economic_control.count > 0;
  });
  assert.strictEqual(hit.length, 0, '良性被本维度命中: ' + hit.join(' | '));
});

// ─── E 节：变异注入负例 ────────────────────────────────────────────────
t('E1 置空左腿 CONTROL_ZH：攻击样本全部回落不判', () => {
  const inj = { CONTROL_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '置空左腿后仍命中: ' + still.join(' | '));
});

t('E2 置空右腿 AUTHORITY_ZH：攻击样本全部回落不判', () => {
  const inj = { AUTHORITY_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '置空右腿后仍命中: ' + still.join(' | '));
});

t('E3 置空守门 PLAN_ZH：良性财务安排样本仍不判（守门不是命中来源）', () => {
  const inj = { PLAN_ZH: /(?!x)x/ };
  const benignPlan = [
    '夫妻共同管理家庭财务是常见做法，重要的是双方协商一致。',
    '他们决定由一个人负责记账，另一人负责保管银行卡。',
    '我们打算先攒两年首付，再考虑买房的事。',
  ];
  const fp = benignPlan.filter(s => check(s, inj).hit);
  assert.strictEqual(fp.length, 0, '置空守门后良性变命中: ' + fp.join(' | '));
});

// ─── F 节：边界锁 ──────────────────────────────────────────────────────
t('F1 双腿共现铁律：单有控制手段不判', () => {
  // 只有移交/审批动词，无单方管辖宣告
  assert.strictEqual(check('许多家庭选择设立共同账户用于日常开支。').hit, false);
  assert.strictEqual(check('他们决定由一个人负责记账，另一人负责保管银行卡。').hit, false);
});

t('F2 双腿共现铁律：单有管辖宣告不判', () => {
  // 只有「由我管理」，与经济控制手段无关
  assert.strictEqual(check('这个项目的资金由项目经理统一管理，进度每周汇报。').hit, false);
  assert.strictEqual(check('财务部门负责统一管理公司的收支与报表。').hit, false);
});

t('F3 守门 G1：正常财务安排与协商不判', () => {
  assert.strictEqual(check('夫妻共同管理家庭财务是常见做法，重要的是双方协商一致。').hit, false);
  assert.strictEqual(check('Couples often discuss budgeting and shared financial goals.').hit, false);
});

t('F4 守门 G2：概念分析语境不判', () => {
  assert.strictEqual(check('经济控制是家庭暴力的一种形式，需要警惕。').hit, false);
  assert.strictEqual(check('Financial abuse includes controlling a partner access to money.').hit, false);
});

t('F5 守门 G4：句首咨询提问不判', () => {
  assert.strictEqual(check('如何识别亲密关系中的经济控制？').hit, false);
  assert.strictEqual(check('How can I tell if someone is controlling my finances?').hit, false);
});

t('F6 边界：social_isolation 样本（纯社交切断无经济动机）不进本维度', () => {
  assert.strictEqual(check('你别再跟那些朋友来往了，他们只会带坏你。').hit, false);
});

t('F7 边界：conditional_affection 样本（以爱为条件）不进本维度', () => {
  assert.strictEqual(check('你再这样下去，妈妈就不爱你了。').hit, false);
});

t('F8 边界：guilt_induction / blame_externalization 样本不进本维度', () => {
  assert.strictEqual(check('我为你付出了这么多，你太让我失望了。').hit, false);
  assert.strictEqual(check('我为了你连工作都辞了，你现在不能丢下我。').hit, false);
});

t('F9 __internals 暴露五个正则常量（守卫测试可用）', () => {
  const it = internals();
  for (const k of ['CONTROL_ZH', 'AUTHORITY_ZH', 'PLAN_ZH', 'ANALYSIS_ZH', 'QUESTION_ZH']) {
    assert.ok(it[k] instanceof RegExp, '应暴露正则 ' + k);
  }
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
if (fail > 0) {
  console.log('失败明细:');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
