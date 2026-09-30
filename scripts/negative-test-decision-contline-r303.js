/**
 * r303 负例守卫（重构版）：decision.js 续行量化字段合并（v6.7.129）
 *
 * 上一版按「源码副本 + 锚点 mutate」的形态做（参照 absolute-claim-en），
 * 6 个注入 4 个崩、2 个未变红 —— 原因是 mutate 都是字符串替换，锚点含转义
 * 极易不生效，而副本内抛的异常被判为「崩溃不等于变红」。那不是守卫在跑，
 * 是我自己的注入器在跑。故改为断言型守卫：
 *
 * 断言分三类（全部在副本内跑，源码只读不改）：
 *   ① 主守卫：续行量化字段必须被解析进候选（[X] 描述 + 续行 key=数值）
 *   ② 良性回归：单行括号/字母点号/编号列表/顿号并列/纯文本/单候选/
 *      后置空行 七种既有形态的解析结果不得被合并逻辑改变
 *   ③ 不假分化：多行候选但无量化字段时 decide() 必须仍拒绝挑选；
 *      有多行量化字段时必须能定出候选（证明守卫真的在起作用）
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = path.resolve(__dirname, '..');
const SRC_FILE = path.join(HF, 'src', 'core', 'decision.js');
const SRC = fs.readFileSync(SRC_FILE, 'utf8');

if (!SRC.includes('mergeContinuationLines')) {
  console.error('FAIL: 校准点 mergeContinuationLines 不在 src/core/decision.js');
  process.exit(1);
}

const PROBE = [
  'const path = require("path");',
  'const D = require(<DIR>);',
  'const HFD = D.HeartFlowDecision;',
  'const PARSE = HFD.prototype._parseOptionsFromText;',
  'let fail = 0;',

  // ---- 主守卫：续行量化字段必须被解析进候选 ----
  'const multi = "[A] 修解析族\\nfeasibility=0.95 risk=0.1 confidence=0.9\\n[B] 不修\\nfeasibility=0.2 risk=0.8 confidence=0.3\\n[C] 观望\\nfeasibility=0.5 risk=0.5 confidence=0.5";',
  'const EXP = { A: [0.95, 0.1, 0.9], B: [0.2, 0.8, 0.3], C: [0.5, 0.5, 0.5] };',
  'const KEYS = ["feasibility", "risk", "confidence"];',
  'const opts = PARSE.call(new HFD(), multi);',
  'for (const o of opts) {',
  '  const e = EXP[o.id];',
  '  if (!e) { fail++; console.log("BADID " + o.id); continue; }',
  '  for (let i = 0; i < 3; i++) {',
  '    const got = o[KEYS[i]] === undefined ? -1 : o[KEYS[i]];',
  '    if (Math.abs(got - e[i]) > 1e-6) { fail++; console.log("MISS " + o.id + "." + KEYS[i] + "=" + got); }',
  '  }',
  '}',

  // ---- 良性回归：既有解析口径不得被合并逻辑改变 ----
  'const benign = [',
  '  ["single", "[A] 修解析族 feasibility=0.9\\n[B] 不修观望\\n[C] 观望到底", 3],',
  '  ["dotted", "A. 修解析族\\nB. 不修观望\\nC. 观望到底", 3],',
  '  ["numbered", "1. 修解析族\\n2. 不修观望\\n3. 观望到底", 3],',
  '  ["dunlist", "修解析器、补负例守卫、跑全量测试", 3],',
  '  ["plain", "这里没有任何候选标记，就是一段普通描述文本而已", 0],',
  '  ["one", "[A] 只有一个候选 feasibility=0.9", 0],',
  '  ["tailnum", "[A] 修解析族\\n\\n[B] 不修观望\\n\\nfeasibility=0.4", 2],',
  '];',
  'for (const [k, t, want] of benign) {',
  '  const n = PARSE.call(new HFD(), t).length;',
  '  if (n !== want) { fail++; console.log("BENIGNDIFF " + k + "=" + n + " want " + want); }',
  '}',

  // ---- 不假分化 / 守卫有效性 ----
  '(async () => {',
  '  const d = new HFD();',
  '  const r = await d.decide({ task: "t", prompt: "[A] 修解析族\\n这是补充说明\\n[B] 不修\\n[B]备注\\n[C] 观望" });',
  '  if (r.chosen !== null) { fail++; console.log("FALSEDIFF chosen=" + r.chosen); }',
  '  const d2 = new HFD();',
  '  const r2 = await d2.decide({ task: "t", prompt: multi });',
  '  if (r2.chosen === null) { fail++; console.log("DECIDEFAIL chosen=null"); }',
  '  console.log("FAILCOUNT=" + fail);',
  '  process.exit(fail > 0 ? 1 : 0);',
  '})();',
].join('\n');

function runProbe(dir) {
  const probe = path.join(dir, '_probe303b.js');
  fs.writeFileSync(probe, PROBE.replace('<DIR>', JSON.stringify(path.join(dir, 'src', 'core', 'decision.js'))));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

const CP = path.join(os.tmpdir(), 'hf-decision-b');
fs.rmSync(CP, { recursive: true, force: true });
fs.mkdirSync(CP, { recursive: true });
fs.copyFileSync(path.join(HF, 'VERSION'), path.join(CP, 'VERSION'));
fs.copyFileSync(path.join(HF, 'package.json'), path.join(CP, 'package.json'));
fs.cpSync(path.join(HF, 'src'), path.join(CP, 'src'), { recursive: true });

// ① 未删条：必须全绿（当前实现正确）
let out;
try {
  out = runProbe(CP);
} catch (e) {
  console.error('探针崩了（崩溃不等于结论）：' + String(e.message).slice(0, 400));
  process.exit(1);
}
console.log(out.trim());
const m = out.match(/FAILCOUNT=(\d+)/);
const greenOk = m && Number(m[1]) === 0;
console.log(greenOk ? '[1/3] 未删条：全绿' : '[1/3] 未删条：未全绿（FAILCOUNT=' + (m ? m[1] : '?') + '）');

// ② 删条：把 MARKER_HEAD 到 text=merged 整段合并逻辑从副本源码里物理删除，
//    探针必须变红（证明守卫真的依赖这段逻辑，不是空转）
let red = false;
try {
  const target = path.join(CP, 'src', 'core', 'decision.js');
  const src = fs.readFileSync(target, 'utf8');
  const start = src.indexOf('    const MARKER_HEAD');
  const endMarker = '    if (merged !== text) text = merged;';
  const end = src.indexOf(endMarker);
  if (start < 0 || end < 0 || end < start) throw new Error('删条锚点定位失败');
  fs.writeFileSync(target, src.slice(0, start) + src.slice(end + endMarker.length));
  // stderr 一并抓：若探针因注入而崩，必须能看见原因，不能沉默
  let out2 = '';
  try {
    out2 = execFileSync(process.execPath, [path.join(CP, '_probe303b.js')], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (inner) {
    out2 = String(inner.stdout || '') + '\nSTDERR:' + String(inner.stderr || '').slice(0, 300);
    console.error('[2/3] 删条后探针退出非零（原始输出）：\n' + out2.trim());
  }
  const m2 = out2.match(/FAILCOUNT=(\d+)/);
  red = m2 && Number(m2[1]) > 0;
  console.log('[2/3] 删条（合并逻辑整段）：' + (red ? '变红 FAILCOUNT=' + m2[1] : '未变红/未出力 FAILCOUNT=' + (m2 ? m2[1] : '?')));
} catch (e) {
  console.error('[2/3] 删条：,' + String(e.message).slice(0, 300));
}

// ③ 还原：把原始源码拷回复核，探针须回到全绿（证明变红来自删除而非环境污染）
let back = false;
try {
  fs.copyFileSync(SRC_FILE, path.join(CP, 'src', 'core', 'decision.js'));
  const out3 = runProbe(CP);
  const m3 = out3.match(/FAILCOUNT=(\d+)/);
  back = m3 && Number(m3[1]) === 0;
  console.log('[3/3] 还原：' + (back ? '回全绿' : '未回全绿 FAILCOUNT=' + (m3 ? m3[1] : '?')));
} catch (e) {
  console.error('[3/3] 还原：' + String(e.message).slice(0, 200));
}

const pass = greenOk && red && back;
console.log('\n' + (pass
  ? '负例验证通过：未删条全绿 + 删条变红 + 还原回绿'
  : '负例验证未通过：' + JSON.stringify({ greenOk, red, back })));
process.exit(pass ? 0 : 1);
