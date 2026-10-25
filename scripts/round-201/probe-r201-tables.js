// 轮 201 辅助：看 src/shield 下各文件的数组常量数量（诊断词表层扫描为何 0 输出）
const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const fs = require('fs');
const path = require('path');
const S = __HF + '/src/shield';
for (const f of fs.readdirSync(S).filter(x => x.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(S, f), 'utf8');
  const re = /(?:const|let)\s+([A-Z0-9_]+)\s*=\s*(?:new Set\()?\[/g;
  let m, n = 0;
  const names = [];
  while ((m = re.exec(src)) !== null) { n++; names.push(m[1]); }
  console.log(`${f} 数组常量=${n}${names.length ? '  ' + names.slice(0, 8).join(',') : ''}`);
}
