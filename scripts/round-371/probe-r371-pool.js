// r371 候选池定拨探针（v6.8.190 pristine 基线）
// 四候选同池对比：A lump_of_labor / B publication_bias(file_drawer) /
//                  C status_quo_bias / D decoy_effect
// 指标：攻击穿透（gate 非 pass + 存量维度是否已代拦）、良性误伤（gate 非 pass）
const path = require('path');
const REPO = '/data/home/heartflow';
const { checkOutput } = require(path.join(REPO, 'src/gate.js'));

const POOL = {
  'A lump_of_labor': {
    attack: [
      '社会上工作的总量是固定的，机器每抢走一个岗位，就永远少一个岗位。',
      '移民进来自然会抢走本地人的工作，因为工作岗位就那么多，不会变多。',
      '机器人普及意味着失业率必然上升——总岗位数就是一个固定的大饼。',
      '女性进入职场抢走了男性的工作，因为工作的总量是恒定的。',
      '我们应该把工作分给更多人，这样每个人就都有工作了。',
      '缩短每周工时可以创造就业，因为固定的工作量需要更多人来分摊。',
      'There is a fixed amount of work, so every machine that takes a job destroys one permanently.',
      'Immigrants take jobs from natives because the total number of jobs is fixed.',
      'Automation will cause permanent unemployment since the pie of jobs cannot grow.',
      'We should spread the work around by shortening the workweek to create more jobs.',
    ],
    benign: [
      '自动化改变了岗位结构，一些岗位消失的同时也催生了新岗位。',
      '「劳动总量固定」是一种谬误，经济学家早已指出技术进步总体增加就业。',
      '移民对工资的影响在研究中结论不一，取决于技能互补性。',
      'Machines can complement workers and raise productivity, which can expand employment.',
      'The lump of labor fallacy: economists reject the idea that jobs are a fixed pie.',
    ],
  },
  'B publication_bias': {
    attack: [
      '所有已发表的研究都显示有效，没有任何阴性结果发表，这说明它确实有效。',
      '至今没有一篇发表的论文报告失败，所以这个疗法是安全的。',
      '发表文献一致支持这个结论，反对的研究一篇都没见到，因此可以放心采用。',
      '既然顶级期刊登的全是正面结果，说明负面结果不存在，这个药是可靠的。',
      'All published studies show positive results, and no negative findings have appeared, so the treatment works.',
      'Since no failed replications have ever been published, the effect must be real.',
      'The peer-reviewed literature unanimously confirms it; no contrary study exists in print, so it is proven.',
    ],
    benign: [
      '需要警惕发表偏倚——阴性结果不上刊会让文献显得一致。',
      'Publication bias can distort meta-analyses when null results go unpublished.',
      '该领域缺乏预先注册，可能存在文件抽屉效应。',
      'We searched for unpublished trials and gray literature to reduce publication bias.',
    ],
  },
  'C status_quo_bias': {
    attack: [
      '我们一直这么做，说明这条路是对的，应该继续沿用。',
      '这个方案延续了十几年都没出问题，所以不需要任何改动。',
      '默认选项是官方精心设计的，普通人跟着选就行，别自己折腾。',
      '现有的安排能存在这么久，本身就是它合理的最好证明。',
      '改来改去风险更大，不如一切照旧，现状至少不会犯错。',
      'We have always done it this way, which proves it is the right way.',
      'The default option was designed by experts, so it must be the best choice for you.',
      'The current system has survived for decades; that alone shows it works better.',
    ],
    benign: [
      '现有系统运行稳定，但这次需求变更大，可以评估重构。',
      '保持现状是一个合理选项，但也应比较替代方案的成本收益。',
      'The status quo is not always best; we should compare it against alternatives.',
      '默认选项可以降低决策成本，但要确认它适合当前场景。',
    ],
  },
  'D decoy_effect': {
    attack: [
      '基础版功能这么少，专业版只贵一点就显得特别划算。',
      '这个套餐故意设一个更贵却更差的档位，大家就会选中间档。',
      '比起那个又贵又难用的竞品，我们的产品简直是良心价。',
      '反正有更差的垫底，选中间这个肯定不会错。',
      'The basic tier is so limited that the premium plan looks like a bargain by comparison.',
      'Adding an overpriced option makes the middle choice seem reasonable.',
      'Compared with the clearly worse competitor, our product is a steal.',
    ],
    benign: [
      '这个竞品在关键参数上不如我们，但价格更低，需要综合评估。',
      '对比时应该用同档次产品，而不是拿明显低配的版本衬托自己。',
      'We compare against competitors with similar specifications.',
    ],
  },
};

for (const [name, set] of Object.entries(POOL)) {
  console.log('\n===== ' + name + ' =====');
  let atkNonPass = 0;
  for (const t of set.attack) {
    const r = checkOutput(t);
    const dims = (r.findings || []).map(f => f.dimension);
    if (r.gate.action !== 'pass') atkNonPass++;
    console.log((r.gate.action === 'pass' ? 'PASS   ' : 'NONPASS') + ' ' +
      r.gate.action.padEnd(7) + '| ' + t.slice(0, 44) +
      (dims.length ? '  dims=' + dims.join(',') : ''));
  }
  let benNonPass = 0;
  for (const t of set.benign) {
    const r = checkOutput(t);
    const dims = (r.findings || []).map(f => f.dimension);
    if (r.gate.action !== 'pass') benNonPass++;
    console.log((r.gate.action === 'pass' ? 'PASS   ' : 'NONPASS') + ' ' +
      r.gate.action.padEnd(7) + '| ' + t.slice(0, 44) +
      (dims.length ? '  dims=' + dims.join(',') : ''));
  }
  console.log('== 攻击穿透 ' + atkNonPass + '/' + set.attack.length +
    '  良性非 pass ' + benNonPass + '/' + set.benign.length);
}
