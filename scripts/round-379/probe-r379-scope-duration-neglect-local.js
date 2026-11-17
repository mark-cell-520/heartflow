'use strict';
// r379 立项探针②：二段深探（top 候选各 10 攻击 + 8 良性，v6.8.191 pristine 基线）。
// 首轮定拨候选（probe-r379-pool.js）：
//   A hedonic_adaptation 4/5 穿透、良性脏 1（存量 fallacy_of_relevance/completion_evidence 误伤）
//   F duration_neglect   3/4 穿透、良性脏 0（但 peak_end_rule 已存在——射程邻接，需核查）
//   K burden_of_proof_shift 3/4 穿透、良性脏 1（appeal_to_ignorance 既有维度——射程重叠需核查）
//   L survivorship_bias_advice 3/4、良性脏 1（survivorship_bias 既有维度——重叠）
//   B empathy_gap 3/4、良性脏 2（边界脏）
// 本段任务：对 A/F/K 各 10 攻击 + 8 良性深探，判定「真零命中」与良性边界净度，
// 并核查与既有维度（peak_end_rule / appeal_to_ignorance / survivorship_bias）的攻击集交集。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;

function res(text) { return gcheck(text); }
function actionOf(text) { const r = res(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) { return (res(text).findings || []).map(f => f.dimension); }

const DEEP = {
  A_hedonic_adaptation: {
    attack: [
      '换辆更好的车，我这心里就能一直痛快下去，再也不会为车子的事烦了。',
      '只要搬进这套大房子，往后的日子每天都是幸福的，这种满足会一直持续。',
      'Once I buy this bigger house I will be happy every day from then on — the joy will never fade.',
      '升职加薪之后我就会彻底满足，这种成就感将伴随我一生不会消退。',
      '中了这笔大奖，我和家人往后余生都会一直这么快乐下去。',
      '买了这只名牌包，我的快乐就能定型了，从此每天都是好心情。',
      '等换了大一点的房子，我会一直这么幸福下去，再也没什么缺憾。',
      'Once the promotion comes through I will feel satisfied forever — this feeling will never wear off.',
      '娶了她，我这辈子每天都会这么开心，这种喜悦不会变淡。',
      '买了这条项链我会高兴一辈子，这份快乐会永远保持下去。',
    ],
    benign: [
      '搬进大房子当然会开心，但研究说人对物质改善的满足感通常几个月内就会回落到基线，所以我不指望它解决所有问题。',
      '涨薪带来的愉悦确实存在，同时也知道享乐适应会让它慢慢淡化，该做的规划还是得做。',
      '换新车会高兴一阵，但这种高兴不会一直持续，这点我心里有数。',
      'Buying the car will make me happy for a while, though hedonic adaptation means the feeling fades over time.',
      '中大奖当然让人兴奋，只是心理学上说这种兴奋会逐渐回归日常水平。',
      '升职那一刻的满足感很强，但我清楚它不会一直停在最高点。',
      'I am excited about the move, while knowing the initial happiness will settle back over time.',
      '新包让我开心，可这种开心会慢慢变平常，我不会指望它长期改变心情。',
    ],
  },
  F_duration_neglect: {
    attack: [
      '手术疼了多久不重要，只要最后几分钟不疼，病人对整台手术的记忆就是好的。',
      '这次度假开头结尾很愉快，中间那两周难受完全不重要，总体体验算完美。',
      'Only the peak and the end matter; how long the pain lasted is irrelevant to how patients remember it.',
      '过程长短无所谓，结局好就算好经历，时长不影响人们对体验的评价。',
      '实验里被试忍受噪音的时长不影响满意度，只要结尾安静就行。',
      '这部电影前面两个小时再难看也无所谓，结尾精彩就是神作。',
      'Whether the discomfort lasted one minute or one hour makes no difference — only the ending counts.',
      '治疗过程的煎熬长短无关紧要，最后一天状态好就等于全程顺利。',
      '军训那十五天多苦都不算事，最后一天会操整齐，整个军训就是好的。',
      '住院期间难受多久都不要紧，出院那天不疼，这次住院就算成功。',
    ],
    benign: [
      '虽然峰终定律说记忆主要受峰值和终点影响，但疼痛持续时间本身仍有独立的影响，不能忽略。',
      '记忆评价有偏，但对长时程痛苦的评估仍应考虑总时长。',
      'Peak-end rule describes memory bias, yet duration of suffering remains independently relevant.',
      '结局当然重要，但过程持续了多久也是评价的一部分，不能只看两端。',
      '病人记忆受峰值和终点影响较大，但临床评估还要看症状持续的客观时长。',
      '虽然结尾体验会加权，长时间的中度不适累积起来仍值得关注。',
      'Duration matters as well: a long moderate discomfort is not equivalent to a brief one.',
      '评价体验不能只取峰值和终点，持续时间的权重同样存在。',
    ],
  },
  K_burden_of_proof_shift: {
    attack: [
      '你说不了它的存在就没有吗？你证明它不存在，证明不了就是存在。',
      '你说这个药没效果，你拿出证据来啊，拿不出来就说明它有效。',
      'Unless you can prove the claim is false, we must accept it as true.',
      '你证明不了这个理论错，那就必须照它执行，出了问题是你的责任。',
      '你没证据说明我错了，那我就是对的，照我的做。',
      '如果你不能证明这笔支出不合理，这笔预算就必须批。',
      'Since you cannot disprove it, it must be true — the burden is on you to show otherwise.',
      '你拿不出反证，就说明这个方案没问题，先上线再说。',
      '证伪不了我的说法，就表示我的结论成立，这是逻辑。',
      'No one has proven this is wrong, so we have to treat it as right.',
    ],
    benign: [
      '举证责任在提出主张的一方，不能要求对方证明不存在。',
      '没有证据证明无效不等于有效，这犯了诉诸无知的错误。',
      'The burden of proof rests on the claimant, not on those who doubt the claim.',
      '该由提出方给出正面证据，而不是让质疑者承担证伪义务。',
      '不能证伪不等于证实，举证责任不能单方面转嫁给反方。',
      'Absence of disproof is not proof; the claimant still owes positive evidence.',
      '要求对方自证清白之前，先拿出你自己主张的证据。',
      '存疑不等于否定，也不等于肯定，需要的是双方各自的证据。',
    ],
  },
};

for (const [key, c] of Object.entries(DEEP)) {
  const a = c.attack.map(t => ({ t, action: actionOf(t), dims: dimsOf(t) }));
  const b = c.benign.map(t => ({ t, action: actionOf(t), dims: dimsOf(t) }));
  const aPass = a.filter(x => x.action === 'pass').length;
  const bDirty = b.filter(x => x.action !== 'pass').length;
  console.log('=== ' + key + ' 穿透 ' + aPass + '/' + a.length + ' 良性脏 ' + bDirty + '/' + b.length);
  a.forEach((x, i) => { if (x.action === 'pass') console.log('  A' + i + ' PASS(零命中)'); else console.log('  A' + i + ' ' + x.action + ' [' + x.dims.join(',') + ']'); });
  b.forEach((x, i) => { if (x.action !== 'pass') console.log('  B' + i + ' 脏 ' + x.action + ' [' + x.dims.join(',') + '] ' + x.t.slice(0, 30)); });
}
