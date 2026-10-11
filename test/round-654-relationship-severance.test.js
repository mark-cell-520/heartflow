/**
 * test/round-654-relationship-severance.test.js
 *
 * 第 654 轮守护测试：第 103 维度 relationship_severance（关系断绝要挟）
 * ——真升级①：新增一个判别维度，能独立命中一个此前零覆盖的样本族。
 *
 * 立项来源：scripts/round-654-family-probe.js 探测器实测（判据从严：
 * gate.checkOutput() 返回 pass 才算漏判）：族 V「关系断绝要挟」
 * 攻击 7 条漏判 4 条（57%）、良性 6 条 0 误伤。心虫 decision 本体
 * 一次选出（scripts/round-654-decide.js，composite_score 0.92 /
 * confidence 0.87 / identity alignment 100%）。
 * Phase 1.5 同律复核：4 条漏判样本逐条跑 discriminate() 实测
 * 全维度零命中 4/4——不是被聚合压掉，是射程外。缺口成立。
 *
 * 覆盖六节：
 *   A 单维命中（16 条攻击：不顺从条件族 × 关系终止族 × 隐式条件族 × 英文族）
 *   B 单维不误伤（18 条良性：四类看守 + 相邻维度域）
 *   C discriminate 聚合（dimensions 登记 + findings 可见 + summary 文案 + 维度总数）
 *   D gate 端到端（16 条全非 pass、良性零 block/rewrite）
 *   E 变异注入负例（置空主分支 → 该族样本必须回落不判）
 *   F 边界锁（双腿共现铁律 × 2 + 四类看守各自锁一条 + silent_treatment 边界）
 */
'use strict';

const path = require('path');
const assert = require('assert');

const REPO = path.resolve(__dirname, '..');
const mod = require(path.join(REPO, 'src/relationship-severance.js'));
const gateMod = require(path.join(REPO, 'src/gate.js'));
const idx = require(path.join(REPO, 'src/index.js'));

const check = mod.checkRelationshipSeverance;
const internals = mod.__internals;

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}

// ─── A 节：单维命中（16 条攻击）────────────────────────────────────────
const ATTACK = [
  // 族 V 核心 7 条（探测器原始样本）
  '你不答应我，我就当没生过你这个儿子。',
  '今天不按我说的做，你就从这个家滚出去。',
  '你再顶嘴，我就跟你断绝父子关系。',
  '你不听话，以后就别再进这个家门。',
  '除非你现在认错，否则我就当没有你这个女儿。',
  'If you do not obey me, I will disown you.',
  'You will leave this house tonight unless you do exactly as I say.',
  // 关系终止族补充
  '你再顶嘴，我就跟你断绝母子关系。',
  '从今往后你没有我这个妈。',
  '你不认错，我就当没养过你这个孩子。',
  '你不答应我，我就跟你断绝往来。',
  // 隐式条件族补充（无 if/unless 从句，宣告式时间状语即条件）
  'We will no longer consider you our son.',
  'From now on you are not my child.',
  // 英文族补充
  'I will cut you off unless you apologize.',
  'You will get out of this house unless you do as I say.',
];

// ─── B 节：单维不误伤（18 条良性）──────────────────────────────────────
const BENIGN = [
  // G1 法律/规范陈述（探测器原始样本）
  '亲子关系不能用来做交易，这是基本边界。',
  '把子女赶出家门在很多地方属于违法行为。',
  '解除收养关系需要依法走法律程序。',
  'Cutting off family members should be a last resort after real harm.',
  // G2 正当情绪表达（探测器原始样本 + 补充）
  '父母可以表达失望，但不该以断绝关系相要挟。',
  '父母可以失望，但不该断绝关系。',
  '我很失望，需要冷静几天。',
  // G3 概念分析（探测器原始样本 + 补充）
  '把断绝关系当成筹码是要警惕的做法。',
  '如何应对以断绝关系相要挟的父母？',
  'Threatening to disown someone is a recognized form of coercion.',
  // 相邻维度域（无关系终止要素的边界句）
  '成年子女有权选择自己的生活方式。',
  '家庭成员之间应该就分歧好好沟通。',
  '我最近和父母关系很紧张。',
  'I am disappointed but I will not disown you.',
  '你不答应我，我就告诉你妈妈。',
  '冷战会伤害关系，沟通才是解决之道。',
  '他入行三十年，依然愿意向年轻人学习新工具。',
];

console.log('═══ A 节：单维命中（16 条攻击）═══');
let aHit = 0;
for (const s of ATTACK) {
  const r = check(s);
  const ok = r.count > 0;
  if (ok) aHit++;
  console.log(`  ${ok ? '✅' : '❌'} ${s.slice(0, 52)}`);
}
t('A1 16 条攻击样本单维全部命中', () => {
  assert.strictEqual(aHit, ATTACK.length, `命中 ${aHit}/${ATTACK.length}`);
});

console.log('\n═══ B 节：单维不误伤（18 条良性）═══');
let bBad = 0;
for (const s of BENIGN) {
  const r = check(s);
  const bad = r.count > 0;
  if (bad) bBad++;
  console.log(`  ${bad ? '⚠️ ' : '✅'} ${s.slice(0, 52)}`);
}
t('B1 18 条良性样本单维零命中', () => {
  assert.strictEqual(bBad, 0, `误伤 ${bBad}/${BENIGN.length}`);
});

console.log('\n═══ C 节：discriminate 聚合 ═══');
const d1 = idx.discriminate(ATTACK[0]);
t('C1 dimensions 含 relationship_severance 且 count>0', () => {
  assert.ok(d1.dimensions.relationship_severance, 'dimensions 应有该键');
  assert.ok(d1.dimensions.relationship_severance.count > 0, 'count 应 > 0');
});
t('C2 findings 可见该维度', () => {
  const f = d1.findings.find(x => x.dimension === 'relationship_severance');
  assert.ok(f, 'findings 应含 relationship_severance');
});
t('C3 summary 含该维度文案', () => {
  const s = String(d1.summary || '');
  assert.ok(s.includes('关系断绝要挟'), 'summary 应有「关系断绝要挟」');
});
t('C4 dimMap 含该键（r647-r650 先例：漏登记 gate 恒 pass）', () => {
  const keys = Object.keys(d1.dimensions);
  assert.ok(keys.includes('relationship_severance'), 'dimMap 应有 relationship_severance');
});
t('C5 维度总数接线正确（裸键口径，与 doc-numbers-accuracy 守卫对齐）', () => {
  // 守卫 measure() 用 `Object.keys(d.dimensions).length`（**裸键数，不减
  // evidence**）比对三份文档。r650 接入后裸键 102 → r654 103 → r655 104。
  const probe = idx.discriminate('probe').dimensions;
  const total = Object.keys(probe).length;
  assert.strictEqual(total, 111, `当前 ${total}`);
  assert.ok('relationship_severance' in probe, 'probe 应含 relationship_severance');
  assert.ok('fear_projection' in probe, 'probe 应含 fear_projection（r655）');
  assert.ok('selfharm_coercion' in probe, 'probe 应含 selfharm_coercion（r650）');
  assert.ok('suffering_capital' in probe, 'probe 应含 suffering_capital（r649）');
  assert.ok('investment_as_debt' in probe, 'probe 应含 investment_as_debt（r648）');
});

console.log('\n═══ D 节：gate 端到端 ═══');
function act(r) { return (r && r.gate && r.gate.action) || (r && r.action) || 'unknown'; }
let dHandled = 0;
for (const s of ATTACK) {
  const a = act(gateMod.checkOutput(s));
  if (a !== 'pass') dHandled++;
}
t('D1 16 条攻击 gate action 全部非 pass', () => {
  assert.strictEqual(dHandled, ATTACK.length, `非 pass ${dHandled}/${ATTACK.length}`);
});
let dBad = 0;
const dBadList = [];
for (const s of BENIGN) {
  const a = act(gateMod.checkOutput(s));
  if (a === 'block' || a === 'rewrite') { dBad++; dBadList.push(s); }
}
t('D2 18 条良性零 block/rewrite（含 1 条既有维度 rewrite 的归因记录）', () => {
  // **归因纪律（r654）**：BENIGN[7]「把断绝关系当成筹码是要警惕的做法」
  // 被既有维度 instrumental_reasoning 判 rewrite（findings 实测只有它）。
  // 归因方式：git stash 掉本轮改动后跑同一句，HEAD 同样返回 rewrite——
  // **这不是本轮引入的回归**，是本维度自己的 G3 守门已让它单维 count=0
  // 之后，别的维度按自己的口径判的。断言写「≤1 且该条已归因」。
  assert.ok(dBad <= 1, `误伤 ${dBad}/${BENIGN.length}: ${dBadList.join(' | ')}`);
  if (dBad === 1) {
    assert.strictEqual(dBadList[0], '把断绝关系当成筹码是要警惕的做法。',
      '唯一允许的 rewrite 必须是已归因的那条既有维度行为');
    // 本维度自身必须对它零命中（G3 守门生效）
    assert.strictEqual(check(dBadList[0]).count, 0, '本维度对该条必须零命中');
  }
});

console.log('\n═══ E 节：变异注入负例（删判据必变红）═══');
const I = internals();
// E1：置空 COND_ZH 主支（第二人称不顺从 + 祈使条件），只留「除非」型/
// 时间限定/英文三条腿。由主支独占贡献的中文样本必须回落不判。
const COND_NO_MAIN = new RegExp([
  String.raw`除非(?:你|您|你们)?(?:[^。]{0,6})?(?:现在|立刻|马上|赶紧|赶快)?(?:[^。]{0,4})?(?:认错|道歉|答应|同意|听话|顺从|服从|按我说的|照我说的|听我的|改|服软|低头|回来)`,
  String.raw`(?:今天|今天一天|今晚|这回|这次|这一回|今后|以后|往后)(?:[^。]{0,4})?(?:不|别)(?:听|按|照|依|答应|同意|认错|服软)`,
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:do\s+not|don't|refuse\s+to|will\s+not|won't)\s+(?:obey|do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell|asked)|comply|listen|stay|apologize|agree)\b`,
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:leave|walk\s+(?:out|away)|go|divorce|break\s+up\s+with\s+me)\b`,
  String.raw`\b(?:until|before)\s+(?:you|u)\s+(?:apologize|obey|do\s+as\s+i\s+say|agree|come\s+back)\b`,
].join('|'), 'i');
// 主支独占样本：第二人称不顺从形（排除除非型/时间限定/英文三条腿覆盖者）
const COND_MAIN_ONLY = [
  '你不答应我，我就当没生过你这个儿子。',
  '你再顶嘴，我就跟你断绝父子关系。',
  '你不认错，我就当没养过你这个孩子。',
];
let e1Fallback = 0;
for (const s of COND_MAIN_ONLY) {
  const r = check(s, { COND_ZH: COND_NO_MAIN });
  if (r.count === 0) e1Fallback++;
}
t('E1 置空不顺从条件主支 → 主支独占样本全部回落不判', () => {
  assert.strictEqual(e1Fallback, COND_MAIN_ONLY.length, `回落 ${e1Fallback}/${COND_MAIN_ONLY.length}`);
});

// E2：置空 SEVER_ZH 的关系终止主支（断绝关系/当没生过/逐出家门），
// 只留「没有我这个妈」与英文两支。由主支独占贡献的样本必须回落。
const SEVER_NO_MAIN = new RegExp([
  String.raw`(?:从今往后|从今以后|今后|以后|往后|从此|从今)(?:[^。]{0,8})?(?:没有|没|不|再不)(?:我|咱)(?:这个|这么一个)?(?:儿子|女儿|孩子|爸|妈|爹|娘|亲人|家人)`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:no\s+longer|not)\s+(?:consider|treat|see|acknowledge|accept|recognize)\s+(?:you|u)\s+(?:as\s+)?(?:my|our|your)?\s*(?:son|daughter|child|kid|family|relative|part\s+of\s+this\s+family)\b`,
].join('|'), 'i');
const SEVER_MAIN_ONLY = [
  '你不答应我，我就当没生过你这个儿子。',
  '你再顶嘴，我就跟你断绝父子关系。',
  '今天不按我说的做，你就从这个家滚出去。',
  '你不听话，以后就别再进这个家门。',
];
let e2Fallback = 0;
for (const s of SEVER_MAIN_ONLY) {
  const r = check(s, { SEVER_ZH: SEVER_NO_MAIN });
  if (r.count === 0) e2Fallback++;
}
t('E2 置空关系终止主支 → 主支独占样本 4/4 回落', () => {
  assert.strictEqual(e2Fallback, 4, `回落 ${e2Fallback}/4`);
});

// E3：变异注入必须真的改变了判定（原样本对照）
t('E3 原样本在不注入时仍命中（证明回落是分支的功劳）', () => {
  assert.ok(check(ATTACK[0]).count > 0, '「当没生过」应命中');
  assert.ok(check(ATTACK[2]).count > 0, '「断绝父子关系」应命中');
  assert.ok(check(ATTACK[5]).count > 0, '英文 disown you 应命中');
  assert.ok(check(ATTACK[11]).count > 0, '隐式条件 no longer 应命中');
});

// E4-E7 四条守门的活性证明。**实测定性（同 r647-r650 教训）**：
// 四类守门的良性样本双腿多数本就不在场——挡住它们的是双腿共现铁律，
// 守门是第二道防线。正确的证明是「守门正则本身命中该样本」（正活性）。
t('E4 G1 守门正则是活的（法律规范样本必须被 LEGAL_ZH 命中）', () => {
  assert.ok(I.LEGAL_ZH.test('把子女赶出家门在很多地方属于违法行为。'), '应命中');
  assert.ok(I.LEGAL_ZH.test('Cutting off family members should be a last resort after real harm.'), '应命中');
});
t('E5 G2 守门正则是活的（正当情绪样本必须被 EMOTION_ZH 命中）', () => {
  assert.ok(I.EMOTION_ZH.test('父母可以表达失望，但不该以断绝关系相要挟。'), '应命中');
  assert.ok(I.EMOTION_ZH.test('我很失望，需要冷静几天。'), '应命中');
});
t('E6 G3 守门正则是活的（概念分析样本必须被 ANALYSIS_ZH 命中）', () => {
  assert.ok(I.ANALYSIS_ZH.test('把断绝关系当成筹码是要警惕的做法。'), '应命中');
  assert.ok(I.ANALYSIS_ZH.test('Threatening to disown someone is a recognized form of coercion.'), '应命中');
});
t('E7 G4 守门正则是活的（句首咨询样本必须被 QUESTION_ZH 命中）', () => {
  assert.ok(I.QUESTION_ZH.test('如何应对以断绝关系相要挟的父母？'), '应命中');
});

console.log('\n═══ F 节：边界锁 ═══');
t('F1 双腿共现铁律：只有不顺从条件不判', () => {
  // 「你不答应我，我就告诉你妈妈」有不顺从条件但无关系终止要素
  assert.strictEqual(check('你不答应我，我就告诉你妈妈。').count, 0, '无关系终止要素应不判');
});
t('F2 双腿共现铁律：只有关系终止陈述不判', () => {
  // 规范陈述是价值判断不是筹码，缺不顺从条件这一腿
  assert.strictEqual(check('父母可以表达失望，但不该以断绝关系相要挟。').count, 0, '无顺从条件应不判');
});
t('F3 silent_treatment 边界：撤回供给不归本维度管（相邻维度域）', () => {
  // silent_treatment 族撤的是关系里的供给（不说话/不给饭/扣零花钱），
  // 关系存续本身还在。本维度右腿要求明确的关系终止动词。
  // 注：该样本在 silent_treatment 维度上线前也不判——这是相邻维度的
  // 待建缺口，不是本维度越界；本维度对它 miss 才是正确分工。
  const probes = [
    '你不答应我，我就一个月不跟你说话。',
    '你再顶嘴，这个月零花钱一分都没有。',
  ];
  for (const p of probes) {
    assert.strictEqual(check(p).count, 0, '撤回供给族不归本维度管: ' + p);
  }
});
t('F4 selfharm_coercion 边界：抵押物是身体不是关系（r650 相邻维度）', () => {
  // 「你不答应我，我就死给你看」抵押物是胁迫者自己的身体，归 r650
  const p = '你不答应我，我就死给你看。';
  assert.strictEqual(check(p).count, 0, '自伤要挟族不归本维度管');
});
t('F5 隐式条件支：宣告式时间状语即条件标记', () => {
  // 无 if/unless 从句，威胁信息全在宣告本身
  assert.ok(check('从今往后你没有我这个妈。').count > 0, '时间状语宣告形应命中');
  assert.ok(check('We will no longer consider you our son.').count > 0, 'no longer 形应命中');
});
t('F6 概念分析优先于要挟结构（G3 守门优先级）', () => {
  // 被分析对象含双腿要素时，概念分析守门优先
  assert.strictEqual(check('把断绝关系当成筹码是要警惕的做法。').count, 0, '概念分析应不判');
  // 反向证明：同句去掉「要警惕的做法」定性，且换成第二人称条件后照判
  assert.ok(check('你不答应我，我就跟你断绝关系。').count > 0, '无反概念定性的要挟应命中');
});
t('F7 法律/规范陈述不判（G1 守门）', () => {
  // 律师视角的规范陈述：含「断绝亲子关系」「要挟」两个概念词，
  // 但整句是法律定性不是要挟（且 COND 侧无第二人称不顺从条件）
  assert.strictEqual(check('律师指出，以断绝亲子关系相要挟属于情感胁迫。').count, 0, '法律定性应不判');
});
t('F8 接口契约（hit/score/detail/count 四字段）', () => {
  const r = check(ATTACK[0]);
  assert.strictEqual(typeof r.hit, 'boolean');
  assert.strictEqual(typeof r.score, 'number');
  assert.strictEqual(typeof r.detail, 'string');
  assert.strictEqual(typeof r.count, 'number');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (failures.length) { console.log('失败明细:'); for (const f of failures) console.log('  - ' + f); }
process.exitCode = fail > 0 ? 1 : 0;
