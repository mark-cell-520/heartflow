'use strict';
/**
 * test/round-268-benign-fp-five-families.test.js
 * [r268] r266 五族新措辞家族「中性误伤回归」落库（2 号红队报告 → 常驻测试）
 *
 * 背景：r266 agent-2 红队报告（coordination/reports/r266-benign-agent2.md）
 * 对 4 个已接线维度的 5 个新措辞家族做了 66 条中性样本 + 16 条攻击对照，
 * 结论「五族零维度级误伤、13/16 攻击目标维度承重」——但样本探针当时只在
 * 仓库外 .tmp/ 裸跑，未落成 test/ 回归文件，引擎任何后续改动都可能重新
 * 引入误伤而无人察觉。本文件把该结论固化为 run-all 可达的回归断言。
 *
 * 覆盖的 5 个家族（均 live，维度计数 232 不变）：
 *   F1 reverse_causation   RESP 风险焦虑应对行为族（囤口罩/囤盐/净水器/备药…）
 *   F2 whole_part_transfer 口碑质量词族（惊艳/卖座/扎实/口碑…）
 *   F3 whole_part_transfer 融合量词族（每章/每道/每集/各个/所有…）
 *   F4 conjunction_fallacy 口语概率名词族（希望/指望/胜算/把握/盼头）
 *   F5 illicit_conversion  后置全称量词族（清一色/统统/尽数/全数；
 *                          「无一」族按设计刻意不收——否定全称换位是有效推理）
 *
 * 判定口径（沿用红队报告标准）：
 *   - 中性样本：gate findings 不得含目标维度承重（维度级误伤）+ 模块级不触发；
 *     当前 action=pass 的 59 条追加 action===pass 端到端断言；
 *     另 7 条当前被存量维度触发（见 KNOWN_NONTARGET，非本族回归），只断言
 *     目标维度不承重——存量维度若被 1 号修掉，这 7 条只会转 pass，不会误报。
 *   - 攻击对照：仅对 13 条「已 live」样本断言模块命中 + findings 承重 +
 *     action 非 pass；3 条已知漏判（KNOWN_GAPS）按红队报告 §5 交 1 号修复，
 *     刻意不做断言（修复落地后应提升为活动断言，见文件末）。
 *
 * 实证（r268 探针 .tmp/r268-benign-probe.js，HEAD 027d8a55 / r267 落账后，
 * VERSION 6.8.157）：66 中性逐条复跑与 r266 报告零漂移——59 pass、
 * 7 条存量维度触发（crisis_exceptionalism×1 / sorites_fallacy×1 /
 * pseudo_causal×1 / presupposition×2 / perfect_error×2）、目标维度误伤 0、
 * 模块级直测全不触发；13 条 live 攻击全部模块命中 + 目标维度承重；
 * 3 条已知漏判维持原状（投诉句 pass / 每一集句 reasoning_coherence 兜底 /
 * EN dish 句 pass）。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const { checkReverseCausation } = require(path.join(ROOT, 'src', 'reverse-causation.js'));
const { checkWholePartTransfer } = require(path.join(ROOT, 'src', 'whole-part-transfer.js'));
const { checkConjunctionFallacy } = require(path.join(ROOT, 'src', 'conjunction-fallacy.js'));
const { checkIllicitConversion } = require(path.join(ROOT, 'src', 'illicit-conversion.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}

/** 中性样本断言：目标维度零误伤（gate 层 + 模块层）；expectPass 时追加端到端 pass */
function assertNeutral(fam, s, expectPass) {
  const r = gate(s);
  const f = (r.findings || []).find((x) => x.dimension === fam.dim);
  assert.ok(!f, '中性样本目标维度误伤: ' + s);
  assert.strictEqual(fam.fired(s), false, '中性样本模块级误伤: ' + s);
  if (expectPass) {
    assert.strictEqual(r.gate.action, 'pass', '中性样本 action 非 pass: ' + s);
  }
}

/** live 攻击断言：模块命中 + gate findings 目标维度承重 + action 非 pass */
function assertAttack(fam, s) {
  assert.strictEqual(fam.fired(s), true, '攻击未命中模块: ' + s);
  const r = gate(s);
  assert.notStrictEqual(r.gate.action, 'pass', '攻击 action=pass: ' + s);
  const f = (r.findings || []).find((x) => x.dimension === fam.dim);
  assert.ok(f, '攻击 findings 缺目标维度承重: ' + s);
}

// ─── 家族定义（样本逐条转录自 r266 红队报告，r268 探针复跑零漂移）──
const FAMILIES = [
  {
    id: 'F1', dim: 'reverse_causation', label: '囤货族',
    fired: (s) => checkReverseCausation(s).hit === true,
    // expectPass=false 的 3 条当前被存量维度触发（crisis_exceptionalism/
    // sorites_fallacy/pseudo_causal），只不断言端到端 pass
    neutral: [
      ['疫情初期家里囤口罩、囤消毒液，后来疫情缓解就用不上了', false],
      ['水质不放心，家里装净水器三年了，喝起来放心许多', true],
      ['非典那年很多人囤盐，说是能防辐射，后来证实没用', true],
      ['小区里不少老人备药，感冒药、降压药都备了一点', false],
      ['搬家第一件事是换锁芯，接着装警报器，房东也建议这么做', true],
      ['办公室的同事们纷纷囤货，方便面和罐头备了很多', true],
      ['考虑到工作性质，家里请保镖，孩子上学也有人接送', true],
      ['听说要降温，我妈赶紧备药，还把换季衣服找出来了', true],
      ['疫情防控政策调整以后，社区里囤口罩的现象大幅减少，不少家庭把剩下的口罩捐给了居委会', false],
      ['自打家里装净水器，水质明显好转，烧水壶里也不结水垢了', true],
      ['疫情那几年囤口罩的人明显更多，大家心里都踏实点', true],
      ['越囤口罩越多，家里堆得像个仓库', true],
      ['Panic buying emptied supermarket shelves across Europe in March 2020.', true],
      ['Households stockpiling masks and hand sanitizer were far more common in early 2020 than a year earlier.', true],
      ['Many families installed water filters after the news report, and many more said the tap water tasted better.', true],
      ['After several break-ins, the building hired a security guard and replaced the locks.', true],
    ],
    attack: [
      '囤口罩的人感染率更高，可见囤口罩会招来感染',
      'Households that installed air purifiers reported more respiratory problems, which shows air purifiers attract illness.',
    ],
  },
  {
    id: 'F2', dim: 'whole_part_transfer', label: '口碑质量词族',
    fired: (s) => checkWholePartTransfer(s).hit === true,
    neutral: [
      ['这部电影票房卖座，口碑也不错', true],
      ['招牌菜很惊艳，分量也足', true],
      ['演出精彩，观众掌声不断', true],
      ['每道菜都很精致，店家介绍得也详细', true],
      ['这家店的菜品质量扎实，价格也公道', true], // moral_foundations(20) 不承重，action=pass
      ['专辑里的每首歌都好听，编曲也耐听', true],
      ['这本杂志每期都有深度报道，封面也吸睛', true],
      ['这部电影每章都精彩，观众看得过瘾', true],
      ['新赛季的球衣配色亮眼，预售链接一上线就很抢手', true],
      ['这本小说写得好玩，孩子一口气读完了大半', true],
      ['Every episode of the series is gripping, and the finale is especially compelling.', true],
      ["The restaurant's signature dish is superb, and the portions are generous.", true],
    ],
    attack: [
      '这支球队个个是高手，所以每个球员都能打',
      '这家店每道菜口碑都好，所以这家店一定有口皆碑',
      'Every chapter is excellent, so the whole book must be excellent.',
    ],
  },
  {
    id: 'F3', dim: 'whole_part_transfer', label: '融合量词族',
    fired: (s) => checkWholePartTransfer(s).hit === true,
    neutral: [
      ['每章都配有课后习题，方便读者自学', true],
      ['每道工序都有明确标准，工人按流程操作', true],
      ['每集片尾都有字幕彩蛋，粉丝习惯了', true],
      ['每个楼层都配了灭火器，物业每月检查一次', true],
      ['所有条款都经过法务审核，双方才签字', false], // perfect_error(15) 存量触发
      ['每种配色都可以定制，下单前可以先看样', true],
      ['各个舱位的票价不同，靠窗的位置贵一些', true],
      ['每节课后都有答疑时间，学生可以留到最后', true],
      ['每个关卡都有存档点，玩家因此很容易通关', true],
      ['这篇文章的每个提案都写得很扎实，编辑部下周统一反馈', true],
      ['Each lesson comes with a worksheet, and students submit it online.', true],
      ['Every room in the hotel has a balcony, and the rates include breakfast.', true],
    ],
    attack: [
      '这家店每道菜口碑都好，所以这家店一定火爆',
      '每章都写得精彩，所以这本书一定精彩',
    ],
  },
  {
    id: 'F4', dim: 'conjunction_fallacy', label: '口语概率名词族',
    fired: (s) => checkConjunctionFallacy(s).hit === true,
    neutral: [
      ['希望项目顺利', true],
      ['他对胜算很有把握', true],
      ['这件事希望不大', true],
      ['别指望临时抱佛脚', true],
      ['我希望孩子健康成长，也盼望他学会独立', true], // moral_foundations(20) 不承重，action=pass
      ['夺冠的胜算不大，但队员们都拼尽了全力', true],
      ['这事你盯着点，我心里也有个盼头', true],
      ['他有把握按时完成，毕竟准备了一个月', true],
      ['虽然希望渺茫，团队仍然决定再试一次，毕竟不到最后一刻谁也不愿意放弃', false], // presupposition(30) 存量触发
      ['他对今年的收成很有把握，除了自家的地，还承包了两亩果园', true],
      ['他既会作曲又会填词，评委对他的希望很大', true],
      ['She has a real shot at the promotion this year.', true],
      ['He believes his chances are good, though nothing is guaranteed yet.', false], // perfect_error(15) 存量触发
    ],
    attack: [
      '又会作曲又能开巡演，评上年度音乐人的希望比只会作曲的指望高',
      '既能写稿又能出镜，拿到offer的胜算比只会写稿的把握大',
      'Someone who can both write and present has a better shot at the offer than someone who can only write.',
    ],
  },
  {
    id: 'F5', dim: 'illicit_conversion', label: '后置全称量词族',
    fired: (s) => checkIllicitConversion(s).score > 0,
    neutral: [
      ['入围作品清一色是现实题材', true],
      ['参会的人统统是 90 后', true],
      ['货架上的产品统统是新版包装', true],
      ['获奖名单清一色为青年导演，评委会今年特意提携新人', true],
      ['这批新车尽数配备主动刹车，上市时间定在明年三月', true],
      ['仓库里的旧设备全数报废，新机器下周到位', true],
      ['本次展览的参展画作清一色是水墨作品，主办方称这是为了突出东方美学主题', true],
      ['他们宿舍的人统统是夜猫子，凌晨两点还在开黑', false], // presupposition(30) 存量触发
      ['入围的清一色是优等生，评委按作品质量逐一打分', true],
      ['通过初审的作品统统是现实题材，复审安排在月底', true],
      ['出席的人统统是会员，门口保安核对名单后才放行', true],
      ['All the shortlisted entries are documentary features.', true],
      ['Every room on this floor faces the garden.', true],
    ],
    attack: [
      '入围的清一色是优等生，所以优等生都能入围',
      '畅销的车都省油，所以省油的车都畅销',
      '入围的清一色是优等生，所以优等生清一色能入围',
    ],
  },
];

// ─── 逐族执行 ────────────────────────────────────────────────────
let neutralTotal = 0;
let liveTotal = 0;
for (const fam of FAMILIES) {
  fam.neutral.forEach(([s, expectPass], i) => {
    neutralTotal++;
    t(fam.id + '-中性-' + String(i + 1).padStart(2, '0'), () => assertNeutral(fam, s, expectPass));
  });
  fam.attack.forEach((s, i) => {
    liveTotal++;
    t(fam.id + '-攻击-' + String(i + 1).padStart(2, '0'), () => assertAttack(fam, s));
  });
}

// ─── 完整性自检（防文件被意外截断/样本被误删）────────────────────
t('完整性-样本计数', () => {
  assert.strictEqual(neutralTotal, 66, '中性样本应 66 条: got ' + neutralTotal);
  assert.strictEqual(liveTotal, 13, 'live 攻击应 13 条: got ' + liveTotal);
  assert.strictEqual(FAMILIES.length, 5, '家族应 5 组: got ' + FAMILIES.length);
});

// ─── KNOWN_NONTARGET：7 条当前被存量维度触发的中性样本（文档化，不断言）──
// 1. 疫情初期家里囤口罩、囤消毒液，后来疫情缓解就用不上了 → crisis_exceptionalism(60)
//    （SUSPEND_ZH 紧凑形裸字「缓」误触，红队报告建议 1 号改组合形）
// 2. 小区里不少老人备药，感冒药、降压药都备了一点 → sorites_fallacy(60)
// 3. 疫情防控政策调整以后，社区里囤口罩的现象大幅减少… → pseudo_causal(40)×2
// 4. 所有条款都经过法务审核，双方才签字 → perfect_error(15)
// 5. 虽然希望渺茫，团队仍然决定再试一次… → presupposition(30)
// 6. 他们宿舍的人统统是夜猫子，凌晨两点还在开黑 → presupposition(30)
// 7. He believes his chances are good, though nothing is guaranteed yet. → perfect_error(15)
// 均为存量维度行为（非 r266/r268 回归），本族结论以「目标维度不承重」为准。

// ─── KNOWN_GAPS：3 条已知漏判攻击（红队报告 §5 交 1 号修复，刻意不断言）──
// L1 reverse_causation RESULT_ZH 缺「投诉」族软性负面结果名词：
//    「装了净水器的家庭水质投诉更多，可见净水器会吸引投诉」→ 当前 pass。
//    修复（RESULT_ZH 补 投诉|纠纷|不满|抱怨|差评|退货|退订|举报|信访|索赔）
//    落地后提升为 assertAttack(F1, …)。
// L2 whole_part_transfer 融合量词族不收带「一」的「每一集」形：
//    「这部剧每一集都精彩，所以整部剧一定精彩」→ 当前 verify 但仅
//    reasoning_coherence(50) 兜底。修复（/每(?:一)?[章集节道款项篇期]/）
//    落地后提升为 assertAttack(F2, …)。
// L3 whole-part-transfer.js:102 EN 正则 typo：dishes? 不匹配单数 dish：
//    「Every dish on the menu is excellent, so the restaurant must be excellent.」
//    → 当前 pass。修复（dish(?:es)?）落地后提升为 assertAttack(F2, …)。

console.log('✓ round-268-benign-fp-five-families: 66 中性 0 目标维度误伤（59 端到端 pass + 7 存量维度触发不断言）/ 13 live 攻击全承重');
if (fails.length) { console.error('FAIL:'); fails.forEach((f) => console.error(' - ' + f)); process.exit(1); }
console.log('✓ round-268-benign-fp-five-families 全部通过 (' + pass + ' 断言)');
console.log('round-268-benign-fp-five-families: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个');
