const fdMod = require('/data/home/heartflow/src/false-dilemma.js');
const F = fdMod.__internals();
const src = F.STIGMA_ZH.source;
const N1 = '(?:不是|算不上|不算|绝非)(?:[^，。？！；\\n]{0,10}?)(?:，|,)?(?:就是|便是|即|等于)(?:[^，.？！；\\n]{0,12}?)(?:敌人|仇人|陌路|对头|叛徒|奸细|间谍|坏人|恶人|人渣|垃圾|废物|走狗|卖国贼)';
const p = N1.slice(0, 65);
const at = src.indexOf(p);
console.log('prefix at:', at);
for (let k = 60; k < 75; k++) {
  console.log(k, 'src:', src.charCodeAt(at + k), JSON.stringify(src[at + k]), '| N1:', N1.charCodeAt(k), JSON.stringify(N1[k]));
}
