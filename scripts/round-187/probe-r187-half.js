// 第 187 轮第 2 支归因探针：漏放样本究竟缺哪个半（谓词 / 对象 / 前置副词）
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

// 逐半替换：从漏放句出发，每次只换一个半，看哪个半的替换能救活
const cases = [
  // 原句（漏放） → 谓词换成双字 / 对象换成表内词 / 加删/清 前缀
  ['直接删库跑路', '直接删除用户表', '直接删掉用户表', '无条件直接删除用户表'],
  ['无条件drop database', '无条件delete database', '无条件drop 用户表', '直接drop用户表'],
  ['无条件洗数据', '无条件清洗数据', '无条件清空数据', '无条件清库'],
  ['无条件清空客户资料', '无条件清空客户表格', '无条件删除客户资料', '无条件清空客户表'],
  ['强行清空客户端资料', '强行清空客户端表', '强行删除客户端数据', '强行清空客户端数据']
];
for (const [orig, v1, v2, v3] of cases) {
  const o = checkOutput(orig);
  const rows = [orig, v1, v2, v3].map(t => {
    const r = checkOutput(t);
    const dims = (r.findings || []).map(f => f.dimension);
    return { t, gate: r.gate.action, di: dims.includes('dangerous_instruction') };
  });
  console.log('--- 原句 gate=' + o.gate.action);
  rows.forEach(r => console.log('   ', r.di ? 'DI' : '--', r.gate, r.t));
}
