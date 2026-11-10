// round-283-causation-families.test.js
// r283：因果与反事实推理 wired 维度全新措辞家族扩展（真升级②）
//   common_cause：时段共变无并列形 / 的-link 比较平行形 / 飙升族 / EN with-more 平行形
//   collider_bias：裸比字比较 / EN least·most 交叉 / dismiss+养生结论形
//     （口语推断词「看来」族曾扩后经注入-删条否证撤回，见引擎 INFER_ZH 注记）
//   reverse_causation：纪律处分·关系解除族 / 裸表现结果族（容许「更」）/ 夫妻群体名词 / EN expelled 族
// 判据：攻击命中 + 良性零误伤 + 注入-删条逐族证明承重 + 既有族不回退 + 维度计数不变。
'use strict';
const assert = require('assert');
const { gate } = require('../src/gate.js');
const cc = require('../src/common-cause.js');
const co = require('../src/collider-bias.js');
const rc = require('../src/reverse-causation.js');

let pass = 0; const fails = [];
function t(cond, label) { if (cond) { pass++; } else { fails.push(label); } }

// ─── 攻击矩阵（12：每维度 4，中英混排）──────────────────────────────
const ATTACKS = [
  ['cc1 时段共变无并列形', '冰淇淋卖得多的月份溺水事故也多，看来是冰淇淋推高了溺水数。', 'common_cause'],
  ['cc2 的-link 比较平行形', '消防车越多的火灾损失越大，看来多派消防车拉高了损失。', 'common_cause'],
  ['cc3 飙升族（一起飙升）', '夏天用电量和气温一起飙升，看来空调用电推高了气温。', 'common_cause'],
  ['cc4 EN with-more 平行形', 'Cities with more police have more crime, so hiring police causes crime.', 'common_cause'],
  ['co1 裸结论形·更差', '在被录用的人里，笔试成绩高的面试分数反而低，看来会考试的面试都更差。', 'collider_bias'],
  ['co2 裸比字比较+长寿结论', '在活到九十岁的人里，抽烟喝酒的比例比普通人高，看来烟酒确实有助于长寿。', 'collider_bias'],
  ['co3 EN least/most 交叉', 'Among the admitted students, those who prepared least for the interview got the highest scores, so preparation clearly hurts.', 'collider_bias'],
  ['co4 dismiss 结论形（不会说话）', '在被录用的人里，笔试成绩高的面试分数反而低，看来会考试的都不会说话。', 'collider_bias'],
  ['rc1 纪律处分族·劝退', '成绩差的学生才被劝退学，看来劝退直接导致成绩差。', 'reverse_causation'],
  ['rc2 纪律处分族·降级', '绩效差的员工才被降级，看来降级导致业绩更差。', 'reverse_causation'],
  ['rc3 关系解除族·离婚+夫妻', '闹离婚的夫妻幸福感更低，看来离婚导致幸福感更低。', 'reverse_causation'],
  ['rc4 EN expelled 族', 'Students who were expelled had worse grades, so expulsion clearly increased their dropout risk.', 'reverse_causation'],
];
// ─── 良性矩阵（14）────────────────────────────────────────────────
const BENIGN = [
  ['cc-b1 否定豁免（不代表）', '今年销量多的月份退货也多，这是促销节奏，不代表促销导致退货。'],
  ['cc-b2 对冲+混杂（可能/混杂）', '消防车越多的火灾损失越大，这个现象可能还有混杂因素，需要控制后再看。'],
  ['cc-b3 否定豁免（并不意味着）', '夏天用电量和气温一起飙升，但这是季节性规律，并不意味着高温导致用电变化。'],
  ['cc-b4 EN 否定豁免', 'Cities with more police have more crime, but that does not mean police cause crime.'],
  ['cc-b5 单主语越X越Y无的-link', '他越练越强，成绩提高了不少。'],
  ['cc-b6 越忙的时候越要（模态否定守卫）', '越忙的时候越要多喝水，补充水分很重要。'],
  ['co-b1 非因果结论', '在被录用的人里，笔试成绩高的面试分数反而低，看来不同场次考察的能力维度不一样。'],
  ['co-b2 对冲+未必', '在活到九十岁的人里，抽烟喝酒的比例比普通人高，但这可能只是样本选择，未必说明抽烟有利于健康。'],
  ['co-b3 EN 否定守卫', 'Among the admitted students, those who prepared least got the highest scores, but preparation does not hurt.'],
  ['co-b4 比字比较+多因否定', '在活到九十岁的人里，规律作息者的各项指标比熬夜者好，但这与多种因素有关，不能单独归因。'],
  ['rc-b1 无差异标记', '学校劝退违纪学生依据的是校规校纪，家长表示理解。'],
  ['rc-b2 无差异标记', '被劝退的学生如果及时补救，照样能考上好大学。'],
  ['rc-b3 无因果动词', '闹离婚的夫妻更需要沟通，这说明婚姻需要经营。'],
  ['rc-b4 EN 无差异标记', 'Students who were expelled can still apply to other schools.'],
];
// ─── 既有族对照（防回归：注入删新族后必须仍命中）──────────────────
const OLD_CTRL = [
  ['cc-oc1 相关名词形', '夏天冰淇淋销量和溺水数相关，所以冰淇淋推高了溺水数。', 'common_cause'],
  ['cc-oc2 共变动词形（同步上升）', '夏天冰淇淋销量和溺水死亡同步上升，所以冰淇淋推高了溺水数。', 'common_cause'],
  ['cc-oc3 EN correlated', 'Ice cream sales and drowning deaths are correlated, so ice cream increases drowning.', 'common_cause'],
  ['co-oc1 所以+拖累结论', '在留下来的员工里，加班越少的绩效反而越高，所以加班拖累了绩效。', 'collider_bias'],
  ['co-oc2 EN so+fewer/higher', 'Among the survivors, those who worked fewer hours had higher performance, so working hours hurt performance.', 'collider_bias'],
  ['rc-oc1 r174 典范句（住院）', '住院患者的死亡率明显更高，所以住院本身增加了死亡风险。', 'reverse_causation'],
  ['rc-oc2 EN 典范句', 'Patients who were hospitalized had much higher mortality, so hospitalization itself increases the risk of death.', 'reverse_causation'],
];

// ─── 一、模块层攻击命中 ────────────────────────────────────────────
const modCheck = { common_cause: cc.checkCommonCause, collider_bias: co.checkColliderBias, reverse_causation: rc.checkReverseCausation };
for (const [tag, s, dim] of ATTACKS) {
  const r = modCheck[dim](s, {});
  t(r.hit === true, `模块层攻击应命中：${tag}${r.hit ? '' : '（未命中）'}`);
}
// ─── 二、门禁层攻击变红 ────────────────────────────────────────────
for (const [tag, s, dim] of ATTACKS) {
  const r = gate(s);
  t(r.gate.action !== 'pass', `门禁层攻击应非 pass：${tag}（${r.gate.action}）`);
  t((r.findings || []).some((f) => f.dimension === dim), `门禁层应命中目标维度 ${dim}：${tag}`);
}
// ─── 三、良性零误伤 ────────────────────────────────────────────────
for (const [tag, s] of BENIGN) {
  const r = gate(s);
  t(r.gate.action === 'pass', `良性应 pass：${tag}（${r.gate.action} ${(r.findings || []).map((f) => f.dimension).join(',')}）`);
}
// ─── 四、既有族对照不回退 ──────────────────────────────────────────
for (const [tag, s, dim] of OLD_CTRL) {
  t(modCheck[dim](s, {}).hit === true, `既有对照应仍命中：${tag}`);
}
// ─── 五、注入-删条：逐族证明承重 ───────────────────────────────────
const ccI = cc.__internals(); const coI = co.__internals(); const rcI = rc.__internals();
const strip = (re, words) => new RegExp(re.source.replace(words, ''), re.flags);
const NEVER = /(?!x)x/;

// cc-A 时段共变无并列形（COVARY_REL_ZH 新元素 1、2 整条删）
t(!cc.checkCommonCause(ATTACKS[0][1], { COVARY_REL_ZH: [ccI.COVARY_REL_ZH[0]] }).hit, '注入 COVARY_REL_ZH 删新元素 → 时段共变攻击停');
t(!cc.checkCommonCause(ATTACKS[1][1], { COVARY_REL_ZH: [ccI.COVARY_REL_ZH[0]] }).hit, '注入 COVARY_REL_ZH 删新元素 → 的-link 攻击停');
t(cc.checkCommonCause(OLD_CTRL[0][1], { COVARY_REL_ZH: [ccI.COVARY_REL_ZH[0]] }).hit, '删新元素后相关名词形对照仍命中');
// cc-B 飙升族（并入 COVARY_MOVE_ZH[0]，源内抹新词）
const stripSurge = (re) => strip(re, /\|(?:飙升|暴涨|疯涨|飞涨|蹿升|猛涨|猛增|猛跌|激增|剧增|骤增|骤降|锐减|暴增|狂涨|猛升)/g);
t(!cc.checkCommonCause(ATTACKS[2][1], { COVARY_MOVE_ZH: [stripSurge(ccI.COVARY_MOVE_ZH[0]), ccI.COVARY_MOVE_ZH[1], ccI.COVARY_MOVE_ZH[2]] }).hit, '注入抹飙升族 → 一起飙升攻击停');
t(cc.checkCommonCause(OLD_CTRL[1][1], { COVARY_MOVE_ZH: [stripSurge(ccI.COVARY_MOVE_ZH[0]), ccI.COVARY_MOVE_ZH[1], ccI.COVARY_MOVE_ZH[2]] }).hit, '抹飙升族后同步上升对照仍命中');
// cc-C EN with-more 平行形（COVARY_REL_EN 新元素删）
t(!cc.checkCommonCause(ATTACKS[3][1], { COVARY_REL_EN: [ccI.COVARY_REL_EN[0]] }).hit, '注入 COVARY_REL_EN 删新元素 → with-more 攻击停');
t(cc.checkCommonCause(OLD_CTRL[2][1], { COVARY_REL_EN: [ccI.COVARY_REL_EN[0]] }).hit, '删新元素后 correlated 对照仍命中');
// co-A（r283 留痕：INFER_ZH「看来」族扩展经注入-删条否证非承重——co1/co4 均经
// C-b 裸结论路径命中，已撤回引擎改动，故无注入项；证明见 UPGRADE_LOG r283 条目）
// co-B 裸比字比较（ASSOC_ZH 末元素删）
t(!co.checkColliderBias(ATTACKS[5][1], { ASSOC_ZH: coI.ASSOC_ZH.slice(0, -1) }).hit, '注入删比字比较 → 比字攻击停');
t(co.checkColliderBias(OLD_CTRL[3][1], { ASSOC_ZH: coI.ASSOC_ZH.slice(0, -1) }).hit, '删比字比较后「越高」对照仍命中');
// co-C EN least/most（ASSOC_EN 末元素删）
t(!co.checkColliderBias(ATTACKS[6][1], { ASSOC_EN: coI.ASSOC_EN.slice(0, -1) }).hit, '注入删 least/most → EN 攻击停');
t(co.checkColliderBias(OLD_CTRL[4][1], { ASSOC_EN: coI.ASSOC_EN.slice(0, -1) }).hit, '删 least/most 后 fewer/higher 对照仍命中');
// co-D dismiss+养生结论形（CAUSAL_ZH 末元素整条换永假——该元素仅含 r283 新族，
// 抹空会产生空正则触发 findConclLeg 无守卫循环，故按注入语义用 /(?!x)x/ 永假式）
t(!co.checkColliderBias(ATTACKS[7][1], { CAUSAL_ZH: coI.CAUSAL_ZH.slice(0, -1).concat([NEVER]) }).hit, '注入永假换 dismiss 结论族 → 不会说话攻击停');
t(co.checkColliderBias(OLD_CTRL[3][1], { CAUSAL_ZH: coI.CAUSAL_ZH.slice(0, -1).concat([NEVER]) }).hit, '永假换 dismiss 族后「拖累」对照仍命中');
// rc-A 纪律处分族（RESP_ZH[1] 源内抹新词）
const stripDiscipline = (re) => strip(re, /\|(?:劝退|清退|退学|开除|除名|留级|降级|停职|免职|撤职|问责|分手|离婚|拉黑|绝交|断亲)/g);
t(!rc.checkReverseCausation(ATTACKS[8][1], { RESP_ZH: [rcI.RESP_ZH[0], stripDiscipline(rcI.RESP_ZH[1])] }).hit, '注入抹纪律处分族 → 劝退攻击停');
t(!rc.checkReverseCausation(ATTACKS[9][1], { RESP_ZH: [rcI.RESP_ZH[0], stripDiscipline(rcI.RESP_ZH[1])] }).hit, '注入抹纪律处分族 → 降级攻击停');
t(!rc.checkReverseCausation(ATTACKS[10][1], { RESP_ZH: [rcI.RESP_ZH[0], stripDiscipline(rcI.RESP_ZH[1])] }).hit, '注入抹纪律处分族 → 离婚攻击停');
t(rc.checkReverseCausation(OLD_CTRL[5][1], { RESP_ZH: [rcI.RESP_ZH[0], stripDiscipline(rcI.RESP_ZH[1])] }).hit, '抹纪律处分族后住院对照仍命中');
// rc-B 裸表现结果族（RESULT_ZH 新元素删）
t(!rc.checkReverseCausation(ATTACKS[8][1], { RESULT_ZH: [rcI.RESULT_ZH[0]] }).hit, '注入删裸表现结果 → 成绩差攻击停');
t(!rc.checkReverseCausation(ATTACKS[10][1], { RESULT_ZH: [rcI.RESULT_ZH[0]] }).hit, '注入删裸表现结果 → 幸福感低攻击停');
t(rc.checkReverseCausation(OLD_CTRL[5][1], { RESULT_ZH: [rcI.RESULT_ZH[0]] }).hit, '删裸表现结果后死亡率对照仍命中');
// rc-C 夫妻群体名词（GROUP_DE_ZH 源内抹）
const stripCouple = (re) => strip(re, /\|(?:夫妻|情侣)/g);
t(!rc.checkReverseCausation(ATTACKS[10][1], { GROUP_DE_ZH: [stripCouple(rcI.GROUP_DE_ZH[0])] }).hit, '注入抹夫妻群体名词 → 离婚攻击停');
t(rc.checkReverseCausation(OLD_CTRL[5][1], { GROUP_DE_ZH: [stripCouple(rcI.GROUP_DE_ZH[0])] }).hit, '抹夫妻后住院患者对照仍命中');
// rc-D EN expelled 族（RESP_EN[0] 源内抹）
const stripExpelled = (re) => strip(re, /\|(?:expelled|expulsion|suspensions\?|suspended|demoted|demotion|held\\s\+back|expelled\\s\+from)/g);
t(!rc.checkReverseCausation(ATTACKS[11][1], { RESP_EN: [stripExpelled(rcI.RESP_EN[0]), rcI.RESP_EN[1]] }).hit, '注入抹 expelled 族 → EN 攻击停');
t(rc.checkReverseCausation(OLD_CTRL[6][1], { RESP_EN: [stripExpelled(rcI.RESP_EN[0]), rcI.RESP_EN[1]] }).hit, '抹 expelled 族后 hospitalized 对照仍命中');
// 全腿永假对照（三腿判据完整性：任一腿抹平攻击必停）
t(!cc.checkCommonCause(ATTACKS[0][1], { CAUSE_ZH: [NEVER] }).hit, 'cc 全因动词永假 → 攻击停');
t(!co.checkColliderBias(ATTACKS[4][1], { COND_ZH: [] }).hit, 'co 全条件腿永假 → 攻击停');
t(!rc.checkReverseCausation(ATTACKS[8][1], { CAUSE_ZH: [NEVER] }).hit, 'rc 全因动词永假 → 攻击停');

// ─── 六、登记断言 ──────────────────────────────────────────────────
const fs = require('fs');
t(fs.readFileSync('VERSION', 'utf8').trim() === '6.8.165', 'VERSION 应为 6.8.165（r283 bump）');
t(ccI.COVARY_MOVE_ZH.length === 3, 'round-264 登记纪律：COVARY_MOVE_ZH 恒 3 条（飙升族并入首元素）');
t(ccI.COVARY_MOVE_EN.length === 2, 'round-264 登记纪律：COVARY_MOVE_EN 恒 2 条');
t(ccI.CAUSE_EN.length === 3, 'round-264 登记纪律：CAUSE_EN 恒 3 条');
t(rcI.RESP_ZH.length === 2, 'round-266 登记纪律：RESP_ZH 恒 2 条（纪律族并入次元素）');
t(rcI.RESP_EN.length === 2, 'round-266 登记纪律：RESP_EN 恒 2 条');
t(rcI.RESULT_EN.length === 2, 'round-266 登记纪律：RESULT_EN 恒 2 条');
t(rcI.CAUSE_EN.length === 2, 'round-266 登记纪律：CAUSE_EN 恒 2 条');
t(coI.ASSOC_ZH.length >= 6 && coI.ASSOC_ZH[coI.ASSOC_ZH.length - 1].source.includes('比['), 'ASSOC_ZH 应收编裸比字比较形');
t(ccI.COVARY_REL_ZH.length === 3, 'COVARY_REL_ZH 应含 2 个 r283 新元素');
t(ccI.COVARY_REL_EN.length === 2, 'COVARY_REL_EN 应含 r283 新元素');

if (fails.length) { console.error('FAIL:'); fails.forEach((f) => console.error(' - ' + f)); }
assert.strictEqual(fails.length, 0, `round-283-causation-families: ${fails.length} failed`);
console.log(`round-283-causation-families: ${pass} 通过, ${fails.length} 失败, 共 ${pass + fails.length} 个`);
