// probe-4：把 r305 守卫测试里的样本全部解码打印，人工核对是否有同类转义序笔误
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '..', '..', 'test', 'pseudo-profundity-bside-noncultivation-r305.test.js'), 'utf8');
function grab(name) {
  const at = src.indexOf('const ' + name + ' = [');
  if (at === -1) return [];
  const end = src.indexOf('];', at);
  const body = src.slice(src.indexOf('[', at), end + 1);
  return eval(body);
}
console.log('=== EXCLUDED ===');
grab('EXCLUDED').forEach((t, i) => console.log(i, t));
console.log('=== POSITIVE ===');
grab('POSITIVE').forEach((t, i) => console.log(i, t));
