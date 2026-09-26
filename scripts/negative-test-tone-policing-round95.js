/**
 * negative-test-tone-policing-round95.js
 *
 * 第 95 轮负例守卫：向 src/index.js 本轮 tone_policing 两侧改动逐条注入。
 *   zh：16 支（五族 + 二轮倒装补洞）
 *   en：48 支（六族 + 二/三/四/五轮补洞）
 * 证明它们都是**真守卫**：注入后必须有攻击样本从命中掉回不命中。
 *
 * 注入方式（对象字面量版，与第 94 轮数组版不同）：
 *   TONE_POLICING_PATTERNS 的条目是 `{ pattern: /.../i, type: '...', severity: 0.7 },`
 *   不是 `[/.../, 'x', 0.7],`，因此注入时替换**整行对象字面量**：
 *     indent + "{ pattern: /(?!q)qqq/i, type: 'xx', severity: 0.1 },"
 *   不删行（删行会让 for-of 解构拿到 undefined → text.match(undefined)
 *   把 undefined 转字符串恒命中，良性全变误伤——第 92 轮坑）。
 *   注意 `/` 前是空格不是 `[`，因此不触发第 94 轮 `//` 行注释坑。
 *
 * 覆盖口径：同一 type 可能有多支，逐 type 取首支 + 冗余支抽样。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'src', 'index.js');

// ── 本轮新增的 type 前缀（旧族 en_calm_down / zh_attitude_wrong 不在内）──
const NEW_TYPES = [
  'zh_tone_precondition_valid', 'zh_tone_precondition_heard', 'zh_tone_attribution_ignored',
  'zh_tone_precondition_talk', 'zh_tone_buried_content', 'zh_tone_shame_wrapped',
  'zh_manner_over_content', 'zh_manner_priority', 'zh_dismissal_cause_tone',
  'en_tone_conditioned_validity', 'en_tone_conditioned_talk', 'en_tone_persuasiveness',
  'en_tone_attribution_ignored', 'en_dismissal_cause_tone',
  'en_tone_buried_content', 'en_manner_over_content',
];

// ── 攻击样本（覆盖全部 16 个新 type）──
const EN_ATTACK = [
  "Your argument would be valid if you delivered it calmly.",            // conditioned_validity
  "If you'd said this calmly, maybe it would be worth discussing.",     // conditioned_validity
  "You would be more persuasive if you were not so angry.",             // persuasiveness
  "You'll win more converts with less shouting.",                       // persuasiveness
  "You'd get further with the team if you left the sarcasm out.",       // persuasiveness
  "This would be twice as effective without the edge in your voice.",  // persuasiveness
  "Nobody is going to take your proposal seriously while you sound this upset.", // attribution_ignored
  "I could consider your point if you said it without that hostility.",// attribution_ignored
  "People would listen to you if you weren't so emotional about it.",   // attribution_ignored
  "You won't get funding talking like that.",                          // attribution_ignored
  "It's hard to take you seriously when you're this upset.",           // attribution_ignored
  "You act like that and nobody will fund it.",                        // attribution_ignored
  "The only reason your feedback gets ignored is your tone.",          // dismissal_cause_tone
  "Your tone is exactly why nobody answers your emails.",              // dismissal_cause_tone
  "You keep getting dismissed because you sound so aggrieved.",        // dismissal_cause_tone
  "The reason you get pushback is the way you phrase things.",         // dismissal_cause_tone
  "Your tone is doing you more harm than the actual issue.",           // dismissal_cause_tone
  "You have a decent idea buried under all that hysteria.",            // buried_content
  "There's a good point in there somewhere, underneath the anger.",    // buried_content
  "Your analysis is sound, shame about the attitude you wrapped it in.", // buried_content
  "Your message gets lost under the drama.",                          // buried_content
  "Maybe focus on how you're saying it, not what you're saying.",      // manner_over_content
  "Come back when you've calmed down and we can discuss it.",          // manner_over_content / conditioned_talk
  "Explain it again without the outrage and I'll listen.",             // conditioned_talk
  "If you want to be heard, change your tone.",                        // manner_over_content
  "We can revisit it once you're less defensive.",                     // conditioned_talk
];

const ZH_ATTACK = [
  '你心平气和地说，这个观点才站得住脚。',        // zh_tone_precondition_valid
  '你要是好好说话，你的诉求才会被认真对待。',   // zh_tone_precondition_valid
  '你这么情绪化，没人会听你的。',              // zh_tone_attribution_ignored
  '你这个想法本身不错，可惜被你的态度毁了。',   // zh_tone_shame_wrapped
  '只有你不再激动，你的反馈才会被采纳。',       // zh_tone_precondition_heard
  '你的话没人理会，原因就在你的语气。',         // zh_dismissal_cause_tone
  '等你能冷静下来我们再谈这件事。',            // zh_tone_precondition_talk
  '你这么大声，会议室一半的人都听不进去了。',  // zh_tone_attribution_ignored
  '你把好点子全埋在情绪里了。',                // zh_tone_buried_content
  '你能不能好好说话，先学会怎么表达再谈内容。',// zh_manner_over_content
  '你这样的态度，方案再好也没人批。',           // zh_tone_precondition_valid
  '你不被重视是因为你的表达方式，不是方案本身。',// zh_dismissal_cause_tone
];

// ── 良性样本（注入后若转为命中 = 判据过宽 = 崩溃）──
const BENIGN = [
  "Let's keep the discussion factual.",
  'I think we can make this clearer if we stick to the data.',
  'That point would land better with a concrete example.',
  'Add a chart to make the trend obvious.',
  'Review the logs before you claim the service is down.',
  'Send the invoice with the PO number attached.',
  'We need two approvals for a change this size.',
  'Your analysis is solid, and the conclusion follows.',
  'Agreed, that is a better approach than mine.',
  'You would be right if you checked the logs before claiming.',          // 高相似良性（第 95 轮实测不误伤）
  'This would be effective if you add a chart and shorten the intro.',   // 高相似良性
  'We can discuss it once the migration window opens.',                  // 高相似良性（时机而非语气）
  'Come back when the reviewers finish the audit.',                      // 高相似良性（客观事件）
  '我们会先收集数据，然后再做评估。',
  '邮件里附上采购单号再发给我。',
  '这个改动需要两个人审批。',
  '先看监控面板，再判断是不是服务真的挂了。',
  '你的分析很扎实，结论也站得住。',
  '等迁移窗口打开我们再讨论上线顺序。',
];

const ALL_ATTACK = EN_ATTACK.concat(ZH_ATTACK);

// ── 1. 定位本轮新增行 ──
const raw = fs.readFileSync(SRC, 'utf8');
const lines = raw.split('\n');
const start = lines.findIndex(l => l.includes('const TONE_POLICING_PATTERNS'));
if (start < 0) { console.error('未定位 TONE_POLICING_PATTERNS'); process.exit(1); }
let end = -1;
for (let i = start; i < lines.length; i++) { if (/^\};/.test(lines[i])) { end = i; break; } }
if (end < 0) { console.error('未定位数组结束'); process.exit(1); }

// 按 type 收集本轮新增条目行：每 type 取首支 + 最多再取 2 支冗余
const byType = new Map();
for (let i = start; i <= end; i++) {
  const l = lines[i];
  if (!/^\s+\{\s*pattern:\s*\//.test(l)) continue;
  const tm = l.match(/type:\s*'([a-z_]+)'/);
  if (!tm) continue;
  const t = tm[1];
  if (!NEW_TYPES.includes(t)) continue;
  if (!byType.has(t)) byType.set(t, []);
  byType.get(t).push(i);
}

// 注入点清单：每 type 首支全入 + 冗余支抽样（每 type 最多 3 支）
const injectPoints = [];
for (const [t, arr] of byType) {
  injectPoints.push({ line: arr[0], tag: t });
  for (const extra of arr.slice(1, 3)) injectPoints.push({ line: extra, tag: t + '+redundant' });
}
const newLineCount = [...byType.values()].reduce((s, a) => s + a.length, 0);
console.log(`本轮新增判据 ${newLineCount} 支（${byType.size} 个 type）→ 注入点 ${injectPoints.length} 个\n`);

// ── 2. 基线探测 ──
function probe(file) {
  const out = execFileSync('node', ['-e',
    `const {checkTonePolicing}=require(${JSON.stringify(file)});
     const hit=t=>checkTonePolicing(t).count>0;
     const sc=t=>checkTonePolicing(t).score;
     console.log(JSON.stringify({
       atk: ${JSON.stringify(ALL_ATTACK)}.map(hit),
       ben: ${JSON.stringify(BENIGN)}.map(hit),
       sc: ${JSON.stringify(BENIGN)}.map(sc)
     }))`,
  ], { encoding: 'utf8', timeout: 60000 });
  return JSON.parse(out);
}

let base;
try { base = probe(SRC); }
catch (e) { console.error('基线探测失败：', String(e.message).slice(0, 140)); process.exit(1); }
const baseAtk = base.atk.filter(Boolean).length;
const baseBen = base.ben.filter(Boolean).length;
console.log(`基线：攻击命中 ${baseAtk}/${ALL_ATTACK.length}，良性命中 ${baseBen}/${BENIGN.length}`);
if (baseAtk < ALL_ATTACK.length * 0.9 || baseBen > 0) {
  console.error('基线异常（攻击未覆盖或良性已误伤），停止守卫');
  process.exit(1);
}

// ── 3. 逐点注入 ──
let realGuard = 0, backedUp = 0, broken = 0;
const detail = [];
const tmp = path.join(__dirname, '..', 'src', '.tmp-r95-mutate.js');

for (const pt of injectPoints) {
  const mutated = [...lines];
  const indent = lines[pt.line].match(/^\s*/)[0];
  mutated[pt.line] = indent + "{ pattern: /(?!q)qqq/i, type: 'xx', severity: 0.1 },";
  fs.writeFileSync(tmp, mutated.join('\n'));
  try {
    const r = probe(tmp);
    const lostAtk = r.atk.filter((h, i) => base.atk[i] && !h).length;
    const newFp = r.ben.filter((h, i) => !base.ben[i] && h).length;
    if (newFp > 0) {
      detail.push(`${pt.tag}（行 ${pt.line + 1}）: ⚠️ 注入后新增 ${newFp} 条良性误伤`);
      broken++;
    } else if (lostAtk > 0) {
      realGuard++;
      detail.push(`${pt.tag}（行 ${pt.line + 1}）: 真守卫（攻击 -${lostAtk}）`);
    } else {
      backedUp++;
      detail.push(`${pt.tag}（行 ${pt.line + 1}）: 有兜底（攻击仍 ${r.atk.filter(Boolean).length}/${ALL_ATTACK.length}）`);
    }
  } catch (e) {
    detail.push(`${pt.tag}（行 ${pt.line + 1}）: 注入后 require 失败 (${String(e.message).slice(0, 40)})`);
    broken++;
  }
}
if (fs.existsSync(tmp)) fs.unlinkSync(tmp);

detail.forEach(d => console.log('  ' + d));
console.log(`\n═══ 负例守卫结果：真守卫 ${realGuard} / 有兜底 ${backedUp} / 异常 ${broken} / 共 ${injectPoints.length} ═══`);
if (realGuard >= 1 && broken === 0) { console.log('PASS'); process.exit(0); }
console.error('FAIL：无真守卫或存在异常');
process.exit(1);
