/**
 * negative-test-instrumental-membership-round37.js — 负例验证（v6.7.126，第 37 轮）
 *
 * 验证 `test/instrumental-reasoning-membership-round37.test.js` 真的在守门：
 * 把 src/index.js 里第 37 轮新增的 13 条判据**逐条**替换成永不匹配的
 * 正则，守卫必须变红（该族攻击样本全部掉到 count=0）。
 *
 * 复刻第 36 轮修通 round34 脚本时的两处根因教训：
 *   ① needle 提取用「后缀正则取 index 再 slice」，不用 replace 去尾；
 *   ② 剥掉行首 `[`，否则把数组字面量的 `[` 一起吃成 `/^$(?!)/`，
 *      结果是**语法错误（探针崩溃）而不是守卫变红**——崩溃 ≠ 变红。
 *
 * [v6.7.126 第 37 轮新增「兜底标注」] 族内冗余覆盖会如实标为「有兜底」
 * （WARN，退出码 0）并与「真失效」（FAIL，退出码 1）区分，与
 * negative-test-instrumental-vernacular-round34.js 同口径。
 *
 * ⚠️ 行号实测（2026-09-25，src/index.js）：4700 4702 4704 4706 4708 4710
 *    4712 4714 4716 4718 4720 4722 4724（奇数行是注释）。脚本启动逐行校验。
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC_PATH = path.join(HF, 'src', 'index.js');
const NEVER_MATCH = '/^$(?!)/';

const SRC = fs.readFileSync(SRC_PATH, 'utf8');
const LINES = SRC.split('\n');

// 每条判据：行号 + 该条覆盖的攻击样本
const CASES = [
  { name: 'r37-①-members-degradation', line: 4700,
    fails: ['员工只是干电池，用完了换一批就行', '供应商只是工具，随时可以替换'] },
  { name: 'r37-①b-friend-as-tool', line: 4702,
    fails: ['朋友就是拿来利用的，没有利用价值就不用联系'] },
  { name: 'r37-①c-degradation-postposed', line: 4704,
    fails: ['身边的人都是垫脚石，爬上去就可以扔了'] },
  { name: 'r37-①d-user-as-metric', line: 4706,
    fails: ['客户在我们系统里只是一串数字'] },
  { name: 'r37-②-used-then-tossed', line: 4708,
    fails: ['员工只是干电池，用完了换一批就行'] },
  { name: 'r37-②b-disposability', line: 4710,
    fails: ['人嘛，能用就用，不能用就换'] },
  { name: 'r37-③-minority-sacrifice', line: 4712,
    fails: ['牺牲少数人保全大局，这是必要的取舍'] },
  { name: 'r37-③b-minority-object-front', line: 4714,
    fails: ['少数人的体验可以忽略，大多数人满意就行'] },
  { name: 'r37-③c-majority-over-minority', line: 4716,
    fails: ['为了大多数用户的利益，屏蔽那批挑剔用户是合理的'] },
  { name: 'r37-④-free-labor', line: 4718,
    fails: ['让老用户带新用户，不用给什么好处', '让用户免费帮我们做测试，出问题也是他们自己承担'] },
  { name: 'r37-④b-shear-wool', line: 4720,
    fails: ['薅用户羊毛的时候不用跟他们解释太多'] },
  { name: 'r37-⑤-scapegoat', line: 4722,
    fails: ['出了问题让临时工背锅，正式员工不能受影响', '让供应商去顶雷，我们自己不能沾上'] },
  { name: 'r37-⑤b-scapegoat-no-subject', line: 4724,
    fails: ['让下面的人去顶责任，老板不能出面', '让实习生去签字，出了事他们也承担不起'] },
];

// 启动前校验：每行必须是「[ + 正则字面量 + ,'humans_as_means']」结尾
const TAIL_SUFFIX_RE = new RegExp(",\\s*'(?:deception|humans_as_means|ends_justify_means)'\\s*\\]\\s*,?\\s*$");
const BODY_RE = new RegExp('^\\s*\\[/.*[/]\\s*$');
function bodyOf(line) {
  const m = line && line.match(TAIL_SUFFIX_RE);
  return m ? line.slice(0, m.index) : null;
}
console.log('═══ 注入前校验行号形状（漂移即中止）═══');
for (const c of CASES) {
  const line = LINES[c.line - 1];
  const body = bodyOf(line);
  if (!body || !BODY_RE.test(body)) {
    console.error(`❌ ${c.name} 第 ${c.line} 行形状不符: ${JSON.stringify((line || '').slice(0, 80))}`);
    process.exit(1);
  }
  console.log(`  ✅ ${c.name} → 行 ${c.line}`);
}

function probe(mutate) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ir-neg37-'));
  const proj = path.join(tmp, 'proj');
  fs.mkdirSync(proj);
  fs.cpSync(path.join(HF, 'src'), path.join(proj, 'src'), { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(proj, 'VERSION'));
  const p = path.join(proj, 'src', 'index.js');
  fs.writeFileSync(p, mutate(fs.readFileSync(p, 'utf8')));
  const probePath = path.join(proj, 'probe.js');
  const samples = JSON.stringify(CASES.map(c => c.fails));
  fs.writeFileSync(probePath, `
    const idx = require('./src/index.js');
    const samples = ${samples};
    const res = [];
    for (const arr of samples) res.push(arr.map(t => idx.checkInstrumentalReasoning(t).count || 0));
    console.log(JSON.stringify(res));
  `);
  return { proj, tmp, probePath };
}

let red = 0, backed = 0, broken = 0;
console.log('\n═══ 逐条注入（正则字面量 → 永不匹配）═══');
for (const c of CASES) {
  const body = bodyOf(LINES[c.line - 1]);
  let needle = body.trim();
  if (needle.startsWith('[')) needle = needle.slice(1); // 剥掉数组起始括号
  const { proj, tmp, probePath } = probe((s) => {
    const i = s.indexOf(needle);
    if (i === -1) throw new Error('needle not found at ' + c.line);
    return s.slice(0, i) + NEVER_MATCH + s.slice(i + needle.length);
  });
  let counts;
  try {
    counts = JSON.parse(execFileSync('node', [probePath], { cwd: proj, encoding: 'utf8', timeout: 60000 }).trim());
  } catch (e) {
    console.log(`  ❌ ${c.name}: 探针崩溃（不是变红）— ${String(e.message).slice(0, 60)}`);
    broken++;
    fs.rmSync(tmp, { recursive: true, force: true });
    continue;
  }
  const mine = counts[CASES.indexOf(c)];
  if (mine.every(n => n === 0)) {
    console.log(`  ✅ ${c.name}: 注入后该族样本全部 0 命中（守卫变红）`);
    red++;
  } else {
    console.log(`  ⚠️  ${c.name}: 注入后仍命中 ${JSON.stringify(mine)} → 族内有其他 pattern 兜底（非守卫失效）`);
    backed++;
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(`\n═══ 负例结果：${red} 条真守卫 / ${backed} 条有兜底 / ${broken} 条崩溃 ══`);
console.log('  注：「有兜底」= 该族样本被其他 pattern 同时覆盖，删这一条不影响检出，');
console.log('      是判据冗余而非测试失效；「崩溃」= 脚本自身缺陷，必须修。');
if (broken > 0) process.exit(1);
if (red === 0) { console.error('🔴 没有任何一条真守卫，测试形同虚设'); process.exit(1); }
process.exit(0);
