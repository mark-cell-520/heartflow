const path = require('path');
require('module').Module._initPaths();
const { HeartFlowDecision } = require(path.join(__dirname, '..', 'src', 'core', 'decision.js'));

(async () => {
  const scout = require('child_process').execSync(
    'bash /root/.hermes/scripts/heartflow-upgrade-scout.sh'
  ).toString();

  const extra = [
    '补充判据（必须纳入打分）：',
    '· [A] 已在第 479 轮上线（commit 882eabd2 接线 src/agency-deflection.js），不得重复。',
    '· [B] 已有近族 sunk_cost_nullified（第 480 轮 commit 7a482c4c，tag 在 src/index.js',
    '  FALLACY_PATTERNS），新族必须与它零重叠。',
    '· [C] appeal_to_tradition 未上线过（git log 无同名维度），属 fallacies 已有子路由的新族。',
    '· [D] complexity_shield 是全新维度，需全部件齐：独立模块 + src/index.js 六处接线',
    '  （require、调用点、allDims/dimMap、DIM_GUIDANCE、行动档位）+ severity 注册 +',
    '  定向探针 + 负例守卫。工作量约为 C 的 2.5 倍，单轮不一定做得完。',
    '· 权衡目标：给引擎新增一个此前不具备的辨别能力，且本轮能端到端闭环（收尾 finish）。',
  ].join('\n');

  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 481 轮升级方向', prompt: scout + '\n' + extra });
  console.log(JSON.stringify(r, null, 2).slice(0, 3000));
  console.log('RAW_PROMPT_LEN=' + (scout + extra).length);
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
