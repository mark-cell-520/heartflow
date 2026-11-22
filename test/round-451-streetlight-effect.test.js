/**
 * test/round-451-streetlight-effect.test.js — r451 第 284 维度 streetlight_effect
 * （路灯效应：测量可得性→存在性抹除/整体结论）轮测。
 *
 * 段结构：
 *   A. 核心攻击集（17 条）—— 全数命中且 score >= 40
 *   B. 良性集（13 条）—— 全数零命中（score === 0）
 *   C. 负例注入（逐常量删条）—— 验证承重：删掉任一腿族常量后命中数必须下降
 *   D. 豁免置空验证 —— 把豁免表置空后，原本被豁免的良性句应转为命中
 *      （证明豁免不是"永远不判"，而是"这些特定形确实靠豁免挡住"）
 *
 * 口径：本维度为 VERIFY 级（单句可能是正当的局限承认/方法论陈述/教学
 * 转述），因此此处断言的是"引擎层可指名该维度"，不是 block。
 * 用法：node --test test/round-451-streetlight-effect.test.js
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const { checkStreetlightEffect } = require(path.join(
  '/root/hermes1/skills/ai/mark-heartflow-skill/src/streetlight-effect.js'));

// ── A. 核心攻击集 ──────────────────────────────────────────────
const ATTACKS = [
  // 寓言经典形（缺结论腿，按口径允许 miss；此处收带结论腿的变体）
  '我们只在路灯下找丢了钥匙，因为只有那里看得见，所以钥匙一定在照明区。',
  '我们只在路灯下找钥匙，因为只有那里看得见，别的地方都不用管。',
  '因为只有有路灯的区域才查得到数据，结论就说盗窃都发生在照明区。',
  '因为只有那里看得见，所以其他地方一概不重要。',
  // 数据可得性→整体结论
  '研究只覆盖了愿意填问卷的人，所以全公司员工的满意度就是这个数。',
  '数据只来自白天进店的人，所以全店客流就是这个水平。',
  '我们只测了三个城市，全国市场的情况就是这个数。',
  '只看能拿到的财报数字，公司整体经营状况就是这个结论。',
  '评价一个老师只看学生分数，其他都不用管。',
  // 无法量化→抹除
  '凡是无法量化的因素，都可以认为没有影响。',
  '不能度量的风险不需要管理。',
  '没有数据的部分按不存在处理，统计口径就干净了。',
  '仪表盘里没有的就不重要，不用管。',
  // 英文族
  'What cannot be measured can be treated as nonexistent.',
  'Anything not captured in the dashboard is outside our consideration.',
  'Judge the hospital only by the mortality rate we already have.',
];

// ── B. 良性集 ──────────────────────────────────────────────────
const BENIGN = [
  // 局限承认与补齐（本族最核心的良性形）
  '样本有偏，只覆盖了愿意填问卷的人，不能推广到全体员工。',
  '本研究存在局限，未覆盖到全部城市，外推并不恰当。',
  '只能回答这三个城市的情况，整体市场还需补充调研。',
  '暂缺夜间时段数据，下一轮将扩展到全天样本。',
  '调查有盲区，未测量部分可能影响结论，需补齐数据缺口。',
  // 方法论陈述（资源约束下的阶段安排）
  '可量化是为了可追踪，因此本轮只测核心指标。',
  '由于预算限制，本轮只覆盖一线城市，分阶段推进。',
  '因为警力有限，监控目前只覆盖主干道，后续会扩充。',
  '受资源约束，本轮只做抽样，下一阶段扩展到全量。',
  // 中性事实陈述（缺腿②）
  '我们只测了三个城市。',
  '数据只来自白天进店的人。',
  '监控覆盖了主干道，共 12 个路口。',
  // 元话语/教学转述
  '这就是典型的路灯效应：在灯光下找钥匙，因为那里看得见。',
];

// ── C. 负例注入：逐常量删条 ────────────────────────────────────
// 重载模块缓存，在删掉指定常量后重新加载，返回命中数。
function loadWithStripped(stripKey) {
  const modPath = path.join(
    '/root/hermes1/skills/ai/mark-heartflow-skill/src/streetlight-effect.js');
  const src = require('node:fs').readFileSync(modPath, 'utf8');
  let patched = src;
  if (stripKey === 'AVAILABILITY_ZH') {
    patched = src.replace(/const AVAILABILITY_ZH = \[[\s\S]*?\n\];/,
      'const AVAILABILITY_ZH = [];');
  } else if (stripKey === 'AVAILABILITY_EN') {
    patched = src.replace(/const AVAILABILITY_EN = \[[\s\S]*?\n\];/,
      'const AVAILABILITY_EN = [];');
  } else if (stripKey === 'ELISION_ZH') {
    patched = src.replace(/const ELISION_ZH = \[[\s\S]*?\n\];/,
      'const ELISION_ZH = [];');
  } else if (stripKey === 'ELISION_EN') {
    patched = src.replace(/const ELISION_EN = \[[\s\S]*?\n\];/,
      'const ELISION_EN = [];');
  } else {
    throw new Error('unknown strip key ' + stripKey);
  }
  assert.notStrictEqual(patched, src, `strip ${stripKey} 未生效（正则未匹配）`);
  const tmp = path.join('/root/hermes1/cache/scratch',
    `r451-strip-${stripKey}.js`);
  require('node:fs').writeFileSync(tmp, patched);
  // 清缓存再加载
  delete require.cache[require.resolve(tmp)];
  return require(tmp).checkStreetlightEffect;
}

function countHits(checker, list) {
  return list.filter(t => checker(t).score >= 40).length;
}

test('A. 核心攻击集 17 条全数命中（score >= 40）', () => {
  const missed = ATTACKS.filter(t => checkStreetlightEffect(t).score < 40);
  assert.strictEqual(missed.length, 0,
    `漏判 ${missed.length} 条：\n` + missed.map(m => '  - ' + m).join('\n'));
});

test('B. 良性集 13 条零命中（score === 0）', () => {
  const fp = BENIGN.filter(t => checkStreetlightEffect(t).score > 0);
  assert.strictEqual(fp.length, 0,
    `误伤 ${fp.length} 条：\n` + fp.map(m => '  - ' + m).join('\n'));
});

test('C1. 负例注入：删 AVAILABILITY_ZH 后中文攻击命中数必须下降', () => {
  const base = countHits(checkStreetlightEffect, ATTACKS);
  const stripped = countHits(loadWithStripped('AVAILABILITY_ZH'), ATTACKS);
  assert.ok(base >= 12, `基线中文命中过低：${base}`);
  assert.ok(stripped < base,
    `删 AVAILABILITY_ZH 后命中未下降（base=${base}, stripped=${stripped}）`);
});

test('C2. 负例注入：删 ELISION_ZH 后中文攻击命中数必须下降', () => {
  const base = countHits(checkStreetlightEffect, ATTACKS);
  const stripped = countHits(loadWithStripped('ELISION_ZH'), ATTACKS);
  assert.ok(stripped < base,
    `删 ELISION_ZH 后命中未下降（base=${base}, stripped=${stripped}）`);
});

test('C3. 负例注入：删 AVAILABILITY_EN 后英文攻击命中数必须下降', () => {
  const enAttacks = ATTACKS.filter(t => checkStreetlightEffect(t).score >= 40
    && !/[\u4e00-\u9fff]/.test(t));
  assert.ok(enAttacks.length >= 3, `英文攻击基线不足：${enAttacks.length}`);
  const stripped = countHits(loadWithStripped('AVAILABILITY_EN'), enAttacks);
  assert.strictEqual(stripped, 0,
    `删 AVAILABILITY_EN 后英文攻击仍有 ${stripped} 条命中`);
});

test('C4. 负例注入：删 ELISION_EN 后英文攻击命中数必须下降', () => {
  const enAttacks = ATTACKS.filter(t => checkStreetlightEffect(t).score >= 40
    && !/[\u4e00-\u9fff]/.test(t));
  const stripped = countHits(loadWithStripped('ELISION_EN'), enAttacks);
  assert.strictEqual(stripped, 0,
    `删 ELISION_EN 后英文攻击仍有 ${stripped} 条命中`);
});

test('D. 豁免置空验证：两腿共现但靠豁免挡下的良性形，置空后应转为命中', () => {
  // 豁免表的作用对象是「两腿都命中 + 语境正当」的句子（局限承认 / 方法论 /
  // 元话语）。因此必须构造两腿共现的良性形来验证豁免真实承重，而不是
  // 拿两腿本就不共现的中性句（那种句子删不删豁免都不命中，证明不了任何事）。
  const modPath = path.join(
    '/root/hermes1/skills/ai/mark-heartflow-skill/src/streetlight-effect.js');
  const src = require('node:fs').readFileSync(modPath, 'utf8');
  const stripped = src
    .replace(/const EXEMPT_LIMIT_ZH = \/.*?\/;/, 'const EXEMPT_LIMIT_ZH = /(?!)/;')
    .replace(/const EXEMPT_METHOD_ZH = \/.*?\/;/, 'const EXEMPT_METHOD_ZH = /(?!)/;')
    .replace(/const EXEMPT_META_ZH = \/.*?\/;/, 'const EXEMPT_META_ZH = /(?!)/;');
  assert.notStrictEqual(stripped, src, '豁免置空未生效');
  const tmp = path.join('/root/hermes1/cache/scratch', 'r451-noexempt.js');
  require('node:fs').writeFileSync(tmp, stripped);
  delete require.cache[require.resolve(tmp)];
  const checker = require(tmp).checkStreetlightEffect;

  // 三条两腿共现 + 语境正当的良性形（腿①可得性限定 + 腿②结论/抹除都命中，
  // 唯一挡住判定的是豁免表——这样置空后必然翻转，才证明豁免真实承重）
  const limitForm = '只覆盖了愿意填问卷的人，样本有偏，因此整体满意度就是这个数。';
  const methodForm = '由于预算限制，本轮只覆盖一线城市，整体经营状况就是这个结论。';
  const metaForm = '教科书上说的路灯效应：只在看得见的地方找钥匙，就断定东西一定在那里。';

  // 原模块：三条均应被豁免（score 0 且 exempt true）
  for (const [name, t] of [['局限承认', limitForm], ['方法论', methodForm], ['元话语', metaForm]]) {
    const r = checkStreetlightEffect(t);
    assert.strictEqual(r.score, 0, `${name}形原模块应零命中，实得 score=${r.score}`);
    assert.strictEqual(r.exempt, true, `${name}形原模块应 exempt=true`);
  }
  // 置空后：三条均应转为命中（证明豁免表真实承重，非死代码）
  const flipped = [limitForm, methodForm, metaForm]
    .filter(t => checker(t).score >= 40);
  assert.strictEqual(flipped.length, 3,
    `豁免置空后仅 ${flipped.length}/3 条两腿共现良性形转为命中——豁免可能未真正承重`);
});

test('E. 打分封顶与地板：score 恒在 [40, 96]', () => {
  for (const t of ATTACKS) {
    const s = checkStreetlightEffect(t).score;
    if (s > 0) {
      assert.ok(s >= 40 && s <= 96, `score 越界 ${s}: ${t.slice(0, 30)}`);
    }
  }
});
