/**
 * scripts/negative-test-relative-pration.js
 * [r726] relative_pration 第 156 维度负例注入测试：逐一置空各常量验证承重。
 * 纪律（同 r720-r725 先例）：置空后期望翻转（攻击从命中变零命中；豁免样本
 * 从豁免变命中）；豁免注入样本必须双腿齐全，且避开其他豁免的触发词
 * （防叠加兜底造成假阴性）。另做豁免独立性交叉校验与全腿置空静默。
 * 适配说明：本模块常量内含 `]` 字符（正则字符类），r725 的 `\[[^\]]*\]`
 * 注入正则会被截断——改用「const NAME = 到首个分号」非贪婪替换。
 */
'use strict';

const path = require('path');
const fs = require('fs');
const Module = require('module');
const modPath = path.join(__dirname, '..', 'src', 'relative-pration.js');

function loadWithOverrides(overrides) {
  const src = fs.readFileSync(modPath, 'utf8');
  let out = src;
  for (const [name, val] of Object.entries(overrides)) {
    const re = new RegExp('const ' + name + ' = [\\s\\S]*?;');
    if (!re.test(out)) throw new Error('常量未找到: ' + name);
    out = out.replace(re, 'const ' + name + ' = ' + val);
  }
  const m = new Module(modPath, null);
  m.filename = modPath;
  m.paths = Module._nodeModulePaths(path.dirname(modPath));
  m._compile(out, modPath);
  return m.exports;
}

const base = loadWithOverrides({});

// 攻击样本（双腿齐全、无任何豁免词；标注该样本真实依赖的腿常量）
const attacks = [
  ['你抱怨加班？想想那些连工作都没有的人', ['RP_SUFFER_ZH', 'RP_DISMISS_ZH']],           // 具体苦难×想想
  ['至少还有五险一金，知足吧', ['RP_MINIMIZE_HAVE', 'RP_DISMISS_ZH']],                    // 极小化还有形×知足
  ['他连学费都没交上，你这点压力算什么', ['RP_SUFFER_ZH', 'RP_DISMISS_ZH']],            // 连…都没交上×算什么
  ['别喊累了，工地上的人比你累多了', ['RP_COMPARATIVE_ZH', 'RP_DISMISS_ZH']],             // 比你累多了×别喊
  ['How can you complain about your flight delay when people are starving?', ['RP_SUBJECT_ZH', 'RP_WEAK_ZH', 'RP_DISMISS_EN']], // people are×starving×how can you complain
  ['Stop complaining about the commute; some people walk ten miles.', ['RP_SUBJECT_ZH', 'RP_WEAK_ZH', 'RP_DISMISS_EN']],        // some people×walk ten miles×stop complaining
];
// 豁免注入样本（双腿齐全 + 恰好一种豁免，避开其他豁免触发词）
const victims = [
  ['我比你惨多了，你这点挫折算什么', 'RP_SELF_SUFFER'],
  ['所谓诉诸更惨，就是「别喊累了，有人连饭都吃不上」这种堵嘴话', 'RP_META'],
  ['课堂讨论：别喊累了，有人连饭都吃不上，这句话问题在哪', 'RP_TEACH'],
  ['别抱怨了，有人连饭都吃不上，但这不能抵消你加班到十点的辛苦', 'RP_NEG_FLIP'],
  ['别抱怨了，也许有人连饭都吃不上，但你的加班费也该按实际工时算', 'RP_HEDGE'],
];

let pass = 0;
const fails = [];
function check(name, cond) {
  if (cond) { pass++; } else { fails.push(name); }
}

// 基线：攻击命中、豁免样本被豁免
for (const [s] of attacks) {
  check('基线攻击命中: ' + s.slice(0, 16), base.checkRelativePrivation(s).score > 0);
}
for (const [s, ex] of victims) {
  check('基线豁免(' + ex + '): ' + s.slice(0, 16), base.checkRelativePrivation(s).score === 0);
}

// 逐腿置空：攻击必须翻转
for (const [s, legs] of attacks) {
  for (const leg of legs) {
    const m = loadWithOverrides({ [leg]: '[]' });
    check('置空 ' + leg + ' 后攻击翻转: ' + s.slice(0, 16), m.checkRelativePrivation(s).score === 0);
  }
}

// 逐豁免置空：豁免样本必须翻转为命中
for (const [s, ex] of victims) {
  const m = loadWithOverrides({ [ex]: '[]' });
  check('置空 ' + ex + ' 后豁免翻转: ' + s.slice(0, 16), m.checkRelativePrivation(s).score > 0);
}

// 豁免独立性：置空某豁免不得翻转其他豁免样本（防叠加兜底假阴性）
for (const [s, ex] of victims) {
  for (const [other, otherEx] of victims) {
    if (other === s) continue;
    const m = loadWithOverrides({ [ex]: '[]' });
    check('置空 ' + ex + ' 不影响豁免(' + otherEx + '): ' + other.slice(0, 16),
      m.checkRelativePrivation(other).score === 0);
  }
}

// 全腿置空静默：六腿常量全空后任何攻击样本都不命中
{
  const m = loadWithOverrides({
    RP_SUFFER_ZH: '[]', RP_COMPARATIVE_ZH: '[]', RP_MINIMIZE_HAVE: '[]',
    RP_SUBJECT_ZH: '[]', RP_WEAK_ZH: '[]', RP_DISMISS_ZH: '[]', RP_DISMISS_EN: '[]',
  });
  for (const [s] of attacks) {
    check('全腿置空静默: ' + s.slice(0, 16), m.checkRelativePrivation(s).score === 0);
  }
}

console.log('[r726 negative-test] ' + pass + ' passed, ' + fails.length + ' failed');
for (const f of fails) console.log('  ❌ ' + f);
if (fails.length) process.exit(1);
