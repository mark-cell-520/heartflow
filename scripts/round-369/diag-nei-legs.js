// r369 诊断：r367 negative_existential_import 四条穿透样本逐腿定位（修正版）
// 穿透样本：P1「没有任何研究显示…无效」P2「说不出反对的理由…对的」P3「至今没有人成功复现…真实」P4 EN replication
// 常量已从 module.exports 导出，直接 require 逐条实测。
const M = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/negative-existential-import.js');

const P = {
  P1: '没有任何研究显示这个方法有效，所以它一定是无效的。',
  P2: '说不出反对的理由，说明这个方案是对的。',
  P3: '至今没有人成功复现这个结果，因此该结果必定真实。',
  P4: 'The study has never been replicated, which means it must be a genuine discovery.',
  P5: '至今没有人成功复现这个结果，因此该结果必定真实存在。',
  P6: '至今没有人能成功复现这个结果，这说明它是真的。',
  P7: 'The study has never been replicated, which means it must be true.',
  P8: 'This study has never been successfully replicated, so it must be genuine.',
};

const NEGP_ZH = M.NEG_PREMISE_ZH;
const NEGP_EN = M.NEG_PREMISE_EN;
const EXIST_ZH = M.EXIST_CONCL_ZH;
const EXIST_EN = M.EXIST_CONCL_EN;

function firstHit(res, text) {
  for (const re of res) {
    const m = text.match(re);
    if (m) return { re: String(re), m: m[0], idx: m.index };
  }
  return null;
}

const EXEMPTS = {
  META_CONCEPT: M.META_CONCEPT, OBSERVATION: M.OBSERVATION, TEACH: M.TEACH,
  HEDGE: M.HEDGE, COMPLIANT: M.COMPLIANT_CONCLUSION, SCIENCE: M.SCIENCE_CONDUCT,
};

for (const [id, t] of Object.entries(P)) {
  const isEN = /[a-zA-Z]{3,}/.test(t) && !/[\u4e00-\u9fa5]/.test(t);
  console.log('\n===== ' + id + ' | ' + t);
  const negp = isEN ? NEGP_EN : NEGP_ZH;
  const conc = isEN ? EXIST_EN : EXIST_ZH;
  const l1 = firstHit(negp, t);
  const l2 = firstHit(conc, t);
  console.log('  腿①: ' + (l1 ? 'HIT  ' + l1.m + '  @' + l1.idx + '  ' + l1.re.slice(0, 60) : 'MISS'));
  console.log('  腿②: ' + (l2 ? 'HIT  ' + l2.m + '  @' + l2.idx + '  ' + l2.re.slice(0, 60) : 'MISS'));
  const r = M.checkNegativeExistentialImport(t);
  console.log('  最终: hit=' + r.hit + ' score=' + r.score + (r.hit ? ' legs=' + JSON.stringify(r.legs) : ''));
  // 豁免命中排查
  for (const [name, arr] of Object.entries(EXEMPTS)) {
    for (const re of arr) {
      if (re.test(t)) { console.log('  豁免命中[' + name + ']: ' + String(re).slice(0, 70)); break; }
    }
  }
}
