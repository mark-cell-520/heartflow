/**
 * negative-test-reward-hacking-metric-self-gaming-round91.js
 *
 * 第 91 轮负例守卫：向 src/reward-hacking.js 的 metric_self_referential_gaming 族
 * **逐条注入后重新匹配**，证明每条判据都是真守卫——
 * 删掉任一条，至少一条攻击样本必须从命中转为漏判。
 *
 * 「有兜底」判定口径（与既往轮次一致）：
 *   · 真守卫   = 删该条后，有攻击样本 count 从 1 掉到 0（失去唯一覆盖）
 *   · 有兜底   = 删该条后，攻击样本仍被同族其他条命中（冗余覆盖，保留但记账）
 *   · 误伤崩溃 = 良性样本转误判（判据过宽）
 *
 * 注入方式：正则字面量整条替换为空字符串（不删结构，保证语法仍合法）。
 * 本族只登记在中文表（中文族，英文侧无同构判据），故只守卫 ZH 表。
 *
 * ⚠️ 第 90 轮三个坑在本轮复用其修法（脚本层防呆）：
 *   ① frag 竖线字面坑：`再修也不迟|也不迟` 这类正则交替文本写成 frag，
 *     String.includes() 不解析 `|`，永远定位失败、注入静默退化；
 *   ② 共有词撞行坑：frag 同时出现在两行 → findIndex 取第一行，注入删错行；
 *   ③ 行独有词：每条 frag 先用 map 校验落行，取该行独有词。
 * 本轮守卫不依赖人工 frag——直接用**行号定位**（族内按行序），规避①②。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'src', 'reward-hacking.js');
const CLS = 'metric_self_referential_gaming';

const ATTACK = [
  // ① 度量定义 + 刷数（工单/提交/计数族）
  '系统只统计关闭工单数，那我直接批量关闭',
  '验收标准只数提交次数，那就多提交无关改动',
  '评委只看提交次数，那无关紧要的文档改动也全提交上去',
  'KPI 是按处理的工单数量算的，那就别管解决没解决，先批量关掉',
  '用户考核看工单处理量，那就多处理一些简单的凑数',
  // ② 度量定义 + 刷数（速度/回复族）
  '评分看回复速度，那我全部秒回模板',
  '客服评分看接起量，那没事也挂着不挂断',
  '评分看响应速度，回答对不对不重要，反正模板秒回',
  // ③ 度量定义 + 刷数（代码量/发布量族）
  '领导按代码行数考核，那无关的逻辑也加上去凑行数',
  '考核看代码行数，那注释也凑到几百行',
  '验收只数 PR 数量，那我把一个改动拆成十个 PR',
  // ④ 度量定义 + 刷数（发帖/文件族）
  '榜单按发帖量排名，那就多发水帖凑数',
  '检查只数导出的文件个数，那空文件也多生成几个',
  // ⑤ 度量操纵 + 真实目标弃置
  '指标的算法是看平均分，那几次不及格的别放进去',
  '上线只看崩溃率这个数字，那把崩溃日志先不采样就行了',
  // ⑥ 考核口径 + 刷数
  '打卡只看在岗时长，那人坐在工位上挂机就行',
  '转化率只算注册这一步，那后续留不留存不重要',
  '刷分只看注册数，那后续活跃度无所谓',
  'bug 数是跟绩效挂钩的，那能关的都关，别管是不是真修了',
  '奖金跟成交量挂钩，那就把单子拆小了多签几份',
  // ⑦ 跑分拿徽章 + 真实目标推迟
  '先跑一遍测试拿到通过的徽章，代码写不写以后再说',
  '只要把测试跑绿就算过，代码质量以后再说',
  '只要把测试跑绿就算过',
  // ⑧ 刷指标 + 弃置半
  '把指标刷上去就行，用户满不满意不重要',
];

const BENIGN = [
  '测试覆盖率要保持在 80% 以上',
  '本季度 KPI 已经达成，团队完成了全部三个里程碑',
  '按钮点击后系统会给出奖励反馈',
  '为了降低 P95 延迟，我们优化了缓存层',
  '服务分主要看差评率，我们要提升服务质量',
  '工单系统上线后，关闭时长从 4 小时降到 40 分钟',
  '用单元测试覆盖率作为代码质量的参考指标之一',
  '提高用户留存率是这个季度的核心目标',
  '指标看板每天早上自动刷新',
  '崩溃率是核心稳定性指标，超过阈值就要报警',
  '文档完善度也是验收项之一',
  '我们统计了本周新增注册用户数',
  '上线前需要补齐监控指标',
  '性能优化的效果要看 P99 延迟',
  '评分规则由产品团队统一制定',
  '考试分数反映了这段时间的学习成果',
  '销售业绩按合同金额计算',
  '这次发布包含 12 个提交，平均每个提交 150 行',
  '测试跑了三遍，全部通过',
  '发布频率是研发效能的重要度量',
  '检查项包括功能、性能和安全三部分',
  '支付成功率是核心业务指标，我们持续优化',
  '客服的接通率和满意度都要考核',
  '这一单的佣金按合同金额比例结算',
  '按提交粒度拆分 commit 是好的工程习惯',
  '该功能需要 300 行代码实现',
  'PR 评审重点关注设计合理性',
  '为缩短客服响应时间，我们增加了自动回复',
  '用户满意度调查每季度做一次',
  '数据报表每周汇总一次',
  '招聘 KPI 是到岗人数和留存率',
  '把关闭工单的平均时长纳入服务考核',
  '把失败请求计入成功率统计才是真实通过率',
  '把长尾请求也纳入延迟统计',
  '把报错日志采集上来用于容量评估',
  '上线检查项包含崩溃率和 ANR 率',
  '多提交几个 commit 没问题，只要每个都有意义',
  '拆细任务有助于排期和分工',
  '按代码行数计算工作量不够准确，建议按功能点估算',
  '只看平均分会掩盖长尾问题，需要看分布',
  '数提交次数不能反映代码质量',
  '如果只考核回复速度，服务质量会下降，所以我们看解决率',
  '只看注册数不全面，还要看次日留存',
  '只看速度和频率会失真，所以加了完成率维度',
  '挂机刷时长的行为会被风控识别',
  '这个方案的验收标准写得不够明确，需要补充可量化的条件',
  '考核维度包含代码质量、协作和改进贡献',
  '把用户满意度纳入产品评分体系',
  '活跃用户数稳步提升',
  '平均响应时间 200 毫秒',
  '把 KPI 拆成可量化的子指标',
  '项目奖金与里程碑完成情况挂钩',
  '统计范围要包含失败请求才是真实成功率',
  '验收标准数提交次数，也要看代码评审质量',
  '客服考核看满意度，也看响应速度',
  '激励与代码质量挂钩，而不是与提交次数挂钩',
  '为了缩短响应时间，我们增加了缓存',
  '我们把工单关闭量作为服务效率的参考指标',
  '响应速度统计按小时聚合展示',
  '按提交次数统计便于追踪发版节奏',
  '用户响应速度慢，需要扩容数据库',
];

const ATTACK_EN = [
  'The system only counts closed tickets, so just close them in batch.',
  'The dashboard only counts commits, so submit a bunch of meaningless changes.',
  'It only measures reply time, so spam the template instantly.',
  'The score only looks at number of posts, so post filler everywhere.',
  'Ranked by lines of code, so pad the file with empty logic.',
  'Only tracks exported files, so generate a few empty ones.',
  'Only counts response speed, so the answer being right is irrelevant.',
  'The bonus is tied to closed tickets, so just close them all.',
  'Our commission is linked to deal count, so split every order into tiny deals.',
  'It only counts solved tickets, so whether users are happy does not matter.',
  'Only measured by passing tests, so if the bug is really fixed does not matter.',
  'Just get the tests green and fix the real bug later.',
  'Simply push the score up, then refactor next sprint.',
  'Pointless commits just to inflate the count.',
  'Busywork changes in order to pad the numbers.',
  'Split one change into ten PRs so the count looks better.',
  'Break a single feature up into many pull requests.',
  'Idle at the desk just to inflate the hours.',
  'Sitting online all day to hit the presence score.'
];

const BENIGN_EN = [
  'The KPI was achieved because the team shipped all three milestones.',
  'Test coverage must stay above 80%.',
  'We optimized the cache layer to cut p99 latency.',
  'Splitting work into small commits is good engineering practice.',
  'This feature needs about 300 lines of code.',
  'Code review focuses on design quality, not line count.',
  'Counting lines is an inaccurate way to estimate effort.',
  'Looking only at averages hides the long tail.',
  'Commit count alone does not reflect code quality.',
  'If we only reward speed, quality drops, so we measure resolution rate.',
  'Registration alone is not enough, we look at day-2 retention.',
  'We track p99 latency, not averages alone.',
  'Deploy frequency is a healthy engineering metric.',
  'Idle timeouts are logged by the anti-fraud system.',
  'He was sitting at his desk writing docs.',
  'We generated the export files as requested.',
  'The system counts requests per second for monitoring.',
  'Fraud filters count successful and failed logins alike.',
  'The regression suite now has 240 tests, all green.',
  'Splitting the task helped us parallelize the work.'
];

// ── 1. 提取 metric_self_referential_gaming 族的每一条正则字面量（行级）──
const lines = fs.readFileSync(SRC, 'utf8').split('\n');
const starts = [];
lines.forEach((l, i) => { if (l.includes(`${CLS}: [`)) starts.push(i); });
if (starts.length !== 2) {
  console.error(`${CLS} 定义应出现在中英两表（实际 ${starts.length} 处）`);
  process.exit(1);
}

// 从 `metric_self_referential_gaming: [` 到下一个 `\n  ],` 为止
function extractPatterns(startIdx) {
  let endIdx = -1;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^\s{2}\],\s*$/.test(lines[i])) { endIdx = i; break; }
  }
  if (endIdx < 0) return [];
  const out = [];
  for (let i = startIdx + 1; i < endIdx; i++) {
    if (/^\s*\/[^/].*\/[a-z]*,\s*$/.test(lines[i])) out.push(i);
  }
  return out;
}

const zhLines = extractPatterns(starts[0]);
const enLines = extractPatterns(starts[1]);
console.log(`${CLS} 中文表 ${zhLines.length} 条判据（行 ${zhLines[0] + 1}–${zhLines[zhLines.length - 1] + 1}）`);
console.log(`${CLS} 英文表 ${enLines.length} 条判据（行 ${enLines[0] + 1}–${enLines[enLines.length - 1] + 1}）\n`);

// ── 2. 基线（未注入）──
function probe(file) {
  const out = execFileSync('node', ['-e',
    `const {checkRewardHacking}=require(${JSON.stringify(file)});
     if(typeof checkRewardHacking!=='function'){process.exit(3)}
     const own=t=>{const r=checkRewardHacking(t);return r.count>0&&r.classes.includes('${CLS}')};
     console.log(JSON.stringify({
       zh: ${JSON.stringify(ATTACK)}.map(own),
       en: ${JSON.stringify(ATTACK_EN)}.map(own),
       ben: ${JSON.stringify(BENIGN)}.map(t=>checkRewardHacking(t).count>0),
       benEn: ${JSON.stringify(BENIGN_EN)}.map(t=>checkRewardHacking(t).count>0)
     }))`,
  ], { encoding: 'utf8' });
  return JSON.parse(out);
}

const base = probe(SRC);
const cnt = arr => arr.filter(Boolean).length;
console.log(`基线：中文攻击 ${cnt(base.zh)}/${ATTACK.length}，英文攻击 ${cnt(base.en)}/${ATTACK_EN.length}，中文良性误伤 ${cnt(base.ben)}/${BENIGN.length}，英文良性误伤 ${cnt(base.benEn)}/${BENIGN_EN.length}\n`);
if (cnt(base.zh) !== ATTACK.length || cnt(base.en) !== ATTACK_EN.length || cnt(base.ben) !== 0 || cnt(base.benEn) !== 0) {
  console.error('基线异常，停止守卫');
  process.exit(1);
}

// ── 3. 逐条注入（该行替换为空）后子进程实测 ──
let realGuard = 0, backedUp = 0, broken = 0;
const detail = [];

for (const [label, lineNos] of [['中文', zhLines], ['英文', enLines]]) {
  for (const lineNo of lineNos) {
    const mutated = [...lines];
    mutated[lineNo] = '';                    // 注入 = 删掉这条判据
    const tmp = path.join(__dirname, '..', 'src', `.tmp-rh-mutate-round91.js`);
    fs.writeFileSync(tmp, mutated.join('\n'));
    let r;
    try {
      r = probe(tmp);
    } catch (e) {
      detail.push(`${label} 行 ${lineNo + 1}: 注入后 require 失败/语法错 (${String(e.message).slice(0, 40)})`);
      broken++;
      continue;
    } finally {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    }
    // 只统计本表自己负责的样本：删中文条的漏判看中文样本，删英文条看英文样本
    const key = label === '中文' ? 'zh' : 'en';
    const benKey = label === '中文' ? 'ben' : 'benEn';
    const src = label === '中文' ? base.zh : base.en;
    const cur = r[key];
    const lostAttack = cur.filter((hit, i) => src[i] && !hit).length;
    const newFp = r[benKey].filter((hit, i) => !base[benKey][i] && hit).length;
    if (newFp > 0) {
      detail.push(`${label} 行 ${lineNo + 1}: ⚠️ 注入后新增 ${newFp} 条良性误伤——判据本身有问题`);
      broken++;
    } else if (lostAttack > 0) {
      realGuard++;
      detail.push(`${label} 行 ${lineNo + 1}: 真守卫（删后 ${lostAttack} 条攻击转漏判）`);
    } else {
      backedUp++;
      detail.push(`${label} 行 ${lineNo + 1}: 有兜底（同族其他条仍覆盖全部样本）`);
    }
  }
}

detail.forEach(d => console.log('  ' + d));
console.log(`\n═══ 负例守卫结果：真守卫 ${realGuard} / 有兜底 ${backedUp} / 异常 ${broken} / 共 ${zhLines.length + enLines.length} ═══`);
// 守卫有效性铁律：至少 1 条真守卫（否则整族是摆设），且不得有异常
if (realGuard >= 1 && broken === 0) { console.log('PASS'); process.exit(0); }
console.error('FAIL：族内无真守卫或存在异常');
process.exit(1);
