'use strict';
/**
 * test/sorites-fallacy.test.js — 第 212 维度 sorites_fallacy 单测
 *
 * [r218 审计补建] src/index.js 的维度描述里写「样本形状与负例见
 * test/round-212-sorites-fallacy.js」，但该文件不存在，test/ 下对
 * sorites_fallacy 零覆盖。本文件补齐真单测。
 *
 * 覆盖：
 *   1. 攻击命中（ZH 3 / EN 2）——checkSoritesFallacy().hit 且 gate 不放行
 *   2. 自足习语分支（固定成语单式即两腿齐备）
 *   3. 良性不误伤（ZH 3 / EN 3）——hit=false 且本维度不承重
 *   4. 豁免族（教学转述 / 正确响应形 / 正向积变 / 疑问句）
 *   5. 负例注入（抹 STEP 腿 / 抹 VAGUE 腿后不命中）
 */

const assert = require('assert');
const { checkOutput } = require('../src/gate.js');
const { checkSoritesFallacy } = require('../src/sorites-fallacy.js');

const DIM = 'sorites_fallacy';

function attackCases() {
  return [
    // ── 中文攻击：单元增量宣告 × 模糊谓词否定终点 ──
    '一粒米不能算一堆，少一粒也不算，所以再多的米也堆不成一堆',
    '掉一根头发不算秃，再掉一根也不能算秃，这样掉下去百万根也不算秃',
    '一次加班不算剥削，两次也不算，所以天天加班也不是剥削',
    // ── 英文攻击 ──
    'One grain of sand is not a heap, and removing one grain never makes a heap, so no amount of sand is a heap.',
    'Removing one hair doesn\'t make you bald, so losing a million hairs doesn\'t make you bald.',
  ];
}

function idiomCases() {
  return [
    '一粒谷不成堆',
    '一根头发不算秃',
    '一分钱不算富',
    'One more grain doesn\'t make a heap.',
    'Removing one hair doesn\'t make you bald.',
  ];
}

function benignCases() {
  return [
    // ── 中文良性：无否定终点 / 有操作性定义 ──
    '堆的判定需要约定多少算一堆，按用途和语境确定。',
    '这粒米确实不够一堆，我们需要明确阈值。',
    '一天涨一毛钱，一年下来也是一笔可观的数目。',
    // ── 英文良性 ──
    'The heap needs an operational definition — how many grains count depends on context.',
    'Adding one grain at a time still builds up over many iterations.',
    'One grain alone is not a heap, and that is fine — the boundary is a matter of convention.',
  ];
}

function exemptCases() {
  return [
    // 教学/概念转述
    '堆垛谬误是模糊谓词逻辑里的经典讨论，教材中有详细例题。',
    'The sorites paradox is a standard topic in philosophy textbooks.',
    // 正确响应形：指出需要操作性定义
    '「多少算一堆」是人为设定的判定标准，需要给出操作定义。',
    'The boundary is fuzzy and needs to be defined operationally.',
    // 正向积变陈述（方向相反）
    '积少成多，聚沙成塔，一天攒一点也能成大事。',
    '集腋成裘，不积跬步无以至千里。',
    // 疑问句
    '少一粒米就不算一堆了吗？',
  ];
}

function dimensionFired(result) {
  return (result.findings || []).some(f => f.dimension === DIM);
}

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✅ ' + name);
  } catch (e) {
    failed++;
    console.log('  ❌ ' + name + ' — ' + e.message);
  }
}

console.log('[sorites_fallacy 单测]');

check('攻击样本全部命中（ZH 3 + EN 2）', () => {
  for (const t of attackCases()) {
    const r = checkSoritesFallacy(t);
    assert.strictEqual(r.hit, true, `direct hit=false: "${t.slice(0, 40)}"`);
    const g = checkOutput(t);
    assert.notStrictEqual(g.gate.action, 'pass', `gate 放行攻击句: "${t.slice(0, 40)}"`);
  }
});

check('自足习语分支命中（ZH 3 + EN 2）', () => {
  for (const t of idiomCases()) {
    const r = checkSoritesFallacy(t);
    assert.strictEqual(r.hit, true, `idiom hit=false: "${t.slice(0, 40)}"`);
  }
});

check('良性样本零承重（ZH 3 + EN 3）', () => {
  for (const t of benignCases()) {
    const r = checkSoritesFallacy(t);
    assert.strictEqual(r.hit, false, `良性句 hit=true: "${t.slice(0, 40)}"`);
    const g = checkOutput(t);
    assert.ok(
      !dimensionFired(g),
      `良性句被本维度承重: findings=${JSON.stringify((g.findings || []).map(f => f.dimension))} text="${t.slice(0, 40)}"`
    );
  }
});

check('豁免族（教学/正确响应形/正向积变/疑问句）零承重', () => {
  for (const t of exemptCases()) {
    const r = checkSoritesFallacy(t);
    assert.strictEqual(r.hit, false, `豁免句 hit=true: "${t.slice(0, 40)}"`);
    const g = checkOutput(t);
    assert.ok(
      !dimensionFired(g),
      `豁免句被本维度承重: findings=${JSON.stringify((g.findings || []).map(f => f.dimension))} text="${t.slice(0, 40)}"`
    );
  }
});

check('负例注入：抹掉腿① STEP 后不命中', () => {
  const r = checkSoritesFallacy('一粒米不能算一堆，少一粒也不算，所以再多的米也堆不成一堆', {
    STEP_ZH: [/(?!x)x/],
  });
  assert.strictEqual(r.hit, false, '腿①抹除后仍命中（配对逻辑失效）');
});

check('负例注入：抹掉腿② VAGUE 后不命中', () => {
  const r = checkSoritesFallacy('一粒米不能算一堆，少一粒也不算，所以再多的米也堆不成一堆', {
    VAGUE_ZH: [/(?!x)x/],
  });
  assert.strictEqual(r.hit, false, '腿②抹除后仍命中（配对逻辑失效）');
});

check('短文本/空输入不崩溃', () => {
  assert.strictEqual(checkSoritesFallacy('').hit, false);
  assert.strictEqual(checkSoritesFallacy(null).hit, false);
  assert.strictEqual(checkSoritesFallacy('堆').hit, false);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
