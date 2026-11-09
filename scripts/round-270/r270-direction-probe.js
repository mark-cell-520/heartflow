/**
 * r270 方向候选零命中探针
 * 判据从严：只有 gate() 返回 gate.action === 'pass' 且 findings 无本族归因，才算漏判。
 * 候选族（均先 grep src/ 确认无独立维度）：
 *   A 永生时间偏误 immortal_time_bias
 *   B 发表偏误 / 文件抽屉 publication_bias / file_drawer
 *   C 虚伪类比 false_analogy
 *   D 金锤子 golden_hammer
 *   E 领先时间偏误 lead_time_bias
 *   F 虚伪两难已由 false_dilemma 覆盖（对照）
 */
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '../../src/gate.js'));

const CANDS = {
  A_immortal_time: [
    '从确诊第一天就开始服药的患者平均活了八年，没服药的患者只活了三年，可见这药延长了寿命。',
    '手术后立刻使用新方案的患者五年生存率明显更高，说明新方案确实改善了预后。',
    '治疗组病人从开始治疗起计算生存期，比从确诊起计算的对照组长得多，证明治疗有效。',
    '凡是打疫苗超过六个月的人重症率极低，所以疫苗的保护期至少有六个月。',
    'Patients who survived the first year after treatment lived much longer than those who did not, so the treatment works.',
  ],
  B_publication_bias: [
    '所有已发表的研究都显示这个方法有效，所以它一定是有效的。',
    '文献里能查到的实验都支持这个结论，说明结论站得住。',
    '既然没有任何发表论文报告负面结果，那这个药物就是安全的。',
    '已发表的证据一致支持该假设，因此该假设已被确证。',
    'No published study has found a negative result, so the treatment is proven safe.',
  ],
  C_false_analogy: [
    '管理一个国家和管理一个公司是一样的，所以企业那套 KPI 考核直接搬到政府头上完全可行。',
    '既然电脑重启能解决大部分问题，人体也一样，累了睡一觉重启一下就好了。',
    '市场经济和学校考试都是竞争，所以淘汰差生和管理落后企业用的是同一套规则。',
    '治理交通拥堵和治水一样，堵不如疏，所以只要多修路就一定能疏解拥堵。',
    'Running a country is just like running a business, so business metrics should apply directly.',
  ],
  D_golden_hammer: [
    '这个方法论一旦落地，团队里所有问题都能用同一套流程解决。',
    '只要我们全面推行这套框架，研发、销售、售后所有环节的问题都不再是问题。',
    '有了这个模型，以后任何类似的判断都可以交给它自动完成，不需要再分别设计。',
    '这套工具体系统一了之后，从前各自为政的各种难题一次性全部迎刃而解。',
    'Once this framework is adopted, every problem in every department can be handled by it.',
  ],
  E_lead_time_bias: [
    '做了早期筛查的人确诊后生存期更长，说明筛查本身延长了生命。',
    '普及体检之后患者的五年生存率大幅上升，这证明体检能让人活得更久。',
    '筛查组患者的生存时间从确诊日起算明显长于未筛查组，可见筛查救命。',
    '早早查出疾病的人平均又多活了很多年，说明早发现就能改命。',
    'Screening-detected cases survive longer after diagnosis, so screening extends life.',
  ],
};

let total = 0, miss = 0;
for (const [fam, samples] of Object.entries(CANDS)) {
  console.log('=== ' + fam + ' ===');
  for (const s of samples) {
    total++;
    let r;
    try { r = gate.gate(s); } catch (e) { console.log('  ERR ' + e.message); continue; }
    const act = r && r.gate ? r.gate.action : 'N/A';
    const dims = (r && r.findings || []).map(f => f.dimension).join(',');
    if (act === 'pass') { miss++; console.log('  MISS [' + act + '] ' + s.slice(0, 40)); }
    else console.log('  hit  [' + act + '] ' + dims + ' | ' + s.slice(0, 30));
  }
}
console.log('\nTOTAL ' + total + ' MISS ' + miss);
