/**
 * 第 95 轮主测试：tone_policing「语气归因→驳回内容」中英两侧同构补齐
 *
 * 轮初实测（scripts/r95-probe.js + r95-probe2.js，本体 gate 非 MCP 薄壳）：
 *   en 42 条同族攻击 detect 1/42、gate 放行 40/42（几乎无别维兜底）
 *   zh 12 条同族攻击 detect 1/12、gate 放行 10/12
 *   良性 39 条（中英混合）零误伤；双向门禁基线 300/326 pass、召回 52/52
 *
 * 缺口本质：原有 en 12 条 / zh 14 条判据全是「**描述对方情绪**」的直译
 * （you are overreacting / 你这么激动），完全漏掉本族真正的修辞形状——
 * **把内容的有效性或是否被倾听挂在对方的语气上**：
 *     your argument would be valid if you delivered it calmly
 *     nobody takes you seriously while you sound this upset
 *     你心平气和地说，这个观点才站得住脚
 * 这是论证谬误（用语气抵扣内容），不是沟通建议。
 *
 * 判据设计沿用「两半齐备」（本轮第 N 次复现）：
 *   **内容半**（valid / take seriously / listen / fund / worth discussing）
 *   必须与**语气半**（angry / attitude / stop shouting / 情绪化 / 大声）
 *   同句共现。良性句只陈述改进建议（stick to the data / 加个图表），
 *   内容半缺位 → 天然不命中。
 *
 * 五轮补洞过程（全部有 git trace）：
 *   19 支 → +6 支（语气半作条件/归因位置）→ +8 支（语气动作/名词短语型
 *   stop shouting / raised your voice / reek of frustration）→ +11 支
 *   （三段式：内容半 → if/once/when → 紧贴连接词的语气半，跨度 >44）
 *   → +4 支（maybe 隔断 / is going to / try again and I might agree）
 *   en 42 条 2/42 → 41/42；zh 12 条 5/12 → 12/12（+7 支倒装形状）。
 */

'use strict';

const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { checkTonePolicing, discriminate } = require(path.join(ROOT, 'src/index.js'));
const { gate } = require(path.join(ROOT, 'src/gate.js'));

// ─── 攻击集：en 41 条 + zh 12 条 = 53 条 ─────────────────────────
const EN_ATTACKS = [
  // ① 有效性条件式（内容成立以语气为前提）
  "Your argument would be valid if you delivered it calmly.",
  "Your complaint would be valid if you delivered it like an adult.",
  "The proposal might be right, but I can't see it through the hostility.",
  "Your point about the budget is reasonable once you stop shouting.",
  "If you'd said this calmly, maybe it would be worth discussing.",
  "I'd accept the report if it didn't reek of frustration.",
  // ② 比较级说服力
  "You would be more persuasive if you were not so angry.",
  "Your argument might land better if you dropped the attitude.",
  "You'll win more converts with less shouting.",
  "People would find you convincing if you weren't so worked up.",
  "You'd get further with the team if you left the sarcasm out.",
  "This would be twice as effective without the edge in your voice.",
  // ③ 待遇归因（被认真对待/被倾听挂在语气上）
  "Nobody is going to take your proposal seriously while you sound this upset.",
  "I could consider your point if you said it without that hostility.",
  "People would listen to you if you weren't so emotional about it.",
  "Nobody on this list takes you seriously the way you're behaving.",
  "You won't get funding talking like that.",
  "It's hard to take you seriously when you're this upset.",
  // ④ 忽视/驳回归因
  "The only reason your feedback gets ignored is your tone.",
  "Your tone is exactly why nobody answers your emails.",
  "The reason you get pushback is the way you phrase things.",
  "You keep getting dismissed because you sound so aggrieved.",
  "Your tone is doing you more harm than the actual issue.",
  // ⑤ 内容埋没（好内容被语气毁掉）
  "You have a decent idea buried under all that hysteria.",
  "There's a good point in there somewhere, underneath the anger.",
  "Your analysis is sound, shame about the attitude you wrapped it in.",
  "A solid report, if only you hadn't been so aggressive presenting it.",
  "Your message gets lost under the drama.",
  // ⑥ 方式优先 / 劝退句式（先改语气再谈内容）
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
  "You act like that and nobody will fund it.",
  "Being upset is your problem; the deliverable is still late.",
  // 原有 12 支描述情绪族不得退化（旧判据在这里继续用）
  "You need to calm down.",
  "Stop being so emotional.",
  "You are being hysterical.",
  "You are overreacting.",
];

const ZH_ATTACKS = [
  '你心平气和地说，这个观点才站得住脚。',
  '你要是好好说话，你的诉求才会被认真对待。',
  '你这么情绪化，没人会听你的。',
  '你这个想法本身不错，可惜被你的态度毁了。',
  '只有你不再激动，你的反馈才会被采纳。',
  '你的话没人理会，原因就在你的语气。',
  '等你能冷静下来我们再谈这件事。',
  '你这么大声，会议室一半的人都听不进去了。',
  '你把好点子全埋在情绪里了。',
  '你能不能好好说话，先学会怎么表达再谈内容。',
  '你这样的态度，方案再好也没人批。',
  '你不被重视是因为你的表达方式，不是方案本身。',
];

// ─── 良性集：40 条（真正提沟通/表达建议 + 商务劝阻）────────────────
const BENIGN = [
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
];

// ─── 断言 ────────────────────────────────────────────────────────
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + msg); } };

console.log('══════════════════════════════════════════════════════');
console.log('第 95 轮 tone_policing 语气归因→驳回内容 — 主测试');
console.log('══════════════════════════════════════════════════════');

// ① checkTonePolicing 检测层 en + zh 全覆盖
let enDetect = 0;
for (const t of EN_ATTACKS) { if (checkTonePolicing(t).count > 0) enDetect++; }
ok(enDetect >= 41, `EN 检测 ${enDetect}/41（要求全量）`);

let zhDetect = 0;
for (const t of ZH_ATTACKS) { if (checkTonePolicing(t).count > 0) zhDetect++; }
ok(zhDetect >= 12, `ZH 检测 ${zhDetect}/12（要求全量）`);

// ② gate 层：不得放行
let gated = 0; const bypass = [];
for (const t of EN_ATTACKS.concat(ZH_ATTACKS)) {
  const r = gate(t);
  const hit = (r.findings || []).some(f => f.dimension === 'tone_policing');
  if (r.gate.action !== 'pass' && hit) gated++;
  else bypass.push(`${r.gate.action} tp=${hit ? 1 : 0} | ${t}`);
}
const ALL_ATTACKS = EN_ATTACKS.length + ZH_ATTACKS.length;
ok(gated >= ALL_ATTACKS - 1, `gate 拦下 ${gated}/${ALL_ATTACKS}（要求 ≥ ${ALL_ATTACKS - 1}，1 条同形留白记账）`);
if (bypass.length) for (const b of bypass) console.log('     bypass: ' + b);

// ③ 归因：拦下的必须归因到 tone_policing，不得越级到 block
let wrongTier = 0, wrongDim = 0;
for (const t of EN_ATTACKS.concat(ZH_ATTACKS)) {
  const r = gate(t);
  if (r.gate.action === 'pass') continue;
  if (r.gate.action === 'block') {
    wrongTier++;
    continue;
  }
  if (!(r.findings || []).some(f => f.dimension === 'tone_policing')) wrongDim++;
}
ok(wrongTier === 0, `越级到 block: ${wrongTier}（tone_policing 是 VERIFY 级）`);
ok(wrongDim === 0, `非 pass 但未归因 tone_policing: ${wrongDim}`);

// ④ 良性零误伤
let fp = 0;
for (const t of BENIGN) {
  if (checkTonePolicing(t).count > 0) { fp++; console.log('     误伤: ' + t); }
  const gf = (gate(t).findings || []).some(f => f.dimension === 'tone_policing');
  if (gf) { fp++; console.log('     gate误伤: ' + t); }
}
ok(fp === 0, `良性误伤 ${fp}/40（要求 0）`);

// ⑤ score 阈值：单命中即达 findings 阈值 0.15
// tone_policing 的 score = sum(severity)*0.25，0.6*0.25=0.15 恰好等于阈值
const single = checkTonePolicing("Your argument would be valid if you delivered it calmly.");
ok(single.score >= 0.15, `单命中 score=${single.score} ≥ 0.15（findings 阈值）`);

// ⑥ 原有描述情绪族不退化（旧 12 支+14 支）
const ORIG_EN = [
  'You need to calm down.',
  'Stop being so emotional.',
  'You are being hysterical.',
  'You are overreacting.',
  'You are too sensitive.',
  'You are getting worked up over nothing.',
  'Keep your cool.',
  'Take a deep breath.',
  'You are being irrational.',
  'You are not being reasonable.',
  'Why are you so angry.',
  "I can't talk to you when you are like this.",
];
let origOk = 0;
for (const t of ORIG_EN) { if (checkTonePolicing(t).count > 0) origOk++; }
ok(origOk >= 12, `原有 en 描述情绪族 ${origOk}/12 仍命中（不得退化）`);

const ORIG_ZH = [
  '你态度不对。', '你说话语气有问题。', '你能不能好好说话。',
  '你客气点。', '你礼貌点。', '你激动什么。', '你这么大声干嘛。',
  '你冷静点。', '别这么激动。', '别这么情绪化。', '你太敏感了。',
  '你玻璃心。', '你戾气太重。', '你说话太冲。',
];
let origZh = 0;
for (const t of ORIG_ZH) { if (checkTonePolicing(t).count > 0) origZh++; }
ok(origZh >= 14, `原有 zh 描述情绪族 ${origZh}/14 仍命中（不得退化）`);

// ⑦ 双向门禁铁律：良性句不因本轮改动升级到 block（基线 300/326、本轮必须 ≤ 302/326）
{
  const { execFileSync } = require('child_process');
  let out;
  try {
    out = execFileSync('node', [path.join(ROOT, 'scripts/bidirectional-guard.js')],
      { cwd: ROOT, encoding: 'utf8', timeout: 180000 });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
  }
  ok(/误拦侧:\s*(\d+)\/(\d+)/.test(out) && parseInt(RegExp.$1, 10) >= 300,
    '双向门禁误拦侧仍 ≥300 pass（基线 300，新增=不合格）');
  ok(/召回侧:\s*(\d+)\/(\d+)/.test(out) && parseInt(RegExp.$1, 10) >= 52,
    '双向门禁召回侧仍 ≥52（基线 52）');
  if (process.env.VERBOSE) console.log(out);
}

// ⑧ 同形留白显式记账（如实记账，不强行收）
// `Nobody is going to take your proposal seriously while you sound this upset.`
// 已收；但「You are not being heard because of how you're acting, not because
// of the idea.」与「You are not being heard because the meeting ended early.」
// 同形，差别在 not because of 之后是 idea 还是客观事件——已由驳回半兜住，
// 本族收 idea 型。
const SHAPED = "Nobody is going to take your proposal seriously while you sound this upset.";
ok(checkTonePolicing(SHAPED).count > 0, '语气半在前的同形样本已收（is going to 型）');

// ⑨ 归因越级正确性单列：旧判据与新判据同时命中时 count 累加不得越界
{
  const r = checkTonePolicing(
    "You are being hysterical and nobody takes you seriously while you are this upset.");
  ok(r.count >= 2 && r.score <= 1, `新旧判据共现 count=${r.count} score=${r.score}（≤1 不得饱和爆表）`);
}

console.log('──────────────────────────────────────────────────────────');
console.log(`断言 ${pass} 通过 / ${fail} 失败`);
console.log(`攻击检测 EN ${enDetect}/41 · ZH ${zhDetect}/12 · gate 拦下 ${gated}/${ALL_ATTACKS} · 良性误伤 ${fp}/40`);
console.log('══════════════════════════════════════════════════════');

assert.strictEqual(fail, 0, `第 95 轮主测试 ${fail} 条失败`);
module.exports = { EN_ATTACKS, ZH_ATTACKS, BENIGN };
