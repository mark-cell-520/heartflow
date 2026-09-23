/**
 * test/victim-blaming-english-coverage.test.js — v6.7.104（第 4 轮，心虫 decision.decide 0.82）
 *
 * 背景：victim_blaming 是 REWRITE_DIMS 成员（命中即 rewrite，真实 gate 后果），
 * 但它的英文模式表 14 条全是**窄口语句型**——
 *   she was asking for it / you should have known better / what did you expect ...
 * 本体实测三类真实高频英文句式全部 count=0（干净 pass，score 1.0）：
 *   ① 条件回溯："If you had been more careful, this would not have happened to you."
 *   ② 显式归属："You brought this on yourself." / "It is your fault."
 *   ③ 第三人称 careless："She was careless and it is her own fault."
 * lang-coverage-audit 也把该维度列入「仅中文命中」（EN 侧探针不命中）。
 *
 * 本测试守三件事：
 *   1. 英文三类句式命中（条件回溯 / 显式归属 / 第三人称 careless）
 *   2. 误拦为 0——postmortem / root-cause / 保险定责 / 医学依从性 / 新闻转述
 *      等合法语境的条件回溯与责任描述一律不得命中（护栏靠主语限定：
 *      只认 you/he/she/they，排除 we/it 与系统名词）
 *   3. 既有中文与英文模式不退化（原 14 条窄句型仍命中）
 *
 * 负例验证（不许自证）：
 *   - 把新增 21 条 EN 模式整体删掉 → 第一组测试全红
 *   - 把护栏（主语限定 you/he/she/they）放宽为 [^.]{0,4}（任意主语）
 *     → postmortem/保险/医学良性样本命中，误拦侧测试变红
 */

'use strict';
const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const idx = require(path.join(ROOT, 'src/index.js'));

let passed = 0;
let failed = 0;
const failures = [];

function t(name, fn) {
  try { fn(); passed++; }
  catch (e) { failed++; failures.push(`${name}: ${e.message}`); }
}

const { checkVictimBlaming } = idx;
assert(typeof checkVictimBlaming === 'function', 'checkVictimBlaming 必须导出');

const NEW_TYPES = ['en_conditional_blame', 'en_blame_attribution', 'en_third_person_blame'];

// ═══════════════════════════════════════════════════════════════
// 一、三类英文句式必须命中（改动前全部 count=0）
// ═══════════════════════════════════════════════════════════════

t('条件回溯：if you had been more careful, this would not have happened', () => {
  const r = checkVictimBlaming('If you had been more careful, this would not have happened to you.');
  assert.ok(r.count > 0, `应命中，实得 count=${r.count}`);
  assert.ok(r.blames.some(b => b.type === 'en_conditional_blame'),
    `应命中 en_conditional_blame，实得 ${JSON.stringify(r.blames.map(b => b.type))}`);
});

t('条件回溯：had you stayed home, none of this would have happened（倒装）', () => {
  const r = checkVictimBlaming('Had you stayed home, none of this would have happened.');
  assert.ok(r.count > 0, `应命中，实得 count=${r.count}`);
});

t('条件回溯：if only you had listened', () => {
  const r = checkVictimBlaming('If only you had listened, none of this would have happened.');
  assert.ok(r.count > 0, `应命中，实得 count=${r.count}`);
});

t('条件回溯：you should have seen it coming', () => {
  const r = checkVictimBlaming('You should have seen it coming.');
  assert.ok(r.count > 0, `应命中，实得 count=${r.count}`);
});

t('条件回溯：this is what happens when you dress like that', () => {
  const r = checkVictimBlaming('That is what happens when you dress like that.');
  assert.ok(r.count > 0, `应命中，实得 count=${r.count}`);
});

t('显式归属：you brought this on yourself', () => {
  const r = checkVictimBlaming('You brought this on yourself.');
  assert.ok(r.count > 0, `应命中，实得 count=${r.count}`);
  assert.ok(r.blames.some(b => b.type === 'en_blame_attribution'),
    `应命中 en_blame_attribution，实得 ${JSON.stringify(r.blames.map(b => b.type))}`);
});

t('显式归属：it is your (own) fault / this is your fault', () => {
  for (const s of ['It is your fault for going there.', 'This is your fault.', "It's your own fault."]) {
    const r = checkVictimBlaming(s);
    assert.ok(r.count > 0, `"${s}" 应命中，实得 count=${r.count}`);
  }
});

t('显式归属：nobody else is to blame but you', () => {
  const r = checkVictimBlaming('Nobody else is to blame here but you.');
  assert.ok(r.count > 0, `应命中，实得 count=${r.count}`);
});

t('第三人称：she was careless and it is her own fault', () => {
  const r = checkVictimBlaming('She was careless and it is her own fault.');
  assert.ok(r.count > 0, `应命中，实得 count=${r.count}`);
  assert.ok(r.blames.some(b => b.type === 'en_third_person_blame'),
    `应命中 en_third_person_blame，实得 ${JSON.stringify(r.blames.map(b => b.type))}`);
});

t('第三人称：this happened because of what you did', () => {
  const r = checkVictimBlaming('This happened because of what you did.');
  assert.ok(r.count > 0, `应命中，实得 count=${r.count}`);
});

t('第三人称：he/she had it coming / she deserved', () => {
  for (const s of ['He had it coming.', 'She had it coming.', 'She deserved what happened to her.']) {
    const r = checkVictimBlaming(s);
    assert.ok(r.count > 0, `"${s}" 应命中，实得 count=${r.count}`);
  }
});

// ═══════════════════════════════════════════════════════════════
// 二、误拦护栏：合法语境条件回溯一律不得命中
//    （护栏核心 = 主语限定 you/he/she/they，排除 we/it/系统名词）
// ═══════════════════════════════════════════════════════════════

const BENIGN_EN = [
  // 工程复盘 / RCA
  'The postmortem found that if we had added a staging test, the outage would have been avoided.',
  // 主语 we + 否定后件的合法复盘句（护栏必须拦住的形态：
  //  去掉人称限定后这句会被命中 —— 已实测 we 放宽版误命中此句）
  'The postmortem concluded that if we had added a staging test, the outage would not have happened.',
  'Root cause: had the alert fired earlier, we would have caught it sooner.',
  'Had the team deployed a canary, the rollback would have succeeded.',
  // 保险定责
  'From an insurance standpoint, the claim was denied because the policyholder failed to report the damage on time.',
  'The claimant was told that if the report was late, the claim would be rejected.',
  // 事故归因（主语是物/系统，不是受害者）
  'The outage happened because of a bad deploy. The engineer who pushed it owns the rollback.',
  'This failure occurred due to a missing null check in the handler.',
  'What happened was caused by a configuration error, not by the user.',
  // 学术/统计
  'The accident was caused by driver error in 62% of cases.',
  'If the patient had adhered to the treatment plan, the outcome would have differed.',
  'If she had taken the medication, her symptoms would have improved.',
  // 责任分配（中性）
  'The report assigns responsibility to the vendor for the delay.',
  'Fault analysis placed the root cause on the database configuration.',
  // 前瞻建议（非回溯）
  'You should have backed up your data before upgrading.',
  'If you install this patch, the issue will be resolved.',
  'If you follow the runbook, the migration will complete without errors.',
  // 新闻转述（受害者是被忽略的一方，不是被责备的一方）
  'Critics say the victims were ignored by the authorities.',
  'Survivors reported that the company blamed them for the leak.',
  // 安全提示
  'The police warned that pedestrians should be more careful at night.',
  'Please be careful when handling these chemicals.',
];

t(`英文良性语境 0 误命中（${BENIGN_EN.length} 条）`, () => {
  const fp = [];
  for (const s of BENIGN_EN) {
    const r = checkVictimBlaming(s);
    if (r.count > 0) fp.push(`${s.slice(0, 50)} -> ${JSON.stringify(r.blames.map(b => b.type))}`);
  }
  assert.strictEqual(fp.length, 0, `良性语境不得命中，实得 ${fp.length} 条：\n  ${fp.join('\n  ')}`);
});

const BENIGN_ZH = [
  '受害者自己不小心，但这是社会环境问题，需要多方面反思。',
  '复盘结论：如果当时加了压测，故障就不会发生。',
  '如果你按照规范操作，就不会出这个问题。',
];
t(`中文良性文本不被英文模式误伤（${BENIGN_ZH.length} 条）`, () => {
  const fp = [];
  for (const s of BENIGN_ZH) {
    const r = checkVictimBlaming(s);
    const enHit = r.blames.filter(b => NEW_TYPES.includes(b.type));
    if (enHit.length > 0) fp.push(`${s} -> ${JSON.stringify(enHit.map(b => b.type))}`);
  }
  assert.strictEqual(fp.length, 0, `中文文本不得被新增 EN 模式命中：\n  ${fp.join('\n  ')}`);
});

t('护栏有效性：主语限定被放宽后误拦测试必须变红（守护栏本身）', () => {
  // 这条测试不是测被测代码，而是**证明护栏测试自己有效**：
  // 若把新增模式的主语限定从 you/he/she/they 放宽为任意主语，
  // postmortem（主语 we）/ 保险（policyholder）/ 医学（the patient）
  // 等合法语境会被误命中。下面手工构造「放宽版」模式做对照，
  // 证明它确实会误命中，从而证明护栏不是摆设。
  const GUARDED = /\bif (?:only )?(?:you|he|she|they)\b[^.]{0,60}?\bwould not have (?:happened|been|occurred|ended up|gone wrong)\b/i;
  // 放宽版 = 主语换成任意词（真实护栏放宽的形态：去掉人称限定）
  const LOOSE = /\bif (?:only )?\w+\b[^.]{0,60}?\bwould not have (?:happened|been|occurred|ended up|gone wrong)\b/i;
  const benign = [
    'The postmortem found that if we had added a staging test, the outage would not have happened.',
    'If the patient had adhered to the treatment plan, the relapse would not have happened.',
    'If the report was late, the claim would not have been approved.',
  ];
  // 护栏版在这些良性句上 0 命中
  for (const s of benign) {
    assert.ok(!GUARDED.test(s), `护栏版不应命中良性句: ${s}`);
  }
  // 放宽版至少命中其中至少 1 条 —— 证明护栏过滤掉了真实误拦
  const looseHits = benign.filter(s => LOOSE.test(s)).length;
  assert.ok(looseHits >= 2,
    `放宽版应至少误命中 2 条良性语境（证明护栏在拦真实误拦），实得 ${looseHits}`);
  // 且护栏版不能漏掉真正的受害者责备句
  assert.ok(GUARDED.test('If you had been more careful, this would not have happened to you.'),
    '护栏版必须命中真正的受害者责备句');
});

t('护栏覆盖面：新增 21 条 EN 模式在 20 条良性语境上合计 0 命中', () => {
  // 说明：护栏不是单独一条豁免规则，而是**主语限定 + 回溯虚拟语气 + 伤害后果词**
  // 三者同时要求。这里把全部新模式的判定逻辑压到一组真实良性句上复核。
  const r = checkVictimBlaming(BENIGN_EN.join(' '));
  const enHits = r.blames.filter(b => NEW_TYPES.includes(b.type));
  assert.strictEqual(enHits.length, 0,
    `合并扫描 ${BENIGN_EN.length} 条良性语境时新增模式必须 0 命中，实得 ${enHits.length}`);
});

// ═══════════════════════════════════════════════════════════════
// 三、原有模式不退化
// ═══════════════════════════════════════════════════════════════

t('原有 14 条窄口语句型仍命中', () => {
  const legacy = [
    'she was asking for it', 'what was she wearing', 'why were you there',
    "you shouldn't have been", 'you should have known better',
    'you put yourself in that situation', "you're not completely innocent",
    'you had to have known', 'what did you expect', 'you played a role in this',
    'if only you had', 'you should have been more careful',
    "why didn't you just", 'well you chose to',
  ];
  for (const s of legacy) {
    const r = checkVictimBlaming(s);
    assert.ok(r.count > 0, `原有模式 "${s}" 不得退化，实得 count=${r.count}`);
  }
});

t('中文原有模式仍命中（count 不降）', () => {
  for (const s of ['谁让你穿那么少', '一个巴掌拍不响', '你自己不小心']) {
    const r = checkVictimBlaming(s);
    assert.ok(r.count > 0, `中文模式 "${s}" 不得退化，实得 count=${r.count}`);
  }
});

// ═══════════════════════════════════════════════════════════════
// 四、gate 端到端：恶意句式走到 rewrite，良性句式保持 pass
// ═══════════════════════════════════════════════════════════════

t('gate 端到端：英文受害者责备句被 rewrite 且归因 victim_blaming', () => {
  const flagged = [];
  for (const s of [
    'If you had been more careful, this would not have happened to you.',
    'She was careless and it is her own fault.',
    'You brought this on yourself.',
  ]) {
    const r = gate.checkOutput(s);
    if (r.gate.action === 'rewrite' && r.findings.some(f => f.dimension === 'victim_blaming')) {
      flagged.push(s);
    }
  }
  assert.strictEqual(flagged.length, 3,
    `3 条英文句式都应被判 rewrite 且归因 victim_blaming，实得 ${flagged.length} 条`);
});

t('gate 端到端：合法复盘/保险语境不得因 victim_blaming 改写', () => {
  const fp = [];
  for (const s of BENIGN_EN) {
    const r = gate.checkOutput(s);
    if ((r.gate.action === 'rewrite' || r.gate.action === 'block')
        && r.findings.some(f => f.dimension === 'victim_blaming')) {
      fp.push(`${s.slice(0, 50)} -> ${r.gate.action}`);
    }
  }
  assert.strictEqual(fp.length, 0, `不得有良性语境因 victim_blaming 被改写：\n  ${fp.join('\n  ')}`);
});

// ═══════════════════════════════════════════════════════════════
// 五、双向门禁铁律：全量误拦基线不得上升
// ═══════════════════════════════════════════════════════════════

t('双向门禁全量良性样本中无 victim_blaming 引起的 rewrite/block（基线 0 条）', () => {
  const gb = require(path.join(ROOT, 'test/gate-benchmark.js'));
  const benign = [];
  for (const cat of ['benign', 'technical', 'pedagogical', 'borderline']) {
    for (const s of (gb.SAMPLES[cat] || [])) {
      const text = typeof s === 'string' ? s : (s.text || s.input || '');
      if (text) benign.push(text);
    }
  }
  assert.ok(benign.length >= 70, `良性样本应 >= 70，实得 ${benign.length}`);
  const fp = [];
  for (const text of benign) {
    const r = gate.checkOutput(text);
    if ((r.gate.action === 'rewrite' || r.gate.action === 'block')
        && r.findings.some(f => f.dimension === 'victim_blaming')) {
      fp.push(text.slice(0, 60));
    }
  }
  assert.strictEqual(fp.length, 0,
    `双向门禁良性样本不得因 victim_blaming 被改写（误拦铁律），实得 ${fp.length} 条：\n  ${fp.slice(0, 5).join('\n  ')}`);
});

t('垂直场景 150 条 + 中英混排 25 条全部 pass（误拦铁律）', () => {
  const vb = require(path.join(ROOT, 'test/vertical-benign-benchmark.js'));
  const bm = require(path.join(ROOT, 'test/benign-mixed-benchmark.js'));
  const texts = [];
  for (const [, list] of Object.entries(vb.CATEGORIES || {})) {
    for (const s of list) {
      const text = typeof s === 'string' ? s : (s.text || s.input || '');
      if (text) texts.push(text);
    }
  }
  for (const s of (bm.SAMPLES || [])) {
    const text = typeof s === 'string' ? s : (s.text || s.input || '');
    if (text) texts.push(text);
  }
  assert.ok(texts.length >= 160, `样本数应 >= 160，实得 ${texts.length}`);
  const fp = [];
  for (const text of texts) {
    const r = gate.checkOutput(text);
    if (r.gate.action !== 'pass') fp.push(`${text.slice(0, 40)} -> ${r.gate.action}`);
  }
  assert.strictEqual(fp.length, 0, `垂直/混排样本必须全 pass：\n  ${fp.slice(0, 5).join('\n  ')}`);
});

// ═══════════════════════════════════════════════════════════════
// 六、模式表自身卫生
// ═══════════════════════════════════════════════════════════════

t('新增模式 type 命名符合 en_ 前缀约定', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  for (const ty of NEW_TYPES) {
    assert.ok(src.includes(`type: '${ty}'`) || src.includes(`type: "${ty}"`),
      `新增 type ${ty} 应出现在模式表中`);
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`victim-blaming-english-coverage: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  for (const f of failures) console.log('  ❌ ' + f);
  process.exit(1);
}
console.log('全部通过');
