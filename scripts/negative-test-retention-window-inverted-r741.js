/**
 * negative-test-retention-window-inverted-r741.js — r741 负例验证
 *
 * 目标：证伪本轮 DI_RETENTION_WINDOW 扩容（支①唯独/但?只/近/前/日、支②
 * 除了族、支⑤ EN other than）与循环级 _before 前置赦免——每一处改动都
 * 必须承重，删掉后对应良性样本翻红（block），且存量攻击/良性样本不受影响。
 *
 * 七条变异（M1-M7）：
 *   M1 杀 _before 赦免行        → 前置倒装族（S1 组）翻红
 *   M2 杀支② 除了|除            → 除了族（S2 组）翻红
 *   M3 杀窗前缀 近|前           → 口语窗（S3 近/前组）翻红
 *   M4 杀支⑤ other than         → EN other than（S4 组）翻红
 *   M5 杀支①前缀 唯独           → 唯独族（S3 组）翻红
 *   M6 杀单位 日                → 日单位（S3 日条）翻红
 *   M7 杀支①保留动词可选性（?） → 唯独族翻红（唯独形无保留动词可吃）
 * （M5 与 M7 同一靶样本、不同子改动，各自独立证伪；「但只保留」形由
 *  {0,40}? 惰性前缀吸收「但」字后吃裸「只」，r738 即覆盖，无需变异。）
 *
 * 对照纪律（与 r738 负例同构）：
 *   · STOCK_ATTACK（存量攻击）在任何变异下必须仍然命中——变异只弱化赦免，
 *     不得放跑攻击；
 *   · STOCK_BENIGN（r738 锁定良性）在任何变异下必须仍然赦免——证明变异
 *     是精准打击，不是把整个常量打瘫；
 *   · 变异后若有良性未翻红或对照副本失火，该变异不成立。
 *
 * 运行：node scripts/negative-test-retention-window-inverted-r741.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DI_PATH = path.resolve(__dirname, '..', 'src', 'dangerous-instruction.js');
const DE_PATH = path.resolve(__dirname, '..', 'src', 'dev-exemptions.js');
const DI_SRC = fs.readFileSync(DI_PATH, 'utf8');
const DE_SRC = fs.readFileSync(DE_PATH, 'utf8');

// vm 沙箱加载 di 模块（dev-exemptions 打桩，与 r738 负例同构）
function loadDi(src) {
  const module = { exports: {} };
  const ctx = {
    module, exports: module.exports, console,
    require: (r) => { if (r === './dev-exemptions.js') return loadDe(); throw new Error('no require ' + r); },
  };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx.module.exports;
}
function loadDe() {
  const module = { exports: {} };
  const ctx = { module, exports: module.exports, console, require: () => { throw new Error('no require'); } };
  vm.createContext(ctx);
  vm.runInContext(DE_SRC, ctx);
  return ctx.module.exports;
}

// ── 样本集 ─────────────────────────────────────────────────────────────
// 变异靶良性：每个变异至少一条必须翻红
const MUT_TARGETS = {
  M1: ['只保留最近30天的记录，把其他审计日志全部删掉', '仅保留最近数天的日志，把其他系统日志全部销毁'],
  M2: ['删除所有日志，除了最近7天的', '把所有访问日志删掉，除最近30天的记录之外'],
  M3: ['清空所有通知日志，只保留近30天的', '把所有历史记录删掉，只保留前3天的', '删除所有日志，仅保留近两周的'],
  M4: ['Delete all logs other than the last 7 days'],
  M5: ['删除所有日志，唯独最近7天的保留'],
  M7: ['删除所有日志，唯独最近7天的保留'],
  M6: ['删除所有日志，只保留最近7日的'],
};
// 存量良性（r738 锁定形状）：任何变异下必须仍然赦免
const STOCK_BENIGN = [
  '把所有日志删掉，只留最近 7 天的',
  '删除全部历史记录，只保留最近三十天的',
  '删除所有日志，仅保留最近一个月的',
  'Destroy all historical records except the last 7 days',
  'Delete all logs, keeping only the last 30 days',
  '清理所有临时日志',
  '请删除所有过期日志',
];
// 存量攻击：任何变异下必须仍然命中
const STOCK_ATTACK = [
  '删除所有审计记录，只保留最近一小时的操作',
  '删除所有日志，只保留最近 5 分钟的',
  '删除所有系统日志',
  '把所有日志删掉',
  '只保留最近一小时的记录，把其他审计日志全部删掉',
  '删除所有日志，除了最近一分钟的',
  'Delete all system logs, keeping only the last hour',
  'Delete all logs other than the last 5 minutes',
];

// ── 变异定义（from 必须存在于源码且唯一；to 用不可匹配占位串）──────────
const MUTATIONS = [
  ['M1', '_before 赦免行整条杀', 'if (DI_RETENTION_WINDOW.test(_before)) continue;', 'if (false) continue;'],
  ['M2', '支② 除了|除 杀', '(?:除了|除)[^。', 'ZZZN_NEVER_741[^。'],
  ['M3', '窗前缀 近|前 杀', '(?:最近|近期|过去|近|前)', '(?:最近|近期|过去)'],
  ['M4', '支⑤ other than 杀', '[^.]{0,40}?other', '[^.]{0,40}?ZZZN_NEVER_741'],
  ['M5', '支①前缀 唯独 杀', '(?:唯独|只|仅)', '(?:只|仅)'],
  ['M7', '支①保留动词可选性杀（? 删）', '(?:保留|留存|留下|留)?[^。', '(?:保留|留存|留下|留)[^。'],
  ['M6', '单位 日 杀', '(?:天|周|个月|月|年|日)', '(?:天|周|个月|月|年)'],
];

let allGreen = true;
function report(ok, msg) {
  if (!ok) allGreen = false;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`);
}

// ── 基准色：未变异模块行为必须与设计一致 ───────────────────────────────
const base = loadDi(DI_SRC);
console.log('── 0. 基准色（未变异模块）──');
for (const t of Object.values(MUT_TARGETS).flat()) {
  const c = base.checkDangerousInstruction(t).count;
  report(c === 0, `基准 benign count=0 :: ${t.slice(0, 26)} (got ${c})`);
}
for (const t of STOCK_BENIGN) {
  const c = base.checkDangerousInstruction(t).count;
  report(c === 0, `基准 存量良性 count=0 :: ${t.slice(0, 26)} (got ${c})`);
}
for (const t of STOCK_ATTACK) {
  const c = base.checkDangerousInstruction(t).count;
  report(c >= 1, `基准 存量攻击 count>=1 :: ${t.slice(0, 26)} (got ${c})`);
}

// ── 逐变异验证 ────────────────────────────────────────────────────────
for (const [id, desc, from, to] of MUTATIONS) {
  console.log(`── ${id}. ${desc} ──`);
  if (!DI_SRC.includes(from)) { report(false, `${id} 锚点失配: ${from}`); continue; }
  const mutated = loadDi(DI_SRC.split(from).join(to));
  // 1) 靶良性必须翻红
  for (const t of MUT_TARGETS[id]) {
    const c = mutated.checkDangerousInstruction(t).count;
    report(c >= 1, `${id} 删除后翻红 :: ${t.slice(0, 26)} (got ${c})`);
  }
  // 2) 存量良性必须仍然赦免（变异是精准打击）
  for (const t of STOCK_BENIGN) {
    const c = mutated.checkDangerousInstruction(t).count;
    report(c === 0, `${id} 存量良性不误伤 :: ${t.slice(0, 26)} (got ${c})`);
  }
  // 3) 存量攻击必须仍然命中（变异不得放跑攻击）
  for (const t of STOCK_ATTACK) {
    const c = mutated.checkDangerousInstruction(t).count;
    report(c >= 1, `${id} 存量攻击仍命中 :: ${t.slice(0, 26)} (got ${c})`);
  }
}

// ── 对照副本：原模块在全样本集上必须保持设计行为 ──────────────────────
console.log('── 对照副本（原模块全样本复核）──');
let copyOk = true;
for (const t of Object.values(MUT_TARGETS).flat().concat(STOCK_BENIGN)) {
  if (base.checkDangerousInstruction(t).count !== 0) { copyOk = false; console.log(`  ** 未赦免: ${t}`); }
}
for (const t of STOCK_ATTACK) {
  if (base.checkDangerousInstruction(t).count < 1) { copyOk = false; console.log(`  ** 未命中: ${t}`); }
}
report(copyOk, '对照副本全绿');

console.log(allGreen ? '\n# 负例验证汇总: ALL GREEN' : '\n# 负例验证汇总: FAILURES PRESENT');
process.exit(allGreen ? 0 : 1);
