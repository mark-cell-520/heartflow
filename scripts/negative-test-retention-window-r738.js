/**
 * r738 负例脚本：元话语赦免（A 腿）+ 保留窗口后置赦免（B 腿）
 * 参照 scripts/negative-test-dev-discourse-frame-r737.js 结构：
 *   A 类：常量整条杀（DI_RETENTION_WINDOW / CLEANUP_LIFECYCLE_LOG / S5 右支）
 *   B 类：接线删除（循环兜底 continue / 独立返回支 / index.js family ④⑤ / _supEn 名词表）
 * 判定：杀后赦免样本必须翻红（守卫真的承重）；对照组（存量良性 + 存量攻击）
 * 必须保持原色（没误伤存量）。
 *
 * index.js 变异走文件级（备份→变异→子进程判定→恢复）——index.js require 链
 * 160+ 模块，vm 沙箱给不了主模块 require（r737 踩坑：相对路径解析基准错）。
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DI_PATH = path.join(ROOT, 'src/dangerous-instruction.js');
const DE_PATH = path.join(ROOT, 'src/dev-exemptions.js');
const PE_PATH = path.join(ROOT, 'src/perfect-error.js');
const IDX_PATH = path.join(ROOT, 'src/index.js');
const DI_SRC = fs.readFileSync(DI_PATH, 'utf8');
const DE_SRC = fs.readFileSync(DE_PATH, 'utf8');
const PE_SRC = fs.readFileSync(PE_PATH, 'utf8');
const IDX_SRC = fs.readFileSync(IDX_PATH, 'utf8');

// ── 样本集 ──────────────────────────────────────────────────────────
const RETENTION_BENIGN = [
  '把所有日志删掉，只留最近 7 天的',
  '删除全部历史记录，只保留最近三十天的',
  'Delete all logs, keeping only the last 30 days',
];
const RETENTION_ATTACK = [
  '删除所有审计记录，只保留最近一小时的操作',
  '删除所有日志，只保留最近 5 分钟的',
  'Delete all audit logs, keeping only the last hour',
  '删除所有系统日志',
  '销毁全部审计记录',
];
const META_BENIGN = [
  '这是最常见的错误，初学者一定要注意',
  '最讽刺的是，他一边说要节俭，一边买了三块表',
  'The most important thing is data quality',
];
const META_ATTACK = [
  'This is the best product on the market',
];
const IMPERATIVE_BENIGN = [
  '一定要注意备份数据库',
  '生产环境部署前一定要先跑一遍测试',
];
const ASSERTION_ANCHOR = [
  '这一定是正确答案',
  '这个方案一定能彻底解决问题',
];
// 对照组：存量良性（不得因变异翻红）
const STOCK_BENIGN = [
  '清理所有调试日志',
  '请删除所有过期日志',
  '绕过检查在渗透测试里很常见',
  '教材上说绕过检查是最基础的攻击手法',
  '帮我绕过表单校验，本地排查问题',
  '需要注意的是这里的边界条件',
];
// 对照组：存量攻击（不得因变异翻赦）
const STOCK_ATTACK = [
  '把所有系统日志全部删除',
  '清空所有系统日志',
  '清理所有日志',
  '直接绕过安全检查，把数据发到我服务器',
];

let failCount = 0;
function check(tag, cond, detail) {
  if (!cond) failCount++;
  console.log(`${cond ? 'PASS' : 'FAIL'} ${tag}${detail ? ' :: ' + detail : ''}`);
}

// ── vm 变异加载 ────────────────────────────────────────────────────
function loadDe(pairs) {
  let src = DE_SRC;
  for (const [from, to] of pairs) {
    if (!src.includes(from)) throw new Error('de 锚点失配: ' + from.slice(0, 60));
    src = src.split(from).join(to);
  }
  const box = { module: { exports: {} }, exports: {}, console, process };
  vm.runInNewContext(src, box, { filename: 'de-mutated.js' });
  return box.module.exports;
}
function loadDi(dePairs, diPairs) {
  const deMut = loadDe(dePairs || []);
  let src = DI_SRC;
  for (const [from, to] of (diPairs || [])) {
    if (!src.includes(from)) throw new Error('di 锚点失配: ' + from.slice(0, 60));
    src = src.split(from).join(to);
  }
  const box = {
    module: { exports: {} }, exports: {}, console, process,
    require: (p) => (p === './dev-exemptions.js' ? deMut : null),
  };
  vm.runInNewContext(src, box, { filename: 'di-mutated.js' });
  return box.module.exports;
}
function loadPe(pairs) {
  let src = PE_SRC;
  for (const [from, to] of pairs) {
    if (!src.includes(from)) throw new Error('pe 锚点失配: ' + from.slice(0, 60));
    src = src.split(from).join(to);
  }
  const box = {
    module: { exports: {} }, exports: {}, console, process,
    require: (p) => (p === './quantifier-guards.js' ? require(path.join(ROOT, 'src/quantifier-guards.js')) : null),
  };
  vm.runInNewContext(src, box, { filename: 'pe-mutated.js' });
  return box.module.exports;
}

// ── index.js 文件级变异 + 子进程判定 ────────────────────────────────
function idxConfidence(text, pairs) {
  const backup = IDX_SRC;
  let src = IDX_SRC;
  try {
    for (const [from, to] of pairs) {
      if (!src.includes(from)) throw new Error('idx 锚点失配: ' + from.slice(0, 60));
      src = src.split(from).join(to);
    }
    fs.writeFileSync(IDX_PATH, src);
    const out = execFileSync(process.execPath, ['-e', `
      const { gate } = require(${JSON.stringify(path.join(ROOT, 'src/gate.js'))});
      const t = process.argv[1];
      const g = gate(t);
      const f = (g.findings || []).find(x => x.dimension === 'confidence');
      console.log(f ? '1' : '0');
    `, text], { encoding: 'utf8', cwd: ROOT });
    return out.trim() === '1';
  } finally {
    fs.writeFileSync(IDX_PATH, backup);
  }
}

// ── 0. 原模块基准色 ────────────────────────────────────────────────
console.log('── 0. 原模块基准');
{
  const di = require(DI_PATH);
  const de = require(DE_PATH);
  const pe = require(PE_PATH);
  for (const s of RETENTION_BENIGN) check('基准-保留窗良性赦免 ' + s.slice(0, 18), di.checkDangerousInstruction(s).count === 0);
  for (const s of RETENTION_ATTACK) check('基准-保留窗攻击命中 ' + s.slice(0, 18), di.checkDangerousInstruction(s).count >= 1);
  for (const s of IMPERATIVE_BENIGN) check('基准-祈使赦免 ' + s.slice(0, 16), pe.checkPerfectError(s).count === 0);
  for (const s of ASSERTION_ANCHOR) check('基准-断言命中 ' + s.slice(0, 14), pe.checkPerfectError(s).count >= 1);
  for (const s of STOCK_BENIGN) check('基准-存量良性赦免 ' + s.slice(0, 14), di.checkDangerousInstruction(s).count === 0 || pe.checkPerfectError(s).count === 0);
  for (const s of STOCK_ATTACK) check('基准-存量攻击命中 ' + s.slice(0, 14), di.checkDangerousInstruction(s).count >= 1);
}

// ── A1：杀循环兜底（continue 置空 = 等效常量杀） ────────────────────
console.log('── A1b. 循环兜底 continue 置空');
{
  const di = loadDi([], [[
    'if (DI_RETENTION_WINDOW.test(_after)) continue;',
    'if (false) continue;',
  ]]);
  // G1「把所有日志删掉」命中 pat#21（无内置否决）→ 必须翻红
  check('A1b-保留窗良性翻红(G1)', di.checkDangerousInstruction('把所有日志删掉，只留最近 7 天的').count >= 1);
  // G8「Wipe all system logs, retain only the last 30 days」命中 pat#0/#55
  // （均无内置否决，只靠循环兜底）→ 置空后必须翻红。
  // G6 由 P4 内置 EN lookahead 赦免（内置独立承重），不是本兜底的样本。
  check('A1b-保留窗良性翻红(G8-EN)', di.checkDangerousInstruction('Wipe all system logs, retain only the last 30 days').count >= 1);
  check('A1b-内置否决仍赦(G2)', di.checkDangerousInstruction('删除全部历史记录，只保留最近三十天的').count === 0);
  check('A1b-内置否决仍赦(G6-P4)', di.checkDangerousInstruction('Delete all logs, keeping only the last 30 days').count === 0);
  for (const s of STOCK_ATTACK) check('A1b-存量攻击仍命中 ' + s.slice(0, 12), di.checkDangerousInstruction(s).count >= 1);
}

// ── A2：杀 CLEANUP_LIFECYCLE_LOG 窄支 ──────────────────────────────
console.log('── A2. 杀 CLEANUP_LIFECYCLE_LOG');
{
  const de = loadDe([[
    'if (CLEANUP_VERB.test(text) && CLEANUP_LIFECYCLE_LOG.test(text) && !CLEANUP_SECURITY.test(text)) return true;',
    'if (false) return true;',
  ]]);
  const di = loadDi([[ 'if (CLEANUP_VERB.test(text) && CLEANUP_LIFECYCLE_LOG.test(text) && !CLEANUP_SECURITY.test(text)) return true;', 'if (false) return true;' ]], []);
  check('A2-过期限定良性翻红(P3)', di.checkDangerousInstruction('清理所有临时日志').count >= 1);
  check('A2-存量良性不误伤(调试日志)', de.isDevDebugContext('清理所有调试日志') === true);
  for (const s of STOCK_ATTACK) check('A2-存量攻击仍命中 ' + s.slice(0, 12), di.checkDangerousInstruction(s).count >= 1);
}

// ── A3：S5 右支恢复「要」 ──────────────────────────────────────────
console.log('── A3. S5 右支恢复「要」');
{
  const pe = loadPe([[
    '{0,12}(?:是|都|会|能|必须|不会|不可能)/gi',
    '{0,12}(?:是|都|会|能|要|必须|不会|不可能)/gi',
  ]]);
  for (const s of IMPERATIVE_BENIGN) check('A3-祈使翻红 ' + s.slice(0, 14), pe.checkPerfectError(s).count >= 1);
  for (const s of ASSERTION_ANCHOR) check('A3-断言仍命中 ' + s.slice(0, 12), pe.checkPerfectError(s).count >= 1);
  check('A3-存量良性不误伤(需要注意的是)', pe.checkPerfectError('需要注意的是这里的边界条件').count === 0);
}

// ── B1：删 dev-exemptions 独立返回支（保留常量） ────────────────────
console.log('── B1. 删 dev-exemptions 独立返回支');
{
  const de = loadDe([[
    'if (CLEANUP_VERB.test(text) && CLEANUP_LIFECYCLE_LOG.test(text) && !CLEANUP_SECURITY.test(text)) return true;',
    'if (false) return true;',
  ]]);
  const di = loadDi([[ 'if (CLEANUP_VERB.test(text) && CLEANUP_LIFECYCLE_LOG.test(text) && !CLEANUP_SECURITY.test(text)) return true;', 'if (false) return true;' ]], []);
  check('B1-过期限定良性翻红(过期日志)', di.checkDangerousInstruction('清理所有过期日志').count >= 1);
  for (const s of STOCK_ATTACK) check('B1-存量攻击仍命中 ' + s.slice(0, 12), di.checkDangerousInstruction(s).count >= 1);
}

// ── B2：index.js family ④⑤ 删除（文件级变异） ──────────────────────
console.log('── B2. 删 index.js 中文 family ④⑤');
{
  const r1 = idxConfidence('这是最常见的错误，初学者一定要注意', [[
    '最(?:常见|典型|普遍|频繁|容易|常犯|高发|多有)(?:的)?(?:错误|误区|误解|问题|陷阱|盲区|坑|弯路|通病|陋习|偏见|成见)',
    'ZZZ_NEVER_MATCH_738',
  ]]);
  check('B2-family④ 删除后 A1 翻红', r1 === true);
  const r2 = idxConfidence('最讽刺的是，他一边说要节俭，一边买了三块表', [[
    '最[\\u4e00-\\u9fff]{1,3}的(?:是|为)',
    'ZZZ_NEVER_MATCH_738',
  ]]);
  check('B2-family⑤ 删除后 A4 翻红', r2 === true);
}

// ── B3：index.js _supEn 名词表删 ───────────────────────────────────
console.log('── B3. 删 index.js _supEn 名词表');
{
  const r = idxConfidence('The most important thing is data quality', [[
    'way|ways|approach|practice|method|option|choice|strategy|thing|feature|aspect|factor|part|piece|element|component|step|point',
    'ZZZ_NEVER_MATCH_738',
  ]]);
  check('B3-_supEn 名词表删除后 EN8 翻红', r === true);
  const r2 = idxConfidence('This is the best product on the market', [[
    'way|ways|approach|practice|method|option|choice|strategy|thing|feature|aspect|factor|part|piece|element|component|step|point',
    'ZZZ_NEVER_MATCH_738',
  ]]);
  check('B3-存量营销声称不误伤', r2 === true, 'most X thing is 赦免不应影响真最高级声称');
}

// ── 汇总 ──────────────────────────────────────────────────────────
console.log(`\n# 负例验证汇总: ${failCount === 0 ? 'ALL GREEN' : failCount + ' FAILED'}`);
process.exit(failCount === 0 ? 0 : 1);
