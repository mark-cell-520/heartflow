// r491 腿级诊断：对剩余 miss 样本逐腿定位
const mod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/curse-of-knowledge.js');
const K = mod.__internals();
const check = mod.checkCurseOfKnowledge;

const cases = [
  { id: 'A1', t: '做这行的都清楚这个原理，我解释起来反而显得啰嗦。' },
  { id: 'A2', t: 'It is common knowledge among peers, so no elaboration is required.' },
  { id: 'A3a', t: '团队里大家都心知肚明，这块背景交代就免了。' },
  { id: 'A4', t: 'The committee already knows the method, so I left the recap out.' },
  { id: 'A5a', t: '给同行评审看的，行业常识部分全部删除。' },
  { id: 'D4-1', t: 'This is established consensus in the field, so I will skip the background entirely.' },
  { id: 'D4-2', t: 'It is common knowledge among peers, so no elaboration is required.' },
  { id: 'D4-3', t: 'The audience is expert enough that the introductory chapter adds nothing.' },
  { id: 'D4-4', t: 'The readership is specialist, so the basic primer would be redundant.' },
];

// collect() 同源逻辑
function allMatches(re, text) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = []; let m;
  while ((m = reG.exec(text)) !== null) {
    out.push({ idx: m.index, end: m.index + m[0].length, raw: m[0] });
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return out;
}
function dist(a, b) { return Math.max(0, Math.max(a.idx - b.end, b.idx - a.end)); }
const PAIR_ZH = 90, PAIR_EN = 200;

for (const c of cases) {
  const zh = /[\u4e00-\u9fff]/.test(c.t);
  const cons = zh ? K.CONSENSUS_ZH.concat(K.CONSENSUS_ZH3, K.CONSENSUS_ZH4, K.CONSENSUS_ZH5) : K.CONSENSUS_EN.concat(K.CONSENSUS_EN3);
  const coll = zh ? K.COLLAPSE_ZH.concat(K.COLLAPSE_ZH2) : K.COLLAPSE_EN.concat(K.COLLAPSE_EN2);
  const win = zh ? PAIR_ZH : PAIR_EN;
  const cm = []; for (const p of cons) for (const x of allMatches(p, c.t)) cm.push(x);
  const km = []; for (const p of coll) for (const x of allMatches(p, c.t)) km.push(x);
  const r = check(c.t);
  console.log('[' + c.id + '] hit=' + r.hit + '  consensus=' + cm.map(x => '「' + x.raw + '」').join(',') + '  |  collapse=' + (km.map(x => '「' + x.raw + '」').join(',') || '(NONE)'));
  // 距离判定
  if (cm.length && km.length) {
    let paired = false;
    for (const a of cm) for (const b of km) { if (dist(a, b) <= win) paired = true; }
    if (!paired) console.log('    -> 双腿均命中但超窗（win=' + win + '，最小距离=' + Math.min(...cm.flatMap(a => km.map(b => dist(a, b)))) + '）');
  }
}
