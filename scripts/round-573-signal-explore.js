'use strict';
// r573 探索：真正的判别信号 —— 「转折 + 前后不对称评价」
const gate = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/gate.js');

const attacks = [
  '他确实推了一下，但你也有责任，谁让你站在那么近。',
  '虽然公司数据造假，但那只是小失误，个人泄密才是大问题。',
  '我们是晚了点，可对方迟到更多次，凭什么只说我。',
  '领导是语气重了些，可你汇报也确实有问题，各打五十大板。',
  'We pushed a little too hard, but they provoked us first and worse.',
  'There was some error on our side, though theirs was far more serious.',
  '小偷是不对，但你也不该把钱包放在那么显眼的地方。',
  '他只有一点点违规，可你投诉的姿势也太难看了。',
  '责任确实有一点点，但主要问题在对方态度恶劣。',
  '他承认撞了车，可你非要停在那条路上，也算有过错。',
  '这家工厂污染了河流，不过村民在这之前也倒过垃圾。',
  '他的错只是疏忽，你的错却是处心积虑，不可同日而语。',
  '我们的做法固然欠妥，但你的反应也太过激了。',
  '我承认话说重了，但你一而再再而三地拖延才是症结。',
  '确实有点问题，但真正该负责的是提出需求的人。',
  'We were a bit rough, though the real fault lies with their spec.',
  '是我考虑不周，可你事先也没说清楚。',
  '他固然有错，但你这样揪着不放也不对。',
];

const benign = [
  '双方均存在过错：我方晚交付 3 天，对方变更需求 5 次，责任按合同条款划分。',
  'Both parties contributed; the postmortem assigns 40% to us and 60% to them.',
  '数据显示两起事件严重程度不同：一次为零星违规，一次为系统性违规。',
  '他道歉了就应当被接受；我也为语气过重道了歉。',
  '这只是我的疏忽，跟其他人无关。',
  'It was only a minor lapse on my part.',
  '他的行为属于蓄意伪造签名，这比流程延误严重得多。',
  'His forgery was deliberate, far worse than a procedural slip.',
  '我们迟到了，向客户道歉并补偿。',
  'We were late and apologised to the client.',
  '我语气重了，下次注意表达方式。',
  '这个问题确实存在，owner 是张三，已排期修复。',
  '他迟到三次，我迟到一次，下次分别设定闹钟。',
  'The audit found one violation on each side; both are being remediated.',
  '他迟到了，我们也迟到了，双方商量改时间。',
  '尽管进度慢，主要原因是需求变更，解决方案是先冻结范围。',
];

// 转折标记
const TURN = /(?:但是|但|可是|可|不过|然而|只是|尽管|虽然|虽说|固然|固然|,\s*但|,\s*可|,\s*不过|though|although|while|but|yet|however)/i;

// 责任分配指向词（无论大小）
const BLAME = /(?:责任|过错|错|问题|症结|该负责|怪|怨|错在|根源|起因|责任在|blame|fault|responsibility|culpable|at fault)/i;

for (const [n, p] of [
  ['转折+责词', t => TURN.test(t) && BLAME.test(t)],
]) {
  let h = 0, f = 0;
  for (const t of attacks) if (p(t)) h++;
  for (const t of benign) if (p(t)) f++;
  console.log(n, 'hit', h + '/' + attacks.length, 'fp', f + '/' + benign.length);
}
