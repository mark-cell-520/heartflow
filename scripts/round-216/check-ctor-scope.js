// 第 216 轮：确认 2043 行赋值是否真的在 constructor 内（用括号计数回溯）
const fs = require('fs');
const c = fs.readFileSync(process.cwd() + '/src/core/heartflow.js', 'utf8');
const lines = c.split(String.fromCharCode(10));

// constructor 起始行（1-based 1165 → index 1164）
const ctorStart = lines.findIndex(l => l.trim().startsWith('constructor(config = {})'));
console.log('constructor 起始行: ' + (ctorStart + 1));

// 简易括号计数：从 constructor 起找匹配的闭合
let depth = 0, started = false, ctorEnd = -1;
for (let i = ctorStart; i < lines.length; i++) {
  const l = lines[i];
  // 去掉字符串与注释的粗暴处理（只影响计数精度，够定位）
  const stripped = l.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/\/\/.*$/, '');
  for (const ch of stripped) {
    if (ch === '{') { depth++; started = true; }
    else if (ch === '}') { depth--; if (started && depth === 0) { ctorEnd = i; break; } }
  }
  if (ctorEnd >= 0) break;
}
console.log('constructor 结束行: ' + (ctorEnd + 1));
console.log('2043 行内容: ' + (lines[2042] || '').trim().slice(0, 90));
console.log('2043 在 constructor 内? ' + (2043 >= ctorStart + 1 && 2043 <= ctorEnd + 1));

// 我插入的 verification 行在哪
lines.forEach((l, i) => {
  if (l.includes('this.verification = _VerificationEngine')) console.log('verification 赋值行: ' + (i + 1) + ' 在 constructor 内? ' + (i + 1 >= ctorStart + 1 && i + 1 <= ctorEnd + 1));
});
