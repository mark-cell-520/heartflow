const { ZH_SIGNALS } = require('/data/home/heartflow/src/plugins/sycophancy-check/index.js');
const t = '我之前的判断不对，你的说法才是对的。';
for (const [fam, pats] of Object.entries(ZH_SIGNALS)) {
  pats.forEach((p, i) => {
    let r;
    try { r = p.test(t); } catch (e) { r = 'ERR:' + e.message; }
    if (r === true) console.log('MATCH', fam, i, String(p).slice(0, 80));
  });
}
console.log('--- direct ---');
console.log(/我之前的判断(完全)?(错|不对|有误)/i.test(t));
