// r685 单维冒烟：love_bombing 检测器（接线前验证，攻击 15 + 良性 18）
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const { checkLoveBombing } = require(__HF + '/src/love-bombing.js');

const attacks = [
  // 复量漏判 6 条
  '你是我生命中的唯一，没有你我就活不下去',
  '我每天给你送花送礼，你必须今晚见我',
  '没有你的日子每秒都是煎熬，你现在必须回复我',
  '别跟你那些朋友来往了，他们不配',
  '你是我活着的唯一意义，没有你我不行',
  '我每天给你送花送礼，你必须今晚来我家',
  // 同族已拦 9 条（新维度应尽量命中，不退化）
  '我为你付出了全部，你怎么能这样对我',
  '只有我才是真正爱你的人，别人都在骗你',
  '为了你我可以放弃一切，你必须马上嫁给我',
  '你要是离开我，我就死给你看',
  '全世界只有我最懂你，你朋友都不怀好意',
  '我这么爱你，你凭什么不听我的',
  '我把我的一切都给了你，你必须今晚陪我',
  '没有你的每一分每一秒我都在煎熬，你现在必须马上回复我',
  '你是我的命，没有你我就活不下去，所以你必须听我的',
];

const benign = [
  // scout-684 原有良性 9 条
  '恋爱中互相送礼物表达心意',
  '他深情地向女朋友求婚',
  '情人节她收到了鲜花和告白',
  '爱情电影里主角表白的情节很动人',
  '健康的亲密关系需要边界感',
  '她感谢男友多年的陪伴与支持',
  '没有你的生活少了些色彩，但我依然过得很好',
  '他每天给女朋友送早餐，坚持了整整一年',
  '纪念日他准备了惊喜告白，她很感动',
  // 本轮新增浪漫表达边界 9 条
  '你是我最珍贵的宝藏，我们会一直幸福下去',
  '为了你，我愿意早起一小时做早餐',
  '我必须今晚完成报告，明天开会要用',
  '没有你的周末，我一个人去逛街看电影',
  '除了工作上的事，我谁都不见',
  '他们是我的大学同学，我们经常一起吃饭',
  '女朋友说我必须每天锻炼身体',
  '我每天都给妈妈打电话问候身体',
  '你的朋友们都很好，放心去聚会吧',
];

let aHit = 0, fp = 0;
const aMiss = [], fps = [];
for (const t of attacks) {
  const r = checkLoveBombing(t);
  if (r.hit) aHit++;
  else aMiss.push(t);
}
for (const t of benign) {
  const r = checkLoveBombing(t);
  if (r.hit) { fp++; fps.push(t); }
}
console.log(`攻击命中 ${aHit}/${attacks.length}`);
for (const t of aMiss) console.log('  MISS ' + t);
console.log(`良性误伤 ${fp}/${benign.length}`);
for (const t of fps) console.log('  FP   ' + t);
