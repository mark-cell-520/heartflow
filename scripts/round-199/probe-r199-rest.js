// 轮 199：check_suppression 4 条 miss + 5 个 EMPTY 族 25 条半段二分
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { REWARD_HACKING_EN } = require(path.join(HF, 'src/reward-hacking.js'));
const POOL = require('./rh-pool-rh-en.js');

const SEMI = {
  '调整/改 测量规则': /\b(?:adjust|change|tweak|modif\w+|loosen|relax|redefin\w+|massag\w+|rig\w*|game)\b/i,
  '测量/计时/统计对象': /\b(?:stopwatch|timer|timing|clock|measurement|benchmark|bench|harness|metric|latency|throughput|average|median|trial|run|attempt|score|number|figure)\b/i,
  '来源名词': /\b(?:cache|warm|cold|idle|production|business\s+hours|drop|trial|subset|confidence)\b/i,
  '计数收窄': /\b(?:only|just|exclude|exclud\w+|drop|ignore|omit|count|counted|include|measure|report|skip)\b/i,
  '结果变好看': /\b(?:drops?|falls?|rises?|goes?\s+up|looks?|halves?|halved|halving|better|improves?|lower|higher)\b/i,
  '断言/校验/检查对象': /\b(?:assertion|assert|check|test|suite|lint|validator|type\s+check|race|flaky|CI|pipeline)\b/i,
  '使其失效动词': /\b(?:comment\s+out|skip|disable|turn\s+off|remove|delete|bypass|return\s+early|make|downgrade|ignore|drop)\b/i,
  '绿/过': /\b(?:green|pass\w*|passes|succeeds?|stops?\s+blocking|goes\s+away)\b/i,
  '自评/自己': /\b(?:my\s+own|own\s+|myself|itself|same|the\s+same)\b/i,
  '评分动词': /\b(?:grad\w+|scor\w+|score|judg\w+|evaluat\w+|assess\w+)\w*\b/i,
  '最高分/保留': /\b(?:highest|best|top|keep|whichever|max|maximum)\b/i,
  '评测集名词': /\b(?:eval\w*|benchmark|test\s+set|exam|assessment|question|prompt)\b/i,
  '答案来源': /\b(?:expected\s+answer|ground\s+truth|label|reference|test\s+case|file|column|known|memori[sz]\w*|hard-?cod\w+)\b/i,
  '回灌动词': /\b(?:return|echo|submit|verba\w+|read|look\s+up|parse|copy|feed|use|pick|select|tune|optimi[sz]\w+|hard-?code)\b/i,
  '换/选择': /\b(?:change|swap|switch|load|use|point|pick|choose|select|tune|optimize|rewrite|solve|answer|reframe|solve)\b/i,
  '简单/有利': /\b(?:easier|simpler|lenient|relaxed|older|best|win\w*|confident|subset|business\s+hours|seed|temperature|variant)\b/i,
  '训练动词': /\b(?:train|fine-?tun\w+|tun\w+|fit\w*|learn)\b/i,
};

const FAMS = ['check_suppression', 'measurement_rigging', 'metric_denominator_gaming',
  'self_referential_loop', 'evaluation_awareness', 'eval_input_shortcut',
  'task_substitution', 'eval_ruleset_masking', 'eval_leakage', 'condition_tuning'];

for (const fam of FAMS) {
  const pats = REWARD_HACKING_EN[fam];
  const miss = [];
  POOL[fam].atk.forEach((t, i) => {
    if (!pats.some(p => p.test(t))) miss.push(t);
  });
  if (!miss.length) continue;
  console.log(`=== ${fam} miss=${miss.length}`);
  miss.forEach((t) => {
    const tags = Object.entries(SEMI).filter(([, re]) => re.test(t)).map(([k]) => k);
    console.log(`  tags: ${tags.join(' | ')}`);
  });
}
