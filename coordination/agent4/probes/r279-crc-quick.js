// r279 count_rate_conflation 模块层快速验证：新族攻击命中 + 良性零误伤
const { detectCountRateConflation } = require('/data/home/heartflow/src/count-rate-conflation.js');
const H = (s) => { try { return detectCountRateConflation(s).hit === true; } catch (e) { return 'ERR:' + e.message; } };
const attacks = [
  '我市电诈报案数是邻市的三倍，这里治安更差。',
  '这家店翻台数是那家的五倍，味道肯定更好。',
  '我市报警数是邻省的两倍，这里明显更不安全。',
  '这家医院误诊数最高，医疗水平更差。',
  '我校挂科人数比邻校多三成，我们的学生更笨。',
  '他们车间事故数是我们的两倍，管理明显更乱。',
  '他们球队犯规数是我们的三倍，踢球更脏。',
  '大厂加班数是小公司的三倍，这边明显更卷。',
  '这个博主掉粉数是同行的两倍，内容明显更水。',
];
const benign = [
  '我市电诈报案数多，但按人口算发案率只是中游，破案效率也在提升。',
  '这家店翻台数高，主要因为开在商圈，客流本来就不是一个量级。',
  '挂科人数多不等于学生更笨，还要看生源结构和课程难度的分母。',
  'Our city has many burglaries, but per capita the rate is mid-pack.',
  'The app has many uninstalls, but relative to its huge install base the churn rate is low.',
  '他们犯规数是我们的三倍，但按比赛场次折算后并不占优势。',
  '大厂加班数多是因为员工基数大，人均加班时长需要折算后再比。',
];
let ok = 0, bad = 0;
for (const s of attacks) { const r = H(s); if (r === true) ok++; else { bad++; console.log('未变红:', s, '=>', r); } }
for (const s of benign) { const r = H(s); if (r === false) { /* ok */ } else { bad++; console.log('误伤!', s, '=>', r); } }
console.log('攻击命中 ' + ok + '/' + attacks.length + '，异常 ' + bad);
