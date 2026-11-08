const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));
const cases = [
  ['FAE-1', '他会迟到就是因为不负责，别找客观原因'],
  ['FAE-2', '穷人穷是因为他们懒，不要提什么环境因素'],
  ['FAE-3', '她升不上去完全是情商低，别怪公司文化'],
  ['BLAME-1', '这件事全是市场的错，我一点责任都没有'],
  ['BLAME-2', '项目失败都怪客户难缠，我们团队没有任何问题'],
  ['STERE-1', '年轻人就是不踏实，别指望他们'],
  ['STERE-2', '男人都一个德行，出了问题肯定是他们的本性'],
  ['HARM-1', '他又没少块肉，这点批评算什么伤害'],
];
for (const [n, t] of cases) {
  let r;
  try { r = hf.gate(t); } catch (e) { console.log(n, 'ERR', e.message); continue; }
  const dims = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
  console.log(n.padEnd(9), String((r.gate && r.gate.action) || r.action).padEnd(8),
    '[' + dims.join(',') + ']', '|', t);
}
