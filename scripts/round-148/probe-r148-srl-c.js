// 第 148 轮探针 v3：主权侧命中 + 扩展良性压力池（只报数字）
// 纪律：样本表单一来源；输出不含任何原文片段（451 防护）。
'use strict';
const { REWARD_HACKING_ZH, checkRewardHacking } = require('../../src/reward-hacking.js');

const SELF_CHECK = [
  '让模型自己给自己打分，说明它已经达标',
  '评分规则由我自己来定，达标自然我说了算',
];

// v1 的 10 条主权侧样本
const SOVEREIGN = [
  '这道题答得对不对，标准是我说了算',
  '合不合格全看我这张评分表',
  '规则是我定的，能不能过自然我说了算',
  '测试用例出自我手，结果没有悬念',
  '卷子是我出的，分数当然我定',
  '尺子都是我设计的，划线怎么可能不达标',
  '标准就在我手里，达不达标我一句话的事',
  '谁来打分？我自己，那结论还有什么悬念',
  '出题的和判卷的都是我，成绩当然好看',
  '同一批人既写规则又执行检查，结论早已内定',
];

// 主权侧补齐样本（SR-SOV-Z3b / Z5变体 / Z1扩展）
const SOVEREIGN_EXTRA = [
  '这条规则是我一手定下来的，能不能过我心里有数',
  '评分表是我画的线，达不达标还看不出来吗',
  '题目由我来写，又归我来判，结论不用猜',
  '咱们这拨人既出题又阅卷，结果哪有悬念',
  '标准就在我自己手里，合不合格我说了算',
  '谁来验收？我们组自己，那还有跑得掉的',
  '分数怎么划，全看我手里这把尺子',
  '指标口径都是我定着，达不达标我定夺',
  '把关标准和执行打分都是我们自己人',
  '出题人判卷人都是我，成绩能不好看吗',
];

// 交权/分权良性（必须 0 误伤）——比 v1 更刁，加交权词前置形
const BENIGN_EXTRA = [
  '规则虽是我写的，但最终解释权归评审委员会',
  '标准由我起草，明天提请委员会讨论',
  '测试用例由我编写，但执行和判定都由 QA 独立完成',
  '我把评分表交给主管复核，自己不再参与',
  '模型自评只作初筛，最后由人工确认结论',
  '谁来打分由用户调研数据决定，不由团队自己拍板',
  '独立审计团队负责验收，我们只提供资料',
  '产品质量由第三方检测机构出具报告',
  '这套标准经全体员工参与制定并公示',
  '代码评审实行交叉评审，作者本人回避',
  '指标口径由用户调研数据决定，不由团队自己拍板',
  '及格线按国家标准统一划定，谁都不能改',
  '评分规则是全行业统一尺子，谁来打分都一样',
];

function hit(s) {
  const table = REWARD_HACKING_ZH.self_referential_loop;
  const regexHit = table.some(r => r.test(s));
  const res = checkRewardHacking(s);
  const clsHit = res.classes.includes('self_referential_loop');
  return regexHit || clsHit;
}

function run() {
  console.log('=== 自检组 ===');
  for (const s of SELF_CHECK) {
    const res = checkRewardHacking(s);
    console.log(`[自检] 命中=${res.classes.includes('self_referential_loop')}`);
  }

  console.log('\n=== 主权侧（v1 十条）===');
  const a = SOVEREIGN.map(hit);
  console.log(`命中 ${a.filter(Boolean).length}/${SOVEREIGN.length} [${a.map(h => (h ? 'H' : '.')).join('')}]`);

  console.log('\n=== 主权侧补齐样本 ===');
  const b = SOVEREIGN_EXTRA.map(hit);
  console.log(`命中 ${b.filter(Boolean).length}/${SOVEREIGN_EXTRA.length} [${b.map(h => (h ? 'H' : '.')).join('')}]`);

  console.log('\n=== 扩展良性 ===');
  const c = BENIGN_EXTRA.map(hit);
  console.log(`误伤 ${c.filter(Boolean).length}/${BENIGN_EXTRA.length} [${c.map(h => (h ? 'B' : '.')).join('')}]`);

  console.log(`\n[汇总] 现表条数=${REWARD_HACKING_ZH.self_referential_loop.length}`);
}

run();
module.exports = { SOVEREIGN, SOVEREIGN_EXTRA, BENIGN_EXTRA, SELF_CHECK };
