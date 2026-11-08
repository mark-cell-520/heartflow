// r260 模块层干跑：攻击集必须命中、官方良性语料必须零误命中
'use strict';
const path = require('path');
const ROOT = '/data/home/heartflow';
const { detectOmissionBias } = require(path.join(ROOT, 'src', 'omission-bias.js'));

const ATTACKS_ZH = [
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
const ATTACKS_EN = [
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
// 已知缺口（有意不收）：只有不作为指称、无豁免/不对称断言的句子——
// 家族判据要求双腿，这些属于事实陈述/批评，不属不作为偏误。
const KNOWN_GAP = [
  'We knew about the problem but we did not lift a finger.',
  'We just stood by and watched it happen.',
];
const BENIGN_HARD = [
  // 概念教学
  'Omission bias is a documented cognitive bias in the psychology literature.',
  '不作为偏误是心理学文献中记载的决策偏误。',
  '组织行为学课程讲了作为与不作为在责任认定上的区别。',
  'The doctrine of acts and omissions has a long history in moral philosophy.',
  // 法律分析
  '见死不救在法律上可能构成不作为犯罪，需要具体分析。',
  '法律规定负有特定作为义务而不履行，可能构成违法。',
  'Under the law, failing to act can constitute an offense when there is a duty.',
  // 双侧并举
  '作为和不作为要按同一标准评估，不可偏废。',
  'We must weigh both acts and omissions equally before assigning blame.',
  '评价时要分开看待主动作为与被动不作为两种情形。',
  // 纯描述 / 事实陈述
  '他在一旁观看，没有参与打斗。',
  '他主动推了人，这是作为；旁观者没有动手，这是另一回事。',
  '委员会比较了两个方案的期望值与不确定性区间。',
  '我们评估了每个方案的机会成本，包括放弃的替代用途。',
  'The empty seats were filled with eligible applicants from the waiting list.',
  'The idle server was shut down to save energy costs.',
  '他没有参与那次行动，这是记录在案的事实。',
  '虽然情况不明，但项目组决定按预案待命，暂不干预。',
  '预算未用完部分按规定结转下一年度。',
  '他选择不介入纠纷，保持中立立场。',
  'He chose not to get involved in the dispute and stayed neutral.',
  '公司没有报告这起小事故，因为按规章它未达上报标准。',
  // 单腿句（只有不作为指称 / 只有豁免断言）
  '我们袖手旁观了很久。',
  'The team failed to act on the recommendation.',
  '这事责任不全在他。',
  'This is not entirely his responsibility.',
];

console.log('=== 攻击集（模块层必须命中）===');
let hitN = 0;
for (const t of ATTACKS_ZH.concat(ATTACKS_EN)) {
  const r = detectOmissionBias(t);
  if (r.hit) hitN++;
  console.log((r.hit ? 'HIT ' : 'MISS') + '  ' + t.slice(0, 40) + (r.hit ? '  :: ' + r.details : ''));
}
console.log('攻击命中 ' + hitN + '/' + (ATTACKS_ZH.length + ATTACKS_EN.length));

console.log('=== 疑难良性（模块层必须零命中）===');
let fp = 0;
for (const t of BENIGN_HARD) {
  const r = detectOmissionBias(t);
  if (r.hit) { fp++; console.log('FP!!  ' + t.slice(0, 40) + '  :: ' + r.detail); }
}
console.log('疑难良性误命中 ' + fp + '/' + BENIGN_HARD.length);

console.log('=== 官方良性语料 ===');
function toArray(v) {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') return Object.values(v).flat();
  return [v];
}
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

let total = 0, hits = 0;
const offenders = [];
for (const [label, arr] of sets) {
  let n = 0;
  for (const s of arr) {
    const text = typeof s === 'string' ? s : (s && (s.text || s.input || s.content));
    if (typeof text !== 'string' || !text) continue;
    n++; total++;
    const r = detectOmissionBias(text);
    if (r.hit) { hits++; offenders.push({ label, text: text.slice(0, 60), detail: r.detail }); }
  }
  console.log(label + ' 良性样本 ' + n + ' 条');
}
console.log('──────────────────────────────────────────────');
console.log('合计良性样本 ' + total + ' 条，本维度误命中 ' + hits + ' 条');
for (const o of offenders) console.log('  [FP] ' + o.label + ' :: ' + o.text + ' :: ' + o.detail);
