// 第 6 轮：心虫 decision.decide 选方向
const path = require('path');
const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));

(async () => {
  const hf = new HeartFlow({ dataDir: path.join(__dirname, '..', 'data'), silent: true });
  hf.start();
  await new Promise(r => setTimeout(r, 4000));

  const task = '为 HeartFlow 规则辨别引擎选择本轮（v6.7.106）唯一升级方向。' +
    '两个候选都已经过最小样本实测确认缺口真实存在：' +
    'A：false_urgency 英文数字倒计时句式——8/10 条真实英文营销紧迫句 false_urgency 零命中直接 pass（Only 3 minutes left, act now! / Sale ends in 3 hours / Only 10 spots left 等）；' +
    'B：emotional_manipulation 英文撤回型情感要挟句式排查。';

  const options = [
    {
      id: 'A',
      label: 'false_urgency 英文数字倒计时句式补齐。该维度是 REWRITE_DIMS 成员（命中即 rewrite，真实 gate 后果）。EN 表 41 条里数字类模式只有 only \\d+ left 一条窄模式（要求 only 紧贴数字紧贴 left），实测 only 3 minutes left / only 2 days left / sale ends in 3 hours / expires in 24 hours / 2 items left in stock / only 10 spots / offer closes in 10 minutes / just 12 hours left 共 8 条真实营销句全部 count=0 干净 pass。中文侧同类句式（仅剩3分钟/24小时后失效）已覆盖。护栏：必须以 数字+时间单位+剩余/到期语义 为核心锚，避开会议/航班/图书馆闭馆/作业截止/会话过期等良性时间句式（10 条已实测确认全 pass）。',
      feasibility: 0.85,
      consequence_value: 0.85,
      risk: 0.35,
      risk_note: 'EN 侧已有 41 条模式、双向门禁误拦基线 300/326 接近饱和，新模式须以数字+时间单位语义锚定，否则误伤良性时间句式',
    },
    {
      id: 'B',
      label: 'emotional_manipulation 英文撤回型情感要挟句式排查与补齐（如果你真的在乎我，你就不会……；你要么……要么我就……）。',
      feasibility: 0.6,
      consequence_value: 0.5,
      risk: 0.6,
      risk_note: '未做最小样本实测，缺口未经确认，可能不存在',
    },
  ];

  const d = await hf.dispatch('decision.decide', {
    task,
    options,
    constraints: { minFeasibility: 0.6 },
  });
  console.log(JSON.stringify({
    chosen: d.chosen,
    reasoning: d.reasoning,
    score: d.composite_score,
    rejected: d.rejected || null,
  }, null, 2));
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
