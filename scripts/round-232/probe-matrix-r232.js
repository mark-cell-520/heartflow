// r232 变体矩阵实测（探针，非测试断言）
const fut = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/appeal-to-future.js');
const rum = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/appeal-to-rumor.js');
const con = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/confirmatory-evidence.js');

const attacks = [
  // 诉诸未来 攻击变体（≥5）
  ['fut', '未来的技术终将解决这个问题，所以现在不用采取行动。'],
  ['fut', '将来的研究会证明今天的一切都是错的，所以现在不必较真。'],
  ['fut', 'Future research will surely vindicate this approach, so we should adopt it now.'],
  ['fut', '后人终将证明我是对的，现在怎么骂都无所谓。'],
  ['fut', '科学会证明这一切，因此现在不必在意反对意见。'],
  ['fut', '未来的科学会澄清所有疑问，所以尽管现在推进。'],
  ['fut', 'History will show we were right, so no need to worry now.'],
  ['fut', '将来总有一天研究会证明，现在照着做就行。'],
  // 传闻即事实 攻击变体（≥5）
  ['rum', '外界都这么传，肯定不是空穴来风。'],
  ['rum', '传的人多了，自然就有真的成分。'],
  ['rum', 'Rumors like this are never baseless.'],
  ['rum', '这条消息已经传遍全网，说明事情不简单。'],
  ['rum', '大家都在议论这件事，恐怕背后有事。'],
  ['rum', 'When so many people are saying it, there must be some truth to it.'],
  ['rum', '越传越玄，可见不全是编的。'],
  ['rum', '一传十十传百，无风不起浪。'],
  // 证实性取证 攻击变体（≥5）
  ['con', '实验反复验证了这个理论，说明它是成立的。'],
  ['con', '实验反复证实了这个假说，说明它是对的。'],
  ['con', 'Repeated experiments have confirmed the hypothesis, so it is true.'],
  ['con', '这个结论被多次实验验证，所以它就是真理。'],
  ['con', '研究一再确认了这一点，可见它是可靠的。'],
  ['con', 'The theory has been confirmed by numerous studies, so it must be valid.'],
  ['con', '大量实验反复验证了这一结果，板上钉钉。'],
  ['con', '重复实验不断证实这个结论，毫无疑问它是对的。'],
];

const benign = [
  // 诉诸未来 良性（含边缘良性）
  ['fut', '这项技术目前不成熟，预计未来五年会有突破，因此现在应启动预研。'],
  ['fut', '诉诸未来是一种逻辑谬误，指用未来的证据为当下结论背书。'],
  ['fut', '数据显示用户量在增长，未来可能进一步扩大。'],
  ['fut', '将来的科学会证明这一切吗？'],
  ['fut', 'Appeal to future is a fallacy covered in our textbook.'],
  // 传闻即事实 良性（含边缘良性）
  ['rum', '这条传闻已传播三天，目前没有任何证据支持，需警惕。'],
  ['rum', '据新华社报道，官方已发布通报否认了该传言。'],
  ['rum', '传播学课程里我们讲过谣言传播的机制。'],
  ['rum', '传得再广也不能证明它是真的，需要交叉验证。'],
  ['rum', 'The rumor has been debunked; there is no evidence.'],
  ['rum', '这条消息已经传遍全网。'],
  // 证实性取证 良性（含边缘良性）
  ['con', '该理论经过多次独立复现，目前证据支持它，但尚未排除X。'],
  ['con', '这个实验我们重复做了三次，数据都记录在附录。'],
  ['con', '证实性偏差是心理学教材里的经典概念。'],
  ['con', '多次验证并不能说明它是真理，还需要证伪设计。'],
  ['con', 'The results are preliminary and need replication.'],
];

const fn = { fut: fut.checkAppealToFuture, rum: rum.checkAppealToRumor, con: con.checkConfirmatoryEvidence };
let aHit = 0, aTot = 0, bPass = 0, bTot = 0;
const fails = [];
for (const [k, t] of attacks) {
  aTot++;
  const r = fn[k](t);
  if (r.score > 0 && r.findings.length) { aHit++; }
  else fails.push('MISS[' + k + '] ' + t + ' -> score=' + r.score + ' exempt=' + r.exempt);
}
for (const [k, t] of benign) {
  bTot++;
  const r = fn[k](t);
  if (r.score === 0) { bPass++; }
  else fails.push('FP[' + k + '] ' + t + ' -> score=' + r.score);
}
console.log('attacks hit: ' + aHit + '/' + aTot);
console.log('benign pass: ' + bPass + '/' + bTot);
if (fails.length) console.log('--- issues ---\n' + fails.join('\n'));
