const { __internals } = require('/data/home/heartflow/src/cherry-picking.js');
const I = __internals();
const s = '报告里专门把顺风顺水的年份晒出来，结论当然好看。';
const R = {
  SEL_ADV_ZH: I.SEL_ADV_ZH, SEL_MARK_ZH: I.SEL_MARK_ZH, SEL_OBJ_ZH: I.SEL_OBJ_ZH,
  SEL_NEG_QUAL_ZH: I.SEL_NEG_QUAL_ZH, SEL_SUPPRESS_ZH: I.SEL_SUPPRESS_ZH,
  SEL_PHRASE_ZH: I.SEL_PHRASE_ZH, SEL_PHRASE_EN: I.SEL_PHRASE_EN,
  SEL_EN_ADV: I.SEL_EN_ADV, SEL_EN_VERB: I.SEL_EN_VERB, SEL_EN_MARK: I.SEL_EN_MARK, SEL_EN_OBJ: I.SEL_EN_OBJ,
  SEL_VERB_ZH: I.SEL_VERB_ZH.filter((re, i) => i !== 1),
};
function srcGroup(list) { return list && list.length ? '(?:' + list.map(re => re.source).join('|') + ')' : null; }
const adv = srcGroup(R.SEL_ADV_ZH), verb = srcGroup(R.SEL_VERB_ZH);
const mark = srcGroup(R.SEL_MARK_ZH), obj = srcGroup(R.SEL_OBJ_ZH);
const forms = {
  A: new RegExp(adv + '[^。！？]{0,8}' + verb + '[^。！？]{0,10}' + mark + '[^。！？]{0,8}' + obj),
  A2: new RegExp(verb + '[^。！？]{0,6}' + mark + '[^。！？]{0,8}' + obj),
  A3: new RegExp(adv + '[^。！？]{0,8}' + mark + '[^。！？]{0,8}' + obj + '[^。！？]{0,10}' + verb),
};
for (const [k, re] of Object.entries(forms)) {
  const m = re.exec(s);
  console.log(k, m ? 'MATCH: ' + JSON.stringify(m[0]) : 'no');
}
