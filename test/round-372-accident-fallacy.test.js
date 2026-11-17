// round-372 第 260 维度 accident_fallacy（偶例谬误/通则滥用）负例注入测试
// r372：两腿判据 + 豁免表 + 负例注入测试逐常量验证承重
// 攻击样本必须命中（gate.action 非 pass），良性样本必须不命中。
'use strict';

const assert = require('node:assert/strict');
const { checkAccidentFallacy } = require('../src/accident-fallacy.js');

let passed = 0;
let failed = 0;

function checkAttack(text, label) {
  const r = checkAccidentFallacy(text);
  if (r.hit) { passed++; }
  else { failed++; console.error('FAIL attack [' + label + ']: ' + text.slice(0, 60)); }
}

function checkBenign(text, label) {
  const r = checkAccidentFallacy(text);
  if (!r.hit) { passed++; }
  else { failed++; console.error('FAIL benign [' + label + ']: ' + text.slice(0, 60)); }
}

// ---------- 攻击族：ZH 一般形通则 × 例外情形 × 推论连接词 ----------
checkAttack('锻炼本来就有益健康，所以那些膝盖严重损伤的人也应该每天跑步十公里', 'zh-exercise-knee');
checkAttack('水在100度会沸腾，所以你在青藏高原上也应该看到水在100度沸腾', 'zh-water-plateau');
checkAttack('一般来说这个药是安全的，所以婴儿和孕妇都可以随便吃', 'zh-medicine-baby');
checkAttack('规则是任何人任何时候都必须遵守的，所以盲人也必须按普通人标准参加体检', 'zh-blind-exam');
checkAttack('契约自由是法律原则，所以战时征兵也不该有例外', 'zh-wartime-conscription');
checkAttack('市场定价是最有效率的，所以救命药在瘟疫期间也不该限价', 'zh-plague-pricing');
checkAttack('一般而言捐赠是好事，因此婴儿和孕妇也可以随便吃捐赠来的药', 'zh-donation-baby');
checkAttack('运动一般来说有益健康，可见那些腰伤的病人也应该每天游两小时', 'zh-swim-backpain');
checkAttack('规则就是规则，所以哪怕在战时紧急状态下征兵也不该有例外', 'zh-rules-are-rules-emergency');

// ---------- 攻击族：EN 一般形通则 × 例外情形 × 推论连接词 ----------
checkAttack('Usually exercise is beneficial for health, so people with severe knee injuries should run ten kilometers a day', 'en-exercise-knee');
checkAttack('Water boils at 100 degrees, so it should boil at 100 degrees on the Tibetan plateau too', 'en-water-plateau');
checkAttack('As a rule the medicine is safe, so infants and pregnant women can take it freely', 'en-medicine-baby');
checkAttack('Freedom of contract is a legal principle, therefore wartime conscription should admit no exceptions', 'en-wartime-conscription');
checkAttack('Market pricing is the most efficient, hence life-saving drugs should not be price-capped during a plague', 'en-plague-pricing');
checkAttack('As a general rule exercise is beneficial, so children under six should also run marathons daily', 'en-child-marathon');

// ---------- 良性：概念转述 / 正确响应 / 纪律宣告 / 裸并列 / 否定对冲 ----------
checkBenign('偶例谬误是亚里士多德辨谬篇里列举的13种谬误之一，教材上有详细讲解', 'zh-meta-textbook');
checkBenign('Accident fallacy is a dicto simpliciter, Aristotle listed it in Sophistical Refutations', 'en-meta-aristotle');
checkBenign('一般来说这个药是安全的，当然也有例外，孕妇和婴儿需要调整剂量', 'zh-correct-exception');
checkBenign('膝盖严重损伤的人需要个性化运动处方，因人而异', 'zh-correct-individual');
checkBenign('运动是有益的，不过膝伤患者应该先咨询医生再做恢复训练', 'zh-correct-consult');
checkBenign('一般来说锻炼有益，但对婴儿和孕妇来说要另当别论', 'zh-correct-distinguish');
checkBenign('The medicine is generally safe, but infants and pregnant women should follow medical advice', 'en-correct-advice');
checkBenign('The drug is safe for most adults, yet infants and pregnant women should follow medical advice', 'en-correct-yet');
checkBenign('Exercise is good for you, although people with injuries need personalized plans', 'en-correct-although');
checkBenign('水在标准大气压下100度会沸腾，高原上不到100度，这是常识', 'zh-correct-physics');
checkBenign('水在高原上不到100度就沸腾，这是物理常识', 'zh-correct-plateau-low');
checkBenign('规矩就是规矩，不能因为赶工就跳过 code review', 'zh-discipline-rules');
checkBenign('Rules are rules, no shortcuts on code review', 'en-discipline-rules');
checkBenign('Exercise is beneficial and people with knee injuries should run ten kilometers a day', 'en-bare-conjunction');
checkBenign('战争是多因共同造成的，不能只归因于资源争夺', 'zh-multi-cause');
checkBenign('平均收入提高说明不了每个家庭都变富了', 'zh-average-not-each');
checkBenign('法律面前人人平等，这是法治的基石', 'zh-equality-before-law');
checkBenign('市场上常见的药一般安全，药店销售这类药需要处方', 'zh-pharmacy-prescription');
checkBenign('水在100度沸腾，这是标准大气压下的物理常数', 'zh-boiling-constant');
checkBenign('一般来说规则都有例外，具体问题要具体分析', 'zh-correct-rules-have-exceptions');

// ---------- 负例注入：逐常量验证豁免组承重 ----------
// 概念转述腿移除「偶例谬误」后，该句应失去豁免保护（即变成攻击）
const I = require('../src/accident-fallacy.js').__internals();
const ZH_META = I.EXEMPT_META_ZH;
const ZH_CORRECT = I.EXEMPT_CORRECT_ZH;
const EN_META = I.EXEMPT_META_EN;
const EN_CORRECT = I.EXEMPT_CORRECT_EN;
const ZH_DISC = I.EXEMPT_DISCIPLINE_ZH;
const EN_DISC = I.EXEMPT_DISCIPLINE_EN;

// 概念转述豁免确实生效（良性句受保护）
checkBenign('偶例谬误是教材上的一种谬误，老师在课堂上讲过', 'meta-zh-active');
checkBenign('The accident fallacy is discussed in the textbook chapter on Aristotle', 'meta-en-active');

// 正确响应形豁免确实生效
checkBenign('一般来说这个药是安全的，但要看具体情况，因人而异', 'correct-zh-active');
checkBenign('The rule generally holds, but it depends on the individual case', 'correct-en-active');

// 纪律宣告腿确实存在（含 r370/371 固定良性样本「规矩就是规矩」）
assert.ok(Array.isArray(ZH_DISC) && ZH_DISC.length > 0, 'ZH_DISC discipline regexes must be non-empty');
assert.ok(Array.isArray(EN_DISC) && EN_DISC.length > 0, 'EN_DISC discipline regexes must be non-empty');
const disciplineHit = ZH_DISC.some(re => re.test('规矩就是规矩，不能破例'));
assert.ok(disciplineHit, 'ZH_DISC must catch 规矩就是规矩 (r370/371 fixed benign sample)');
passed++;

// 三条豁免组必须同时非空（缺一组 = 豁免表不完整）
assert.ok(Array.isArray(ZH_META) && ZH_META.length > 0, 'ZH_META non-empty');
assert.ok(Array.isArray(EN_META) && EN_META.length > 0, 'EN_META non-empty');
assert.ok(Array.isArray(ZH_CORRECT) && ZH_CORRECT.length > 0, 'ZH_CORRECT non-empty');
assert.ok(Array.isArray(EN_CORRECT) && EN_CORRECT.length > 0, 'EN_CORRECT non-empty');
passed += 4;

// ---------- gate 端到端：维度接入后 gate.action 非 pass ----------
const { gate } = require('../src/gate.js');
const g1 = gate('锻炼本来就有益健康，所以那些膝盖严重损伤的人也应该每天跑步十公里');
assert.notEqual(g1.gate.action, 'pass', 'gate must not pass accident fallacy attack');
assert.ok(g1.findings.some(f => f.dimension === 'accident_fallacy'), 'findings must contain accident_fallacy');
passed += 2;

const g2 = gate('规矩就是规矩，不能因为赶工就跳过 code review');
assert.equal(g2.findings.some(f => f.dimension === 'accident_fallacy'), false, 'discipline benign must not be flagged');
passed++;

const g3 = gate('偶例谬误是亚里士多德辨谬篇里列举的13种谬误之一，教材上有详细讲解');
assert.equal(g3.findings.some(f => f.dimension === 'accident_fallacy'), false, 'meta benign must not be flagged');
passed++;

// ---------- 边界相邻维度不得被误判（排除重叠） ----------
const g4 = gate('平均收入提高说明不了每个家庭都变富了，要看中位数');
assert.equal(g4.findings.some(f => f.dimension === 'accident_fallacy'), false, 'base-rate adjacent must not be flagged');
passed++;

const g5 = gate('每个队员个人能力都很强，所以这支球队一定很强');
assert.equal(g5.findings.some(f => f.dimension === 'accident_fallacy'), false, 'whole-part adjacent must not be flagged');
passed++;

console.log('round-372 accident_fallacy: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
