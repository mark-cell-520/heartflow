// r433 诊断：删营销词条件后，攻击侧样本逐条评估豁免路径
'use strict';
const { checkUnsupportedClaim } = require('../src/index.js');

const SOURCE_ANCHOR_ZH = /(?:根据|据|按|参照|详见|参见|来自|出自)[^。]{0,30}(?:第[一二三四五六七八九十\d]+[章节]|附录|表\s*\d+|图\s*\d+|\b\d+\.\d+\s*节|测试集|数据集|公开数据集)/;
const METRIC_NOUN_CITED = /(?:延迟|吞吐|准确|精度|召回|精确率|误报|漏报|性能|内存|耗时|响应时间|并发|负载|容量|带宽|占用|速率|错误|故障|成功率|覆盖率|转化|留存|点击|播放|阅读|打开|样本|基准|基线|QPS|TPS|P99|P95|P50|latency|throughput|accuracy|precision|recall|footprint|p99|p95|qps|tps|uptime|retention)/i;
const PROMO_EFFECT_ZH = /(?:治愈率|治愈|有效率|疗效|寿命|症状|疾病|病情|患者|病人|满意|信赖|口碑|好评|销量|营收|市场份额|市场占有率|复购)/;

const CASES = [
  ['疗效+附录', '实验表明该疗法的治愈率达到 99.7%，详见附录 B。'],
  ['疗效+3.2节', '根据测试集数据，患者的有效率提升了 87.3%，见第 3.2 节。'],
  ['三条件齐A', '实验表明该疗法的治愈率达到 99.7%，患者的转化率提升 12.4%，详见附录 B。'],
  ['三条件齐B', '根据第 3.2 节的临床数据，该疗法的治愈率达到 99.7%，患者留存率提升 12.4%。'],
];

for (const [n, t] of CASES) {
  const r = checkUnsupportedClaim(t);
  console.log(`${n}: 瞄点=${SOURCE_ANCHOR_ZH.test(t)} 度量=${METRIC_NOUN_CITED.test(t)} 营销=${PROMO_EFFECT_ZH.test(t)} 当前score=${r.score} count=${r.count}`);
}
