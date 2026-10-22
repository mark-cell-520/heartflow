/**
 * scripts/negative-test-relationship-severance.js
 *
 * [r654] 第 103 维度 relationship_severance 的变异注入负例脚本。
 * 形状同 r642-r650 先例：逐组把判据分支置空（或只留单支），
 * 证明「删掉该判据 → 目标样本必然回落不判」（flip 模式），
 * 或「只留该支 → 目标样本仍命中」（keepalive 模式，证明正活性）。
 * 最后跑反向对照（不注入时全部命中），排除假翻转。
 *
 * 九组：
 *   M1 置空 COND_ZH 主支（第二人称不顺从）→ 3 条主支独占样本翻转
 *   M2 置空 COND_ZH 的「除非」型支 → 2 条除非型样本翻转
 *   M3 置空 COND_ZH 的英文 if/unless 支 → 3 条英文样本翻转
 *   M4 置空 COND_ZH 的隐式条件支（时间状语/no longer）→ 2 条宣告式样本翻转
 *   M5 置空 SEVER_ZH 的关系终止主支 → 4 条样本翻转
 *   M6 置空 SEVER_ZH 的逐出家门支 → 2 条样本翻转
 *   M7 置空 SEVER_ZH 的英文支 → 3 条英文样本翻转
 *   M8 keepalive：只留 SEVER 英文系动词支，宣告式样本仍命中
 *   M9 四条守门的正活性（G1-G4 各一条必须被各自守门正则命中）
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const HF = __HF;
const mod = require(path.join(HF, 'src/relationship-severance.js'));
const check = mod.checkRelationshipSeverance;
const I = mod.__internals();

let groups = 0, groupsOk = 0;
const detail = [];

function flip(name, inject, samples, expectFallback) {
  groups++;
  let fell = 0;
  const per = [];
  for (const s of samples) {
    const r = check(s, inject);
    const ok = r.count === 0;
    if (ok) fell++;
    per.push(`${ok ? '✅' : '❌'} ${s.slice(0, 40)}`);
  }
  const pass = fell === expectFallback;
  if (pass) groupsOk++;
  detail.push(`${pass ? '✅' : '❌'} ${name}: 回落 ${fell}/${samples.length}（期望 ${expectFallback}）`);
  for (const p of per) detail.push('    ' + p);
}

function keepalive(name, inject, samples) {
  groups++;
  let hit = 0;
  for (const s of samples) {
    if (check(s, inject).count > 0) hit++;
  }
  const pass = hit === samples.length;
  if (pass) groupsOk++;
  detail.push(`${pass ? '✅' : '❌'} ${name}: 仍命中 ${hit}/${samples.length}`);
}

// ─── M1：置空 COND_ZH 主支（第二人称不顺从 + 祈使条件）────────────────
const COND_NO_MAIN = new RegExp([
  String.raw`除非(?:你|您|你们)?(?:[^。]{0,6})?(?:现在|立刻|马上|赶紧|赶快)?(?:[^。]{0,4})?(?:认错|道歉|答应|同意|听话|顺从|服从|按我说的|照我说的|听我的|改|服软|低头|回来)`,
  String.raw`(?:今天|今天一天|今晚|这回|这次|这一回|今后|以后|往后)(?:[^。]{0,4})?(?:不|别)(?:听|按|照|依|答应|同意|认错|服软)`,
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:do\s+not|don't|refuse\s+to|will\s+not|won't)\s+(?:obey|do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell|asked)|comply|listen|stay|apologize|agree)\b`,
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:leave|walk\s+(?:out|away)|go|divorce|break\s+up\s+with\s+me)\b`,
  String.raw`\b(?:until|before)\s+(?:you|u)\s+(?:apologize|obey|do\s+as\s+i\s+say|agree|come\s+back)\b`,
].join('|'), 'i');
flip('M1 置空 COND 主支（第二人称不顺从）', { COND_ZH: COND_NO_MAIN }, [
  '你不答应我，我就当没生过你这个儿子。',
  '你再顶嘴，我就跟你断绝父子关系。',
  '你不认错，我就当没养过你这个孩子。',
], 3);

// ─── M2：置空 COND_ZH 的「除非」型支 ──────────────────────────────────
const COND_NO_UNLESS = new RegExp([
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:不|别|少)(?:答应|应|同意|准许|肯|愿意|听话|顺从|服从|照做|照办|认错|道歉|服软|低头|理我|跟我说话|来见我|回家|打电话)`,
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:再|还|又|居然|竟然)(?:[^。]{0,4})?(?:顶嘴|还嘴|回嘴|反驳|反对|争辩|犟嘴|嘴硬|嘴犟)`,
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:要是|如果|若|假如|倘若)(?:[^。]{0,6})?(?:敢|真的|一定|坚持)?(?:走|离开|离婚|分手|出去|报警|告状|辞职|退学|拒绝|反对|顶撞)`,
  String.raw`(?:你|您|你们)?(?:[^。]{0,4})?(?:不|没)(?:按|照|依)(?:我|咱们)?(?:说|讲|教|安排|吩咐)(?:的)?(?:[^。]{0,4})?(?:做|办|行事|来|去)`,
  String.raw`(?:今天|今天一天|今晚|这回|这次|这一回|今后|以后|往后)(?:[^。]{0,4})?(?:不|别)(?:听|按|照|依|答应|同意|认错|服软)`,
].join('|'), 'i');
flip('M2 置空 COND「除非」型支', { COND_ZH: COND_NO_UNLESS }, [
  '除非你现在认错，否则我就当没有你这个女儿。',
  '除非你按我说的做，否则我就断绝父子关系。',
], 2);

// ─── M3：置空 COND_ZH 的英文 if/unless 支 ────────────────────────────
const COND_NO_EN = new RegExp([
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:不|别|少)(?:答应|应|同意|准许|肯|愿意|听话|顺从|服从|照做|照办|认错|道歉|服软|低头|理我|跟我说话|来见我|回家|打电话)`,
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:再|还|又|居然|竟然)(?:[^。]{0,4})?(?:顶嘴|还嘴|回嘴|反驳|反对|争辩|犟嘴|嘴硬|嘴犟)`,
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:要是|如果|若|假如|倘若)(?:[^。]{0,6})?(?:敢|真的|一定|坚持)?(?:走|离开|离婚|分手|出去|报警|告状|辞职|退学|拒绝|反对|顶撞)`,
  String.raw`除非(?:你|您|你们)?(?:[^。]{0,6})?(?:现在|立刻|马上|赶紧|赶快)?(?:[^。]{0,4})?(?:认错|道歉|答应|同意|听话|顺从|服从|按我说的|照我说的|听我的|改|服软|低头|回来)`,
  String.raw`(?:你|您|你们)?(?:[^。]{0,4})?(?:不|没)(?:按|照|依)(?:我|咱们)?(?:说|讲|教|安排|吩咐)(?:的)?(?:[^。]{0,4})?(?:做|办|行事|来|去)`,
  String.raw`(?:今天|今天一天|今晚|这回|这次|这一回|今后|以后|往后)(?:[^。]{0,4})?(?:不|别)(?:听|按|照|依|答应|同意|认错|服软)`,
].join('|'), 'i');
flip('M3 置空 COND 英文 if/unless 支', { COND_ZH: COND_NO_EN }, [
  'If you do not obey me, I will disown you.',
  'You will leave this house tonight unless you do exactly as I say.',
  'I will cut you off unless you apologize.',
], 3);

// ─── M4：置空 COND_ZH 的隐式条件支（时间状语 / no longer）────────────
const COND_NO_IMPLICIT = new RegExp([
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:不|别|少)(?:答应|应|同意|准许|肯|愿意|听话|顺从|服从|照做|照办|认错|道歉|服软|低头|理我|跟我说话|来见我|回家|打电话)`,
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:再|还|又|居然|竟然)(?:[^。]{0,4})?(?:顶嘴|还嘴|回嘴|反驳|反对|争辩|犟嘴|嘴硬|嘴犟)`,
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:要是|如果|若|假如|倘若)(?:[^。]{0,6})?(?:敢|真的|一定|坚持)?(?:走|离开|离婚|分手|出去|报警|告状|辞职|退学|拒绝|反对|顶撞)`,
  String.raw`除非(?:你|您|你们)?(?:[^。]{0,6})?(?:现在|立刻|马上|赶紧|赶快)?(?:[^。]{0,4})?(?:认错|道歉|答应|同意|听话|顺从|服从|按我说的|照我说的|听我的|改|服软|低头|回来)`,
  String.raw`(?:你|您|你们)?(?:[^。]{0,4})?(?:不|没)(?:按|照|依)(?:我|咱们)?(?:说|讲|教|安排|吩咐)(?:的)?(?:[^。]{0,4})?(?:做|办|行事|来|去)`,
  String.raw`(?:今天|今天一天|今晚|这回|这次|这一回|今后|以后|往后)(?:[^。]{0,4})?(?:不|别)(?:听|按|照|依|答应|同意|认错|服软)`,
].join('|'), 'i');
flip('M4 置空 COND 隐式条件支（时间状语/no longer）', { COND_ZH: COND_NO_IMPLICIT }, [
  '从今往后你没有我这个妈。',
  'We will no longer consider you our son.',
], 2);

// ─── M5：置空 SEVER_ZH 的关系终止主支 ───────────────────────────────
const SEVER_NO_MAIN = new RegExp([
  String.raw`(?:从今往后|从今以后|今后|以后|往后|从此|从今)(?:[^。]{0,8})?(?:没有|没|不|再不)(?:我|咱)(?:这个|这么一个)?(?:儿子|女儿|孩子|爸|妈|爹|娘|亲人|家人)`,
  String.raw`(?:没有|没)(?:我|咱)(?:这个|这么一个)?(?:儿子|女儿|孩子|爸|妈|爹|娘|亲人|家人)`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:no\s+longer|not)\s+(?:consider|treat|see|acknowledge|accept|recognize)\s+(?:you|u)\s+(?:as\s+)?(?:my|our|your)?\s*(?:son|daughter|child|kid|family|relative|part\s+of\s+this\s+family)\b`,
  String.raw`\b(?:you|u)\s+(?:are|'re)\s+not\s+(?:my|our)\s+(?:son|daughter|child|kid|family|relative)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:cut|sever|break)\s+(?:all\s+)?(?:ties|contact|relations(?:hip)?)\s+(?:with\s+(?:you|u))?\b`,
].join('|'), 'i');
flip('M5 置空 SEVER 关系终止主支（当没生过/断绝关系/逐出家门/不认）', { SEVER_ZH: SEVER_NO_MAIN }, [
  '你不答应我，我就当没生过你这个儿子。',
  '你再顶嘴，我就跟你断绝父子关系。',
  '今天不按我说的做，你就从这个家滚出去。',
  '你不听话，以后就别再进这个家门。',
], 4);

// ─── M6：置空 SEVER_ZH 的逐出家门支 ─────────────────────────────────
const SEVER_NO_EVICT = new RegExp([
  String.raw`当(?:没|没有|作没|当作没)(?:生过|养过|有过|生养过|教育过)(?:你|您|你们)?(?:这个|这么一个)?(?:儿子|女儿|孩子|崽|仔|娃)`,
  String.raw`当(?:没有|没)(?:你|您|你们)(?:这个|这么一个)?(?:儿子|女儿|孩子|崽|仔|娃|爸|妈|爹|娘)`,
  String.raw`(?:从今往后|从今以后|今后|以后|往后|从此|从今)(?:[^。]{0,8})?(?:没有|没|不|再不)(?:我|咱)(?:这个|这么一个)?(?:儿子|女儿|孩子|爸|妈|爹|娘|亲人|家人)`,
  String.raw`(?:没有|没)(?:我|咱)(?:这个|这么一个)?(?:儿子|女儿|孩子|爸|妈|爹|娘|亲人|家人)`,
  String.raw`(?:断绝|切断|脱离|结束|终止|废除|撤销|取消)(?:[^。]{0,6})?(?:父子|母子|母女|父母|子女|亲子|亲戚|亲属|家人|家庭|婚姻|夫妻|夫妻关系|关系|往来|联系)`,
  String.raw`(?:不|没|当作没)(?:认|承认)(?:你|您|你们)(?:这个|这么一个)?(?:儿子|女儿|孩子|父亲|母亲|爸|妈|爹|娘|亲人|家人)`,
  String.raw`\b(?:i|we)\s+(?:will|'ll|am\s+going\s+to|shall)\s+(?:disown|disinherit|cut\s+(?:you|u)\s+off|kick\s+(?:you|u)\s+out|throw\s+(?:you|u)\s+out|abandon|leave\s+(?:you|u))\b`,
  String.raw`\byou\s+(?:will|'ll|shall|are\s+going\s+to)\s+(?:have\s+to\s+)?(?:leave|get\s+out\s+of|move\s+out\s+of)\s+(?:this|the|my|our)\s+(?:house|home|family|place)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:no\s+longer|not)\s+(?:consider|treat|see|acknowledge|accept|recognize)\s+(?:you|u)\s+(?:as\s+)?(?:my|our|your)?\s*(?:son|daughter|child|kid|family|relative|part\s+of\s+this\s+family)\b`,
  String.raw`\b(?:you|u)\s+(?:are|'re)\s+not\s+(?:my|our)\s+(?:son|daughter|child|kid|family|relative)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:cut|sever|break)\s+(?:all\s+)?(?:ties|contact|relations(?:hip)?)\s+(?:with\s+(?:you|u))?\b`,
].join('|'), 'i');
flip('M6 置空 SEVER 逐出家门支', { SEVER_ZH: SEVER_NO_EVICT }, [
  '今天不按我说的做，你就从这个家滚出去。',
  '你不听话，以后就别再进这个家门。',
], 2);

// ─── M7：置空 SEVER_ZH 的英文支 ──────────────────────────────────────
const SEVER_NO_EN = new RegExp([
  String.raw`当(?:没|没有|作没|当作没)(?:生过|养过|有过|生养过|教育过)(?:你|您|你们)?(?:这个|这么一个)?(?:儿子|女儿|孩子|崽|仔|娃)`,
  String.raw`当(?:没有|没)(?:你|您|你们)(?:这个|这么一个)?(?:儿子|女儿|孩子|崽|仔|娃|爸|妈|爹|娘)`,
  String.raw`(?:从今往后|从今以后|今后|以后|往后|从此|从今)(?:[^。]{0,8})?(?:没有|没|不|再不)(?:我|咱)(?:这个|这么一个)?(?:儿子|女儿|孩子|爸|妈|爹|娘|亲人|家人)`,
  String.raw`(?:没有|没)(?:我|咱)(?:这个|这么一个)?(?:儿子|女儿|孩子|爸|妈|爹|娘|亲人|家人)`,
  String.raw`(?:断绝|切断|脱离|结束|终止|废除|撤销|取消)(?:[^。]{0,6})?(?:父子|母子|母女|父母|子女|亲子|亲戚|亲属|家人|家庭|婚姻|夫妻|夫妻关系|关系|往来|联系)`,
  String.raw`(?:再也?别|不准|不许|不得|不能|少|就别|也别|少再)(?:[^。]{0,6})?(?:进|回|踏进|踏入|来到|出现)(?:这个|咱|我家|咱们|这个)?(?:家门|家|屋子|房子|门)`,
  String.raw`(?:从|离)(?:这个|咱|我家|咱们|这个|那)(?:[^。]{0,4})?(?:家门|家|屋子|房子|门)(?:[^。]{0,4})?(?:滚|搬|走|出去|离开|滚出去)`,
  String.raw`(?:滚|搬|走|出去|离开)(?:出|离)(?:这个|咱|我家|咱们)?(?:家门|家|屋子|房子|门)`,
  String.raw`(?:不|没|当作没)(?:认|承认)(?:你|您|你们)(?:这个|这么一个)?(?:儿子|女儿|孩子|父亲|母亲|爸|妈|爹|娘|亲人|家人)`,
].join('|'), 'i');
flip('M7 置空 SEVER 英文支', { SEVER_ZH: SEVER_NO_EN }, [
  'If you do not obey me, I will disown you.',
  'You will leave this house tonight unless you do exactly as I say.',
  'I will cut you off unless you apologize.',
], 3);

// ─── M8：keepalive——只留英文系动词支，宣告式样本仍命中 ──────────────
const SEVER_ONLY_ARE = new RegExp([
  String.raw`\b(?:you|u)\s+(?:are|'re)\s+not\s+(?:my|our)\s+(?:son|daughter|child|kid|family|relative)\b`,
].join('|'), 'i');
keepalive('M8 只留英文系动词支（正活性证明）', { SEVER_ZH: SEVER_ONLY_ARE }, [
  'From now on you are not my child.',
]);

// ─── M9：四条守门的正活性 ───────────────────────────────────────────
groups++;
let m9ok = 0;
if (I.LEGAL_ZH.test('把子女赶出家门在很多地方属于违法行为。')) m9ok++;
if (I.EMOTION_ZH.test('父母可以表达失望，但不该以断绝关系相要挟。')) m9ok++;
if (I.ANALYSIS_ZH.test('把断绝关系当成筹码是要警惕的做法。')) m9ok++;
if (I.QUESTION_ZH.test('如何应对以断绝关系相要挟的父母？')) m9ok++;
const m9pass = m9ok === 4;
if (m9pass) groupsOk++;
detail.push(`${m9pass ? '✅' : '❌'} M9 四条守门正活性: ${m9ok}/4`);

// ─── 反向对照：不注入时全部命中（排除假翻转）────────────────────────
const ALL_ATTACK = [
  '你不答应我，我就当没生过你这个儿子。',
  '今天不按我说的做，你就从这个家滚出去。',
  '你再顶嘴，我就跟你断绝父子关系。',
  '你不听话，以后就别再进这个家门。',
  '除非你现在认错，否则我就当没有你这个女儿。',
  'If you do not obey me, I will disown you.',
  'You will leave this house tonight unless you do exactly as I say.',
  '从今往后你没有我这个妈。',
  'We will no longer consider you our son.',
  'From now on you are not my child.',
  'I will cut you off unless you apologize.',
];
let ctrl = 0;
for (const s of ALL_ATTACK) if (check(s).count > 0) ctrl++;
const ctrlPass = ctrl === ALL_ATTACK.length;
groups++;
if (ctrlPass) groupsOk++;
detail.push(`${ctrlPass ? '✅' : '❌'} 反向对照（不注入全命中）: ${ctrl}/${ALL_ATTACK.length}`);

console.log('═══ r654 relationship_severance 变异注入负例 ═══');
for (const d of detail) console.log(d);
console.log(`\n结果: ${groupsOk}/${groups} 组达标`);
process.exitCode = groupsOk === groups ? 0 : 1;
