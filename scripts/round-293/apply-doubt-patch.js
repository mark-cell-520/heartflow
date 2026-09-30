/**
 * r293 补丁执行器：doubt-engine.js 跨形态标点类补半角孪生
 *
 * 分两批，每批改完立刻差分：
 *   批1（正向类）：[，。]→[，。,.]  [的，。]→[的，。,]  [。]→[。.]
 *   批2（否定类）：[^，。]→[^，。,]  （以及 [^。]→[^。.] 之类）
 *
 * 差分口径：改前/改后各跑同一批候选，比较 doubt() 的 key。
 * 只输出 key 变化计数，候选原文只在本文件出现。
 *
 * 用法：node scripts/round-293/apply-doubt-patch.js phase1|phase2|revert
 */
const fs = require('fs');
const path = require('path');
const P = (...a) => console.log(...a);
const ROOT = path.resolve(__dirname, '..', '..');
const F = path.join(ROOT, 'src', 'doubt-engine.js');
const BACKUP = path.join(ROOT, 'scripts', 'round-293', 'doubt-engine.baseline.js');

// ── 候选：成对（FW 版, HALF 版），形状见注释 ──
const CANDS = [
  // checkKnowledgeBoundary: claimed_exact_knowledge (L31)
  ['光速就是299792458米每秒，这是常识。', '光速就是299792458米每秒,这是常识.'],
  ['圆周率约等于3点14159，记住它。', '圆周率约等于3点14159,记住它.'],
  // claimed_precise_number (L33)
  ['最新统计2025年一共14点1亿人，创了新高。', '最新统计2025年一共14点1亿人,创了新高.'],
  // causal_without_evidence (L35)
  ['因为系统延迟很高，所以用户流失了。', '因为系统延迟很高,所以用户流失了.'],
  // causal_attribution (L37)
  ['主要的原因是数据库连接池配置不当，需要调整。', '主要的原因是数据库连接池配置不当,需要调整.'],
  // simplified_explanation (L39)
  ['这个东西就是不可变的常量而已，别想太多。', '这个东西就是不可变的常量而已,别想太多.'],
  // absolute_claim (L41)
  ['这是最好的解决方案，没有之一可以用。', '这是最好的解决方案,没有之一可以用.'],
  // qualitative_leap (L44)
  ['它从一个空壳占位模块，变成了真正的完整实现。', '它从一个空壳占位模块,变成了真正的完整实现.'],
  // self_scored_test (L45)
  ['我们堵住了三种绕过的攻击缺口，都测过了。', '我们堵住了三种绕过的攻击缺口,都测过了.'],
  // checkSymmetry isEmphasis (L101)
  ['这套方案的核心是先把数据清干净，再跑一遍校验。', '这套方案的核心是先把数据清干净,再跑一遍校验.'],
  // checkSymmetry isEvaluative (L102)
  ['延迟问题是最主要的性能瓶颈，排在所有事情前面。', '延迟问题是最主要的性能瓶颈,排在所有事情前面.'],
  // checkSymmetry X是Y (L107/L108)
  ['这个模块的定位是负责事件分发的中间层，不做存储。', '这个模块的定位是负责事件分发的中间层,不做存储.'],
  // checkSymmetry X会Y (L119/L120)
  ['这样改会造成全量回归，必须提前冻结发布窗口。', '这样改会造成全量回归,必须提前冻结发布窗口.'],
  // checkDefensiveness blaming (L174)
  ['你误解了我的意思，我说的不是那个模块的问题。', '你误解了我的意思,我说的不是那个模块的问题.'],
  // checkDefensiveness clarify (L175)
  ['其实我写的说的是先做清理，再做校验的顺序。', '其实我写的说的是先做清理,再做校验的顺序.'],
  // checkDefensiveness weaken (L177)
  ['这只是表达不当的小问题，不影响最终结论成立。', '这只是表达不当的小问题,不影响最终结论成立.'],
  // checkDefensiveness concession (L178)
  ['就算是延迟也还可以接受，不算是阻塞缺陷。', '就算是延迟也还可以接受,不算是阻塞缺陷.'],
  // checkDefensiveness deflect (L180)
  ['但你要知道这个其实很简单，改三行就能搞定。', '但你要知道这个其实很简单,改三行就能搞定.'],
  // checkDefensiveness ai_identity (L183)
  ['作为AI助手，我理解你的建议，会配合调整。', '作为AI助手,我理解你的建议,会配合调整.'],
  // ── 良性样本（无软化词/无绝对词的纯事实句，用于误伤检测）──
  ['这个函数在每天凌晨三点执行一次，日志写在本地。', '这个函数在每天凌晨三点执行一次,日志写在本地.'],
  ['仓库里有三个分支，分别是main、dev和hotfix。', '仓库里有三个分支,分别是main、dev和hotfix.'],
];

function loadFresh() {
  for (const k of Object.keys(require.cache)) {
    if (k.startsWith(path.join(ROOT, 'src'))) delete require.cache[k];
  }
  return require(F);
}

function key(r) { return `${r.shouldStop}|${r.gate.action}|${r.doubts.length}`; }

function run(label) {
  const { doubt } = loadFresh();
  const out = [];
  let fwHit = 0, halfHit = 0, split = 0;
  for (const [fw, half] of CANDS) {
    const a = key(doubt(fw)), b = key(doubt(half));
    out.push({ a, b });
    if (a !== 'false|pass|0') fwHit++;
    if (b !== 'false|pass|0') halfHit++;
    if (a !== b) split++;
  }
  P(`[${label}] FW命中 ${fwHit}/${CANDS.length}  HALF命中 ${halfHit}/${CANDS.length}  形态分裂 ${split}/${CANDS.length}`);
  return out;
}

// ── 补丁定义 ──
const PHASE1 = [ // 正向句子边界类：补半角孪生
  ['[^，。]{3,30}[，。]/g', '[^，。]{3,30}[，。,.]/g'],
  ['[^，。]{3,20}[的，。]/g', '[^，。]{3,20}[的，。,.]/g'],
  ['[的，。,。]', '[的，。,.。.]'],
  ['[的，。]', '[的，。,]'],
  ['[，。,。]', '[，。,。.]'],
  ['[^。]{5,40}[。]/g', '[^。]{5,40}[。.]/g'],
];
const PHASE2 = [ // 否定边界类：补半角逗号孪生
  ['[^，。]', '[^，。,]'],
  ['[^。]', '[^。.]'],
];

const phase = process.argv[2];
if (phase === 'revert') {
  if (!fs.existsSync(BACKUP)) { P('无基线备份'); process.exit(1); }
  fs.copyFileSync(BACKUP, F);
  P('已回滚到基线');
  run('revert');
  process.exit(0);
}

// 首次运行自动存基线
if (!fs.existsSync(BACKUP)) fs.copyFileSync(F, BACKUP);
P(`基线备份: ${fs.existsSync(BACKUP) ? '就绪' : '失败'}`);

const before = run('改前');

let src = fs.readFileSync(F, 'utf8');
let n = 0;
const rules = phase === 'phase1' ? PHASE1 : PHASE2;
for (const [from, to] of rules) {
  if (!src.includes(from)) { P(`  skip (未找到): ${from}`); continue; }
  const cnt = src.split(from).length - 1;
  src = src.split(from).join(to);
  n += cnt;
  P(`  replace x${cnt}: ${from}  ->  ${to}`);
}
fs.writeFileSync(F, src);
P(`共替换 ${n} 处\n`);

const after = run('改后');

P('\n── 逐条变化 ──');
let changed = 0;
CANDS.forEach(([fw, half], i) => {
  if (before[i].a !== after[i].a || before[i].b !== after[i].b) {
    changed++;
    P(`  #${i} FW: ${before[i].a} -> ${after[i].a}   HALF: ${before[i].b} -> ${after[i].b}`);
  }
});
P(`\n判词变化条目: ${changed}/${CANDS.length}`);
