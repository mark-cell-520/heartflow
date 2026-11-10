const fdMod = require('/data/home/heartflow/src/false-dilemma.js');
const F = fdMod.__internals();
const src = F.STIGMA_ZH.source;
const i = src.indexOf('不是|算不上');
const actual = src.slice(i - 1, i + 148);
const N1 = '(?:不是|算不上|不算|绝非)(?:[^，。？！；\\n]{0,10}?)(?:，|,)?(?:就是|便是|即|等于)(?:[^，.？！；\\n]{0,12}?)(?:敌人|仇人|陌路|对头|叛徒|奸细|间谍|坏人|恶人|人渣|垃圾|废物|走狗|卖国贼)';
console.log('actual len:', actual.length, 'mine len:', N1.length);
for (let k = 0; k < Math.max(actual.length, N1.length); k++) {
  if (actual[k] !== N1[k]) {
    console.log('diverge at', k, 'actual=' + JSON.stringify(actual.slice(k - 6, k + 6)), 'mine=' + JSON.stringify(N1.slice(k - 6, k + 6)));
    console.log('actual char code:', actual.charCodeAt(k), 'mine:', N1.charCodeAt(k));
    break;
  }
}
console.log('codes actual:', [...actual.slice(0, 20)].map(c => c.charCodeAt(0)).join(','));
console.log('codes mine:  ', [...N1.slice(0, 20)].map(c => c.charCodeAt(0)).join(','));
