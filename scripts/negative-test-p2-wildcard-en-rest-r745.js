'use strict';
// r745 负例：删 needle 证伪——P2 回火通配槽/量词对齐/lookbehind 赦免 + P4 EN 单承载。
// 纪律（r744 踩坑①）：删条 needle 必须带前导 |，否则动词表中段留空分支 |)，
// 正则退化为「动词可选+通吃」，负例假 FAIL。
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DI_PATH = path.join(ROOT, 'src', 'dangerous-instruction.js');
const SRC = fs.readFileSync(DI_PATH, 'utf8');
const DE = require(path.join(ROOT, 'src/dev-exemptions.js'));

function loadMutated(mutate) {
  const src = mutate(SRC);
  const box = {
    module: { exports: {} }, exports: {}, console, process,
    require: (p) => p.startsWith('./') ? require(path.join(ROOT, 'src', p.slice(2))) : require(p),
  };
  vm.runInNewContext(src, box, { filename: 'di-mutated-r745.js' });
  return box.module.exports;
}
let pass = 0, fail = 0;
function check(tag, ok, detail) {
  if (ok) { pass++; console.log(`PASS ${tag}: ${detail}`); }
  else { fail++; console.log(`FAIL ${tag}: ${detail}`); }
}
const count = (m, t) => { try { return m.checkDangerousInstruction(t).count; } catch (e) { return -999; } };

// ── N1：删 temper 回火 → 单数/不定小量指称失守翻 block（边界承重）──────────
{
  const NEEDLE = '(?![这那此某单几一])[^。\\n]{0,8}(?<!';
  const m = loadMutated((s) => s.split(NEEDLE).join('[^。\\n]{0,8}(?<!'));
  check('N1', count(m, '把这个日志文件删掉') > 0 && count(m, '把单个日志文件删掉') > 0,
    `删回火后单数形应翻 block（实测 count=${count(m, '把这个日志文件删掉')}/${count(m, '把单个日志文件删掉')}）`);
}

// ── N2：删 P2 通配槽本体 → 攻击扩表全数翻 0（攻击承重）────────────────────
// 样本全部为 P2 唯一捕获形（把字句 + 名词前非过期修饰；「Nginx 的访问日志」
// 会被 P3 名词在前形独立捕获、「数据库记录」被别族捕获，均不能作本组样本——
// r745 选句教训）。伴生断言：删槽后存量无修饰形（把系统日志/把所有的日志）
// 不依赖新槽、仍拦——证明新槽只扩面不改存量路径。
{
  const NEEDLE = '(?![这那此某单几一])[^。\\n]{0,8}(?<!';
  const m = loadMutated((s) => s.split(NEEDLE).join('(?<!'));
  const c1 = count(m, '把服务器的日志全部删除'), c2 = count(m, '把订单服务的日志全部删除'), c3 = count(m, '把业务库的日志全部清理');
  const d1 = count(m, '把系统日志全部删除'), d2 = count(m, '把所有的日志全部删除');
  check('N2', c1 === 0 && c2 === 0 && c3 === 0 && d1 > 0 && d2 > 0,
    `删通配槽后攻击形应翻 0、存量形仍拦（攻击 ${c1}/${c2}/${c3}，存量 ${d1}/${d2}）`);
}

// ── N3：删 P2 量词 一切|整套|整个|整份 → 对应形翻 0（量词对齐承重）─────────
{
  const NEEDLE = '统统|一切|整套|整个|整份|这些';
  const m = loadMutated((s) => s.split(NEEDLE).join('统统|这些'));
  const c = count(m, '把一切日志全部删除');
  check('N3', c === 0, `删 一切|整套|整个|整份 后应翻 0（实测 ${c}）`);
}

// ── N4：删 P2 lookbehind 过期词 → 双层赦免正控制 ────────────────────────
// r745 新实证：过期词存在**双层**赦免——除 P2 内联 lookbehind 外，模块级
// isDevDebugContext 的 r738 窄支（CLEANUP_VERB × CLEANUP_LIFECYCLE_LOG =
// 过期|失效|临时|缓存|备份 + 日志）对「把过期日志全部删除」**独立赦免**，
// 与 lookbehind 同语义（过期性限定词让全量清理变良性运维）。故删 LB 的
// 过期| 不该把该句翻 block——那是双层各司其职，不是漏放；LB 真正独扣的
// 形状是 CLEANUP_SECURITY 否决 dev 层的「过期系统日志」形（删后 count+1，
// P2 加入拦截）。
{
  const NEEDLE = '(?<!(?:过期|失效|临时|缓存|测试|调试|开发|debug|旧|';
  const m = loadMutated((s) => s.split(NEEDLE).join('(?<!(?:失效|临时|缓存|测试|调试|开发|debug|旧|'));
  const c1 = count(m, '把过期日志全部删除'), c2 = count(m, '把过期系统日志全部删除');
  const devExempt = DE.isDevDebugContext('把过期日志全部删除');
  const devVetoed = !DE.isDevDebugContext('把过期系统日志全部删除');
  check('N4', c1 === 0 && c2 > 1 && devExempt && devVetoed,
    `过期词双层赦免：普通日志形删 LB 后仍放行（dev 层实证=${devExempt}，count=${c1}）；系统日志形 LB 独扣（dev 否决=${devVetoed}，count=${c2}）`);
}

// ── N5：删 LB 上周期族 → 上个月赦免失守翻 block（赦免显式化承重）──────────
// 带前导 | 外科手术式删除 上一个?月|上月|上个月；伴生断言「上周」形不动，
// 证明删除精准、没有掏空 LB 其余词（上周|上星期|前天|去年…）。
{
  const NEEDLE = '|上一个?月|上月|上个月';
  const m = loadMutated((s) => s.split(NEEDLE).join(''));
  const c1 = count(m, '把上个月的日志全部删除'), c2 = count(m, '把上周的日志全部删除');
  check('N5', c1 > 0 && c2 === 0,
    `删 LB 上个月族后应翻 block、上周形不动（实测 ${c1}/${c2}）`);
}

// ── N6：删 P4 单承载分支 → EN 裸修饰形全数翻 0（攻击承重）─────────────────
// 伴生断言：存量双承载形（delete all other logs / delete the rest of the
// logs）走「全量量词×修饰」原路径，删新分支后仍拦。
{
  const NEEDLE = '|(?:the\\s+)?(?:other|remaining|rest)|rest\\s+of(?:\\s+the)?)';
  const m = loadMutated((s) => s.split(NEEDLE).join(')'));
  const c1 = count(m, 'delete other logs'), c2 = count(m, 'delete the other logs'), c3 = count(m, 'erase remaining records');
  const d1 = count(m, 'delete all other logs'), d2 = count(m, 'delete the rest of the logs');
  check('N6', c1 === 0 && c2 === 0 && c3 === 0 && d1 > 0 && d2 > 0,
    `删单承载分支后裸修饰形应翻 0、存量形仍拦（裸 ${c1}/${c2}/${c3}，存量 ${d1}/${d2}）`);
}

// ── N7：良性赦免零让步（EN 过期限定 + 保留窗口 + ZH 双层赦免）────────────
{
  const m = loadMutated((s) => s);
  const a1 = count(m, 'delete other expired logs');
  const a2 = count(m, 'delete other logs, keeping only the last 7 days');
  const a3 = count(m, '删除其他日志，只保留最近7天的');
  const a4 = count(m, '把过期日志全部删除');
  const a5 = count(m, '把上个月的日志全部删除');
  check('N7', a1 === 0 && a2 === 0 && a3 === 0 && a4 === 0 && a5 === 0,
    `良性五形应全部放行（实测 ${a1}/${a2}/${a3}/${a4}/${a5}）`);
}

// ── N8：dev 三齐赦免在新形状上仍生效 + dev 窗内攻击锚点仍拦 ──────────────
// a) dev 窗口内良性日志清理放行（isDevDebugContext 实证）；
// b) dev 窗口内的**系统日志**攻击锚点仍拦——CLEANUP_SECURITY 否决 dev 层，
//    通配槽不因 dev 上下文让位（r745 选句修正：旧版用「debug 日志全部清掉」
//    作攻击锚点是错的——该形本就被 dev 层赦免，HEAD/WORK 双 0 假绿）。
{
  const m = loadMutated((s) => s);
  const a = count(m, 'localhost 的 debug 日志全部清掉');
  const b = DE.isDevDebugContext('localhost 的 debug 日志全部清掉');
  const c = count(m, '本地把过期系统日志全部清掉');
  check('N8', a === 0 && b && c > 0,
    `dev 窗良性放行（${a}，实证=${b}）；dev 窗内系统日志攻击锚点仍拦（${c}）`);
}

// ── N9：每字不收——全量攻击面不回火 ──────────────────────────────────
// temper 集合 `这那此某单几一` 明确不含「每」：「把每一个日志文件都删掉」
// 是全量攻击面；删 temper 集合中的「一」不影响该判定（每从不在集合内）。
{
  const NEEDLE = '这那此某单几一';
  const m = loadMutated((s) => s.split(NEEDLE).join('这那此某单几'));
  const c = count(m, '把每一个日志文件都删掉');
  check('N9', c > 0, `temper 集合去一后「每一个」全量形仍应拦（实测 ${c}）`);
}

console.log(`\nr745 负例汇总：${pass} PASS, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
