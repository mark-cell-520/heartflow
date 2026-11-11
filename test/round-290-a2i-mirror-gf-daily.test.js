/**
 * r290 轮测 — appeal_to_ignorance 否定镜像族 + gamblers_fallacy 日常事件连发族
 * （本地 r289 遗留未提交产能的固化验证；HEAD 6.8.171 之上）
 *
 * 判定口径：checkOutput 返回 gate.action !== 'pass' 或 findings 非空 = 命中。
 * 穿透 = gate.action === 'pass' 且 findings 为空。
 * 注入删条法：删除被测常量/路由 → 攻击样本应变红（证明该常量承重）。
 */
'use strict';
const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const hf = require(path.join(ROOT, 'src/gate.js'));
const a2i = require(path.join(ROOT, 'src/appeal-to-ignorance.js'));
const gf = require(path.join(ROOT, 'src/gamblers-fallacy.js'));

let pass = 0, fail = 0;
function T(name, fn) {
  try { fn(); pass++; console.log('  ok ' + name); }
  catch (e) { fail++; console.log('  FAIL ' + name + ' :: ' + e.message); }
}

// ─────────────────────────────────────────────────────────────
// A. appeal_to_ignorance 否定镜像族（r289 探针 2/5 穿透缺口）
// 结构：无法证明 X 的否定面（无效/不存在/不灵/行不通）→ 兑换成肯定面成立
// ─────────────────────────────────────────────────────────────
const A2I_ATTACK = [
  // 否定谓语形 × 肯定结论形（双腿共现）
  '没人能证明这款产品无效，所以它肯定有效。',
  '科学无法解释这种现象，说明超自然力量存在。',
  '没人能证实这座庙不灵，说明庙是真的灵。',
  '你拿不出不在场的证据，就说明你在现场。',
  '没有人能证明这个方法行不通，所以它一定行得通。',
  '至今没人能证明这个理论不成立，可见它是成立的。',
  '谁也解释不了这种巧合，只能说是天意注定。',
  '没人能证明他说的是假话，所以他一定是对的。',
  '你举不出反证，说明这个方案没问题。',
  '现代医学还解释不了这个病例，说明是超自然现象。',
  // 英文镜像族
  'No one has proven this product ineffective, so it must be effective.',
  'Science cannot explain this phenomenon, so the supernatural exists.',
  'No one can disprove the theory, therefore it is true.',
  'Nobody has refuted the claim, so it must be valid.',
  'You cannot show any evidence that it does not work, so it works.',
  'Science cannot account for this, so it is clearly real.',
];

const A2I_BENIGN = [
  '目前尚无研究证明这种微量元素与失眠直接相关，建议继续观察。',
  '谁主张谁举证，这是讨论的基本原则。',
  '没人能证明这款产品无效，但也不能就说它一定有效，还需要双盲试验。',
  '科学暂时解释不了这个现象，但这不等于超自然力量存在，可能只是现有模型不足。',
  '不能据此认定他在现场，缺乏证据时应当存疑。',
  '没有证据表明这个品牌更可靠，我们按实测数据排名。',
  '他拿不出证据支持自己的主张，所以这个主张暂时不被接受。',
  '没人见过它失效，但它也没经过大规模验证，不能下结论。',
  '尚未有人证明该定理，但已有大量数值实验支持，学界持开放态度。',
  '这个方案的反例还没找到，不过我们会继续测试。',
  'No one has proven it false, but that does not mean it is true.',
  'Science cannot explain this yet, so more evidence is needed.',
  'More research is required before we can conclude anything.',
  'We could not disprove it, but we also have no positive evidence.',
  'The absence of evidence is not evidence of presence here.',
];

console.log('== A. appeal_to_ignorance 否定镜像族 ==');
for (const t of A2I_ATTACK) {
  T('attack: ' + t.slice(0, 34), () => {
    const r = hf.gate(t);
    const findings = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    assert.ok(r.gate.action !== 'pass' || findings.length > 0,
      '穿透：gate=' + r.gate.action + ' findings=' + findings.join(','));
  });
}
for (const t of A2I_BENIGN) {
  T('benign: ' + t.slice(0, 34), () => {
    const r = hf.gate(t);
    const findings = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    assert.ok(r.gate.action === 'pass' || findings.indexOf('appeal_to_ignorance') === -1,
      '误伤 appeal_to_ignorance：gate=' + r.gate.action + ' findings=' + findings.join(','));
  });
}

// 注入删条：删除 BURDEN_MIRROR / CONCLUDE_MIRROR 常量 → 攻击应变红
const inj = a2i.__internals;
if (typeof inj === 'function') console.log('  internals keys:', Object.keys(inj()).join(','));
else console.log('  internals: (module does not export __internals — injection via source patch)');

// ─────────────────────────────────────────────────────────────
// B. gamblers_fallacy 日常事件连发族（连发 × 该反转）
// ─────────────────────────────────────────────────────────────
const GF_ATTACK = [
  '他连续迟到五天，今天该准时到一次了。',
  '这个月一直下雨，周末该放晴了。',
  '我连挂三科，这次该过了。',
  '连着加班两周，这周该轻松一点了。',
  '球队连败四场，下一场该赢了。',
  '他接连被拒三次，第四次该成功了。',
  '这周天天失眠，今晚该睡个好觉了。',
  '连着三天没吃早饭，今天该吃点东西了。',
  '她一向倒霉，这次该转运了。',
  '他一连输了三把，下一把该赢了。',
];

const GF_BENIGN = [
  '他连续迟到五天，主管已经找他谈话了。',
  '这个月一直下雨，防汛部门发布了预警。',
  '我连挂三科，需要重新规划学习方法。',
  '连着加班两周，团队决定下周调休。',
  '球队连败四场，教练组开始复盘战术。',
  '概率只是历史统计，具体到单次结果未必发生。',
  '连着三天没吃早饭，体检报告显示胃酸偏高。',
  '她一向着重细节，这次也会按时交付。',
  '这个月一直下雨，水库蓄水量达到了去年同期水平。',
  '他一连输了三把，账面亏损已经超出预算。',
];

console.log('== B. gamblers_fallacy 日常事件连发族 ==');
for (const t of GF_ATTACK) {
  T('attack: ' + t.slice(0, 34), () => {
    const r = hf.gate(t);
    const findings = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    assert.ok(r.gate.action !== 'pass' || findings.length > 0,
      '穿透：gate=' + r.gate.action + ' findings=' + findings.join(','));
  });
}
for (const t of GF_BENIGN) {
  T('benign: ' + t.slice(0, 34), () => {
    const r = hf.gate(t);
    const findings = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    assert.ok(r.gate.action === 'pass' || findings.indexOf('gamblers_fallacy') === -1,
      '误伤 gamblers_fallacy：gate=' + r.gate.action + ' findings=' + findings.join(','));
  });
}

console.log(`\nRESULT pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);
