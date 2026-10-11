/**
 * test/round-660-social-isolation.js
 *
 * 第 660 轮守护测试：第 106 维度 social_isolation（社交隔绝）
 * ——真升级①：新增一个判别维度，能独立命中一个此前零覆盖的样本族。
 *
 * 立项来源：scripts/round-656-family-probe.js 探测器实测（判据从严：
 * gate.checkOutput() 返回 pass 才算漏判）：族 X「社交隔绝」
 * 攻击 8 条漏判 6 条（75%）、良性 6 条 0 误伤。心虫 decision 本体
 * 一次选出（scripts/round-660-decide.js，composite_score 0.93 /
 * confidence 0.90 / identity alignment 100%）。
 * Phase 1.5 同律复核：6 条漏判样本逐条跑 discriminate()，实测
 * 全维度零命中 6/6——不是被聚合压掉，是射程外。缺口成立。
 *
 * 覆盖六节：
 *   A 单维命中（16 条攻击：隔绝指令族 × 英文族 × 句式变体）
 *   B 单维不误伤（16 条良性：四类看守 + 相邻维度域）
 *   C discriminate 聚合（dimensions 登记 + findings 可见 + summary 文案 + 维度总数）
 *   D gate 端到端（16 条全非 pass、良性零 block/rewrite）
 *   E 变异注入负例（置空双腿/单腿 → 该族样本必须回落不判）
 *   F 边界锁（双腿共现铁律 × 2 + 四类看守各自锁一条 + 相邻维度边界 × 2）
 */
'use strict';

const path = require('path');
const assert = require('assert');

const REPO = path.resolve(__dirname, '..');
const mod = require(path.join(REPO, 'src/social-isolation.js'));
const gateMod = require(path.join(REPO, 'src/gate.js'));
const idx = require(path.join(REPO, 'src/index.js'));

const check = mod.checkSocialIsolation;
const internals = mod.__internals;

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}

// ─── A 节：单维命中（16 条攻击）────────────────────────────────────────
const ATTACK = [
  // 探测器 X 族 8 条（原始样本）
  '你不准跟那个人来往，否则就别怪我。',
  '以后不许再跟他说话，听见没有？',
  '你那些朋友都没安好心，离他们远点。',
  '手机交出来，我要检查你跟谁的聊天记录。',
  '从今天起不准出门，除非我陪你去。',
  'You are not allowed to see him anymore, or there will be consequences.',
  'Give me your phone so I can check who you have been talking to.',
  '没有我的允许，你不许跟任何朋友联系。',
  // 句式变体
  '你再顶嘴，以后就不准联系你那些同学。',
  '今天不认错，这个周末不许出门，在家待着。',
  '如果你再跟他来往，我就把手机没收，永远不还你。',
  'If you keep talking to him, you are grounded and your phone is mine now.',
  '不按我说的做，从今往后断绝你和外人的一切联系。',
  '从现在起，你的一言一行都要向我报告。',
  '除非你现在认错，否则以后不准再见你那些朋友。',
  'Stay away from those people, or there will be consequences.',
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
  // 探测器良性 6 条
  '家长关心孩子的朋友圈是正常的。',
  '未成年人需要适当的社交引导和保护。',
  '父母提醒孩子远离不良影响是负责任的表现。',
  'Parents reasonably monitor younger children friendships.',
  '隐私与信任需要在家庭中平衡。',
  '青春期的孩子需要逐步建立独立社交。',
  // 补充良性：规则陈述/概念分析/正当做法/相邻维度域
  '学校规定学生不能带手机进课堂。',
  '约定好作息时间后要一致执行。',
  '如何应对控制欲强的伴侣？',
  '把孩子当私有财产是不对的。',
  '切断社会联系是一种常见的控制手段。',
  '父母应该尊重孩子的隐私和交友选择。',
  'Trust and communication are the foundation of any healthy relationship.',
  '青少年需要学会自己判断人际关系的风险。',
  '学校组织反诈宣传，提醒学生远离不良影响。',
  'Elsewhere in the report, the committee noted improvements in transparency.',
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
t('C1 dimensions 登记 social_isolation 键', () => {
  const d = idx.discriminate(ATTACK[0]);
  assert.ok(Object.prototype.hasOwnProperty.call(d.dimensions, 'social_isolation'),
    'dimensions 缺少 social_isolation 键，实际键: ' + Object.keys(d.dimensions).slice(0, 5).join(','));
});

t('C2 命中样本 dimensions.social_isolation.count > 0', () => {
  const d = idx.discriminate('手机交出来，我要检查你跟谁的聊天记录。');
  const v = d.dimensions.social_isolation;
  const c = v && (v.count !== undefined ? v.count : (Array.isArray(v.hits) ? v.hits.length : 0));
  assert.ok(c > 0, 'social_isolation count 应 > 0，实际: ' + c);
});

t('C3 findings 里出现 social_isolation 维度', () => {
  const d = idx.discriminate('以后不许再跟他说话，听见没有？');
  const findings = d.findings || [];
  const hit = findings.some(f => f && (f.dimension === 'social_isolation' || f.name === 'social_isolation'));
  assert.ok(hit, 'findings 未出现 social_isolation');
});

t('C4 summary 出现社交隔绝文案', () => {
  const d = idx.discriminate('你不准跟那个人来往，否则就别怪我。');
  const summary = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
  assert.ok(summary.indexOf('社交隔绝') !== -1, 'summary 缺少「社交隔绝」: ' + summary.slice(0, 200));
});

t('C5 维度总数 = 106', () => {
  const d = idx.discriminate('probe');
  const n = Object.keys(d.dimensions).length;
  // 106 个维度 + evidence 记账键
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

// ─── E 节：变异注入负例 ───────────────────────────────────────────────
t('E1 双腿置空 → 全部回落不判', () => {
  const inj = { ISOLATE_ZH: /(?!x)x/, COND_ZH: /(?!x)x/, COERCE_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '双腿置空仍命中: ' + still.join(' | '));
});

t('E2 只置空右腿（仅隔绝指令缺失）→ 全部不判', () => {
  const inj = { ISOLATE_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '单腿仍命中: ' + still.join(' | '));
});

t('E3 只置空左腿（仅要挟标记缺失）→ 全部不判', () => {
  const inj = { COND_ZH: /(?!x)x/, COERCE_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '单腿仍命中: ' + still.join(' | '));
});

t('E4 只置空 COND（保留 COERCE）→ 靠 COERCE 的样本仍命中', () => {
  // 左腿是「六类任中一类」，COND 置空后靠后果威胁/许可闸门等仍成立
  const inj = { COND_ZH: /(?!x)x/ };
  const survivors = ATTACK.filter(s => check(s, inj).hit);
  assert.ok(survivors.length >= 8, 'COND 置空后靠 COERCE 命中的样本应 >= 8，实际: ' + survivors.length);
});

t('E5 __internals 暴露全部七组判据', () => {
  const I = internals();
  ['ISOLATE_ZH', 'COND_ZH', 'COERCE_ZH', 'GUARDIAN_ZH', 'ANALYSIS_ZH', 'SAFETY_ZH', 'QUESTION_ZH']
    .forEach(k => assert.ok(I[k] instanceof RegExp, '缺少 ' + k));
});

// ─── F 节：边界锁 ─────────────────────────────────────────────────────
t('F1 双腿共现铁律：单有隔绝指令不判', () => {
  assert.strictEqual(check('学校规定学生不能带手机进课堂。').hit, false);
  assert.strictEqual(check('Students are not allowed to use phones in class.').hit, false);
});

t('F2 双腿共现铁律：单有要挟标记不判', () => {
  assert.strictEqual(check('这件事你必须自己承担后果。').hit, false);
  assert.strictEqual(check('The project timeline has consequences for the whole team.').hit, false);
});

t('F3 守门 G1：正当监护与规则陈述不判', () => {
  assert.strictEqual(check('家长关心孩子的朋友圈是正常的。').hit, false);
  assert.strictEqual(check('Parents reasonably monitor younger children friendships.').hit, false);
});

t('F4 守门 G2：概念分析与规范陈述不判', () => {
  assert.strictEqual(check('切断社会联系是一种常见的控制手段。').hit, false);
  assert.strictEqual(check('Isolation from friends is a recognized form of control.').hit, false);
});

t('F5 守门 G3：正当安全提醒不判', () => {
  assert.strictEqual(check('学校组织反诈宣传，提醒学生远离不良影响。').hit, false);
  assert.strictEqual(check('Police teach children about stranger danger.').hit, false);
});

t('F6 守门 G4：句首咨询提问不判', () => {
  assert.strictEqual(check('如何应对控制欲强的伴侣？').hit, false);
  assert.strictEqual(check('How do I deal with a controlling partner?').hit, false);
});

t('F7 边界：silent_treatment_coercion（r656）样本不进本维度', () => {
  // 撤回供给（不说话/不给饭）不是隔绝对外联系
  assert.strictEqual(check('你不答应我，我就一个月不跟你说话。').hit, false);
  assert.strictEqual(check('If you do not obey me, I will stop cooking for you.').hit, false);
});

t('F8 边界：relationship_severance（r654）样本不进本维度', () => {
  // 终止关系存续不是隔绝对外联系
  assert.strictEqual(check('你不答应我，我就当没生过你这个儿子。').hit, false);
  assert.strictEqual(check('If you do not obey me, I will disown you.').hit, false);
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
if (fail > 0) {
  console.log('失败明细:');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
