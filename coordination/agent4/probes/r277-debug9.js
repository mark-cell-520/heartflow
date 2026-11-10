const fdMod = require('/data/home/heartflow/src/false-dilemma.js');
const F = fdMod.__internals();
const src = F.STIGMA_ZH.source;
const i = src.indexOf('不是|算不上');
const N1 = '(?:不是|算不上|不算|绝非)(?:[^，。？！；\\n]{0,10}?)(?:，|,)?(?:就是|便是|即|等于)(?:[^，.？！；\\n]{0,12}?)(?:敌人|仇人|陌路|对头|叛徒|奸细|间谍|坏人|恶人|人渣|垃圾|废物|走狗|卖国贼)';
const actual = src.slice(i, i + N1.length);
console.log('equal:', actual === N1);
for (let k = 0; k < N1.length; k++) {
  if (actual[k] !== N1[k]) {
    console.log('diverge at', k, JSON.stringify(actual.slice(Math.max(0, k - 8), k + 8)), 'vs', JSON.stringify(N1.slice(Math.max(0, k - 8), k + 8)));
    console.log('actual code:', actual.charCodeAt(k), 'mine:', N1.charCodeAt(k));
    break;
  }
}
console.log('actual:', JSON.stringify(actual));
