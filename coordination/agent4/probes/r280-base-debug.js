const atpMod = require('/data/home/heartflow/src/appeal-to-probability.js');
const A = atpMod.__internals();
const t = '胜算那么高，十有八九会成。';
console.log('全部命中的 BASE 腿:');
for (const re of A.BASE_ZH) { if (re.test(t)) console.log('  ', re.source, '=>', JSON.stringify(t.match(re)?.[0])); }
console.log('删新腿后 hit:', atpMod.checkAppealToProbability(t, { BASE_ZH: A.BASE_ZH.filter(re => !re.source.includes('[希望胜算机会把握][这那]么[大高多好]')) }).hit);
// 试其它自然句
for (const s of ['胜算那么高，铁定会成。', '概率那么高，铁定会发生。', '希望那么高，铁定会发生。', '机会那么高，铁定会发生。', '胜算那么高，铁定能成。']) {
  const dropped = A.BASE_ZH.filter(re => !re.source.includes('[希望胜算机会把握][这那]么[大高多好]'));
  console.log(JSON.stringify(s), '删后 hit:', atpMod.checkAppealToProbability(s, { BASE_ZH: dropped }).hit,
    '命中腿:', A.BASE_ZH.filter(re => re.test(s)).map(re => re.source).join(' ; '));
}
