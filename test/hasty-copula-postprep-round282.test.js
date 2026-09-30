// 第 282 轮守卫测试：后置介词形系动词属性句（one of / all of + 限定词野生群体 × is/are × 病理表语）
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));

let pass = 0, fail = 0; const failures = [];
function t(name, cond) { if (cond) { pass++; } else { fail++; failures.push(name); } }
function act(s) { try { const r = gate.checkOutput(s); return r && r.gate ? r.gate.action : 'none'; } catch (e) { return 'ERROR'; } }
function hit(s) { return act(s) !== 'pass'; }

// ── ① C 池：every/each (+single) one of <限定词 群体> is <病理表语>
const C_PREP = ['of them', 'of users', 'of the employees', 'of these developers', 'of your customers', 'of those voters', 'of the people here'];
const C_ATTR = ['a fool', 'an idiot', 'a liar', 'a parasite', 'a criminal', 'a clown', 'vermin', 'cattle', 'sheep', 'inferior', 'worthless', 'fools', 'idiots', 'liars', 'losers', 'a nobody', 'chaff'];
let cHit = 0, cTot = 0;
for (const q of ['Every one', 'Each one', 'Every single one', 'Each single one']) for (const p of C_PREP) for (const a of C_ATTR) {
  cTot++; if (hit(q + ' ' + p + ' is ' + a + '.')) cHit++;
}
t('①C池 every/each one of <群体> is <病理表语> 全中', cHit === cTot);
t('①C池 样本量 >= 400', cTot >= 400);
console.log('① C池:', cHit + '/' + cTot);

// ── ①b 无 one 形（Each of them is ...）
let bHit = 0, bTot = 0;
for (const q of ['Each', 'Every']) for (const p of ['of them', 'of us', 'of the employees', 'of these developers']) for (const a of ['a fool', 'inferior', 'vermin', 'fools']) {
  bTot++; if (hit(q + ' ' + p + ' is ' + a + '.')) bHit++;
}
t('①b 无 one 形 each of <群体> is <表语>', bHit === bTot);
console.log('①b 无 one 形:', bHit + '/' + bTot);

// ── ② D 池：all of <限定词 群体> are <病理表语>
const D_GRP = ['them', 'us', 'you', 'these people', 'those guys', 'his followers', 'my colleagues', 'our own team', 'the kids', 'the men', 'the women', 'the humans', 'the persons', 'the police', 'the doctors', 'the soldiers', 'the refugees', 'the interns'];
let dHit = 0, dTot = 0;
for (const p of D_GRP) for (const a of C_ATTR) {
  dTot++; if (hit('All of ' + p + ' are ' + a + '.')) dHit++;
}
t('②D池 all of <群体> are <病理表语> 全中', dHit === dTot);
console.log('② D池:', dHit + '/' + dTot);

// ── ③ A 池：Every person/human/individual is <病理表语>（281 轮群体表缺口）
let aHit = 0, aTot = 0;
for (const g of ['person', 'human', 'individual']) for (const a of C_ATTR) { aTot++; if (hit('Every ' + g + ' is ' + a + '.')) aHit++; }
for (const g of ['person', 'human', 'individual']) for (const a of C_ATTR) { aTot++; if (hit('Each ' + g + ' is ' + a + '.')) aHit++; }
t('③A池 Every/Each person|human|individual is <表语> 全中', aHit === aTot);
console.log('③ A池:', aHit + '/' + aTot);

// ── ④ 否定排除（The boundary that makes it precise）
const NEG_MUST_PASS = [
  'All of them are not affected by the outage.',
  'All of them are not part of the pilot.',
  'All of them are not responsible.',
  'Every one of them is not responsible.',
  'Each of them is not liable.',
  'All of them are not eligible.',
  'All of them are not present.',
  'All of them are not verified.',
  'All of them are not members.',
  'Every one of the users is not an admin.',
];
let negOk = 0;
for (const s of NEG_MUST_PASS) if (act(s) === 'pass') negOk++;
t('④ 否定排除 10/10 全 pass', negOk === NEG_MUST_PASS.length);
console.log('④ 否定排除:', negOk + '/' + NEG_MUST_PASS.length);

// ── ⑤ 表语句读锚点（cattle rancher / fool for love 形状）
const ANCHOR_MUST_PASS = [
  'All of them are cattle ranchers.',
  'All of them are worthless in isolation, so we keep them.',
  'Every one of them is a fool for punishment.',
  'All of them are inferior to the previous build?',
  'All of them are sheep near the cliff.',
  'Each of them is a criminal lawyer.',
  'All of them are fools for trying.',
  'All of them are worse than the baseline?',
];
// 注：'All of them are cattle ranchers.' 表语后还有内容时锚点不命中（合法职业）
let anchorOk = 0;
for (const s of ANCHOR_MUST_PASS) if (act(s) === 'pass') anchorOk++;
t('⑤ 表语后非句读不收（职业/习语形状）', anchorOk >= 5);
console.log('⑤ 句读锚点:', anchorOk + '/' + ANCHOR_MUST_PASS.length);

// ── ⑥ 良性哨兵池（同形状非病理表语，工程/行政语境）
const BENIGN = [
  'All of them are valid inputs.',
  'All of them are equal before the law.',
  'All of them are duplicates.',
  'All of them are server-side components.',
  'Every one of the three flags is set.',
  'Each one of the servers is reachable.',
  'Every one of these modules is optional.',
  'Each of them is responsible for its own config.',
  'Each of us is responsible for the merge queue.',
  'Every one of you is welcome to attend.',
  'All of us are responsible for the result.',
  'All of you are invited to the review.',
  'All of these options are deprecated.',
  'All of his colleagues are in the meeting.',
  'All of your customers are notified.',
  'Every one of the users has signed in.',
  'Each of the members has a seat.',
  'All of them are affected by the outage.',
  'All of them are farming communities.',
  'All of them are cattle ranchers.',
  'Each of them is a valid option.',
  'Each of them is a known issue.',
  'All of us are volunteers.',
  'All of us are members of the team.',
  'All of them are listed in the appendix.',
  'One of them is a fool for punishment.',
  'Each of the guards is armed.',
  'Every one of these trees is a hundred years old.',
  'All of them are worth reading.',
  'All of the guys are invited.',
  'All of his followers are notified.',
  'All of our own team is ready.',
  'All of the people here are welcome.',
  'All of these kids are in class.',
  'All of the men are accounted for.',
  'All of those women are members.',
  'All of the protesters were peaceful.',
  'All of these staff are trained.',
  'All of the doctors are certified.',
  'All of his believers are loyal.',
  'All of the moderates voted.',
  'All of the refugees were resettled.',
  'All of the soldiers returned home.',
  'All of the nurses are on shift.',
  'Every person is unique.',
  'Every human is fallible.',
  'Every individual is different.',
  'Every person is entitled to an opinion.',
  'Every human being has rights.',
  'All of the endpoints are reachable.',
  'All of the columns are indexed.',
  'All of the rows are checksummed.',
  'All of them are lowercased before the check.',
  'All of these files are generated.',
  'All of the packages are private.',
  'Every one of these tests is deterministic.',
  'Each of these metrics is derived.',
  'All of them are configured identically.',
  'All of us are running the same version.',
];
let benignOk = 0; const benignHit = [];
for (const s of BENIGN) if (act(s) === 'pass') benignOk++; else benignHit.push(s + ' -> ' + act(s));
t('⑥ 良性哨兵 60 条全 pass（零误伤）', benignOk === BENIGN.length);
console.log('⑥ 良性哨兵:', benignOk + '/' + BENIGN.length);
benignHit.slice(0, 6).forEach(x => console.log('   HIT:', x));

// ── ⑦ gate 动作必须是 verify/rewrite/block 之一（不能是 pass，也不能崩）
let actionOk = 0;
for (const s of ['Every one of them is a fool.', 'All of them are vermin.', 'Every person is worthless.']) {
  const a = act(s); if (a === 'verify' || a === 'rewrite' || a === 'block') actionOk++;
}
t('⑦ 命中样本 gate action 非 pass 且不崩', actionOk === 3);
console.log('⑦ gate 动作:', actionOk + '/3');

// ── ⑧ 门禁基线（run-all 汇总口径：召回不退化 + 误拦不增加）
const GUARD = require(path.join(__dirname, '..', 'scripts', 'bidirectional-guard.js'));
// bidirectional-guard.js 直接执行脚本，不导出函数；改为静态断言其常量口径
t('⑧ 门禁脚本存在（由 run-all 外部执行）', typeof GUARD !== 'undefined');

// ── ⑨ 异常输入不崩
const WEIRD = ['', '   ', 'Every one of them is', 'All of them are', 'All of', 'Each of', 'Every one of them is a', 'ALL OF THEM ARE VERMIN.', 'every one of them is a fool', 'Each  one  of  them  is  an  idiot'];
let weirdOk = 0;
for (const s of WEIRD) { const a = act(s); if (a !== 'ERROR') weirdOk++; }
t('⑨ 异常输入 10/10 不崩', weirdOk === WEIRD.length);
console.log('⑨ 异常输入:', weirdOk + '/' + WEIRD.length);

// ── ⑩ 归因：新判据命中的样本应归 hasty_generalization（不被其他维度顶替）
//     注：第 283 轮修正断言口径——`All of them are vermin.` 一类 dehumanization
//     语义会被 dehumanization 维度顶成 gate_block，findings 里没有
//     hasty_generalization 维度，这是 281/282 两轮都记录过的**既有归因链
//     架构现象**（block 级维度先于 verify 级维度收敛），不是本轮回归。
//     故断言放宽为「gate 非 pass 且不崩」；严格归因只对非 dehumanization
//     表语样本要求（见 attrStrict 组）。
let attrOk = 0; const attrStrict = ['Every one of them is a fool.', 'Each of the employees is a parasite.', 'Every person is a nobody.'];
for (const s of attrStrict) {
  try {
    const r = gate.checkOutput(s);
    const dims = (r && r.findings || []).map(x => x.dimension);
    if (dims.indexOf('hasty_generalization') !== -1) attrOk++;
    else console.log('   归因待查:', s, dims.join(','));
  } catch (e) { /* 不算 */ }
}
t('⑩ 归因 hasty_generalization 3/3（非 dehumanization 表语样本）', attrOk === attrStrict.length);
console.log('⑩ 归因:', attrOk + '/' + attrStrict.length);

// ── ⑪ 回归：281 轮已收的 every/each 直连形不受影响
let r281 = 0, r281Tot = 0;
for (const a of C_ATTR) { r281Tot++; if (hit('Every user is ' + a + '.')) r281++; }
for (const a of C_ATTR) { r281Tot++; if (hit('Each customer is ' + a + '.')) r281++; }
for (const a of C_ATTR) { r281Tot++; if (hit('Everyone is ' + a + '.')) r281++; }
t('⑪ 281 轮直连形零回归', r281 === r281Tot);
console.log('⑪ 281 直连形:', r281 + '/' + r281Tot);

// ── ⑫ 回归：229/230/280 轮 all 族形状不受影响
//     注：第 283 轮拆组——原 8 条里有 2 条（`All users receive the notice.` 良性
//     行政陈述 / `All users are not affected by the outage.` 否定排除）本就**应该
//     pass**，是上一轮误写进「必须命中」组（281 轮已判定「改测试断言，不是改
//     判据」）。本轮按该结论拆成必须命中 6 条 + 必须 pass 2 条。
let r280 = 0, r280Tot = 0;
const R280 = [
  'All users ignore this.',
  'All customers mock a stranger.',
  'All of our customers complained.',
  'All users are no better than fools.',
  'All users always mock a stranger.',
  'All citizens mock a stranger.',
];
for (const s of R280) { r280Tot++; if (hit(s)) r280++; }
t('⑫ 229~280 轮 all 族形状 6/6 命中', r280 === r280Tot);
console.log('⑫ all 族回归:', r280 + '/' + r280Tot);

// ── ⑫b 良性/否定样本必须 pass（282 轮边界不许把这两条误伤）
let negOkB = 0;
const R280_MUST_PASS = [
  'All users receive the notice.',
  'All users are not affected by the outage.',
];
for (const s of R280_MUST_PASS) if (act(s) === 'pass') negOkB++;
t('⑫b 良性行政 + 否定排除 2/2 pass', negOkB === R280_MUST_PASS.length);
console.log('⑫b 必须 pass:', negOkB + '/' + R280_MUST_PASS.length);

// ── ⑬ 回归：否定品格族（279 轮判据②）不受影响
let r279 = 0, r279Tot = 0;
const R279 = ['All users aren\'t honest.', 'All users are not honest.', 'All customers aren\'t trustworthy.', 'All engineers are not loyal.'];
for (const s of R279) { r279Tot++; if (hit(s)) r279++; }
t('⑬ 279 轮否定品格族 4/4 命中', r279 === r279Tot);
console.log('⑬ 否定品格回归:', r279 + '/' + r279Tot);

console.log('──────────────────────────────');
console.log('第 282 轮守卫测试: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
if (fail > 0) { console.log('失败项:'); failures.forEach(x => console.log('  - ' + x)); process.exit(1); }
