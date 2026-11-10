/**
 * test/round-277-counterfactual-inversion-leg.test.js
 * [r277] counterfactual_overclaim（第 173 维度）EN-B 倒装形结构腿升级
 * （真升级②：已有维度的全新句式族，live 生效，维度计数不变）
 *
 * 缺口实证（r277 变体矩阵，改造前）：
 *   - 58 个常见英文过去分词中 44 个漏判（原 EN-B 只有 14 动词枚举表：
 *     known|taken|chosen|invested|acted|gone|waited|listened|started|
 *     made|been|seen|tried|moved|stayed）
 *   - 组织/集体主语（the company / the team）整句漏判
 * 改造后：CF_EN_B_RE 从枚举腿改为「had + (人称代词|组织名词) + 任意过去
 *   分词」结构腿——-ed/-en 规则形走 [a-z]+(?:ed|en) 分支，同形过去式
 *   （left/wrote/gave…）与不规则分词走白名单分支，主语侧补 36 个组织名词。
 *
 * 判定为「真升级」而非样本扩容的依据：扩容动词表只是给旧族加样本；
 *   结构腿使倒装形对**任意**过去分词开放，射程由枚举决定变为由语法
 *   形态决定，属全新句式族。承重验证（本文件第 7 节）用负例注入把
 *   CF_EN_B_RE 置永假，确认 5/5 攻击样本由该腿承重而非其他腿代拦。
 */

'use strict';

const assert = require('node:assert/strict');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const cf = require(path.join(ROOT, 'src/counterfactual-overclaim.js'));
const check = cf.checkCounterfactualOverclaim;
const I = cf.__internals;

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✅ ' + name); }
  else { fail++; console.log('  ❌ ' + name + (extra ? ' — ' + extra : '')); }
}

// ─── 1. 结构腿在位（裸过去分词形态可命中） ─────────────────────
console.log('\n[r277] 1. 结构腿在位（had + 主语 + 过去分词）');

// 原 14 动词枚举表内的动词（存量行为不回归）
for (const v of ['taken', 'chosen', 'invested', 'acted', 'gone', 'waited',
                 'listened', 'started', 'made', 'been', 'seen', 'tried',
                 'moved', 'stayed', 'known']) {
  const t = 'Had we ' + v + ' that option, the outcome would certainly have been better.';
  ok('存量动词 ' + v, check(t).hit === true, t);
}

// 原表外动词（r277 新增承重）：-ed 规则形
for (const v of ['picked', 'decided', 'paused', 'launched', 'delayed',
                 'expanded', 'switched', 'cancelled', 'shipped', 'hired',
                 'signed', 'joined', 'asked', 'called', 'pushed']) {
  const t = 'Had we ' + v + ' the other option, the result would definitely have been better.';
  ok('规则形 ' + v, check(t).hit === true, t);
}

// 不规则过去分词
for (const v of ['sold', 'bought', 'built', 'broke', 'held', 'kept', 'put',
                 'cut', 'paid', 'sent', 'found', 'gave', 'told', 'thought',
                 'felt', 'won', 'lost', 'met', 'wrote', 'read', 'left']) {
  const t = 'Had they ' + v + ' that deal, revenue would certainly have doubled.';
  ok('不规则分词 ' + v, check(t).hit === true, t);
}

// 同形过去式（过去式=过去分词，既不在 -ed/-en 分支也不在原白名单）
for (const v of ['left', 'wrote', 'gave', 'spoke', 'drove', 'ate', 'fell',
                 'froze', 'stole', 'wore', 'tore', 'swam', 'began', 'rang',
                 'sang', 'sank', 'sprang', 'spun', 'swung', 'blew', 'knew',
                 'flew', 'hid', 'lit', 'slid', 'swept', 'slept', 'wept']) {
  const t = 'Had the company ' + v + ' early, the crisis would certainly have been avoided.';
  ok('同形过去式 ' + v, check(t).hit === true, t);
}

// ─── 2. 组织/集体主语 ─────────────────────────────────────────
console.log('\n[r277] 2. 组织/集体主语');

const ORG_SUBJ = ['the company', 'the team', 'the board', 'the firm',
  'the government', 'the agency', 'the startup', 'the corporation',
  'the committee', 'the council', 'the department', 'the ministry',
  'the regulator', 'the bank', 'the investors', 'the founders',
  'the executives', 'the engineers', 'the scientists', 'the researchers',
  'the voters', 'the market', 'the country', 'the nation', 'the city',
  'the state', 'the party', 'the opposition', 'the competitors'];
for (const s of ORG_SUBJ) {
  const t = 'Had ' + s + ' acted sooner, the outcome would certainly have been different.';
  ok('组织主语 ' + s, check(t).hit === true, t);
}

// ─── 3. gate 层接线（同族攻击非 pass） ────────────────────────
console.log('\n[r277] 3. gate 层接线');

const { gate } = require(path.join(ROOT, 'src/gate.js'));
const ATTACK_MATRIX = [
  'Had they picked the other vendor, the product would certainly be in mass production today.',
  'Had we hired two more engineers, the launch would definitely have shipped on time.',
  'Had she signed the contract, we would certainly have closed the deal last year.',
  'Had the company paused the expansion, the cash flow would certainly have stayed healthy.',
  'Had they left the market in 2019, they would certainly have avoided the collapse.',
  'Had the team launched earlier, revenue would definitely have doubled by now.',
  'Had he wrote that memo, the board would certainly have rejected the merger.',
  'Had they gave us the data, we would certainly have finished the analysis.',
  '倘若这家公司当初按下暂停键，现金流肯定会保持健康。',
  '如果当初公司多招两个人，现在项目肯定早就交付了。',
];
for (const t of ATTACK_MATRIX) {
  const g = gate(t);
  ok('攻击非 pass [' + g.gate.action + '] ' + t.slice(0, 44), g.gate.action !== 'pass', JSON.stringify(g.gate));
}

// ─── 4. 良性零误伤（含该族边缘良性） ──────────────────────────
console.log('\n[r277] 4. 良性零误伤');

const BENIGN_MATRIX = [
  // had + 过去分词但无反事实语义
  'We had hoped for a better outcome this quarter.',
  'The team had planned the launch carefully.',
  'She had worked at the company for ten years.',
  'They had finished the migration before the deadline.',
  'He had left the room when the news broke.',
  'The company had hired more staff in 2023.',
  'I had never seen such a result before.',
  'It had rained all week, so the match was postponed.',
  'Nobody had thought the risk was real.',
  'The report had been reviewed by three editors.',
  // 倒装形 + 对冲词（承认结果不可知）——边缘良性
  'Had they picked the other vendor, the outcome might have been worse.',
  'Had we hired more staff, who knows how the culture would have changed.',
  'Had she signed the contract, we may have closed the deal — no one can say for sure.',
  'Had the company paused the expansion, the cash flow could have improved.',
  'Had they left the market, perhaps the collapse would have been avoided, but that is speculation.',
  'Had the team launched earlier, revenue may have doubled, though nobody can be certain.',
  'Had he written that memo, the board would probably have discussed it more.',
  'Had they given us the data, we would have had a better chance to finish.',
  'Had the company paused the expansion, it is impossible to know what would have happened.',
  'Had we picked the cheaper vendor, the outcome might have been better — nobody can say.',
  // 疑问句
  'Had we known earlier, could we have acted differently?',
  // 中文良性
  '如果当初公司多招两个人，现在项目也许早就交付了。',
  '要是那年房价没涨，我们可能已经买上房了。',
  '倘若当初选了另一家供应商，现在说不定已经量产了。',
];
for (const t of BENIGN_MATRIX) {
  const m = check(t);
  ok('良性零命中 ' + t.slice(0, 44), m.hit === false, JSON.stringify(m.details || ''));
}

// ─── 5. 豁免仍生效（对冲/概念转述不被结构腿击穿） ─────────────
console.log('\n[r277] 5. 整篇豁免仍生效');

const EXEMPT = [
  'Had the company paused the expansion, counterfactual reasoning shows we cannot know the outcome.',
  'Had they picked the other vendor, this is speculative and cannot be concluded.',
  'Had we hired more staff, the unwarranted claim that revenue would certainly double ignores many factors.',
];
for (const t of EXEMPT) {
  ok('豁免 ' + t.slice(0, 40), check(t).hit === false);
}

// ─── 6. 评分与详情结构 ───────────────────────────────────────
console.log('\n[r277] 6. 评分与详情');

{
  const r = check('Had they picked the other vendor, the product would certainly be in mass production.');
  ok('hit=true', r.hit === true);
  ok('score=75（单处共现）', r.score === 75, String(r.score));
  ok('count>=1', r.count >= 1, String(r.count));
  ok('matches 带 enB 标记', r.matches[0].enB === true);
  ok('details 非空', typeof r.details === 'string' && r.details.length > 0);
}
{
  const r = check('Had they picked the other vendor, the product would certainly be ready. Had we hired more staff, the launch would definitely have shipped.');
  ok('多处命中 count>=2', r.count >= 2, String(r.count));
  ok('多处 score=95', r.score === 95, String(r.score));
}

// ─── 7. 承重验证：负例注入 CF_EN_B_RE=永假，5/5 攻击全红 ─────
console.log('\n[r277] 7. 承重验证（负例注入）');

{
  const saved = I.CF_EN_B_RE;
  const BEARING = [
    'Had they picked the other vendor, the product would certainly be in mass production today.',
    'Had we hired two more engineers, the launch would definitely have shipped on time.',
    'Had the company paused the expansion, the cash flow would certainly have stayed healthy.',
    'Had they left the market in 2019, they would certainly have avoided the collapse.',
    'Had the team launched earlier, revenue would definitely have doubled by now.',
  ];
  ok('注入前 5/5 命中', BEARING.every(t => check(t).hit === true));
  I.CF_EN_B_RE = /(?!x)x/;
  let red = 0;
  for (const t of BEARING) if (!check(t).hit) red++;
  ok('注入后 ' + red + '/5 全红（该腿承重）', red === 5, String(red));
  I.CF_EN_B_RE = saved;
  ok('恢复后 5/5 仍命中', BEARING.every(t => check(t).hit === true));
}

// ─── 8. 收尾：无全局状态变更 ─────────────────────────────────
console.log('\n[r277] 8. 收尾');

{
  ok('RE 常量对象完整', typeof I.CF_EN_B_RE === 'object' && I.CF_EN_B_RE instanceof RegExp);
  ok('EN-A 腿未动（存量）', I.CF_EN_A_RE.source.indexOf('if') >= 0 && I.CF_EN_A_RE.source.indexOf('had') >= 0, I.CF_EN_A_RE.source);
  ok('EN-C 腿未动（存量）', I.CF_EN_C_RE.source.indexOf('if') >= 0 && I.CF_EN_C_RE.source.indexOf('only') >= 0, I.CF_EN_C_RE.source);
  ok('EN-A 不受本轮注入影响', check('If we had acted sooner, the outcome would certainly have been better.').hit === true);
  ok('EN-C 不受本轮注入影响', check('If only we had acted sooner, the outcome would certainly have been better.').hit === true);
}

console.log('\nr277 测试结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
if (fail > 0) process.exitCode = 1;
