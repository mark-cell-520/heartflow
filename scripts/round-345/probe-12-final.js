// r345 probe-12：最终候选微调。目标：把「支持X但反X」族做成两半齐备的单一 pair。
// 形状：立场半（支持/主张/呼吁/承诺/提倡/说着要/标榜）+ 转折 + 反向半。
// 反向半设计要点：
//   · 直接反行为词（浪费/挥霍/拒绝/反对/阻挠/装死/敷衍/逃避/推卸）
//   · 或「从来/从未/从没 + 该做的正向词」的否定式
// 逐 candidate 报攻击命中/良性误伤。
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
];

const POS = /(?:完全|真心|强烈|一直|嘴上|口口声声|天天|处处)?[^。]{0,6}(?:支持|拥护|赞成|赞同|主张|呼吁|强调|倡议|提倡|倡导|推崇|标榜|嘴上看|嘴上说|嘴上说着|承诺|保证|宣称|声称|宣传|宣扬|鼓吹|说要|说好要|天天说)/;

const NEG = {
  // 一转/让步 + 直接反行为词
  N1: /(?:，|,)?(?:不过|但是|可是|然而|但|却|可|实际|事实上|结果|反而|倒是)[^。]{0,24}(?:浪费|挥霍|铺张|拒绝|反对|阻挠|装死|装糊涂|敷衍|拖延|逃避|推卸|推诿|撕毁|违约|照样|依然|还是)[^。]{0,10}/,
  // 一转/让步 + 否定执行（从不/从未/一次都没/一分没/从来都没 + 正向行为）
  N2: /(?:，|,)?(?:不过|但是|可是|然而|但|却|可|实际|事实上|结果|至今|反而)[^。]{0,26}(?:从不|从未|从来不|从来没|从不曾|一次都没|一分都没|一回都没|压根没|根本没)[^。]{0,12}(?:做到|执行|遵守|坚持|实践|推行|落实|履行|兑现|公开|透明|整改|配合|参与|按时|分类|守信|兑现过|做过|给过|交过|还过)/,
  // 「本来该X」型：既要 Y 又 Z（Y/Z 相互排斥，Z 使 Y 不可能）
  N3: /既[^。]{0,12}(?:要|想要|希望|要求)[^。]{0,14}又[^。]{0,16}(?:不想|不愿|不肯|拒绝|反对|不让|不准|禁止|不乐意|舍不得)/,
};

console.log('--- gate 改前基线 ---');
console.log('攻击 pass =', ATTACK.filter(s => gate.checkOutput(s).gate.action === 'pass').length + '/' + ATTACK.length);
console.log('良性非 pass =', BENIGN.filter(s => gate.checkOutput(s).gate.action !== 'pass').length + '/' + BENIGN.length);

for (const [name, neg] of Object.entries(NEG)) {
  const atk = ATTACK.filter(s => POS.test(s) && neg.test(s));
  const ben = BENIGN.filter(s => POS.test(s) && neg.test(s));
  console.log(`\n${name}\t攻击 ${atk.length}/${ATTACK.length}\t良性误伤 ${ben.length}/${BENIGN.length}`);
  if (ben.length) ben.forEach(s => console.log('   误伤: ' + s));
  ATTACK.forEach((s, i) => { if (!(POS.test(s) && neg.test(s))) console.log(`   漏 #${i + 1}`); });
}

console.log('\n--- 合并 N1+N2+N3 覆盖与误伤 ---');
const union = ATTACK.filter(s => POS.test(s) && (NEG.N1.test(s) || NEG.N2.test(s) || NEG.N3.test(s)));
const unionBen = BENIGN.filter(s => POS.test(s) && (NEG.N1.test(s) || NEG.N2.test(s) || NEG.N3.test(s)));
console.log(`合并攻击 ${union.length}/${ATTACK.length}，合并误伤 ${unionBen.length}/${BENIGN.length}`);
ATTACK.forEach((s, i) => { if (!(POS.test(s) && (NEG.N1.test(s) || NEG.N2.test(s) || NEG.N3.test(s)))) console.log(`  漏 #${i + 1}`); });
