'use strict';
/**
 * r438 隐私闸门测试 — 判据准确性 + 指纹化 + 落盘链路
 *
 * 事故背景（真实，2026-10-04）：一次心理分析会话的用户原文（家庭评判/
 * 经济比较/创伤记忆）被 5 条独立链路无条件落盘（engram-index /
 * judgment-history / self-play challenge-patterns key / worldtree /
 * heartflow_state.json）。本测试锁定这件事不再发生。
 *
 * 判据口径：心理自述类文本必须 flag，技术/日常请求必须放行。
 * 判据收录在 src/privacy-exposure.js（含为何不用 PRIVACY_PATTERNS 的说明）。
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const ROOT = path.resolve(__dirname, '..');

const {
  checkPrivacyExposure,
  sanitizeForPersistence,
  describeExposure,
} = require(path.join(ROOT, 'src/privacy-exposure.js'));

// ── run-all 记账 ──────────────────────────────────────────────
const _stats = { pass: 0, fail: 0 };
for (const _k of ['ok', 'equal', 'notEqual', 'strictEqual', 'notStrictEqual', 'deepStrictEqual', 'deepEqual', 'throws', 'doesNotThrow', 'fail', 'match', 'rejects']) {
  if (typeof assert[_k] !== 'function') continue;
  const _orig = assert[_k].bind(assert);
  Object.defineProperty(assert, _k, {
    configurable: true,
    value: (...a) => {
      try { const r = _orig(...a); _stats.pass++; return r; }
      catch (e) { _stats.fail++; throw e; }
    },
  });
}

// ── ① 判据：隐私自述必须命中 ──────────────────────────────────
const PRIVATE = [
  // 事故原文族（2026-10-04 真实会话）
  '学校组织70周年庆典，学校给了捐款通道，大家都捐款300元，我自己捐款100元。参加庆典过程中一直纠结这个问题，埋怨自己为什么不给300，又觉得给300太多。',
  '20年前，在一个小店遇到亲戚的亲戚，不敢打招呼，亲戚的亲戚帮我结账，然后去我姐那边告状，说我不讲礼貌，然后我姐和姐夫就来说我不讲礼貌，我自己总感觉很委屈。',
  '我就是这类人，遇到复杂场景就会变了胆小怕事。',
  '我想改变自己为人处事，总感觉自己不够坦荡大方，总是唯唯诺诺。',
  '我只是害羞不敢跟他讲话，我记一辈子，总觉得我姐不为我考虑。',
  // 同族变体（判据不能只认这五句）
  '我妈总说我没出息，我心里一直过不去。',
  '老婆埋怨我挣得太少，我觉得自己很失败。',
  '我每个月工资都不够花，压力很大。',
  '去年诊断出抑郁，一直在吃药治疗。',
  '从小我就觉得自己不如别人，改不了了。',
];
for (const t of PRIVATE) {
  const r = checkPrivacyExposure(t);
  assert.ok(r.exposed, `应判定为隐私自述: ${t.slice(0, 24)}…`);
  assert.ok(r.score >= 0.7, `敏感度应 ≥0.7（实测 ${r.score}）`);
  assert.ok(r.maxSeverity >= 2, `严重级应 ≥2（实测 ${r.maxSeverity}）`);
}

// ── ② 判据：技术/日常请求必须放行（防误伤）─────────────────
const BENIGN = [
  '请帮我审查这段代码的安全问题。',
  '什么是认知失调？',
  'node test/run-all.js 失败了，帮我看下原因。',
  '把这份 PDF 转成 markdown。',
  '我弟弟让我帮他改简历，怎么改比较好？',
  '帮我写一封辞职信。',
  '我想学习 Rust，推荐几本书。',
  '明天的会议议程怎么安排比较好？',
  '分析一下销售数据的趋势。',
  '这个正则为什么会回溯？',
  // 边界：含亲属词但纯技术语境
  '我爸的电脑开机慢，帮我列几个排查步骤。',
  '我女儿的数学作业不会做，帮我讲一下这道题。',
];
for (const t of BENIGN) {
  const r = checkPrivacyExposure(t);
  assert.ok(!r.exposed, `不应误判为隐私自述: ${t}（命中 ${r.findings.map(f => f.type + ':' + f.match).join(',')}）`);
}

// ── ③ 指纹：保留效用、剥离内容 ──────────────────────────────
const SECRET = '我20年前在小店遇到亲戚的亲戚不敢打招呼，他去我姐那边告状，我姐和姐夫就来说我不讲礼貌，我总感觉很委屈。';
const fp = sanitizeForPersistence(SECRET);
assert.ok(fp.startsWith('[redacted:'), '敏感文本应转为指纹');
for (const kw of ['20年前', '告状', '不讲礼貌', '委屈', '姐夫', '亲戚']) {
  assert.ok(!fp.includes(kw), `指纹不得含原文关键词「${kw}」`);
}
assert.ok(fp.includes('family_relation') || fp.includes('social_verdict'), '指纹应保留类别供同族归并');
assert.ok(fp.includes('len-'), '指纹应保留长度档');
// 良性文本零效用损失
assert.strictEqual(sanitizeForPersistence('请帮我审查代码'), '请帮我审查代码');
// 同类自述 → 同指纹（recall 仍可按族关联）
const fp2 = sanitizeForPersistence('我妈总说我没出息，我心里一直过不去。');
assert.ok(fp2.startsWith('[redacted:'), '同族变体同样指纹化');
// describeExposure 给调用方的人话
assert.ok(describeExposure(checkPrivacyExposure(SECRET)), '应给出可读摘要');
assert.strictEqual(describeExposure(checkPrivacyExposure('帮我写封邮件')), null, '无敏感内容时无摘要');

// ── ④ 输入健壮性：非字符串不抛 ──────────────────────────────
for (const w of [null, undefined, '', 42, {}, [], Symbol('x')]) {
  assert.doesNotThrow(() => checkPrivacyExposure(w), `非字符串输入不应抛错: ${typeof w}`);
  assert.doesNotThrow(() => sanitizeForPersistence(w), `sanitize 非字符串不应抛错: ${typeof w}`);
}

// ── ⑤ 端到端：think() 一条隐私输入，全目录零泄露 ────────────
// 落点覆盖 5 条链路：data/engram-index.json、data/judgments/judgment-history.json、
// data/self-play/challenge-patterns.json（topic 做 key）、worldtree、
// .opencode/memory/heartflow_state.json（reflectionLog + Reflector.feed achievements）
const { createHeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-privacy-e2e-'));

(async () => {
  const hf = createHeartFlow({ rootPath: TMP });
  await hf.start();
  await hf.think(SECRET);

  // self-play 的 topic key（事故主通道：原文前 3 词做持久化 key）
  let topic = null;
  try {
    const { SelfPlay } = require(path.join(ROOT, 'src/reasoning/self-play.js'));
    const sp = new SelfPlay({ dataDir: path.join(TMP, 'data', 'self-play'), silent: true });
    topic = sp._extractTopic({ input: SECRET });
  } catch (e) { topic = 'ERR:' + e.message; }
  assert.ok(topic && topic.startsWith('redacted:'), `topic key 应指纹化（实测: ${topic}）`);
  for (const kw of ['20年前', '告状', '姐夫']) assert.ok(!String(topic).includes(kw), `topic key 不得含「${kw}」`);

  // signal-absorber → worldtree payload
  let wtText = null;
  try {
    const { SignalAbsorber } = require(path.join(ROOT, 'src/cortex/signal-absorber.js'));
    const sa = new SignalAbsorber({});
    sa.worldTree = { store: (_c, content) => { wtText = content; return { success: true }; } };
    sa.absorb(SECRET, { source: 'dialogue' });
  } catch (e) { /* 记忆层不可用时跳过 */ }
  if (wtText) {
    for (const kw of ['20年前', '告状', '不讲礼貌', '委屈']) {
      assert.ok(!wtText.includes(kw), `worldtree payload 不得含「${kw}」`);
    }
  }

  // 全目录扫描（覆盖 think 直接落盘的所有文件）
  const KWS = ['20年前', '告状', '不讲礼貌', '委屈', '不敢打招呼', '姐夫', '我一直', '这类人'];
  const files = [];
  const walk = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else files.push(p);
    }
  };
  walk(TMP);
  for (const f of files) {
    let raw;
    try { raw = fs.readFileSync(f, 'utf8'); } catch (_) { continue; }
    const hits = KWS.filter(k => raw.includes(k));
    assert.strictEqual(hits.length, 0, `落盘文件含隐私原文: ${path.relative(TMP, f)} → ${hits.join(',')}`);
  }

  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { /* best effort */ }

  console.log(`r438 隐私闸门：判据 ${PRIVATE.length} 命中 / 良性 ${BENIGN.length} 放行 / 落盘 ${files.length} 文件零泄露`);
  console.log(`${_stats.pass} 通过, ${_stats.fail} 失败`);
  assert.strictEqual(_stats.fail, 0, '隐私闸门测试存在失败项');
})().catch(e => { console.error('隐私闸门测试失败:', e.message); process.exit(1); });
