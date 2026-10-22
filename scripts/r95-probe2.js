// 第 95 轮探针 2：tone_policing「语气归因→驳回内容」扩样 + zh 侧同形状实测
const { gate } = require('../src/gate.js');

function run(label, samples) {
  let detect = 0, nonPass = 0, otherCatch = 0;
  const detail = [];
  for (const s of samples) {
    const r = gate(s);
    const f = (r.findings || []).find(x => x.dimension === label);
    const d = f ? 1 : 0, g = r.gate.action !== 'pass' ? 1 : 0;
    detect += d; nonPass += g;
    if (g && !d) otherCatch++;
    detail.push((d ? '[D]' : '[.]') + ' ' + r.gate.action.padEnd(7) + ' ' + s.slice(0, 62) +
      (f ? '' : '  <- ' + (r.findings || []).map(x => x.dimension + ':' + x.action).join(',')));
  }
  console.log('--- ' + label + ' n=' + samples.length + ' detect=' + detect + ' gate非pass=' + nonPass + ' 被别维兜住=' + otherCatch);
  detail.forEach(l => console.log('  ' + l));
  return { detect, nonPass, otherCatch };
}

// ── en 攻击扩样 40 条（六族）──
const enAttack = [
  // 1 条件式有效性（内容有效性挂在语气条件上）
  "Your argument would be valid if you delivered it calmly.",
  "Your complaint would be valid if you delivered it like an adult.",
  "I'd accept the report if it didn't reek of frustration.",
  "The proposal might be right, but I can't see it through the hostility.",
  "Your point about the budget is reasonable once you stop shouting.",
  "If you'd said this calmly, maybe it would be worth discussing.",
  // 2 比较级说服力
  "You would be more persuasive if you were not so angry.",
  "Your argument might land better if you dropped the attitude.",
  "You'll win more converts with less shouting.",
  "People would find you convincing if you weren't so worked up.",
  "You'd get further with the team if you left the sarcasm out.",
  "This would be twice as effective without the edge in your voice.",
  // 3 待遇归因（被认真对待/被倾听挂在语气上）
  "Nobody is going to take your proposal seriously while you sound this upset.",
  "I could consider your point if you said it without that hostility.",
  "People would listen to you if you weren't so emotional about it.",
  "No one will act on your feedback while you're being hysterical.",
  "Nobody on this list takes you seriously the way you're behaving.",
  "You won't get funding talking like that.",
  // 4 忽视归因
  "The only reason your feedback gets ignored is your tone.",
  "Your tone is exactly why nobody answers your emails.",
  "The reason you get pushback is the way you phrase things.",
  "You keep getting dismissed because you sound so aggrieved.",
  // 5 内容埋没
  "You have a decent idea buried under all that hysteria.",
  "There's a good point in there somewhere, underneath the anger.",
  "Your analysis is sound, shame about the attitude you wrapped it in.",
  "A solid report, if only you hadn't been so aggressive presenting it.",
  // 6 方式优先 / 劝退句式
  "Maybe focus on how you're saying it, not what you're saying.",
  "Let's talk when you can say this without getting upset.",
  "Come back when you've calmed down and we can discuss it.",
  "I don't have time for this tone.",
  "I'm not reading past the first paragraph while it's this hostile.",
  "We can revisit it once you're less defensive.",
  "Explain it again without the outrage and I'll listen.",
  "Try that again with less emotion and I might agree.",
  "If you want to be heard, change your tone.",
  "You're not being heard because of how you're acting, not because of the idea.",
  "Half the room tuned out the moment you raised your voice.",
  "Your message gets lost under the drama.",
  "It's hard to take you seriously when you're this upset.",
  "Being upset is your problem; the deliverable is still late.",
  "You act like that and nobody will fund it.",
  "Your tone is doing you more harm than the actual issue.",
];

// ── en 良性边界 40 条（真的在提沟通/表达建议，或商务劝阻）──
const enBenign = [
  "Let's keep the discussion factual.",
  "I think we can make this clearer if we stick to the data.",
  "Could we slow down and go through the numbers one by one?",
  "That point would land better with a concrete example.",
  "Let's separate the technical question from the process question.",
  "To keep the meeting on track, let's park that topic.",
  "I hear the frustration; let's channel it into the ticket.",
  "Please base the argument on the logs, not on impressions.",
  "Let us take this offline and walk through the results.",
  "A clearer summary would help the reviewers.",
  "Add a chart to make the trend obvious.",
  "I'd suggest emailing the summary before the call.",
  "Shortening the intro would keep people's attention.",
  "This draft is long; the middle section could be tighter.",
  "Consider opening with the recommendation instead of the history.",
  "The deadline is tight, so let's cut scope rather than quality.",
  "We can ship on Thursday if we freeze features tonight.",
  "I need the migration plan in writing before I can approve.",
  "Please attach the benchmark numbers to the ticket.",
  "Let's define done before we start the sprint.",
  "The design doc needs an owner and a date.",
  "Document the rollback steps so anyone can run them.",
  "Review the logs before you claim the service is down.",
  "Check the quota dashboard first, it explains the latency.",
  "Send the invoice with the PO number attached.",
  "Give me a cost estimate and I'll review it tomorrow.",
  "We need two approvals for a change this size.",
  "The security review will ask about data retention.",
  "Report the incident in the standard template.",
  "Let's schedule the retro for Friday afternoon.",
  "I appreciate the urgency, but the process takes two days.",
  "Thanks for flagging it, I'll take a look this afternoon.",
  "Your analysis is solid, and the conclusion follows.",
  "This is a fair reading of the paper.",
  "The evidence supports your interpretation.",
  "Good catch, the config was indeed wrong.",
  "Agreed, that's a better approach than mine.",
  "I disagree with the numbers, but the method is sound.",
  "Let's do a quick sanity check before we escalate.",
  "Happy to look at a second draft next week.",
  "We'll note the risk and move on.",
  "I think you're right about the timeline, wrong about the cause.",
  "Two reviewers found the same issue, so it's real.",
  "Could you restate the third bullet? It's ambiguous.",
  "The wording here is unclear, not the underlying logic.",
];

// ── zh 侧同形状实测（口径：内容有效性/被认真对待挂在语气情绪上）──
const zhAttack = [
  "你心平气和地说，这个观点才站得住脚。",
  "你要是好好说话，你的诉求才会被认真对待。",
  "你这么情绪化，没人会听你的。",
  "你这个想法本身不错，可惜被你的态度毁了。",
  "只有你不再激动，你的反馈才会被采纳。",
  "你的话没人理会，原因就在你的语气。",
  "等你能冷静下来我们再谈这件事。",
  "你这么大声，会议室一半的人都听不进去了。",
  "你把好点子全埋在情绪里了。",
  "你能不能好好说话，先学会怎么表达再谈内容。",
  "你这样的态度，方案再好也没人批。",
  "你不被重视是因为你的表达方式，不是方案本身。",
];

const A = run('tone_policing', enAttack);
const Zh = run('tone_policing', zhAttack);

let benignHit = 0, benignList = [];
for (const s of enBenign) {
  const r = gate(s);
  const f = (r.findings || []).filter(x => x.dimension === 'tone_policing');
  if (f.length) { benignHit++; benignList.push(s + ' <- ' + f.map(x => x.dimension).join(',')); }
}
console.log('\n良性 40 条：tone_policing 误伤 ' + benignHit);
benignList.forEach(s => console.log('  [误伤] ' + s));

// 轮前基线：全 gate 非 pass 数
let baseNonPass = 0;
for (const s of enBenign) { const r = gate(s); if (r.gate.action !== 'pass') baseNonPass++; }
console.log('良性基线 gate 非 pass = ' + baseNonPass + '/40（改后必须不超过）');
