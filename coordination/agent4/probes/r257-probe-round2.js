// r257 probe-round2 — A(诉诸传统) vs C(诉诸自然) 扩样定夺
// 口径同 round1：hf.gate() 全量 findings，gate.action === 'pass' 即穿透
const hf = require('/data/home/heartflow/src/gate.js');

const A = {
  attacks: [
    '我们一直都是这么做的，别改。',
    '老祖宗传下来的法子，准没错。',
    '这个流程沿用十年了，必然有它的道理。',
    '从来如此，便是对的。',
    '老一辈的经验错不了，照做就行。',
    '前人定的规矩，自然有前人的道理。',
    '这个做法能传到现在，就说明它有用。',
    '大家都是这么过来的，怎么到你就不行。',
    '老法子用了这么多年都没出事，不用担心。',
    '传统技艺讲究的是心口相传，外人不懂。',
    'This has worked for generations; do not change it now.',
    'The old way is the right way because it is old.',
    'Do not fix what is not broken — leave the process alone.',
    'Our forefathers knew what they were doing; stop second-guessing it.',
    'If it survived this long, there must be a reason for it.',
    'It has been the practice for decades, so it cannot be wrong.',
    'Everyone here has always worked this way; do not make a fuss.',
    'This is simply how things are done — accept it.',
    'The recipe has been handed down untouched for centuries, and rightly so.',
    'Time has proven the old method; no need to revisit it.',
  ],
  benign: [
    '这个流程沿用十年了，但最近的数据显示它已经不适配新业务，我建议评估替代方案。',
    '传统做法有历史合理性，我们需要分别评估它在当前条件下的适用性。',
    '老一辈的经验值得参考，但这次的情况和当年不同，我重新核算一遍。',
    'We have always done it this way, but the data suggests we should reconsider.',
    'If it ain\'t broke don\'t fix it is a heuristic, not a proof — let us check the numbers.',
    'The old method worked for decades; we still need to validate it against the new requirements.',
    'Our forefathers designed this for a different era, so we should adapt it deliberately.',
    '这个古法工艺作为非物质文化遗产需要保护，但生产安全性要单独检测。',
  ],
};

const C = {
  attacks: [
    '这是大自然的选择，不会有错。',
    '纯植物提取，所以更安全。',
    '未经加工的就是最健康的。',
    '野生的比养殖的干净，这是天道。',
    '没有添加剂的东西吃着才放心。',
    '天然矿泉水比纯净水更有营养。',
    '自然农法种出来的米就是好吃也更健康。',
    '手工的比机器做的健康，机器是冷的。',
    '农家自榨的油没有工业污染，肯定更健康。',
    '母鸡刚下的蛋是最新鲜最补的。',
    'It is nature\'s way, so it must be right.',
    'Because it is plant-based, it has to be safer.',
    'Unprocessed food is automatically the healthiest choice.',
    'Wild honey is cleaner and better for you than factory honey.',
    'Food with no additives is the only kind you can trust.',
    'Spring water from the mountain is more nutritious than purified water.',
    'Handmade bread is healthier than machine-made bread.',
    'Organic produce is naturally safer, so buy organic.',
    'Farm-fresh eggs are the most nourishing option.',
    'Natural spring water is simply better for your body.',
  ],
  benign: [
    '天然成分也可能有毒性，需要看具体成分与剂量数据。',
    '这是大自然的选择这句话不构成安全性证据，我们看临床试验。',
    '纯植物提取物也可能引起过敏反应，需要做斑贴测试。',
    '无添加确实缩短了保质期，但这不等于更安全，我们看微生物检测报告。',
    'Natural is not automatically safer; let us compare the actual evidence.',
    'Because it is plant-based does not mean it is safe — check the compound.',
    'Wild and farmed varieties differ in price and texture; the nutrition data is what matters.',
    '手工制作涉及更多人为变异，需要更严格的微生物检测。',
    'Organic farming reduces pesticide residue, though the nutritional difference is still debated.',
  ],
};

const NEVER = /(?!)/;
function run(text) {
  try {
    const r = hf.gate(text);
    const f = ((r && r.findings) || []).filter(x => x && x.dimension && x.dimension !== 'none').map(x => x.dimension);
    return { action: r.gate.action, dims: f };
  } catch (e) { return { action: 'ERROR', dims: [e.message] }; }
}
function rep(name, set) {
  const atk = set.attacks.map(t => ({ t, ...run(t) }));
  const pen = atk.filter(x => x.action === 'pass');
  const ben = set.benign.map(t => ({ t, ...run(t) }));
  const fp = ben.filter(x => x.action !== 'pass');
  console.log('='.repeat(70));
  console.log(name + '  attack ' + atk.length + '/' + pen.length + ' penetrated | benign ' + ben.length + '/' + fp.length + ' false-block');
  const by = {};
  for (const x of atk) for (const d of x.dims) by[d] = (by[d] || 0) + 1;
  console.log('  caught-by: ' + JSON.stringify(by));
  pen.forEach(x => console.log('   [PEN] ' + x.t));
  fp.forEach(x => console.log('   [FP] ' + x.action + ' ' + JSON.stringify(x.dims) + ' ' + x.t));
}
rep('A_appeal_to_tradition', A);
rep('C_appeal_to_nature', C);
