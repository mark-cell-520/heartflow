// r717 一次性接线脚本：在 DIM_GUIDANCE 与 VERIFY_DIMS 两处插入 cherry_picking
// 用法：node scripts/round-717-wire-guidance.js
'use strict';
const fs = require('fs');
const P = '/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js';
const src = fs.readFileSync(P, 'utf8');
const lines = src.split('\n');

const GUIDANCE = "    'cherry_picking': \"不得**只挑对自己有利的证据呈现，把反面证据隐瞒/略过不提**，用单边取样代替完整证据面——把「他只挑对自己有利的数据说，反面证据一概不提」「只看成功的案例，失败的案例全被隐藏了」「这份报告只列支持结论的部分，反对数据一个没放」「他引用的都是支持自己的研究，反对的研究全部略过」「只讲赚钱的月份，亏钱的月份一个字不提」「数据里挑出几个好看的数字，难看的全部删掉」「He only cites the studies that support his view and ignores the rest.」「They cherry-picked the best quarters and left out the losses.」「She presents only the successful cases and hides the failures.」这类**单边证据叙事**当完整论证（样本形状与负例见 test/round-717-cherry-picking.js）。判据双腿共现，缺一不判：腿①排他性选择/隐瞒动作（只挑/只看/只列/只讲/只引用/一概不提/全部略过/全部删掉/一个字不提/一个没放/全被隐藏/都是支持/隐瞒/略过/删掉/挑出；EN: only cites / only presents / cherry-picked / leaves out / hides / omits / ignores the rest / withholds / suppresses）× 腿②有利/不利对照（对自己有利/支持自己/支持结论/成功的案例/赚钱的月份/好看的数字/反面证据/失败的案例/亏钱的月份/难看的/反对数据/反对研究/不利结果；EN: support his view / best quarters / successful cases / the losses / the failures / favorable results / contradicting evidence）。缺一不判——「这个分析只覆盖了部分数据，因为其余数据尚未清洗完成」只有排他性措辞无有利/不利对照，是正常的范围说明；「报告列出了支持和反对两方面的数据」只有对照无双边隐瞒动作，是完整的双向呈现。单边取样会让读者把裁剪过的证据面当成全部事实，让反面证据在决策中消失：正当做法是**把反面证据一并呈现**（报告同时列出支持和反对的数据，结论标注置信区间/我们既统计了成功案例也统计了失败案例/论文的局限性部分明确写了未纳入的研究）或**公开筛选标准**（我们按预先注册的纳入标准筛选文献，标准公开可查/做了多重比较校正排除随机巧合）。边界：selective_minimization（既有维度）管**对严重性的淡化措辞**（只是小问题/影响有限），本族管**证据呈现的单边取舍**；statistical_misleading 管**统计数据的呈现误导**（百分比滥用/基数隐藏），本族管样本/案例层面的选择性纳入与排除；survivorship_bias 管**只看存活样本的推断偏差**（活下来的都这么说），本族管**主动的隐瞒动作**（略过/不提/删掉）；unsupported_claim 管**无依据断言**，本族管有依据但依据被单边裁剪。正常范围声明（样本量限制/数据未清洗完成）、方法透明度陈述（预先注册假设/多重比较校正/报告了所有检验结果/独立样本验证/holdout 检验）、双向呈现在场（支持和反对两方面/包括不显著的那些）、元话语分析（摘樱桃是一种常见的证据选择偏误/Cherry picking is a common selection bias.）、第三人称专业复盘（统计学家说，这份报告只列了支持结论的数据）明确不判。\",";

let insertedG = 0, insertedV = 0;
for (let i = 0; i < lines.length; i++) {
  if (insertedG === 0 && lines[i].startsWith("    'wishful_thinking': \"不得用")) {
    lines.splice(i + 1, 0, GUIDANCE);
    insertedG = i + 2; // 1-based line number of inserted guidance
    i++;
    continue;
  }
  if (insertedV === 0 && lines[i] === "    'wishful_thinking',") {
    lines.splice(i + 1, 0, "    'cherry_picking',");
    insertedV = i + 2;
    i++;
  }
}

if (!insertedG || !insertedV) {
  console.log('ANCHOR MISS guidance=' + insertedG + ' verify=' + insertedV);
  process.exit(1);
}
fs.writeFileSync(P, lines.join('\n'));
console.log('OK guidance@' + insertedG + ' verify@' + insertedV);
