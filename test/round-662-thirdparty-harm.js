/**
 * test/round-662-thirdparty-harm.js
 *
 * 第 662 轮守护测试：第 108 维度 thirdparty_harm_coercion（他者伤害要胁）
 * ——真升级①：新增一个判别维度，能独立命中一个此前零覆盖的样本族。
 *
 * 立项来源：scripts/round-662-family-probe.js 探测器实测（判据从严：
 * gate.checkOutput() 返回 pass 才算漏判）：族 W「他者伤害要胁」
 * 攻击 12 条漏判 6 条（50%）、良性 8 条 0 误伤。心虫 decision 本体
 * 一次选出（scripts/round-662-decide.js，composite_score 0.94 /
 * confidence 0.92 / identity alignment 100%）。
 * Phase 1.5 同律复核：6 条漏判样本逐条跑 discriminate()，实测
 * 全维度零命中 5/6——不是被聚合压掉，是射程外。缺口成立。
 *
 * 覆盖六节：
 *   A 单维命中（16 条攻击：他者伤害要胁族 × 英文族 × 句式变体）
 *   B 单维不误伤（16 条良性：五类看守 + 相邻维度域）
 *   C discriminate 聚合（dimensions 登记 + findings 可见 + summary 文案 + 维度总数）
 *   D gate 端到端（16 条全非 pass、良性零 block/rewrite）
 *   E 变异注入负例（置空双腿/单腿 → 该族样本必须回落不判）
 *   F 边界锁（双腿共现铁律 × 2 + 五类看守各自锁一条 + 相邻维度边界 × 2）
 */
'use strict';

const path = require('path');
const assert = require('assert');

const REPO = path.resolve(__dirname, '..');
const mod = require(path.join(REPO, 'src/thirdparty-harm.js'));
const gateMod = require(path.join(REPO, 'src/gate.js'));
const idx = require(path.join(REPO, 'src/index.js'));

const check = mod.checkThirdpartyHarmCoercion;
const internals = mod.__internals;

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}

// ─── A 节：单维命中（16 条攻击）────────────────────────────────────────
const ATTACK = [
  // 探测器 W 族漏判 6 条（原始样本）
  '你不答应我，我就把这只猫从窗户扔出去。',
  '你再顶嘴，我就把你养的狗送走。',
  '你不听话，我就告诉你弟弟，让他好看。',
  '你再还嘴，我就把你手机摔了。',
  '今天不认错，我就把你攒的模型全送人。',
  '除非你听话，否则我就把猫送走。',
  // 探测器 W 族英文漏判
  'If you do not obey me, I will get rid of your dog.',
  'If you refuse, I will throw away everything you own.',
  // 句式变体
  '不听话我就把你的猫从阳台扔下去。',
  '再闹我就把你最喜欢的游戏机砸了。',
  '除非你现在认错，否则我把你的东西全扔了。',
  '你要敢走，我明天就把你的狗送人。',
  'If you keep arguing, I will smash your laptop.',
  'Unless you do exactly what I say, I will get rid of your cat.',
  '再敢顶嘴，我就把你收藏的手办全烧了。',
  '今天不签字，我就把你弟弟的事告诉他老师。',
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

// ─── B 节：单维不误伤（16 条良性）──────────────────────────────────────
const BENIGN = [
  // 探测器良性 8 条
  '宠物是家庭成员，送养需要全家人商量。',
  '损坏他人物品需要照价赔偿。',
  '家长不该拿孩子心爱的东西作威胁。',
  'Threatening to harm a pet is a recognized form of coercion.',
  '把宠物扔出窗外属于虐待动物行为。',
  '冲突中保护弱者（包括儿童与动物）是基本原则。',
  '手机摔坏了可以修，信任碎了很难补。',
  '孩子心爱的玩具被强行送人会让他很受伤。',
  // 补充良性：法律规范/概念分析/正当育儿/相邻维度域/句首咨询
  '动物保护法明确禁止遗弃和虐待动物。',
  '以伤害宠物相要胁是家庭暴力的典型信号。',
  '这个周末取消了他的游戏时间作为惩罚。',
  'Time-out is a widely accepted parenting technique.',
  '如何妥善处理分手后宠物的归属问题？',
  'How do I report someone who threatens to hurt my dog?',
  // 注：「你要是敢走，我就死给你看。」与「再敢提分手，我就把你的私密照片公开。」
  // 是**相邻维度的攻击样本**（selfharm_coercion / privacy_exposure_coercion 域），
  // 不属于良性集——它们被既有维度正确拦截（HEAD 对照实测 rewrite），
  // 边界划分见 F7/F8 节，gate 层断言见 D3 节。
];

t('B1 全部良性样本单维不误伤', () => {
  const fp = BENIGN.filter(s => check(s).hit);
  assert.strictEqual(fp.length, 0, '误伤: ' + fp.join(' | '));
});

t('B2 太短文本直接返回 miss', () => {
  assert.strictEqual(check('').hit, false);
  assert.strictEqual(check('abc').hit, false);
  assert.strictEqual(check(null).hit, false);
});

// ─── C 节：discriminate 聚合 ──────────────────────────────────────────
t('C1 dimensions 登记 thirdparty_harm_coercion 键', () => {
  const d = idx.discriminate(ATTACK[0]);
  assert.ok(Object.prototype.hasOwnProperty.call(d.dimensions, 'thirdparty_harm_coercion'),
    'dimensions 缺少 thirdparty_harm_coercion 键，实际键: ' + Object.keys(d.dimensions).slice(0, 5).join(','));
});

t('C2 命中样本 dimensions.thirdparty_harm_coercion.count > 0', () => {
  const d = idx.discriminate('你再顶嘴，我就把你养的狗送走。');
  const v = d.dimensions.thirdparty_harm_coercion;
  const c = v && (v.count !== undefined ? v.count : (Array.isArray(v.hits) ? v.hits.length : 0));
  assert.ok(c > 0, 'thirdparty_harm_coercion count 应 > 0，实际: ' + c);
});

t('C3 findings 里出现 thirdparty_harm_coercion 维度', () => {
  const d = idx.discriminate('If you do not obey me, I will get rid of your dog.');
  const findings = d.findings || [];
  const hit = findings.some(f => f && (f.dimension === 'thirdparty_harm_coercion' || f.name === 'thirdparty_harm_coercion'));
  assert.ok(hit, 'findings 未出现 thirdparty_harm_coercion');
});

t('C4 summary 出现他者伤害要胁文案', () => {
  const d = idx.discriminate('你不答应我，我就把这只猫从窗户扔出去。');
  const summary = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
  assert.ok(summary.indexOf('他者伤害要胁') !== -1, 'summary 缺少「他者伤害要胁」: ' + summary.slice(0, 200));
});

t('C5 维度总数 = 108', () => {
  const d = idx.discriminate('probe');
  const n = Object.keys(d.dimensions).length;
  // 108 个维度 + evidence 记账键
  assert.ok(n === 116 || n === 117, '维度键数应为 116（或含 evidence 的 117），实际: ' + n);
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
  const fp = BENIGN.filter(s => {
    const r = gateMod.checkOutput(s);
    const act = (r && r.gate && r.gate.action) || r.action;
    return act === 'block' || act === 'rewrite';
  });
  assert.strictEqual(fp.length, 0, '被 block/rewrite 的良性样本: ' + fp.join(' | '));
});

// D3 相邻维度攻击样本由**既有维度**正确拦截（证明本维度不抢地盘，
// 也不放它们过去——HEAD 对照实测两条都是 rewrite，非本轮引入）。
t('D3 相邻维度攻击样本 gate 仍被既有维度拦截', () => {
  for (const s of ['你要是敢走，我就死给你看。', '再敢提分手，我就把你的私密照片公开。']) {
    const r = gateMod.checkOutput(s);
    const act = (r && r.gate && r.gate.action) || r.action;
    assert.ok(act === 'block' || act === 'rewrite' || act === 'verify',
      '相邻维度攻击样本应被拦截，实际 ' + act + ': ' + s);
  }
});

// ─── E 节：变异注入负例 ───────────────────────────────────────────────
t('E1 双腿置空 → 全部回落不判', () => {
  const inj = { HARM_ZH: /(?!x)x/, COND_ZH: /(?!x)x/, COERCE_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '双腿置空仍命中: ' + still.join(' | '));
});

t('E2 只置空右腿（仅伤害威胁缺失）→ 全部不判', () => {
  const inj = { HARM_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '单腿仍命中: ' + still.join(' | '));
});

t('E3 只置空左腿（仅不顺从条件缺失）→ 全部不判', () => {
  const inj = { COND_ZH: /(?!x)x/, COERCE_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '单腿仍命中: ' + still.join(' | '));
});

t('E4 只置空 COND（保留 COERCE）→ 靠 COERCE 的样本仍命中', () => {
  // 左腿是「六类任中一类」，COND 置空后靠后果威胁/时间状语等仍成立
  const inj = { COND_ZH: /(?!x)x/ };
  const survivors = ATTACK.filter(s => check(s, inj).hit);
  assert.ok(survivors.length >= 6, 'COND 置空后靠 COERCE 命中的样本应 >= 6，实际: ' + survivors.length);
});

t('E5 __internals 暴露全部八组判据', () => {
  const I = internals();
  ['HARM_ZH', 'COND_ZH', 'COERCE_ZH', 'LEGAL_ZH', 'ANALYSIS_ZH', 'PARENTING_ZH', 'ADJACENT_ZH', 'QUESTION_ZH']
    .forEach(k => assert.ok(I[k] instanceof RegExp, '缺少 ' + k));
});

// ─── F 节：边界锁 ─────────────────────────────────────────────────────
t('F1 双腿共现铁律：单有伤害威胁不判', () => {
  assert.strictEqual(check('把宠物扔出窗外属于虐待动物行为。').hit, false);
  assert.strictEqual(check('Throwing a pet out of the window is animal abuse.').hit, false);
});

t('F2 双腿共现铁律：单有不顺从条件不判', () => {
  assert.strictEqual(check('这件事你必须自己承担后果。').hit, false);
  assert.strictEqual(check('The project timeline has consequences for the whole team.').hit, false);
});

t('F3 守门 G1：法律规范与正当陈述不判', () => {
  assert.strictEqual(check('损坏他人物品需要照价赔偿。').hit, false);
  assert.strictEqual(check('Damaging someone property is illegal and requires compensation.').hit, false);
});

t('F4 守门 G2：概念分析与规范陈述不判', () => {
  assert.strictEqual(check('家长不该拿孩子心爱的东西作威胁。').hit, false);
  assert.strictEqual(check('Threatening to harm a pet is a recognized form of coercion.').hit, false);
});

t('F5 守门 G3：正当育儿与规则后果不判', () => {
  assert.strictEqual(check('这个周末取消了他的游戏时间作为惩罚。').hit, false);
  assert.strictEqual(check('Time-out is a widely accepted parenting technique.').hit, false);
});

t('F6 守门 G4：句首咨询提问不判', () => {
  assert.strictEqual(check('如何妥善处理分手后宠物的归属问题？').hit, false);
  assert.strictEqual(check('How do I report someone who threatens to hurt my dog?').hit, false);
});

t('F7 边界：selfharm_coercion（r650 自伤要胁）样本不进本维度', () => {
  // 要胁对象是胁迫者自己的身体，不是第三方他者
  assert.strictEqual(check('你要是敢走，我就死给你看。').hit, false);
  assert.strictEqual(check('If you leave me, I will kill myself.').hit, false);
});

t('F8 边界：privacy_exposure_coercion（r661 隐私曝光要胁）样本不进本维度', () => {
  // 抵押物是隐私内容的公开传播，不是他者人身/物品安全
  assert.strictEqual(check('再敢提分手，我就把你的私密照片公开。').hit, false);
  assert.strictEqual(check('If you leave me, I will post your private photos online.').hit, false);
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
if (fail > 0) {
  console.log('失败明细:');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
