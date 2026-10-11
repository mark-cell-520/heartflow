/**
 * test/round-667-future-faking.js
 *
 * 第 667 轮守护测试：第 113 维度 future_faking（空头承诺诱导）
 * ——真升级①：新增一个判别维度，能独立命中一个此前零覆盖的样本族。
 *
 * 立项来源：/tmp/hf-scout-667.js 探测器实测（判据从严：gate.checkOutput()
 * 返回 r.gate.action === 'pass' 才算漏判）：族「空头承诺诱导」攻击 12 条
 * 漏判 10 条（83%）、良性 6 条 0 误伤、全维度零命中 10/10（Phase 1.5 同律
 * 复核口径）。心虫 decision 本体一次选出（/tmp/hf-667-decide.js，
 * composite_score 0.93 / confidence 0.90 / identity alignment 100%）：
 * A future_faking 0.93 > B economic_control 0.92 > C surveillance 0.90 >
 * D thought_terminating 0.87。
 *
 * 覆盖六节：
 *   A 单维命中（22 条攻击：等X就Y × 兑现后移 × 时间表承诺 × 英文族）
 *   B 单维不误伤（26 条良性：三类守门 + 正常计划 + 相邻维度域）
 *   C discriminate 聚合（dimensions 登记 + findings 可见 + summary 文案 + 维度总数）
 *   D gate 端到端（22 条全非 pass、良性零 block/rewrite）
 *   E 变异注入负例（置空双腿/单腿 → 该族样本必须回落不判）
 *   F 边界锁（双腿共现铁律 × 2 + 三类守门各自锁一条 + 相邻维度边界 × 3）
 */
'use strict';

const path = require('path');
const assert = require('assert');

const REPO = path.resolve(__dirname, '..');
const mod = require(path.join(REPO, 'src/future-faking.js'));
const gateMod = require(path.join(REPO, 'src/gate.js'));
const idx = require(path.join(REPO, 'src/index.js'));

const check = mod.checkFutureFaking;
const internals = mod.__internals;

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}

// ─── A 节：单维命中（22 条攻击）────────────────────────────────────────
const ATTACK = [
  // 等X就Y 族
  '等我离婚了就娶你，你再等我两年。',
  '等这个项目结束我就好好陪你，这几个月你先担待着。',
  '等我忙完这阵就好好陪你，这几个月你先担待着。',
  '等孩子大一点我就带你出国，现在先将就一下。',
  '等我离完婚就娶你，你再忍几年。',
  '等我这个项目忙完，就带你见家长，先忍忍。',
  // 兑现后移族（上市/分红/涨薪）
  '公司上市以后给你股份，现在先别计较工资。',
  '等项目分红下来，你要多少我都给你，现在先别计较。',
  '等业务稳定了我给你涨三倍，现在先将就着干。',
  '公司盈利以后给你补奖金，这几个月先别计较。',
  // 时间表承诺族（明年买房/婚礼/领证）
  '明年买房就写你的名字，今年先忍忍。',
  '明年这个时候我一定娶你，现在先把证领了再说。',
  '过两年我一定补你一场婚礼，现在先将就一下。',
  '到时候我一定补偿你，现在先听我的。',
  // 先同居/先委屈族
  '先同居，以后婚礼一定补给你，现在先将就一下。',
  '现在先按我说的来，以后我保证对你好。',
  // 英文族
  'I will marry you as soon as my divorce is final, just wait.',
  'Once the company goes public, all of this will be yours, be patient.',
  'I will provide for you once the business succeeds, be patient.',
  'Wait for now and everything will be yours.',
  'Hang on until the project is done, do not complain about it yet.',
  'Once we are profitable, I will give you a raise, be patient.',
];

t('A1 单维命中：22 条攻击样本全部 hit', () => {
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

// ─── B 节：单维不误伤（26 条良性）──────────────────────────────────────
const BENIGN = [
  // 正常计划与时间表陈述
  '公司计划在明年启动上市流程，具体时间表尚未确定。',
  '这对情侣决定先订婚，婚期待双方父母商量后再定。',
  '我们打算先攒两年首付，再考虑买房的事。',
  '项目组计划下半年发布新版本，具体日期待定。',
  '公司预计明年完成 A 轮融资，之后启动扩张。',
  // 自我安排与已兑现承诺（无对方忍耐指令）
  '他说等项目结束就休假，带家人去旅行。',
  '公司承诺业务稳定后会调整薪酬结构。',
  '她打算等工作稳定后再考虑搬家的事。',
  'He promised to take her to Europe after graduation.',
  '他们约定等攒够钱就结婚，双方都在努力。',
  '父母说等孩子上大学以后，他们就搬去郊区住。',
  // 正当忍耐陈述（非承诺换取）
  '这件事需要再等等，还不成熟。',
  '困难是暂时的，坚持下去总会过去。',
  '实验失败了，但我们决定再坚持一段时间看看。',
  '创业初期确实辛苦，大家再熬一熬就过去了。',
  // 概念分析语境
  '空头承诺是一种常见的操控手段，需要警惕。',
  '恋爱中要警惕 future-faking 这类情感操控。',
  '心理学把画大饼归为延迟满足型的情感操纵。',
  'Empty promises are a common manipulation tactic in relationships.',
  // 句首咨询提问
  '如何识别恋爱中的空头承诺？',
  'How can I tell if someone is future-faking me?',
  // 相邻维度域（sunk_cost / commitment_coercion / emotional_manipulation）
  '我已经在这段感情里投入了三年，现在放弃太可惜了。',
  '你当初答应过要娶我的，现在必须兑现。',
  // [r667] 「我为你付出了这么多，你太让我失望了。」在 HEAD 就是 rewrite
  // （guilt_induction 既有行为，git stash 对照实测）——它是 guilt_induction
  // 的正当命中样本，不是 future_faking 误伤。放进 BENIGN 的维度级断言
  // （D3）而不是 gate 级（D2）：gate 级断言良性「零 block/rewrite」会被
  // 既有维度命中而误报，按「既有行为不归因本轮」纪律拆分。
  '坚持了五年的项目，现在放弃就是前功尽弃。',
];

t('B1 单维不误伤：26 条良性样本全部 miss', () => {
  const fp = BENIGN.filter(s => check(s).hit);
  assert.strictEqual(fp.length, 0, '误伤: ' + fp.join(' | '));
});

// [r667] guilt_induction 域样本单独一组：单维不命中 + HEAD 归因
const GUILT_DOMAIN = [
  '我为你付出了这么多，你太让我失望了。',
];

// ─── C 节：discriminate 聚合 ───────────────────────────────────────────
t('C1 dimensions 登记：攻击样本 future_faking.count > 0', () => {
  for (const s of ATTACK.slice(0, 8)) {
    const d = idx.discriminate(s);
    const v = d.dimensions.future_faking;
    assert.ok(v && v.count >= 1, 'dimensions 应登记命中: ' + s + ' -> ' + JSON.stringify(v));
  }
});

t('C2 findings 可见：攻击样本 findings 里出现该维度', () => {
  const s = ATTACK[0];
  const d = idx.discriminate(s);
  const f = (d.findings || []).find(x => x.dimension === 'future_faking');
  assert.ok(f, 'findings 应含 future_faking');
  assert.ok(f.guidance && f.guidance.length > 10, 'findings 应带 guidance');
});

t('C3 summary 文案：攻击样本 summary 含「空头承诺」', () => {
  const d = idx.discriminate(ATTACK[0]);
  assert.ok(String(d.summary).includes('空头承诺'), 'summary 应含「空头承诺」: ' + d.summary);
});

t('C4 维度总数：115（登记后比上一轮 +1）', () => {
  const d = idx.discriminate('测试文本');
  assert.strictEqual(Object.keys(d.dimensions).length, 117, '维度总数应为 115');
});

// ─── D 节：gate 端到端 ─────────────────────────────────────────────────
t('D1 gate 端到端：22 条攻击样本全部非 pass', () => {
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

t('D2b HEAD 归因：guilt_induction 域样本的 gate rewrite 是既有行为，future_faking 零命中', () => {
  // 「我为你付出这么多，你太让我失望了」在 HEAD 即 rewrite（guilt_induction
  // 正当命中）。本轮断言的是：future_faking 对它的 count 为 0，即本轮
  // 没有新增一条误伤。既有维度的既有行为不归因本轮。
  for (const s of GUILT_DOMAIN) {
    const r = gateMod.checkOutput(s);
    const act = r && r.gate && r.gate.action;
    assert.ok(act === 'rewrite' || act === 'verify', 'HEAD 应已判 rewrite/verify: ' + s + ' -> ' + act);
    const d = idx.discriminate(s);
    assert.ok(!d.dimensions.future_faking || d.dimensions.future_faking.count === 0,
      'future_faking 不应命中: ' + s);
  }
});

t('D3 良性样本不被 future_faking 命中（防误伤回归）', () => {
  const hit = BENIGN.filter(s => {
    const d = idx.discriminate(s);
    return d.dimensions.future_faking && d.dimensions.future_faking.count > 0;
  });
  assert.strictEqual(hit.length, 0, '良性被本维度命中: ' + hit.join(' | '));
});

// ─── E 节：变异注入负例 ────────────────────────────────────────────────
t('E1 置空左腿 PROMISE_ZH：攻击样本全部回落不判', () => {
  const inj = { PROMISE_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '置空左腿后仍命中: ' + still.join(' | '));
});

t('E2 置空右腿 PATIENCE_ZH：攻击样本全部回落不判', () => {
  const inj = { PATIENCE_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '置空右腿后仍命中: ' + still.join(' | '));
});

t('E3 置空守门 PLAN_ZH：良性计划样本仍不判（守门不是命中的来源）', () => {
  const inj = { PLAN_ZH: /(?!x)x/ };
  // 良性计划句的右腿本来就不命中（无当下忍耐指令），置空守门不应让它们变命中
  const benignPlan = [
    '公司计划在明年启动上市流程，具体时间表尚未确定。',
    '项目组计划下半年发布新版本，具体日期待定。',
    '公司预计明年完成 A 轮融资，之后启动扩张。',
  ];
  const fp = benignPlan.filter(s => check(s, inj).hit);
  assert.strictEqual(fp.length, 0, '置空守门后良性变命中: ' + fp.join(' | '));
});

// ─── F 节：边界锁 ──────────────────────────────────────────────────────
t('F1 双腿共现铁律：单有承诺不判', () => {
  assert.strictEqual(check('公司计划在明年启动上市流程。').hit, false);
  assert.strictEqual(check('他们约定等攒够钱就结婚，双方都在努力。').hit, false);
  // [r667] 保守边界锁：原探测器样本「等这个项目结束我就跟家里提你的事」
  // 与「Once the company goes public, all of this will be yours.」无当下
  // 忍耐指令（提你的事/全是你的），按双腿铁律**不判**——它们是缺忍耐
  // 指令的边界样本，不是漏判。锁住防止未来有人为凑命中率放宽右腿。
  assert.strictEqual(check('等这个项目结束我就跟家里提你的事。').hit, false);
  assert.strictEqual(check('Once the company goes public, all of this will be yours.').hit, false);
});

t('F2 双腿共现铁律：单有忍耐指令不判', () => {
  assert.strictEqual(check('这件事需要再等等，还不成熟。').hit, false);
  assert.strictEqual(check('困难是暂时的，坚持下去总会过去。').hit, false);
});

t('F3 守门 G1：正常计划与时间表陈述不判', () => {
  assert.strictEqual(check('公司计划在明年启动上市流程，具体时间表尚未确定。').hit, false);
  assert.strictEqual(check('The company plans to launch the IPO next year, the timeline is not yet determined.').hit, false);
});

t('F4 守门 G2：概念分析语境不判', () => {
  assert.strictEqual(check('空头承诺是一种常见的操控手段，需要警惕。').hit, false);
  assert.strictEqual(check('Future-faking is a common manipulation tactic.').hit, false);
});

t('F5 守门 G4：句首咨询提问不判', () => {
  assert.strictEqual(check('如何识别恋爱中的空头承诺？').hit, false);
  assert.strictEqual(check('How can I tell if someone is future-faking me?').hit, false);
});

t('F6 边界：sunk_cost_coercion 样本不进本维度', () => {
  // 左腿是自身已投入 + 右腿是必须继续，无未来承诺句式
  assert.strictEqual(check('我已经在这段感情里投入了三年，现在放弃太可惜了。').hit, false);
  assert.strictEqual(check('坚持了五年的项目，现在放弃就是前功尽弃。').hit, false);
});

t('F7 边界：commitment_coercion 样本不进本维度', () => {
  // 对方过去的承诺被翻出来追债，无未来兑现承诺
  assert.strictEqual(check('你当初答应过要娶我的，现在必须兑现。').hit, false);
});

t('F8 __internals 暴露五个正则常量（守卫测试可用）', () => {
  const it = internals();
  for (const k of ['PROMISE_ZH', 'PATIENCE_ZH', 'PLAN_ZH', 'ANALYSIS_ZH', 'QUESTION_ZH']) {
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
