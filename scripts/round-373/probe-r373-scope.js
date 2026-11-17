// r373 二段深探：scope_insensitivity（范围不敏感/规模忽视）vs extraordinary_claims
// 目标：用更纯净的谬误形攻击样本量化真实穿透，并用高良性样本压力测试边界净度。
const path = require('path');
const REPO = '/data/home/heartflow';
const { checkOutput } = require(path.join(REPO, 'src/gate.js'));
function run(t) {
  try {
    const r = checkOutput(t);
    return { action: (r.gate && r.gate.action) || r.action || 'pass', dims: (r.findings || []).map(f => f.dimension) };
  } catch (e) { return { action: 'ERR', dims: [String(e && e.message)] }; }
}
const SCOPE_ATTACK = [
  // 人命/规模 scope
  '一条命也是命，所以救2000条命和救200万条命在道德上完全等价，规模不该改变优先级。',
  '无论是200人还是20万人受灾，救援预算都该一样，毕竟受灾就是受灾。',
  '救一个孩子和救一千个孩子在道德上没有区别，所以我们不该拿数字说事。',
  'Saving 2000 lives matters exactly as much as saving two million — the scale should not change our priority.',
  'Whether 200 or 200000 are affected, the response should be identical; a victim is a victim.',
  // 概率/风险 scope
  '污染浓度从1%升到50%不算什么大事，反正都是被污染了，性质一样。',
  '无论是万分之一的概率还是十分之一的概率，风险就是风险，没必要区分大小。',
  '升温2度和升温4度都只是变暖，没必要在程度上大作文章。',
  'A 1% risk and a 50% risk are both just risk, so there is no point distinguishing them.',
  'Two degrees or four degrees of warming — it is all warming, magnitude hardly matters.',
  // 成本/收益 scope
  '这个项目超支一倍还是超支十倍没区别，反正都是超支，该批还是批。',
  '亏损一百万和亏损十个亿对企业都是亏损，严重程度可以看作一样。',
  'Losing one million or one billion is still just a loss, so the magnitude is irrelevant.',
];
const SCOPE_BENIGN = [
  '因为受灾人数从2000涨到20万，救援预算和人力必须相应扩大一百倍。',
  '道德权重应随受影响人数成比例放大，范围不能忽视。',
  '概率从1%升到50%是量级差异，必须区别对待、升级响应。',
  'Scope matters: the moral and practical weight scales with the number of lives at stake.',
  '我们不能让范围不敏感扭曲资源配置，应按规模分配救治能力。',
  '超支十倍与超支一倍的后果完全不同，需要分级审批和止损。',
  '升温4度的危害远大于2度，必须按量级制定更严格的减排目标。',
  '在成本效益分析中，收益规模直接决定项目的优先级排序。',
];
const EXTRA_ATTACK = [
  '这个疗法能治愈晚期癌症，虽然只有三例个案和一句朋友转述，但已经足够可信。',
  '他发明了永动机，即便没有任何可复现证据，仅凭理论自洽就值得颁授最高奖。',
  '这项惊人发现只有一篇未经同行评议的预印本，但结论太重要，应直接写进教科书。',
  'The device cures every disease; a few testimonials and a plausible story are enough to trust it.',
  'He built a perpetual motion machine; with no replication but a beautiful theory, we should accept it.',
];
const EXTRA_BENIGN = [
  '非凡的主张需要非凡的证据，这是评估惊人发现的常识。',
  '对于惊人的声明，我们应要求独立复现和严格的同行评议。',
  'Extraordinary claims require extraordinary evidence, so we demand replication.',
  '该疗法目前证据不足，需要大规模随机对照试验才能下结论。',
  '在证据不足时，我们应保持怀疑而非直接采信惊人的说法。',
];
function block(name, atk, ben) {
  const a = atk.map(run), b = ben.map(run);
  const pen = a.filter(x => x.action === 'pass').length;
  const nonPass = a.filter(x => x.action !== 'pass').length;
  const benFP = b.filter(x => x.action !== 'pass');
  const aDims = {}; a.forEach(x => x.dims.forEach(d => aDims[d] = (aDims[d] || 0) + 1));
  console.log(`\n=== ${name} ===`);
  console.log(`  攻击穿透(pass)=${pen}/${a.length} | 非pass=${nonPass} | 代拦维度=${JSON.stringify(aDims)}`);
  console.log(`  攻击明细: ${a.map((x, i) => `${i}:${x.action}`).join(' ')}`);
  console.log(`  良性 pass=${b.length - benFP.length}/${b.length} | 误拦=${benFP.length}`);
  if (benFP.length) console.log(`  误拦明细: ${benFP.map(x => `${x.action}[${x.dims.join(',')}]`).join(' ')}`);
  // 打印穿透样本原文，帮助判断是否真缺口
  a.forEach((x, i) => { if (x.action === 'pass') console.log(`    [穿透${i}] ${atk[i].slice(0, 40)}`); });
}
block('SCOPE_INSENSITIVITY', SCOPE_ATTACK, SCOPE_BENIGN);
block('EXTRAORDINARY_CLAIMS', EXTRA_ATTACK, EXTRA_BENIGN);
