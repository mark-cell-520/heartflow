/**
 * r304 弱证据强断言错配（weak_evidence_strong_claim 第 245 维度）「AI 模型输出
 * 与社交平台视频/直播/博主作为不可回溯弱证据信源」新措辞家族轮测（真升级②）
 *
 * 背景：src/weak-evidence-strong-claim.js（r288 接线）的腿① EVIDENCE 只收三类
 * 证据——口语传闻链（听说/据说/网传/据传）、个人见证（我朋友/亲测/我试过）、
 * 泛称匿名信源（Sources say/people say）。而「AI 模型输出」（ChatGPT 说/AI 说/
 * 豆包说/the AI says）与「社交平台视频/直播/博主内容」（短视频上说/博主说/
 * 直播间里说/A YouTuber said/I saw on TikTok）这两类 2024 年后成为主流的新型
 * 不可回溯信源整族缺席。
 * scripts/round-304/probe-module-wesc-r304.js（v6.8.174，引擎改动前）实测：
 *   攻击 13/15 模块直调 hit=false（2 条命中系句内自带存量腿①：我朋友/亲测）
 *   良性 14/14 干净
 * scripts/round-304/probe-candidates-r304.js（gate() 全量 findings 口径）实测：
 *   「AI 说这个币肯定翻倍」等 4 条 action=pass 真零命中；「ChatGPT 说这款药
 *   百分百有效」被 confidence 代拦但目标维度零归因。
 *
 * 本轮新增 EVIDENCE_AI_ZH / EVIDENCE_AI_EN 平行证据类型常量（8+11 个元素），
 * 在 detect 入口与存量 EVIDENCE_* 合并（不并存量数组，避开 r280/r265
 * length===N 断言），复用既有邻近窗（ZH110/EN320）与四组豁免入口；
 * AI 拉丁族带 /i 标志（gate() 归一化手段是 lowercase）与 (?<![A-Za-z])
 * 边界守卫（防「GAI 说」词内误命中）。
 *
 * 覆盖：
 *   A gate 层 dispatch（13 条攻击 findings 归因 weak_evidence_strong_claim）
 *   B 攻击族命中（模块直调，中英 19 条）
 *   C 良性零误伤（手工 15 条 + 官方语料 378 条全量扫描）
 *   D 存量回归（r288 攻击 16 + 良性 15 + 存量常量逐字保留）
 *   E 负例注入-删条（常量级：EVIDENCE_AI_ZH/EN 置空）
 *   F 元素级注入-删条（逐元素删，专署攻击翻 miss）
 *   G 路由独立性双向对照（删存量不影响新族、删新族不影响存量）
 *   H 登记纪律（新族探针键 + src/index.js 零改动 + 存量长度未变）
 */

'use strict';

const assert = require('assert');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const hf = require(path.join(ROOT, 'src/gate.js'));
const MOD = require(path.join(ROOT, 'src/weak-evidence-strong-claim.js'));
const check = MOD.checkWeakEvidenceStrongClaim;
const I = MOD.__internals();

let passed = 0, failed = 0;
function T(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}\n    ${e.message}`); }
}

// ─── 新族攻击（中文 11 条，元素归属见 F 组）────────────────────────
const ATTACK_ZH = [
  'ChatGPT 说这款药百分百有效，你赶紧买。',            // AI[0]
  'AI 说这个币下周肯定翻倍，我准备全仓。',              // AI[0]
  '豆包说这支股票必然会涨，你就放心买。',              // AI[0]
  '文心一言说这款理财产品稳赚不亏，我准备加仓。',      // AI[0]
  '我问过大模型了，它说这个方法一定能瘦。',            // 问句锚[1]
  '短视频上说这家公司的股票一定翻倍。',                // 视频[2]
  '博主说这款面膜保证三天见效，我已经下单了。',        // 博主[3]
  '网红说这款保健品包治百病，效果特别好。',            // 网红[3]
  '直播间里说这款保健品百分百有效，主播自己都在吃。',  // 直播[4]
  '弹幕都在说这家店绝对正宗。',                        // 弹幕[5]
  '小红书上说这个方法一定能瘦，我打算试试。',          // 平台[6]
  '网友都说这款保健品包治百病，效果特别好。',          // 网友[7]
];
// ─── 新族攻击（英文 8 条）──────────────────────────────────────
const ATTACK_EN = [
  'ChatGPT says this drug is guaranteed safe for everyone.',   // AI[0]
  'ChatGPT told me this coin is guaranteed to double.',        // AI[0]
  'The AI says this crypto will definitely 10x before December.', // AI[1]
  'The chatbot told me this coin is guaranteed to double.',     // AI[1]
  'I saw on TikTok that this stock will certainly double next week.', // saw-on[5]
  'A TikTok video claims this tea completely cures diabetes.', // video[6]
  'A YouTuber said this method is guaranteed to make you lose ten pounds.', // influencer[7]
  'A streamer said this supplement always works, guaranteed.', // influencer[7]
  'Everyone in the livestream says this mask works 100 percent.', // everyone-in[10]
];
const ATTACKS = ATTACK_ZH.concat(ATTACK_EN);

// ─── 新族良性（只有新腿①无腿② / 正确响应形 / 已具名信源 / 疑问句）──
const BENIGN = [
  'ChatGPT 帮我改了一份简历，我觉得还不错。',
  'AI 建议我先做个预算，我再想想。',
  '博主说这支口红显白，我买了果然显白。',
  '主播推荐了这款面霜，我用了感觉挺滋润。',
  '小红书上这家店评分很高，周末去试试。',
  '我问过客服机器人了，它说今天会送到。',
  'My friend sent me a TikTok about a new restaurant downtown.',
  'A YouTuber reviewed this camera and the footage looks good.',
  'The chatbot helped me draft an email to my professor.',
  'I saw a video on Instagram about easy weeknight dinners.',
  'AI 说这款药可能有效，但大模型也会幻觉，需要临床试验验证。',
  '博主说这个方法能瘦，不过个案不能说明问题，还得看研究。',
  'The AI says this coin might go up, but it is not verified.',
  '临床研究表明该药对二型糖尿病有明确疗效。',
  'ChatGPT 说这款药百分百有效，真的吗？',
];

// ─── 存量 r288 攻击/良性（回归基线，逐条取自 r288 测试）──────────
const LEGACY_ATTACK = [
  '听说这款保健品能彻底治愈糖尿病，你赶紧买。',
  '据说喝这个茶百分百能瘦，我朋友亲测有效。',
  '网传这个减肥药包治百病，效果特别好。',
  '网上有人说这家公司的股票下周一定翻倍。',
  '有消息称这家店的东西绝对是全城最安全的。',
  '据传这款药三天就能根治鼻炎，很多人都这么说。',
  '我表哥吃了这个药三天就痊愈了，所以这药肯定能治好你的病。',
  '我邻居用这个方法一周瘦了十斤，这方法百分之百有效。',
  '我朋友亲测这个产品，说是肯定没有任何副作用。',
  '我试了一次就觉得好，这个方法显然适合所有人。',
  'My cousin took this pill and was cured instantly, so it definitely works for everyone.',
  'I heard this supplement completely cures anxiety in all patients.',
  'This worked once for me, so it obviously works for everybody.',
  'Everyone says this crypto will definitely 10x before December.',
  'Sources say this drug is guaranteed safe for all patients.',
  'People say this tea always works for weight loss, guaranteed.',
];
const LEGACY_BENIGN = [
  '听说这款保健品可能对控制血糖有帮助，但我还没找到可靠的研究，需要更多证据。',
  '网上有人说这支股票会涨，不过这只是传闻，我没法验证。',
  '我表哥吃了这个药后症状好转，但个例不能说明疗效，还需要临床试验数据。',
  '我试了一次效果还不错，但样本太少，不能推广到所有人。',
  'Everyone says this crypto might go up, but that is only speculation.',
  'My cousin felt better after taking it, though a single case proves nothing.',
  '临床研究表明该药对二型糖尿病有明确疗效。',
  'According to the clinical trial, this drug reduces blood sugar significantly.',
  '批判性思维课程讲过，传闻不能作为证据使用。',
  'This lecture covered evidence sufficiency and how weak sources fail.',
  '据说最近公司在开会，可能会有一些调整。',
  '听说那家餐厅的菜味道不错。',
  'I heard the meeting has been rescheduled.',
  '听说这个药真的能彻底治愈糖尿病吗？',
  '据说这个方法有效，但不代表适合所有人，还要看具体情况。',
];

function hits(arr, inject) {
  let h = 0;
  for (const t of arr) { try { if (check(t, inject).hit) h++; } catch (_) {} }
  return h;
}

console.log('=== A gate 层 dispatch（findings 归因目标维度）===');
T('A1 新族攻击 21 条 gate.action 全部非 pass', () => {
  for (const t of ATTACKS) {
    const r = hf.gate(t);
    assert.ok(r.gate && r.gate.action !== 'pass', `gate 放行: ${t.slice(0, 40)}`);
  }
});
T('A2 新族攻击 21 条 findings 全部归因 weak_evidence_strong_claim', () => {
  for (const t of ATTACKS) {
    const r = hf.gate(t);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(dims.includes('weak_evidence_strong_claim'),
      `目标维度未归因: ${t.slice(0, 40)} | findings=${dims.join(',')}`);
  }
});

console.log('=== B 攻击族命中（模块直调）===');
T('B1 中文 12/12 命中', () => {
  for (const t of ATTACK_ZH) assert.ok(check(t).hit, `未命中: ${t}`);
});
T('B2 英文 9/9 命中', () => {
  for (const t of ATTACK_EN) assert.ok(check(t).hit, `未命中: ${t}`);
});
T('B3 全部 21 条 count >= 1', () => {
  for (const t of ATTACKS) assert.ok(check(t).count >= 1, t.slice(0, 30));
});

console.log('=== C 良性零误伤 ===');
T('C1 手工良性 15/15 模块直调不判', () => {
  for (const t of BENIGN) {
    const r = check(t);
    assert.ok(!r.hit, `误伤: ${t.slice(0, 50)}`);
  }
});
T('C2 官方良性语料 378 条全量扫描零误伤', () => {
  const corpora = {
    'gate-benchmark': require(path.join(ROOT, 'test/gate-benchmark.js')).SAMPLES,
    'gate-benchmark-extended': require(path.join(ROOT, 'test/gate-benchmark-extended.js')).SAMPLES,
    'benign-mixed': require(path.join(ROOT, 'test/benign-mixed-benchmark.js')).SAMPLES,
    'vertical-benign': require(path.join(ROOT, 'test/vertical-benign-benchmark.js')).CATEGORIES,
  };
  function flat(v, out) {
    if (typeof v === 'string') { out.push(v); return; }
    if (Array.isArray(v)) { for (const x of v) flat(x, out); return; }
    if (v && typeof v === 'object') {
      for (const k of Object.keys(v)) {
        if (k === 'text' && typeof v[k] === 'string') { out.push(v[k]); continue; }
        flat(v[k], out);
      }
    }
  }
  let n = 0;
  for (const raw of Object.values(corpora)) {
    const list = [];
    flat(raw, list);
    for (const t of list) {
      if (typeof t !== 'string' || t.length < 6) continue;
      n++;
      assert.ok(!check(t).hit, `官方良性误伤: ${t.slice(0, 80)}`);
    }
  }
  assert.strictEqual(n, 378, `官方良性语料条数应为 378，实测 ${n}`);
});
T('C3 新族良性 15 条 gate 层全部放行', () => {
  for (const t of BENIGN) {
    const r = hf.gate(t);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('weak_evidence_strong_claim'),
      `良性被目标维度归因: ${t.slice(0, 50)}`);
  }
});

console.log('=== D 存量回归（r288 家族未受影响）===');
T('D1 存量攻击 16/16 仍命中', () => {
  for (const t of LEGACY_ATTACK) assert.ok(check(t).hit, `存量攻击丢失: ${t}`);
});
T('D2 存量良性 15/15 仍放行', () => {
  for (const t of LEGACY_BENIGN) assert.ok(!check(t).hit, `存量良性被误伤: ${t}`);
});
T('D3 存量常量长度未变（r288 提交版实测：56/41/36/27）', () => {
  assert.strictEqual(I.EVIDENCE_ZH.length, 56, `EVIDENCE_ZH 长度应为 56，实测 ${I.EVIDENCE_ZH.length}`);
  assert.strictEqual(I.STRENGTH_ZH.length, 41, `STRENGTH_ZH 长度应为 41，实测 ${I.STRENGTH_ZH.length}`);
  assert.strictEqual(I.EVIDENCE_EN.length, 36, `EVIDENCE_EN 长度应为 36，实测 ${I.EVIDENCE_EN.length}`);
  assert.strictEqual(I.STRENGTH_EN.length, 27, `STRENGTH_EN 长度应为 27，实测 ${I.STRENGTH_EN.length}`);
});
T('D4 存量常量首元素逐字保留（登记纪律）', () => {
  assert.strictEqual(I.EVIDENCE_ZH[0].toString(), '/听说/');
  assert.strictEqual(I.EVIDENCE_EN[0].toString(), '/\\bi\\s+heard\\b/i');
  assert.strictEqual(I.STRENGTH_ZH[0].toString(), '/彻底/');
});

console.log('=== E 负例注入-删条（常量级：删则该族失承重）===');
T('E1 注入 EVIDENCE_AI_ZH:[] → 中文新族攻击 12/12 翻 miss', () => {
  assert.strictEqual(hits(ATTACK_ZH, { EVIDENCE_AI_ZH: [] }), 0);
});
T('E2 注入 EVIDENCE_AI_EN:[] → 英文新族攻击 9/9 翻 miss', () => {
  assert.strictEqual(hits(ATTACK_EN, { EVIDENCE_AI_EN: [] }), 0);
});

console.log('=== F 元素级注入-删条（逐个元素删，专署攻击翻 miss）===');
T('F1 EVIDENCE_AI_ZH[0]（AI 模型输出族）删 → 4 条专署翻 miss', () => {
  const a = I.EVIDENCE_AI_ZH.slice(); a[0] = /(?!)/i;
  assert.strictEqual(hits(ATTACK_ZH, { EVIDENCE_AI_ZH: a }), 8);
});
T('F2 EVIDENCE_AI_ZH[1]（问句锚）删 → 1 条专署翻 miss', () => {
  const a = I.EVIDENCE_AI_ZH.slice(); a[1] = /(?!)/i;
  assert.strictEqual(hits(ATTACK_ZH, { EVIDENCE_AI_ZH: a }), 11);
});
T('F3 EVIDENCE_AI_ZH[2]（视频上说）删 → 1 条专署翻 miss', () => {
  const a = I.EVIDENCE_AI_ZH.slice(); a[2] = /(?!)/i;
  assert.strictEqual(hits(ATTACK_ZH, { EVIDENCE_AI_ZH: a }), 11);
});
T('F4 EVIDENCE_AI_ZH[3]（博主/网红族）删 → 2 条专署翻 miss', () => {
  const a = I.EVIDENCE_AI_ZH.slice(); a[3] = /(?!)/i;
  assert.strictEqual(hits(ATTACK_ZH, { EVIDENCE_AI_ZH: a }), 10);
});
T('F5 EVIDENCE_AI_ZH[6]（社交平台族）删 → 1 条专署翻 miss', () => {
  const a = I.EVIDENCE_AI_ZH.slice(); a[6] = /(?!)/i;
  assert.strictEqual(hits(ATTACK_ZH, { EVIDENCE_AI_ZH: a }), 11);
});
T('F6 EVIDENCE_AI_ZH[7]（网友都说）删 → 1 条专署翻 miss', () => {
  const a = I.EVIDENCE_AI_ZH.slice(); a[7] = /(?!)/i;
  assert.strictEqual(hits(ATTACK_ZH, { EVIDENCE_AI_ZH: a }), 11);
});
T('F7 EVIDENCE_AI_EN[0]（ChatGPT says）删 → 2 条专署翻 miss', () => {
  const a = I.EVIDENCE_AI_EN.slice(); a[0] = /(?!)/i;
  assert.strictEqual(hits(ATTACK_EN, { EVIDENCE_AI_EN: a }), 7);
});
T('F8 EVIDENCE_AI_EN[5]（I saw on X）删 → 1 条专署翻 miss', () => {
  const a = I.EVIDENCE_AI_EN.slice(); a[5] = /(?!)/i;
  assert.strictEqual(hits(ATTACK_EN, { EVIDENCE_AI_EN: a }), 8);
});
T('F9 EVIDENCE_AI_EN[7]（influencer said）删 → 2 条专署翻 miss', () => {
  const a = I.EVIDENCE_AI_EN.slice(); a[7] = /(?!)/i;
  assert.strictEqual(hits(ATTACK_EN, { EVIDENCE_AI_EN: a }), 7);
});
T('F10 EVIDENCE_AI_EN[10]（everyone in chat）删 → 1 条专署翻 miss', () => {
  const a = I.EVIDENCE_AI_EN.slice(); a[10] = /(?!)/i;
  assert.strictEqual(hits(ATTACK_EN, { EVIDENCE_AI_EN: a }), 8);
});

console.log('=== G 路由独立性双向对照 ===');
T('G1 删存量全部腿①（EVIDENCE_ZH/EN:[]）→ 新族攻击 21 条仍全命中', () => {
  assert.strictEqual(hits(ATTACKS, { EVIDENCE_ZH: [], EVIDENCE_EN: [] }), 21);
});
T('G2 删新族（EVIDENCE_AI_ZH/EN:[]）→ 存量攻击 16 条仍全命中', () => {
  assert.strictEqual(hits(LEGACY_ATTACK, { EVIDENCE_AI_ZH: [], EVIDENCE_AI_EN: [] }), 16);
});

console.log('=== H 登记纪律 / 引擎边界 ===');
T('H1 __internals 暴露 2 个新族探针键', () => {
  for (const k of ['EVIDENCE_AI_ZH', 'EVIDENCE_AI_EN']) {
    assert.ok(Array.isArray(I[k]) && I[k].length > 0, `缺少探针键 ${k}`);
  }
});
T('H2 src/index.js 本轮零改动（HEAD diff + 工作区均空）', () => {
  let out = '';
  try {
    out = execFileSync('git', ['diff', '--name-only', 'HEAD', '--', 'src/index.js'],
      { cwd: ROOT, encoding: 'utf8' });
  } catch (_) { out = ''; }
  const wt = execFileSync('git', ['status', '--porcelain', '--', 'src/index.js'],
    { cwd: ROOT, encoding: 'utf8' });
  assert.strictEqual((out + wt).trim(), '', `src/index.js 有改动: ${out}${wt}`);
});
T('H3 维度计数不变（本维度 r288 起已在 gate 层 dimMap，无新键）', () => {
  // 真升级②：既有维度新措辞家族，dimMap 键数不变；probe 实证本族直调
  // detectWeakEvidenceStrongClaim 已由 src/index.js 既有接线点调度。
  const idx = require('fs').readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  assert.ok(/_checkWeakEvidenceStrongClaim/.test(idx),
    'src/index.js 应保持 r288 既有 weak_evidence_strong_claim 接线点');
});

console.log(`\nround-304-weak-evidence-ai-source: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('✅ round-304-weak-evidence-ai-source PASS');
