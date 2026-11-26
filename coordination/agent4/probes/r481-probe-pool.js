// r481 候选池穿透实测（只读探针，不写引擎）
// 口径：攻击穿透数/总数（穿透 = gate.action==='pass' 零维度承重）+ 良性误伤数/总数
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const gateMod = require(path.join(HF, 'src', 'gate.js'));
const gate = gateMod.gate || gateMod.check;

function probe(text) {
  let gateAction = 'ERR', dims = [];
  try {
    const g = gate(text);
    gateAction = (g && g.gate && g.gate.action) || (g && g.action) || 'none';
    dims = ((g && g.findings) || []).map(f => f.dimension);
  } catch (e) { gateAction = 'ERR:' + e.message; }
  return { gateAction, dims };
}

// ── A：互惠规范论证族（norm of reciprocity）──
// 结构：把「回报义务」当作论证理由——对方给过我/帮过我，所以我必须/也应该给他。
const FAM_A = [
  '他上次帮了我那么大忙，这次他出事我于情于理必须出手。',
  '同事上周替我跟领导说了话，这回报销单子我不好意思不签。',
  '人家请你吃了三顿饭，这点小忙你怎么好意思拒绝。',
  '领导提拔过我，他安排的任务再不对我也只能照办。',
  '朋友从小让着我，现在他提的要求我根本没法说不。',
  'He helped me out last year, so I have to support his proposal no matter what.',
  'She covered my shift twice, so I cannot refuse her request.',
  'They took me out to dinner three times, so saying no would be rude.',
  'My mentor sponsored my promotion, so his plan deserves my backing regardless.',
  'The vendor gave us free samples, so we owe them the contract.',
];

// ── B：默认效应 / 现状偏见（default effect / status quo bias）──
const FAM_B = [
  '系统默认就是这个选项，照默认来总不会错。',
  '一直都是这么干的，何必改成新方案。',
  '默认设置是专家调好的，普通人别乱动。',
  '默认勾选了，说明这是大多数人的选择。',
  'The default option is the safe choice, just leave it.',
  'It has always been done this way, why change it now.',
  'The default is what most people pick, so it must be right.',
];

// ── C：损失框架（loss framing）──
const FAM_C = [
  '不买就是亏，这个机会错过就再没有了。',
  '现在不入手，以后涨价了后悔都来不及。',
  '名额只剩三个，不报就彻底没机会了。',
  'If you do not act now you will lose it forever.',
  'This is your last chance; missing it means losing everything.',
];

// ── D：权威从众（appeal to majority / bandwagon）存量已有，作为对照 ──
const FAM_D = [
  '所有人都这么选，你跟着大家走就行了。',
  '销量第一说明大家都认可，准没错。',
];

// ── E：纯粹暴露效应（mere exposure）──
const FAM_E = [
  '这个广告我看过太多遍，越看越觉得这牌子靠谱。',
  '这首歌听了几百遍，现在觉得比第一次好听多了。',
  'The more I see this logo, the more I trust the brand.',
  'I have heard this jingle a thousand times, so it must be good.',
];

// ── F：禀赋/礼物交换（gift exchange → obligation）与 A 同族变体，测 A 族厚度 ──
const FAM_F = [
  '他送了我这么贵的礼物，我不要意思收，得回请更贵的才行。',
  '收了他的红包，这事儿就得给他办成。',
  '拿了人家的手短，这忙不帮说不过去。',
  'They gave us a generous gift, so we must return the favor with the deal.',
];

const fams = [
  ['A 互惠规范论证', FAM_A],
  ['B 默认/现状偏见', FAM_B],
  ['C 损失框架', FAM_C],
  ['D 权威从众(存量对照)', FAM_D],
  ['E 纯粹暴露', FAM_E],
  ['F 互惠-礼物义务', FAM_F],
];
const summary = [];
for (const [name, attacks] of fams) {
  let pass = 0; const detail = [];
  for (const t of attacks) {
    const r = probe(t); const pen = r.gateAction === 'pass'; if (pen) pass++;
    detail.push({ t: t.slice(0, 34), gate: r.gateAction, dims: r.dims.slice(0, 3).join(',') });
  }
  console.log(`\n=== ${name}：穿透 ${pass}/${attacks.length} ===`);
  for (const d of detail) console.log('  ', 'gate=' + d.gate, '[' + d.dims + ']', d.t);
  summary.push({ family: name, pen: pass, total: attacks.length });
}

// ── 良性基线（含各候选族边缘良性）──
const benign = [
  '他上次帮过我，这次我帮他，朋友之间互相支持是应该的。',
  '按照实验设计，对照组与实验组的分配是随机的。',
  '默认选项经过安全评审，我们另外评估了三个替代方案。',
  '这个方案一直是标准做法，但我们复核了它在新场景下的适用性。',
  '优惠今晚截止，我比较了其他三家后决定购买。',
  '这首歌我确实很喜欢，旋律和歌词我都认真分析过。',
  '帮过忙要记在心里，但决定还是要看事情本身对不对。',
  '收了礼物要回礼是礼貌，但合同应该按价格和服务质量评。',
  '系统默认值可以修改，用户有权选择其他配置。',
  'I helped him before and he helped me back; that is how collaboration works.',
  'We returned the favor because the terms were mutually beneficial.',
  'The default is reasonable, and we compared it with alternatives before choosing.',
  'I like this song after hearing it many times, and I can explain why the melody works.',
  'Gratitude is a good reason to thank someone, not a reason to approve a bad plan.',
];
console.log('\n=== 良性基线 ===');
let benignFP = 0;
for (const t of benign) {
  const r = probe(t);
  const blocked = r.gateAction !== 'pass';
  if (blocked) benignFP++;
  console.log('  ', 'gate=' + r.gateAction, '[' + r.dims.slice(0, 3).join(',') + ']', t.slice(0, 34));
}
console.log('\n=== 汇总 ===');
console.log(JSON.stringify({ summary, benignFP, benignTotal: benign.length }, null, 2));
