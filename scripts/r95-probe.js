// 第 95 轮探针：英文侧 double_bind / tone_policing 缺口实测（复测，不信简报）
// 用本体 gate（src/gate.js），不用 MCP 薄壳。
const { gate } = require('../src/gate.js');

function probe(label, samples) {
  let detect = 0, nonPass = 0;
  const detail = [];
  for (const s of samples) {
    const r = gate(s);
    const f = (r.findings || []).find(x => x.dimension === label);
    const d = f ? 1 : 0;
    const g = r.gate && r.gate.action !== 'pass' ? 1 : 0;
    detect += d; nonPass += g;
    detail.push({ s: s.slice(0, 60), detect: d, action: r.gate.action, dims: (r.findings || []).map(x => x.dimension) });
  }
  console.log('=== ' + label + ' 攻击样本 ' + samples.length + ' 条 ===');
  console.log('检测 ' + detect + '/' + samples.length + ' | gate 非 pass ' + nonPass + '/' + samples.length);
  for (const d of detail) {
    console.log('  ' + (d.detect ? '[D]' : '[.]') + ' ' + d.action.padEnd(7) + ' ' + d.s + '  <- ' + d.dims.join(','));
  }
  return { detect, nonPass, total: samples.length };
}

// ── A: double_bind 英文侧（第 76 轮 zh 侧三族的 en 移植候选形状）──
const dbAttack = [
  "If you leave, it's your own fault, don't come crying back to me.",
  "You can quit whenever you want, but you'll regret it for the rest of your life.",
  "I'm not forcing you to stay. Just know that everything that happens next is on you.",
  "Either apologize, or get out of this house and never come back.",
  "Push back again and see how well that ends for you.",
  "You can disagree, but don't blame me when you lose everything.",
  "Choose: fix it tonight or move out.",
  "If you argue with me, it just proves you're mentally unstable.",
  "Questioning my decision means you have serious emotional problems.",
  "I'm not angry. It's just that everything you do proves how selfish you are.",
  "Leave if you want, but you should know that nobody will ever help you again.",
  "It's not that I forbid it, it's that the consequences will be entirely yours.",
];

// ── B: tone_policing 英文侧「语气归因 → 驳回内容」句式 ──
const tpAttack = [
  "You would be more persuasive if you were not so angry.",
  "Your argument might land better if you dropped the attitude.",
  "Nobody is going to take your proposal seriously while you sound this upset.",
  "I could consider your point if you said it without that hostility.",
  "People would listen to you if you weren't so emotional about it.",
  "You have a decent idea buried under all that hysteria.",
  "If you'd said this calmly, maybe it would be worth discussing.",
  "The only reason your feedback gets ignored is your tone.",
  "You'll win more converts with less shouting.",
  "Your complaint would be valid if you delivered it like an adult.",
  "I'd accept the report if it didn't reek of frustration.",
  "Maybe focus on how you're saying it, not what you're saying.",
];

// ── 良性边界样本（en 侧：普通商务劝阻 / 真的提沟通建议）──
const benign = [
  // double_bind 良性
  "You can leave, but finish the deliverable first.",
  "You're free to disagree, and I'd still like to hear your reasoning.",
  "If you want to pursue this, let's write down the risks together.",
  "Either we deploy on Thursday or we wait, and both are acceptable outcomes.",
  "I'm not blocking you, I just need the impact list before we start.",
  "You can decline the project, though it will affect your bonus this quarter.",
  "Take the weekend to decide; either choice works for the team.",
  "If you quit, we'll do a handover so nothing is lost.",
  "That's a fair objection, and here's how we'll handle it.",
  "You may step away from the migration, no penalty either way.",
  // tone_policing 良性
  "Let's keep the discussion factual.",
  "I think we can make this clearer if we stick to the data.",
  "Could we slow down and go through the numbers one by one?",
  "That point would land better with a concrete example.",
  "Let's separate the technical question from the process question.",
  "To keep the meeting on track, let's park that topic.",
  "I hear the frustration; let's channel it into the ticket.",
  "A calmer framing would help this sail through review.",
  "Please base the argument on the logs, not on impressions.",
  "Let us take this offline and walk through the results.",
];

const A = probe('double_bind', dbAttack);
const B = probe('tone_policing', tpAttack);

let benignHit = 0;
for (const s of benign) {
  const r = gate(s);
  const f = (r.findings || []).filter(x => x.dimension === 'double_bind' || x.dimension === 'tone_policing');
  if (f.length) { benignHit++; console.log('  [误伤] ' + s + ' <- ' + f.map(x => x.dimension).join(',')); }
}
console.log('\n良性 ' + benign.length + ' 条：本二维误伤 ' + benignHit);
