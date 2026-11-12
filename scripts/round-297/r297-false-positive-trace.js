// r297 探针 8：定位误伤「I am not a lawyer, so please consult...」的既有正则。
const idx = require('../../src/index.js');
const t = "I am not a lawyer, so please consult a professional before signing.";

// 尝试多种 internals 入口
const cands = ['__internals', '_internals', '__debug', '_debug'];
let P = null;
for (const k of cands) {
  if (typeof idx[k] === 'function') { try { P = idx[k](); } catch (e) {} }
  if (idx[k] && typeof idx[k] === 'object') P = idx[k];
}
if (!P) {
  console.log('internals 入口未找到，改从模块缓存解析');
  // 直接从 require 缓存里找
  for (const k of Object.keys(require.cache)) {
    if (/index\.js$/.test(k)) {
      const m = require.cache[k].exports;
      for (const key of Object.keys(m)) {
        if (/FALLACY|PATTERN/i.test(key)) console.log('导出键:', key);
      }
    }
  }
}

// 从源码文本里抓 [/.../i, 'ad_hominem'] 形态逐条测
const src = require('fs').readFileSync(require('path').join(__dirname, '../../src/index.js'), 'utf8');
const re = /\[\/(.+?)\/([gimsuy]*)\s*,\s*'([a-z_]+)'\]/g;
let m, hits = [];
while ((m = re.exec(src)) !== null) {
  if (m[3] !== 'ad_hominem') continue;
  let r;
  try { r = new RegExp(m[1], m[2]); } catch (e) { continue; }
  if (r.test(t)) hits.push({ pat: m[1], flags: m[2] });
}
console.log('命中 ad_hominem 标签的既有正则数:', hits.length);
hits.forEach(h => console.log('  /' + h.pat + '/' + h.flags));

// 也测其它 ad_hominem 邻族
const dims = ['fallacy_of_relevance', 'ad_hominem', 'fallacies', 'credential_dismissal', 'genetic_fallacy', 'appeal_to_authority'];
re.lastIndex = 0;
while ((m = re.exec(src)) !== null) {
  if (!dims.includes(m[3])) continue;
  let r;
  try { r = new RegExp(m[1], m[2]); } catch (e) { continue; }
  if (r.test(t)) console.log(`[${m[3]}] /${m[1]}/${m[2]}`);
}
