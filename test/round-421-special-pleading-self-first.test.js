/**
 * test/round-421-special-pleading-self-first.test.js
 *
 * [r421] 第 150 维 special_pleading（例外辩护/双重标准）新增「自他语序/
 * 人称形 × possessive/copula 标签形」措辞家族轮测。
 *
 * 背景：r421 同池探针 coordination/agent4/probes/r421-probe-pool.js
 * （HEAD 6.8.209，六家族同池）实测：F5 special_pleading EN 回指变体
 * 攻击穿透 11/12（全池最高比率；同池 F1 straw_man 存在必要性否定
 * 10/12、F2 post_hoc 无「就」突变 11/14、F3 appeal_to_tradition 4/12、
 * F4 base_rate_neglect 3/12、F6 gamblers 热手跟投 8/13）、模块层直查
 * 真零命中 0/12、良性本族误伤 0/12（2 个非 pass 为存量 no_fallback /
 * contradiction 代拦，与本族无关）。落地后攻击穿透 0/12、模块层承重
 * 12/12、良性本族误伤零新增。真升级②：既有维度的全新措辞家族，维度
 * 计数不变、src/index.js 零改动、VERSION 不 bump（同 r406-r420 扩族
 * 先例）。
 *
 * 新路由判据（双腿共现，缺一不判，命中 score 0.5）：
 *   腿① 自方标签腿：EN 三形——copula（my <行为名词> (is|are) [called] X）、
 *      mine 回指（mine get/are/is/counts [as|called] X）、主动/动词短语
 *      （when I do it, they call it X / when I <短语> it is called X）；
 *      ZH 三支——回指标记（我这样叫/称为/说成…）、人称处所（(到)我(们)
 *      (这儿|那里|那边)（就）叫/称为/算是/是…）、指示代词（我(这|那)
 *      （就）是/就是/叫/称为/说成…）。
 *   腿② 他方标签腿：EN——copula（their/theirs/others <行为名词> (is|are)
 *      […] X）、theirs 回指（theirs get/are/is/counts […] X）、主动
 *      （when others do it, they call it X / when others do it is called X）；
 *      ZH——远指（他们(那样|那就|那)（就）叫/称为/说成…）、裸动词
 *      （他们/别人（就）叫/称为/说成…，行为词不重复）、指示系词
 *      （他们(这|那)（就）是/那就是/也就是/便是/叫…）。
 *   判据：**两腿标签文本不同**才判（同名同标是标准一致，同路由五六
 *      铁律），对称要求在场（SYMMETRY_ZH/EN）同样豁免。EN copula 形
 *      两腿都捕获到行为名词时须同一名词（防不同行为伪双标）；mine/
 *      theirs 回指腿无名词，靠回指承担同一性。
 *   穿透根因：存量路由六只管「他人标签 × 我这样叫」的他-自语序与
 *       when-I-do-it / my-doing-it / mine-are 三支回指形；口语双标还有
 *       语序颠倒、copula/get/counts-as 标签动词、主动态 they call it、
 *       ZH 人称形（我这叫/到我这儿就叫/我这是）且腿①不再重复行为词。
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

// ─── A 组：攻击承重（模块层 detail 含自他语序标记＋ gate 层非 pass
//    且 special_pleading 独立承重）────────────────────────────
// 支标注：en-copula｜en-mine｜en-active｜zh
const A_ATTACKS = [
  ['en-copula', 'My mistakes are learning curves; their mistakes are incompetence.'],
  ['en-copula', 'My lateness is called flexibility; their lateness is called indiscipline.'],
  ['en-mine', 'Mine get called thoroughness; theirs get called meddling.'],
  ['en-mine', 'Mine counts as prudence; theirs counts as paranoia.'],
  ['en-mine', 'Their errors are negligence; mine are just honest mistakes.'],
  ['en-active', 'When I do it, they call it vision; when others do it, they call it recklessness.'],
  ['en-active', 'When I leave early it is called efficiency; when they do it is called slacking.'],
  ['zh', '我这样叫未雨绸缪，他们那样叫小题大做'],
  ['zh', '到我这儿就叫灵活处理，别人就叫随意变更'],
  ['zh', '同样迟到，我这叫时间灵活，他们那叫纪律涣散'],
  ['zh', '我这是特殊情况，他们那就是明知故犯'],
  ['zh', '到我这儿就叫原则性强，他们那样叫死脑筋'],
];
test('A1 攻击承重——模块层 detail 含「自他语序」标记', () => {
  for (const [branch, t] of A_ATTACKS) {
    const r = spDim(t);
    assert(r.hit === true, `[${branch}] 模块层应命中: ${t.slice(0, 44)}`);
    assert(r.detail.indexOf('self-first-order') !== -1, `[${branch}] detail 应含 self-first-order: ${r.detail}`);
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
// 五类：同名同标的标准一致 / 对称要求在场 / 元话语引述 / 单腿 /
//       不同行为名词（非双标比较）/ 实体比较非行为标签
const B_BENIGN = [
  'Mine get called sloppy; theirs get called sloppy too.',
  '我这叫疏忽，他们那叫疏忽',
  '我这样叫时间灵活，他们那样也叫时间灵活',
  'My delay is also called tardiness, same as everyone else.',
  '制度应当一视同仁，不该因人而异',
  '同一个行为就该用同一个名字，不能搞双标',
  '这是典型的双重标准：我这叫灵活，他们那叫散漫',
  '到我这儿按同一套标准，该通报就通报',
  '我承认我迟到了，按制度该扣就扣',
  '这两种叫法其实是一回事，换个名字不改变性质',
  '不管是谁的错，都按规章处理',
  '别人加班叫奉献，我加班也叫奉献，标准一致',
  'When others cut corners it is called sloppy; when I cut corners it is also called sloppy.',
  'Their team is weak; mine is strong.',
  'My flight was delayed; their flight was on time.',
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
test('C1 注入 SELF_COPULA_EN → en-copula 攻击 hit 翻 miss', () => {
  const inject = { SELF_COPULA_EN: blank() };
  for (const [branch, t] of A_ATTACKS) {
    if (branch !== 'en-copula') continue;
    assert(spDim(t, inject).hit === false, `删 SELF_COPULA_EN 后应 miss: ${t.slice(0, 40)}`);
  }
});
test('C2 注入 OTHERS_COPULA_EN → copula 他方腿承重的攻击 hit 翻 miss', () => {
  const inject = { OTHERS_COPULA_EN: blank() };
  for (const [branch, t] of A_ATTACKS) {
    if (branch !== 'en-copula' && !(branch === 'en-mine' && t.indexOf('Their errors') === 0)) continue;
    assert(spDim(t, inject).hit === false, `删 OTHERS_COPULA_EN 后应 miss: ${t.slice(0, 40)}`);
  }
});
test('C3 注入 SELF_MINE_EN → en-mine 攻击 hit 翻 miss', () => {
  const inject = { SELF_MINE_EN: blank() };
  for (const [branch, t] of A_ATTACKS) {
    if (branch !== 'en-mine') continue;
    assert(spDim(t, inject).hit === false, `删 SELF_MINE_EN 后应 miss: ${t.slice(0, 40)}`);
  }
});
test('C4 注入 OTHERS_THEIRS_EN → theirs 回指腿承重的攻击 hit 翻 miss', () => {
  const inject = { OTHERS_THEIRS_EN: blank() };
  for (const [branch, t] of A_ATTACKS) {
    if (branch !== 'en-mine' || t.indexOf('Their errors') === 0) continue;
    assert(spDim(t, inject).hit === false, `删 OTHERS_THEIRS_EN 后应 miss: ${t.slice(0, 40)}`);
  }
});
test('C5 注入 SELF_ACTIVE_EN → en-active 攻击 hit 翻 miss', () => {
  const inject = { SELF_ACTIVE_EN: blank() };
  for (const [branch, t] of A_ATTACKS) {
    if (branch !== 'en-active') continue;
    assert(spDim(t, inject).hit === false, `删 SELF_ACTIVE_EN 后应 miss: ${t.slice(0, 40)}`);
  }
});
test('C6 注入 OTHERS_ACTIVE_EN → en-active 攻击 hit 翻 miss', () => {
  const inject = { OTHERS_ACTIVE_EN: blank() };
  for (const [branch, t] of A_ATTACKS) {
    if (branch !== 'en-active') continue;
    assert(spDim(t, inject).hit === false, `删 OTHERS_ACTIVE_EN 后应 miss: ${t.slice(0, 40)}`);
  }
});
test('C7 注入 SELF_FIRST_ZH → ZH 攻击 hit 翻 miss', () => {
  const inject = { SELF_FIRST_ZH: blank() };
  for (const [branch, t] of A_ATTACKS) {
    if (branch !== 'zh') continue;
    assert(spDim(t, inject).hit === false, `删 SELF_FIRST_ZH 后应 miss: ${t.slice(0, 40)}`);
  }
});
test('C8 注入 OTHERS_FIRST_ZH → ZH 攻击 hit 翻 miss', () => {
  const inject = { OTHERS_FIRST_ZH: blank() };
  for (const [branch, t] of A_ATTACKS) {
    if (branch !== 'zh') continue;
    assert(spDim(t, inject).hit === false, `删 OTHERS_FIRST_ZH 后应 miss: ${t.slice(0, 40)}`);
  }
});
test('C9 注入 SYMMETRY_EN/ZH → 对称要求豁免句从 exempt 翻 hit', () => {
  const tEn = 'My mistakes are learning curves; their mistakes are incompetence — but we should hold everyone to the same standard.';
  assert(spDim(tEn).hit === false, '未删对称豁免前应不判（EN）');
  assert(spDim(tEn, { SYMMETRY_EN: blank() }).hit === true, '删 SYMMETRY_EN 后应命中（证明豁免腿承重）');
  const tZh = '我这样叫未雨绸缪，他们那样叫小题大做，但要一视同仁';
  assert(spDim(tZh).hit === false, '未删对称豁免前应不判（ZH）');
  assert(spDim(tZh, { SYMMETRY_ZH: blank() }).hit === true, '删 SYMMETRY_ZH 后应命中（证明豁免腿承重）');
});

// ─── D 组：存量路由不回归（路由①规则他指×自我例外 / ②他人受管×自我豁免 /
//    ③特殊身份×例外许可 / ④同行为不同定性 / ⑤同行为不同命名 /
//    ⑥代词回指形）─────────────────────────────────────────
test('D1 存量路由①②③仍命中', () => {
  const stock = [
    '规则是给普通人定的，我不一样',
    '这个规定对我不适用，我的层次不一样',
    'The rules apply to everyone else, but I am different.',
    '别人迟到要扣钱，我迟到是有原因的',
    '我情况特殊，所以可以例外',
  ];
  for (const t of stock) assert(spDim(t).hit === true, '存量路由①②③未命中: ' + t.slice(0, 30));
});
test('D2 存量路由④⑤同行为不同定性/命名仍命中（行为词回填路由不受影响）', () => {
  const stock = [
    '别人熬夜伤身，我熬夜是热爱工作',
    '同事加班叫本分，我加班叫奉献',
    '别人迟到叫纪律涣散，我迟到叫时间灵活',
    'When others arrive late it is called indiscipline; when I arrive late it is called flexibility.',
    'Everyone else who stays up late is being irresponsible; when I stay up late it is dedication.',
  ];
  for (const t of stock) assert(spDim(t).hit === true, '存量路由④⑤未命中: ' + t.slice(0, 30));
});
test('D3 存量路由⑥代词回指形仍命中（r419 家族不回归）', () => {
  const stock = [
    '别人迟到叫纪律涣散，我这样就叫时间灵活',
    'When others arrive late it is called indiscipline; when I do it, it is called flexibility.',
    'Their mistakes are called incompetence; mine are called learning curves.',
    'Everyone else quitting is called impulsive; my doing it is called self-actualization.',
    'People who take leave are called unreliable; mine are called work-life balance.',
  ];
  for (const t of stock) {
    const r = spDim(t);
    assert(r.hit === true, '存量路由⑥未命中: ' + t.slice(0, 30));
    assert(r.detail.indexOf('pronoun-anaphora') !== -1, '存量路由⑥ detail 仍应走 pronoun-anaphora: ' + r.detail);
  }
});

// ─── E 组：边界锁 ──────────────────────────────────────────────
test('E1 单腿——只有自方标签腿无他方腿，不判', () => {
  const singles = [
    '我这叫时间灵活',
    '到我这儿就叫灵活处理',
    'My mistakes are learning curves.',
    'Mine get called thoroughness.',
    'When I leave early it is called efficiency.',
  ];
  for (const t of singles) assert(spDim(t).hit === false, '单腿（自方）不应判: ' + t.slice(0, 30));
});
test('E2 单腿——只有他方标签腿无自方腿，不判', () => {
  const singles = [
    '他们那样叫小题大做',
    '别人就叫随意变更',
    'their mistakes are incompetence.',
    'theirs get called meddling.',
    'When others do it, they call it recklessness.',
  ];
  for (const t of singles) assert(spDim(t).hit === false, '单腿（他方）不应判: ' + t.slice(0, 30));
});
test('E3 同名同标豁免（标准一致不判双标）', () => {
  assert(spDim('Mine get called sloppy; theirs get called sloppy too.').hit === false, 'EN 同名同标应豁免');
  assert(spDim('我这叫疏忽，他们那叫疏忽').hit === false, 'ZH 同名同标应豁免');
});
test('E4 对称要求在场豁免', () => {
  assert(spDim('My mistakes are learning curves; their mistakes are incompetence — but we should hold everyone to the same standard.').hit === false, 'EN 对称要求应豁免');
  assert(spDim('我这样叫未雨绸缪，他们那样叫小题大做，但要一视同仁').hit === false, 'ZH 对称要求应豁免');
});
test('E5 不同行为名词约束（my overtime × their delays 不判）', () => {
  assert(spDim('My overtime is called commitment; their delays are called slack.').hit === false, 'EN 不同行为名词不应判');
});
test('E6 元话语引述豁免', () => {
  assert(spDim('这是典型的双重标准：我这叫灵活，他们那叫散漫').hit === false, '元话语/概念引述应豁免');
});

// ─── F 组：接线锁 ──────────────────────────────────────────────
test('F1 运行时接线——dimensions.special_pleading 键在、count>0', () => {
  const d = gate.discriminate('My mistakes are learning curves; their mistakes are incompetence.');
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
test('F3 模块导出含本轮新常量（负例注入面）', () => {
  const I = spMod.__internals();
  for (const k of ['SELF_COPULA_EN', 'OTHERS_COPULA_EN', 'SELF_MINE_EN', 'OTHERS_THEIRS_EN', 'SELF_ACTIVE_EN', 'OTHERS_ACTIVE_EN', 'SELF_FIRST_ZH', 'OTHERS_FIRST_ZH', 'BEHAVIOR_NOUNS_EN']) {
    assert(I[k], `__internals 缺 ${k}`);
  }
  // 存量常量不受影响（含 r419 路由六与路由五六）
  for (const k of ['OTHERS_LABEL_PRONE_EN', 'SELF_LABEL_PRONE_EN', 'SELF_LABEL_PRONE_ZH', 'OTHERS_LABEL_ZH', 'SELF_LABEL_ZH', 'OTHERS_LABEL_EN', 'SELF_LABEL_EN', 'SYMMETRY_ZH', 'SYMMETRY_EN']) {
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
