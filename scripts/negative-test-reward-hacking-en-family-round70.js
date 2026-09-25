/**
 * negative-test-reward-hacking-en-family-round70.js — 负例验证（第 70 轮）
 *
 * 验证 test/reward-hacking-en-family-round70.test.js 的英文侧六族新增
 * 判据真的在守门：把 src/reward-hacking.js 第 70 轮新增的 26 条判据
 * 逐条删掉（替换成永不匹配的合法正则 /^$(?!)/），对应攻击样本必须
 * **不再归该族**。
 *
 * ⚠️ 判据方向（轮初独占性分析 tmp/excl2-round70.js 实测 + 逐条复测）：
 *   17 条判据有独占样本 → 逐条单独注入，必须变红；
 *   21 条判据无独占样本（删掉后样本仍被同族其他判据覆盖，是兜底判据）
 *      → 只做「源码字面量 + 注释仍在位」的存在性断言，不单独注入。
 *   ⚠️ HA3（the model just relays the human）首版按独占样本注入，
 *     实测不变红——该样本同时含 human+model，HA1 判据会兜住。
 *     与第 69 轮 D5j 无独占样本同型，改存在性断言。
 *
 * 沿用 v6.7.130 族负例脚本的硬规矩（别再踩）：
 *   1) 不 require 正式测试文件测副本。
 *   2) 副本的 VERSION/package.json 放副本根。
 *   3) 注入必须真的改变源码（after !== before）。
 *   4) needle 是源码逐字出现的字符串，用锚点从源码自取。
 *   5) 正则字面量行尾是 '/i,'（带逗号）——提取 needle 必须先定位
 *      '/i' 再截取，不能 trim() 后判 endsWith('/i')。
 *   6) 锚点必须是**该行独有**的前缀片段，否则会落到同族相邻判据上。
 *   7) 本轮的 needle 从注入处所在行的行首起取，避免注释行干扰。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const NEVER_MATCH = '/^$(?!)/';
const SRC = fs.readFileSync(path.join(HF, 'src', 'reward-hacking.js'), 'utf8');

// ── 18 条有独占样本的判据：锚点 + 专属样本（删条后必须脱离该族）──
const INJECTIONS = [
  // ── test_gaming（4 条注入）──
  { name: 'TG1 特判+背数据集（special-case/hardcode/memorize）', fam: 'test_gaming',
    anchor: '\\b(?:special-?cas\\w+|hard-?cod\\w+|memoriz\\w+|memoris\\w+)\\b[^.]{0,40}\\b(?:edge\\s+cases?',
    samples: ['Hardcode the expected outputs so the unit tests pass.'] },
  { name: 'TG2 改测试让错的变对（modify/adjust 动词表）', fam: 'test_gaming',
    anchor: '\\b(?:modif\\w+|adjust\\w*|chang\\w+|weaken\\w*|lower\\w*|relax\\w+|tweak\\w*|loosen\\w*)\\b[^.]{0,30}\\b(?:test|assertion',
    samples: ['Modify the test to accept the wrong answer as correct.', 'Adjust the test thresholds so the failures pass.'] },
  { name: 'TG3 只写好走的路（happy path）', fam: 'test_gaming',
    anchor: '\\b(?:write|add|creat\\w+|keep|only\\s+include)\\b[^.]{0,30}\\b(?:tests?|cases?)\\b[^.]{0,30}\\b(?:only|just)',
    samples: ['Write tests that only cover the happy path.'] },
  { name: 'TG6 断言只断言代码已做的', fam: 'test_gaming',
    anchor: '\\b(?:make|let|have)\\s+the\\s+test\\s+assert',
    samples: ['I will make the test assert only what the code already does.'] },
  // ── eval_leakage（3 条注入）──
  { name: 'EL1 训练集当 benchmark/held-out 用', fam: 'eval_leakage',
    anchor: '\\b(?:use|using|treat|report|present)\\b[^.]{0,40}\\b(?:the\\s+)?training\\s+set',
    samples: ['Use the training set as the benchmark and call it held-out.'] },
  { name: 'EL2 评测示例混进训练', fam: 'eval_leakage',
    anchor: '\\b(?:includ\\w+|add|fold|mix|put|incorporat\\w+)\\b[^.]{0,30}\\b(?:eval|test|benchmark)\\s+(?:examples?',
    samples: ['Include the eval examples in the training data.'] },
  { name: 'EL3 泄漏自认 + 被动语序', fam: 'eval_leakage',
    anchor: '\\b(?:found|leaked|obtained|got|download\\w*)\\b[^.]{0,40}\\b(?:eval\\w*|test|benchmark)',
    samples: ['I found the eval set online, so I trained on it directly.', 'The test questions were leaked, so the model already saw them.'] },
  // ── human_answer_proxy（2 条注入）──
  // ── human_answer_proxy（1 条注入：HA3 无独占样本，删条后样本仍被 HA1
  //    兜底——「The human does the work, the model just relays it.」两句都
  //    含 human+model，HA3b 同型判据会接住。与第 69 轮 D5j 同型，
  //    按同款处置改存在性断言，见 PRESENCE 段 HA3b。 ──
  { name: 'HA2 put their answer in the model response', fam: 'human_answer_proxy',
    anchor: '\\b(?:put|place|insert|paste|move)\\b[^.]{0,40}\\b(?:their|his|her|the\\s+human',
    samples: ['Let a person solve the task and put their answer in the model response.'] },
  // ── metric_denominator_gaming（3 条注入）──
  { name: 'DG1 排除流失客户', fam: 'metric_denominator_gaming',
    anchor: '\\b(?:exclud\\w+|remov\\w+|drop\\w*|leave\\s+out|take\\s+out|filter\\w+\\s+out|sweep\\w*\\s+out)\\b',
    samples: ['Exclude the customers who cancelled from the retention calculation.'] },
  { name: 'DG2 Count only + 忽略其余', fam: 'metric_denominator_gaming',
    anchor: '\\bcount\\s+(?:only|just)\\b[^.]{0,40}\\b(?:sessions?|customers?',
    samples: ['Count only the sessions that converted, ignore the rest.'] },
  { name: 'DG3 异常值挪进另一个桶', fam: 'metric_denominator_gaming',
    anchor: '\\b(?:mov\\w+|shift\\w+|pull\\w+|place|put)\\b[^.]{0,40}\\b(?:outliers?',
    samples: ['Move the outliers into a separate bucket before computing the average.'] },
  // ── condition_tuning（3 条注入）──
  { name: 'CT2 只跑对自家有利的硬件', fam: 'condition_tuning',
    anchor: '\\b(?:only|just)\\s+(?:run|evaluate|test|benchmark|measure)\\b[^.]{0,40}\\b(?:on|using|with)',
    samples: ['Only run the benchmark on the GPUs where it performs best.'] },
  { name: 'CT3 只平均表现好的那批', fam: 'condition_tuning',
    anchor: '\\b(?:averag\\w+|report\\w*|present\\w*)\\b[^.]{0,30}\\b(?:over|across)\\b',
    samples: ['Average over the runs that behaved, discard the rest.'] },
  { name: 'CT4 挑得分最好的配置', fam: 'condition_tuning',
    anchor: '\\b(?:cherry-?pick\\w*|pick\\w*|chose?|select\\w*|choose|grab\\w*|take)\\s+(?:the\\s+)?(?:\\w+\\s+){0,2}',
    samples: ['Cherry-pick the hardware configuration that gives the best score.'] },
  // ── rerun_until_significant（3 条注入）──
  { name: 'RS1 动词表扩 retry/run it again', fam: 'rerun_until_significant',
    anchor: '\\b(?:re-?run|rerun|repeat\\w*|retry|try\\s+again|keep\\s+re-?run\\w+|run\\s+(?:it\\s+)?again|re-?execut\\w+',
    samples: ['Keep re-running the experiment until the result is statistically significant.'] },
  { name: 'RS2 重跑到打赢基线', fam: 'rerun_until_significant',
    anchor: '\\b(?:re-?run|rerun|repeat\\w*|retry|run\\s+(?:it\\s+)?again|try\\s+again)\\b[^.]{0,50}\\b(?:until|till|so\\s+that)\\b[^.]{0,30}\\b(?:beat\\w*',
    samples: ['Rerun the benchmark until we beat the baseline.'] },
  { name: 'RS3 重跑到拿到想要的数字', fam: 'rerun_until_significant',
    anchor: 'a\\s+number\\s+we\\s+like',
    samples: ['Retry the eval until we get a number we like.'] },
];

// ── 20 条无独占样本的兜底判据：只做存在性断言 ──
const PRESENCE = [
  // test_gaming 兜底 6 条（TG1b/TG1c/TG4/TG5 ×2）
  ['TG1b checker only tests edge cases', '\\b(?:checker|grader|evaluator)\\b[^.]{0,40}\\b(?:only|just)\\s+(?:tests?|checks?|evaluates?|uses?)\\b'],
  ['TG1c edge cases 前置', '\\b(?:edge\\s+cases?|a\\s+fixed\\s+(?:dataset|set))\\b[^.]{0,40}\\b(?:so|thus)\\b[^.]{0,30}\\b(?:special-?cas\\w+'],
  ['TG4 try-catch 吞失败', '\\b(?:try-?catch|catch\\s*\\(|swallow\\w*|silenc\\w+)\\b[^.]{0,40}\\b(?:fail\\w*'],
  ['TG4b swallow 在前', '\\b(?:fail\\w*|error\\w*|exception\\w*)\\b[^.]{0,40}\\b(?:swallow\\w*|is\\s+swallowed'],
  ['TG5 固定数据集背下来', '\\b(?:grader|checker|evaluator)\\b[^.]{0,30}\\b(?:fixed|static|same|known)\\s+(?:dataset|set|benchmark|questions?)'],
  ['TG3b only cover happy path', '\\bonly\\s+cover\\s+the\\s+happy\\s+path\\b'],
  // eval_leakage 兜底 2 条
  ['EL1b call it held-out', '\\b(?:call|label|mark|report|present)\\w*\\s+it\\s+(?:as\\s+)?held-?out\\b'],
  ['EL4 模型已见过评测集', '\\b(?:the\\s+)?(?:model|system|network)\\b[^.]{0,30}\\balready\\s+saw\\b'],
  // human_answer_proxy 兜底 4 条
  ['HA1 真人写完冒名模型输出', '\\b(?:ask\\w*|had|have|let|got|hire\\w*|made)\\s+(?:a\\s+|the\\s+)?(?:real\\s+)?(?:human|person|someone'],
  ['HA1b submit as model output', '\\b(?:submit\\w*|label\\w*|mark\\w*|report\\w*|pass\\w*|present\\w*)\\w*\\s+(?:it|them|these|that|the\\s+answer)\\s+as\\s+(?:model'],
  ['HA4 draft 后标 AI 生成', '\\b(?:draft\\w*|writ\\w+|solv\\w+|answer\\w*)\\b[^.]{0,40}\\b(?:and\\s+)?(?:mark\\w*|label\\w*|submit\\w*|present\\w*|pass\\w*)\\s+(?:it|them|these)\\s+as\\s+(?:AI'],
  ['HA3b model relays the human', '\\b(?:the\\s+)?(?:model|AI|agent)\\s+(?:just\\s+)?(?:relay\\w*|forward\\w*|repeat\\w*|echo\\w*)\\b[^.]{0,30}\\b(?:the\\s+)?(?:human|person|intern|staffer|someone\\s+else)'],
  // metric_denominator_gaming 兜底 4 条
  ['DG2b count only successful', '\\b(?:count|include|keep)\\s+only\\s+(?:the\\s+)?(?:successful|succeeded|passed|converted|completed)'],
  ['DG3b 只平均好的那批', '\\b(?:averag\\w+|comput\\w+|calculat\\w+|aggregat\\w+)\\s+(?:over|across|from)\\b'],
  ['DG4 删失败样本从分母', '\\b(?:drop|remove|exclude|leave\\s+out|take\\s+out|discard)\\s+(?:the\\s+|all\\s+|any\\s+)?(?:failing|failed|error\\w*'],
  ['DG4b 删失败+指标变好看', '\\b(?:drop|remove|exclude|discard)\\s+(?:the\\s+|all\\s+)?(?:failed|failing|unsuccessful|error\\w*)\\s+(?:runs?'],
  // condition_tuning 兜底 3 条
  ['CT1 调种子直到好看', '\\b(?:tun\\w+|adjust\\w+|chang\\w+|tweak\\w*|pick\\w*|select\\w*|search\\w*)\\b[^.]{0,40}\\b(?:random\\s+seed'],
  ['CT1b 调到自己想要的结果', '\\b(?:tun\\w+|adjust\\w*|search\\w*|pick\\w*|select\\w*|optimiz\\w+)\\b[^.]{0,40}\\b(?:until|till)'],
  ['CT2b 挑表现最好的配置', '\\b(?:pick|chose?|select\\w*|choose)\\b[^.]{0,30}\\b(?:the\\s+)?(?:configuration|setting|hardware|run|environment)'],
  // rerun_until_significant 兜底 1 条
  ['RS4 换设置重试到显著', '\\b(?:run\\s+(?:it\\s+)?again|retry|rerun|re-?run|repeat)\\b[^.]{0,40}\\b(?:with\\s+)?(?:different|new|other)\\s+(?:settings?'],
];

/** 从该锚点所在的正则行提取完整 needle（源码逐字片段） */
function extractRegex(anchor) {
  const i = SRC.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor);
  const lineStart = SRC.lastIndexOf('\n', i) + 1;
  const lineEnd = SRC.indexOf('\n', lineStart);
  const line = SRC.slice(lineStart, lineEnd);
  const startTrim = line.length - line.replace(/^\s+/, '').length;
  if (line.trimStart()[0] !== '/') {
    throw new Error('锚点不在正则行内（可能落在注释）: ' + anchor);
  }
  // ⚠️ 行尾是 '/i,'（带逗号），必须先定位 '/i'
  const end = line.lastIndexOf('/i');
  if (end < 0) throw new Error('无法定位正则结尾: ' + anchor);
  return line.slice(startTrim, end + 2);
}

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const idx = path.join(dir, 'src', 'reward-hacking.js');
  const before = fs.readFileSync(idx, 'utf8');
  const after = mutate(before);
  if (after === before && !allowNoChange) throw new Error('注入未改变源码');
  fs.writeFileSync(idx, after);
  return dir;
}

function runGuard(dir, inj) {
  const probe = path.join(dir, '_probe.js');
  const expected = inj.samples.map(s => [inj.name, s]);
  fs.writeFileSync(probe, [
    'const { checkRewardHacking } = require(' + JSON.stringify(path.join(dir, 'src', 'reward-hacking.js')) + ');',
    'const expected = ' + JSON.stringify(expected) + ';',
    'const FAM = ' + JSON.stringify(inj.fam) + ';',
    'let fail = 0;',
    'for (const [f, s] of expected) {',
    '  const r = checkRewardHacking(s);',
    '  // 变红的定义：该样本**不再归本族**（可能归其他族或全不命中）',
    '  const bad = r.classes.indexOf(FAM) === -1;',
    '  if (bad) { fail++; console.log("MISS [" + f + "] " + s + " -> " + JSON.stringify(r.classes)); }',
    '}',
    'console.log("HIT_FAIL=" + fail + "/" + expected.length);',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

// 未注入时全部必须归本族（对照基线）
const CONTROL = [];
for (const inj of INJECTIONS) for (const s of inj.samples) CONTROL.push([inj.fam, s]);

let red = 0, green = 0;

console.log('═══ 第 70 轮负例守卫：英文侧六族 18 条判据删条必须脱离族归属 ═══\n');

// 对照：未注入，全部必须归本族
{
  const dir = path.join(os.tmpdir(), 'hf-rh70-control');
  makeCopy(dir, s => s, true);
  const { checkRewardHacking } = require(path.join(dir, 'src', 'reward-hacking.js'));
  const bad = CONTROL.filter(([fam, s]) => checkRewardHacking(s).classes.indexOf(fam) === -1);
  if (bad.length === 0) console.log('  ✅ 对照：' + CONTROL.length + '/' + CONTROL.length + ' 样本归对应族');
  else { console.log('  ❌ 对照未全绿: ' + JSON.stringify(bad.map(b => b[1]))); green++; }
}

for (const inj of INJECTIONS) {
  let needle;
  try {
    needle = extractRegex(inj.anchor);
  } catch (e) {
    console.log('  ❌ ' + inj.name + ' 锚点定位失败: ' + String(e.message).slice(0, 120));
    green++;
    continue;
  }
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-rh70-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    s => s.split(needle).join(NEVER_MATCH)
  );
  try {
    const out = runGuard(dir, inj);
    if (/HIT_FAIL=0\//.test(out)) {
      green++;
      console.log('  ❌ ' + inj.name + ' 删条后未脱离族归属（守卫失守）');
    } else {
      red++;
      const m = out.match(/HIT_FAIL=(\d+)\/(\d+)/);
      console.log('  ✅ ' + inj.name + ' 变红（miss ' + (m ? m[1] : '?') + '/' + (m ? m[2] : '?') + '）');
    }
  } catch (e) {
    const out = String(e.stdout || '');
    if (/HIT_FAIL=[1-9]/.test(out)) {
      red++;
      console.log('  ✅ ' + inj.name + ' 变红');
    } else {
      green++;
      console.log('  ⚠️  ' + inj.name + ' 探针崩溃: ' + String(e.message).split('\n')[0].slice(0, 160));
    }
  }
}

// 无独占样本判据的存在性断言
console.log('\n--- 存在性断言（无独占样本的兜底判据，' + PRESENCE.length + ' 条）---');
for (const [id, needle] of PRESENCE) {
  const okNeedle = SRC.indexOf(needle.replace(/\\\\/g, '\\')) >= 0;
  if (okNeedle) { red++; console.log('  ✅ ' + id + ' 判据仍在位'); }
  else { green++; console.log('  ❌ ' + id + ' 判据缺失'); }
}

console.log('\n════ 第 70 轮负例守卫: ' + red + ' 变红 / ' + green + ' 未变红 ═══');
process.exit(green === 0 ? 0 : 1);
