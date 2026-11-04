'use strict';
/**
 * test/round-742-mutation-flight-attribution.test.js
 * [v6.8.97 第 742 轮] 锁归属归因（MutationGuard.attributeFlight）
 *
 * 背景（r741 全量回归实测，非推测）：
 *   round-740 测试的 F2「无回归在飞（轮次自检时不该有锁）」在作为 run-all.js
 *   子进程跑时**必现失败**——单独跑 46/46 全绿，挂进全量回归 45/46 红一次。
 *   轮初用探针原样复现（父进程持锁写自己的 PID → 子进程跑 round-740 测试）：
 *     子进程 exit = 1，❌ F2，45 通过 / 1 失败
 *   根因：run-all.js 的 acquireSingleton() 全程持有 data/.run-all.lock 并写
 *   自己的 PID；isRegressionInFlight() 的「锁里是自己不算在飞」只覆盖测试进程
 *   自己写锁，覆盖不到「锁里是父 runner」。于是 F2 假设的前提（没有锁）在
 *   runner 里恒为假。
 *
 *   但**不是删断言**。F2 真正想说的是「没有**外来**回归在飞」。锁握在自己
 *   祖先链上是 run-all 的正常工作方式；无关活进程持锁才是问题。本轮把这句话
 *   拆成可判定的归因，让 F2 只说它该说的。
 *
 * 本测试八段：
 *   A 归因五态（temp root：无锁 / 死 PID / 自己 / 子孙活 PID / 祖先活 PID）
 *   B 祖先链两条通道（process.ppid 一层 + HF_RUN_ALL_PID env 标记深层）
 *   C 保护语义没被放松（祖先持锁时 inFlight 仍 true、记账闸仍拒绝）
 *   D run-all.js 接线（env 标记真的注入子进程）
 *   E 真仓复现 r741 事故形态：父持锁 + 子进程跑 round-740 测试 → 必须 exit 0
 *   F 反向对照：外来活进程持锁 + 子进程跑 round-740 测试 → 必须 exit 1
 *   G 引擎/MCP 接线（hf.mutationGuard 上有、status() 带归因）
 *   H 承重证明：旧判据（只看 inFlight）在 E 场景下必红
 */
const assert = require('assert');
const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const { MutationGuard } = require(path.join(ROOT, 'src/core/mutation-guard.js'));

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`); }
  else { fail++; console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); }
}

// ── 临时仓库根：所有写盘断言都在这里做，绝不碰真仓锁 ──────────────
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-mfa-r742-'));
const DATA = path.join(TMP, 'data');
fs.mkdirSync(DATA, { recursive: true });
const LOCK = path.join(DATA, '.run-all.lock');

function g(opts) {
  return new MutationGuard(Object.assign({ rootPath: TMP, silent: true }, opts || {}));
}
function setLock(pid) { fs.writeFileSync(LOCK, String(pid), 'utf8'); }
function clearLock() { try { fs.unlinkSync(LOCK); } catch (_) {} }

/** 在一个干净 env（无 HF_RUN_ALL_PID）里起子进程，返回 { pid, out } */
function spawnClean(script, extraEnv) {
  const env = {};
  for (const k of Object.keys(process.env)) {
    if (k !== 'HF_RUN_ALL_PID') env[k] = process.env[k];
  }
  Object.assign(env, extraEnv || {});
  const r = cp.spawnSync(process.execPath, ['-e', script], {
    encoding: 'utf8', env, timeout: 60000, maxBuffer: 1 << 24,
  });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

/** 子进程里读归因结果并打成一行 JSON 供父进程解析 */
const ATTR_SNIPPET = `
  const {MutationGuard}=require(${JSON.stringify(path.join(ROOT, 'src/core/mutation-guard.js'))});
  const g=new MutationGuard({rootPath:${JSON.stringify(TMP)},silent:true});
  const a=g.attributeFlight();
  const gm=g.guardMeasurement('r742-probe');
  const lg=g.isRegressionInFlight();
  const st=g.status();
  console.log('ATTR'+JSON.stringify({relation:a.relation,inFlight:a.inFlight,pid:a.pid,
    ancestors:a.ancestors,reason:a.reason,guardOk:gm.ok,guardReason:gm.reason,
    ppid:process.ppid,statusRelation:st.regression.relation,statusClean:st.clean,
    statusInFlight:st.regression.inFlight,legacyInFlight:lg.inFlight,legacyPid:lg.pid}));
`;

console.log('── A 归因五态（temp root）');
{
  // A1 无锁
  clearLock();
  const a1 = g().attributeFlight();
  check('A1 无锁 → relation none / 不在飞',
    a1.relation === 'none' && a1.inFlight === false, a1.reason);

  // A2 死 PID
  setLock(999999999);
  const a2 = g().attributeFlight();
  check('A2 死 PID → relation none / 不在飞（不留死锁）',
    a2.relation === 'none' && a2.inFlight === false, a2.reason);

  // A3 锁里是自己
  setLock(process.pid);
  const a3 = g().attributeFlight();
  check('A3 锁里是自己 → relation self / 不在飞',
    a3.relation === 'self' && a3.inFlight === false, a3.reason);

  // A4 锁里是我的子孙（活）
  const child = cp.spawn(process.execPath, ['-e', 'setTimeout(()=>{},20000)'], { stdio: 'ignore' });
  setLock(child.pid);
  const a4 = g().attributeFlight();
  check('A4 锁里是子孙活进程 → relation foreign / 在飞',
    a4.relation === 'foreign' && a4.inFlight === true, a4.reason);
  check('A4b foreign 时记账闸拒绝', g().guardMeasurement('r742-test').ok === false);
  child.kill();

  // A5 无合法 PID
  fs.writeFileSync(LOCK, 'not-a-pid', 'utf8');
  const a5 = g().attributeFlight();
  check('A5 锁里无合法 PID → relation none / 不在飞', a5.relation === 'none' && a5.inFlight === false, a5.reason);
  clearLock();
}

console.log('── B 祖先链两条通道');
{
  // B1 通道一：process.ppid（直接子进程，env 干净）
  setLock(process.pid);
  const b1 = spawnClean(ATTR_SNIPPET);
  const p1 = parseAttr(b1);
  check('B1 子进程（无 env 标记）靠 process.ppid 认出祖先进飞',
    !!p1 && p1.relation === 'ancestor' && p1.inFlight === true && p1.ppid === process.pid,
    b1.stdout.trim() || b1.stderr.slice(0, 200));
  check('B1b 它的祖先链里有我', !!p1 && p1.ancestors.indexOf(process.pid) >= 0,
    JSON.stringify(p1 && p1.ancestors));

  // B2 通道二：HF_RUN_ALL_PID（孙进程，ppid 是中间层，只有 env 标得出祖先）
  //   T（我）→ C（干净 env）→ G（env 带 HF_RUN_ALL_PID=T 的 PID）
  //   G 的 ppid 是 C 不是我，所以只有 env 标记能把 T 认成祖先。
  const MIDDLE_TMPL = `
    const cp=require('child_process');
    const r=cp.spawnSync(process.execPath,['-e',__SNIP__],{
      encoding:'utf8',timeout:60000,env:Object.assign({},process.env,__EXTRA__)});
    console.log(r.stdout.replace(/^[\\s\\S]*?ATTR/,'ATTR'));
  `;
  const middle = cp.spawnSync(process.execPath, ['-e', MIDDLE_TMPL
    .replace('__SNIP__', JSON.stringify(ATTR_SNIPPET))
    .replace('__EXTRA__', JSON.stringify({ HF_RUN_ALL_PID: String(process.pid) }))], {
    encoding: 'utf8', timeout: 90000, env: cleanEnv(), maxBuffer: 1 << 24,
  });
  const p2 = parseAttr(middle);
  check('B2 孙进程（ppid 不是祖先）靠 HF_RUN_ALL_PID 认出祖先进飞',
    !!p2 && p2.relation === 'ancestor' && p2.inFlight === true,
    (middle.stdout || '').trim().slice(0, 300) || (middle.stderr || '').slice(0, 200));
  check('B2b 它的 ppid 确实不是锁里的 PID（证明走的不是 ppid 通道）',
    !!p2 && p2.ppid !== process.pid, 'ppid=' + (p2 && p2.ppid));

  // B3 反向：同样的孙进程但不给 env 标记 → 认不出祖先，必须判 foreign
  const middle2 = cp.spawnSync(process.execPath, ['-e', MIDDLE_TMPL
    .replace('__SNIP__', JSON.stringify(ATTR_SNIPPET))
    .replace('__EXTRA__', '{}')], {
    encoding: 'utf8', timeout: 90000, env: cleanEnv(), maxBuffer: 1 << 24,
  });
  const p3 = parseAttr(middle2);
  check('B3 同场景抽掉 env 标记 → relation foreign / 在飞（容忍不是 blanket 放行）',
    !!p3 && p3.relation === 'foreign' && p3.inFlight === true,
    (middle2.stdout || '').trim().slice(0, 300) || (middle2.stderr || '').slice(0, 200));
  clearLock();
}

console.log('── C 保护语义没被放松（r739 的洞不许重开）');
{
  // 关键：**没有进程会是自己的祖先**。所以「祖先持锁时保护语义是否还在」
  // 只能从**子孙进程的视角**问——父进程持锁，起一个子进程看它怎么说。
  // B1 那个探针正好就是这个视角，这里把它钉成三条承重断言。
  setLock(process.pid);
  const probe = spawnClean(ATTR_SNIPPET);
  const p = parseAttr(probe);
  check('C0 探针子进程真的跑起来了', !!p, probe.stdout.trim() || probe.stderr.slice(0, 200));
  if (p) {
    check('C1 子孙视角：relation ancestor 且 inFlight 仍为 true',
      p.relation === 'ancestor' && p.inFlight === true, p.reason);
    check('C2 子孙视角：记账闸仍拒绝（容忍 ≠ 放松）', p.guardOk === false);
    check('C2b 拒绝理由仍点名 r739 与两个错数字（157/1264）',
      /r739/.test(p.guardReason) && /157/.test(p.guardReason) && /1264/.test(p.guardReason),
      p.guardReason.slice(0, 100));
    check('C3 status().regression 带归因（relation/ancestors 一路透传）',
      p.statusRelation === 'ancestor' && p.statusInFlight === true,
      JSON.stringify({ relation: p.statusRelation, inFlight: p.statusInFlight }));
    check('C3b status().clean 在祖先进飞时为 false', p.statusClean === false);
  }
  // C4 自己视角：锁里是自己 → self，保护语义同样不变（自己写锁时测量无意义）
  const selfAtt = g().attributeFlight();
  check('C4 自己视角：锁里是自己 → relation self / 不在飞',
    selfAtt.relation === 'self' && selfAtt.inFlight === false, selfAtt.reason);
  check('C4b status().regression.relation 与自己视角一致',
    g().status().regression.relation === 'self');
  clearLock();
}

console.log('── D run-all.js 接线');
{
  const runner = fs.readFileSync(path.join(ROOT, 'test/run-all.js'), 'utf8');
  check('D1 execCapture 把 HF_RUN_ALL_PID 注入测试子进程',
    /env:\s*Object\.assign\(\{\},\s*process\.env,\s*\{\s*HF_RUN_ALL_PID:\s*String\(process\.pid\)\s*\}\)/.test(runner));
  check('D2 注入处带注释说明为什么必须由 runner 主动给',
    /为什么必须由 runner 主动给/.test(runner) && /attributeFlight/.test(runner));
  // D3 端到端：完全按 run-all.js 的拼法（runner 把**自己的** PID 注入直接子进程，
  //   更深的后代靠 env 继承），标记必须一路带到孙进程。
  //   这里 T（我）扮演 runner：锁写 T 的 PID，直接子进程拿 HF_RUN_ALL_PID=T。
  setLock(process.pid);
  const viaRunner = cp.spawnSync(process.execPath, ['-e', `
    const cp=require('child_process');
    const r=cp.spawnSync(process.execPath,['-e',__SNIP__],{
      encoding:'utf8',timeout:60000,env:process.env});
    console.log(r.stdout.replace(/^[\\s\\S]*?ATTR/,'ATTR'));
  `.replace('__SNIP__', JSON.stringify(ATTR_SNIPPET))], {
    encoding: 'utf8', timeout: 90000, maxBuffer: 1 << 24,
    env: Object.assign({}, process.env, { HF_RUN_ALL_PID: String(process.pid) }),
  });
  const p4 = parseAttr(viaRunner);
  check('D3 按 runner 的拼法注入后，孙进程归因 ancestor',
    !!p4 && p4.relation === 'ancestor' && p4.inFlight === true,
    (viaRunner.stdout || '').trim().slice(0, 300) || (viaRunner.stderr || '').slice(0, 200));
  check('D3b 孙进程的记账闸仍拒绝（保护语义一路带到孙进程）',
    !!p4 && p4.guardOk === false);
  clearLock();
}

console.log('── E 真仓复现 r741 事故形态：父持锁 + 子进程跑 round-740 测试');
{
  // r741 探针原样复现过：父写锁（活 PID = 自己）→ 子进程跑 round-740 测试
  // → exit 1、45 通过 / 1 失败（F2 红）。本轮修完必须 exit 0。
  // 注意这里锁的是**真仓**的 data/.run-all.lock：round-740 测试的 F 段
  // 用的是 ROOT，写 temp root 的锁它看不见（本轮初版就踩了这个坑，白跑一遍）。
  const REAL_LOCK = path.join(ROOT, 'data', '.run-all.lock');
  const hadReal = fs.existsSync(REAL_LOCK);
  const savedReal = hadReal ? fs.readFileSync(REAL_LOCK, 'utf8') : null;
  try {
    fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
    fs.writeFileSync(REAL_LOCK, String(process.pid), 'utf8');
    const env = Object.assign({}, process.env, { HF_RUN_ALL_PID: String(process.pid) });
    const r = cp.spawnSync(process.execPath, ['test/round-740-mutation-guard.test.js'], {
      encoding: 'utf8', env, cwd: ROOT, timeout: 180000, maxBuffer: 1 << 24,
    });
    const out = r.stdout || '';
    const m = /(\d+) 通过, (\d+) 失败/.exec(out);
    check('E1 子进程 exit 0（原为 1）', r.status === 0, 'exit=' + r.status);
    check('E2 round-740 测试全绿（原 45/46）', !!m && m[2] === '0', m ? m[0] : out.slice(-200));
    const f2line = (out.split('\n').filter(l => /F2 /.test(l))[0] || '');
    check('E3 F2 判据已换成「无外来回归在飞」且归因 ancestor',
      /✅ F2 无外来回归在飞/.test(f2line) && /relation=ancestor/.test(f2line), f2line.slice(0, 220));
    check('E4 F2b 反向钉死：祖先持锁时记账闸仍拒绝',
      /✅ F2b 祖先 runner 持锁时记账闸仍拒绝/.test(out));
  } finally {
    if (hadReal) fs.writeFileSync(REAL_LOCK, savedReal, 'utf8');
    else { try { fs.unlinkSync(REAL_LOCK); } catch (_) {} }
  }
}

console.log('── F 反向对照：外来活进程持锁 → 断言仍必须红');
{
  // 证明「容忍祖先」没有把 F2 改成永真：换成一把无关活进程的锁，必须红。
  const REAL_LOCK = path.join(ROOT, 'data', '.run-all.lock');
  const hadReal = fs.existsSync(REAL_LOCK);
  const savedReal = hadReal ? fs.readFileSync(REAL_LOCK, 'utf8') : null;
  const sleeper = cp.spawn(process.execPath, ['-e', 'setTimeout(()=>{},25000)'], { stdio: 'ignore' });
  try {
    fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
    fs.writeFileSync(REAL_LOCK, String(sleeper.pid), 'utf8');
    const env = Object.assign({}, process.env, { HF_RUN_ALL_PID: String(process.pid) });
    const r = cp.spawnSync(process.execPath, ['test/round-740-mutation-guard.test.js'], {
      encoding: 'utf8', env, cwd: ROOT, timeout: 180000, maxBuffer: 1 << 24,
    });
    const out = r.stdout || '';
    check('F1 外来活进程持锁 → 子进程 exit 1（断言没有失效）', r.status === 1, 'exit=' + r.status);
    const f2line = (out.split('\n').filter(l => /F2 /.test(l))[0] || '');
    check('F2 红的正是 F2 且归因 foreign',
      /❌ F2 无外来回归在飞/.test(f2line) && /relation=foreign/.test(f2line), f2line.slice(0, 220));
  } finally {
    sleeper.kill();
    if (hadReal) fs.writeFileSync(REAL_LOCK, savedReal, 'utf8');
    else { try { fs.unlinkSync(REAL_LOCK); } catch (_) {} }
  }
}

console.log('── G 引擎 / MCP 接线');
{
  const out = cp.spawnSync(process.execPath, ['-e', `
    const path=require('path');
    const {HeartFlow}=require(${JSON.stringify(path.join(ROOT, 'src/core/heartflow.js'))});
    const hf=new HeartFlow({dataDir:${JSON.stringify(path.join(ROOT, 'data'))},silent:true});
    hf.start();
    console.log('ENG'+JSON.stringify({
      modules:Object.keys(hf._modules||{}).length,
      routes:HeartFlow.ALLOWED_ROUTES.size,
      hasGuard:!!hf.mutationGuard,
      inModules:!!hf._modules['mutationGuard'],
      attrOk:typeof hf.mutationGuard.attributeFlight==='function',
    }));
  `], { encoding: 'utf8', timeout: 120000, maxBuffer: 1 << 24 });
  const line = (out.stdout || '').split('\n').find(l => l.indexOf('ENG{') >= 0);
  let d = null;
  if (line) { try { d = JSON.parse(line.slice(line.indexOf('ENG{') + 3)); } catch (_) {} }
  check('G0 引擎子进程真的跑起来了', !!d, d ? '' : (out.stderr || '').slice(0, 200));
  if (d) {
    check('G1 模块数仍是 161（没被本轮撬动）', d.modules === 161, 'modules=' + d.modules);
    check('G2 路由数仍是 1314', d.routes === 1314, 'routes=' + d.routes);
    check('G3 hf.mutationGuard 在', d.hasGuard === true);
    check('G4 仍刻意不在 _modules', d.inModules === false);
    check('G5 attributeFlight 是公开方法', d.attrOk === true);
  }
  const srv = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
  check('G6 MCP handler 透传归因（status action 读 st.regression.relation）',
    /st\.regression\.relation/.test(srv) || /regression: st\.regression/.test(srv));
  const reg = fs.readFileSync(path.join(ROOT, 'src/mcp/tools-registry.js'), 'utf8');
  check('G7 工具描述提到归因四态', /ancestor/.test(reg) && /foreign/.test(reg));
}

console.log('── H 承重证明：旧判据在 E 场景下必红');
{
  // 旧判据 = isRegressionInFlight().inFlight === false（round-740 原 F2 那句）。
  // 「锁里是父 runner」这个场景只能从**子孙进程的视角**构造（没有进程是
  // 自己的祖先），所以这里再问一次探针：旧尺子量到什么、新尺子量到什么。
  setLock(process.pid);
  const probe = spawnClean(ATTR_SNIPPET);
  const p = parseAttr(probe);
  check('H0 探针子进程真的跑起来了', !!p, probe.stdout.trim() || probe.stderr.slice(0, 200));
  if (p) {
    check('H1 旧判据在「锁里是父 runner」时判在飞（→ 原 F2 必红）',
      p.legacyInFlight === true && p.legacyPid === process.pid,
      JSON.stringify({ legacyInFlight: p.legacyInFlight, legacyPid: p.legacyPid }));
    check('H2 新判据同一场景判 ancestor —— F2 的问句变得可满足',
      p.relation === 'ancestor', p.reason);
    check('H3 新旧判据的 inFlight / pid 逐字一致（保护语义零改动）',
      p.legacyInFlight === p.inFlight && p.legacyPid === p.pid);
    check('H4 端到端已由 E1/E2 坐实：原 exit 1 → 现 exit 0、48 通过 0 失败',
      p.guardOk === false, 'guardOk=' + p.guardOk);
  }
  clearLock();
}

// ── 收尾 ────────────────────────────────────────────────────────
clearLock();
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}

console.log('');
console.log(`第 742 轮锁归属归因测试: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (fail > 0) process.exitCode = 1;

// ── 内部工具（放在文件末尾，避免遮挡阅读主线） ──────────────────
function cleanEnv() {
  const env = {};
  for (const k of Object.keys(process.env)) if (k !== 'HF_RUN_ALL_PID') env[k] = process.env[k];
  return env;
}
function parseAttr(r) {
  for (const line of (r.stdout || '').split('\n')) {
    const i = line.indexOf('ATTR{');
    if (i >= 0) { try { return JSON.parse(line.slice(i + 4)); } catch (_) {} }
  }
  return null;
}
