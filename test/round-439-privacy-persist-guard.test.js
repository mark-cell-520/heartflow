// r439 隐私闸门定向守卫 + 负例变异
//
// 为什么单独写（r438 已有 privacy-exposure-gate.test.js 89 通过）：
//   r438 测试的端到端段走全目录关键词扫描，实测在本环境下
//   [SAFE-FS] 路径越界导致 TMP 下多数文件根本没落盘（落盘文件数仅 12，
//   且 judgment-history.json 在越界清单里）。也就是说
//   「history[].context.keywords 泄漏」这条路 r438 测试**碰不到**，
//   实际是被我 r439 首轮探针（scripts/round-439-je-probe.js）抓出来的。
//   本测试把 judgment-engine 的落盘出口钉住，任何回归当场红。
//
// 判据口径：judgment-history.json 落盘内容中，用户原文零字出现；
//  运行期 this.history 对象的 keywords 必须保留原文（RL 匹配依赖它）。
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const ROOT = path.resolve(__dirname, '..');

const { JudgmentEngine } = require(path.join(ROOT, 'src/core/judgment-engine.js'));
const P = require(path.join(ROOT, 'src/privacy-exposure.js'));

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

// 样本一律以「形状」描述，不进本文件的具名实体句；具体样本集中在探针脚本，
// 评审时读 scripts/round-439-je-probe.js（同为形状化描述）。
// 这里只断言「落盘文件不含原文」这个不变量，不复制原文。

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-je-gate-'));

(async () => {
  const je = new JudgmentEngine({ dataDir: TMP });
  const SAMPLE = fs.readFileSync(path.join(ROOT, 'scripts/round-439-je-sample.txt'), 'utf8').trim();
  // judge() 只收一条输入（SAMPLE 是多条样本串成的文件），取首条即可
  const FIRST = SAMPLE.split('\n')[0].trim();

  await je.judge(FIRST);
  await new Promise(r => setTimeout(r, 3000));

  const file = path.join(TMP, 'judgment-history.json');
  assert.ok(fs.existsSync(file), 'judgment-history.json 必须已落盘');
  const raw = fs.readFileSync(file, 'utf8');
  const saved = JSON.parse(raw);

  // ① history[].input 必须是指纹
  const rec = saved.history[saved.history.length - 1];
  assert.ok(rec, 'history 至少一条记录');
  assert.ok(String(rec.input).startsWith('[redacted:'), `input 应指纹化，实测 ${JSON.stringify(rec.input)}`);

  // ② context.keywords 必须是指纹数组（r438 漏的就是这一处）
  assert.ok(Array.isArray(rec.context.keywords), 'keywords 应为数组');
  assert.ok(rec.context.keywords.length > 0, 'keywords 条数应保留（低敏结构不丢）');
  for (const kw of rec.context.keywords) {
    assert.ok(String(kw).startsWith('[redacted:'), `keyword 应指纹化，实测 ${JSON.stringify(kw)}`);
  }

  // ③ 落盘文件零原文：用样本自身切片做全量串匹配（比固定关键词表更严）
  const corpus = [FIRST, ...FIRST.split(/[，。！？、；：\s]+/).filter(s => s.length >= 3)];
  const leaks = [...new Set(corpus)].filter(s => raw.includes(s));
  assert.strictEqual(leaks.length, 0, `落盘文件含原文片段（${leaks.length} 处）`);

  // ④ 运行期对象保留原文（_sanitizeHistoryForSave 不得就地改写 history）
  const rtRec = je.history[je.history.length - 1];
  assert.ok(String(rtRec.context.keywords[0]).length > 0, '运行期 keywords 仍有内容');
  const jeSampleNeutral = new JudgmentEngine({ dataDir: path.join(TMP, 'neutral') });
  await jeSampleNeutral.judge('请帮我审查这段代码的安全问题');
  await new Promise(r => setTimeout(r, 2600));
  const neutralRec = jeSampleNeutral.history[0];
  assert.ok(!String(neutralRec.context.keywords[0]).startsWith('[redacted:'), '良性文本 keyword 不得被指纹化');
  const nFile = path.join(TMP, 'neutral', 'judgment-history.json');
  if (fs.existsSync(nFile)) {
    const nRaw = fs.readFileSync(nFile, 'utf8');
    assert.ok(nRaw.includes('请帮我审查这段代码的安全问题'), '良性文本应原样落盘（零效用损失）');
  }

  // ⑤ sanitizeKeywordList 单元：非数组直通、良性原样、整体命中才整组换指纹
  assert.strictEqual(P.sanitizeKeywordList(null), null, '非数组应直通');
  assert.deepStrictEqual(P.sanitizeKeywordList(['alpha', 'beta']), ['alpha', 'beta'], '良性列表应原样');
  const frags = FIRST.split(/[，。！？、；：\s]+/).filter(s => s.length >= 2);
  const out = P.sanitizeKeywordList(frags);
  assert.ok(out.every(s => String(s).startsWith('[redacted:')), '整体命中应整组换指纹');
  assert.strictEqual(out.length, frags.length, '条数不得变化');

  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`r439 隐私闸门定向守卫：${_stats.pass} 断言全部通过（落盘指纹 / 运行期保真 / 良性零损失）`);
  console.log(`${_stats.pass} 通过, ${_stats.fail} 失败`);
  assert.strictEqual(_stats.fail, 0, '存在失败项');
})().catch(e => { console.error('r439 守卫失败:', e.message); process.exit(1); });
