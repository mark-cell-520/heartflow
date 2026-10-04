// r433 诊断2：为什么删营销词条件后三条件样本仍零漏出？
// 逐条打印样例的 count / 各条件 / exempt 路，找阻塞豁免的其它条件。
'use strict';
const { checkUnsupportedClaim } = require('../src/index.js');

const re = {
  anchor: /(?:根据|据|按|参照|详见|参见|来自|出自)[^。]{0,30}(?:第[一二三四五六七八九十\d]+[章节]|附录|表\s*\d+|图\s*\d+|\b\d+\.\d+\s*节|测试集|数据集|公开数据集)/,
  metric: /(?:延迟|吞吐|准确|精度|召回|精确率|误报|漏报|性能|内存|耗时|响应时间|并发|负载|容量|带宽|占用|速率|错误|故障|成功率|覆盖率|转化|留存|点击|播放|阅读|打开|样本|基准|基线|QPS|TPS|P99|P95|P50|latency|throughput|accuracy|precision|recall|footprint|p99|p95|qps|tps|uptime|retention)/i,
  promo: /(?:治愈率|治愈|有效率|疗效|寿命|症状|疾病|病情|患者|病人|满意|信赖|口碑|好评|销量|营收|市场份额|市场占有率|复购)/,
  causal1: /(?:延长|缩短|增加|减少|降低|提高|治愈|根治|改善|恢复|预防)[^。]{0,12}(?:寿命|风险|疾病|症状|疗效|效果|率|时间)/,
  causal3: /(?:能|可以|会)[^。]{0,10}(?:治愈|根治|预防|延长|降低|提高)/,
};

const CASES = [
  ['A', '实验表明该疗法的治愈率达到 99.7%，患者的转化率提升 12.4%，详见附录 B。'],
  ['B', '根据第 3.2 节的临床数据，该疗法的治愈率达到 99.7%，患者留存率提升 12.4%。'],
];

for (const [n, t] of CASES) {
  const r = checkUnsupportedClaim(t);
  const flags = {
    anchor: re.anchor.test(t),
    metric: re.metric.test(t),
    promo: re.promo.test(t),
    causal1: re.causal1.test(t),
    causal3: re.causal3.test(t),
  };
  console.log(`${n}: score=${r.score} count=${r.count} flags=${JSON.stringify(flags)} claims=${JSON.stringify(r.claims.map(c => c.matched))}`);
}
