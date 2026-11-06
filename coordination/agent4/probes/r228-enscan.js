// r228 前置勘察：白名单子目录里「代码行纯中文、英文近零」的模块 = 英文零覆盖候选
const fs = require('fs'), path = require('path');
const dirs = ['src/core/ethics', 'src/core/psychology', 'consciousness', 'src/plugins', 'src/tools', 'src/shield'];
const zhRe = /[\u4e00-\u9fff]/;
for (const d of dirs) {
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) {
    if (!f.endsWith('.js')) continue;
    const p = path.join(d, f);
    const t = fs.readFileSync(p, 'utf8');
    let zh = 0, en = 0;
    for (const ln of t.split('\n')) {
      const s = ln.trim();
      if (s.startsWith('*') || s.startsWith('//') || s.startsWith('/*')) continue;
      if (zhRe.test(s)) zh++;
      if (/\b[a-zA-Z]{5,}\b/.test(s) && !/require|module\.exports|function|return/.test(s)) en++;
    }
    if (zh > 5 && en < 3) console.log(p, 'zh_code_lines=' + zh, 'en_code_lines=' + en, 'size=' + t.length);
  }
}
