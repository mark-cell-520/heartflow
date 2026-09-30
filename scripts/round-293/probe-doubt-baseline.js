/**
 * r293 探针 1b：把「注释掉」的 3 行（41/45/103）还原成可测文本
 *
 * 探针 1 只在本行可提取正则时才能差分。doubt-engine 的 31/37/39/45/132/133/177
 * 七行已确认函数层分裂，但 41/45/103 三行（r292 静态扫的 15 处里剩下 8 处）
 * 需要另一条路：直接**改正则为半角孪生后**重跑同一批候选文本，看是否新增命中。
 * 这是「注入-删条-必须变红」的镜像：补半角孪生必须让更多候选被拦。
 *
 * 输出：每行补丁前后命中率变化，不输出中文原文。
 */
const path = require('path');
const SRC = path.resolve(__dirname, '..', '..', 'src');
const P = (...a) => console.log(...a);

// 候选构造：用判据自身的中文片段 + 半角逗号分隔（模拟 NFKC 后的管线形态）
const FW2HALF = { '\uFF0C': ',', '\u3002': '.', '\uFF01': '!', '\uFF1F': '?', '\uFF1A': ':', '\uFF1B': ';' };
function fold(s) {
  let r = s;
  for (const [a, b] of Object.entries(FW2HALF)) r = r.split(a).join(b);
  return r;
}

function loadFresh() {
  for (const k of Object.keys(require.cache)) {
    if (k.includes(path.join('src', 'doubt-engine'))) delete require.cache[k];
  }
  return require(path.join(SRC, 'doubt-engine.js'));
}

// 候选样本：全角版 + 半角折叠版成对（形状描述，不贴原文）
const GEN = [
  ['knowledgeBoundary', '光速就是299792458米每秒。'],
  ['knowledgeBoundary', '圆周率约等于3点14159。'],
  ['knowledgeBoundary', '根据最新研究数据2025年中国人口一定是14点1亿人。'],
  ['knowledgeBoundary', '因为系统延迟很高所以用户流失了。'],
  ['knowledgeBoundary', '主要原因是数据库连接池配置不当。'],
  ['knowledgeBoundary', '这个东西就是不可变的常量而已。'],
  ['knowledgeBoundary', '这是最好的解决方案，没有之一。'],
  ['knowledgeBoundary', '我们完成了架构级重构。'],
  ['knowledgeBoundary', '它从一个空壳占位模块变成了真正的完整实现。'],
  ['knowledgeBoundary', '我们堵住了三种绕过攻击的缺口。'],
];

const before = loadFresh();
const rowsBefore = GEN.map(([fn, txt]) => {
  const r = before.doubt(txt);
  return `${r.shouldStop}|${r.gate.action}|${r.doubts.length}`;
});

P('══════ r293 探针 1b：基线（当前 doubt-engine）══════');
let nHit = 0;
GEN.forEach(([fn, txt], i) => {
  const fw = rowsBefore[i];
  const folded = fold(txt);
  const r2 = before.doubt(folded);
  const key2 = `${r2.shouldStop}|${r2.gate.action}|${r2.doubts.length}`;
  const mark = key2 !== fw ? '  <== 分裂' : '';
  if (mark) nHit++;
  P(`  #${i} [${fn}] FW=${fw}  HALF=${key2}${mark}`);
});
P(`\n当前 doubt() 层分裂样本: ${nHit}/${GEN.length}`);
P('（若为 0，说明这些行虽然在正则层不对称，但 doubt() 输出不变 → 不值得本轮改）');
