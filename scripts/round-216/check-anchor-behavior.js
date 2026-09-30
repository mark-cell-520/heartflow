// 第 216 轮：检查锚点归一化正则的实际行为（双反斜杠是否引入 bug）
const c = require('fs').readFileSync(process.cwd() + '/src/shield/skill-verifier.js', 'utf8');
const line = c.split(String.fromCharCode(10)).find(l => l.includes('u4e00'));
console.log('锚点行内容（转义显示）: ' + JSON.stringify(line.trim()));

// 取出源码里的正则字面量，直接 eval 测行为
const m = line.match(/\.replace\((\/\[[^\n]*?\]\+\/g), ''\)/);
console.log('抓到的正则文本: ' + JSON.stringify(m && m[1]));
const re = eval(m[1]);
console.log('re.source = ' + re.source);
console.log('re.flags  = ' + re.flags);
const norm = s => s.trim().toLowerCase().replace(re, '').replace(/\s+/g, '-');
for (const h of ['触发条件', '核心功能', 'Test Skill v1.0.0', '概述 Overview', 'API 参考']) {
  console.log('  "' + h + '" -> "' + norm(h) + '"');
}
// 反向：单反斜杠版本
const re2 = eval("/[^\\w\\u4e00-\\u9fff-]+/g");
const norm2 = s => s.trim().toLowerCase().replace(re2, '').replace(/\s+/g, '-');
console.log('--- 对照单反斜杠版本 ---');
for (const h of ['触发条件', 'Test Skill v1.0.0']) {
  console.log('  "' + h + '" -> "' + norm2(h) + '"');
}
