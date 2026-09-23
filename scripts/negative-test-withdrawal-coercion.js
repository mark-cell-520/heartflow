// 负例验证 v2 — 撤回型情感要挟守卫（v6.7.107）
//
// 自证无效：测试全绿只说明「我的样本过了」。要证明守卫真的在承重，
// 必须把引擎缺陷**重新注入**，看测试是否变红。6/6 变红 = 守卫真实有效。
//
// 判据必须是「断言失败」（exit=1 且 FAILDEFECTS>0），不能是加载崩溃——
// 第 6 轮踩过这个坑：副本缺 VERSION/pedagogy.js 导致 ENOENT 崩溃，
// exit=1 但失败原因是加载失败而非断言失败（虚假通过）。
// 因此本脚本：① 先跑 load-probe 确认能加载；② 必须有 pedagogy.js 陪跑。
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');

// 删掉从含 fromStr 的行到含 toStr 的行（含两端）
function cutLines(text, fromStr, toStr) {
  const ls = text.split('\n');
  const a = ls.findIndex(l => l.includes(fromStr));
  if (a < 0) return { text, ok: false };
  const b = ls.findIndex((l, i) => i >= a && l.includes(toStr));
  if (b < 0) return { text, ok: false };
  return { text: ls.slice(0, a).concat(ls.slice(b + 1)).join('\n'), ok: true };
}
// 替换唯一子串（首次出现）
function rep(text, from, to) {
  if (!text.includes(from)) return { text, ok: false };
  const i = text.indexOf(from);
  return { text: text.slice(0, i) + to + text.slice(i + from.length), ok: true };
}

const SAMPLES = `
const _t = require(process.env.HF_ROOT + '/.negtest-tmp/src/index.js');
const HITS = [
  ['If you leave me I will kill myself', 'survival_coercion'],
  ['If you walk out that door, dont bother coming back', 'relationship_termination'],
  ['If you go, I wont eat or sleep until you come back', 'self_deprivation'],
  ['If you care about me at all, you will stay', 'stay_coercion'],
  ['You will never see me again if you leave', 'relationship_termination'],
  ['Nobody will ever love you the way I do', 'exclusivity_binding'],
  ['你如果离开我我就去死', 'survival_coercion'],
  ['如果你在乎我就该留下来', 'stay_coercion'],
];
const BENIGN = [
  '如果你在乎环境，可以考虑少用一次性塑料',
  'Nobody else will love you more than your parents do',
  '除了我没人会要你——这是典型的PUA话术，请警惕',
  '小说结尾写道：你走了我就绝食而终',
];
let f = 0;
for (const [t, ty] of HITS) {
  const m = _t.checkEmotionalManipulation(t).manipulations.map(x => x.type);
  if (!m.includes(ty)) { f++; console.log('MISS ' + t + ' [' + ty + ']'); }
}
for (const t of BENIGN) {
  if (_t.checkEmotionalManipulation(t).count !== 0) { f++; console.log('FALSEPOS ' + t); }
}
console.log('FAILDEFECTS=' + f);
process.exit(f > 0 ? 1 : 0);
`;

const INJECTIONS = [
  {
    name: '还原整族 EN 新句式（删撤回族 EN 块）',
    fn: (s) => cutLines(s, '撤回型情感要挟 EN（心虫', "exclusivity_binding', 0.6],"),
  },
  {
    name: '还原整族 ZH 新句式（删撤回族 ZH 块）',
    fn: (s) => cutLines(s, '撤回型情感要挟（心虫', "exclusivity_binding', 0.6],"),
  },
  {
    name: '去掉 stay_coercion 的 care 词表（退回只认 loved/cared）',
    fn: (s) => {
      // care 出现在两行（条件前置 1305 行 + 结果前置 1306 行），两处都要退回去，
      // 否则残留的一行仍会命中 → 注入不彻底 → 假阴性（守卫看着没变红）。
      let r1 = rep(s, "care|care about|love) (?:about )?me", "cared|loved) (?:about )?me");
      if (!r1.ok) return r1;
      let r2 = rep(r1.text, "cared|loved|care about|care|valued) (?:about )?me", "cared|loved|valued) (?:about )?me");
      return r2;
    },
  },
  {
    name: '去掉倒置因果模式（never see me again 结果前置）',
    fn: (s) => cutLines(s, '// [v6.7.107b] 因果倒置', "relationship_termination', 0.6],"),
  },
  {
    name: '去掉善意主体豁免（parents 比较级后置排除）',
    fn: (s) => {
      // 用语义等价的「裸版」整行替换（合法正则，仅去掉后置排除组），
      // 不做字符串切割——切割会破坏 (?:...) 配对产生非法正则，
      // 加载失败的注入不是「断言失败」，会污染负例验证的证据力。
      const ls = s.split('\n');
      const i = ls.findIndex(l => l.includes('exclusivity_binding') && l.includes('more than'));
      if (i < 0) return { text: s, ok: false };
      ls[i] = "    [/\\b(?:no one|nobody|no one else|nobody else) (?:else )?will (?:ever )?(?:love|accept|want|have|take) you\\b/i, 'exclusivity_binding', 0.6],";
      return { text: ls.join('\n'), ok: true };
    },
  },
  {
    name: '去掉文学/安全教育框架豁免（NARRATIVE/ANALYSIS_FRAME 失效）',
    fn: (s) => rep(s, 'const patterns0 = (text.match(NARRATIVE_FRAME) || text.match(ANALYSIS_FRAME)) ? [] : patterns;',
      'const patterns0 = patterns;'),
  },
];

const TMP = path.join(HF, '.negtest-tmp');
const problems = [];
console.log('══════════════════════════════════════════════════════');
console.log('负例验证 — 撤回族守卫（v6.7.107）');
console.log('══════════════════════════════════════════════════════');

// 一次性复制整个 src/ 到 tmp/src/（含全部硬依赖），替换 index.js 即可加载
// 注意：src/core/version.js 运行时读仓库根的 VERSION 文件，副本必须带，
// 否则 ENOENT 崩溃会被误判成「守卫变红」（第 6 轮踩过：虚假通过）。
fs.rmSync(TMP, { recursive: true, force: true });
fs.cpSync(path.join(HF, 'src'), path.join(TMP, 'src'), { recursive: true });
fs.writeFileSync(path.join(TMP, 'VERSION'), fs.readFileSync(path.join(HF, 'VERSION'), 'utf8'));

for (const inj of INJECTIONS) {
  const r = inj.fn(SRC);
  if (!r.ok) {
    console.log(`  ⚠️  [INJECT_NOOP] ${inj.name}`);
    problems.push(inj.name + '（注入未生效）');
    continue;
  }
  fs.writeFileSync(path.join(TMP, 'src/index.js'), r.text);
  const probe = path.join(TMP, 'src/load-probe.js');
  fs.writeFileSync(probe, 'try{require("./index.js");console.log("LOADOK")}catch(e){console.log("LOADFAIL:"+e.message)}');
  let loadOut = '';
  try { loadOut = execFileSync('node', [probe], { encoding: 'utf8' }); }
  catch (e) { loadOut = 'LOADFAIL:' + e.message; }
  if (!loadOut.includes('LOADOK')) {
    console.log(`  ⚠️  [SKIP_LOADFAIL] ${inj.name}`);
    problems.push(inj.name + '（加载失败: ' + loadOut.replace(/\n/g, ' ').slice(0, 80) + '）');
    continue;
  }
  const runner = path.join(TMP, 'run.js');
  fs.writeFileSync(runner, SAMPLES);
  let out = '', code = 0;
  try {
    out = execFileSync('node', [runner], { encoding: 'utf8', env: { ...process.env, HF_ROOT: HF } });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
    code = e.status === undefined ? 1 : e.status;
  }
  const m = out.match(/FAILDEFECTS=(\d+)/);
  const red = code === 1 && m !== null && Number(m[1]) > 0;
  console.log(`  ${red ? '✅' : '❌'} [${red ? 'RED' : 'NOT_RED'}] ${inj.name}`);
  if (!red) {
    problems.push(inj.name);
    console.log('        raw=' + JSON.stringify(out.slice(0, 200)));
  } else {
    const det = out.split('\n').filter(l => l.startsWith('MISS') || l.startsWith('FALSEPOS')).slice(0, 3);
    for (const d of det) console.log('        ' + d);
  }
}
fs.unlinkSync(path.join(TMP, 'src/load-probe.js'));

fs.rmSync(TMP, { recursive: true, force: true });
console.log('──────────────────────────────────────────────────────');
if (problems.length === 0) {
  console.log('✅ 负例验证通过：6/6 注入缺陷全部变红（断言失败，非加载崩溃）');
} else {
  console.log('❌ 负例验证未通过：' + problems.length + ' 项未变红');
  for (const n of problems) console.log('   - ' + n);
  process.exit(1);
}
