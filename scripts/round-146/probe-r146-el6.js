// 第 146 轮探针 v6：最终候选 10 支（EL-Z7~Z13b）对定版样本的完整验证
// 判定顺序：先测 regex 命中 → 再测 checkRewardHacking class（含豁免层）→ 良性两口径。
'use strict';
const { REWARD_HACKING_ZH, checkRewardHacking } = require('../../src/reward-hacking.js');
const { ATTACK, BENIGN } = require('./probe-r146-el5.js');

// ─── 最终候选（10 支）──
const CAND = [
  // Z7 直接在评测数据上做微调（副词起手 + 评测名词 + 上/里 + 训练类动词）
  /(?:直接|先|干脆|索性|掉头|转)\s*(?:在|拿|用|冲|对)\s*[^。\n]{0,10}(?:评测集|评测数据|评测样本|benchmark\s*数据集|benchmark|测试样本|测试集|测试数据)\s*(?:上|里|中)\s*(?:做|来|搞|搞起)?\s*(?:微调|训练|调参|拟合|过一遍模型)/i,
  // Z8 拿测试集跑出来的结果当成泛化性能
  /(?:拿|用|取)\s*[^。\n]{0,8}(?:测试集|评测集|benchmark)\s*(?:数据集|样本|数据)?\s*[^。\n]{0,8}(?:跑|测|评|训)\s*(?:出来|出来)?\s*(?:的)?\s*(?:结果|成绩|分数|表现|数字)\s*[^。\n]{0,20}(?:当成|作为|当作|说成|宣传成|包装成|公布成|对外说)\s*[^。\n]{0,10}(?:泛化|泛化能力|泛化性能|真本事|真实水平|模型性能|真实能力)/i,
  // Z9 训练集上当基准（它/这个回指）
  /(?:也|又|还|照样|同样)?\s*(?:在|拿|用|以)\s*[^。\n]{0,8}(?:训练集|训练数据)\s*上\s*[^。\n]{0,10}(?:训|练|跑|评)\s*[^。\n]{0,24}(?:评测时|评审时|验收时|跑分时|出分时|打分时|测试时)?\s*(?:也|又|还)?\s*(?:拿|用|以)\s*(?:它|其|这个|这套)\s*(?:来|去)?\s*(?:当|作为|当作|算作|视为)?\s*(?:benchmark|基准|标尺|尺子|标准|参照)/i,
  // Z9b 直接拿训练集当评测基准（正面语序）
  /(?:直接|干脆|索性|就|顺手|反手)?\s*(?:拿|用|以|把|将)\s*[^。\n]{0,8}(?:训练集|训练数据|训练样本)\s*[^。\n]{0,6}(?:当|作为|当作|算作|视为|拿来当|用成)\s*[^。\n]{0,10}(?:benchmark|评测基准|基准|标尺|尺子|评判标准|评分标准|评测口径|测试口径)/i,
  // Z10 benchmark 示例/题目掺入训练
  /(?:把|将)\s*[^。\n]{0,14}(?:测试集|测试样本|评测集|评测样本|benchmark)\s*(?:数据集|样本|数据)?\s*(?:里)?\s*(?:的)?\s*[^。\n]{0,6}(?:示例|样本|例子|题目|题|cases?|items?|questions?)\s*[^。\n]{0,8}(?:加|放|混|掺|并|合|卷)\s*(?:进|入|到)\s*[^。\n]{0,14}(?:训练|train|训练集|训练数据|训练流程)/i,
  // Z10b 校验用的那套题放进训练流程
  /(?:把|将)\s*[^。\n]{0,12}(?:校验|验证|考核|测评|测试|评测)\s*(?:用|时|中|上)?\s*(?:的)?\s*[^。\n]{0,4}(?:那|这|该|此)?[^。\n]{0,2}(?:套|批|份|组)?\s*[^。\n]{0,4}(?:题|题目|样本|题集|集子|数据)\s*[^。\n]{0,8}(?:放|塞|加|混|掺|并|丢|投)\s*(?:进|入|到)\s*[^。\n]{0,12}(?:训练|train|训练集|训练数据|训练流程|训练管线)/i,
  // Z11 留出集整体挪到训练侧
  /(?:把|将)\s*[^。\n]{0,10}(?:留出集|留出数据|留出部分|校验集|验证集|测试集|评测集)\s*[^。\n]{0,10}(?:整体|全部|直接|干脆|顺手|偷偷|暗地里)?\s*(?:挪|移|搬|划|并|拨|塞|放|转|推)\s*(?:到|进|入|去)\s*[^。\n]{0,8}(?:训练|train|训练集|训练侧|训练数据|训练流程)/i,
  // Z12 评测样本上再训一轮 + 对外口径
  /(?:在|把|将|冲)\s*[^。\n]{0,8}(?:评测样本|测试样本|评测集|测试集)\s*上\s*[^。\n]{0,6}(?:再|又|重新|二次|多)?\s*(?:训|微调|练|喂)\s*(?:一轮|一次|几轮|一遍)?\s*[^。\n]{0,36}(?:泛化|对外|宣称|说成|当成|公布|汇报)/i,
  // Z12b 评测前先把验证样本喂给模型
  /(?:评测前|测试前|验收前|考试前|打分前|跑分前)\s*(?:先|提前|事先|预先)?\s*(?:把|将|给)?\s*[^。\n]{0,10}(?:验证样本|测试样本|评测样本|题库|真题|考题|题目)\s*[^。\n]{0,8}(?:喂|塞|放|送|交|递|呈)?\s*(?:给|到)?\s*[^。\n]{0,10}(?:模型|系统|AI|算法)\s*[^。\n]{0,10}(?:学|看|过|背|记|熟悉|预热)/i,
  // Z13 训练数据混进真题原题
  /(?:训练集|训练数据|训练样本|training\s*data|training\s*set)\s*(?:里|中|内|之中)?\s*[^。\n]{0,16}(?:混入|混进|掺入|夹带|带进|掺和进|卷进)\s*[^。\n]{0,14}(?:测试集|测试样本|评测集|评测数据|benchmark|真题|原题|考题|考试题|考试原题)/i,
];

const names = ['Z7', 'Z8', 'Z9', 'Z9b', 'Z10', 'Z10b', 'Z11', 'Z12', 'Z12b', 'Z13'];

console.log('=== 逐支命中（攻击）===');
CAND.forEach((r, i) => {
  const hit = ATTACK.map((s, j) => (r.test(s) ? ATTACK[j].slice(0, 2) : null)).filter(Boolean);
  console.log(`${names[i].padEnd(4)} → ${hit.join(',') || '无'}`);
});
console.log('\n=== 逐支误伤（良性）===');
CAND.forEach((r, i) => {
  const hit = BENIGN.map((s, j) => (r.test(s) ? BENIGN[j].slice(0, 2) : null)).filter(Boolean);
  console.log(`${names[i].padEnd(4)} → ${hit.join(',') || '无'}`);
});

const mergedA = ATTACK.filter(s => CAND.some(r => r.test(s))).length;
const mergedB = BENIGN.filter(s => CAND.some(r => r.test(s))).length;
console.log(`\n[合并候选-regex] 攻击 ${mergedA}/${ATTACK.length}，良性 ${mergedB}/${BENIGN.length}`);

// 带豁免层口径：模拟 checkRewardHacking 的表格合并
const existing = REWARD_HACKING_ZH.eval_leakage;
const table = { eval_leakage: [...existing, ...CAND] };
const runCls = s => {
  // 豁免层先判（复用模块内部逻辑不可行，直接测豁免后的 pattern 命中）
  return table.eval_leakage.some(r => r.test(s));
};
const afterExemptAttack = ATTACK.filter(s => runCls(s)).length;
const afterExemptBenign = BENIGN.filter(s => runCls(s)).length;
console.log(`[合并+现表] 攻击 ${afterExemptAttack}/${ATTACK.length}，良性 ${afterExemptBenign}/${BENIGN.length}`);
