/**
 * r253-dryrun.js — 自选择偏差模块干跑（攻击 / 疑难良性 / 邻接领地 / 官方良性语料）
 */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const { detectSelfSelectionBias } = require(path.join(ROOT, 'src', 'self-selection-bias.js'));

const ATTACK = [
  // 双腿型 ZH
  '自愿参加培训的员工绩效都更好，说明培训能提升绩效',
  '主动订阅我们服务的企业续费率高达九成，所以我们的服务带来了续费',
  '选择使用新工具的团队交付速度都更快，所以新工具提高了效率',
  '报名挑战赛的程序员刷题量都比不报名的多，所以挑战赛能促进刷题',
  '那些自己来找我们咨询的家庭，孩子成绩提高的比例最高，说明咨询有效',
  '被我们广告吸引来的客户转化率最高，说明广告精准',
  '用户自己勾选了高级套餐，他们的满意度就是更高，所以高级套餐更让人满意',
  '参加早鸟计划的商家月销平均高三成，所以早鸟计划能拉动销量',
  // 双腿型 EN
  'Employees who volunteered for the training performed better, so the training improves performance',
  'Teams that chose to adopt the new tool ship faster, so the tool increases speed',
  'Firms that opted in to our program renewed at 90%, so the program drives retention',
  'The customers who sought us out are the most satisfied, so we are the best option around',
  'Readers who signed up for the challenge read more books, so the challenge boosts reading',
  'Those who picked our plan stayed longer, so our plan causes loyalty',
  'Patients who selected the surgery had better outcomes, so the surgery is what helped them',
  // round1 D 组
  '报名我们课程的同学收入都涨了，所以课程有效',
  '来我们医院看病的患者术后恢复都不错，说明我们医术好',
  '用我们App的用户留存率很高，说明产品设计得成功',
  '订阅了newsletter的读者购买率是不订阅的三倍，说明newsletter促进购买',
  'Students who enrolled in our course all saw income growth, so the course works',
  'Patients who chose our hospital recovered well, which proves our treatment is superior',
  'Readers who subscribed to the newsletter buy three times more, so the newsletter drives purchases',
  // 独腿签名
  '报名我们课程的人都反馈有用',
  '自愿参加的人留下来的都认可这个项目',
  '报了名的人都没有中途退出',
  'Participants who chose the program overwhelmingly reported it works',
  'Those who signed up stayed because they valued it',
  'Nobody who signed up regrets it',
];

const BENIGN = [
  '自愿参加培训的员工绩效更好，但他们可能本来就更积极，得和非参加的对比才知道',
  '订阅者续费率高，我们担心是自选择，正在设计随机分流实验',
  '选择新工具的团队更快，可这可能是快团队本来就爱选新工具',
  'Volunteers performed better, but self-selection is a real concern; we will randomize',
  'Teams that opted in ship faster, though we need a comparison group to claim causation',
  '报名者收入涨了，对照组没报名的人也涨了，两组涨幅接近，说明课程没有额外效果',
  '这就是自选择偏差：参与者自己决定是否进入处理组，组间差异不能直接归因于处理',
  'This is self-selection bias: when participants choose their own treatment, the groups differ before the treatment',
  '公司统一安排这批员工参加培训，他们的绩效都更好，说明培训有效',
  'The company assigned these workers to the program, and they performed better, so the program works',
  // 单腿句 / 纯事实
  '自愿参加培训的员工绩效都更好',
  '报名我们课程的同学收入都涨了',
  '课程有效，用得上的学员都说好',
  'Employees who volunteered for the training performed better',
  // 相关非归因
  '报名的人更努力，所以成绩更好',
  // 指派/结果条件（他族领地）
  '被选进决赛的选手都训练刻苦，所以刻苦就能进决赛',
  '活到九十岁的老人都早起，所以早起能让人长寿',
  '坚持到最后的用户都给了好评，所以产品没问题',
  '随机分组的用药组存活率更高，说明药有效',
  'In the randomized trial the treatment group survived more often, so the drug works',
];

function run(label, list) {
  let hits = 0;
  const lines = [];
  for (const t of list) {
    const r = detectSelfSelectionBias(t);
    if (r.hit) hits++;
    lines.push(`  ${r.hit ? 'HIT ' : 'pass'}  ${t.slice(0, 40).padEnd(42)} n=${r.count || 0} ${r.hit ? r.details.slice(0, 60) : ''}`);
  }
  console.log(`\n=== ${label}（${list.length} 条）：命中 ${hits} ===`);
  lines.forEach(l => console.log(l));
  return hits;
}

let bad = 0;
bad += run('ATTACK 攻击', ATTACK);
bad += run('BENIGN 良性（应全 pass）', BENIGN) === BENIGN.length ? 1 : 0;

// 官方良性语料
const corpora = [];
const push = (src, t) => { if (typeof t === 'string' && t.trim()) corpora.push({ src, text: t }); };
const pick = (it) => (typeof it === 'string' ? it : (it && typeof it === 'object' ? (it.text || it.sample || it.input || it.prompt || it.content) : null));
const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
for (const [cat, arr] of Object.entries(gb.SAMPLES || {})) if (Array.isArray(arr)) for (const it of arr) push('gb:' + cat, pick(it));
const ext = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
for (const [k, v] of Object.entries(ext)) if (Array.isArray(v)) for (const it of v) push('ext:' + k, pick(it));
const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
for (const [cat, arr] of Object.entries(vb.CATEGORIES || {})) if (Array.isArray(arr)) for (const it of arr) push('vert:' + cat, pick(it));
const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
for (const [k, v] of Object.entries(bm)) if (Array.isArray(v)) for (const it of v) push('mixed:' + k, pick(it));
let corpusHits = 0;
for (const c of corpora) if (detectSelfSelectionBias(c.text).hit) { corpusHits++; console.log(`  [误命中] (${c.src}) ${c.text.slice(0, 100)}`); }
console.log(`\n=== 官方良性语料 ${corpora.length} 条：误命中 ${corpusHits} ===`);

console.log(`\n[汇总] 攻击命中 ${ATTACK.length - (run('', []) || 0)} 占位`);
console.log(`攻击应命中 ${ATTACK.length}｜良性误伤 ${BENIGN.filter(t => detectSelfSelectionBias(t).hit).length}｜语料误命中 ${corpusHits}`);
