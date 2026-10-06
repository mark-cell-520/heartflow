// r539: 检查 association-graph.json 是否真的有节点
const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'src', 'core', 'associative-engine', 'association-graph.json');
console.log('path =', p);
console.log('exists =', fs.existsSync(p));
if (fs.existsSync(p)) {
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  console.log('top keys =', Object.keys(d));
  console.log('nodes count =', d.nodes ? Object.keys(d.nodes).length : 'NO nodes field');
  console.log('metadata =', JSON.stringify(d.metadata));
  const ks = Object.keys(d.nodes || {});
  console.log('sample nodes =', JSON.stringify(ks.slice(0, 15)));
  // 检查 safe-fs 是否拦住了读取
  const safeFs = require('../src/utils/safe-fs.js');
  console.log('safe-fs existsSync =', safeFs.existsSync(p));
  try {
    const raw = safeFs.readFileSync(p, 'utf8');
    console.log('safe-fs readFileSync length =', raw ? raw.length : 'EMPTY/FALSY');
    if (raw) {
      const d2 = JSON.parse(raw);
      console.log('safe-fs parse nodes =', Object.keys(d2.nodes || {}).length);
    }
  } catch (e) {
    console.log('safe-fs readFileSync THROW =', e.message);
  }
}
