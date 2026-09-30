// 第 216 轮：读 verification-engine.js 的公开接口 + index.js/MCP 是否暴露
const fs = require('fs');
const c = fs.readFileSync('src/core/verification-engine.js', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
  if (/module\.exports|^\s*(async\s+)?[a-zA-Z_][\w]*\s*\(/.test(l) && !/^\s*\/\//.test(l)) {
    if (/^module\.exports/.test(l) || /^  [a-zA-Z_][\w]*\(/.test(l)) console.log((i + 1) + ': ' + l);
  }
});
