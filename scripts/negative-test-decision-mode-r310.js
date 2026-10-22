/**
 * 第 310 轮负例守卫：注入-删条-必须变红
 * 三处注入各对应一个真实缺陷回归，任何一处在注入后不变红 = 守卫无效。
 * 用法：node scripts/negative-test-decision-mode-r310.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const SRC = path.join(REPO, 'src/core/decision.js');
const TEST = path.join(REPO, 'test/decision-mode-round310.test.js');
const BACKUP = '/tmp/r310-decision-backup.js';

const cases = [
  {
    name: '注入① mode 归一化删掉（null/未知串回落失效）',
    from: "const effectiveMode = mode === 'pick_best' ? 'pick_best' : 'pick_biggest_gap';",
    to: "const effectiveMode = mode;",
  },
  {
    name: '注入② pick_best 自身达成度修正删除（四候选恢复打平弃权）',
    from: "if (effectiveMode === 'pick_best' && ratioGap) {",
    to: "if (false && effectiveMode === 'pick_best' && ratioGap) {",
  },
  {
    name: '注入③a 缺口语义态 ratioBonus 删除（r99 契约崩）',
    from: "const useRatioInScore = effectiveMode !== 'pick_best';",
    to: "const useRatioInScore = false;",
  },
  {
    name: '注入③b pick_best 达成度极性反转（1-gap → gap）',
    from: "const attainment = 1 - ratioGap.gap;",
    to: "const attainment = ratioGap.gap;",
  },
  // ⚠️ 记账：曾试过「pick_best 下 ratioBonus 改回并入」，注入后 37/0 不变红
  // —— 因为 pick_best 尾部 `c = base` 是硬覆盖，会把 ratioBonus 整个抹掉，
  // 该缺陷在本结构下不可观测。已换成上面两个有可观测后果的等价注入。
  {
    name: '注入④ upside 不再恒定透出（改随 mode 变化）',
    from: "upside: ratioGap ? Math.round(Math.min(0.35, ratioGap.gap * 0.35) * 100) / 100 : 0,",
    to: "upside: effectiveMode === 'pick_best' ? 0 : (ratioGap ? Math.round(Math.min(0.35, ratioGap.gap * 0.35) * 100) / 100 : 0),",
  },
];

let failures = 0;
const orig = fs.readFileSync(SRC, 'utf8');
fs.writeFileSync(BACKUP, orig);

for (const c of cases) {
  if (!orig.includes(c.from)) {
    console.log(`⚠️  ${c.name}：锚点未找到，跳过（可能已被其他改动覆盖）`);
    failures++;
    continue;
  }
  fs.writeFileSync(SRC, orig.replace(c.from, c.to));
  let out = '';
  let red = false;
  try {
    out = execFileSync('node', [TEST], { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
    red = true;
  }
  const m = out.match(/总计:\s*(\d+)\s*passed\s*\/\s*(\d+)\s*failed/);
  const passed = m ? Number(m[1]) : 0;
  const failed = m ? Number(m[2]) : 0;
  console.log(`${red ? '✅' : '❌'} ${c.name}：${m ? `${passed} passed / ${failed} failed` : '测试未产出结果行(异常)'}`);
  if (!red) failures++;
}

// 还原
fs.writeFileSync(SRC, orig);
let restoreOut = '';
try {
  restoreOut = execFileSync('node', [TEST], { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
} catch (e) {
  restoreOut = (e.stdout || '') + (e.stderr || '');
}
const rm = restoreOut.match(/总计:\s*(\d+)\s*passed\s*\/\s*(\d+)\s*failed/);
console.log(`还原后复验：${rm ? `${rm[1]} passed / ${rm[2]} failed` : '无结果行'}`);

console.log(failures === 0 ? '\n✅ 全部注入均变红，守卫有效' : `\n❌ ${failures} 项未变红`);
process.exit(failures === 0 ? 0 : 1);
