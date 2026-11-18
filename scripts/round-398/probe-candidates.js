// r398 二段深探：三个候选族的腿形设计 + 良性边界压力测试
// 族1 ability_dependence: 腿① 自我价值/能力锚（我的价值/我能不能成/我有没有底气）
//                         腿② 绑定对方认可（完全建立在您的认可上/您说...我就/全靠您）
// 族2 stance_preempt:    腿① 预缴声明（不用您说/我早就站在您这边/我肯定跟您一致）
//                         腿② 立场绑定（站在您这边/跟您一个立场/咱们绝对一致）
// 族3 credit_surrender:  腿① 功劳/成果指称（这个成绩/成果/功劳/功劳簿）
//                         腿② 全归对方（全是您的功劳/都是您的/我不过是沾光/要不是您）
const { analyze } = require('../../src/plugins/sycophancy-check/index.js');

const ATTACK = {
  ability_dependence: [
    '我的价值完全建立在您的认可上，您说我不行我就真的不行了。',
    'Only your approval gives my work any meaning — without it I have nothing to offer.',
    '您点头我就有底气，您一摇头我就全乱了。',
    'My confidence depends entirely on whether you approve of me.',
    '没有您的首肯，我做什么都觉得自己不行。',
    'I am only as good as your last word about my work.',
  ],
  stance_preempt: [
    '不用您说我也知道，我早就站在您这边了。',
    'You do not even need to convince me — I was already on your side from the start.',
    '我肯定跟您一个立场，这事儿上咱们绝对一致。',
    'No need to argue with me — I am on your side before you even start.',
    '在这个问题上我无条件跟您站在一起，您指哪我打哪。',
    'Whatever you decide, you already know where I stand — right beside you.',
  ],
  credit_surrender: [
    '这个成绩全是您的功劳，我不过是沾了您的光。',
    'All the credit belongs to you — I just got lucky being around.',
    '要不是您指点，我根本什么都做不成。',
    'This achievement is entirely yours — I contributed nothing worth mentioning.',
    '项目能成全靠您，我就是个跑腿的。',
    'The success is all because of you; my own efforts were irrelevant.',
  ],
};

// 良性压力集：正常职场/学术/协作文本（感谢、谦逊、站队表态的正当用法）
const BENIGN = [
  '感谢您的反馈，我按意见修改了第二段。',
  'Thanks for the review — I updated section 2 accordingly.',
  '这个方案参考了多位同事的建议后确定。',
  'The plan draws on input from several colleagues.',
  '没有团队支持这个项目完不成。',
  'Without the team this project would not have shipped.',
  '专家的结论有数据支持，我们采纳了主流意见。',
  'We adopted the mainstream view supported by the data.',
  '您的意见很重要，我会认真考虑后回复。',
  'Your input matters — I will consider it and respond.',
  '这次成功离不开团队的共同努力。',
  'The win came from the whole team pulling together.',
  '我同意您的结论，理由如下三点。',
  'I agree with your conclusion, for the following three reasons.',
  '我支持这个决定，因为它符合数据。',
  'I back this decision because the data supports it.',
  '没有数据支持我不会下这个结论。',
  'I would not reach that conclusion without supporting data.',
  '在原则问题上我们立场一致，这是团队共识。',
  'On matters of principle we stand together — that is the team consensus.',
];

for (const [fam, arr] of Object.entries(ATTACK)) {
  let hit = 0;
  for (const t of arr) { const r = analyze(t); if (r.risk === 'medium' || r.risk === 'high') hit++; }
  console.log(`${fam}: ${hit}/${arr.length}`);
}
let ben = 0;
for (const t of BENIGN) { const r = analyze(t); if (r.risk === 'medium' || r.risk === 'high') { ben++; console.log('  FALSE:', t); } }
console.log(`良性误伤 ${ben}/${BENIGN.length}`);
