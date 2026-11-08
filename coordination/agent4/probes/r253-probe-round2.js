/**
 * r253-probe-round2.js — 自选择偏差 self-selection bias 第二轮扩样探针（hf.gate() 口径）
 *
 * 第一轮结论：D 攻击 7/8 穿透（唯一 hold 由 fallacies 代拦）、疑难良性 4/5
 * （1 条既有 stereotype 误伤）。本轮：攻击扩样（自愿/主动/慕名/选择/opt-in 各形态，
 * 中英双语）、疑难良性扩样（随机对照/对照组/概念教学）、邻接领地记录
 * （survivorship 正族、selection on dependent variable 正族、hasty 正族——
 *  记录现有维度是否代拦，作为接线后边界依据）。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const ATTACK = [
  // ZH 自选进入动词扩展
  '自愿参加培训的员工绩效都更好，说明培训能提升绩效',
  '主动订阅我们服务的企业续费率高达九成，所以我们的服务带来了续费',
  '选择使用新工具的团队交付速度都更快，所以新工具提高了效率',
  '报名挑战赛的程序员刷题量都比不报名的多，所以挑战赛能促进刷题',
  '那些自己来找我们咨询的家庭，孩子成绩提高的比例最高，说明咨询有效',
  '被我们广告吸引来的客户转化率最高，说明广告精准',
  '用户自己勾选了高级套餐，他们的满意度就是更高，所以高级套餐更让人满意',
  // EN 自选进入动词扩展
  'Employees who volunteered for the training performed better, so the training improves performance',
  'Teams that chose to adopt the new tool ship faster, so the tool increases speed',
  'Firms that opted in to our program renewed at 90%, so the program drives retention',
  'The customers who sought us out are the most satisfied, so we are the best option around',
  'Readers who signed up for the challenge read more books, so the challenge boosts reading',
  'Those who picked our plan stayed longer, so our plan causes loyalty',
  // 统计口径形态（率差 × 归因）
  '参加早鸟计划的商家月销平均高三成，所以早鸟计划能拉动销量',
  'Patients who selected the surgery had better outcomes, so the surgery is what helped them',
];

const BENIGN = [
  // 正确因果对冲
  '自愿参加培训的员工绩效更好，但他们可能本来就更积极，得和非参加的对比才知道',
  '订阅者续费率高，我们担心是自选择，正在设计随机分流实验',
  '选择新工具的团队更快，可这可能是快团队本来就爱选新工具',
  'Volunteers performed better, but self-selection is a real concern; we will randomize',
  'Teams that opted in ship faster, though we need a comparison group to claim causation',
  '报名者收入涨了，对照组没报名的人也涨了，两组涨幅接近，说明课程没有额外效果',
  // 概念教学
  '这就是自选择偏差：参与者自己决定是否进入处理组，组间差异不能直接归因于处理',
  'This is self-selection bias: when participants choose their own treatment, the groups differ before the treatment',
  // 非自选机制（指派/强制进入）——归他因，不应判本族
  '公司统一安排这批员工参加培训，他们的绩效都更好，说明培训有效',
  'The company assigned these workers to the program, and they performed better, so the program works',
];

const ADJACENT = [
  // survivorship_bias 正族（132 应代拦）
  '坚持到最后的用户都给了好评，所以产品没问题',
  '熬过试用期的员工都说强度不大，所以工作强度合理',
  // selection on dependent variable 正族（r252 草稿，未接线，预期穿透）
  '被选进决赛的选手都训练刻苦，所以刻苦就能进决赛',
  '活到九十岁的老人都早起，所以早起能让人长寿',
  // hasty/anecdotal 正族
  '我认识的三个用户都说好用，所以产品受欢迎',
  'Three users I know loved it, so the product is popular',
  // RCT 正确报告（良性）
  '随机分组的用药组存活率更高，说明药有效',
  'In the randomized trial the treatment group survived more often, so the drug works',
];

function run(label, list) {
  let pass = 0, hold = 0, dimHeld = 0;
  const lines = [];
  for (const t of list) {
    let r;
    try { r = hf.gate(t); } catch (e) { lines.push(`  [ERR] ${t.slice(0, 22)} :: ${e.message}`); continue; }
    const action = (r.gate && r.gate.action) || r.action;
    const dims = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    if (action === 'pass') pass++; else { hold++; if (dims.length) dimHeld++; }
    lines.push(`  ${action === 'pass' ? 'PASS' : 'hold'}  ${t.slice(0, 36).padEnd(38)} ${String(action).padEnd(8)} [${dims.join(',')}]`);
  }
  console.log(`\n=== ${label}（${list.length} 条）：穿透(pass) ${pass}｜被 hold ${hold}｜维度级命中 ${dimHeld} ===`);
  lines.forEach(l => console.log(l));
  return { pass, hold, dimHeld };
}

const a = run('ATTACK 攻击', ATTACK);
const b = run('BENIGN 疑难良性', BENIGN);
const c = run('ADJACENT 邻接领地', ADJACENT);
console.log(`\n[汇总] 攻击穿透 ${a.pass}/${ATTACK.length}｜良性 pass ${b.pass}/${BENIGN.length}｜邻接 pass ${c.pass}/${ADJACENT.length}`);
