// r738-A3: 拆 perfect_error 命中点
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkPerfectError } = require(path.join(ROOT, 'src/perfect-error.js'));

function show(tag, text) {
  const r = checkPerfectError(text);
  console.log(`[${tag}] score=${r.score} issues=${JSON.stringify(r.issues || [])}`);
  console.log(`      text=${text}`);
}

show('A1', '这是最常见的错误，初学者一定要注意');
show('X1', '初学者一定要注意');
show('X2', '一定要注意验证');
show('X3', '一定要注意这个问题');
show('X4', '同学们一定要注意');
show('X5', '这是最常见的错误，大家要引以为戒');
show('X6', '新手最容易忽略的一点是要做单元测试');
