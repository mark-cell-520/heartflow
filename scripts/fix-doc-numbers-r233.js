// r233 文档数字修正脚本（反引号会被 shell 吞，故独立脚本处理）
const fs = require('fs');
function sub(file, pairs) {
  let t = fs.readFileSync(file, 'utf8');
  let n = 0;
  for (const [a, b] of pairs) {
    if (t.includes(a)) { t = t.split(a).join(b); n++; }
    else console.log('MISS [' + file + ']: ' + a.slice(0, 40));
  }
  fs.writeFileSync(file, t);
  console.log(file + ': ' + n + '/' + pairs.length + ' applied');
}
sub('README.md', [
  ['**178 request `verify`**', '**179 request `verify`**'],
  ['Measured on this repository at **v6.8.146**.', 'Measured on this repository at **v6.8.148**.'],
]);
sub('SKILL.md', [
  ['**178 request `verify`**', '**179 request `verify`**'],
  ['at v6.8.146.', 'at v6.8.148.'],
]);
