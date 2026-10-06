// r538: 实测 associative-engine 五个子模块是否真的加载不了 + 它们的能力面
const path = require('path');
const ROOT = path.join(__dirname, '..');
const targets = ['lexical-associator', 'chunk-detector', 'narrative-retriever', 'semantic-converger', 'word-by-word-generator'];

console.log('=== 1. 按当前（写错的）路径加载 ===');
for (const t of targets) {
  try {
    const m = require(path.join(ROOT, 'src/archive', t + '.js'));
    console.log('  ' + t + ' → 加载成功', Object.keys(m).slice(0, 6).join(','));
  } catch (e) {
    console.log('  ' + t + ' → ❌ ' + e.code || e.message);
  }
}

console.log('\n=== 2. 按正确路径加载 + 导出面 ===');
for (const t of targets) {
  try {
    const m = require(path.join(ROOT, 'src/archive/associative-engine', t + '.js'));
    const keys = Object.keys(m);
    console.log('  ' + t + ' → ✅ 导出 ' + keys.length + ' 项: ' + keys.join(','));
  } catch (e) {
    console.log('  ' + t + ' → ❌ ' + e.message);
  }
}
