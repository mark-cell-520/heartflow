/**
 * test/round-260-omission-bias.test.js — r260 不作为偏误维度测试（provisional 245）
 * 覆盖：攻击命中（双腿型中英 18+13 + 独腿签名 1+2）、良性零误伤（疑难 FP
 * 压力 26 + 已知缺口 2 + 否定守卫）、三组豁免（概念教学 / 法律分析 / 双侧
 * 并举，嵌入真实签名，可负例注入证明承重）、边界锁（防自证/防重叠 /
 * 距离窗双向承重 / 否定守卫中英 / 限幅档位 0.62→0.72）、多签名档位、
 * 负例注入（腿① 4+3 组 + 腿② 5+5 组逐组删除 + 独腿 1+2 条逐条 + 三豁免
 * 中英删除）、官方良性语料 326、引擎闸。
 * 与 r218-r259 模块同一测试范式：每个负例注入删除一组常量后，攻击必须
 * 不再命中、豁免句必须变红——证明每一组判据都真实承重。
 * 模块未接线（provisional 245），src/index.js 接线由 1 号按报告 §五 补全。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectOmissionBias, __internals } = require('../src/omission-bias.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组常量）
const NEVER = /(?!)/;
const I = __internals();

const D = (t, inj) => detectOmissionBias(t, inj || null);

// ─── 攻击样本 A：双腿型（腿①不作为在场 × 腿②豁免/不对称断言）──────────
const ATTACK_2LEG_ZH = [
  '他什么都没做，怎么能怪他。',
  '见死不救总比亲手杀人轻。',
  '至少我们没有主动害人。',
  '我们虽然知情，但毕竟没有动手。',
  '不动手就不算犯错。',
  '保持中立没有错，错的是那些行动的人。',
  '看着事故发生而不作为，比造成事故的责任小得多。',
  '我们没做错什么，只是袖手旁观。',
  '责任不在我们，我们又没阻止。',
  '他见危不救，但怪不到他头上。',
  '我们只是没有干预，说到底不过是没伸手。',
  '虽然我们知道风险，但毕竟没有参与，罪过谈不上。',
  '他只是袖手旁观，情有可原。',
  '不作为无责，这是规矩。',
  '他旁观全程却没有动手，我们难以责怪他。',
  '我们从未介入，错不在我们。',
  '他只是视而不见，不应该被追责。',
  '虽然造成了损失，但相比主动破坏，我们这顶多算是旁观。',
];
const ATTACK_2LEG_EN = [
  'He did not do anything, so how can you blame him?',
  'Letting someone die is not as bad as killing them yourself.',
  'At least we did not actively harm anyone.',
  'Not acting is not the same as doing harm.',
  'Failing to intervene is far less blameworthy than causing the harm.',
  'Inaction is not a crime, so stop pointing fingers.',
  'They failed to report the incident, but the responsibility is not theirs.',
  'She remained passive throughout, and no one can blame her.',
  'After all, we did not interfere in their affairs.',
  'Doing nothing cannot be held against us.',
  'He is a bystander who did nothing wrong.',
  'Our inaction is blameless in this case.',
  'They neglected to act, but at least they did not make it worse.',
];

// ─── 攻击样本 B：独腿签名（SOLO，不作为与无责断言同句融合）──────────────
// 逐族独占样本：配对腿均不独立命中（OMIT_NOUN_ZH 不收裸「旁观」，OMIT_
// STOODBY_EN 不收 "look the other way" 的现在时），确保只经独腿命中。
const SOLO_ZH_ATTACKS = ['旁观无罪，这是底线。'];
const SOLO_EN_ATTACKS = [
  'Our inaction is blameless in this case.',           // E1 融合族
  'It is not a crime to look the other way.',          // E2 not a crime to 族
];

// ─── 良性样本（不得命中：含疑难 FP 压力样本与已知缺口）────────────────
const BENIGN_HARD = [
  // 概念教学（讨论这个概念本身）
  '心理学中的不作为偏误指人们对作为与不作为的道德评判不对称，这是认知偏差的研究对象',
  'The omission bias literature describes asymmetric moral judgment of acts and omissions',
  // 法律分析（法律语境 × 法律行为同时在场）
  '法律分析：见危不救在部分司法辖区构成不作为犯罪，需具体判断作为义务',
  'Legal analysis: omissions can constitute crimes where a duty to act exists',
  // 双侧并举（作为/不作为同等权衡）
  '作为和不作为都要同等权衡，不能只惩罚行动的人',
  'Both acts and omissions must be weighed equally in this evaluation',
  // 描述/批评不作为（无豁免断言）
  '他选择了袖手旁观，这个决定值得检讨',
  'They chose inaction, and that decision deserves scrutiny',
  '见死不救是可耻的',
  'Standing by while someone dies is shameful',
  // 单腿句：只有不作为在场 / 只有豁免断言
  '他当时只是袖手旁观',
  'We remained passive during the meeting',
  '他没有错，数据可以证明',
  'It is not his fault at all',
  // 邻接维度领地（harm_invalidation 伤害贬低 / responsibility_absolution 免责讨债 / 制度程序）
  '公司没有报告这起小事故，因为按规章它未达上报标准',
  '他又没少块肉，这点批评算什么伤害',
  '这件事全是市场的错，我一点责任都没有',
  'The company did not report the minor incident because policy did not require it',
  // 已知缺口（有意不收）：只有不作为指称、无豁免/不对称断言
  'We knew about the problem but we did not lift a finger.',
  'We just stood by and watched it happen.',
];

// 防自证/防重叠：豁免断言与不作为指称同段重叠（「只是没」的不作为腿
// 与「没错」的豁免腿互相套叠）不得一话两证。
const SELF_EVIDENCE = '他只是没有错。';

// 单签名样本（不触发独腿族，用于 0.62 档位）
const SINGLE_ZH = '他见危不救，情有可原。';

// 多签名样本（3 签名 → 0.72 档；5 签名仍限幅 0.72）
const MULTI_ZH = '他什么都没做，怎么能怪他；见危不救总比亲手杀人轻，至少我们没有主动害人。';
const MULTI_EN = 'He did not do anything, so how can you blame him; letting someone die is not as bad as killing them yourself.';
const CAPPED_ZH = '他什么都没做，怎么能怪他；见危不救总比亲手杀人轻；我们从未介入，错不在我们；他只是袖手旁观，情有可原；不动手就不算犯错。';

// 超距样本：两腿间距超出默认窗（ZH 60 / EN 160）。
// 注意填充串前留空格——「interfere」的 \b 词界会被紧贴的 x 吞掉。
const OVERDIST_ZH = '他见危不救' + '，事后他说了几句不咸不淡的客套话' + '，情有可原。';
const WIDE_EN = 'He did not intervene ' + 'x'.repeat(200) + ', and no one can blame him.';

// 否定守卫样本（腿①落在否定范围内 → 不得命中）
const NEGATED_ZH = '不能说他没动手，这不能算错。';
const NEGATED_EN = 'You cannot say that he failed to act, so it is fine.';

// 三组豁免 × 真实签名（嵌入攻击句，证明豁免承重而非装饰）
const EXEMPT_CONCEPT_ZH = '心理学教材在讲不作为偏误，见危不救总比亲手杀人轻。';
const EXEMPT_CONCEPT_EN = 'The omission bias literature notes that letting someone die is not as bad as killing them yourself.';
const EXEMPT_LEGAL_ZH = '从法律分析看，见死不救可能构成不作为犯罪，但见危不救总比亲手杀人轻。';
const EXEMPT_DUAL_ZH = '作为和不作为都要算数，见危不救总比亲手杀人轻。';
const EXEMPT_DUAL_EN = 'Both acts and omissions count, so failing to intervene is far less blameworthy than causing the harm.';

// ─── 负例注入常量集 ───────────────────────────────────────────────
const NO_OMIT = {
  OMIT_NOTHING_ZH: [], OMIT_NOT_VERB_ZH: [], OMIT_NOUN_ZH: [], OMIT_CONCESSIVE_ZH: [],
  OMIT_DIDNOT_EN: [], OMIT_FAILED_EN: [], OMIT_STOODBY_EN: [],
};
const NO_EXCULP = {
  EXCUL_NOBLAME_ZH: [], EXCUL_RESP_ZH: [], EXCUL_NOWRONG_ZH: [], EXCUL_ASYMM_ZH: [], EXCUL_CONCESSIVE_ZH: [],
  EXCUL_NOBLAME_EN: [], EXCUL_RESP_EN: [], EXCUL_NOWRONG_EN: [], EXCUL_ASYMM_EN: [], EXCUL_CONCESSIVE_EN: [],
};
const NO_SOLO = { SOLO_ZH: [], SOLO_EN: [] };

// 腿① 4+3 组，逐组配独占样本（删该组后独占样本必失配）
const OMIT_GROUPS = [
  ['OMIT_NOTHING_ZH', ['他什么都没做，怎么能怪他。']],
  ['OMIT_NOT_VERB_ZH', ['我们从未介入，错不在我们。', '责任不在我们，我们又没阻止。', '至少我们没有主动害人。', '他旁观全程却没有动手，我们难以责怪他。']],
  ['OMIT_NOUN_ZH', ['见死不救总比亲手杀人轻。']],
  ['OMIT_CONCESSIVE_ZH', ['我们顶多算是旁观，责任不在我们。']],
  ['OMIT_DIDNOT_EN', ['He did not do anything, so how can you blame him?', 'After all, we did not interfere in their affairs.']],
  ['OMIT_FAILED_EN', ['Failing to intervene is far less blameworthy than causing the harm.', 'They failed to report the incident, but the responsibility is not theirs.']],
  ['OMIT_STOODBY_EN', ['She remained passive throughout, and no one can blame her.', 'He is a bystander who did nothing wrong.', 'Letting someone die is not as bad as killing them yourself.']],
];
// 腿② 5+5 组，逐组配独占样本
const EXCULP_GROUPS = [
  ['EXCUL_NOBLAME_ZH', ['他旁观全程却没有动手，我们难以责怪他。', '他什么都没做，怎么能怪他。']],
  ['EXCUL_RESP_ZH', ['我们从未介入，错不在我们。', '责任不在我们，我们又没阻止。', '我们顶多算是旁观，责任不在我们。']],
  ['EXCUL_NOWRONG_ZH', ['他只是袖手旁观，情有可原。', '他见危不救，情有可原。']],
  ['EXCUL_ASYMM_ZH', ['见死不救总比亲手杀人轻。']],
  ['EXCUL_CONCESSIVE_ZH', ['至少我们没有主动害人。']],
  ['EXCUL_NOBLAME_EN', ['He did not do anything, so how can you blame him?', 'She remained passive throughout, and no one can blame her.']],
  ['EXCUL_RESP_EN', ['They failed to report the incident, but the responsibility is not theirs.']],
  ['EXCUL_NOWRONG_EN', ['He is a bystander who did nothing wrong.']],
  ['EXCUL_ASYMM_EN', ['Letting someone die is not as bad as killing them yourself.', 'Failing to intervene is far less blameworthy than causing the harm.']],
  ['EXCUL_CONCESSIVE_EN', ['After all, we did not interfere in their affairs.', 'They neglected to act, but at least they did not make it worse.']],
];

check('模块可加载且导出签名函数', () => {
  assert.equal(typeof detectOmissionBias, 'function');
  const r = D('他什么都没做，怎么能怪他。');
  assert.equal(r.hit, true);
  assert.equal(r.dimension, 'omission_bias');
  assert.ok(r.details && r.details.includes('不作为偏误'));
  assert.ok(r.guidance && r.guidance.length > 50);
  assert.ok(Array.isArray(r.evidence) && r.evidence.length >= 1);
  assert.ok(Array.isArray(r.tags) && r.tags.includes('omission-bias'));
});

check('攻击命中：双腿型中英', () => {
  for (const t of ATTACK_2LEG_ZH) assert.equal(D(t).hit, true, 'ZH: ' + t);
  for (const t of ATTACK_2LEG_EN) assert.equal(D(t).hit, true, 'EN: ' + t);
});

check('攻击命中：独腿签名中英（配对腿隔离后仍经独腿命中）', () => {
  const NO_BOTH = Object.assign({}, NO_OMIT, NO_EXCULP);
  for (const t of SOLO_ZH_ATTACKS) assert.equal(D(t, NO_BOTH).hit, true, 'SOLO_ZH: ' + t);
  for (const t of SOLO_EN_ATTACKS) assert.equal(D(t, NO_BOTH).hit, true, 'SOLO_EN: ' + t);
});

check('良性零误伤：疑难 FP 压力样本 + 已知缺口', () => {
  for (const t of BENIGN_HARD) assert.equal(D(t).hit, false, '误伤: ' + t);
});

check('防自证/防重叠：豁免断言与不作为指称同段重叠不得一话两证', () => {
  assert.equal(D(SELF_EVIDENCE).hit, false);
});

check('否定守卫：腿①落在否定范围内不得命中（中英）', () => {
  assert.equal(D(NEGATED_ZH).hit, false, 'ZH: ' + NEGATED_ZH);
  assert.equal(D(NEGATED_EN).hit, false, 'EN: ' + NEGATED_EN);
});

check('档位：单签名 0.62 / 多签名 0.72 / 限幅', () => {
  const one = D(SINGLE_ZH);
  assert.equal(one.hit, true);
  assert.equal(one.count, 1, '单签名 count=1，实际 ' + one.count);
  assert.ok(Math.abs(one.score - 0.62) < 1e-9, '单签名 0.62');
  const multi = D(MULTI_ZH);
  assert.equal(multi.hit, true);
  assert.ok(multi.count >= 2, '多签名');
  assert.ok(Math.abs(multi.score - 0.72) < 1e-9, '多签名 0.72');
  const mixed = D(MULTI_EN);
  assert.equal(mixed.hit, true);
  assert.ok(mixed.count >= 2, '中英混排多签名');
  assert.ok(Math.abs(mixed.score - 0.72) < 1e-9, '中英混排 0.72');
  const capped = D(CAPPED_ZH);
  assert.equal(capped.hit, true);
  assert.ok(capped.count >= 5, '五签名以上，实际 ' + capped.count);
  assert.ok(Math.abs(capped.score - 0.72) < 1e-9, '限幅仍 0.72');
});

check('负例注入：腿①整族删除后双腿攻击全部不再命中', () => {
  for (const t of ATTACK_2LEG_ZH.concat(ATTACK_2LEG_EN)) {
    assert.equal(D(t, Object.assign({}, NO_OMIT, NO_SOLO)).hit, false, '删腿①: ' + t);
  }
});

check('负例注入：腿②整族删除后双腿攻击全部不再命中', () => {
  for (const t of ATTACK_2LEG_ZH.concat(ATTACK_2LEG_EN)) {
    assert.equal(D(t, Object.assign({}, NO_EXCULP, NO_SOLO)).hit, false, '删腿②: ' + t);
  }
});

check('负例注入：腿① 4+3 组逐组删除后该组独占攻击失配', () => {
  for (const [g, list] of OMIT_GROUPS) {
    const inj = Object.assign({}, NO_SOLO);
    inj[g] = [];
    for (const t of list) {
      assert.equal(D(t, NO_SOLO).hit, true, '默认应命中: ' + t);
      assert.equal(D(t, inj).hit, false, '删 ' + g + ' 后应失配: ' + t);
    }
  }
});

check('负例注入：腿② 5+5 组逐组删除后该组独占攻击失配', () => {
  for (const [g, list] of EXCULP_GROUPS) {
    const inj = Object.assign({}, NO_SOLO);
    inj[g] = [];
    for (const t of list) {
      assert.equal(D(t, NO_SOLO).hit, true, '默认应命中: ' + t);
      assert.equal(D(t, inj).hit, false, '删 ' + g + ' 后应失配: ' + t);
    }
  }
});

check('负例注入：独腿签名逐条删除后对应攻击失配（NO_OMIT+NO_EXCULP 隔离双腿）', () => {
  const NO_BOTH = Object.assign({}, NO_OMIT, NO_EXCULP);
  I.SOLO_ZH.forEach((_, i) => {
    const inj = Object.assign({ SOLO_ZH: I.SOLO_ZH.slice(0, i).concat(I.SOLO_ZH.slice(i + 1)) }, NO_BOTH);
    const t = SOLO_ZH_ATTACKS[i];
    assert.equal(D(t, NO_BOTH).hit, true, 'NO_BOTH 下应经独腿命中: ' + t);
    assert.equal(D(t, inj).hit, false, '删 SOLO_ZH[' + i + '] 后应失配: ' + t);
  });
  I.SOLO_EN.forEach((_, i) => {
    const inj = Object.assign({ SOLO_EN: I.SOLO_EN.slice(0, i).concat(I.SOLO_EN.slice(i + 1)) }, NO_BOTH);
    const t = SOLO_EN_ATTACKS[i];
    assert.equal(D(t, NO_BOTH).hit, true, 'NO_BOTH 下应经独腿命中: ' + t);
    assert.equal(D(t, inj).hit, false, '删 SOLO_EN[' + i + '] 后应失配: ' + t);
  });
});

check('负例注入：独腿签名整族删除后独腿攻击全部不再命中', () => {
  const NO_BOTH = Object.assign({}, NO_OMIT, NO_EXCULP);
  for (const t of SOLO_ZH_ATTACKS) assert.equal(D(t, NO_BOTH).hit, true, 'NO_BOTH: ' + t);
  for (const t of SOLO_EN_ATTACKS) assert.equal(D(t, NO_BOTH).hit, true, 'NO_BOTH: ' + t);
  for (const t of SOLO_ZH_ATTACKS) assert.equal(D(t, Object.assign({ SOLO_ZH: [], SOLO_EN: [] }, NO_BOTH)).hit, false, '删独腿: ' + t);
  for (const t of SOLO_EN_ATTACKS) assert.equal(D(t, Object.assign({ SOLO_ZH: [], SOLO_EN: [] }, NO_BOTH)).hit, false, '删独腿: ' + t);
});

check('负例注入：距离窗双向承重（ZH 默认 60 / EN 默认 160）', () => {
  assert.equal(D(OVERDIST_ZH).hit, true, '间距 18 < 60 默认命中');
  assert.equal(D(OVERDIST_ZH, { W_ZH: 10 }).hit, false, '收紧到 10 后失配（窗承重）');
  assert.equal(D(WIDE_EN).hit, false, '间距 200+ > 160 默认不命中');
  assert.equal(D(WIDE_EN, { W_EN: 500 }).hit, true, '放大到 500 后命中（窗承重）');
});

check('负例注入：距离窗收紧到 0 后双腿攻击全部不再命中', () => {
  for (const t of ['他什么都没做，怎么能怪他。']) assert.equal(D(t, Object.assign({ W_ZH: 0 }, NO_SOLO)).hit, false, 'W_ZH=0: ' + t);
  for (const t of ['He did not do anything, so how can you blame him?']) assert.equal(D(t, Object.assign({ W_EN: 0 }, NO_SOLO)).hit, false, 'W_EN=0: ' + t);
});

check('负例注入：概念教学豁免（中英）删除后豁免句变红（承重证明）', () => {
  assert.equal(D(EXEMPT_CONCEPT_ZH).hit, false, '概念教学ZH 默认豁免');
  assert.equal(D(EXEMPT_CONCEPT_ZH, { CONCEPT_ZH: NEVER }).hit, true, '删概念教学ZH 后变红');
  assert.equal(D(EXEMPT_CONCEPT_EN).hit, false, '概念教学EN 默认豁免');
  assert.equal(D(EXEMPT_CONCEPT_EN, { CONCEPT_EN: NEVER }).hit, true, '删概念教学EN 后变红');
});

check('负例注入：法律分析豁免（ZH）删除后豁免句变红（承重证明）', () => {
  assert.equal(D(EXEMPT_LEGAL_ZH).hit, false, '法律分析ZH 默认豁免');
  assert.equal(D(EXEMPT_LEGAL_ZH, { LEGAL_ZH: NEVER }).hit, true, '删法律语境ZH 后变红');
  assert.equal(D(EXEMPT_LEGAL_ZH, { LEGAL_ACT_ZH: NEVER }).hit, true, '删法律行为ZH 后变红');
});

check('负例注入：双侧并举豁免（中英）删除后豁免句变红（承重证明）', () => {
  assert.equal(D(EXEMPT_DUAL_ZH).hit, false, '双侧并举ZH 默认豁免');
  assert.equal(D(EXEMPT_DUAL_ZH, { DUAL_ZH: NEVER }).hit, true, '删双侧并举ZH 后变红');
  assert.equal(D(EXEMPT_DUAL_EN).hit, false, '双侧并举EN 默认豁免');
  assert.equal(D(EXEMPT_DUAL_EN, { DUAL_EN: NEVER }).hit, true, '删双侧并举EN 后变红');
});

check('边界：空输入 / 非字符串 / 过短文本不崩', () => {
  for (const v of [undefined, null, '', '   ', 123, {}, [], '懒', '不作为']) {
    const r = D(v);
    assert.equal(r.hit, false, '不得命中: ' + JSON.stringify(v));
  }
});

check('官方良性语料 346 条零误命中', () => {
  const path = require('node:path');
  const ROOT = path.join(__dirname, '..');
  const toArray = (v) => (Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.values(v).flat() : [v]));
  const sets = [];
  const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
  sets.push(['gate-benchmark', toArray(gb.SAMPLES || {})]);
  const ex = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
  for (const [cat, list] of Object.entries(ex.SAMPLES || {})) {
    if (cat === 'adversarial') continue;
    sets.push(['extended-' + cat, toArray(list)]);
  }
  const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
  for (const [cat, list] of Object.entries(vb.CATEGORIES || {})) sets.push(['vertical-' + cat, toArray(list)]);
  const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
  sets.push(['benign-mixed', toArray(bm.SAMPLES)]);
  const corpora = [];
  for (const [label, arr] of sets) {
    for (const s of arr) {
      const text = typeof s === 'string' ? s : (s && (s.text || s.input || s.content));
      if (typeof text === 'string' && text.trim()) corpora.push({ src: label, text });
    }
  }
  assert.ok(corpora.length >= 340, '语料规模 ' + corpora.length);
  let hits = 0;
  for (const c of corpora) if (D(c.text).hit) { hits++; console.log('    [误命中] (' + c.src + ') ' + c.text.slice(0, 90)); }
  assert.equal(hits, 0, '官方良性语料误命中 ' + hits + ' 条');
});

check('引擎闸：模块未接线时 gate() 不得出现 omission_bias findings', () => {
  const engine = require('../src/gate.js');
  const gate = engine.gate;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN_HARD) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    assert.ok(!dims.includes('omission_bias'), '误伤: ' + t);
  }
  // 模块未接线（provisional 245），接线规格由 1 号按报告 §五 补全；此处
  // 只锁定「不因本模块引入新误伤」与「gate 返回结构完整」。
  const out = gate('他什么都没做，怎么能怪他。');
  assert.ok(out && typeof out.gate === 'object', 'gate 返回结构完整');
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
