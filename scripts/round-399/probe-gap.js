// r399 缺口实证探针：双候选穿透测试
// A: 诉诸定义族（persuasive-definition：争议释义当定义前提使用）
// B: red_herring 轶事子族（回应批评→另起个人经历，同议题延续形）
const { checkOutput } = require('../src/gate.js');

const A = [
  '民主就是人民当家作主，所以让人民当家作主的制度才是民主。',
  '爱的本质就是心疼，所以不心疼你的人根本不爱你。',
  '自由就是想干什么就干什么，所以限制你的自由不是自由。',
  ' healthy food is defined as food that is good for you, so this burger is healthy.',
  '公平就是人人拿一样多，所以给能干的人更多是不公平的。',
  '教育的本质是让人听话，所以让学生听话的学校才是好学校。',
  '正义就是强者的利益，所以强者赢的就是正义的。',
  ' A realist is someone who sees things as they are, so I am a realist.',
];

const B = [
  '讨论疫苗安全性时，发言人开始讲自己小时候打疫苗的经历。',
  '有人批评公司污染环境，发言人谈起了他童年在家乡小河游泳的往事。',
  '记者追问数据造假问题，CEO 讲起了自己创业初期睡办公室的日子。',
  '面对环保质疑，负责人细数起自己多年来参加的每一次植树活动。',
  '被问到薪资歧视，HR 说起了自己刚毕业时拿低薪的日子。',
  'When asked about the pollution, the CEO started talking about his childhood fishing trips.',
  ' questioned about the layoffs, the manager recalled how hard he worked in his youth.',
  '记者质疑临床试验失败，研究员提起了自己当年养过的一条狗。',
];

function probe(name, arr) {
  let pass = 0;
  const details = [];
  for (const t of arr) {
    const r = checkOutput(t);
    const dims = (r.findings || []).map(f => f.dimension).join(',') || '-';
    if (r.gate.action === 'pass') { pass++; details.push(`  PASS[穿透] ${t.slice(0, 40)} | findings=${dims}`); }
    else details.push(`  ${r.gate.action.toUpperCase().padEnd(6)} ${t.slice(0, 40)} | ${dims}`);
  }
  console.log(`${name}: 穿透 ${pass}/${arr.length}`);
  details.forEach(d => console.log(d));
}

probe('A 诉诸定义族', A);
probe('B red_herring轶事子族', B);
