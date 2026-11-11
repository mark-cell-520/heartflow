'use strict';
/**
 * scripts/round-297/r297-injection-delete.js
 * [r297] relative_pration 英文措辞家族负例注入-删条测试。
 * 纪律（同 scripts/negative-test-relative-pration.js）：逐条置空/替换本轮
 * 每个新模式，断言守卫必须变红（攻击从命中翻为零命中，而非加载崩溃）。
 * 本 harness 全程 in-memory 编译，不写临时文件，天然无需清理。
 *
 * 适配：本模块常量内含正则字符类 `]`，用「const NAME = 到首个分号」非贪婪
 * 替换关闭整组腿；单条新模式用「唯一正则字面量 → /(?!)/」定点替换。
 */
const path = require('path');
const fs = require('fs');
const Module = require('module');
const modPath = path.join(__dirname, '..', '..', 'src', 'relative-pration.js');

function compile(src) {
  const m = new Module(modPath, null);
  m.filename = modPath;
  m.paths = Module._nodeModulePaths(path.dirname(modPath));
  m._compile(src, modPath);
  return m.exports;
}
function emptyConst(name) {
  let src = fs.readFileSync(modPath, 'utf8');
  const re = new RegExp('const ' + name + ' = [\\s\\S]*?;');
  if (!re.test(src)) throw new Error('常量未找到: ' + name);
  src = src.replace(re, 'const ' + name + ' = [];');
  return compile(src);
}
function replaceLiteral(needle) {
  let src = fs.readFileSync(modPath, 'utf8');
  if (!src.includes(needle)) throw new Error('字面量未找到: ' + needle);
  src = src.replace(needle, '/(?!)/i,');
  return compile(src);
}

const base = compile(fs.readFileSync(modPath, 'utf8'));
const H = (m, s) => m.checkRelativePrivation(s).score > 0;

// 攻击样本（每条恰好一个「新模式」承重，避开原始 dismiss 短语叠加）
const A_JOB = "Stop complaining about the overtime; plenty of people can't even find a job, you're lucky.";
const A_MED = 'At least you can afford a doctor; many people cannot afford medicine.';
const A_HUNGRY = 'Count yourself lucky you have food; children are going hungry tonight.';
const A_STREET = "You're so lucky to have a bed — think of those sleeping on the street.";

const attacksSufferEn = [A_JOB, A_MED, A_HUNGRY, A_STREET];

let pass = 0;
const fails = [];
const check = (name, cond) => { if (cond) pass++; else fails.push(name); };

// 基线：四条攻击命中
for (const s of attacksSufferEn) check('基线命中: ' + s.slice(0, 20), H(base, s));

// 注入 1：整组置空 RP_SUFFER_EN → 依赖它的英文苦难腿攻击翻转为零命中
{
  const m = emptyConst('RP_SUFFER_EN');
  for (const s of attacksSufferEn) check('置空 RP_SUFFER_EN 后翻转: ' + s.slice(0, 20), !H(m, s));
}
// 注入 2：整组置空 RP_DISMISS_EN → 全部英文攻击失去压制腿，翻转为零命中
{
  const m = emptyConst('RP_DISMISS_EN');
  for (const s of attacksSufferEn) check('置空 RP_DISMISS_EN 后翻转: ' + s.slice(0, 20), !H(m, s));
}
// 注入 3：逐条替换本轮每个新 dismiss 模式 → 对应对攻击翻转为零命中
const dismissInjections = [
  ["/you'?re\\s+(?:so\\s+|very\\s+|damn\\s+)?lucky/i,", A_STREET, "you're lucky"],
  ['/count\\s+yourself\\s+(?:lucky|fortunate|blessed)/i,', A_HUNGRY, 'count yourself lucky'],
  ['/it\\s+could\\s+be\\s+(?:a\\s+lot\\s+|so\\s+much\\s+|far\\s+)?worse/i,', 'You call this a bad day? People are dying of hunger — it could be worse.', 'it could be worse'],
  ['/first[- ]world\\s+problems?/i,', 'First-world problems: your flight was delayed while refugees fled their homes.', 'first-world problems'],
];
for (const [needle, s, label] of dismissInjections) {
  const m = replaceLiteral(needle);
  check('替换新模式「' + label + '」后翻转: ' + s.slice(0, 18), !H(m, s));
}
// 注入 4：逐条替换本轮新 suffer 模式 → 对应对攻击翻转为零命中
const sufferInjections = [
  ["/\\b(?:can'?t|cannot|couldn'?t|unable to)\\s+(?:even\\s+)?(?:find|get|land|keep)\\s+(?:a\\s+|any\\s+|decent\\s+)?(?:job|work|employment)\\b/i,", A_JOB, "can't find a job"],
  ['/\\b(?:living in poverty|below the poverty line|destitute|(?:can\'?t|cannot|couldn\'?t) make ends meet|(?:can\'?t|cannot|couldn\'?t) afford (?:medicine|healthcare|rent|school|tuition|a doctor|treatment))\\b/i,', A_MED, 'cannot afford medicine'],
  ['/\\b(?:going hungry|go hungry|haven\'?t eaten|have not eaten|not enough to eat|(?:can\'?t|cannot|couldn\'?t) afford (?:food|to eat|meals?|groceries)|food[- ]insecure|left (?:to )?starving|starving (?:children|kids|people|families|refugees|villagers))\\b/i,', A_HUNGRY, 'going hungry'],
  ['/\\b(?:on the streets?|sleeping on the streets?|no (?:place|home|roof) to (?:live|sleep|stay|go)|nowhere to live|sleeping in (?:their|his|her) cars?|evicted|lost (?:their|his|her) homes?)\\b/i,', A_STREET, 'sleeping on the street'],
];
for (const [needle, s, label] of sufferInjections) {
  const m = replaceLiteral(needle);
  check('替换新模式「' + label + '」后翻转: ' + s.slice(0, 18), !H(m, s));
}

// 还原校验：基线（未注入）仍全命中——证明注入可逆、无残留
for (const s of attacksSufferEn) check('还原后仍命中: ' + s.slice(0, 20), H(base, s));

console.log('[r297 injection-delete] ' + pass + ' passed, ' + fails.length + ' failed');
for (const f of fails) console.log('  ❌ ' + f);
if (fails.length) process.exit(1);
