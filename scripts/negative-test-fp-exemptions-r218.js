'use strict';
/**
 * scripts/negative-test-fp-exemptions-r218.js
 * [r218] 存量误伤修复轮负例验证：把本轮新加的每条豁免逐一注掉，守卫
 * （test/round-218-fp-exemptions.test.js 的误伤矩阵）必须变红——证明
 * 豁免不是装饰、测试真的在守它。任一注入未变红 = 守卫失守 = 假接线。
 *
 * 与 negative-test-absolute-claim-en.js 的差异：本轮豁免横跨 4 个 src
 * 文件，注入目标是各文件的豁免正则/闸门，不是单一 index.js 块。
 *
 * 判定纪律（r217 教训）：
 *   · 探针先打 START 标记再 require——require 期崩溃与「守卫跑完未变红」
 *     是两回事，前者是环境问题不计红也不计绿（要人查）。
 *   · 以 `# 汇总` 行存在性判探针完整跑完；崩溃时 stdout 无该行。
 *   · formulas/ 随 src 一起拷（踩坑 1：副本缺 formulas → 公式引擎
 *     ENOENT 噪音被崩溃识别正则误判，注入「未变红」假阴性）。
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = path.resolve(__dirname, '..');
const ROOT = HF;

// ── 期望全绿的样本集（= 测试文件误伤矩阵全集）────────────────
// 10 条本轮实测误伤 + 3 条 r217 边界迁移 + 2 条 r216 谈判程序良性
const EXPECT_PASS = [
  // perfect_error S5 道义模态 / S1 统计语域
  '法院尚未判决，任何一方都有权不对外发声。',
  '任何情况下都不能绕过核查，先验证数据来源再说。',
  '筛子误报率1%，在低患病率人群里，阳性者中真正患病的仍然不多。',
  // presupposition loaded_behavior 质问对象闸
  '这种病患病率万分之一，虽然检测阳性，实际患病概率仍然很低。',
  // vagueness 验证锚
  '每个部件都通过质检，整机大概率也可靠，但仍需整机测试。',
  '报告显示问题集中在管理不善的部门，需对这些部门专项整改。',
  // false_balance 条件式规范
  '双方主张都有道理时，可以找一个平衡点。',
  // di+rh 英文前置否定腿③ + 禁令祈使
  'Under no circumstances should you bypass the verification step.',
  'Never share your password with anyone.',
  // 规范流程句
  '所有用户都必须定期修改密码，这是安全基线要求。',
  // r217 边界迁移（本轮道义豁免修掉）
  '任何情况下都不能忽略安全警告。',
  'Never turn off the security group policy.',
  'Security warnings must never be ignored.',
  // r216 池存量良性锚点（实测不命中 false_balance——「各让一步」不在
  // EQUAL_WEIGHT_ZH 等权并列支里；放这里防未来改动误伤）
  '谈判中双方各让一步，是协商策略，不代表谁的主张更接近事实。',
  'Splitting the difference is a negotiation tactic, not a truth procedure.',
];

// ── 注入表：每项把一条豁免 neutralize，守卫必须变红 ──────────
// 两种注入形态：
//   kind:'regex'  —— 锚点定位正则字面量边界，整体换成永不匹配的 /(?!x)x/
//                     （不用 /(?!)/ ：零宽匹配会让跨度收集循环推一堆空
//                     跨度，空跨度在区间重叠判据里反而能「命中」一切）
//   kind:'code'   —— 精确字符串替换（闸门调用点）
const INJECTIONS = [
  { name: '注掉 DEONTIC_ALL_ZH（道义模态 zh 腿）', file: 'src/perfect-error.js', kind: 'regex', anchor: '无权|不得|不能|不可' },
  { name: '注掉 DEONTIC_ALL_EN（道义模态 en 腿）', file: 'src/perfect-error.js', kind: 'regex', anchor: 'ought' },
  { name: '注掉 DEONTIC_MODAL_NEVER_EN（情态+never+be 腿）', file: 'src/perfect-error.js', kind: 'regex', anchor: 'never\\s+be\\b' },
  { name: '注掉 STATISTICAL_DOMAIN_ZH（统计语域豁免）', file: 'src/perfect-error.js', kind: 'regex', anchor: '假阳|假阴' },
  { name: '注掉 NEG_FRONTED_EN_RE（前置否定状语腿③）', file: 'src/dev-exemptions.js', kind: 'regex', anchor: 'under\\s+no\\s+circumstances' },
  { name: '注掉 VERIFICATION_ANCHOR（vagueness 验证锚）', file: 'src/index.js', kind: 'regex', anchor: '复盘|约谈' },
  { name: '注掉 loaded_behavior 质问对象闸', file: 'src/index.js', kind: 'code',
    old: "type === 'loaded_behavior' && !_hasInterrogativeTarget(m.index)", neu: 'false' },
  { name: '注掉 CONDITIONAL_NORM_ZH（条件式规范豁免）', file: 'src/false-balance.js', kind: 'regex', anchor: '不妨|方能' },
];

/** 建副本：VERSION/package.json/src/formulas（formulas 见文件头踩坑 1） */
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

/** 探针源码：对 EXPECT_PASS 全集跑 gate，必须全 pass */
const PROBE = `'use strict';
console.log('START-PROBE');
const gate = require(${JSON.stringify(path.join('SRC_DIR_PLACEHOLDER', 'src', 'gate.js'))});
const EXPECT = ${JSON.stringify(EXPECT_PASS)};
let fail = 0;
const flipped = [];
for (const s of EXPECT) {
  const a = gate.checkOutput(s).gate.action;
  if (a !== 'pass') { fail++; flipped.push(a + ' ' + s.slice(0, 24)); }
}
console.log('HIT_FAIL=' + fail + '/' + EXPECT.length);
console.log('# 汇总: ' + (fail === 0 ? '全绿' : fail + ' 条误伤'));
for (const f of flipped) console.log('  flipped: ' + f);
`;

function runProbe(dir) {
  const probePath = path.join(dir, 'probe.js');
  fs.writeFileSync(probePath, PROBE.replace('SRC_DIR_PLACEHOLDER', dir.replace(/\\/g, '\\\\')));
  const out = execFileSync(process.execPath, [probePath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return out;
}

/** 从源文件里按锚点提取正则字面量（含 flags），换成永不匹配式 */
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

// ① 对照副本：未注入，必须全绿
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-fp-r218-control'));
  try {
    const out = runProbe(dir);
    if (!/START-PROBE/.test(out)) throw new Error('探针未启动（环境问题）');
    const ok = /HIT_FAIL=0\//.test(out) && /# 汇总: 全绿/.test(out);
    if (!ok) { green++; console.error('对照副本未全绿：\n' + out); }
    results.push(['对照（未注入）', ok ? '全绿' : '未全绿']);
  } catch (e) {
    crashed++;
    console.error('对照副本崩了（崩溃≠变红）: ' + e.message);
    results.push(['对照（未注入）', '崩溃']);
  }
}

// ② 逐个注入：必须变红
for (const inj of INJECTIONS) {
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-fp-r218-' + Buffer.from(inj.name).toString('hex').slice(0, 12)));
  const fp = path.join(dir, inj.file);
  try {
    const before = fs.readFileSync(fp, 'utf8');
    let after;
    if (inj.kind === 'regex') {
      after = neutralizeRegex(before, inj.anchor, inj.file);
    } else {
      if (!before.includes(inj.old)) throw new Error(`代码锚点未找到: ${inj.old.slice(0, 40)}`);
      after = before.split(inj.old).join(inj.neu);
    }
    if (after === before) throw new Error('注入未改变源码');
    fs.writeFileSync(fp, after);
    const out = runProbe(dir);
    if (/HIT_FAIL=[1-9]/.test(out)) {
      red++;
      const m = out.match(/HIT_FAIL=(\d+)\/(\d+)/);
      results.push([inj.name, `变红（误伤复现 ${m[1]}/${m[2]}）`]);
    } else if (/START-PROBE/.test(out)) {
      green++;
      results.push([inj.name, '未变红（守卫失守）']);
    } else {
      crashed++;
      results.push([inj.name, '探针未启动（环境问题）: ' + String(e_msg(out)).slice(0, 120)]);
    }
  } catch (e) {
    const out = String(e.stdout || '');
    if (/HIT_FAIL=[1-9]/.test(out)) {
      red++;
      const m = out.match(/HIT_FAIL=(\d+)\/(\d+)/);
      results.push([inj.name, `变红（误伤复现 ${m[1]}/${m[2]}）`]);
    } else if (/START-PROBE/.test(out) && /HIT_FAIL=0\//.test(out)) {
      green++;
      results.push([inj.name, '未变红（守卫失守）']);
    } else {
      crashed++;
      results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 160)]);
      const detail = String(e.stderr || '') + ' || ' + out;
      if (detail.trim().length > 6) {
        console.error('    detail: ' + detail.split('\n').slice(0, 5).join('\n    ').slice(0, 500));
      }
    }
  }
}

function e_msg() { return ''; }

console.log('\n=== 负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log(`\n注入 ${INJECTIONS.length} 个：${red} 个让守卫变红，${green} 个未变红，${crashed} 个探针异常`);
const pass = red === INJECTIONS.length && green === 0 && crashed === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
