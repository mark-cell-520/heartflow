// r367 漏判诊断：逐条拆解每条 MISS 样本的两腿缺失
const { checkPackageDeal, __internals: I } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/package-deal.js');

const MISSES = [
  '你要么全盘接受这套方案，要么就是完全不同意，没有中间地带',
  '支持环保的人必然也支持大政府，这是一整套左翼立场，不能拆开支持',
  '买这个品牌就得接受它的全部价值观，不能只买产品不认理念',
  '投他一票就等于认同他的全部政见，不能只认同其中一条',
  'You cannot embrace the culture without accepting all of its traditions — it comes as a package',
  '在这场辩论中，我们必须明确一点：这份宣言的每一条都相互关联，你要么整体签认，要么就说明你根本不认同我们的运动',
  'Their platform is a package deal: you must endorse every plank or none of it',
];

function scan(sample) {
  const t = sample.trim();
  const low = t.toLowerCase();
  const isEN = /[a-zA-Z]/.test(t) && !/[\u4e00-\u9fff]/.test(t);
  const bindList = isEN ? I.BIND_EN : I.BIND_ZH;
  const allornList = isEN ? I.ALLORN_EN : I.ALLORN_ZH;
  const bindHits = bindList.filter(w => isEN ? low.includes(w) : t.includes(w));
  const allornHits = allornList.filter(w => isEN ? low.includes(w) : t.includes(w));
  // 全文级豁免命中
  const exempts = [];
  for (const [n, list] of [['SEPARATE_ZH', I.SEPARATE_ZH], ['SEPARATE_EN', I.SEPARATE_EN],
    ['LEGAL_ZH', I.LEGAL_ZH], ['LEGAL_EN', I.LEGAL_EN],
    ['INST_ZH', I.INSTITUTIONAL_ZH], ['INST_EN', I.INSTITUTIONAL_EN],
    ['META_ZH', I.META_ZH], ['META_EN', I.META_EN]]) {
    for (const w of list) if (isEN ? low.includes(w) : t.includes(w)) exempts.push(n + ':' + w);
  }
  return { isEN, bindHits, allornHits, exempts };
}

for (const s of MISSES) {
  const r = scan(s);
  console.log('--- ' + s.slice(0, 50));
  console.log('    BIND   : ' + (r.bindHits.length ? r.bindHits.join(' / ') : '(none)'));
  console.log('    ALLORN : ' + (r.allornHits.length ? r.allornHits.join(' / ') : '(none)'));
  console.log('    EXEMPT : ' + (r.exempts.length ? r.exempts.join(' / ') : '(none)'));
}
