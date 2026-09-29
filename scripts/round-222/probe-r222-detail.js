// 第 222 轮探针 12：确认良性 2 条命中是基线已有还是本轮新增。
// 做法：把新判据的 detail 名字打出来，若不含 superlative generic 即为基线行为。
const idx = require('../../src/index.js');
const t = ['最好的办法是先备份再操作', '最快的路径已经标注在地图上', '最新鲜的蔬菜', '最便宜的机票', '这是最有分量的结论'];
for (const s of t) {
  const r = idx.checkConfidenceCalibration(s);
  process.stdout.write(s + ' => ' + JSON.stringify((r.issues || []).map(i => i.detail)) + '\n');
}
