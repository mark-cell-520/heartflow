const re = /(?:牌子|招牌|口碑|名头)(?:立|打|树|闯)(?:了)?(?:上)?(?:百|几十|多少)?多年?|老牌子|金字招牌|百年(?:的)?(?:老)?牌子/;
const s = '这牌子立了上百年，口碑摆在那儿，照老方子来。';
console.log('direct:', JSON.stringify(s.match(re)));
const mod = require('/data/home/heartflow/src/appeal-tradition.js');
const I = mod.__internals();
console.log('t11 in internals:', !!I.TRAD_ZH_BRANCHES.t11_brand_age);
console.log('t11 source:', I.TRAD_ZH_BRANCHES.t11_brand_age.source);
console.log('t11 test:', I.TRAD_ZH_BRANCHES.t11_brand_age.test(s));
console.log('keys:', Object.keys(I.TRAD_ZH_BRANCHES).join(','));
