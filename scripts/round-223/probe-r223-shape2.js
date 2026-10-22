// 第 223 轮探针 C：修正形状实测
// 负向预查挡掉量词/时序动词插入：一|二|两|几|各|每|数|发|公|更|通|报|披
const positives = [
  '这是市场上最新鲜的蔬菜，供货商每天凌晨采摘。',
  '这家店的面包是最新鲜出炉的。',
  '这是目前最新鲜的食材。',
  '我们用的是最新鲜的肉。',
  '这个方案基于最新鲜的一手数据。',
  '用户口碑里提到最新鲜的口感。',
  '最新鲜的水果在产地直发。',
  '最新鲜的牛奶保质期最短。',
  '最新鲜的海鲜今晚到港。',
  '保证最新鲜的状态。',
  '最新鲜的鸡蛋。',
  '卖出最新鲜的肉。',
];

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
  '最新的情况说明。',
  '最新的结果出来了。',
  '最近一段时间的数据。',
  '最新指示已收到。',
  '最新调整后的价格。',
  '最新的消息。',
  '最新的版本。',
];

// 负向预查：插入字不是量词/时序动词首字
const re = /最新(?:的)?(?!一|二|两|几|各|每|数|发|公|更|通|报|披)/g;

function rawHit(s) { return (s.match(re) || []).length; }

// 端到端：只看 gate 是否 pass（用 checkOutput）
const { checkOutput } = require('../../src/gate.js');
function e2e(s) { const r = checkOutput(s); return r.gate.action; }

console.log('== positives 正则命中 ==');
console.log(positives.map(rawHit).join(','));
console.log('miss:', positives.filter(s => rawHit(s) === 0).length, '/', positives.length);
console.log('== timeLike 正则命中（应 0） ==');
console.log(timeLike.filter(s => rawHit(s) > 0));

// 注意：现在 src 还没改，e2e 全是 pass；先记录基线
console.log('== e2e 基线（改前） ==');
console.log('positives pass:', positives.filter(s => e2e(s) === 'pass').length, '/', positives.length);
console.log('timeLike pass:', timeLike.filter(s => e2e(s) === 'pass').length, '/', timeLike.length);
console.log('timeLike verify:', timeLike.filter(s => e2e(s) === 'verify').map(s => e2e(s)));
