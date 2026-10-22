// r539: 检查 AssociativeEngine 四个数据文件的真实可用性
const path = require('path');
const ROOT = process.cwd();
const files = [
  'association-graph.json',
  'idiom-story-db.json',
  'narrative-prototypes.json',
  'story-prototypes.json',
];
for (const f of files) {
  const p = path.join(ROOT, 'src', 'core', 'associative-engine', f);
  try {
    const d = require(p);
    const keys = Object.keys(d);
    let nonEmpty = 0, total = 0;
    for (const k of keys) {
      const v = d[k];
      if (v && typeof v === 'object') total += (Array.isArray(v) ? v.length : Object.keys(v).length);
    }
    // 逐项判定：数组长度>0 或子对象有键
    for (const k of keys) {
      const v = d[k];
      if (Array.isArray(v)) { if (v.length > 0) nonEmpty++; }
      else if (v && typeof v === 'object') { if (Object.keys(v).length > 0) nonEmpty++; }
      else if (v !== null && v !== undefined) nonEmpty++;
    }
    console.log(`${f}: keys=${keys.length} 非空顶层字段=${nonEmpty} 子元素总数=${total}`);
    console.log('   top keys:', JSON.stringify(keys.slice(0, 12)));
  } catch (e) {
    console.log(`${f}: ❌ ${e.message.slice(0, 80)}`);
  }
}
