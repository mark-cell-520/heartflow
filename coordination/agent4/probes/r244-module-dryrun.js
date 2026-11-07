// r244 模块干跑：攻击命中 + 良性零误伤（framing-effect）
const { detectFramingEffect } = require('/data/home/heartflow/src/framing-effect.js');

const attacks = [
  '说成活留率九成就愿意做这个手术，说成死亡率一成怎么都不肯做。',
  '同一批数据，包装成成功率高就显得值得投，换成失败率就没人肯签字。',
  '换成乐观的说法团队就支持，换成悲观的措辞同一个方案就被否了。',
  '肉质说的是瘦肉占比多少大家就抢着买，说成脂肪占比多少就没人要。',
  '医生说成功率百分之九十五我立刻签字，说失败率百分之五我马上想换家医院。',
  '同一份体检报告，写指标正常率九成家属就安心，写异常率一成家属就炸了。',
  '政策说成惠及九成群众大家拥护，说成一成群众不受益大家就上街。',
  '招聘启事写每年淘汰率百分之十没人来，写成留存率百分之九十挤破头。',
  '产品介绍写满意度百分之九十好评如潮，写差评率百分之十就被冲了。',
  '九成好评的说法让人放心，一成差评的说法让人警惕，明明是同一批评价。',
  'described as ninety percent survival the patients consented, as ten percent mortality they refused.',
  'the same numbers felt acceptable framed as gains and unacceptable framed as losses.',
  'the proposal died when phrased as failure rate and sailed through as success rate.',
  'phrased as a ten percent failure the same surgery was rejected outright, while the ninety percent survival version was accepted.',
  'the plan sailed when framed as mostly success and died when framed as partly failure.',
];

const benign = [
  '同一组数字用收益框架和损失框架呈现，是研究框架效应的标准做法。',
  '这份报告同时列出了存活率和死亡率，避免单向框架误导。',
  '问卷两种问法都跑了，交叉验证结论不受措辞影响。',
  '销售材料里只保留有利说法，删掉不利数字，这是片面呈现。',
  '这个方案有人赞成有人反对，投票五五开。',
  '前景理论指出损失段的效用曲线比收益段更陡峭。',
  '评估这笔投资时，我们把下行空间和上行空间分别测算后再加权。',
  '坏消息也要如实说，不能包装成好消息。',
  '换个说法也改变不了事实本身。',
  '死亡率数据要如实公布，遮遮掩掩只会失去信任。',
  '好评和差评都要看，只看一边会误判。',
  '调查报告的异常率上升引起了管理层警惕。',
  '留存率下滑让运营团队炸了，产品部连夜开会。',
  '通过率提高大家很安心，未通过的同学决定补考。',
  '成功率和失败率是同一枚硬币的两面。',
  '把裁员说成人员优化，把降薪说成薪酬结构调整。',
  '年终奖花着不心疼，反正是额外的钱。',
  '钱都投了这么多，现在退出就全白费了。',
  'the report lists both survival and mortality rates without spin.',
  'doctors explain risks in both survival and mortality terms so patients can compare.',
  'the wording was changed but the decision stayed the same.',
  'survey respondents were split between the two phrasings.',
  '换个说法再讲一遍，让大家更容易理解。',
  '有人赞成有人反对，讨论很激烈。',
];

let ok = 0;
for (const t of attacks) {
  const r = detectFramingEffect(t);
  if (r.hit) ok++;
  console.log((r.hit ? 'HIT ' : 'MISS') + ' [' + (r.score || 0) + '] ' + (r.details || '').slice(0, 70) + ' :: ' + t.slice(0, 24));
}
console.log('attacks hit: ' + ok + '/' + attacks.length);
let fp = 0;
for (const t of benign) {
  const r = detectFramingEffect(t);
  if (r.hit) { fp++; console.log('FP !!! ' + t.slice(0, 30) + ' :: ' + (r.details || '').slice(0, 70)); }
}
console.log('benign false hits: ' + fp + '/' + benign.length);
