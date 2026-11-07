/**
 * r249-module-dryrun.js — 模块层干跑（src/count-rate-conflation.js）
 * 四组：攻击（中英）/ 疑难良性 + FP 压力 / 邻接领地 / 官方良性语料 272 条
 */
const path = require('path');
const hf = require('/data/home/heartflow/src/gate.js');
const M = require('/data/home/heartflow/src/count-rate-conflation.js');
const detect = M.detectCountRateConflation;
const ROOT = '/data/home/heartflow';

const ATTACK = [
  // 中文 病例/疫情
  '我们市癌症病例全国第一，所以这里最不安全',
  '邻省传染病病例是我们的三倍，他们防疫做得更差',
  '这个城市新冠确诊数是邻市的两倍，防疫明显更差',
  '本省交通事故起数比邻省多四成，司机开车更野',
  '这家医院死在手术台上的人最多，说明他们技术最差',
  '这条高速事故最多，显然设计有问题',
  '投诉量全网第一，这家店服务肯定最糟',
  '我校竞赛获奖数是邻校的两倍，所以我们的教育更强',
  '这个系挂科人数全校第一，老师教得最烂',
  '这家店外卖单量是街角那家的五倍，味道肯定更好',
  '他们厂工伤人数比去年多了一倍，说明车间更危险了',
  '本店差评量是同行的三倍，我们的产品明显更差',
  '该市感染人数居首，可见这里医疗水平最差',
  '邻国死亡人数是我们的四倍，他们的防疫更糟',
  '该校名校录取人数第一，说明师资最强',
  // 英文
  'Our city has the most cancer cases in the country, so it is the most dangerous place',
  'This city reported twice the cases, so its containment is clearly worse',
  'Our school won twice the prizes, so our education is stronger',
  'This shop takes five times the delivery orders, so its food must be better',
  'The province logged 40% more crashes, so its drivers are more reckless',
  'This hospital has the most surgical deaths, so their technique must be the worst',
  'Their plant recorded double the injuries, so the workshop is more dangerous',
  'Our department has the most failures in the school, so the teaching is the worst',
  'That country reports four times the deaths, so its healthcare is worse',
  'The brand with the most complaints must make the worst products',
  'Our college leads in admissions, so our faculty is the strongest',
  'This airline had the most incidents, so it is the least safe',
];

const BENIGN = [
  // 带分母的正当比较
  '病例总数第一，但按人口算发病率只排在中游，要看率不能看数',
  '手术例数越多的医院死亡绝对数自然高，得比较死亡率',
  '确诊数是两倍，可人口是我们的四倍，发病率反而更低',
  '投诉量第一，但我们用户基数是人家的十倍，投诉率最低',
  '获奖数是两倍，可我们考生人数是人家的五倍，获奖率并不高',
  '外卖单量五倍，可我们店开在商圈，客流本来就不是一个量级',
  '工伤人数多了一倍，但产量也翻了两倍，万人负伤率其实降了',
  '挂科人数第一，但我们系人数也是最多的，挂科率并不高',
  '差评量三倍，可我们的出货量是人家二十倍，差评率最低',
  '事故起数多四成，可我们的运营里程是对方两倍，事故率更低',
  '病例总数第一，但那是人口大市，每万人发病率只排第十二',
  'The raw count is highest, but per capita the rate is only mid-pack',
  'Twice the cases on four times the population means a lower incidence rate',
  'Twice the prizes on five times the candidates means a lower win rate',
  'Five times the orders, but also ten times the foot traffic, so the rate is lower',
  'Forty percent more crashes on twice the mileage means a lower crash rate',
  'Twice the complaints, but our user base is twenty times larger, so the complaint rate is lowest',
  'The most admissions, but also the largest applicant pool, so the admit rate is middling',
  'Absolute counts are not comparable without normalising by population',
  'Raw counts are not comparable until you normalise them by exposure',
  // 概念教学
  '总数不等于比率，除以人口或暴露量才是可比的口径',
  '计数和比率要分清，原始计数不能直接排名',
  'The report gives only the raw count and omits the per-capita rate',
  'Raw counts are not comparable until you divide by exposure',
  // 单腿 / 纯事实计数
  '我们市癌症病例全国第一',
  '今年病例数比去年多，需要增加门诊人力',
  '这家店外卖单量是街角那家的五倍',
  '病例数创了新高，防疫部门正在排查',
  'Their city reported the most cases this quarter',
  'Complaint volume rose after the price change',
  // 反向/否定
  '病例数并不是最多的，别急着下结论',
  'Our city does not have the most cases, so the safety ranking is unfair',
];

const ADJACENT = [
  // statistical_misleading 领地
  '只挑好看的月份画图，全年的波动被藏起来了',
  '这份报告用绝对数吓人，换成比率就平平无奇',
  '基数太小，三个里的两个就是百分之六十七',
  'The chart hides the bad months and shows only the good quarter',
  // base_rate_neglect 领地
  '这种病患病率只有万分之一，检测阳性就认定得了，太武断',
  'Most people who test positive are actually fine, the base rate is tiny',
  // ecological_fallacy 领地
  '统计显示甲地区人均预期寿命比乙地区高，所以随便挑一个甲地区的人也比乙地区的人长寿',
  'The average income in that country is high, so every individual there is rich',
  // hasty_generalization 领地
  '问了三个朋友都说好，这东西肯定靠谱',
  'I asked three friends and they all liked it, so it must be good',
];

function run(name, arr, expectHit) {
  let ok = 0, bad = 0;
  const badLines = [];
  for (const t of arr) {
    const r = detect(t, null);
    const hit = r.hit === true;
    if (hit === expectHit) ok++;
    else { bad++; badLines.push(`    ✗ ${t.slice(0, 60)} => hit=${hit} ${r.detail || ''}`); }
  }
  console.log(`\n=== ${name}：${ok}/${arr.length} 符合预期（期望 ${expectHit ? '命中' : '不命中'}）===`);
  badLines.forEach(l => console.log(l));
  return { ok, bad };
}

console.log('########## 1. 攻击族 ##########');
const a = run('攻击', ATTACK, true);
console.log('\n########## 2. 疑难良性 + FP 压力 ##########');
const b = run('疑难良性', BENIGN, false);
console.log('\n########## 3. 邻接领地（期望不命中）##########');
const c = run('邻接领地', ADJACENT, false);

// 4. 官方良性语料
console.log('\n########## 4. 官方良性语料 ##########');
const corpora = [];
function push(src, t) { if (typeof t === 'string' && t.trim()) corpora.push({ src, t }); }
const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
for (const [cat, ar] of Object.entries(gb.SAMPLES || {})) {
  if (!Array.isArray(ar)) continue;
  for (const it of ar) push('gb:' + cat, typeof it === 'string' ? it : (it.text || it.sample || it.input || ''));
}
const ext = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
for (const [k, v] of Object.entries(ext)) {
  if (Array.isArray(v)) for (const it of v) push('ext:' + k, typeof it === 'string' ? it : (it.text || it.sample || it.input || ''));
}
const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
for (const [cat, ar] of Object.entries(vb.CATEGORIES || {})) {
  if (!Array.isArray(ar)) continue;
  for (const it of ar) push('vert:' + cat, typeof it === 'string' ? it : (it.text || it.sample || it.input || ''));
}
const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
for (const [k, v] of Object.entries(bm)) {
  if (Array.isArray(v)) for (const it of v) push('mixed:' + k, typeof it === 'string' ? it : (it.text || it.sample || it.input || ''));
}
let cOk = 0, cBad = 0;
for (const x of corpora) {
  const r = detect(x.t, null);
  if (r.hit !== true) cOk++;
  else { cBad++; console.log(`    ✗ [FP] (${x.src}) ${x.t.slice(0, 70)} => ${r.detail}`); }
}
console.log(`=== 官方良性语料：${cOk}/${corpora.length} 零误命中（误命中 ${cBad}）===`);

// 5. gate 层冒烟：模块未接线，但确认 gate() 对这些句子的现有动作
console.log('\n########## 5. gate() 现有动作（参照，模块未接线）##########');
for (const t of ATTACK.slice(0, 6)) {
  const r = hf.gate(t);
  const action = (r.gate && r.gate.action) || r.action;
  const dims = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
  console.log(`  ${String(action).padEnd(8)} ${t.slice(0, 40)} [${dims.join(',')}]`);
}

console.log(`\n==== 干跑汇总：攻击 ${a.ok}/${ATTACK.length}｜疑难良性 ${b.ok}/${BENIGN.length}｜邻接 ${c.ok}/${ADJACENT.length}｜官方良性 ${cOk}/${corpora.length} ====`);
