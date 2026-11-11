// 探针：打印 18 个模块 __internals() 暴露的真实注入口键名
const path = require('path');
const ROOT = '/data/home/heartflow';
const FAMILIES = require(path.join(ROOT, 'src/plugins/econ-reasoning-check/index.js')).FAMILIES;
for (const f of FAMILIES) {
  const mod = require(path.join(ROOT, 'src', f.mod.replace(/^\.\.\/\.\.\//, '')));
  let keys = [];
  try {
    if (typeof mod.__internals === 'function') {
      const it = mod.__internals();
      keys = it ? Object.keys(it) : [];
    }
  } catch (e) { keys = ['ERR:' + e.message]; }
  console.log(`${f.key}: ${keys.join(', ')}`);
}
