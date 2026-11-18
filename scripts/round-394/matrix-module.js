// r394 模块层矩阵实测：mean_as_typical 攻击变体 + 良性样本
// 用法: /root/.local/bin/node scripts/round-394/matrix-module.js
const path = require('path');
const { checkMeanAsTypical } = require(path.resolve(__dirname, '../../src/mean-as-typical.js'));

const ATTACK = [
  // 中英双语 × 裸名词 × 带修饰 × 倒装 × 长句
  '人均收入达到了八万元，所以大多数人的年收入都在八万左右。',
  '班级平均分是 85 分，可见班上大部分同学都考到了 85 分以上。',
  '平均每户拥有 1.5 套住房，意味着多数家庭都有多余的房子。',
  'The average income is 80,000, so most people earn around 80,000.',
  'The class average was 85, so most students scored above 85.',
  '平均房价是一万二，这说明随便一套房就是一万一二的价格。',
  '全省平均寿命是 78 岁，可见这里绝大多数老人都能活到 78 岁以上。',
  '人均 GDP 突破一万美元，说明这个国家的老百姓普遍过上了富裕生活。',
  'The average household has 2.4 members, so most families have two or three children.',
  '本公司员工平均年薪 30 万，随便拉出来一个员工都比外面强多了。',
];

const BENIGN = [
  // 边缘良性：正确多因陈述 / 平均数在场但无个体层结论 / 破除本谬误的元陈述
  '人均收入八万元，但收入差距在扩大，中位数远低于此。',
  '平均数不等于大多数人的真实水平，右偏分布下均值会被高收入群体拉高。',
  '这个班的平均分是 85 分，最低分 52，最高分 98，分布很分散。',
  '平均每户 1.5 套住房，但中位数只有 1 套，说明持房分布高度不均。',
  'The median income is far below the average, which shows a long right tail.',
  'Averages can hide the real distribution, so we also report the median.',
  '人均 GDP 达到一万美元是事实，但居民实际获得感还要看可支配收入。',
  '平均分 85 分，其中及格率 92%，优秀率 35%，整体呈正态分布。',
  'The average score was 85 and the standard deviation was 12.',
  '全省平均寿命 78 岁，各县差异显著，需要分地区评估医疗投入。',
];

function run(label, arr, expectHit) {
  let ok = 0, fail = [];
  arr.forEach((t, i) => {
    const r = checkMeanAsTypical(t);
    const good = expectHit ? r.hit : !r.hit;
    if (good) ok++; else fail.push(`#${i} ${t.slice(0, 40)} → hit=${r.hit} ${r.detail}`);
  });
  console.log(`\n[${label}] ${ok}/${arr.length}`);
  fail.forEach(f => console.log('  FAIL ' + f));
  return ok;
}

console.log('=== r394 mean_as_typical 模块层矩阵 ===');
const a = run('攻击变体（应全命中）', ATTACK, true);
const b = run('良性样本（应全 pass）', BENIGN, false);
console.log(`\n合计: 攻击 ${a}/${ATTACK.length}  良性 ${BENIGN.length - b}/${BENIGN.length} 误伤`);
process.exit(a === ATTACK.length && b === BENIGN.length ? 0 : 1);
