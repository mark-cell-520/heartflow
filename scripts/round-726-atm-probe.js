// r726 探针 2：argument_to_moderation（第194维）漏判 + 误伤全量实测
const { gate } = require('../src/gate.js');

const ATTACK = [
  // 既有形状（应命中，回归锚点）
  '甲方乙方各有过错，真相在中间，各打五十大板才是最公道的处理。',
  '这两种观点都太极端了，正确的答案在它们中间。',
  'Both extremes are wrong, so the truth lies somewhere in the middle.',
  // 本轮新攻击族（r726 探针）
  '真相永远在中间，立场越极端越有问题。',
  '两个观点冲突时，取中间立场总是最稳妥的选择。',
  '双方各打五十大板，各退一步，这事就算了。',
  '一个激进一个保守，说明真相就在两者中间。',
  '无论哪一方更占理，折中处理永远是最公平的结果。',
  '中间立场必然是正确的，这是永恒的道理。',
  'The middle position is always the most reasonable one, no matter the evidence.',
  'Splitting the difference is always the fairest way to settle any dispute.',
  'Both sides are partly at fault, so the truth is always in the middle.',
];

const BENIGN = [
  // 谈判/交易/和解语境
  '调解员建议双方各让一步，最终双方达成了和解协议。',
  '经过三个小时的谈判，双方各退一步，签下了合同。',
  '双方谈了三个小时，最终各让一步，把交货期定在下月十五号。',
  '这个价格各让一半，是考虑到长期合作关系。',
  // 算术/统计取中
  '三个数 3、6、9 的平均值是 6，取中间值就是中位数。',
  // 对冲/证据不足
  '目前证据还不足以在两种假说之间下定论，需要更多数据。',
  '答案可能不止一个，也可能在两者之间，需要更多数据。',
  // 概念/教学转述
  '折中谬误是指把中间立场天然当作正确的立场，这是一种逻辑谬误。',
  'The argument to moderation assumes the middle position is always correct, which is a fallacy.',
  '儒家讲中庸，不是和稀泥，而是分寸感。',
  // 推理否定/正确响应
  '中立不等于正确，关键看谁的证据更充分。',
  '中间立场并不总是对的，还是要看证据。',
  'A neutral position is not automatically correct; it depends on the evidence.',
  // 无关陈述
  '这条路中间有个加油站，开了半小时我们就停下了。',
  '我们不站队，只根据证据判断哪一方更接近事实。',
  '双方在两个方案之间犹豫了很久，最后按成本选了前者。',
  '考试答案在卷子的中间部分，大家可以先看中间再作答。',
  '走廊中间摆着一盆绿植，两边是办公室。',
  '价格谈不拢，双方约定下周再约时间磋商。',
  // 具体个案折中（有具体情由）
  '这个案子的处理兼顾了双方诉求，是法官综合证据后的裁量。',
  '方案 A 和方案 B 各取所长，融合后的设计更符合现场条件。',
];

const r = gate('');
let hitN = 0;
ATTACK.forEach((t, i) => {
  const g = gate(t);
  const dim = (g.dimensions && g.dimensions.argument_to_moderation) || {};
  const ok = dim.count > 0 && g.gate.action !== 'pass';
  if (ok) hitN++;
  console.log(`A${String(i + 1).padStart(2)} ${ok ? 'HIT ' : 'MISS'} action=${g.gate.action} cnt=${dim.count || 0} score=${dim.score || 0} | ${t.slice(0, 36)}`);
});
console.log(`\n攻击命中 ${hitN}/${ATTACK.length}`);

let fpN = 0;
BENIGN.forEach((t, i) => {
  const g = gate(t);
  const dim = (g.dimensions && g.dimensions.argument_to_moderation) || {};
  if (dim.count > 0) {
    fpN++;
    console.log(`B${String(i + 1).padStart(2)} FP   action=${g.gate.action} cnt=${dim.count} | ${t.slice(0, 40)}`);
  }
});
console.log(`\nargument_to_moderation 误伤 ${fpN}/${BENIGN.length}`);
