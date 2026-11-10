const fdMod = require('/data/home/heartflow/src/false-dilemma.js');
const F = fdMod.__internals();
const N1 = '(?:不是|算不上|不算|绝非)(?:[^，。？！；\\n]{0,10}?)(?:，|,)?(?:就是|便是|即|等于)(?:[^，.？！；\\n]{0,12}?)(?:敌人|仇人|陌路|对头|叛徒|奸细|间谍|坏人|恶人|人渣|垃圾|废物|走狗|卖国贼)';
const N2 = '(?:要么|或者|再?不然)(?:[^，。？！；\\n]{0,30}?)(?:要么|或者|就是|便是)(?:[^，.？！；\\n]{0,12}?)(?:作对|对立|对抗|过不去|对着干|唱反调|背叛|反对我|反对我们)';
const N3 = '(?:不|没)(?:转发|分享|点赞|转评|声援|买|用|看|听)(?:[^，.？！；\\n]{0,12}?)[，,]?(?:就是|便是|等于|意味着)(?:[^，.？！；\\n]{0,15}?)(?:不爱国|不忠|不孝|冷血|没良心|无心|卖国|叛徒|走狗|别有用心|居心不良)';
const src = F.STIGMA_ZH.source;
console.log('n1 idx:', src.indexOf(N1));
console.log('n2 idx:', src.indexOf(N2));
console.log('n3 idx:', src.indexOf(N3));
// 找出源码中 n1 的实际文本
const i = src.indexOf('不是|算不上');
console.log('actual n1:', JSON.stringify(src.slice(i - 20, i + 150)));
const j = src.indexOf('不|没)(?:转发');
console.log('actual n3:', JSON.stringify(src.slice(j - 10, j + 160)));
