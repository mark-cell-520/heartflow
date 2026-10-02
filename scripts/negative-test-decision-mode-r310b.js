// 注入③为什么不变红：pick_best 尾部 c = base 的硬覆盖会把 ratioBonus 抹掉，
// 所以那条 path 实际不可观测。真正该钉的是「ratioBonus 不并入」的可观测后果。
// 结论：把注入③换成可观测的等价缺陷 —— pick_biggest_gap 态把 ratioBonus 删掉
// （r99 契约直接崩），以及 pick_best 的达成度公式用错极性（1-gap → gap）。
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = path.resolve('/root/.hermes/skills/ai/mark-heartflow-skill');
const SRC = path.join(REPO, 'src/core/decision.js');
const TEST = path.join(REPO, 'test/decision-mode-round310.test.js');

const cases = [
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
];

const orig = fs.readFileSync(SRC, 'utf8');
let failures = 0;

for (const c of cases) {
  if (!orig.includes(c.from)) {
    console.log(`⚠️  ${c.name}：锚点未找到`);
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
  console.log(`${red ? '✅' : '❌'} ${c.name}：${m ? `${m[1]} passed / ${m[2]} failed` : '未产出结果行'}`);
  if (!red) failures++;
}

fs.writeFileSync(SRC, orig);
try {
  const okOut = execFileSync('node', [TEST], { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const m = okOut.match(/总计:\s*(\d+)\s*passed\s*\/\s*(\d+)\s*failed/);
  console.log(`还原后复验：${m ? `${m[1]} passed / ${m[2]} failed` : '无结果行'}`);
} catch (e) {
  const m = ((e.stdout || '') + (e.stderr || '')).match(/总计:\s*(\d+)\s*passed\s*\/\s*(\d+)\s*failed/);
  console.log(`还原后复验：${m ? `${m[1]} passed / ${m[2]} failed` : '无结果行'}`);
  failures++;
}
console.log(failures === 0 ? '\n✅ 全部变红，守卫有效' : `\n❌ ${failures} 项问题`);
process.exit(failures === 0 ? 0 : 1);
