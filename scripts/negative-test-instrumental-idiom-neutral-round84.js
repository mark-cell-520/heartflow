/**
 * negative-test-instrumental-idiom-neutral-round84.js — 负例验证（第 84 轮）
 *
 * 验证 `test/instrumental-idiom-neutral-engineering-round84.test.js` 真的在守门：
 * 把本轮新增的豁免逻辑逐个必要条件打掉，**主测试必须变红**（断言失败，
 * 不是加载崩溃、不是探针自己得出的空结论）。
 *
 * 模板来源：scripts/negative-test-dangerous-dev-debug.js（v6.7.115）
 * 四轮踩过的坑（别再踩）：
 *   ① needle 必须从源码按锚点自取，不手写——第 13 轮手写多一层反斜杠，
 *      注入全「未生效」假阴性。
 *   ② 探针写成文件再跑，不用 node -e——内联解释器被安全扫描拦。
 *   ③ 读 e.stdout 判断，别让 execFileSync 的 throw 当结论。
 *   ④ 必须断言「对照副本全绿」——对照崩了就算整体失败。
 *   ⑤ [第 84 轮] 注入目标必须是**主测试文件本体**，不是自建探针。
 *      第一版自建探针断言 isMetaDiscursive/isNeutralEngineeringAction，结果两个
 *      方向假阴性：
 *        · 「打掉裸壳必要条件」→ 良性仍全绿：IDIOM_SHELL_NAKED 与既有族
 *          DECISION_MARKS 用的 IDIOM_SHELL 共享词形，主流程里 DECISION_MARKS
 *          先放行，打掉本族条件不影响最终结论（与主测试 ③ 第一版同坑）。
 *        · 「打掉一票否决」→ 攻击仍全命中：5417 兜底族本身也抓这些攻击句，
 *          豁免失效根本不改变检测层结果。
 *      改成「注入 → 跑真主测试 → 断言退出码非零」才是守卫的正确定义。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = 'src/meta-discourse-exempt.js';
const MAIN_TEST = 'test/instrumental-idiom-neutral-engineering-round84.test.js';

const INJECTIONS = [
  {
    name: '打掉「成语裸壳在场」必要条件',
    anchor: 'if (!IDIOM_SHELL_NAKED.test(text)) return false;',
    mutate: (s) => s.replace(
      'if (!IDIOM_SHELL_NAKED.test(text)) return false;',
      'if (false) return false;'
    ),
  },
  {
    name: '打掉「中性工程动作词」必要条件',
    anchor: 'return NEUTRAL_ACTION.test(text);',
    mutate: (s) => s.replace(
      'return NEUTRAL_ACTION.test(text);',
      'return false;'
    ),
  },
  {
    name: '打掉 isMetaDiscursive 里的新族调用',
    anchor: 'if (isNeutralEngineeringAction(text)) return true;',
    mutate: (s) => s.replace(
      'if (isNeutralEngineeringAction(text)) return true;',
      'if (false) return true;'
    ),
  },
  {
    // 这条不是打豁免族，是打攻击侧召回：5417 兜底族的「较真」词族。
    // 证明主测试 ② 的召回断言真的依赖本轮补的词（而不是靠别的判据蹭过）。
    name: '删掉 5417 兜底族本轮补的「较真」词',
    anchor: '|别管|不管|别较真|较真|太计较|计较)/',
    mutate: (s) => s.replace(
      '|别管|不管|别较真|较真|太计较|计较)/',
      '|别管|不管)/'
    ),
  },
];

function copyRepo(dir) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  fs.cpSync(path.join(HF, 'test'), path.join(dir, 'test'), { recursive: true });
  return dir;
}

function runMainTest(dir) {
  const testPath = path.join(dir, MAIN_TEST);
  return execFileSync(process.execPath, [testPath], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], cwd: dir,
  });
}

const results = [];
let red = 0, green = 0;

// ① 对照副本：未注入，主测试必须全绿
{
  const dir = copyRepo(path.join(os.tmpdir(), 'hf-iin-control-r84b'));
  try {
    const out = runMainTest(dir);
    if (/0 失败/.test(out)) results.push(['对照主测试（未注入）', '全绿（' + (/结果: (\d+) 通过/.exec(out) || [])[1] + ' 通过）']);
    else { green++; results.push(['对照主测试', '未全绿']); console.error(out); }
  } catch (e) {
    green++;
    results.push(['对照主测试', '崩溃']);
    console.error('对照副本主测试失败：' + (e.stdout || e.message));
  }
}

// ② 逐个注入：主测试必须非零退出（变红）
INJECTIONS.forEach((inj, i) => {
  const dir = copyRepo(path.join(os.tmpdir(), 'hf-iin-r84b-' + i));
  const file = path.join(dir, inj.name.includes('5417') ? 'src/index.js' : SRC);
  const before = fs.readFileSync(file, 'utf8');
  if (!before.includes(inj.anchor)) {
    green++;
    console.error('锚点未命中(' + inj.name + ')');
    results.push([inj.name, '未生效（锚点缺失）']);
    return;
  }
  const after = inj.mutate(before);
  if (after === before) {
    green++;
    results.push([inj.name, '未改变源码']);
    return;
  }
  fs.writeFileSync(file, after);
  try {
    const out = runMainTest(dir);
    green++;
    const m = /结果: (\d+) 通过, (\d+) 失败/.exec(out);
    results.push([inj.name, '未变红（守卫失守）主测试仍 ' + (m ? m[1] + ' 通过 ' + m[2] + ' 失败' : '通过')]);
    console.error('注入后主测试未变红：\n' + out);
  } catch (e) {
    // 非零退出 = 主测试断言失败 = 守卫有效
    const m = /结果: (\d+) 通过, (\d+) 失败/.exec(String(e.stdout || ''));
    if (m) {
      red++;
      results.push([inj.name, '变红（' + m[1] + ' 通过 / ' + m[2] + ' 失败）']);
    } else if (String(e.stderr || '').includes('SyntaxError') || String(e.message).includes('Command failed')) {
      green++;
      results.push([inj.name, '崩溃（注入破坏语法，非有效变红）']);
      console.error('注入导致语法错误：' + String(e.stderr || e.message).slice(0, 400));
    } else {
      green++;
      results.push([inj.name, '崩溃（无效注入）']);
      console.error(String(e.stderr || e.message).slice(0, 400));
    }
  }
});

// ③ 汇报
console.log('═══ 第 84 轮 负例守卫：成语族「中性工程动作」豁免族 ═══');
for (const [name, status] of results) console.log('  ' + status.padEnd(28) + ' ' + name);
console.log('');
console.log('变红 ' + red + ' / 未变红 ' + green);
if (green > 0) {
  console.log('❌ 存在守卫失守，新增测试不是有效守卫');
  process.exit(1);
}
console.log('✅ 全部注入都让主测试变红');
