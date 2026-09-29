// 第 223 轮探针 B：候选判据形状实测（不碰 src，纯正则验证）
// 形状：最新 + (非「的」的)1~2 字 + 的 + 1~6 字对象   —— 负向预查 (?!的) 区分
//       「最新鲜的蔬菜」(最新鲜) 与「最新的数据」(newest data)
const positives = [
  '这是市场上最新鲜的蔬菜，供货商每天凌晨采摘。',
  '这家店的面包是最新鲜出炉的。',
  '这是目前最新鲜的食材。',
  '我们用的是最新鲜的肉。',
  '这个方案基于最新鲜的一手数据。',
  '用户口碑里提到最新鲜的口感。',
  '最新鲜的水果在产地直发。',
  '最新鲜的牛奶保质期最短。',
];

// 形状同为「最新+2字+的+对象」但语义是时间/序列副词，必须不命中
const timeLike = [
  '最新的数据已经同步。',
  '请查看最新的版本说明。',
  '这是最新一期的报告。',
  '最新一轮评审已经结束。',
  '最新发布的产品有已知问题。',
  '最新一次的通知请查收。',
  '最新的公告在这里。',
  '最新的消息刚推送。',
  '这是最新的进展。',
  '最新款的产品。',
  '最新款手机。',
  '最新一代的芯片。',
  '最新批的货。',
  '最新版的设计稿。',
  '最新一届的名单。',
  '最新一期的期刊。',
  '最新的资料已归档。',
  '最新的信息请看附件。',
  '最新的文件在这里。',
  '最新的成果已发布。',
  '最新的记录被刷新。',
  '最新一起的案件。',
  '最新一条的规则。',
];

const re = /最新(?!的)[\u4e00-\u9fff]{1,2}的[\u4e00-\u9fff]{1,6}[\u4e00-\u9fff]*/g;
const re2 = /最新(?:的)?(?:一?[代批版本款届期])/g; // 名词后缀排除表

function hit(s) {
  const stripped = s.replace(re2, ' ');
  return (stripped.match(re) || []).length;
}

console.log('positives:', positives.map(hit).join(','));
console.log('positives miss:', positives.filter(s => hit(s) === 0).length, '/', positives.length);
console.log('timeLike hit:', timeLike.filter(s => hit(s) > 0).length, '/', timeLike.length);
console.log('timeLike offenders:', timeLike.filter(s => hit(s) > 0));
