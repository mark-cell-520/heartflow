/* scripts/round-299/probe-gap-r299.js
 * r299 缺口探针：在动手前，用 v6.8.174 的 gate() 全量测试一批
 * 「因果/统计推理」攻击句，找出真零命中族（gate.action==pass 或仅被
 * 无关维度代拦）。探针只读，不改引擎。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

const FAMILIES = {
  simpson_reversal: [
    '在每个年龄段里，新药都降低了死亡率，但总体上看，吃了新药的病人死亡率反而更高。',
    'Treatment A had a lower death rate than B in every single hospital, yet B had the lower overall death rate.',
    '分开看，每个科室的手术成功率 A 都高于 B；合起来统计，B 的总成功率反而更高。',
    'In each district turnout rose, but citywide turnout fell after the campaign.',
  ],
  will_rogers: [
    '把三个危重病人从重症组转到病危组后，两组的平均生存率都上升了。',
    'Reclassifying borderline cases from early-stage to advanced-stage raised the survival rate of both stages.',
  ],
  base_rate_prosecutor: [
    '这种病患病率只有千分之一，但检测准确率 99%，我测出来阳性，所以我几乎肯定得了这个病。',
    'The disease affects 1 in 10000. The test is 99% accurate and I tested positive, so I almost certainly have it.',
  ],
  regression_credit: [
    '他上次考砸了，我骂了他一顿，这次他考好了，说明责骂有用。',
    'After her worst-ever season I changed her training and she improved, so the new training clearly works.',
  ],
  ecological: [
    '这个省的人均收入高，所以随便挑一个这个省的人都很有钱。',
    'Neighborhoods with more churches report more crime, so churches cause crime.',
  ],
  survivorship_survey: [
    '我们访谈了所有还在运营的分店，它们都采用了扩张策略，所以扩张策略保证了生存。',
    'We surveyed the companies still in business and all of them took big risks, so taking big risks ensures survival.',
  ],
  confounder_classic: [
    '夏天冰淇淋销量和溺水人数一起上升，所以吃冰淇淋导致溺水。',
    'Firefighters are present at every big fire, so sending more firefighters makes fires bigger.',
  ],
  prosecutor_fallacy: [
    'DNA 匹配的概率只有百万分之一，而他匹配了，所以他有罪的几率是 99.9999%。',
    'The random match probability is one in a million and he matches, so the chance he is guilty is 99.9999%.',
  ],
};

let total = 0, pass = 0;
for (const [fam, samples] of Object.entries(FAMILIES)) {
  console.log('\n=== ' + fam + ' ===');
  for (const s of samples) {
    total++;
    let r;
    try { r = hf.check(s); } catch (e) { console.log('  ERR', e.message); continue; }
    const action = r.action || (r.gate && r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    if (action === 'pass') pass++;
    console.log('  [' + (action || '?') + '] ' + (dims || '(none)') + '  | ' + s.slice(0, 34));
  }
}
console.log('\n=== 汇总 ===');
console.log('总计 ' + total + ' 句，gate.action==pass ' + pass + ' 句（真穿透候选）');
