// r304：ad_hominem 腿①补「居心叵测 / 文盲」词条前的良性对照检查
// 目的：确认新增词条在良性样本上零误伤（尤其含「外行」自嘲/正当批评样本）
const { checkAdHominem } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/ad-hominem.js');

const BENIGN = [
  '战争是多因共同造成的，资源争夺只是其中一个因素。',
  '逆选择会让定价出错，所以保险公司必须做风险分层。',
  '忽视激励结构会导致道德风险，这正是要监督行为的原因。',
  '搭便车问题存在，所以公共品供给需要显性化贡献。',
  '批评观点要有依据，但对人身的攻击无助于讨论。',
  '诉诸人身是一种逻辑谬误，它用「你是谁」代替「你说了什么」。',
  '我是外行，不太懂，请多多指正。',
  '他虽是业余爱好者，作品却有专业水准。',
  '居心叵测的事我不会做，但我要指出这个方案的风险。',
  '尽管有人质疑他的动机，数据本身支持该结论。',
  '群众的眼睛是雪亮的，大家自然会判断谁对谁错。',
  '在量子力学方面我只是个文盲，这不妨碍我信任物理学家的结论。',
  '公司决定撤销兜底政策，因为道德风险确实存在。',
  'War has many causes; resource competition is only one of them.',
  'Adverse selection means high-risk participants enter the pool first.',
  'Moral hazard arises when risk is shifted onto someone else.',
  'Free-riding is a real problem in public goods provision.',
  'Attacking the person instead of the argument is a logical fallacy.',
  'I am an amateur here — please correct me if I am wrong.',
  'His motives were questioned, but the data stands on its own.',
];
let fp = 0;
for (const t of BENIGN) {
  const r = checkAdHominem(t);
  if (r.hit) { fp++; console.log('FP :', t, '|', r.detail); }
}
console.log(`良性误伤: ${fp}/${BENIGN.length}`);
