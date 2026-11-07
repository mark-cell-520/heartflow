// r238 模块干跑：tragedy-of-commons.js 对攻击/良性/边界/官方语料的实测
// 运行：node coordination/agent4/probes/r238-module-dryrun.js
'use strict';
const path = require('path');
const { detectTragedyOfCommons } = require(path.join(__dirname, '..', '..', '..', 'src', 'tragedy-of-commons.js'));

const ATTACKS_ZH = [
  '这片草场是公共的，每家多养几只羊自己就多挣一份，至于草场退化那是大家一起承担的。',
  '地下水不要钱，我们村多种一季稻就多一季收入，谁节省谁吃亏。',
  '渔场是大家的，每条船都加大捕捞量，最后资源枯竭，可每条船的选择都是理性的。',
  '这片林子的野菜是大家一起采的，谁采得多谁占便宜，采秃了也是全体村民一起承受。',
  '公共车位不收费，每位车主都想方设法长时间占着，最后谁也别想停上车。',
];
const ATTACKS_EN = [
  'The pasture is shared, so each family that adds more cattle earns more, and the overgrazing cost falls on everyone.',
  'The aquifer is free, so every farm that pumps more this season gains, even though the water table keeps dropping.',
  'Each trawler expanded its catch because the fish stock belonged to no one, and that was the rational choice for every captain.',
  'Since the fishery is open to all, every boat that fishes harder this season profits more, and the depleted stock is everyone\u2019s problem.',
  'The river is a free dumping ground, so each factory that discharges more saves on treatment costs while the pollution is shared by all.',
];

const BENIGN_HARD = [
  // 中性机制描述 + 治理结果（正确分析）
  '公地悲剧指的是无主资源容易被过度使用，哈丁1968年提出这个概念，至今仍有争议。',
  '牧场公有确实诱发了过度放牧，后来实行承包到户，退化才止住。',
  '公共资源治理有奥斯特罗姆总结的自主治理范式，并非必然走向悲剧。',
  'Overfishing depleted the stock because no single fisherman had an incentive to conserve—the textbook commons problem.',
  'The village manages its commons through quotas and rotation, which has avoided depletion.',
  // 治理方案句
  '公共草场需要定额放牧，超载的部分按户罚款，退化就能控制住。',
  '这片渔场由村里统一轮捕，休渔期严格执行，二十年来资源稳定。',
  'Shared pastures need grazing quotas and per-household penalties, or the grassland degrades.',
  '共有资源容易耗竭，所以才需要确权和配额管理。',
  // 否定/纠偏形
  '草场并不是无主的，每户都有明确的承包界线，超载要罚款。',
  '多养几只羊也未必划算，草料成本和疫病风险都在上升。',
  'The aquifer is not free to use—pumping permits are capped per farm.',
  // 概念讨论
  '这堂课讲公地悲剧：共享资源上的个体理性如何汇成集体非理性。',
  'Hardin\u2019s tragedy of the commons explains why open fisheries collapse.',
];
const BENIGN_NORMAL = [
  '公司今年加大了研发投入，政策扶持新兴产业。',
  '我们村去年安装了光伏，人均收入提高了两成。',
  '公共图书馆周末人很多，需要提前预约座位。',
  '地下水超采已经引起地面沉降，水利部门出台了限采令。',
  'The company increased R&D spending and launched three new products.',
  'City parking is free on weekends, which keeps the downtown busy.',
  'Households saved more last year and bank deposits rose sharply.',
  'The fishery collapsed decades ago; today strict quotas have rebuilt the stock.',
];

const CONCEPT = [
  '教材在讲公地悲剧时举例：草场是公共的，每家多养羊自己多挣钱，退化大家一起扛。',
  'Tragedy of the commons: the pasture is shared, so each family that adds more cattle earns more—textbook material.',
];

const BOUNDARY = [
  '排污成本转嫁给下游居民，工厂自己省了处理费。',            // cost_externalization 领地（无共享资源取用结构）
  '悬赏捕蛇，结果有人养蛇领赏，蛇患反而更严重了。',          // perverse_incentive 领地（量化奖惩设计）
  '他这么有钱，说明他的判断肯定没错。',                      // appeal_to_wealth 领地
  '每个人都应该为集体着想，不能只考虑自己。',                // 道德呼吁（无取用行为腿）
  '草场是公共的。',                                          // 缺腿②③
  '每家都多养了几只羊。',                                    // 缺腿①（资源属性未出现）
  '成本最后由大家一起承担。',                                // 缺腿①②
];

const MIXED = '草场是公共的，每家多养羊自己多挣钱；The pasture is shared, so each family that adds more cattle earns more.';
const MULTI_ZH = '这片草场是公共的，每家多养羊自己多挣一份；地下水不要钱，谁节省谁吃亏，大家都多抽。';

let pass = 0, fail = 0;
function run(name, list, want) {
  let ok = 0, bad = [];
  for (const t of list) {
    const r = detectTragedyOfCommons(t);
    if (r.hit === want) ok++; else bad.push(t.slice(0, 40) + ' → hit=' + r.hit);
  }
  if (bad.length === 0) { pass++; console.log(`  ✓ ${name}: ${ok}/${list.length}`); }
  else { fail++; console.log(`  ✗ ${name}: ${ok}/${list.length} 未按预期`); bad.forEach(b => console.log('      ' + b)); }
}

console.log('tragedy-of-commons（r238 公地悲剧）模块干跑:');
run('攻击命中 中文 5', ATTACKS_ZH, true);
run('攻击命中 英文 5', ATTACKS_EN, true);
run('疑难良性零误伤 15', BENIGN_HARD, false);
run('常规良性零误伤 8', BENIGN_NORMAL, false);
run('概念讨论豁免 2', CONCEPT, false);
run('边界锁 7', BOUNDARY, false);
run('中英混排多签名', [MIXED], true);
run('中文多签名', [MULTI_ZH], true);

console.log(`\n干跑结果: ${pass} 通过, ${fail} 失败`);
if (fail > 0) process.exit(1);
