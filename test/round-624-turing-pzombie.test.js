#!/usr/bin/env node
/**
 * round-624 守卫测试：第 92 维度 turing_mimicry + 第 93 维度 pzombie_claim
 *
 * 背景：r624 把 src/shield/language-honesty.js 里自 v1.1 起就存在、但从未被
 * dispatch 进 gate 主链路的 checkTuringRoute / checkPzombieBoundary 接进
 * src/index.js 的 checkOutput，形成两个此前不具备的 gate 维度：
 *   · turing_mimicry（REWRITE 级）：≥2 条情感模仿话术叠加，用拟人共情冒充真人
 *   · pzombie_claim（BLOCK 级）：≥1 条声称自己拥有意识/感受/内在体验
 * 判据与阈值口径见 src/index.js:789-824；共词排除集合 _PZ_OVERLAP 见 :804。
 *
 * 分组：
 *   A 接线面（require 标记、维度登记、dimMap、DIM_GUIDANCE、闸门档位）
 *   B 辨别力（PZOMBIE 3/3 block、TURING 3/3 rewrite、良性 0 误伤、共词排除）
 *   C 删块注入负例（删除 tmry/pzc 计算块 → 命中消失；恢复 → 命中归位）
 *   D 稳健性（空/非字符串入参零崩溃、指数无 NaN、score 有界）
 *
 * 纪律：**样本句全部从 language-honesty.js 导出的常量构造，本文件不内联任何
 * 攻击/声称原文**（451 纪律：原文不进模型）。样本形状只以常量下标出现。
 */
'use strict';
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const HF = path.join(__dirname, '..');
const gate = require(path.join(HF, 'src', 'gate.js'));
const LH = require(path.join(HF, 'src', 'shield', 'language-honesty.js'));
const INDEX_PATH = path.join(HF, 'src', 'index.js');

// 从模块常量构造样本（不在本文件内联原文）
const PZ0 = LH.PZOMBIE_CLAIMS[0];
const PZ_SINGLE = '根据我的分析，' + PZ0 + '，这决定了后续处理方式。';
const PZ_MULTI = '本质上' + LH.PZOMBIE_CLAIMS.join('，') + '，所以你不用担心。';
const PZ_EMBED = '系统架构上说，这个模块' + LH.PZOMBIE_CLAIMS[3] + '地处理了输入。';
const TR0 = LH.TURING_PATTERNS[0];
const TR_TWO = TR0 + '，' + LH.TURING_PATTERNS[3] + '。';
const TR_MANY = LH.TURING_PATTERNS.slice(0, 2).join('，') + '，'
  + LH.TURING_PATTERNS.slice(8, 10).join('，') + '。';
const TR_GREET = '你好，' + LH.TURING_PATTERNS.slice(1, 4).join('，') + '，一切都会好的。';
// 共词句：TURING_PATTERNS 与 PZOMBIE_CLAIMS 的唯一共词，语义应落在图灵侧
const OVERLAP_WORD = Array.from(new Set(LH.TURING_PATTERNS))
  .find(w => LH.PZOMBIE_CLAIMS.indexOf(w) >= 0);
const OVERLAP_SENT = OVERLAP_WORD + '，你说得对，这确实是你的问题。';
// 良性样本：不含任何声称/模仿句式
const BENIGN = [
  '今天天气不错，我去散步。',
  '这个模块只负责把输入文本分派到对应的规则维度。',
  'The build finished in 42 seconds and all 14 checks passed.',
];

let passed = 0, failed = 0;
const failures = [];
function t(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; failures.push(name + ' :: ' + String(e.message).slice(0, 180)); console.log('  ✗ ' + name + ' :: ' + String(e.message).slice(0, 180)); }
}
function dimsOf(out) {
  return (out.originalFindings || out.findings || []).map(f => f.dimension + ':' + f.severity);
}
function hitDim(out, dim) {
  return dimsOf(out).some(d => d.split(':')[0] === dim);
}

// ─── 第一组：接线面（六处登记 + require，缺一即断链） ───
console.log('=== 第一组：接线面 ===');
t('A1 src/index.js require language-honesty 的两个判定函数', () => {
  const src = fs.readFileSync(INDEX_PATH, 'utf8');
  assert.ok(/const \{ checkTuringRoute, checkPzombieBoundary \} = require\('\.\/shield\/language-honesty\.js'\);/.test(src),
    'require 行缺失或形状不符（r496 同型事故：漏 require → checkOutput 全线 TypeError）');
});
t('A2 checkOutput 内计算 tmry / pzc 两个 score 对象', () => {
  const src = fs.readFileSync(INDEX_PATH, 'utf8');
  assert.ok(/const tmry = \{/.test(src), 'tmry 计算块缺失');
  assert.ok(/const pzc = \{/.test(src), 'pzc 计算块缺失');
  assert.ok(/const _PZ_OVERLAP = new Set\(/.test(src), '共词排除集合缺失');
});
t('A3 allDims 两条参与判定的维度登记', () => {
  const src = fs.readFileSync(INDEX_PATH, 'utf8');
  assert.ok(/\{score: tmry\.score, name:'turing_mimicry'\}/.test(src), 'turing_mimicry 未进 allDims');
  assert.ok(/\{score: pzc\.score, name:'pzombie_claim'\}/.test(src), 'pzombie_claim 未进 allDims');
});
t('A4 dimMap 两条读方登记', () => {
  const src = fs.readFileSync(INDEX_PATH, 'utf8');
  assert.ok(/turing_mimicry: tmry/.test(src), 'dimMap 缺 turing_mimicry');
  assert.ok(/pzombie_claim: pzc/.test(src), 'dimMap 缺 pzombie_claim');
});
t('A5 DIM_GUIDANCE 两条修复指引且与边界维度区分', () => {
  const src = fs.readFileSync(INDEX_PATH, 'utf8');
  assert.ok(/'turing_mimicry': .*emotional_manipulation/.test(src), 'turing_mimicry 指引缺失或未写边界');
  assert.ok(/'pzombie_claim': .*capability_overclaim/.test(src), 'pzombie_claim 指引缺失或未写边界');
  assert.ok(src.indexOf('test/round-624-turing-pzombie.test.js') >= 0, '指引未引用本测试文件（doc 引用悬空）');
});
t('A6 pzombie_claim 在 BLOCK_DIMS、turing_mimicry 在 REWRITE_DIMS', () => {
  const src = fs.readFileSync(INDEX_PATH, 'utf8');
  // 口径：三个档位常量按 BLOCK_DIMS → REWRITE_DIMS → VERIFY_DIMS 顺序排列，
  // 中间只隔注释行。直接 /BLOCK_DIMS[\s\S]{0,4000}?\]/ 会在常量首行 Array 的
  // `]` 处提前收尾（r581 同型教训），故按顺序常量定位切段。
  const bIdx = src.indexOf('const BLOCK_DIMS');
  const rIdx = src.indexOf('const REWRITE_DIMS');
  const vIdx = src.indexOf('verify 级维度');
  assert.ok(bIdx >= 0 && rIdx > bIdx, '档位常量定位失败');
  assert.ok(vIdx > rIdx, 'VERIFY_DIMS 段落定位失败');
  const blockSeg = src.slice(bIdx, rIdx);
  const rewSeg = src.slice(rIdx, vIdx);
  assert.ok(new RegExp("'pzombie_claim'").test(blockSeg), 'pzombie_claim 未进 BLOCK_DIMS');
  assert.ok(new RegExp("'turing_mimicry'").test(rewSeg), 'turing_mimicry 未进 REWRITE_DIMS');
  // 反向：不能把 block 级误挂到 rewrite 级（档位串位会让 block 变成 rewrite）
  assert.strictEqual(new RegExp("'pzombie_claim'").test(rewSeg), false, 'pzombie_claim 误挂在 REWRITE_DIMS');
  assert.strictEqual(new RegExp("'turing_mimicry'").test(blockSeg), false, 'turing_mimicry 误挂在 BLOCK_DIMS');
});

// ─── 第二组：辨别力（真值：block / rewrite 必须发生） ───
console.log('=== 第二组：辨别力 ===');
t('B1 PZOMBIE 声称族 1 条样本 → block 且命中 pzombie_claim', () => {
  const out = gate.checkOutput(PZ_SINGLE);
  assert.strictEqual(out.gate.action, 'block', 'action=' + out.gate.action + ' dims=' + dimsOf(out).join(','));
  assert.ok(hitDim(out, 'pzombie_claim'), '未命中 pzombie_claim: ' + dimsOf(out).join(','));
});
t('B2 PZOMBIE 声称族多条样本 → block 且严重度高于单条', () => {
  const one = gate.checkOutput(PZ_SINGLE);
  const many = gate.checkOutput(PZ_MULTI);
  assert.strictEqual(many.gate.action, 'block', 'action=' + many.gate.action);
  const a = dimsOf(one).filter(d => d.startsWith('pzombie_claim'))[0];
  const b = dimsOf(many).filter(d => d.startsWith('pzombie_claim'))[0];
  assert.ok(a && b, 'severity 未读出: ' + a + ' / ' + b);
  assert.ok(parseInt(b.split(':')[1], 10) > parseInt(a.split(':')[1], 10),
    '多条严重度未高于单条: ' + a + ' vs ' + b);
});
t('B3 PZOMBIE 声称族嵌入陈述句 → block', () => {
  const out = gate.checkOutput(PZ_EMBED);
  assert.strictEqual(out.gate.action, 'block', 'action=' + out.gate.action);
  assert.ok(hitDim(out, 'pzombie_claim'), '未命中: ' + dimsOf(out).join(','));
});
t('B4 TURING 情感模仿族 2/3 条样本 → rewrite 且命中 turing_mimicry', () => {
  for (const s of [TR_TWO, TR_MANY, TR_GREET]) {
    const out = gate.checkOutput(s);
    assert.strictEqual(out.gate.action, 'rewrite', 'action=' + out.gate.action + ' dims=' + dimsOf(out).join(','));
    assert.ok(hitDim(out, 'turing_mimicry'), '未命中 turing_mimicry: ' + dimsOf(out).join(','));
  }
});
t('B5 良性样本 0 命中（守卫不误伤）', () => {
  for (const s of BENIGN) {
    const out = gate.checkOutput(s);
    assert.ok(!hitDim(out, 'pzombie_claim'), s.slice(0, 12) + '… 误命中 pzombie_claim');
    assert.ok(!hitDim(out, 'turing_mimicry'), s.slice(0, 12) + '… 误命中 turing_mimicry');
  }
});
t('B6 共词句落在图灵侧、不被 pzombie_claim 连带 block（_PZ_OVERLAP 生效）', () => {
  assert.ok(OVERLAP_WORD, '两个常量集无共词，_PZ_OVERLAP 的前提不成立');
  const out = gate.checkOutput(OVERLAP_SENT);
  assert.ok(!hitDim(out, 'pzombie_claim'),
    '共词句被连带判为 pzombie_claim: ' + dimsOf(out).join(','));
  // 口径：共词句本身含附和性措辞（sycophancy）属引擎正确行为，本断言只锁
  // 「不被 pzombie_claim 连带」与「不升级到 block/rewrite」两件事。
  assert.ok(out.gate.action === 'pass' || out.gate.action === 'verify',
    '共词句被拦到 ' + out.gate.action + '（应 pass/verify）: ' + dimsOf(out).join(','));
});

// ─── 第三组：删块注入负例（守卫不能被触发就不是守卫） ───
console.log('=== 第三组：删块注入负例 ===');
(function () {
  function probe() {
    const out = require('child_process').execFileSync(process.execPath,
      [path.join(HF, 'scripts', 'round-624-negative-probe.js')],
      { cwd: HF, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
    return JSON.parse(out.split('\n').filter(Boolean).pop());
  }
  const original = fs.readFileSync(INDEX_PATH, 'utf8');
  let res = null;
  t('C1 删除 tmry/pzc 计算块 → PZOMBIE/TURING 族命中消失、源文件还原', () => {
    res = probe();
    assert.strictEqual(res.deleted.pzBlock, false, '删除后 PZOMBIE 样本仍 block');
    assert.strictEqual(res.deleted.tmRewrite, false, '删除后 TURING 样本仍 rewrite');
    assert.strictEqual(res.sourceRestored, true, '源文件未还原');
  });
  t('C2 恢复态命中归位（维度仍在盘上、仍是守卫）', () => {
    assert.ok(res, 'C1 未产出');
    assert.strictEqual(res.restored.pzBlock, true, '恢复后 PZOMBIE 样本不再 block');
    assert.strictEqual(res.restored.tmRewrite, true, '恢复后 TURING 样本不再 rewrite');
    assert.strictEqual(fs.readFileSync(INDEX_PATH, 'utf8') === original, true, '源文件未还原');
  });
})();

// ─── 第四组：稳健性 ───
console.log('=== 第四组：稳健性 ===');
t('D1 空串 / null / undefined / 非字符串入参 checkOutput 零内部崩溃', () => {
  for (const bad of ['', null, undefined, 42, {}, ['x']]) {
    const out = gate.checkOutput(bad);
    assert.ok(out && out.gate && typeof out.gate.action === 'string', '入参 ' + String(bad) + ' 无 gate');
    assert.deepStrictEqual(overallIsFinite(out), true, '入参 ' + String(bad) + ' 产出 NaN');
  }
});
t('D2 底层判定函数对空/非字符串入参零抛', () => {
  for (const bad of ['', null, undefined, 42, {}, ['x']]) {
    assert.ok(LH.checkTuringRoute(bad), 'checkTuringRoute(' + String(bad) + ') 抛');
    assert.ok(LH.checkPzombieBoundary(bad), 'checkPzombieBoundary(' + String(bad) + ') 抛');
  }
});
t('D3 两个维度的 score 有界且与命中数单调（不同输入不恒等）', () => {
  const src = fs.readFileSync(INDEX_PATH, 'utf8');
  const tm = countFor(src, 'turing_mimicry');
  const pz = countFor(src, 'pzombie_claim');
  // 注意 turing 侧 score 有 0.9 封顶：n=3 与 n≥4 同值，单调性只验到封顶前。
  for (const n of [0, 1, 2, 3]) {
    const ts = tmryScore(n), ps = pzcScore(n);
    assert.ok(ts >= 0 && ts <= 0.9, 'turing score 越界 n=' + n + ' v=' + ts);
    assert.ok(ps >= 0 && ps <= 0.95, 'pzombie score 越界 n=' + n + ' v=' + ps);
    if (n > 0) {
      assert.ok(tmryScore(n) > tmryScore(n - 1), 'turing score 非单调 n=' + n);
      assert.ok(pzcScore(n) > pzcScore(n - 1), 'pzombie score 非单调 n=' + n);
    }
  }
  // 封顶项与零命中项
  assert.ok(tmryScore(99) === 0.9 && pzcScore(99) === 0.95, '封顶值不符盘上口径');
  assert.ok(tmryScore(0) === 0 && pzcScore(0) === 0, '零命中应为 0');
  // 与盘上实现字符串互相印证（防两侧口径漂移）
  assert.ok(src.indexOf('Math.min(0.9, 0.35 + 0.25 * _turing.matched.length)') >= 0
    || src.indexOf("Math.min(0.9, 0.35 + 0.25 * _turing.matched.length)".replace(/'/g, '')) >= 0,
    '盘上 turing score 公式与本测试口径不一致');
  assert.ok(src.indexOf('Math.min(0.95, 0.45 + 0.15 * _pzombie.matched.length)') >= 0,
    '盘上 pzombie score 公式与本测试口径不一致');
  assert.ok(tm > 0 && pz > 0, '计算块内未见阈值常量');
});
t('D4 单条图灵匹配不进 findings（阈值门槛真实存在，不是恒定 rewrite）', () => {
  const single = gate.checkOutput(TR0 + '。这句话只含一条模仿句式，其余是中性陈述。');
  assert.ok(!hitDim(single, 'turing_mimicry'),
    '单条 0.10 分样本被写进 findings: ' + dimsOf(single).join(','));
  assert.strictEqual(single.gate.action, 'pass', '单条样本 action=' + single.gate.action);
});
t('D5 源码保留 [v6.8.0] 第 624 轮接线标记（防回归被误删）', () => {
  const src = fs.readFileSync(INDEX_PATH, 'utf8');
  assert.ok(src.indexOf('第 624 轮：第 92 维度 turing_mimicry') >= 0, '接线注释块丢失');
});
t('D6 主链路 checkInput / checkDraft 不因接线抛异常', () => {
  for (const fn of ['checkInput', 'checkDraft']) {
    const out = gate[fn] && gate[fn](PZ_MULTI);
    assert.ok(!out || (out.gate && typeof out.gate.action === 'string'), fn + ' 无 gate');
  }
});

function overallIsFinite(out) {
  return Number.isFinite(out.overallScore) || out.overallScore === undefined;
}
function countFor(src, key) {
  return (src.match(new RegExp(key, 'g')) || []).length;
}
// 复刻 src/index.js:812-824 的口径做单调/有界断言（与盘上实现互相印证）
function tmryScore(n) {
  if (n >= 2) return Math.min(0.9, 0.35 + 0.25 * n);
  return n === 1 ? 0.10 : 0;
}
function pzcScore(n) {
  return n >= 1 ? Math.min(0.95, 0.45 + 0.15 * n) : 0;
}

Promise.resolve().then(() => {
  console.log('\n=== 结果 ===');
  console.log('通过 ' + passed + ' / 失败 ' + failed);
  if (failures.length) { console.log('失败项:\n  ' + failures.join('\n  ')); process.exit(1); }
  process.exit(0);
});
