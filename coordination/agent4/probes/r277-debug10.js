const fdMod = require('/data/home/heartflow/src/false-dilemma.js');
const F = fdMod.__internals();
const src = F.STIGMA_ZH.source;
const N1 = '(?:不是|算不上|不算|绝非)(?:[^，。？！；\\n]{0,10}?)(?:，|,)?(?:就是|便是|即|等于)(?:[^，.？！；\\n]{0,12}?)(?:敌人|仇人|陌路|对头|叛徒|奸细|间谍|坏人|恶人|人渣|垃圾|废物|走狗|卖国贼)';
let lo = 0;
for (let k = 1; k <= N1.length; k++) {
  if (src.indexOf(N1.slice(0, k)) === -1) {
    console.log('breaks at prefix len', k - 1, '->', k);
    console.log('last ok prefix tail:', JSON.stringify(N1.slice(k - 12, k)));
    const p = N1.slice(0, k - 1);
    const at = src.indexOf(p);
    console.log('source continues with:', JSON.stringify(src.slice(at + p.length, at + p.length + 14)));
    console.log('N1 continues with:   ', JSON.stringify(N1.slice(k - 1, k + 13)));
    break;
  }
}
