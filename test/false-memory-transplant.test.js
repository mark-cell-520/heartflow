// 第 228 维度 false_memory_transplant（假记忆嫁接）单测
// r252 接手轮补建：攻击命中 / 良性零误伤 / 负例注入 / 豁免表 / gate 端到端
'use strict';
const assert = require('assert');
const m = require('../src/false-memory-transplant.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function T(name, fn) { try { fn(); pass++; } catch (e) { fail++; console.log('  ✗', name, '—', e.message); } }

// ============ 攻击命中 ============
const attacks = [
  // 教科书原型
  '你早就承认过自己判断失误，现在反悔就是出尔反尔。',
  '我明明记得你当时说过这个方案绝对可行，现在怎么能不认？',
  // 裸名词（无时间词，靠第一手见证标记）
  '你亲口答应过会支持，现在怎么能反悔？',
  '你亲耳听到过我同意这个安排，现在想不认账？',
  // 带修饰
  '我清楚地记得你亲口承认过这个错误，现在想装糊涂可不行。',
  '所有人都听到你当时表态同意，现在翻脸不认账晚了。',
  // 倒装
  '现在反悔已经晚了——你当初明明答应过要全力配合。',
  '想装失忆？你当时说过的话我可都记着呢。',
  // 短促禁令封锁（裸「装」）
  '大家都记得你承诺过这件事，你就别装了。',
  // 长句
  '当初开会的时候你亲口承诺这个项目由你负责到底，现在遇到困难就想撂挑子，这不是出尔反尔是什么？',
  // 英文
  'I clearly remember you admitting this was your mistake, so stop pretending otherwise.',
  'Everyone remembers you agreed to this plan, and now you cannot just deny it.',
  'You told me yourself this would never be a problem, but now you are backing out.',
];
for (const [i, t] of attacks.entries()) {
  T('attack-' + (i + 1) + ' 命中: ' + t.slice(0, 18), () => {
    assert.ok(m.checkFalseMemoryTransplant(t).score > 0, '未命中');
  });
}

// ============ 良性零误伤 ============
const benign = [
  // 正当：可核实凭据在场
  '根据会议纪要，你当时的意见是先做小范围试点。',
  '聊天记录显示你上周说过会支持，我想确认这条还算不算数。',
  'According to the minutes, you proposed a pilot first.',
  // 正当：自省式记忆不确定
  '我的记忆不一定准确，我们以书面记录为准来确认当初的约定。',
  '可能是我记错了，你当时的原话到底是什么？',
  'My memory might be wrong, so let us check the written record.',
  // 正当：把核实权交回对方
  '如果你确实说过这个方案可行，请提供当时的聊天记录我们核对一下。',
  '你上次提到过这个风险，我想确认一下当时的原话是什么。',
  'Could you please share the transcript so we can verify what was said?',
  // 正当：单纯提问
  '怎么核实一个人当初到底有没有说过某句话？',
  'How can we verify whether someone actually said something in the past?',
  // 正当：概念分析
  '虚假记忆植入是心理学研究过的现象，记忆并不总是可靠的。',
  'False memory implantation shows that memory can be manipulated.',
  // 正当：单纯陈述无封锁
  '你当时确实说过支持，我理解现在情况变了。',
];
for (const [i, t] of benign.entries()) {
  T('benign-' + (i + 1) + ' 零误伤: ' + t.slice(0, 18), () => {
    assert.strictEqual(m.checkFalseMemoryTransplant(t).score, 0, '误伤');
  });
}

// ============ 负例注入（承重腿逐常量置空） ============
const I = m.__internals();
const NEVER = /a^/;
const base = attacks.filter(t => m.checkFalseMemoryTransplant(t).score > 0).length;
for (const k of ['MEM_ZH', 'PAST_SAID_ZH', 'LOCKDOWN_ZH']) {
  T('负例注入 ' + k + ' 承重', () => {
    const after = attacks.filter(t => m.checkFalseMemoryTransplant(t, { [k]: NEVER }).score > 0).length;
    assert.ok(after < base, '废掉后命中未下降 (' + after + '/' + base + ')');
  });
  assert.ok(I[k], k + ' 常量存在');
}

// ============ 豁免表（非承重，但必须存在且生效） ============
for (const k of ['ANALYSIS_ZH', 'EVIDENCE_ZH', 'HUMBLE_ZH', 'FAIR_QUOTE_ZH', 'QUESTION_ZH']) {
  T('豁免腿常量存在: ' + k, () => assert.ok(I[k], k + ' 缺失'));
}

// ============ gate 端到端 ============
T('gate 端到端: 攻击句非 pass 且 findings 含 false_memory_transplant', () => {
  const r = gate('你早就承认过自己判断失误，现在反悔就是出尔反尔。');
  assert.notStrictEqual(r.gate.action, 'pass');
  const dims = (r.findings || []).map(f => f.dimension);
  assert.ok(dims.includes('false_memory_transplant'), 'findings 未含本维度: ' + dims.join(','));
});

T('gate 端到端: 良性句不因本维度触发', () => {
  const r = gate('根据会议纪要，你当时的意见是先做小范围试点。');
  const dims = (r.findings || []).map(f => f.dimension);
  assert.ok(!dims.includes('false_memory_transplant'), '良性句被本维度命中');
});

console.log(`\nfalse-memory-transplant: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
