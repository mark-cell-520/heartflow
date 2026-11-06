// r726 探针 3：argument_to_moderation 全族攻击面扫描（找齐所有漏判族）
const { gate } = require('../src/gate.js');

const ATTACK = [
  // 族 A：真理在中间（自足断言）
  '真相永远在中间，立场越极端越有问题。',
  '一个激进一个保守，说明真相就在两者中间。',
  '答案一定在两者中间，这是永恒的道理。',
  '对错从来都在两端之间，不在任何一极。',
  'The truth is always in the middle of any dispute.',
  'The correct answer lies in the middle, by definition.',
  // 族 B：中间=最稳妥/最合理（全称+最高级）
  '两个观点冲突时，取中间立场总是最稳妥的选择。',
  '中间立场必然是正确的，这是永恒的道理。',
  '无论哪一方更占理，折中处理永远是最公平的结果。',
  'The middle position is always the most reasonable one, no matter the evidence.',
  'Splitting the difference is always the fairest way to settle any dispute.',
  'A moderate stance is invariably the most sensible choice.',
  // 族 C：和稀泥/责任均摊式了结
  '双方各打五十大板，各退一步，这事就算了。',
  '一个巴掌拍不响，双方都有责任，各担一半就算了。',
  '这件事谁也说不清，和稀泥和过去算了。',
  '为了平息事态，各打五十大板是最稳妥的处理。',
  // 族 D：双方都有道理（并列免责）
  '这件事没有绝对的对错，所以两方都有道理。',
  '两边其实都有道理，争不出结果来。',
  'Both sides make valid points, so the answer must be a compromise.',
  "There's no absolute right or wrong here, so let's just meet in the middle.",
  // 族 E：极端=错（反向推出中间对）
  '两个观点都太极端，走极端本身就是错的。',
  '极左极右都不可取，只有不偏不倚才是正道。',
  'Extremism on both sides is wrong, so the moderate path must be right.',
  // 族 F：既有锚点（回归）
  '甲方乙方各有过错，真相在中间，各打五十大板才是最公道的处理。',
  '这两种观点都太极端了，正确的答案在它们中间。',
  'Both extremes are wrong, so the truth lies somewhere in the middle.',
];

const BENIGN = [
  // 谈判/交易/和解语境
  '调解员建议双方各让一步，最终双方达成了和解协议。',
  '经过三个小时的谈判，双方各退一步，签下了合同。',
  '双方谈了三个小时，最终各让一步，把交货期定在下月十五号。',
  '这个价格各让一半，是考虑到长期合作关系。',
  '价格谈不拢，双方约定下周再约时间磋商。',
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
  '走极端确实不对，但这不是否定某一方全部论据的理由。',
  // 无关陈述
  '这条路中间有个加油站，开了半小时我们就停下了。',
  '我们不站队，只根据证据判断哪一方更接近事实。',
  '双方在两个方案之间犹豫了很久，最后按成本选了前者。',
  '考试答案在卷子的中间部分，大家可以先看中间再作答。',
  '走廊中间摆着一盆绿植，两边是办公室。',
  // 具体个案折中（有具体情由）
  '这个案子的处理兼顾了双方诉求，是法官综合证据后的裁量。',
  '方案 A 和方案 B 各取所长，融合后的设计更符合现场条件。',
  // 法律/责任分摊语境
  '交通事故责任认定书认定双方负同等责任，各自承担一半损失。',
  '按合同约定，违约责任由双方按过错比例分担。',
];

let hitN = 0, miss = [];
ATTACK.forEach((t, i) => {
  const g = gate(t);
  const dim = (g.dimensions && g.dimensions.argument_to_moderation) || {};
  const ok = dim.count > 0;
  if (ok) hitN++; else miss.push({ i: i + 1, t, action: g.gate.action });
});
console.log(`攻击命中 ${hitN}/${ATTACK.length}（argument_to_moderation 维度直接命中）`);
miss.forEach(m => console.log(`  MISS A${m.i} action=${m.action} | ${m.t}`));

let fpN = 0;
BENIGN.forEach((t, i) => {
  const g = gate(t);
  const dim = (g.dimensions && g.dimensions.argument_to_moderation) || {};
  if (dim.count > 0) { fpN++; console.log(`  FP B${i + 1} action=${g.gate.action} | ${t}`); }
});
console.log(`误伤 ${fpN}/${BENIGN.length}`);
