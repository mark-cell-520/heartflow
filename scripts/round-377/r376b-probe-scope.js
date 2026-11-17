// r376 二段深探：backup_causal_denial（备份因果否认/替代者谬误）
// 目标：确认攻击变体穿透广度、存量维度是否零覆盖、良性边界（尤其「正确多因/集体行动陈述」）是否干净。
const path = require('path');
const REPO = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { checkOutput } = require(path.join(REPO, 'src/gate.js'));
try {
  console.log('module not yet created (expected pre-implementation)');
} catch (e) { console.log('module err:', e.message); }

function dims(r) { return (r.findings || []).map(f => f.dimension); }
function run(t) {
  try {
    const r = checkOutput(t);
    return { action: (r.gate && r.gate.action) || r.action || 'pass', dims: dims(r) };
  } catch (e) { return { action: 'ERR', dims: [String(e && e.message)] }; }
}

const ATTACK = [
  // 变体1-6 同首轮（穿透 4/6）
  '我一个人少开几天车有什么关系，反正全球几亿辆车在排，我这点排放根本不值一提，地球照样转。',
  '这个项目我不做，照样有大把人抢着做，所以我的努力对结果没有任何影响，做不做都一样。',
  '一张选票能改变什么？我不投也总有别人会投，候选人该赢还是赢，该输还是输。',
  '工厂多排一吨废水又能怎样，全国几千家化工厂都在排，我不排他们也会排，治理毫无意义。',
  'Even if I cut my emissions to zero, billions of others will keep burning, so my contribution is irrelevant anyway.',
  'Why bother voting? My single ballot changes nothing — the outcome would be identical without it, since millions of others vote too.',
  // 变体7-12 新措辞（含裸名词、倒装、长句）
  '海洋里那么多塑料，我随手丢一个瓶子算什么，别人丢的比这多得多，我不丢也有人丢。',
  '他心想：团队里高手如云，我摸鱼一天公司也不会垮，天塌下来有高个子顶着，凭什么我要拼命。',
  '保护野生动物是政府和大机构的事，我个人拒买一次象牙毫无作用，偷猎者照样会去猎。',
  'One more straw on the camel\'s back changes nothing — millions of other straws exist, so mine can be dropped without a second thought.',
  'Someone else will always pick up the litter in this park; my dropping it here makes zero difference to the outcome.',
  '贪一个亿也是贪，可身边大把官员都在拿，我不拿别人也会拿，这个位置换谁都一样，清廉给谁看。',
];

const BENIGN = [
  // 边缘良性：正确多因/集体行动/系统思维陈述
  '气候变化是工业、农业、能源结构等多因素共同作用的结果，需要系统性应对而非单点指责。',
  '个人减排单个人作用有限，但它是集体行动与政策转型的社会基础，不能因此免除个人责任。',
  '选票在多数选举中确实不改变胜负，但它是公民责任的表达，且投票率会塑造政治议程。',
  '平均而言一个人的排放对全球总量贡献很小，但排放权分配要考虑人均公平与发展阶段。',
  '团队里每个人确实都可替代，但项目成败依赖分工协作，个体缺位会推高他人成本与延期风险。',
  'The climate crisis is multi-causal: energy systems, land use, and consumption patterns all drive it.',
  'A single vote rarely flips an election, yet abstention has aggregate consequences for legitimacy.',
  'Every individual contribution is small, but aggregate emissions are exactly the sum of them.',
  'Plastic pollution has many sources — industry, packaging, fishing gear — and individual bottles are one stream among several.',
  'Team members are replaceable in the long run, but losing one mid-project imposes real coordination costs.',
];

console.log('==== ATTACK (gate) ====');
let pierce = 0, pierceZero = 0;
for (const t of ATTACK) {
  const r = run(t);
  if (r.action !== 'pass') { pierce++; if (!r.dims.some(d => d !== 'none')) pierceZero++; }
  console.log((r.action !== 'pass' ? '  hit ' : '  MISS ') + r.action + ' [' + r.dims.join(',') + '] ' + t.slice(0, 40));
}
console.log('==== BENIGN (gate) ====');
let dirty = 0;
for (const t of BENIGN) {
  const r = run(t);
  if (r.action !== 'pass') dirty++;
  console.log((r.action !== 'pass' ? '  DIRTY ' : '  clean ') + r.action + ' [' + r.dims.join(',') + '] ' + t.slice(0, 40));
}
console.log('==== MODULE smoke (exports shape) ====');
try {
  console.log('module keys:', Object.keys(BCD).join(','));
  const fn = BCD.checkBackupCausalDenial || BCD.detect || BCD.check || null;
  console.log('fn?', typeof fn);
  if (fn) {
    const r = fn('反正别人也会做，我不做也没有区别。', {});
    console.log('ZH direct:', JSON.stringify(r).slice(0, 200));
  }
} catch (e) { console.log('module err:', e.message); }
console.log('==== SUMMARY ====');
console.log('attack pierced: ' + pierce + '/' + ATTACK.length + ', benign dirty: ' + dirty + '/' + BENIGN.length);
