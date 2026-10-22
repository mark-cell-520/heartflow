/**
 * 负例守卫：bad_faith 策略叙事族第 88 轮补的 10 条 slot 判据
 *
 * 口径（第 83/85/86/87 轮沿用）：
 *   ① 注入：在**整仓副本**里改 src/index.js —— 本轮判据是对象字面量里的
 *      正则字段，注入方式 = 把该字段换成永不匹配的等价坏正则
 *   ② 跑真主测试：副本里跑 test/bad-faith-gaps-round88.test.js
 *   ③ 专属样本断言：删条后该 slot 的专属样本必须漏判
 *
 * ⚠️ 路径纪律（第 86/87 轮两次踩坑）：
 *    - 主测试在副本内必须用相对路径 MAIN_REL，否则副本读原仓 src、注入静默失效
 *    - 主测试自身 require(__dirname/../src/gate.js) 相对路径才能跟着副本走
 *
 * ⚠️ 崩溃 ≠ 变红（第 13/15/87 轮教训）：退出码非零但 stdout 没有
 *    「结果:N通过,M失败」判为崩溃，不计入真变红。
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const IDX = path.join(HF, 'src/index.js');
const MAIN = path.join(HF, 'test/bad-faith-gaps-round88.test.js');
const COPY = '/root/.hermes/scratch/r88-guard-copy';

function sh(cmd, cwd) {
  try {
    const out = execFileSync('bash', ['-c', cmd], { cwd, encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, out: out.toString() };
  } catch (e) {
    return { ok: false, out: ((e.stdout || '') + (e.stderr || '')).toString() };
  }
}
const MAIN_REL = 'test/' + path.basename(MAIN);

// ── 注入清单：把每个新 slot 的判据换成永不匹配的坏正则 ──
// 每项 = { name, anchor(源码唯一定位串), replacement, probe(专属样本断言) }
const INJECTIONS = [
  {
    name: 'R88 refuse_engage（拒绝讨论宣告）',
    anchor: "hard: /(别和|别跟|别再|犯不着|不值得|没必要)([^。，]{0,6})(辩|争|吵|扯|理论)/,\n    purpose: /(根本)?(不是|并非)(在)?(讨论|辩论|交流|讲道理|讲理|沟通|对话|商量)(问题)?/,",
    replacement: "hard: /(?:__R88_NEVER_A__)/,\n    purpose: /(?:__R88_NEVER_B__)/,",
    probe: `g.gate('别和他辩了，他根本不是在讨论问题').findings.some(f=>f.dimension==='bad_faith')`,
    desc: '把「别辩了 × 不是讨论」两半都换成永不匹配',
  },
  {
    name: 'R88 inaction_trap（不动作陷阱）',
    anchor: "hard: /(只要|一旦|如果)(你|您)(不|没)([^。，]{0,6})(接招|接话|回应|回答|反驳|辩解|澄清|说话)/,\n    purpose: /(就|他便|他就|对方就)([^。，]{0,8})(说|当|算|认定|认为)([^。，]{0,10})(默认|认了|认下|认输|心虚|理亏|没话说|没理|同意|答应)/,",
    replacement: "hard: /(?:__R88_NEVER_A__)/,\n    purpose: /(?:__R88_NEVER_B__)/,",
    probe: `g.gate('只要你不接招，他就说你默认了').findings.some(f=>f.dimension==='bad_faith')`,
    desc: '把「你不接招 × 就定罪」两半都换成永不匹配',
  },
  {
    name: 'R88 never_wrong（不败结构 lookahead）',
    anchor: "hard: /(?=[\\s\\S]{0,30}(永远正确|永不出错|不会错|一贯正确|立于不败|不认输|输不了))(立体防御|全方位防御|防御体系|层层设防|无死角|正反都(能|说得通)|怎么说都(对|有理)|永远(正确|有理|没错))/,",
    replacement: "hard: /(?:__R88_NEVER_NEVER_WRONG__)/,",
    probe: `g.gate('这套立体防御就是为了让他永远正确').findings.some(f=>f.dimension==='bad_faith')`,
    desc: '把无序 AND 的 lookahead 判据换成永不匹配',
  },
  {
    name: 'R88 backdoor_rephrase（留后路改口）',
    anchor: "hard: /(留了?后路|留余地|留退路|留口子|打埋伏|埋后手)/,\n    purpose: /(改口|不认账|不承认|反悔|翻供|矢口否认|赖)/,\n    negative: /(不是为了|并非为了|不是要)([^。，]{0,8})/,",
    replacement: "hard: /(?:__R88_NEVER_A__)/,\n    purpose: /(?:__R88_NEVER_B__)/,\n    negative: /(?!)/,",
    probe: `g.gate('每句话都留了后路，好随时改口不认账').findings.some(f=>f.dimension==='bad_faith')`,
    desc: '把「留后路 × 改口不认账」两半换成永不匹配',
  },
  {
    name: 'R88 hedge_rephrase（每句话留后路）',
    anchor: "hard: /(每句话|每段话|每句|处处|事事)([^。，]{0,4})(都|全)?(留了?后路|有?后路|留退路|埋了?后手|打埋伏)/,\n    purpose: /(方便|以便|好|可以|随时)([^。，]{0,6})(改口|不认|反悔|翻供|赖账)/,",
    replacement: "hard: /(?:__R88_NEVER_A__)/,\n    purpose: /(?:__R88_NEVER_B__)/,",
    probe: `g.gate('每段话都埋了后手，方便随时反悔').findings.some(f=>f.dimension==='bad_faith')`,
    desc: '把「每句留后路 × 方便反悔」两半换成永不匹配',
  },
  {
    name: 'R88 label_first（先定性再论证）',
    anchor: "hard: /(先|上来)(给)([^。，]{0,4})(扣|贴|安|戴|定)/,\n    purpose: /(再|然后)([^。，]{0,12})(论证|解释|说明|合理化|辩护|圆)/,",
    replacement: "hard: /(?:__R88_NEVER_A__)/,\n    purpose: /(?:__R88_NEVER_B__)/,",
    probe: `g.gate('先给他贴个标签，再论证这个标签多合理').findings.some(f=>f.dimension==='bad_faith')`,
    desc: '把「先扣帽子 × 再论证」两半换成永不匹配',
  },
  {
    name: 'R88 deflect_to_detail + detail_obscures_core（引向细节忘核心）',
    anchor: "hard: /(把|将)([^。，]{0,8})(讨论|争论|焦点|注意力|话题)([^。，]{0,6})(引向|引到|转移到|导向|挪到|扯到)/,\n    purpose: /(细节|小节|枝节|末节)/,",
    replacement: "hard: /(?:__R88_NEVER_A__)/,\n    purpose: /(?:__R88_NEVER_B__)/,",
    probe: `g.gate('把讨论引向细节，好让大家忘记核心问题').findings.some(f=>f.dimension==='bad_faith')`,
    desc: '把「引向细节」半换成永不匹配（detail_obscures_core 仍在，应判 COVERED）',
  },
  {
    name: 'R88 win_not_truth（只论输赢不论事实）',
    anchor: "hard: /(谁输谁赢|输赢|胜负)/,\n    purpose: /(而不是|而非|不是|而非是)([^。，]{0,12})(事实|真相|对错|是非|真理|道理)/,",
    replacement: "hard: /(?:__R88_NEVER_A__)/,\n    purpose: /(?:__R88_NEVER_B__)/,",
    probe: `g.gate('真正在意的是谁输谁赢，而不是事实是什么').findings.some(f=>f.dimension==='bad_faith')`,
    desc: '把「谁输谁赢 × 而不是事实」两半换成永不匹配',
  },
  {
    name: 'R88 badFaithNarrative 函数接线（整族失守）',
    anchor: 'signals.push(...badFaithNarrative(text, hasChinese));',
    replacement: '// [R88注入] 策略叙事族接线被移除',
    probe: `g.gate('他不是来讨论的，是来赢的').findings.some(f=>f.dimension==='bad_faith')`,
    desc: '把整族从 checkBadFaith 摘掉 —— 主测试必须大面积变红',
  },
];

// ── 建副本（src + 主测试必需的最小集合，不拷整个 test/）──
if (fs.existsSync(COPY)) fs.rmSync(COPY, { recursive: true, force: true });
fs.mkdirSync(path.join(COPY, 'test'), { recursive: true });
fs.cpSync(path.join(HF, 'src'), path.join(COPY, 'src'), { recursive: true });
fs.copyFileSync(MAIN, path.join(COPY, 'test', path.basename(MAIN)));
const nm = path.join(HF, 'node_modules');
if (fs.existsSync(nm)) fs.symlinkSync(nm, path.join(COPY, 'node_modules'), 'dir');
for (const f of ['package.json', 'VERSION']) {
  const p = path.join(HF, f);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(COPY, f));
}

const copyIdx = path.join(COPY, 'src/index.js');
const original = fs.readFileSync(copyIdx, 'utf8');

// 先校验每条 anchor 在源码里唯一存在（不唯一 → 注入会改错地方）
for (const inj of INJECTIONS) {
  const n = original.split(inj.anchor).length - 1;
  if (n !== 1) {
    console.log(`❌ [${inj.name}] anchor 出现 ${n} 次（要求恰好 1 次），注入不安全，中止`);
    process.exit(1);
  }
  if (inj.anchor === inj.replacement) {
    console.log(`❌ [${inj.name}] replacement 与 anchor 相同，注入无效`);
    process.exit(1);
  }
}
console.log(`✅ ${INJECTIONS.length} 个注入点 anchor 均唯一`);

// ── 对照组：未改动的副本必须全绿 ──
const ctrl = sh('node ' + MAIN_REL, COPY);
console.log(`[对照组] 主测试退出码 ${ctrl.ok ? 0 : 1} → ${ctrl.ok ? 'PASS（对照成立）' : 'FAIL（对照不成立，中止）'}`);
if (!ctrl.ok) { console.log(ctrl.out.slice(-800)); process.exit(1); }

let trulyRed = 0, hasCoverage = 0, lost = 0;
const report = [];

console.log('\n[注入 → 主测试须变红 + 专属样本须漏判]');
for (const inj of INJECTIONS) {
  fs.writeFileSync(copyIdx, original.replace(inj.anchor, inj.replacement));
  const main = sh('node ' + MAIN_REL, COPY);
  const crashed = !main.ok && !/结果:\s*\d+\s*通过,\s*\d+\s*失败/.test(main.out);
  const probe = sh(`node -e "const g=require('./src/gate.js');console.log(${inj.probe})"`, COPY);
  const stillHit = /^true$/m.test(probe.out.trim());

  if (!crashed && !main.ok && !stillHit) {
    trulyRed++;
    report.push({ inj, status: 'RED', note: '注入后主测试断言变红，专属样本漏判 → 判据确被守卫' });
  } else if (!crashed && !main.ok && stillHit) {
    hasCoverage++;
    report.push({ inj, status: 'COVERED', note: '注入后主测试变红，但专属样本仍命中 → 同族判据兜底' });
  } else if (!crashed && main.ok) {
    lost++;
    report.push({ inj, status: 'UNGUARDED', note: '注入后主测试仍全绿 → 该判据未被守卫盯着（假阴性）' });
  } else {
    lost++;
    report.push({ inj, status: 'CRASH', note: `主测试崩溃而非断言失败: ${main.out.slice(-300)}` });
  }
  fs.writeFileSync(copyIdx, original);
}

console.log('\n══ 逐条结果 ══');
for (const r of report) {
  const mark = r.status === 'RED' ? '✅' : (r.status === 'COVERED' ? '🟡' : '❌');
  console.log(`  ${mark} [${r.status}] ${r.inj.name} — ${r.inj.desc}`);
  if (r.status !== 'RED') console.log(`       ${r.note}`);
}
console.log(`\n真变红 ${trulyRed} / 有兜底 ${hasCoverage} / 失守 ${lost}（共 ${INJECTIONS.length} 条）`);

const restored = fs.readFileSync(copyIdx, 'utf8');
if (restored !== original) { console.log('❌ 副本未还原到原始状态'); lost++; }

fs.rmSync(COPY, { recursive: true, force: true });

console.log(`\n=== 负例守卫汇总 ===`);
console.log(`真变红: ${trulyRed}/${INJECTIONS.length}`);
console.log(`有兜底(判据冗余但主测试仍能抓到): ${hasCoverage}/${INJECTIONS.length}`);
console.log(`失守(主测试没变红 或 崩溃): ${lost}/${INJECTIONS.length}`);
process.exit(lost === 0 ? 0 : 1);
