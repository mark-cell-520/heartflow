'use strict';
/**
 * scripts/negative-test-silence-imputation-r717.js
 * [r717] 第 213 维度 silence_imputation 负例验证：把本轮新上线的沉默
 * 推定判据逐一注掉，守卫（test/round-717-silence-imputation.test.js
 * 的攻击矩阵 + 良性矩阵）必须变红——证明判据不是装饰、测试真的在
 * 守它。任一注入未变红 = 判据失守 = 假接线。
 *
 * 判定纪律（沿用 r218）：
 *   · 探针先打 START-PROBE 标记再 require——require 期崩溃与「守卫
 *     跑完未变红」是两回事，前者是环境问题不计红也不计绿（要人查）。
 *   · 以 `# 汇总` 行存在性判探针完整跑完；崩溃时 stdout 无该行。
 *   · formulas/ 随 src 一起拷（r218 踩坑 1：副本缺 formulas → 公式
 *     引擎 ENOENT 噪音被崩溃识别正则误判，注入「未变红」假阴性）。
 *   · 两种变红方向：expect='attack_drop'（注入腿/窗 → 攻击漏判），
 *     expect='ben_fp'（注入豁免 → 良性被误伤）。
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

// ── 攻击集（= 测试文件攻击矩阵全集，未注入必须全非 pass）──────────
const EXPECT_ATTACK = [
  '他到现在都没出来否认，说明这事是真的。',
  '她不回答就是默认了。',
  '面对追问一言不发，这本身就是答案。',
  '不置评就等于默认，大家心里都清楚。',
  '他避而不答的态度已经说明了一切。',
  '既然没否认，那就是承认了。',
  'No denial has been issued, so the allegations must be true.',
  'He refused to answer the question, which speaks for itself.',
  'Her silence on the matter is telling enough.',
  '这么久都不出来澄清，显然是心虚。',
];

// ── 良性集（= 测试文件良性矩阵全集，未注入必须全 pass）────────────
const EXPECT_PASS = [
  '他在调查结束前不回应，是律师建议，不等于认罪。',
  'He declined to comment pending the investigation, which is standard practice.',
  '公司称因进入法律程序，现阶段不对细节置评。',
  '不回应是当事人的权利，不能据此推断指控为真。',
  '她对流言选择不回应，是不给传闻增加热度。',
  '法院尚未判决，任何一方都有权不对外发声。',
  '他全程没有回应。',
  '记者多次联系，对方均未置评。',
  '这是典型的诉诸沉默谬误，沉默不能作为证据。',
  'Argument from silence is a fallacy in this case.',
];

// ── 注入表 ────────────────────────────────────────────────────────
const INJECTIONS = [
  { name: 'pickRe 默认表全空（判据整体承重）', file: 'src/silence-imputation.js', kind: 'code',
    old: 'return (injected instanceof Array) ? injected : def;',
    neu: 'return (injected instanceof Array) ? injected : [];', expect: 'attack_drop' },
  { name: 'neutralize SILENCE_ZH 腿①（zh 沉默腿）', file: 'src/silence-imputation.js', kind: 'regex',
    anchor: '否认|澄清|回应|回答|解释|辟谣|发声|作声|吭声', expect: 'attack_drop' },
  { name: 'neutralize IMPUTE_ZH 腿②首式（就是/等于+默认/承认）', file: 'src/silence-imputation.js', kind: 'regex',
    anchor: '就是|等于|意味着|说明|证明|表明|印证|坐实|等于说|无异于', expect: 'attack_drop' },
  { name: 'neutralize SILENCE_EN 腿①（en 沉默腿）', file: 'src/silence-imputation.js', kind: 'regex',
    anchor: '(?:denial|response|reply|comment|answer|statement)', expect: 'attack_drop' },
  { name: 'neutralize IMPUTE_EN 腿②首式（must be true）', file: 'src/silence-imputation.js', kind: 'regex',
    anchor: 'must be true|has to be true', expect: 'attack_drop' },
  { name: '邻近窗 60 → 12（英文跨距 46 样本漏判）', file: 'src/silence-imputation.js', kind: 'code',
    old: 'if (after >= 0 && after <= 60) {', neu: 'if (after >= 0 && after <= 12) {', expect: 'attack_drop' },
  { name: '注掉 EXEMPT_CORRECT_ZH「是当事人的权利」', file: 'src/silence-imputation.js', kind: 'code',
    old: "'是当事人的权利'", neu: "'zzzzz'", expect: 'extra_fp' },
  { name: '注掉 EXEMPT_CORRECT_EN「not evidence」', file: 'src/silence-imputation.js', kind: 'code',
    old: "'not evidence'", neu: "'zzzzz'", expect: 'extra_fp' },
  { name: '注掉 EXEMPT_META_ZH「诉诸沉默」', file: 'src/silence-imputation.js', kind: 'code',
    old: "'诉诸沉默'", neu: "'zzzzz'", expect: 'extra_fp' },
  { name: '注掉 EXEMPT_META_EN「argument from silence」', file: 'src/silence-imputation.js', kind: 'code',
    old: "'argument from silence'", neu: "'zzzzz'", expect: 'extra_fp' },
];

// ── 豁免依赖样本（单依赖专属豁免词；未注入必须 pass）────────────────
// 设计纪律（r218 踩坑 1 同源：注入要打在承重点上）：测试文件良性矩阵
// 里多数句子天然不命中判据（缺腿②），豁免机制对它们不承重——负例必须
// 用「双腿共现 + 唯一豁免词拦下」的专属样本，注入该词后守卫必须变红，
// 否则豁免是死代码。
const EXPECT_EXTRA = [
  '她不回答是当事人的权利，偏偏有人说这就是默认。',
  'His silence is telling, but silence is not evidence.',
  '这是诉诸沉默谬误，不回应就是默认。',
  "This argument from silence is a fallacy: no response means he's guilty.",
];

/** 建副本：VERSION/package.json/src/formulas */
function makeCopy(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(ROOT, 'src'), path.join(dir, 'src'), { recursive: true });
  if (fs.existsSync(path.join(ROOT, 'formulas'))) {
    fs.cpSync(path.join(ROOT, 'formulas'), path.join(dir, 'formulas'), { recursive: true });
  }
  return dir;
}

/** 探针：gate 层（攻击/良性）+ 模块层（豁免依赖样本） */
const PROBE = `'use strict';
console.log('START-PROBE');
const gate = require(${JSON.stringify(path.join('SRC_DIR_PLACEHOLDER', 'src', 'gate.js'))});
const si = require(${JSON.stringify(path.join('SRC_DIR_PLACEHOLDER', 'src', 'silence-imputation.js'))});
const ATK = ${JSON.stringify(EXPECT_ATTACK)};
const BEN = ${JSON.stringify(EXPECT_PASS)};
const EXTRA = ${JSON.stringify(EXPECT_EXTRA)};
let hit = 0, fp = 0, extraFp = 0;
const leaked = [];
for (const s of ATK) {
  const a = gate.checkOutput(s).gate.action;
  if (a !== 'pass') hit++; else leaked.push(a + ' ' + s.slice(0, 24));
}
const flipped = [];
for (const s of BEN) {
  const a = gate.checkOutput(s).gate.action;
  if (a !== 'pass') { fp++; flipped.push(a + ' ' + s.slice(0, 24)); }
}
// 豁免依赖样本走模块层（gate 层有 manufactured_consent/fallacies 存量
// 维度对同话题句误伤，模块层才能纯净验证本族豁免机制承重）
const extraFlipped = [];
for (const s of EXTRA) {
  if (si.checkSilenceImputation(s).hit) { extraFp++; extraFlipped.push(s.slice(0, 24)); }
}
console.log('ATTACK_HIT=' + hit + '/' + ATK.length);
console.log('BEN_FP=' + fp + '/' + BEN.length);
console.log('EXTRA_FP=' + extraFp + '/' + EXTRA.length);
console.log('# 汇总: ' + (hit === ATK.length && fp === 0 && extraFp === 0 ? '全绿' : '守卫变红'));
for (const l of leaked) console.log('  leaked: ' + l);
for (const f of flipped) console.log('  flipped: ' + f);
for (const f of extraFlipped) console.log('  extra-flipped: ' + f);
`;

function runProbe(dir) {
  const probePath = path.join(dir, 'probe.js');
  // 全局替换：PROBE 模板有 gate/silence-imputation 两个占位符，
  // String.replace 字符串参数只换第一处（r717 实测踩坑）。
  fs.writeFileSync(probePath, PROBE.replace(/SRC_DIR_PLACEHOLDER/g, dir.replace(/\\/g, '\\\\')));
  const out = execFileSync(process.execPath, [probePath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return out;
}

/** 按锚点 neutralize 正则字面量 */
function neutralizeRegex(src, anchor, fileLabel) {
  const i = src.indexOf(anchor);
  if (i < 0) throw new Error(`锚点未找到(${fileLabel}): ${anchor}`);
  const start = src.lastIndexOf('/', i);
  if (start < 0) throw new Error(`无法定位正则起始(${fileLabel}): ${anchor}`);
  let end = -1;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '/') {
      let k = j + 1;
      while (k < src.length && /[a-z]/.test(src[k])) k++;
      end = k;
      break;
    }
  }
  if (end < 0 || end <= start) throw new Error(`无法定位正则边界(${fileLabel}): ${anchor}`);
  const literal = src.slice(start, end);
  if (!literal.startsWith('/')) throw new Error(`提取到的不是正则(${fileLabel}): ${literal.slice(0, 30)}`);
  return src.slice(0, start) + '/(?!x)x/' + src.slice(end);
}

let red = 0, green = 0, crashed = 0;
const results = [];

// ① 对照副本：未注入，必须全绿（攻击 10/10 拦 + 良性 0 误伤 + 豁免依赖 0 误伤）
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-sil-r717-control'));
  try {
    const out = runProbe(dir);
    if (!/START-PROBE/.test(out)) throw new Error('探针未启动（环境问题）');
    const ok = /ATTACK_HIT=10\/10/.test(out) && /BEN_FP=0\/10/.test(out) && /EXTRA_FP=0\/4/.test(out) && /# 汇总: 全绿/.test(out);
    if (!ok) { green++; console.error('对照副本未全绿：\n' + out); }
    results.push(['对照（未注入）', ok ? '全绿（ATTACK_HIT=10/10, BEN_FP=0/10, EXTRA_FP=0/4）' : '未全绿']);
  } catch (e) {
    crashed++;
    console.error('对照副本崩了（崩溃≠变红）: ' + e.message);
    results.push(['对照（未注入）', '崩溃']);
  }
}

// ② 逐个注入：必须变红
for (const inj of INJECTIONS) {
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-sil-r717-' + Math.random().toString(36).slice(2, 8)));
  const fp = path.join(dir, inj.file);
  try {
    const src = fs.readFileSync(fp, 'utf8');
    const out_src = inj.kind === 'regex'
      ? neutralizeRegex(src, inj.anchor, inj.file)
      : src.replace(inj.old, inj.neu);
    if (out_src === src) throw new Error('注入未改变源码（锚点/old_string 未命中）');
    fs.writeFileSync(fp, out_src);
    const out = runProbe(dir);
    if (!/START-PROBE/.test(out)) throw new Error('探针未启动（环境问题）');
    const atkHit = Number((/ATTACK_HIT=(\d+)\//.exec(out) || [])[1]);
    const benFp = Number((/BEN_FP=(\d+)\//.exec(out) || [])[1]);
    const extraFp = Number((/EXTRA_FP=(\d+)\//.exec(out) || [])[1]);
    const changed = inj.expect === 'attack_drop' ? atkHit < 10
      : inj.expect === 'extra_fp' ? extraFp > 0
      : benFp > 0;
    if (changed) { red++; results.push([inj.name, `变红（ATTACK_HIT=${atkHit}/10, BEN_FP=${benFp}/10, EXTRA_FP=${extraFp}/4）`]); }
    else { green++; results.push([inj.name, `未变红（ATTACK_HIT=${atkHit}/10, BEN_FP=${benFp}/10, EXTRA_FP=${extraFp}/4）`]); console.error('注入未变红：' + inj.name + '\n' + out); }
  } catch (e) {
    crashed++;
    console.error('注入探针崩了（崩溃≠变红，要人查）: ' + inj.name + ' — ' + e.message);
    if (e.stderr) console.error('  stderr: ' + String(e.stderr).slice(0, 400));
    results.push([inj.name, '崩溃']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

console.log('\n=== 注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红，' + crashed + ' 个崩溃 ===');
for (const [n, s] of results) console.log('  ' + s + '\t' + n);
if (red === INJECTIONS.length && crashed === 0) {
  console.log('\n负例验证通过');
  process.exit(0);
}
console.error('\n负例验证失败');
process.exit(1);
