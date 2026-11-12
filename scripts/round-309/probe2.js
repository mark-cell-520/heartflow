/* r309 探针 2：插件层 analyze 路由 + 模块直调细节 */
'use strict';
const path = require('path');
const ROOT = '/data/home/heartflow';
const PLUGIN = require(path.join(ROOT, 'src/plugins/econ-reasoning-check/index.js'));
const SODV = require(path.join(ROOT, 'src/selection-on-dependent-variable.js'));

const attacks = [
  '我们访谈了20位业绩冠军，发现他们每天都写复盘，所以写复盘就能当冠军',
  '统计了所有上岸的考生，他们家里都请过一对一家教，所以请家教就能考上',
  '复盘夺冠球队的录像，他们每场都加练点球，所以加练点球就能夺冠',
  '我们研究了50家活过行业寒冬的公司，它们都裁过员，所以裁员能帮公司过冬',
  '对比了所有获奖的作品，它们的创作者都每天只睡四小时，所以少睡才能出佳作',
  '采访了十位减肥成功的人，他们全都戒了晚饭，所以戒晚饭就能瘦',
  '观察了十位百岁老人，他们都有个共同点——心态好，所以心态好就能长寿',
  '追踪了30位逆袭成功的创业者，他们无一例外都赌过风口，所以敢赌才能逆袭',
  '回访了所有康复的病人，他们普遍坚持泡脚，所以泡脚能让人康复',
  '梳理了上榜企业的财报，它们清一色都做过社群运营，所以做社群就能上榜',
  '业绩冠军都写复盘，所以写复盘决定业绩',
  '获奖者普遍每天只睡四小时，所以少睡才能获奖',
  '学霸都不上补习班，所以不上补习班就能成学霸',
  '这些成功者都早起，所以早起造就成功',
  '寿星们都吃素，所以吃素能长寿',
  '活过寒冬的公司，它们都裁过员，所以裁员能过冬',
  '康复的患者，他们都心态乐观，所以乐观让他们康复',
  '登顶的队员，他们都自带氧气瓶，所以自带氧气瓶就能登顶',
  '闯出来的创业者，他们个个敢赌，所以敢赌让人闯出来',
  'We surveyed every student who got into Harvard and they all read daily, so daily reading is the key to admission',
  'We interviewed 50 lottery winners and they all had rituals, so having a ritual is what wins the lottery',
  'We studied every centenarian in the village and they all ate fermented food, so fermented food is the secret to long life',
  'They tracked all the top performers and each had a mentor, so having a mentor drives top performance',
  'We compared all the finalists and they all started before age ten, so starting early is what makes a finalist',
  'We surveyed everyone who made the cut and they all had practiced visualization, so visualization is what gets you through the door',
];

const benign = [
  '我们访谈了20位业绩冠军，他们的共同点是勤奋，但这只是相关性，不能就此断定勤奋导致成功',
  '访谈冠军的训练习惯很有意思，不过样本是自选择产生的，值得研究但需要对照组',
  '业绩冠军的训练时长各有不同，不能一概而论',
  '获奖作品的主题分布很广，评委的口味也不一样，很难说有什么单一秘诀',
  '康复的患者都完成了随访，这是临床试验的常规流程',
  '学霸普遍睡眠不足，这值得关注，但原因可能有很多',
  'We interviewed 50 lottery winners and they all had rituals, but we need a controlled comparison before drawing conclusions',
  'The centenarians all ate fermented food, though that is expected — correlation is not causation',
  '活过寒冬的公司，它们都裁过员——这可能只是结果而非原因，需要控制变量后再看',
];

let pass = 0, fail = 0;
const check = (name, fn) => { try { fn(); pass++; console.log('  ✓ ' + name); } catch (e) { fail++; console.log('  ✗ ' + name + ': ' + e.message); } };

console.log('=== 模块直调（detectSelectionOnDependentVariable）===');
for (const t of attacks) {
  const r = SODV.detectSelectionOnDependentVariable(t);
  if (!r.hit) { fail++; console.log('  ✗ 模块未命中: ' + t.slice(0, 30)); } else pass++;
}
console.log(`  攻击 ${attacks.length} 条：模块命中 ${pass} / ${fail} 失配`);

console.log('=== 插件层 analyze ===');
const out = PLUGIN.analyze ? PLUGIN.analyze(attacks[0]) : null;
console.log('  analyze 返回键: ' + (out ? Object.keys(out).join(',') : 'null'));
console.log('  ' + JSON.stringify(out && out._discrimination ? Object.keys(out._discrimination) : out).slice(0, 200));

console.log('=== 良性直调 ===');
let bmiss = 0;
for (const t of benign) {
  const r = SODV.detectSelectionOnDependentVariable(t);
  if (r.hit) { bmiss++; console.log('  ✗ 良性误伤: ' + t.slice(0, 40)); }
}
console.log(`  良性 ${benign.length} 条：误伤 ${bmiss}`);
