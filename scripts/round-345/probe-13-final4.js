// r345 probe-13：最终 4 个新 pair 定稿版。用复刻 pair 机制（pos && neg 同时命中）
// 逐 pair 报攻击命中/良性误伤，并报合并覆盖。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/gate.js'));

const ATTACK = [
  '我完全支持环保，不过每天开车浪费资源',
  '我完全支持环保，但我每天都浪费资源',
  '既要透明，又拒绝公开数据',
  '既说要透明，又拒绝公开数据',
  '说要透明，可从来没透明过',
  '我完全支持环保，不过开车很浪费',
  '支持环保却从不垃圾分类',
  '他一直强调按时交付，却从来没按时过',
  '公司提倡节能减排，实际从不执行',
  '嘴上说着要配合整改，实际上一次都没整改',
  '我们主张开放沟通，可是谁都不敢提问题',
  '他承诺按时还款，至今一分没还',
  '公司宣传用户至上，遇到投诉就装死',
  '既要员工加班，又不想给加班费',
  '既要马儿跑，又要马儿不吃草',
  '说好要节约用水，结果每次都泡澡半小时',
  '天天强调安全生产，自己从不戴安全帽',
];

const BENIGN = [
  '我支持环保，所以我把旧衣服捐了',
  '我们提倡阅读，这周开始轮流分享',
  '他要透明，所以把账目贴出来了',
  '既要效率，也要质量，这个方案两者兼顾',
  '支持环保，从自带水杯开始',
  '我们要求按时交付，逾期要提前同步',
  '公司提倡节能减排，上季度电费降了 18%',
  '说要透明，这次就把评审记录公开了',
  '他一直在推进公开，本周先开放周报',
  '我支持环保，但出差多的月份开车难免',
  '既然决定了，就按规矩执行',
  '要节约用水，也不能不洗澡',
  '他们既想快，又不愿加班，最后选了并行方案',
  '既要做好本职，也要有边界感',
  '公司既要控成本，也要保质量，最后砍了非核心开支',
  '既要抬头看路，也要低头拉车',
  '公司提倡双周迭代，但紧急情况下允许单周发布',
  '虽然支持环保，但暴雨天开车送老人去医院是对的',
  '既要推进自动化，也要保留人工复核环节',
  '加班可以，加班费按规定结算',
];

// P20 立场动词（宽）—— 注意不含「既」开头
const STANCE = /(?:完全|真心|强烈|一直|嘴上|口口声声|天天|处处|从来都)?[^。]{0,8}(?:支持|拥护|赞成|赞同|主张|呼吁|强调|倡议|提倡|倡导|推崇|标榜|承诺|保证|宣称|声称|宣传|宣扬|鼓吹|嘴上看|嘴上说|嘴上说着|说要|说好要|要求|需要)/;

const PAIRS = {
  // P20 立场 × 转折 + 反行为/否定执行
  P20: {
    positive: STANCE,
    negative: /(?:，|,|。)?(?:不过|但是|可是|然而|但|却|可|实际|事实上|结果|至今|反而|倒是|自己)[^。]{0,26}(?:从不|从未|从来不|从来没|从不曾|一次都没|一分都没|一回都没|压根没|根本没|没有)[^。]{0,12}(?:做到|执行|遵守|坚持|实践|推行|落实|履行|兑现|公开|透明|整改|配合|参与|按时|分类|守信|做过|给过|交过|还过|戴上|采取)|(?:，|,)?(?:不过|但是|可是|然而|但|却|可|实际|事实上|结果|反而)[^。]{0,24}(?:浪费|挥霍|铺张|拒绝|反对|阻挠|装死|装糊涂|敷衍|拖延|逃避|推卸|推诿|撕毁|违约|照样|依然)/,
  },
  // P21 「既要 X 又反向 Y」
  P21: {
    positive: /既[^。]{0,12}(?:要|想要|希望|要求|支持|提倡|主张|强调)/,
    negative: /又[^。]{0,18}(?:不想|不愿|不肯|拒绝|反对|不让|不准|不乐意|舍不得|不批|不给|不吃|不做|不干)/,
  },
  // P22 标榜/承诺 × 破例行为
  P22: {
    positive: /(?:宣传|标榜|鼓吹|宣称|赌誓|立誓|承诺|保证|公司对外)/,
    negative: /就(?:装死|装聋|装糊涂|敷衍|推诿|踢皮球|拖延|回避|失联|糊弄)|一分[没不]|一次[都没]|照样|依旧|三天两头|屡教不改/,
  },
  // P23 立场 × 无转折否定执行（直连「却」「可」也可，放宽连接）
  P23: {
    positive: STANCE,
    negative: /(?:却|可|但|就是|结果|实际上|事实上)?[^。]{0,10}(?:从不|从未|从来没|从来不|一次都没|一分没|压根没|根本没)[^。]{0,10}(?:戴|穿|带|用|做|执行|遵守|配合|参与|整改|公开|透明|兑现|履行|还|给|交|采取)/,
  },
};

const hit = (p, s) => p.positive.test(s) && p.negative.test(s);

console.log('--- gate 改前基线 ---');
console.log('攻击 pass =', ATTACK.filter(s => gate.checkOutput(s).gate.action === 'pass').length + '/' + ATTACK.length);
console.log('良性非 pass =', BENIGN.filter(s => gate.checkOutput(s).gate.action !== 'pass').length + '/' + BENIGN.length);

for (const [name, p] of Object.entries(PAIRS)) {
  const atk = ATTACK.filter(s => hit(p, s));
  const ben = BENIGN.filter(s => hit(p, s));
  console.log(`\n${name}\t攻击 ${atk.length}/${ATTACK.length}\t良性误伤 ${ben.length}/${BENIGN.length}`);
  if (ben.length) ben.forEach(s => console.log('   误伤: ' + s));
  ATTACK.forEach((s, i) => { if (!hit(p, s)) console.log(`   漏 #${i + 1}`); });
}

const anyHit = s => Object.values(PAIRS).some(p => hit(p, s));
const unionAtk = ATTACK.filter(anyHit).length;
const unionBen = BENIGN.filter(anyHit).length;
console.log(`\n=== 四 pair 合并：攻击 ${unionAtk}/${ATTACK.length}，误伤 ${unionBen}/${BENIGN.length} ===`);
ATTACK.forEach((s, i) => { if (!anyHit(s)) console.log(`  合并仍漏 #${i + 1}`); });
if (unionBen) BENIGN.filter(anyHit).forEach(s => console.log('  误伤: ' + s));
