// [v6.7.130 第 300 轮] probe-8-zh-idx：FP 归因到具体正则下标
// 纪律：只报数字与形状。样本在 scripts/round-300/ 各探针内。
// probe-7 的 eval 提取失败（正文字面量含注释与转义）。改为提取数组体写入
// 临时模块再 require，拿到真实 RegExp 对象数组。
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

function ppf(t) {
  const r = checkOutput(t);
  return r && r.findings
    ? r.findings.some(f => String(f.dimension || '').indexOf('pseudo_profundity') !== -1)
    : false;
}

const idxSrc = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const mArr = idxSrc.match(/const PSEUDO_PHILOSOPHY_ZH = \[([\s\S]*?)\n\];/);
if (!mArr) { console.log('未定位数组'); process.exit(1); }
const tmp = path.join(os.tmpdir(), 'pp-zh-r300.js');
fs.writeFileSync(tmp, "'use strict';\nmodule.exports = [" + mArr[1] + "\n];\n");
const PP = require(tmp);
console.log('条目数=' + PP.length + ' 其中 RegExp=' + PP.filter(x => x instanceof RegExp).length);

const FP_SAMPLES = [
  '延期不是排期问题，是需求本质还没定',
  '指标下滑不是投放问题，是这次改动意义不大',
  '对不上不是查询错，是数据源才是真相',
  '活跃度下降不是推荐问题，是产品成长阶段的正常波动',
  '这次拆分不是架构问题，是团队自由度不够',
  '召回率低不是模型问题，是特征才是灵魂',
  '崩溃不是内存问题，是连接池才是答案',
  '延迟不是网络问题，是序列化才是过程',
];
const dist = {};
for (const s of FP_SAMPLES) {
  const hits = [];
  for (let i = 0; i < PP.length; i++) {
    if (PP[i] instanceof RegExp && PP[i].test(s)) hits.push(i);
  }
  for (const i of hits) dist[i] = (dist[i] || 0) + 1;
  console.log('idx=' + JSON.stringify(hits) + ' | gate=' + (ppf(s) ? 'FP' : 'ok'));
}
console.log('idx_分布=' + JSON.stringify(dist));
// 打印命中下标对应的源码行（用 grep 定位，方便在 src 里改）
const lines = idxSrc.split('\n');
let cur = -1, lineOf = [];
lines.forEach((l, n) => {
  const re = /const PSEUDO_PHILOSOPHY_ZH = \[/;
  if (re.test(l)) cur = n + 1;
  if (cur > 0 && n + 1 >= cur) lineOf.push(n + 1);
});
console.log('数组起始行=' + cur + ' 占用行数=' + lineOf.length);
