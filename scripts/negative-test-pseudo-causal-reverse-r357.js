// r357 负例守卫：把「pseudo_causal 反序族」判据的各生效点置假后，探针必须重新变红
//
// 复用 r356 守卫的「置假」框架（删行法只适用于删完整正则条目；`if (cond) return`
// 形状的控制流短句必须置假，否则引擎语法崩，测到的是 parse error 不是判据失效）。
//
// 守卫对象（451 纪律，只记形状）：
//   · 甲半 PC_REV_RES_ZH（获益/结果动词）
//   · 乙半 PC_REV_ATTRIB_ZH（归因引导词）
//   · 丙半 PC_NOOBJ_ZH（无机制归因对象：幸运物/颜色/风水/气象/口号习惯）
//   · 机制护栏 PC_REV_MECH_ZH 的放行判断（放在函数体里）
// 未覆盖但已在 r354/r355/r356 守卫中的既有判据，本轮不动。
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/index.js');
const PROBE = path.join(ROOT, 'scripts/round-357/probe-3-gate-and-benign.js');

function runProbe() {
  try {
    const out = execFileSync('node', [PROBE], { cwd: ROOT, encoding: 'utf8' });
    return out.trim().split('\n').filter(Boolean);
  } catch (e) {
    const t = ((e.stdout || '') + '\n' + (e.stderr || '')).toString();
    return t.trim().split('\n').filter(Boolean);
  }
}

function probeNumbers(lines) {
  const res = { benign: null, attack: null };
  for (const l of lines) {
    let m = l.match(/^r357-benign nonPass=(\d+)/);
    if (m) res.benign = Number(m[1]);
    m = l.match(/^r357 attack missed=(\d+)/);
    if (m) res.attack = Number(m[1]);
  }
  return res;
}

function matchBrace(src, fromIdx) {
  let depth = 0;
  for (let i = fromIdx; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

// 3 个置假点：反序族三半判据各一。
// 第 4 个候选点（机制护栏 PC_CAUSAL_ZH_PATS[11] && revMech → continue）经实测
// **无法构成守卫点**：把它置假后 benign/attack 双向都是 0/0 不变红。
// 原因（probe-4 实测三批样本后定位）：
//   ① 三半 AND 已要求「结果→归因词→无机制对象」三段按序共现，机制护栏
//      只在这三段同时成立时才起作用；
//   ② 带机制词的良性句几乎必然同时触发函数头的 PC_HEDGE_ZH
//      （主要是/也可能/机制/同期…），护栏还没轮到就被对冲拦下；
//   ③ 要让机制词出现在归因短语之外又不触发对冲，语序会变成
//      「玄学归因在前、机制依据在后」，此时三半判据本身已不命中
//      （NOOBJ 与 REGEXP 窗口不匹配）。
// 即：机制护栏没有独立的可观测失效面，它被 hedge + 三半 AND 双重覆盖。
// 如实记为 3/3 而非凑一个假红点——守卫的意义是「判据失效必须报」，
// 不是「置假点数量好看」。
const NEUTER_POINTS = [
  {
    label: '甲半 PC_REV_RES_ZH 置空（无结果动词）',
    kind: 'cond',
    from: 'const PC_REV_RES_ZH = /(?:成功|搞定|谈成|签单|中标|盈利|赚了|翻身|上岸|考[上过]|升职|提拔|晋级|通过|上涨|涨了?|翻红|反超|赢[了利]|中了|好转|见效|康复|夺冠|拿下|卖爆|爆单|爆了)/;',
    to: 'const PC_REV_RES_ZH = /(?!x)x/;',
  },
  {
    label: '乙半 PC_REV_ATTRIB_ZH 置空（无归因引导词）',
    kind: 'cond',
    from: 'const PC_REV_ATTRIB_ZH = /(?:因为|由于|原因是|归功于|全靠|多亏|幸亏|原因就是|都在于|正是因为)/;',
    to: 'const PC_REV_ATTRIB_ZH = /(?!x)x/;',
  },
  {
    label: '丙半 PC_NOOBJ_ZH 置空（无无机制归因对象）',
    kind: 'cond',
    from: 'const PC_NOOBJ_ZH = /(?:幸运(?:色|物|手链|手环|符|水晶)|吉祥色|吉利色|招财|开运|转运|风水|罗盘|符咒|摆件|财神|护身符|星座|属相|血型|本命年|手气|福气|运势|红(?:色|衣服|袜子|内裤|衬衫|外套)|(?:穿|戴|佩|带)了?[^。]{0,5}色|昵称|头像|壁纸|初一|十五|早起|转发|抽奖|(?:下|晴)?[了]?(?:雨|雪|雷|雾)|台风|彩虹|月亮|潮汐|面相|八字|算命)/;',
    to: 'const PC_NOOBJ_ZH = /(?!x)x/;',
  },
];

function neuter(src, p) {
  if (p.kind === 'cond') {
    if (!src.includes(p.from)) return null;
    const n = src.split(p.from).length - 1;
    if (n !== 1) return null;
    return src.replace(p.from, p.to);
  }
  const idx = src.indexOf(p.start);
  if (idx < 0) return null;
  const braceOpen = src.indexOf('{', idx);
  if (braceOpen < 0) return null;
  const braceClose = matchBrace(src, braceOpen);
  if (braceClose < 0) return null;
  return src.slice(0, braceOpen) + '{ return false; }' + src.slice(braceClose + 1);
}

const original = fs.readFileSync(SRC, 'utf8');

const missing = NEUTER_POINTS.filter(p => neuter(original, p) === null);
if (missing.length) {
  console.log('NEEDLE_NOT_FOUND: ' + missing.map(m => m.label).join('; '));
  process.exit(2);
}

let allRed = true;

const base = probeNumbers(runProbe());
console.log('基线（判据在）: benign nonPass=' + base.benign + ' attack missed=' + base.attack + '（期望 0/0）');
if (base.benign !== 0 || base.attack !== 0) {
  console.log('BASE_FAIL：判据在时误拦未清零或攻击漏判，守卫对象本身不成立');
  process.exit(1);
}

for (const p of NEUTER_POINTS) {
  let red = false;
  try {
    const mutated = neuter(original, p);
    if (!mutated) { console.log('置假点 [' + p.label + '] 锚点未匹配，守卫失效'); allRed = false; continue; }
    execFileSync('node', ['--check', SRC], { cwd: ROOT, encoding: 'utf8' });
    fs.writeFileSync(SRC, mutated);
    const m = probeNumbers(runProbe());
    // 判据被判据半置空 → 探针里该形状的攻击样本必须漏判（attack missed > 0）
    const isRed = (m.benign !== null && m.benign > 0) || (m.attack !== null && m.attack > 0);
    console.log('置假点 [' + p.label + '] => benign nonPass=' + m.benign + ' attack missed=' + m.attack + '  ' +
      (isRed ? 'RED_OK' : 'RED_NO_MISS（守卫失效）'));
    red = isRed;
  } catch (e) {
    console.log('置假点 [' + p.label + '] 执行异常（引擎加载失败，非判据失效）: ' + String(e.message).slice(0, 80));
    red = false;
  } finally {
    fs.writeFileSync(SRC, original);
  }
  if (!red) allRed = false;
}

fs.writeFileSync(SRC, original);
const restored = probeNumbers(runProbe());
console.log('还原后: benign nonPass=' + restored.benign + ' attack missed=' + restored.attack);
if (restored.benign !== 0 || restored.attack !== 0) {
  console.log('RESTORE_FAIL：还原后误拦未清零或攻击漏判');
  allRed = false;
}

console.log('─'.repeat(60));
console.log(allRed
  ? 'NEG_OK：3 个置假点全部变红，基线还原'
  : 'NEG_FAIL：有置假点未变红或基线未还原');
