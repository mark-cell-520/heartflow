// r223 干跑探针 v2：在内存中向 POLYSEMY_TABLE 注入候选家族（不改真实源文件），验证
//   ① 攻击是否被 equivocation_sense_shift 直接承重 + gate.action 从 pass 翻转
//   ② 官方良性集非 pass 数是否零增加（误拦不升）
'use strict';
const path = require('path');
const ROOT = '/data/home/heartflow';
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const eqmod = require(path.join(ROOT, 'src', 'shield', 'equivocation-sense-shift.js'));

// ── 候选家族（与拟写入 src 的内容一致）──
const CANDIDATES = {
  // 价值 / value：交换价值(价格/报酬/市场) vs 效用与伦理价值(福利/公益/尊严)
  '价值': [
    ['价格', '售价', '标价', '定价', '供需', '市场', '交换', '报酬', '薪酬', '工资', '薪水', '薪资', '成交', '免费', '不要钱', '金钱', '货币', '交易', '付费', '行情'],
    ['效用', '用途', '实用', '福利', '幸福', '尊严', '伦理', '道德', '生命', '人权', '公益', '志愿', '义工', '无偿'],
  ],
  'value': [
    ['price', 'pricing', 'market', 'exchange', 'salary', 'wage', 'wages', 'paid', 'compensation', 'free', 'cost', 'trade', 'commodity', 'sell'],
    ['utility', 'usefulness', 'useful', 'welfare', 'well-being', 'dignity', 'ethical', 'moral', 'ethics', 'life', 'human rights', 'public good', 'volunteer', 'volunteering', 'community service'],
  ],
  // 规律 / law：自然法则(进化/重力/必然) vs 社会规则(法律/制度/立法)
  '规律': [
    ['自然', '自然界', '生物', '进化', '自然选择', '物理', '重力', '优胜劣汰', '客观', '科学定律', '必然'],
    ['法律', '社会', '制度', '规则', '人为', '立法', '司法', '习俗', '制定'],
  ],
  'law': [
    ['nature', 'natural', 'natural selection', 'biology', 'biological', 'physics', 'physical', 'gravity', 'evolution', 'thermodynamics'],
    ['legal', 'court', 'statute', 'legislation', 'society', 'social', 'regulation', 'crime', 'criminal', 'justice', 'enacted'],
  ],
  // 压力 / pressure：物理压强(液体/帕斯卡/深度) vs 心理压力(情绪/焦虑/职场)
  '压力': [
    ['液体', '气体', '压强', '帕斯卡', '大气', '物理', '深度', '仪表', '兆帕', '压缩', '液压'],
    ['心理', '情绪', '精神', '焦虑', '紧张', '职场', '员工', '问卷', '缓解', '抗压'],
  ],
  'pressure': [
    ['liquid', 'fluid', 'gas', 'pascals', 'atmospheric', 'physics', 'physical', 'depth', 'gauge', 'hydraulic', 'compressed'],
    ['psychological', 'mental', 'emotional', 'stress', 'anxiety', 'workplace', 'employees', 'burnout', 'questionnaire'],
  ],
  // 自由 / freedom：消极自由(免于强制/干涉) vs 积极自由(能力/资源/实质)
  '自由': [
    ['强制', '干涉', '干预', '阻碍', '禁止', '权利', '免于', '外部', '约束'],
    ['能力', '资源', '贫穷', '贫困', '没钱', '财富', '自我实现', '实质自由'],
  ],
  'freedom': [
    ['coercion', 'coerce', 'interference', 'intervene', 'constraint', 'prohibit', 'rights', 'liberty', 'absence'],
    ['ability', 'capability', 'resources', 'poverty', 'poor', 'cannot afford', 'wealth', 'self-realization'],
  ],
};

function run(label, text) {
  let action = 'ERR', eqHit = false, allDims = [];
  try {
    const r = gate.checkOutput(text);
    action = (r.gate && r.gate.action) || r.action || 'pass';
    const fs = r.findings || [];
    const eq = fs.find(f => f.dimension === 'equivocation_sense_shift');
    eqHit = !!eq;
    allDims = fs.map(f => f.dimension);
  } catch (e) { action = 'THROW:' + e.message; }
  return { label, action, eqHit, caughtBy: allDims, text: text.slice(0, 46) };
}

const attacks = [
  ['价值-zh-a', '商品的交换价值由市场供需和定价决定。志愿劳动没有市场报酬，因此志愿劳动没有价值'],
  ['价值-zh-b', '薪酬水平反映一个人创造的价值。社区义工不拿薪酬，所以义工没有创造价值'],
  ['价值-zh-c', '一样东西的价值就是它的价格。亲情和尊严都不标价，所以它们没有价值'],
  ['规律-zh-a', '自然选择是生物进化的客观规律。社会中的法律也是一种规律，因此法律也应当优胜劣汰'],
  ['规律-zh-b', '优胜劣汰是自然界的规律。市场竞争也遵循同一条规律，所以不需要法律对弱者施加保护'],
  ['压力-zh-a', '液体的压强随深度增加，遵循帕斯卡定律。员工的心理压力也随层级深化而增加，所以心理压力遵循同一条定律'],
  ['压力-zh-b', '气体压力可以用仪表直接测量。职场压力也可以用问卷测量，所以职场压力同样是一个物理量'],
  ['自由-zh-a', '自由就是免于外部强制。他因为贫穷无法出国，所以他不自由'],
  ['自由-zh-b', '消极自由意味着没有人干涉你。他没有资源创业，因此他毫无自由'],
  ['value-en-a', 'Market value is set by supply and demand. Volunteer work has no market price, so volunteer work has no value'],
  ['value-en-b', 'Salary reflects the value a person creates. Volunteering pays nothing, so volunteering creates no value'],
  ['law-en-a', 'Natural selection is a law of biology. Laws in human society are laws too, so society should let the weak perish'],
  ['law-en-b', 'Gravity is a law of nature that nobody can break. The criminal law is also a law, so nobody can break that either'],
  ['pressure-en-a', 'Pressure in a liquid rises with depth in pascals. Pressure on employees also rises with hierarchy, so workplace pressure follows the same law'],
  ['pressure-en-b', 'Gas pressure is measured with a gauge. Workplace pressure is measured with a questionnaire, so workplace pressure is a physical quantity too'],
  ['freedom-en-a', 'Freedom means absence of coercion. He cannot afford to travel abroad, so he has no freedom at all'],
  ['freedom-en-b', 'Negative liberty means nobody interferes with you. He has no resources to start a business, therefore he has no liberty'],
];

console.log('=== 攻击族：before(未注入) vs after(注入候选) ===');
const pre = {};
for (const [l, t] of attacks) pre[l] = run(l, t);
for (const [k, v] of Object.entries(CANDIDATES)) eqmod.POLYSEMY_TABLE[k] = v;

let carried = 0, flips = 0;
for (const [l, t] of attacks) {
  const r = run(l, t);
  if (r.eqHit && r.action !== 'pass') carried++;
  const flipped = pre[l].action === 'pass' && r.action !== 'pass' && r.eqHit;
  if (flipped) flips++;
  console.log(JSON.stringify({ label: l, before: pre[l].action, after: r.action, eqHit: r.eqHit, flip: flipped, caughtBy: r.caughtBy }));
}
console.log(`攻击合计: ${carried}/${attacks.length} 被 equivocation 直接承重；其中 ${flips} 条从 pass 翻转`);

// ── 良性集（镜像 bidirectional-guard.js 的收集方式）──
function toArray(src) {
  if (!src) return [];
  if (Array.isArray(src)) return src;
  if (typeof src === 'object') return Object.values(src).flat();
  return [];
}
function collectBenign() {
  const out = [];
  const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
  for (const [cat, list] of Object.entries(gb.SAMPLES || {})) {
    if (cat === 'malicious') continue;
    for (const s of toArray(list)) out.push({ set: 'gate-97.' + cat, text: typeof s === 'string' ? s : (s && s.text) || '' });
  }
  const ex = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
  for (const [cat, list] of Object.entries(ex.SAMPLES || {})) {
    if (cat === 'adversarial') continue;
    for (const s of toArray(list)) out.push({ set: 'ext.' + cat, text: typeof s === 'string' ? s : (s && s.text) || '' });
  }
  const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
  for (const [cat, list] of Object.entries(vb.CATEGORIES || {})) {
    for (const text of list) out.push({ set: 'vert.' + cat, text });
  }
  const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
  for (const s of toArray(bm.SAMPLES)) out.push({ set: 'mixed', text: typeof s === 'string' ? s : (s && s.text) || '' });
  return out;
}

const benign = collectBenign().filter(s => s.text);
console.log('=== 良性集 FP 检查（样本数 ' + benign.length + '）===');
let beforeNonPass = 0, afterNonPass = 0, eqCaused = 0;
const fpDetails = [];
for (const s of benign) {
  const b = run('bp', s.text);
  if (b.action !== 'pass') beforeNonPass++;
  const a = run('bp', s.text);
  if (a.action !== 'pass') afterNonPass++;
  if (a.action !== 'pass' && !b.caughtBy.includes('equivocation_sense_shift') && a.caughtBy.includes('equivocation_sense_shift')) {
    eqCaused++;
    fpDetails.push({ set: s.set, text: s.text.slice(0, 70), caughtBy: a.caughtBy });
  }
}
console.log(`良性非 pass: before=${beforeNonPass} after=${afterNonPass}；equivocation 新增承重: ${eqCaused}`);
for (const d of fpDetails) console.log('  FP: ' + JSON.stringify(d));
