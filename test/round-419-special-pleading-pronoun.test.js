/**
 * test/round-419-special-pleading-pronoun.test.js
 *
 * [r419] 第 150 维 special_pleading（例外辩护/双重标准）新增「代词回指形」
 * 措辞家族轮测。
 *
 * 背景：r419 同池探针 coordination/agent4/probes/r419-probe-pool.js
 * （HEAD 6.8.208，六家族同池）实测：F1 special_pleading EN 代词回指形
 * 攻击穿透 9/10（全池最高比率；同池 F2 straw_man 存在必要性否定 10/12、
 * F6 post_hoc 无「就」突变 9/10、F3 appeal_to_majority 百分比背书 4/10、
 * F4 gamblers 热手跟投 7/10、F5 monocause 口语归责 7/10）、模块层直查
 * 真零命中 0/10、良性本族误伤 0/12（2 个非 pass 为存量 no_fallback /
 * false_balance 代拦，与本族无关）。落地后攻击穿透 0/15、模块层承重
 * 15/15、良性本族误伤零新增。真升级②：既有维度的全新措辞家族，维度
 * 计数不变、src/index.js 零改动、VERSION 不 bump（同 r406-r418 扩族
 * 先例）。
 *
 * 新路由判据（双腿共现，缺一不判，命中 score 0.5）：
 *   腿① 他人同一行为被贴标签（ZH 复用存量 OTHERS_LABEL_ZH；EN 专用
 *      OTHERS_LABEL_PRONE_EN——主语表扩 their/theirs/people who/those
 *      who，存量 OTHERS_LABEL_EN 无此四形，且行为词不再设必填）。
 *   腿② 代词回指的自我标签，EN 三支：a when I do it / when I do the
 *      same（+ is called X）；b my doing it / my doing the same（+ is
 *      called X）；c mine are called X；ZH：我这样（就）叫/称为/称作…
 *      （回指标记这样/这么干/这么做/也如此/照这样 必填，防「我叫什么」
 *      类疑问与普通自称句误入）。
 *   判据：**两腿标签文本不同**才判（同名同标是标准一致，同路由五铁
 *      律），对称要求在场（SYMMETRY_ZH/EN）同样豁免。
 *   穿透根因：存量路由五的 EN 腿②要求行为词回填（%W%），口语回指常用
 *       代词——「when I do it」「my doing it」「mine are」不重复行为
 *       词，%W% 回填失败整族射程外。
 */
'use strict';

const path = require('path');
const fs = require('fs');
const gate = require(path.resolve(__dirname, '../src/gate.js'));
const spMod = require(path.resolve(__dirname, '../src/special-pleading.js'));
const { checkSpecialPleading } = spMod;

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
const blank = () => /(?!x)x/; // 永不匹配，用于 inject 摘除

function spDim(text, inject) { return checkSpecialPleading(text, inject); }
function gateAction(text) {
  const r = gate.checkOutput(text);
  return r && r.gate && r.gate.action ? r.gate.action : (r && r.action ? r.action : 'ERR');
}
function gateDims(text) {
  const r = gate.checkOutput(text);
  return (r && r.findings || []).map((f) => f.dimension);
}

// ─── A 组：攻击承重（模块层 detail 含代词回指形标记＋ gate 层非 pass
//    且 special_pleading 独立承重）────────────────────────────
// 支标注：en-a when I do it｜en-b my doing it｜en-c mine are｜zh 我这样叫
const A_ATTACKS = [
  ['en-a', 'When others arrive late it is called indiscipline; when I do it, it is called flexibility.'],
  ['en-a', 'When they cut corners it is called sloppy; when I do the same, it is called efficiency.'],
  ['en-a', 'Others\' overtime is called dedication; when I do it, it is called exploitation.'],
  ['en-a', 'When they refuse it is called irresponsible; when I do it, it is called having principles.'],
  ['en-a', 'When they speak up it is called insubordination; when I do it, it is called leadership.'],
  ['en-a', 'When they negotiate it is called disloyalty; when I do it, it is called advocating for myself.'],
  ['en-a', 'When others complain it is called whining; when I do it, it is called raising concerns.'],
  ['en-b', 'Everyone else quitting is called impulsive; my doing it is called self-actualization.'],
  ['en-b', 'People who take leave are called unreliable; my doing it is called work-life balance.'],
  ['en-c', 'Their mistakes are called incompetence; mine are called learning curves.'],
  ['zh', '别人迟到叫纪律涣散，我这样就叫时间灵活'],
  ['zh', '人家加班叫本分，我这样叫奉献'],
  ['zh', '他们跳槽叫不忠，我这样叫追求发展'],
  ['zh', '同事请假叫自私，我这样叫必要的休息'],
  ['zh', '别人直言叫莽撞，我这样叫坦率'],
];
test('A1 攻击承重——模块层 detail 含「代词回指形」标记', () => {
  for (const [branch, t] of A_ATTACKS) {
    const r = spDim(t);
    assert(r.hit === true, `[${branch}] 模块层应命中: ${t.slice(0, 44)}`);
    assert(r.detail.indexOf('pronoun-anaphora') !== -1, `[${branch}] detail 应含 pronoun-anaphora: ${r.detail}`);
    assert(r.detail.indexOf('different-label') !== -1, `[${branch}] detail 应含 different-label: ${r.detail}`);
    assert(r.score >= 0.5, `[${branch}] score 应 ≥0.5: ${r.score}`);
    assert(r.count > 0, `[${branch}] count 应 >0`);
  }
});
test('A2 攻击承重——gate 层非 pass 且 special_pleading 独立挂 findings', () => {
  for (const [branch, t] of A_ATTACKS) {
    assert(gateAction(t) !== 'pass', `[${branch}] gate 应非 pass: ${t.slice(0, 44)}`);
    assert(gateDims(t).indexOf('special_pleading') !== -1, `[${branch}] findings 应挂 special_pleading: ${t.slice(0, 44)}`);
  }
});

// ─── B 组：良性零误伤（模块层零命中；gate 层 special_pleading 零命中）──
// 三类：同名同标的标准一致 / 对称要求在场 / 正当程序或自述
const B_BENIGN = [
  'When others cut corners it is called sloppy; when I do it, it is called sloppy too.',
  'When others arrive late it is called indiscipline; that is the standard for all of us.',
  'When others take leave it is called unreliable; when I take leave it is also called unreliable.',
  'When others arrive late it is called indiscipline; when I do it, it is called flexibility — but we should apply the same standard to everyone.',
  '别人迟到叫纪律涣散，我这样也叫纪律涣散',
  '制度应当一视同仁，不能因人而异',
  '同一个行为就该用同一个名字，不能搞双标',
  '我拒绝是因为原则，别人拒绝也一样看待',
  '我这样确实有问题，该罚就罚',
  'The policy applies equally to everyone on the team.',
  '这两种叫法其实是一回事，换个名字不改变性质',
  '别人加班叫奉献，我加班也叫奉献，标准一致',
  '别人迟到叫纪律涣散，我这样叫时间灵活，但要一视同仁',
];
test('B1 良性——模块层零命中', () => {
  for (const t of B_BENIGN) {
    const r = spDim(t);
    assert(r.hit === false, `良性不应命中: ${t.slice(0, 44)} (detail=${r.detail})`);
  }
});
test('B2 良性——gate 层 special_pleading 零命中（存量代拦不挂本维度）', () => {
  for (const t of B_BENIGN) {
    assert(gateDims(t).indexOf('special_pleading') === -1, `良性不应挂 special_pleading: ${t.slice(0, 44)}`);
  }
});

// ─── C 组：删条注入（逐条删掉本轮新模式，守卫必须翻转）────────────
test('C1 注入 OTHERS_LABEL_PRONE_EN → EN 攻击样本 hit 翻 miss', () => {
  const inject = { OTHERS_LABEL_PRONE_EN: blank() };
  for (const [branch, t] of A_ATTACKS) {
    if (branch.indexOf('zh') === 0) continue; // ZH 样本归 C3
    assert(spDim(t, inject).hit === false, `删 OTHERS_LABEL_PRONE_EN 后应 miss: ${t.slice(0, 40)}`);
  }
});
test('C2 注入 SELF_LABEL_PRONE_EN → EN 攻击样本 hit 翻 miss', () => {
  const inject = { SELF_LABEL_PRONE_EN: blank() };
  for (const [branch, t] of A_ATTACKS) {
    if (branch.indexOf('zh') === 0) continue;
    assert(spDim(t, inject).hit === false, `删 SELF_LABEL_PRONE_EN 后应 miss: ${t.slice(0, 40)}`);
  }
});
test('C3 注入 SELF_LABEL_PRONE_ZH → ZH 攻击样本 hit 翻 miss', () => {
  const inject = { SELF_LABEL_PRONE_ZH: blank() };
  for (const [branch, t] of A_ATTACKS) {
    if (branch.indexOf('zh') !== 0) continue;
    assert(spDim(t, inject).hit === false, `删 SELF_LABEL_PRONE_ZH 后应 miss: ${t.slice(0, 40)}`);
  }
});
test('C4 注入 SYMMETRY_EN → 对称要求豁免句从 exempt 翻 hit', () => {
  const t = 'When others arrive late it is called indiscipline; when I do it, it is called flexibility — but we should apply the same standard to everyone.';
  assert(spDim(t).hit === false, '未删对称豁免前应不判');
  assert(spDim(t, { SYMMETRY_EN: blank() }).hit === true, '删 SYMMETRY_EN 后应命中（证明豁免腿承重）');
});
test('C5 注入 SYMMETRY_ZH → 对称要求豁免句从 exempt 翻 hit', () => {
  const t = '别人迟到叫纪律涣散，我这样叫时间灵活，但要一视同仁';
  assert(spDim(t).hit === false, '未删对称豁免前应不判');
  assert(spDim(t, { SYMMETRY_ZH: blank() }).hit === true, '删 SYMMETRY_ZH 后应命中（证明豁免腿承重）');
});

// ─── D 组：存量路由不回归（路由①规则他指×自我例外 / ②他人受管×自我豁免 /
//    ③特殊身份×例外许可 / ④同行为不同定性 / ⑤同行为不同命名）──────
test('D1 存量路由①规则他指×自我例外仍命中', () => {
  const stock = [
    '规则是给普通人定的，我不一样',
    '这个规定对我不适用，我的层次不一样',
    'The rules apply to everyone else, but I am different.',
  ];
  for (const t of stock) assert(spDim(t).hit === true, '存量路由①未命中: ' + t.slice(0, 30));
});
test('D2 存量路由②③他人受管×自我豁免 / 特殊身份×例外许可仍命中', () => {
  const stock = [
    '别人迟到要扣钱，我迟到是有原因的',
    '我情况特殊，所以可以例外',
  ];
  for (const t of stock) assert(spDim(t).hit === true, '存量路由②③未命中: ' + t.slice(0, 30));
});
test('D3 存量路由④⑤同行为不同定性/命名仍命中（代词族不影响行为词回填路由）', () => {
  const stock = [
    '别人熬夜伤身，我熬夜是热爱工作',
    '别人迟到叫纪律涣散，我迟到叫时间灵活',
    'When others arrive late it is called indiscipline; when I arrive late it is called flexibility.',
    'Everyone else who stays up late is being irresponsible; when I stay up late it is dedication.',
  ];
  for (const t of stock) assert(spDim(t).hit === true, '存量路由④⑤未命中: ' + t.slice(0, 30));
});

// ─── E 组：边界锁 ──────────────────────────────────────────────
test('E1 单腿——只有他人标签无代词回指自我腿，不判', () => {
  const singles = [
    'When others arrive late it is called indiscipline, everyone agrees on that.',
    '别人迟到叫纪律涣散，这是全组的共识',
    'Their mistakes are called incompetence in this review system.',
  ];
  for (const t of singles) assert(spDim(t).hit === false, '单腿（腿①）不应判: ' + t.slice(0, 30));
});
test('E2 单腿——只有代词回指自我腿无他人标签，不判', () => {
  const singles = [
    'When I do it, it is called flexibility.',
    '我这样叫时间灵活',
    'My doing it is called self-actualization.',
  ];
  for (const t of singles) assert(spDim(t).hit === false, '单腿（腿②）不应判: ' + t.slice(0, 30));
});
test('E3 同名同标豁免（标准一致不判双标）', () => {
  assert(spDim('When others cut corners it is called sloppy; when I do it, it is called sloppy too.').hit === false, 'EN 同名同标应豁免');
  assert(spDim('别人迟到叫纪律涣散，我这样也叫纪律涣散').hit === false, 'ZH 同名同标应豁免');
});
test('E4 对称要求在场豁免', () => {
  assert(spDim('When others arrive late it is called indiscipline; when I do it, it is called flexibility — but we should apply the same standard to everyone.').hit === false, 'EN 对称要求应豁免');
  assert(spDim('别人迟到叫纪律涣散，我这样叫时间灵活，但要一视同仁').hit === false, 'ZH 对称要求应豁免');
});

// ─── F 组：接线锁 ──────────────────────────────────────────────
test('F1 运行时接线——dimensions.special_pleading 键在、count>0', () => {
  const d = gate.discriminate('Their mistakes are called incompetence; mine are called learning curves.');
  assert(d.dimensions && d.dimensions.special_pleading, 'dimensions 缺 special_pleading 键');
  assert(d.dimensions.special_pleading.count > 0, 'special_pleading count 应为正');
});
test('F2 静态登记不变（src/index.js 零改动锁）', () => {
  const src = fs.readFileSync(path.resolve(__dirname, '../src/index.js'), 'utf8');
  assert(src.indexOf('special_pleading: spl,') !== -1, '缺 dimMap/dimensions 登记');
  assert(src.split('special_pleading: spl,').length - 1 === 2, 'dimMap/dimensions 两处登记应各出现一次');
  assert(src.indexOf("'special_pleading',") !== -1, '缺 REWRITE/VERIFY 类登记');
  assert(src.indexOf("'special_pleading': \"") !== -1, '缺 DIM_GUIDANCE 条目');
});
test('F3 模块导出含新常量（负例注入面）', () => {
  const I = spMod.__internals();
  for (const k of ['OTHERS_LABEL_PRONE_EN', 'SELF_LABEL_PRONE_EN', 'SELF_LABEL_PRONE_ZH']) {
    assert(I[k] && I[k] instanceof RegExp, `__internals 缺 ${k}`);
  }
  // 存量标签常量不受影响
  for (const k of ['OTHERS_LABEL_ZH', 'SELF_LABEL_ZH', 'OTHERS_LABEL_EN', 'SELF_LABEL_EN', 'SYMMETRY_ZH', 'SYMMETRY_EN']) {
    assert(I[k] && I[k] instanceof RegExp, `__internals 存量常量 ${k} 缺失`);
  }
});

// ─── 汇总（run-all 可解析格式）────────────────────────────────
const pass = results.filter((r) => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  console.log((r.ok ? '  ✅ ' : '  ❌ ') + r.name + (r.ok ? '' : ' — ' + r.err));
}
console.log(pass + ' passed / ' + fail + ' failed');
process.exitCode = fail === 0 ? 0 : 1;
